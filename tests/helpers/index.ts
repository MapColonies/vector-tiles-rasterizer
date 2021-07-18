import { join, resolve } from 'path';
import { promises } from 'fs';

import { IGlobalConfig } from '../../src/common/interfaces';
import { GetTileParams } from '../../src/tile/controllers/tileController';

const TEST_ENV_DIR_PATH = resolve(__dirname, '../environment');
const STYLES_DIR = 'styles';

const DEFAULT_TILE_REQUEST_PARAMS: GetTileParams = {
  x: '0',
  y: '0',
  z: '1',
};

export const getDefaultTileRequestParams = (): GetTileParams => {
  return { ...DEFAULT_TILE_REQUEST_PARAMS };
};

export const getMockedGlobalConfig = async (shouldRegisterSadStyle = false): Promise<IGlobalConfig> => {
  const testStyleName = shouldRegisterSadStyle ? 'sad-style.json' : 'style.json';
  const testStylePath = join(TEST_ENV_DIR_PATH, STYLES_DIR, testStyleName);
  const styleContent: unknown = JSON.parse(await promises.readFile(testStylePath, 'utf-8'));

  const globalConfig: IGlobalConfig = {
    styleContent: styleContent,
  };

  return globalConfig;
};

export const getTestTileBuffer = async (): Promise<Buffer> => {
  return promises.readFile(resolve(join(TEST_ENV_DIR_PATH, 'test-tile.png')));
};

export const waitUntilPoolIsClosed = async (ms: number): Promise<void> => {
  await new Promise((_) => setTimeout(_, ms));
};
