import { useState } from 'react';
import { Boxes, ChevronDown, ChevronRight, Package, Play, Square } from 'lucide-react';
import { toast } from './Toast';
import { StartComposeGroup, StartContainer, StopComposeGroup, StopContainer } from '../../wailsjs/go/main/App';
import { getStateStyle } from '../containerState';
import { formatError } from '../formatError';
import type { ContainerInfo } from '../types';
import {
  CountBadge,
  EmptyState,
  IconButton,
  OpenButton,
  PageHeader,
  ScrollBody,
  Spinner,
  StartButton,
  StateDot,
  StatusBadge,
  StopButton,
} from './ui';


interface ContainerListProps {
  readonly containers: ContainerInfo[];
  readonly onOpen: (container: ContainerInfo) => void;
  readonly onRefresh: () => Promise<void>;
}

interface TreeNodeContainerProps {
  readonly container: ContainerInfo;
  readonly onOpen: (container: ContainerInfo) => void;
  readonly onRefresh: () => Promise<void>;
  readonly isLast: boolean;
}

interface ComposeTreeNodeProps {
  readonly project: string;
  readonly containers: ContainerInfo[];
  readonly onOpen: (container: ContainerInfo) => void;
  readonly onRefresh: () => Promise<void>;
}

interface StandaloneTreeNodeProps {
  readonly containers: ContainerInfo[];
  readonly onOpen: (container: ContainerInfo) => void;
  readonly onRefresh: () => Promise<void>;
}


