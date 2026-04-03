import { Boxes, ChevronLeft, ChevronRight, Disc3, Settings } from 'lucide-react';
import type { ContainerInfo, ImageInfo, NavigationSelection } from '../types';
import { NavItem } from './ui';

interface SidebarTreeProps {
  readonly containers: ContainerInfo[];
  readonly images: ImageInfo[];
  readonly selection: NavigationSelection;
  readonly collapsed: boolean;
  readonly onToggleCollapsed: () => void;
  readonly onSelectContainers: () => void;
  readonly onSelectImages: () => void;
  readonly onSelectSettings: () => void;
}

export default function SidebarTree(props: Readonly<SidebarTreeProps>) {
  const { containers, images, selection, collapsed, onToggleCollapsed, onSelectContainers, onSelectImages, onSelectSettings } = props;
  const containersActive = selection.kind === 'containers' || selection.kind === 'container';
  const imagesActive = selection.kind === 'images' || selection.kind === 'image';
  const settingsActive = selection.kind === 'settings';

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

      {/* Settings pinned above collapse toggle */}
      <div className="border-t border-zinc-200/60 pt-2 dark:border-zinc-800/60">
        <NavItem
          label="Settings"
          active={settingsActive}
          icon={<Settings className="h-4 w-4 shrink-0" />}
          collapsed={collapsed}
          onSelect={onSelectSettings}
        />
      </div>

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