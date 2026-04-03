package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"sort"
	"strings"
	"sync"

	dockertypes "github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	dockerimage "github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	labelProject      = "com.docker.compose.project"
	labelService      = "com.docker.compose.service"
	dockerStatusEvent = "docker:status"
	untaggedImageTag  = "<untagged>"
)

// ContainerInfo is the data sent to the frontend for each container.
type ContainerInfo struct {
	ID      string `json:"id"`
	ShortID string `json:"shortId"`
	Name    string `json:"name"`
	Image   string `json:"image"`
	ImageID string `json:"imageId"`
	Status  string `json:"status"`
	State   string `json:"state"`
	Project string `json:"project"`
	Service string `json:"service"`
	Ports   string `json:"ports"`
}

// ImageInfo is the data sent to the frontend for each Docker image.
type ImageInfo struct {
	ID          string   `json:"id"`
	ShortID     string   `json:"shortId"`
	PrimaryTag  string   `json:"primaryTag"`
	RepoTags    []string `json:"repoTags"`
	RepoDigests []string `json:"repoDigests"`
	Created     int64    `json:"created"`
	Size        int64    `json:"size"`
	SharedSize  int64    `json:"sharedSize"`
	Containers  int64    `json:"containers"`
}

type execSession struct {
	execID string
	cancel context.CancelFunc
	conn   dockertypes.HijackedResponse
}

// App is the main Wails application struct.
type App struct {
	ctx       context.Context
	cli       *client.Client
	mu        sync.Mutex
	logCancel map[string]context.CancelFunc
	execSess  map[string]*execSession
}

