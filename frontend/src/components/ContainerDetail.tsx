import { useState, type ReactNode } from 'react';
import { ArrowLeft, Play, ScrollText, Square, Terminal } from 'lucide-react';
import { StartContainer, StopContainer } from '../../wailsjs/go/main/App';
import { getStateStyle } from '../containerState';
import { formatError } from '../formatError';
import type { ContainerInfo } from '../types';
import ExecPanel from './ExecPanel';
import LogPanel from './LogPanel';
import { toast } from './Toast';

interface ContainerDetailProps {
  readonly container: ContainerInfo;
  readonly onBack: () => void;
  readonly onRefresh: () => Promise<void>;
}

type DetailTab = 'logs' | 'exec';

function getToggleContent(busy: boolean, isRunning: boolean): ReactNode {
  if (busy) {
    return '...';
  }

  if (isRunning) {
    return (
      <>
        <Square className="h-3.5 w-3.5" />
        <span>Stop</span>
      </>
    );
  }

  return (
    <>
      <Play className="h-3.5 w-3.5" />
      <span>Start</span>
    </>
  );
}

export default function ContainerDetail({ container, onBack, onRefresh }: Readonly<ContainerDetailProps>) {
  const [tab, setTab] = useState<DetailTab>('logs');
  const [busy, setBusy] = useState(false);

  const isRunning = container.state === 'running';
  const stateStyle = getStateStyle(container.state);
  const tabs: Array<{ id: DetailTab; icon: ReactNode; label: string }> = [
    { id: 'logs', icon: <ScrollText className="h-3.5 w-3.5" />, label: 'Logs' },
    { id: 'exec', icon: <Terminal className="h-3.5 w-3.5" />, label: 'Exec' },
  ];

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
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-5 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 transition-all hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-blue-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex min-w-0 items-center gap-1.5">
            {container.project && (
              <>
                <span className="shrink-0 text-sm font-medium text-zinc-400 dark:text-zinc-500">{container.project}</span>
                <span className="shrink-0 text-zinc-300 dark:text-zinc-600">/</span>
              </>
            )}
            <span className="truncate text-[15px] font-bold text-zinc-900 dark:text-zinc-100">
              {container.name || container.shortId}
            </span>
          </div>

          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stateStyle.badge}`}>
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              {stateStyle.pulse && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${stateStyle.dot}`} />}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${stateStyle.dot}`} />
            </span>
            <span>{stateStyle.label}</span>
          </span>

          {container.image && (
            <span
              className="hidden max-w-[280px] truncate rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 md:block"
              title={container.image}
            >
              {container.image}
            </span>
          )}

          {container.ports && <span className="shrink-0 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">{container.ports}</span>}
        </div>

        <button
          type="button"
          onClick={() => {
            void toggle();
          }}
          disabled={busy}
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-4 text-xs font-semibold transition-all disabled:opacity-40 ${
            isRunning
              ? 'border-red-500/40 bg-red-50 text-red-700 hover:border-red-500 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:text-red-400'
              : 'border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400'
          }`}
        >
          {getToggleContent(busy, isRunning)}
        </button>
      </div>

      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
        {tabs.map((tabOption) => (
          <button
            key={tabOption.id}
            type="button"
            onClick={() => setTab(tabOption.id)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-3.5 text-[13px] font-medium transition-all ${
              tab === tabOption.id
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }`}
          >
            {tabOption.icon}
            <span>{tabOption.label}</span>
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {tab === 'logs' && <LogPanel container={container} />}
          {tab === 'exec' && <ExecPanel container={container} />}
        </div>
      </div>
    </div>
  );
}