function TreeNodeContainer(props: Readonly<TreeNodeContainerProps>) {
  const { container, onOpen, onRefresh, isLast } = props;
  const [busy, setBusy] = useState(false);
  const isRunning = container.state === 'running';
  const style = getStateStyle(container.state);
  const details = [container.shortId, container.ports, container.image].filter(Boolean);

  async function toggle() {
    setBusy(true);
    try {
      if (isRunning) {
        await StopContainer(container.id);
      } else {
        await StartContainer(container.id);
      }
      await onRefresh();
      toast.success(isRunning ? `Stopped ${container.name || container.shortId}` : `Started ${container.name || container.shortId}`);
    } catch (caughtError) {
      toast.error(formatError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center">
      {/* Tree connector */}
      <div className="flex w-5 shrink-0 flex-col items-center self-stretch">
        <div className={`w-px flex-1 ${isLast ? 'bg-transparent' : 'bg-zinc-200 dark:bg-zinc-700/60'}`} />
      </div>
      <div className="flex shrink-0 items-center">
        <div className="h-px w-3 bg-zinc-200 dark:bg-zinc-700/60" />
      </div>

      {/* Container leaf node */}
      <div className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pr-2 transition-colors hover:bg-zinc-100/80 dark:hover:bg-zinc-800/40">
        {/* State dot */}
        <StateDot dotClass={style.dot} pulse={style.pulse} />

        {/* Clickable name area */}
        <button
          type="button"
          onClick={() => onOpen(container)}
          className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
        >
          <div className="flex min-w-0 items-center gap-2 self-stretch">
            <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {container.name || container.shortId}
            </span>
            {!isRunning && (
              <span className="truncate font-mono text-xs text-zinc-400 dark:text-zinc-500">
                {container.shortId}
              </span>
            )}
          </div>
          {isRunning && details.length > 0 && (
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              {details.map((detail) => (
                <span key={detail} className="max-w-full truncate font-mono">
                  {detail}
                </span>
              ))}
            </div>
          )}
        </button>

        {/* Badge */}
        <StatusBadge colorClass={style.badge}>{style.label || container.state}</StatusBadge>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            variant={isRunning ? 'stop' : 'start'}
            onClick={() => { void toggle(); }}
            disabled={busy}
            title={isRunning ? 'Stop' : 'Start'}
          >
            {busy && <Spinner />}
            {!busy && isRunning && <Square className="h-3 w-3" />}
            {!busy && !isRunning && <Play className="h-3 w-3" />}
          </IconButton>
          <OpenButton onClick={() => onOpen(container)} />
        </div>
      </div>
    </div>
  );
}

function ComposeTreeNode(props: Readonly<ComposeTreeNodeProps>) {
  const { project, containers, onOpen, onRefresh } = props;
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const runningCount = containers.filter((c) => c.state === 'running').length;
  const allRunning = runningCount === containers.length;
  const allStopped = runningCount === 0;

  async function startAll() {
    setBusy(true);
    try {
      await StartComposeGroup(project);
      await onRefresh();
      toast.success(`Started all containers in ${project}`);
    } catch (caughtError) {
      toast.error(`Error starting ${project}: ${formatError(caughtError)}`);
    } finally {
      setBusy(false);
    }
  }

  async function stopAll() {
    setBusy(true);
    try {
      await StopComposeGroup(project);
      await onRefresh();
      toast.success(`Stopped all containers in ${project}`);
    } catch (caughtError) {
      toast.error(`Error stopping ${project}: ${formatError(caughtError)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Group header */}
      <div className="group flex items-center gap-1 rounded-lg py-1 pr-2 transition-colors hover:bg-zinc-100/80 dark:hover:bg-zinc-800/40">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <Boxes className="h-4 w-4 shrink-0 text-blue-500" />
        <span className="ml-1 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{project}</span>
        <CountBadge>{runningCount}/{containers.length}</CountBadge>

        {/* Group actions */}
        {open && (
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <StartButton onClick={() => { void startAll(); }} disabled={busy || allRunning} loading={busy} />
            <StopButton onClick={() => { void stopAll(); }} disabled={busy || allStopped} loading={busy} />
          </div>
        )}
      </div>

      {/* Children with tree lines */}
      {open && (
        <div className="ml-3 flex flex-col">
          {containers.map((container, idx) => (
            <TreeNodeContainer
              key={container.id}
              container={container}
              onOpen={onOpen}
              onRefresh={onRefresh}
              isLast={idx === containers.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StandaloneTreeNode(props: Readonly<StandaloneTreeNodeProps>) {
  const { containers, onOpen, onRefresh } = props;
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col">
      {/* Group header */}
      <div className="flex items-center gap-1 rounded-lg py-1 pr-2 transition-colors hover:bg-zinc-100/80 dark:hover:bg-zinc-800/40">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <Package className="h-4 w-4 shrink-0 text-zinc-400" />
        <span className="ml-1 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">Standalone</span>
        <CountBadge>{containers.length}</CountBadge>
      </div>

      {/* Children */}
      {open && (
        <div className="ml-3 flex flex-col">
          {containers.map((container, idx) => (
            <TreeNodeContainer
              key={container.id}
              container={container}
              onOpen={onOpen}
              onRefresh={onRefresh}
              isLast={idx === containers.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContainerList(props: Readonly<ContainerListProps>) {
  const { containers, onOpen, onRefresh } = props;
  const groupedContainers: Record<string, ContainerInfo[]> = {};

  for (const container of containers) {
    const groupKey = container.project || '';
    if (!groupedContainers[groupKey]) {
      groupedContainers[groupKey] = [];
    }
    groupedContainers[groupKey].push(container);
  }

  const projectKeys = Object.keys(groupedContainers)
    .filter((key) => key !== '')
    .sort((left, right) => left.localeCompare(right));
  const standaloneContainers = groupedContainers[''] ?? [];
  const runningCount = containers.filter((c) => c.state === 'running').length;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <PageHeader
        eyebrow="Containers"
        subtitle={`${runningCount} running · ${projectKeys.length} compose ${projectKeys.length === 1 ? 'project' : 'projects'} · ${standaloneContainers.length} standalone`}
      />

      <ScrollBody>
        {containers.length > 0 ? (
          <div className="flex flex-col gap-1">
            {projectKeys.map((project) => (
              <ComposeTreeNode
                key={project}
                project={project}
                containers={groupedContainers[project] ?? []}
                onOpen={onOpen}
                onRefresh={onRefresh}
              />
            ))}

            {standaloneContainers.length > 0 && (
              <StandaloneTreeNode
                containers={standaloneContainers}
                onOpen={onOpen}
                onRefresh={onRefresh}
              />
            )}
          </div>
        ) : (
          <EmptyState
            icon={<Boxes className="h-12 w-12" />}
            title="No containers found"
            description="Make sure Docker is running and the active host is reachable, then refresh."
          />
        )}
      </ScrollBody>
    </div>
  );
}