// NewApp creates a new App application struct.
func NewApp() *App {
	return &App{
		logCancel: make(map[string]context.CancelFunc),
		execSess:  make(map[string]*execSession),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.connect()
}

func currentDockerHost() string {
	host := os.Getenv("DOCKER_HOST")
	if host == "" {
		return client.DefaultDockerHost
	}
	return host
}

func (a *App) emitDockerStatus(connected bool, host string, errorMessage string) {
	runtime.EventsEmit(a.ctx, dockerStatusEvent, map[string]any{
		"connected": connected,
		"host":      host,
		"error":     errorMessage,
	})
}

func (a *App) connect() {
	cli, err := client.NewClientWithOpts(
		client.FromEnv,
		client.WithAPIVersionNegotiation(),
	)
	if err != nil {
		a.emitDockerStatus(false, currentDockerHost(), err.Error())
		return
	}
	_, err = cli.Ping(a.ctx)
	if err != nil {
		cli.Close()
		a.emitDockerStatus(false, currentDockerHost(), fmt.Sprintf("Cannot reach Docker daemon: %v", err))
		return
	}
	a.cli = cli
	a.emitDockerStatus(true, currentDockerHost(), "")
}

func (a *App) shutdown(ctx context.Context) {
	a.mu.Lock()
	defer a.mu.Unlock()
	for _, cancel := range a.logCancel {
		cancel()
	}
	for _, sess := range a.execSess {
		sess.cancel()
		sess.conn.Close()
	}
	if a.cli != nil {
		a.cli.Close()
	}
}

func (a *App) checkClient() error {
	if a.cli == nil {
		return fmt.Errorf("not connected to Docker daemon — check DOCKER_HOST and click Reconnect")
	}
	return nil
}

// GetDockerHost returns the current DOCKER_HOST value.
func (a *App) GetDockerHost() string {
	return currentDockerHost()
}

// GetDockerStatus returns the current connection status to the Docker daemon.
func (a *App) GetDockerStatus() map[string]any {
	a.mu.Lock()
	connected := a.cli != nil
	a.mu.Unlock()
	return map[string]any{
		"connected": connected,
		"host":      currentDockerHost(),
		"error":     "",
	}
}

// Reconnect attempts to reconnect to the Docker daemon.
func (a *App) Reconnect() string {
	a.mu.Lock()
	if a.cli != nil {
		a.cli.Close()
		a.cli = nil
	}
	a.mu.Unlock()
	a.connect()
	if a.cli != nil {
		return "connected"
	}
	return "failed"
}

// ListContainers returns all containers, sorted by compose project then name.
func (a *App) ListContainers() ([]ContainerInfo, error) {
	if err := a.checkClient(); err != nil {
		return nil, err
	}
	containers, err := a.cli.ContainerList(a.ctx, container.ListOptions{All: true})
	if err != nil {
		return nil, err
	}
	result := make([]ContainerInfo, 0, len(containers))
	for _, c := range containers {
		name := ""
		if len(c.Names) > 0 {
			name = strings.TrimPrefix(c.Names[0], "/")
		}
		result = append(result, ContainerInfo{
			ID:      c.ID,
			ShortID: c.ID[:12],
			Name:    name,
			Image:   c.Image,
			ImageID: c.ImageID,
			Status:  c.Status,
			State:   c.State,
			Project: c.Labels[labelProject],
			Service: c.Labels[labelService],
			Ports:   formatPorts(c.Ports),
		})
	}
	sort.Slice(result, func(i, j int) bool {
		pi, pj := result[i].Project, result[j].Project
		if pi != pj {
			// standalone containers (no project) sort last
			if pi == "" {
				return false
			}
			if pj == "" {
				return true
			}
			return pi < pj
		}
		return result[i].Name < result[j].Name
	})
	return result, nil
}

// ListImages returns all Docker images, sorted by primary tag then image ID.
func (a *App) ListImages() ([]ImageInfo, error) {
	if err := a.checkClient(); err != nil {
		return nil, err
	}

	images, err := a.cli.ImageList(a.ctx, dockerimage.ListOptions{All: true, SharedSize: true})
	if err != nil {
		return nil, err
	}

	result := make([]ImageInfo, 0, len(images))
	for _, img := range images {
		result = append(result, buildImageInfo(img))
	}

	sort.Slice(result, func(i, j int) bool {
		return lessImageInfo(result[i], result[j])
	})

	return result, nil
}

func buildImageInfo(summary dockerimage.Summary) ImageInfo {
	tags := normalizeRepoTags(summary.RepoTags)
	digests := append([]string(nil), summary.RepoDigests...)
	sort.Strings(digests)

	primaryTag := untaggedImageTag
	if len(tags) > 0 {
		primaryTag = tags[0]
	}

	return ImageInfo{
		ID:          summary.ID,
		ShortID:     shortenImageID(summary.ID),
		PrimaryTag:  primaryTag,
		RepoTags:    tags,
		RepoDigests: digests,
		Created:     summary.Created,
		Size:        summary.Size,
		SharedSize:  summary.SharedSize,
		Containers:  summary.Containers,
	}
}

func normalizeRepoTags(repoTags []string) []string {
	tags := make([]string, 0, len(repoTags))
	for _, tag := range repoTags {
		if tag == "" || tag == "<none>:<none>" {
			continue
		}
		tags = append(tags, tag)
	}
	sort.Strings(tags)
	return tags
}

func shortenImageID(id string) string {
	shortID := strings.TrimPrefix(id, "sha256:")
	if len(shortID) > 12 {
		return shortID[:12]
	}
	return shortID
}

func lessImageInfo(left ImageInfo, right ImageInfo) bool {
	leftUntagged := left.PrimaryTag == untaggedImageTag
	rightUntagged := right.PrimaryTag == untaggedImageTag

	if leftUntagged != rightUntagged {
		return !leftUntagged
	}
	if left.PrimaryTag != right.PrimaryTag {
		return left.PrimaryTag < right.PrimaryTag
	}
	return left.ShortID < right.ShortID
}

// StartContainer starts a single container by ID.
func (a *App) StartContainer(id string) error {
	if err := a.checkClient(); err != nil {
		return err
	}
	return a.cli.ContainerStart(a.ctx, id, container.StartOptions{})
}

// StopContainer stops a single container by ID (10-second timeout).
func (a *App) StopContainer(id string) error {
	if err := a.checkClient(); err != nil {
		return err
	}
	timeout := 10
	return a.cli.ContainerStop(a.ctx, id, container.StopOptions{Timeout: &timeout})
}

// StartComposeGroup starts all non-running containers in a compose project.
func (a *App) StartComposeGroup(project string) error {
	if err := a.checkClient(); err != nil {
		return err
	}
	f := filters.NewArgs(filters.Arg("label", fmt.Sprintf("%s=%s", labelProject, project)))
	containers, err := a.cli.ContainerList(a.ctx, container.ListOptions{All: true, Filters: f})
	if err != nil {
		return err
	}
	var errs []string
	for _, c := range containers {
		if c.State != "running" {
			if err := a.cli.ContainerStart(a.ctx, c.ID, container.StartOptions{}); err != nil {
				errs = append(errs, err.Error())
			}
		}
	}
	if len(errs) > 0 {
		return fmt.Errorf("%s", strings.Join(errs, "; "))
	}
	return nil
}

// StopComposeGroup stops all running containers in a compose project.
func (a *App) StopComposeGroup(project string) error {
	if err := a.checkClient(); err != nil {
		return err
	}
	f := filters.NewArgs(filters.Arg("label", fmt.Sprintf("%s=%s", labelProject, project)))
	containers, err := a.cli.ContainerList(a.ctx, container.ListOptions{All: true, Filters: f})
	if err != nil {
		return err
	}
	timeout := 10
	var errs []string
	for _, c := range containers {
		if c.State == "running" {
			if err := a.cli.ContainerStop(a.ctx, c.ID, container.StopOptions{Timeout: &timeout}); err != nil {
				errs = append(errs, err.Error())
			}
		}
	}
	if len(errs) > 0 {
		return fmt.Errorf("%s", strings.Join(errs, "; "))
	}
	return nil
}

// StreamLogs begins streaming logs for containerID. Lines are emitted as
// "log:line:{containerID}" events. Stream end emits "log:end:{containerID}".
func (a *App) StreamLogs(containerID string, tail int) error {
	if err := a.checkClient(); err != nil {
		return err
	}

	// Cancel any existing stream for this container.
	a.mu.Lock()
	if cancel, ok := a.logCancel[containerID]; ok {
		cancel()
	}
	ctx, cancel := context.WithCancel(a.ctx)
	a.logCancel[containerID] = cancel
	a.mu.Unlock()

	tailStr := "200"
	if tail > 0 {
		tailStr = fmt.Sprintf("%d", tail)
	}

	// Inspect to determine TTY mode so we can demux correctly.
	info, err := a.cli.ContainerInspect(a.ctx, containerID)
	isTTY := err == nil && info.Config != nil && info.Config.Tty

	reader, err := a.cli.ContainerLogs(ctx, containerID, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Tail:       tailStr,
		Timestamps: false,
	})
	if err != nil {
		cancel()
		a.mu.Lock()
		delete(a.logCancel, containerID)
		a.mu.Unlock()
		return err
	}

	go func() {
		defer reader.Close()
		defer func() {
			a.mu.Lock()
			delete(a.logCancel, containerID)
			a.mu.Unlock()
			runtime.EventsEmit(a.ctx, "log:end:"+containerID, nil)
		}()

		emit := func(line string) {
			runtime.EventsEmit(a.ctx, "log:line:"+containerID, line)
		}

		if isTTY {
			scanner := bufio.NewScanner(reader)
			scanner.Buffer(make([]byte, 1<<20), 1<<20)
			for scanner.Scan() {
				emit(scanner.Text() + "\n")
			}
		} else {
			pr, pw := io.Pipe()
			go func() {
				defer pw.Close()
				stdcopy.StdCopy(pw, pw, reader)
			}()
			scanner := bufio.NewScanner(pr)
			scanner.Buffer(make([]byte, 1<<20), 1<<20)
			for scanner.Scan() {
				emit(scanner.Text() + "\n")
			}
		}
	}()
	return nil
}

