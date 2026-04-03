import type { ReactNode } from 'react';

interface ScrollBodyProps {
  readonly children: ReactNode;
}

export function ScrollBody({ children }: Readonly<ScrollBodyProps>) {
  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
      {children}
    </div>
  );
}
