import config from 'config';
import jsLogger from '@map-colonies/js-logger';

import { TileManager } from '../../../../src/tile/models/tileManager';
import { RenderHandler } from '../../../../src/tile/models/renderHandler';
import { getMockedGlobalConfig, getTestTileBuffer } from '../../../helpers';
import { IApplicationConfig } from '../../../../src/common/interfaces';
import { OutOfBoundsError } from '../../../../src/common/errors';
import { getDefaultTile, TileScheme } from '../helpers';

let tileManager: TileManager;
let sadTileManager: TileManager;
let renderHandler: RenderHandler;
let tileBuffer: Buffer;

const applicationConfig = config.get<IApplicationConfig>('application');

describe('tileManager', () => {
  beforeAll(async function () {
    tileBuffer = await getTestTileBuffer();
    const mockLogger = jsLogger({ enabled: false });
    renderHandler = new RenderHandler(mockLogger);
    tileManager = new TileManager(mockLogger, applicationConfig, await getMockedGlobalConfig(), renderHandler);
    sadTileManager = new TileManager(mockLogger, applicationConfig, await getMockedGlobalConfig(true), renderHandler);
  });
  afterAll(function () {
    tileManager.shutdown();
    sadTileManager.shutdown();
  });
  describe('#getTile', () => {
    it('should return a valid tile buffer', async function () {
      const { z, x, y } = getDefaultTile();

      const getTilePromise = tileManager.getTile(z, x, y);

      await expect(getTilePromise).resolves.toMatchObject(tileBuffer);
    });

    it.each([
      [{ z: applicationConfig.zoom.min - 1, x: 0, y: 0 }],
      [{ z: 0, x: -1, y: 0 }],
      [{ z: 0, x: 0, y: -1 }],
      [{ z: applicationConfig.zoom.max + 1, x: 0, y: 0 }],
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

      await expect(getTilePromise).rejects.toThrow('failed to initialize request');
    });
  });
});