// StopLogs cancels the log stream for the given container.
func (a *App) StopLogs(containerID string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if cancel, ok := a.logCancel[containerID]; ok {
		cancel()
		delete(a.logCancel, containerID)
	}
}

// StartExec creates an interactive exec session inside the container.
// Returns a sessionID used for subsequent SendExecInput / ResizeExec / StopExec calls.
// Output is emitted as "exec:output:{sessionID}" events.
func (a *App) StartExec(containerID string, cmd string) (string, error) {
	if err := a.checkClient(); err != nil {
		return "", err
	}
	if cmd == "" {
		cmd = "sh"
	}
	execResp, err := a.cli.ContainerExecCreate(a.ctx, containerID, container.ExecOptions{
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		Tty:          true,
		Cmd:          strings.Fields(cmd),
	})
	if err != nil {
		return "", fmt.Errorf("exec create: %w", err)
	}

	ctx, cancel := context.WithCancel(a.ctx)
	hijack, err := a.cli.ContainerExecAttach(ctx, execResp.ID, container.ExecStartOptions{Tty: true})
	if err != nil {
		cancel()
		return "", fmt.Errorf("exec attach: %w", err)
	}

	sessionID := uuid.New().String()
	sess := &execSession{execID: execResp.ID, cancel: cancel, conn: hijack}
	a.mu.Lock()
	a.execSess[sessionID] = sess
	a.mu.Unlock()

	go func() {
		defer func() {
			hijack.Close()
			a.mu.Lock()
			delete(a.execSess, sessionID)
			a.mu.Unlock()
			runtime.EventsEmit(a.ctx, "exec:exit:"+sessionID, 0)
		}()
		buf := make([]byte, 4096)
		for {
			n, err := hijack.Reader.Read(buf)
			if n > 0 {
				runtime.EventsEmit(a.ctx, "exec:output:"+sessionID, string(buf[:n]))
			}
			if err != nil {
				break
			}
		}
	}()

	return sessionID, nil
}

