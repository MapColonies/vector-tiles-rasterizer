import path from 'path';
import fs from 'fs';

import { IGlobalConfig } from '../../src/common/interfaces';
import { GetTileParams } from '../../src/tile/controllers/tileController';

const TEST_ENV_DIR_PATH = path.resolve(__dirname, '../environment');
const STYLES_DIR = 'styles';

const DEFAULT_TILE_REQUEST_PARAMS: GetTileParams = {
  x: '0',
  y: '0',
  z: '0',
};

export const getDefaultTileRequestParams = (): GetTileParams => DEFAULT_TILE_REQUEST_PARAMS;

export const getMockedGlobalConfig = async (shouldRegisterSadStyle = false): Promise<IGlobalConfig> => {
  const testStyleName = shouldRegisterSadStyle ? 'sad-style.json' : 'style.json';
  const testStylePath = path.join(TEST_ENV_DIR_PATH, STYLES_DIR, testStyleName);
  const styleContent: unknown = JSON.parse(await fs.promises.readFile(testStylePath, 'utf-8'));

  const globalConfig: IGlobalConfig = {
    appInitTime: new Date().toUTCString(),
    styleContent: styleContent,
  };

  return globalConfig;
};

export const getTestTileBuffer = async (): Promise<Buffer> => {
  return fs.promises.readFile(path.resolve(path.join(TEST_ENV_DIR_PATH, 'test-tile.png')));
};

export const waitTilPoolIsClosed = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};
