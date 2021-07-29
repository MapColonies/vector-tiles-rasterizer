const DEFAULT_TILE: TileScheme = {
  x: 0,
  y: 0,
  z: 1,
};

export interface TileScheme {
  x: number;
  y: number;
  z: number;
}

export const getDefaultTile = (): TileScheme => DEFAULT_TILE;
