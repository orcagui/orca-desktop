import { MoonIcon, RefreshCw, SunIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GetDockerStatus, ListContainers, ListImages, Reconnect } from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime/runtime';
import ContainerDetail from './components/ContainerDetail';
import SettingsPanel, { defaultFontSettings } from './components/SettingsPanel';
import ContainerList from './components/ContainerList';
import ImageDetail from './components/ImageDetail';
import ImagesPanel from './components/ImagesPanel';
import SidebarTree from './components/SidebarTree';
import { Toaster } from './components/Toast';
import { formatError } from './formatError';
import type { ContainerInfo, DockerStatus, FontSettings, ImageInfo, NavigationSelection, Theme } from './types';
import { Spinner } from './components/ui';

const DOCKER_STATUS_EVENT = 'docker:status';

function createDefaultDockerStatus(): DockerStatus {
  return {
    connected: false,
    host: '',
    error: '',
  };
}

function getInitialTheme(): Theme {
  const theme = localStorage.getItem('orca-theme') === 'light' ? 'light' : 'dark';
  document.documentElement.classList.toggle('dark', theme === 'dark');
  return theme;
}

function getInitialFontSettings(): FontSettings {
  try {
    const raw = localStorage.getItem('orca-font-settings');
    if (raw) {
      const parsed = JSON.parse(raw) as FontSettings;
      applyFontSettings(parsed);
      return parsed;
    }
  } catch {
    // ignore
  }
  const defaults = defaultFontSettings();
  applyFontSettings(defaults);
  return defaults;
}

function applyFontSettings(settings: FontSettings) {
  const root = document.documentElement;
  root.style.setProperty('--font-family', settings.family);
  root.style.setProperty('--font-size', `${settings.size}px`);
  root.style.setProperty('--font-size-content', `${settings.size}px`);
  root.style.setProperty('--font-weight', String(settings.weight));
}

