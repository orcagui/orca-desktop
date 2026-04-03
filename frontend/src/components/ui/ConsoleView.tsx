import type { ReactNode } from 'react';

/**
 * Shared console-style viewport.
 * Applies the user's configured font (via CSS vars) and a consistent dark terminal
 * colour scheme across the Preview panel, Log panel, and Exec panel.
 */

export const CONSOLE_BG = '#09090b';

interface ConsoleViewProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function ConsoleView({ children, className = '' }: Readonly<ConsoleViewProps>) {
  return (
    <div
      className={`font-mono leading-relaxed text-zinc-200 ${className}`}
      style={{
        background: CONSOLE_BG,
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-size-content)',
        fontWeight: 'var(--font-weight)',
      }}
    >
      {children}
    </div>
  );
}
