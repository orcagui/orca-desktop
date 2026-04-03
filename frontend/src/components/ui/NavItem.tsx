import type { ReactNode } from 'react';

// ─── NavItem ──────────────────────────────────────────────────────────────────
// Sidebar navigation item with icon, label, and count badge.
// In collapsed mode only the icon is shown (full-width centred button).

interface NavItemProps {
  readonly label: string;
  readonly count?: number;
  readonly active: boolean;
  readonly icon: ReactNode;
  readonly collapsed: boolean;
  readonly onSelect: () => void;
}

const activeCls = 'bg-blue-600 text-white shadow-sm shadow-blue-500/30';
const passiveCls =
  'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-white';

export function NavItem({ label, count, active, icon, collapsed, onSelect }: Readonly<NavItemProps>) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onSelect}
        title={label}
        className={`flex w-full items-center justify-center rounded-lg py-2.5 transition-all ${active ? activeCls : passiveCls}`}
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all ${active ? activeCls : passiveCls}`}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
      {count !== undefined && (
        <span
          className={`shrink-0 rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums ${
            active
              ? 'bg-white/20 text-white'
              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