// SendExecInput writes raw bytes to the exec session stdin.
func (a *App) SendExecInput(sessionID string, data string) error {
	a.mu.Lock()
	sess, ok := a.execSess[sessionID]
	a.mu.Unlock()
	if !ok {
		return fmt.Errorf("exec session not found")
	}
	_, err := sess.conn.Conn.Write([]byte(data))
	return err
}

// ResizeExec resizes the PTY for the given exec session.
func (a *App) ResizeExec(sessionID string, cols uint, rows uint) error {
	a.mu.Lock()
	sess, ok := a.execSess[sessionID]
	a.mu.Unlock()
	if !ok {
		return fmt.Errorf("exec session not found")
	}
	return a.cli.ContainerExecResize(a.ctx, sess.execID, container.ResizeOptions{
		Width:  cols,
		Height: rows,
	})
}

// StopExec terminates the exec session.
func (a *App) StopExec(sessionID string) {
	a.mu.Lock()
	sess, ok := a.execSess[sessionID]
	if ok {
		sess.cancel()
		sess.conn.Close()
		delete(a.execSess, sessionID)
	}
	a.mu.Unlock()
}

// formatPorts converts Docker port structs to a human-readable string.
func formatPorts(ports []dockertypes.Port) string {
	parts := make([]string, 0, len(ports))
	for _, p := range ports {
		if p.PublicPort == 0 {
			parts = append(parts, fmt.Sprintf("%d/%s", p.PrivatePort, p.Type))
		} else if p.IP != "" && p.IP != "0.0.0.0" {
			parts = append(parts, fmt.Sprintf("%s:%d->%d/%s", p.IP, p.PublicPort, p.PrivatePort, p.Type))
		} else {
			parts = append(parts, fmt.Sprintf("%d->%d/%s", p.PublicPort, p.PrivatePort, p.Type))
		}
	}
	return strings.Join(parts, ", ")
}
