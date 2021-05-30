// depends on the names of the js package
/* eslint-disable @typescript-eslint/naming-convention */
declare module '@naturalatlas/mapbox-gl-native' {
  export type RequestCallback = (err: Error | null, buffer?: RenderResponse) => void;

  export interface RenderResponse {
    modified?: Date;
    expires?: Date;
    etag?: string | string[];
    data: Buffer;
  }

  export type RenderCallback = (err: Error | null, buffer: Buffer) => void;

  export interface RenderOptions {
    request: (req: RenderRequset, callback: RequestCallback) => void;
    ratio: number;
  }

  export interface RenderParams {
    zoom?: number; // = 0;
    width?: number; // = 512;
    height?: number; // = 512;
    center?: [number, number]; // = [0, 0];
    bearing?: number; // = 0;
    pitch?: number; // = 0;
    classes?: string[];
  }

  export class Map {
    public constructor(options: RenderOptions);

    public load(style: Record<string, unknown>): void;
    public release(): void;
    public render(params: RenderParams, callback: RenderCallback): void;
  }

  export enum Resource {
    Unknown,
    Style,
    Source,
    Tile,
    Glyphs,
    SpriteImage,
    SpriteJSON,
  }

  export interface RenderRequset {
    url: string;
    kind: Resource;
  }
}