export default function App() {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [selection, setSelection] = useState<NavigationSelection>({ kind: 'containers' });
  const [dockerStatus, setDockerStatus] = useState<DockerStatus>(createDefaultDockerStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [fontSettings, setFontSettings] = useState<FontSettings>(getInitialFontSettings);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const selectionRef = useRef<NavigationSelection>({ kind: 'containers' });
  const refreshTimer = useRef<number | null>(null);

  selectionRef.current = selection;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('orca-theme', theme);
  }, [theme]);

  useEffect(() => {
    applyFontSettings(fontSettings);
    localStorage.setItem('orca-font-settings', JSON.stringify(fontSettings));
  }, [fontSettings]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [nextContainers, nextImages] = await Promise.all([ListContainers(), ListImages()]);
      const safeContainers = nextContainers ?? [];
      const safeImages = nextImages ?? [];

      setContainers(safeContainers);
      setImages(safeImages);

      const currentSelection = selectionRef.current;
      if (currentSelection.kind === 'container') {
        const updatedContainer = safeContainers.find((container) => container.id === currentSelection.id) ?? null;
        if (updatedContainer === null) {
          setSelection({ kind: 'containers' });
        }
      }

      if (currentSelection.kind === 'image') {
        const updatedImage = safeImages.find((image) => image.id === currentSelection.id) ?? null;
        if (updatedImage === null) {
          setSelection({ kind: 'images' });
        }
      }
    } catch (caughtError) {
      setError(formatError(caughtError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = EventsOn(DOCKER_STATUS_EVENT, (status: DockerStatus) => {
      setDockerStatus(status);
      if (status.connected) {
        refresh().catch(() => {});
      }
    });

    // Query current status immediately — the startup event may have fired
    // before this subscription was registered (race condition on app load).
    GetDockerStatus()
      .then((status) => {
        setDockerStatus(status as DockerStatus);
      })
      .catch(() => {});

    return unsubscribe;
  }, [refresh]);

  useEffect(() => {
    const refreshContainers = () => {
      refresh().catch(() => {});
    };

    refreshContainers();

    refreshTimer.current = setInterval(refreshContainers, 5000);

    return () => {
      if (refreshTimer.current !== null) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [refresh]);

  async function handleReconnect() {
    setDockerStatus(createDefaultDockerStatus());

    const result = await Reconnect();
    if (result === 'connected') {
      await refresh();
    }
  }

  function handleOpenContainer(container: ContainerInfo) {
    setSelection({ kind: 'container', id: container.id });
  }

  function handleOpenImage(image: ImageInfo) {
    setSelection({ kind: 'image', id: image.id });
  }

  function handleBackToContainers() {
    setSelection({ kind: 'containers' });
    refresh().catch(() => {});
  }

  function handleBackToImages() {
    setSelection({ kind: 'images' });
    refresh().catch(() => {});
  }

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  function requestRefresh() {
    refresh().catch(() => {});
  }

  function requestReconnect() {
    handleReconnect().catch(() => {});
  }

  const connectionTone = dockerStatus.connected
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    : 'bg-red-500/10 text-red-600 dark:text-red-400';

  const selectedContainer = selection.kind === 'container' ? containers.find((container) => container.id === selection.id) ?? null : null;
  const selectedImage = selection.kind === 'image' ? images.find((image) => image.id === selection.id) ?? null : null;

  function renderContent() {
    if (selection.kind === 'settings') {
      return <SettingsPanel fontSettings={fontSettings} onFontSettingsChange={setFontSettings} />;
    }

    if (selection.kind === 'container' && selectedContainer) {
      return <ContainerDetail container={selectedContainer} onBack={handleBackToContainers} onRefresh={refresh} />;
    }

    if (selection.kind === 'image' && selectedImage) {
      return (
        <ImageDetail
          image={selectedImage}
          containers={containers}
          onBack={handleBackToImages}
          onOpenContainer={handleOpenContainer}
        />
      );
    }

    if (selection.kind === 'images') {
      return <ImagesPanel images={images} onOpen={handleOpenImage} />;
    }

    return <ContainerList containers={containers} onOpen={handleOpenContainer} onRefresh={refresh} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="z-10 flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
            <span aria-hidden="true" className="text-xl">
              🐳
            </span>
            <span>Orca</span>
          </span>

          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${connectionTone}`}>
            {dockerStatus.connected ? (
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
            ) : (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
            )}
            <span>{dockerStatus.connected ? 'Connected' : 'Disconnected'}</span>
          </span>

          {dockerStatus.host && (
            <span
              className="hidden max-w-[240px] truncate rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 md:block"
              title={dockerStatus.host}
            >
              {dockerStatus.host}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <span
              className="inline-flex max-w-[200px] items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-400"
              title={error}
            >
              <span aria-hidden="true">!</span>
              <span className="truncate">{error.slice(0, 50)}</span>
            </span>
          )}

          <button
            type="button"
            onClick={requestRefresh}
            disabled={loading}
            title="Refresh container list"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-default disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-white"
          >
            <span>{loading ? <Spinner /> : <RefreshCw />}</span>
          </button>

          <button
            type="button"
            onClick={requestReconnect}
            title="Reconnect to Docker daemon"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-white"
          >
            <span>Reconnect</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-sm transition-all hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
          >
            <span aria-hidden="true">{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</span>
          </button>
        </div>
      </header>

      <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.10),_transparent_30%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.10),_transparent_26%)]">
        <aside className={`${sidebarCollapsed ? 'w-[80px]' : 'w-[200px]'} shrink-0 overflow-hidden border-zinc-200/80 bg-white/70 p-3 transition-[width] duration-200 ease-in-out backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/70`}>
          <SidebarTree
            containers={containers}
            images={images}
            selection={selection}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
            onSelectContainers={() => setSelection({ kind: 'containers' })}
            onSelectImages={() => setSelection({ kind: 'images' })}
            onSelectSettings={() => setSelection({ kind: 'settings' })}
          />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{renderContent()}</section>
      </main>
      <Toaster />
    </div>
  );
}