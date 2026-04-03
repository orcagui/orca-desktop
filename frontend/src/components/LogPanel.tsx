import { useEffect, useRef, useState } from 'react';
import AnsiToHtml from 'ansi-to-html';
import { StopLogs, StreamLogs } from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';
import { formatError } from '../formatError';
import type { ContainerInfo } from '../types';

interface LogPanelProps {
  readonly container: ContainerInfo | null;
}

interface LogEntry {
  id: number;
  text: string;
}

const converter = new AnsiToHtml({ newline: false, escapeXML: true });
const btnTool = 'inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-500 transition-all hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-white';

export default function LogPanel({ container }: LogPanelProps) {
  const [lines, setLines] = useState<LogEntry[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [tail, setTail] = useState(200);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const unsubscribeLineRef = useRef<(() => void) | null>(null);
  const unsubscribeEndRef = useRef<(() => void) | null>(null);
  const containerIdRef = useRef<string | null>(null);
  const nextLineIdRef = useRef(0);

  function appendLine(text: string) {
    setLines((currentLines) => [...currentLines, { id: nextLineIdRef.current++, text }]);
  }

  function stopStream(id: string) {
    unsubscribeLineRef.current?.();
    unsubscribeLineRef.current = null;
    unsubscribeEndRef.current?.();
    unsubscribeEndRef.current = null;

    StopLogs(id).catch(() => {});
    setStreaming(false);
  }

  function startStream(id: string) {
    nextLineIdRef.current = 0;
    setLines([]);
    setStreaming(true);

    unsubscribeLineRef.current = EventsOn(`log:line:${id}`, (line: string) => {
      appendLine(line);
    });
    unsubscribeEndRef.current = EventsOn(`log:end:${id}`, () => {
      setStreaming(false);
    });

    StreamLogs(id, tail).catch((caughtError) => {
      setLines([{ id: nextLineIdRef.current++, text: `[error] ${formatError(caughtError)}\n` }]);
      setStreaming(false);
    });
  }

  function restartStream() {
    if (!container) {
      return;
    }

    stopStream(container.id);
    globalThis.setTimeout(() => {
      startStream(container.id);
    }, 100);
  }

  useEffect(() => {
    if (!container) {
      return;
    }

    const nextContainerId = container.id;
    if (containerIdRef.current && containerIdRef.current !== nextContainerId) {
      stopStream(containerIdRef.current);
    }

    containerIdRef.current = nextContainerId;
    startStream(nextContainerId);

    return () => {
      if (containerIdRef.current) {
        stopStream(containerIdRef.current);
      }
    };
  }, [container?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [lines]);

  if (!container) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-600">
        <span className="text-4xl opacity-50">📜</span>
        <span className="text-sm">Select a container to view logs</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="flex min-w-0 items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Logs</span>
          <span aria-hidden="true">-</span>
          <span className="truncate font-semibold text-zinc-800 dark:text-zinc-200">{container.name || container.shortId}</span>
        </span>

        <div className="flex shrink-0 items-center gap-2">
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Tail</span>
            <select
              value={tail}
              onChange={(event) => setTail(Number(event.target.value))}
              className="appearance-none rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700 outline-none cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {[50, 100, 200, 500, 1000].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className={btnTool} onClick={restartStream}>
            <span>Stream</span>
          </button>
          <button type="button" className={btnTool} onClick={() => setLines([])}>
            <span>Clear</span>
          </button>

          {streaming && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span>live</span>
            </span>
          )}
        </div>
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
        {lines.map((line) => (
          <div
            key={line.id}
            className="odd:bg-zinc-200/40 dark:odd:bg-white/[.02] px-3.5 py-px break-all whitespace-pre-wrap hover:bg-zinc-200/60 dark:hover:bg-white/[.03]"
            dangerouslySetInnerHTML={{ __html: converter.toHtml(line.text) }}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}