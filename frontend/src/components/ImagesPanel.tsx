import { Disc3 } from 'lucide-react';
import { formatBytes, formatCreatedAt, getImageDisplayName, isUntaggedImage } from '../imageMetadata';
import type { ImageInfo } from '../types';
import { EmptyState, OpenButton, PageHeader, ScrollBody, StateDot, StatusBadge } from './ui';

interface ImagesPanelProps {
  readonly images: ImageInfo[];
  readonly onOpen: (image: ImageInfo) => void;
}

interface ImageRowProps {
  readonly image: ImageInfo;
  readonly onOpen: (image: ImageInfo) => void;
}

function ImageRow(props: Readonly<ImageRowProps>) {
  const { image, onOpen } = props;
  const displayName = getImageDisplayName(image);
  const tags = image.repoTags ?? [];
  const untagged = isUntaggedImage(image);
  const tagCount = tags.length;

  return (
    <div className="group flex min-w-0 items-center gap-2 rounded-lg py-1.5 pr-2 transition-colors hover:bg-zinc-100/80 dark:hover:bg-zinc-800/40">
      {/* Tagged dot */}
      <StateDot dotClass={untagged ? 'bg-zinc-400' : 'bg-emerald-500'} />

      {/* Clickable name + meta area */}
      <button
        type="button"
        onClick={() => onOpen(image)}
        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
      >
        <div className="flex min-w-0 items-center gap-2 self-stretch">
          <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{displayName}</span>
          <span className="shrink-0 font-mono text-xs text-zinc-400 dark:text-zinc-500">{image.shortId}</span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {tagCount > 1 && <span className="font-mono">{tagCount} tags</span>}
          <span className="font-mono">{formatBytes(image.size)}</span>
          <span>{formatCreatedAt(image.created)}</span>
          {image.containers > 0 && (
            <span>{image.containers} container{image.containers === 1 ? '' : 's'}</span>
          )}
        </div>
      </button>

      {/* Tagged badge */}
      <StatusBadge colorClass={untagged
        ? 'border-zinc-300/60 bg-zinc-100 text-zinc-500 dark:border-zinc-700/60 dark:bg-zinc-800 dark:text-zinc-400'
        : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}>
        {untagged ? 'Untagged' : 'Tagged'}
      </StatusBadge>

      {/* Open action */}
      <OpenButton onClick={() => onOpen(image)} />
    </div>
  );
}

export default function ImagesPanel(props: Readonly<ImagesPanelProps>) {
  const { images, onOpen } = props;
  const taggedCount = images.filter((img) => !isUntaggedImage(img)).length;
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* Page header — mirrors ContainerList */}
      <PageHeader
        eyebrow="Images"
        subtitle={`${images.length} total · ${taggedCount} tagged · ${formatBytes(totalSize)} total size`}
      />

      <ScrollBody>
        {images.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {images.map((image) => (
              <ImageRow key={image.id} image={image} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Disc3 className="h-12 w-12" />}
            title="No images found"
            description="Pull or build an image, then refresh the Docker resource tree."
          />
        )}
      </ScrollBody>
    </div>
  );
}