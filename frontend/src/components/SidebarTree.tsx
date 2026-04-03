import { Boxes, ChevronLeft, ChevronRight, Disc3 } from 'lucide-react';
import type { ContainerInfo, ImageInfo, NavigationSelection } from '../types';

interface SidebarTreeProps {
  readonly containers: ContainerInfo[];
  readonly images: ImageInfo[];
  readonly selection: NavigationSelection;
  readonly collapsed: boolean;
  readonly onToggleCollapsed: () => void;
  readonly onSelectContainers: () => void;
  readonly onSelectImages: () => void;
}

interface NavItemProps {
  readonly label: string;
  readonly count: number;
  readonly active: boolean;
  readonly icon: React.ReactNode;
  readonly collapsed: boolean;
  readonly onSelect: () => void;
}

function NavItem({ label, count, active, icon, collapsed, onSelect }: Readonly<NavItemProps>) {
  const activeCls = 'bg-blue-600 text-white shadow-sm shadow-blue-500/30';
  const passiveCls = 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-white';

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
      <span
        className={`shrink-0 rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums ${
          active
            ? 'bg-white/20 text-white'
            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export default function SidebarTree(props: Readonly<SidebarTreeProps>) {
  const { containers, images, selection, collapsed, onToggleCollapsed, onSelectContainers, onSelectImages } = props;
  const containersActive = selection.kind === 'containers' || selection.kind === 'container';
  const imagesActive = selection.kind === 'images' || selection.kind === 'image';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Nav section */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Resources
          </p>
        )}

        <NavItem
          label="Containers"
          count={containers.length}
          active={containersActive}
          icon={<Boxes className="h-4 w-4 shrink-0" />}
          collapsed={collapsed}
          onSelect={onSelectContainers}
        />
        <NavItem
          label="Images"
          count={images.length}
          active={imagesActive}
          icon={<Disc3 className="h-4 w-4 shrink-0" />}
          collapsed={collapsed}
          onSelect={onSelectImages}
        />
      </nav>

      {/* Collapse toggle pinned to bottom */}
      <div className="mt-auto border-t border-zinc-200/60 pt-2 dark:border-zinc-800/60">
        <button
          type="button"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex w-full items-center justify-center rounded-lg py-2 text-zinc-400 transition-all hover:bg-zinc-100/80 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-300"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}