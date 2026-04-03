interface PageHeaderProps {
  readonly eyebrow: string;
  readonly subtitle: string;
}

export function PageHeader({ eyebrow, subtitle }: Readonly<PageHeaderProps>) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200/70 bg-white/70 px-6 py-4 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/40">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">{eyebrow}</p>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      </div>
    </div>
  );
}
