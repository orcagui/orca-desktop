interface StateDotProps {
  readonly dotClass: string;
  readonly pulse?: boolean;
}

export function StateDot({ dotClass, pulse = false }: Readonly<StateDotProps>) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {pulse && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotClass}`} />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
    </span>
  );
}
