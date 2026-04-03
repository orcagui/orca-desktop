import type { main } from '../wailsjs/go/models';

export type ContainerInfo = main.ContainerInfo;
export type ImageInfo = main.ImageInfo;

export interface DockerStatus {
  connected: boolean;
  host: string;
  error: string;
}

export type NavigationSelection =
  | { kind: 'containers' }
  | { kind: 'container'; id: string }
  | { kind: 'images' }
  | { kind: 'image'; id: string }
  | { kind: 'settings' };

export type Theme = 'dark' | 'light';

export interface FontSettings {
  family: string;
  size: number;
  weight: number;
}