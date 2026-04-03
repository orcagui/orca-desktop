import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastKind = 'success' | 'error';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

type Listener = (toasts: ToastItem[]) => void;

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function notify() {
  const snapshot = [...items];
  for (const l of listeners) l(snapshot);
}

function add(kind: ToastKind, message: string) {
  const id = nextId++;
  items = [...items, { id, kind, message }];
  notify();
  setTimeout(() => remove(id), 4000);
}

function remove(id: number) {
  items = items.filter((t) => t.id !== id);
  notify();
}

export const toast = {
  success: (message: string) => add('success', message),
  error: (message: string) => add('error', message),
};

function useToasts(): ToastItem[] {
  const [snapshot, setSnapshot] = useState<ToastItem[]>([...items]);
  useEffect(() => {
    const handler = (next: ToastItem[]) => setSnapshot(next);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);
  return snapshot;
}

const icons: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />,
  error: <XCircle className="h-4 w-4 shrink-0 text-red-500" />,
};

const bar: Record<ToastKind, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
};

export function Toaster() {
  const toasts = useToasts();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col-reverse gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto relative flex w-80 items-start gap-3 overflow-hidden rounded-xl border border-zinc-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-xl dark:border-zinc-700/70 dark:bg-zinc-900/95"
        >
          {/* coloured left bar */}
          <span className={`absolute left-0 top-0 h-full w-1 ${bar[t.kind]}`} />

          {icons[t.kind]}

          <p className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{t.message}</p>

          <button
            type="button"
            onClick={() => remove(t.id)}
            className="ml-auto shrink-0 rounded p-0.5 text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
