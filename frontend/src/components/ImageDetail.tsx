import { ArrowLeft } from 'lucide-react';
import { getStateStyle } from '../containerState';
import { formatBytes, formatCreatedAt, getImageDisplayName } from '../imageMetadata';
import type { ContainerInfo, ImageInfo } from '../types';

interface ImageDetailProps {
  readonly image: ImageInfo | null;
  readonly containers: ContainerInfo[];
  readonly onBack: () => void;
  readonly onOpenContainer: (container: ContainerInfo) => void;
}

function StatCard(props: Readonly<{ label: string; value: string }>) {
  const { label, value } = props;

  return (
    <div className="rounded-[24px] border border-zinc-200/70 bg-white/80 px-4 py-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="mt-2 break-all text-sm font-medium text-zinc-800 dark:text-zinc-100">{value}</p>
    </div>
  );
}

export default function ImageDetail(props: Readonly<ImageDetailProps>) {
  const { image, containers, onBack, onOpenContainer } = props;

  if (!image) {
    return null;
  }

  const relatedContainers = containers.filter((container) => container.imageId === image.id || image.repoTags.includes(container.image));

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200/70 bg-white/70 px-5 py-4 shadow-sm backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/40">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 transition-all hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-zinc-400 dark:text-zinc-500">Image</p>
            <h1 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">{getImageDisplayName(image)}</h1>
            <p className="truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">sha256:{image.shortId}</p>
          </div>
        </div>

        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {image.containers} containers using this image
        </span>
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto p-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <div className="flex flex-col gap-6">
            <section className="rounded-[30px] border border-zinc-200/70 bg-white/80 p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-zinc-400 dark:text-zinc-500">Tags</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {image.repoTags.length > 0 ? (
                  image.repoTags.map((tag) => (
                    <span key={tag} className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                    No tags available
                  </span>
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-zinc-200/70 bg-white/80 p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-zinc-400 dark:text-zinc-500">Digests</p>
              <div className="mt-4 flex flex-col gap-2">
                {image.repoDigests.length > 0 ? (
                  image.repoDigests.map((digest) => (
                    <div key={digest} className="rounded-2xl border border-zinc-200/70 bg-zinc-50 px-3 py-3 font-mono text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300">
                      {digest}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No digests reported for this image.</p>
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-zinc-200/70 bg-white/80 p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-zinc-400 dark:text-zinc-500">Related Containers</p>
                  <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Containers built from this image</h2>
                </div>
                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  {relatedContainers.length}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {relatedContainers.length > 0 ? (
                  relatedContainers.map((container) => {
                    const stateStyle = getStateStyle(container.state);

                    return (
                      <button
                        key={container.id}
                        type="button"
                        onClick={() => onOpenContainer(container)}
                        className="flex items-center gap-3 rounded-[22px] border border-zinc-200/70 bg-zinc-50 px-4 py-3 text-left transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                      >
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${stateStyle.dot}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{container.name || container.shortId}</span>
                          <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">{container.status}</span>
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${stateStyle.badge}`}>{stateStyle.label}</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No containers currently reference this image.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <StatCard label="Image ID" value={`sha256:${image.shortId}`} />
            <StatCard label="Created" value={formatCreatedAt(image.created)} />
            <StatCard label="Size" value={formatBytes(image.size)} />
            <StatCard label="Shared Size" value={formatBytes(image.sharedSize)} />
          </aside>
        </div>
      </div>
    </div>
  );
}