import { useEffect, useRef, useState } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { ResizeExec, SendExecInput, StartExec, StopExec } from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';
import { formatError } from '../formatError';
import type { ContainerInfo } from '../types';

interface ExecPanelProps {
  container: ContainerInfo | null;
}

const XTERM_THEME_DARK = {
  background: '#09090b',
  foreground: '#e4e4e7',
  cursor: '#3b82f6',
  cursorAccent: '#09090b',
  selectionBackground: '#1e3a5f',
  black: '#27272a',
  red: '#f87171',
  green: '#4ade80',
  yellow: '#fbbf24',
  blue: '#60a5fa',
  magenta: '#c084fc',
  cyan: '#22d3ee',
  white: '#d4d4d8',
  brightBlack: '#52525b',
  brightRed: '#fca5a5',
  brightGreen: '#86efac',
  brightYellow: '#fde68a',
  brightBlue: '#93c5fd',
  brightMagenta: '#d8b4fe',
  brightCyan: '#67e8f9',
  brightWhite: '#f4f4f5',
};

const XTERM_THEME_LIGHT = {
  background: '#f4f4f5',
  foreground: '#18181b',
  cursor: '#2563eb',
  cursorAccent: '#f4f4f5',
  selectionBackground: '#bfdbfe',
  black: '#3f3f46',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#d97706',
  blue: '#2563eb',
  magenta: '#9333ea',
  cyan: '#0891b2',
  white: '#52525b',
  brightBlack: '#71717a',
  brightRed: '#ef4444',
  brightGreen: '#22c55e',
  brightYellow: '#f59e0b',
  brightBlue: '#3b82f6',
  brightMagenta: '#a855f7',
  brightCyan: '#06b6d4',
  brightWhite: '#18181b',
};

function getXtermTheme() {
  return document.documentElement.classList.contains('dark') ? XTERM_THEME_DARK : XTERM_THEME_LIGHT;
}

export default function ExecPanel({ container }: ExecPanelProps) {
  const termWrapRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const sessionRef = useRef<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [cmdInput, setCmdInput] = useState('sh');
  const [started, setStarted] = useState(false);

  function runCleanup() {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (sessionRef.current) {
      void StopExec(sessionRef.current).catch(() => {});
      sessionRef.current = null;
    }

    setStarted(false);
  }

  function initTerminal() {
    termRef.current?.dispose();
    termRef.current = null;

    const mountNode = termWrapRef.current;
    if (!mountNode) {
      return;
    }

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"Cascadia Code", "SF Mono", "Fira Code", Consolas, monospace',
      theme: getXtermTheme(),
      scrollback: 5000,
      convertEol: true,
    });
    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);
    terminal.open(mountNode);
    fitAddon.fit();

    termRef.current = terminal;
    fitRef.current = fitAddon;
  }

  async function startSession(command: string) {
    if (!container) {
      return;
    }

    runCleanup();
    initTerminal();

    const terminal = termRef.current;
    if (!terminal) {
      return;
    }

    const commandName = command.trim() || 'sh';
    terminal.writeln(`\x1b[1;34mConnecting to ${container.name || container.shortId}...\x1b[0m`);

    let sessionId: string;
    try {
      sessionId = await StartExec(container.id, commandName);
    } catch (caughtError) {
      terminal.writeln(`\r\n\x1b[1;31mError: ${formatError(caughtError)}\x1b[0m`);
      return;
    }

    sessionRef.current = sessionId;
    setStarted(true);

    const unsubscribeOutput = EventsOn(`exec:output:${sessionId}`, (data: string) => {
      termRef.current?.write(data);
    });
    const unsubscribeExit = EventsOn(`exec:exit:${sessionId}`, () => {
      termRef.current?.writeln('\r\n\x1b[90m[session ended]\x1b[0m');
      sessionRef.current = null;
      setStarted(false);
    });
    const inputDisposable = terminal.onData((data) => {
      if (sessionRef.current) {
        void SendExecInput(sessionRef.current, data).catch(() => {});
      }
    });
    const observer = new ResizeObserver(() => {
      const fitAddon = fitRef.current;
      const activeTerminal = termRef.current;
      const activeSession = sessionRef.current;

      if (!fitAddon || !activeTerminal) {
        return;
      }

      fitAddon.fit();

      if (activeSession) {
        void ResizeExec(activeSession, activeTerminal.cols, activeTerminal.rows).catch(() => {});
      }
    });

    if (termWrapRef.current) {
      observer.observe(termWrapRef.current);
    }

    cleanupRef.current = () => {
      unsubscribeOutput();
      unsubscribeExit();
      inputDisposable.dispose();
      observer.disconnect();
    };
  }

  function disconnect() {
    runCleanup();
    termRef.current?.writeln('\r\n\x1b[90m[disconnected]\x1b[0m');
  }

  useEffect(() => {
    return () => {
      runCleanup();
      termRef.current?.dispose();
      termRef.current = null;
    };
  }, [container?.id]);

  if (!container) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-600">
        <span className="text-4xl opacity-50">🖥️</span>
        <span className="text-sm">Select a container to open a terminal</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="flex min-w-0 items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Exec</span>
          <span aria-hidden="true">-</span>
          <span className="truncate font-semibold text-zinc-800 dark:text-zinc-200">{container.name || container.shortId}</span>
        </span>

        <div className="flex shrink-0 items-center gap-2">
          <input
            className="h-7 w-40 rounded-md border border-zinc-200 bg-zinc-100 px-2.5 font-mono text-xs text-zinc-800 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            value={cmdInput}
            onChange={(event) => setCmdInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !started) {
                void startSession(cmdInput);
              }
            }}
            placeholder="sh, bash, ..."
            disabled={started}
          />

          {started ? (
            <button
              type="button"
              className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-red-500/40 bg-red-50 px-3 text-xs font-semibold text-red-700 transition-all hover:border-red-500 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:text-red-400"
              onClick={disconnect}
            >
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-all hover:border-emerald-500 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400"
              onClick={() => {
                void startSession(cmdInput);
              }}
            >
              <span>Connect</span>
            </button>
          )}
        </div>
      </div>

      <div ref={termWrapRef} className="flex-1 min-h-0 overflow-hidden bg-[#09090b] p-1.5" />
    </div>
  );
}