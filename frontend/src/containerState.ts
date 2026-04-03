export interface StateStyle {
  dot: string;
  badge: string;
  label: string;
  pulse: boolean;
}

const DEFAULT_STATE: StateStyle = {
  dot: 'bg-zinc-400',
  badge: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/25',
  label: '',
  pulse: false,
};

const STATE_STYLE: Record<string, StateStyle> = {
  running: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    label: 'Running',
    pulse: true,
  },
  exited: {
    dot: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
    label: 'Exited',
    pulse: false,
  },
  paused: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    label: 'Paused',
    pulse: false,
  },
  created: {
    dot: 'bg-zinc-400',
    badge: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25',
    label: 'Created',
    pulse: false,
  },
  dead: {
    dot: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
    label: 'Dead',
    pulse: false,
  },
  restarting: {
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    label: 'Restarting',
    pulse: true,
  },
};

export function getStateStyle(state: string): StateStyle {
  return STATE_STYLE[state] ?? { ...DEFAULT_STATE, label: state };
}