import type { ReactNode } from 'react';

// ─── StatusBadge ─────────────────────────────────────────────────────────────
// Rounded pill badge. Pass the full Tailwind color className from the caller.

interface StatusBadgeProps {
  readonly colorClass: string;
  readonly children: ReactNode;
}

export function StatusBadge({ colorClass, children }: Readonly<StatusBadgeProps>) {
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold leading-tight ${colorClass}`}>
      {children}
    </span>
  );
}

// ─── CountBadge ──────────────────────────────────────────────────────────────
// Neutral zinc pill used on tree group headers (e.g. "3/5 running").

interface CountBadgeProps {
  readonly children: ReactNode;
}

export function CountBadge({ children }: Readonly<CountBadgeProps>) {
  return (
    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      {children}
    </span>
  );
}
