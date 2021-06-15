import { get } from 'config';
import { Logger } from '@map-colonies/js-logger';
import SphericalMercator from '@mapbox/sphericalmercator';
import { inject, injectable } from 'tsyringe';
import sharp from 'sharp';
import { Pool } from 'advanced-pool';

import { Map, RenderParams } from '@naturalatlas/mapbox-gl-native';
import { Services, POWERS_OF_TWO_PER_ZOOM_LEVEL } from '../../common/constants';
import { OutOfBoundsError } from '../../common/errors';
import { IApplicationConfig, IGlobalConfig } from '../../common/interfaces';
import { RenderHandler } from './renderHandler';

const DEFAULT_TILE_SIZE = 256;
const HALF_TILE = 0.5;

const NUM_OF_CHANNELS_IN_BUFFER = 4;
const MAX_ALPHA_VALUE = 255;
const BLACK = 0;
enum BufferChannel {
  RED,
  GREEN,
  BLUE,
  ALPHA,
}

const zoomSettings = get<{ min: number; max: number }>('application.zoom');

const isZoomValid = (z: number): boolean => {
  return z >= zoomSettings.min && z <= zoomSettings.max;
};

const isAxisTileValid = (axisTileNumber: number, z: number): boolean => {
  return axisTileNumber >= 0 && axisTileNumber <= POWERS_OF_TWO_PER_ZOOM_LEVEL[z];
};

const isTileInBounds = (z: number, x: number, y: number): boolean => {
  return isZoomValid(z) && isAxisTileValid(x, z) && isAxisTileValid(y, z);
};

@injectable()
export class TileManager {
  private readonly renderersPool: Pool<Map>;
  private readonly sphericalMercatorHelper: SphericalMercator;

  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.APPLICATION) private readonly application: IApplicationConfig,
    @inject(Services.GLOBAL) private readonly global: IGlobalConfig,
    @inject(RenderHandler) private readonly renderHandler: RenderHandler
  ) {
    const { ratio, poolResources, tileSize } = this.application;
    this.renderersPool = this.createPool(ratio, poolResources.min, poolResources.max);
    this.sphericalMercatorHelper = new SphericalMercator({ size: tileSize });
  }

  public async getTile(z: number, x: number, y: number): Promise<Buffer> {
    if (!isTileInBounds(z, x, y)) {
      throw new OutOfBoundsError(`tile request for z: ${z}, x: ${x}, y: ${y} is out of bounds.`);
    }

    const { tileSize } = this.application;

    // move half tile to the center
    const xAxisPixelsFromCenter = (x + HALF_TILE) * tileSize;
    const yAxisPixelsFromCenter = (y + HALF_TILE) * tileSize;

    // get the coordinates from the pixels from center of the tile and the zoom level
    const [lon, lat] = this.sphericalMercatorHelper.ll([xAxisPixelsFromCenter, yAxisPixelsFromCenter], z);

    return this.renderImageWrapper(z, lon, lat);
  }

  public closePool(): void {
    this.renderersPool.close();
  }

  private async renderImageWrapper(zoom: number, lon: number, lat: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.renderImage(
        zoom,
        lon,
        lat,
        (successResponse: Buffer) => {
          resolve(successResponse);
        },
        (errorResponse: Error) => {
          reject(errorResponse);
        }
      );
    });
  }

  private renderImage(zoom: number, lon: number, lat: number, successCallback: (buffer: Buffer) => void, errorCallback: (err: Error) => void): void {
    this.renderersPool.acquire((error: Error | null, renderer: Map) => {
      if (error) {
        errorCallback(error);
      }

      const params = this.getRenderParams(zoom, lon, lat);

      renderer.render(params, (error, buffer) => {
        this.renderersPool.release(renderer);

        if (error) {
          return errorCallback(error);
        }

        this.removeSemiTransparentOutlinesOnBuffer(buffer);

        sharp(buffer, {
          raw: {
            width: params.width as number,
            height: params.height as number,
            channels: NUM_OF_CHANNELS_IN_BUFFER,
          },
        })
          .png({ adaptiveFiltering: false })
          .toBuffer({ resolveWithObject: false })
          .then(successCallback)
          .catch(errorCallback);
      });
    });
  }

  private getRenderParams(zoom: number, lon: number, lat: number): RenderParams {
    const { tileSize, zoom: zoomSettings } = this.application;
    return {
      zoom: Math.max(zoomSettings.min, tileSize === DEFAULT_TILE_SIZE ? zoom - 1 : zoom),
      center: [lon, lat],
      width: tileSize,
      height: tileSize,
    };
  }

  private removeSemiTransparentOutlinesOnBuffer(buffer: Buffer): void {
    for (let i = 0; i < buffer.length; i += NUM_OF_CHANNELS_IN_BUFFER) {
      const alpha = buffer[i + BufferChannel.ALPHA];
      if (alpha === MAX_ALPHA_VALUE) {
        continue;
      }
      const norm = alpha / MAX_ALPHA_VALUE;

      // if fully-transparent change to black, otherwise normalize the color
      if (alpha === 0) {
        buffer[i + BufferChannel.RED] = BLACK;
        buffer[i + BufferChannel.GREEN] = BLACK;
        buffer[i + BufferChannel.BLUE] = BLACK;
      } else {
        buffer[i + BufferChannel.RED] /= norm;
        buffer[i + BufferChannel.GREEN] /= norm;
        buffer[i + BufferChannel.BLUE] /= norm;
      }
    }
  }

  private createPool(ratio: number, minResources: number, maxResources: number): Pool<Map> {
    const createRenderer = (ratio: number, createCallback: (err: Error | null, renderer: Map) => void): void => {
      const renderer = new Map({ ...this.renderHandler.renderOptions, ratio });
      renderer.load(this.global.styleContent);
      createCallback(null, renderer);
    };
    return new Pool({
      min: minResources,
      max: maxResources,
      create: createRenderer.bind(null, ratio),
      destroy: (renderer: Map): void => {
        renderer.release();
      },
    });
  }
}
