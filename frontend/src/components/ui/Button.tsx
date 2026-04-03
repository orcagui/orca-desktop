import type { ReactNode } from 'react';
import { ArrowRight, Play, Square } from 'lucide-react';
import { Spinner } from './Spinner';

// ─── IconButton ───────────────────────────────────────────────────────────────
// Square icon-only button. variant controls the colour tone.

export type IconButtonVariant = 'start' | 'stop' | 'accent';

const iconBtnBase = 'inline-flex h-6 w-6 items-center justify-center rounded-md transition-all disabled:cursor-default disabled:opacity-40';
const ICON_BTN_CLASS: Record<IconButtonVariant, string> = {
  start:  `${iconBtnBase} text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400`,
  stop:   `${iconBtnBase} text-red-600 hover:bg-red-500/10 dark:text-red-400`,
  accent: `${iconBtnBase} text-blue-600 hover:bg-blue-500/10 dark:text-blue-400`,
};

interface IconButtonProps {
  readonly variant: IconButtonVariant;
  readonly onClick: () => void;
  readonly title?: string;
  readonly disabled?: boolean;
  readonly children: ReactNode;
}

export function IconButton({ variant, onClick, title, disabled, children }: Readonly<IconButtonProps>) {
  return (
    <button
      type="button"
      className={ICON_BTN_CLASS[variant]}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ─── OpenButton ───────────────────────────────────────────────────────────────
// Shorthand arrow icon button for opening detail views.

interface OpenButtonProps {
  readonly onClick: () => void;
  readonly title?: string;
}

export function OpenButton({ onClick, title = 'Open details' }: Readonly<OpenButtonProps>) {
  return (
    <IconButton variant="accent" onClick={onClick} title={title}>
      <ArrowRight className="h-3 w-3" />
    </IconButton>
  );
}

// ─── StartButton / StopButton ─────────────────────────────────────────────────
// Small labelled text+icon buttons for group-level Start / Stop actions.

const textBtnBase = 'inline-flex h-6 items-center gap-1 rounded px-2 text-xs font-medium transition-all disabled:cursor-default disabled:opacity-40';

interface ActionButtonProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
}

export function StartButton({ onClick, disabled, loading }: Readonly<ActionButtonProps>) {
  return (
    <button
      type="button"
      className={`${textBtnBase} text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400`}
      onClick={onClick}
      disabled={disabled}
      title="Start all"
    >
      {loading ? <Spinner /> : <><Play className="h-2.5 w-2.5" /> Start</>}
    </button>
  );
}

export function StopButton({ onClick, disabled, loading }: Readonly<ActionButtonProps>) {
  return (
    <button
      type="button"
      className={`${textBtnBase} text-red-600 hover:bg-red-500/10 dark:text-red-400`}
      onClick={onClick}
      disabled={disabled}
      title="Stop all"
    >
      {loading ? <Spinner /> : <><Square className="h-2.5 w-2.5" /> Stop</>}
    </button>
  );
}
