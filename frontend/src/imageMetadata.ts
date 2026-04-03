import type { ImageInfo } from './types';

const UNTAGGED_IMAGE = '<untagged>';
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${BYTE_UNITS[unitIndex]}`;
}

export function formatCreatedAt(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(unixSeconds * 1000));
}

export function getImageDisplayName(image: ImageInfo): string {
  if (image.primaryTag && image.primaryTag !== UNTAGGED_IMAGE) {
    return image.primaryTag;
  }

  return `sha256:${image.shortId}`;
}

export function getImageSecondaryText(image: ImageInfo): string {
  const tags = image.repoTags ?? [];
  const digests = image.repoDigests ?? [];

  if (tags.length > 1) {
    return `${tags.length} tags`;
  }

  if (digests.length > 0) {
    return digests[0];
  }

  return `sha256:${image.shortId}`;
}

export function isUntaggedImage(image: ImageInfo): boolean {
  const tags = image.repoTags ?? [];
  return tags.length === 0 || image.primaryTag === UNTAGGED_IMAGE;
}