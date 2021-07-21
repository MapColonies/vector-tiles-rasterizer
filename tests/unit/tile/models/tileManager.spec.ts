import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { Logger } from 'pino';

import { TileManager } from '../../../../src/tile/models/tileManager';
import { RenderHandler } from '../../../../src/tile/models/renderHandler';
import { getMockedGlobalConfig, getTestTileBuffer } from '../../../helpers';
import { IApplicationConfig } from '../../../../src/common/interfaces';
import { OutOfBoundsError } from '../../../../src/common/errors';
import { getDefaultTile, TileScheme } from '../helpers';

let tileManager: TileManager;
let tileManager2x: TileManager;
let sadTileManager: TileManager;
let renderHandler: RenderHandler;
let mockLogger: Logger;

const appConfig = config.get<IApplicationConfig>('application');

describe('tileManager', () => {
  beforeAll(async function () {
    mockLogger = jsLogger({ enabled: false });
    renderHandler = new RenderHandler(mockLogger, appConfig);
    const mockGlobalConfig = await getMockedGlobalConfig();
    tileManager = new TileManager(mockLogger, appConfig, mockGlobalConfig, renderHandler);
    tileManager2x = new TileManager(mockLogger, { ...appConfig, tileSize: 512 }, mockGlobalConfig, renderHandler);
    sadTileManager = new TileManager(mockLogger, appConfig, await getMockedGlobalConfig(true), renderHandler);
  });
  afterAll(function () {
    tileManager.shutdown();
    tileManager2x.shutdown();
    sadTileManager.shutdown();
  });
  describe('#getTile', () => {
    it('should return a valid tile buffer', async function () {
      const { z, x, y } = getDefaultTile();

      const getTilePromise = tileManager.getTile(z, x, y);

      const expectedTileBuffer = await getTestTileBuffer(256);
      await expect(getTilePromise).resolves.toMatchObject(expectedTileBuffer);
    });

    it('should return a valid x2 tile buffer', async function () {
      const { z, x, y } = getDefaultTile();

      const getTilePromise = tileManager2x.getTile(z, x, y);

      const expectedTileBuffer = await getTestTileBuffer(512);
      await expect(getTilePromise).resolves.toMatchObject(expectedTileBuffer);
    });

    it.each([
      [{ z: appConfig.zoom.min - 1, x: 0, y: 0 }],
      [{ z: 0, x: -1, y: 0 }],
      [{ z: 0, x: 0, y: -1 }],
      [{ z: appConfig.zoom.max + 1, x: 0, y: 0 }],
      [{ z: 0, x: 2, y: 0 }],
      [{ z: 0, x: 0, y: 2 }],
    ])('should throw out of bounds error for the tile scheme %s', async function (tileScheme: TileScheme) {
      const { z, x, y } = tileScheme;
      const getTilePromise = tileManager.getTile(z, x, y);

      await expect(getTilePromise).rejects.toThrow(OutOfBoundsError);
    });

    it('should throw error when failing to initialize request', async function () {
      const { z, x, y } = getDefaultTile();
      const getTilePromise = sadTileManager.getTile(z, x, y);

      await expect(getTilePromise).rejects.toThrow('failed');
    });
  });
});
