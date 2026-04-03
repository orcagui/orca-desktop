import type { ReactNode } from 'react';

interface EmptyStateProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
}

export function EmptyState({ icon, title, description }: Readonly<EmptyStateProps>) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-zinc-400 opacity-30 dark:text-zinc-500">{icon}</span>
      <p className="text-base font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="max-w-md text-sm text-zinc-400 dark:text-zinc-500">{description}</p>
    </div>
  );
}
