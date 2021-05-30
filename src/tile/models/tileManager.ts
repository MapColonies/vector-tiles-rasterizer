/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Logger } from '@map-colonies/js-logger';
import SphericalMercator from '@mapbox/sphericalmercator';
import { inject, injectable } from 'tsyringe';
import sharp from 'sharp';
import { Pool } from 'advanced-pool';

import { Map, RenderParams } from '@naturalatlas/mapbox-gl-native';
import { Services } from '../../common/constants';
import { OutOfBoundsError } from '../../common/errors';
import { IApplicationConfig } from '../../common/interfaces';
import { RenderHandler } from './renderHandler';

@injectable()
export class TileManager {
  private loadedStyle = {};
  private readonly renderersPool: Pool<Map>;

  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.APPLICATION) private readonly application: IApplicationConfig,
    @inject(RenderHandler) private readonly renderHandler: RenderHandler
  ) {
    const { styleFilePath, ratio, resources } = this.application;
    this.loadStyle(styleFilePath);
    this.renderersPool = this.createPool(ratio, resources.min, resources.max);
  }

  public async getTile(z: number, x: number, y: number): Promise<Buffer> {
    const { zoom, tileSize } = this.application;
    if (z < zoom.min || x < 0 || y < 0 || z > zoom.max || x >= Math.pow(2, z) || y >= Math.pow(2, z)) {
      throw new OutOfBoundsError(`tile request for z: ${z}, x: ${x}, y: ${y} is out of bounds.`);
    }

    const [lon, lat] = new SphericalMercator({ size: tileSize }).ll(
      [((x + 0.5) / (1 << z)) * (tileSize << z), ((y + 0.5) / (1 << z)) * (tileSize << z)],
      z
    );

    return this.renderImageWrapper(z, lon, lat);
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
      const { tileSize, zoom: zoomSettings } = this.application;
      const params: RenderParams = {
        zoom: Math.max(zoomSettings.min, zoom - 1),
        center: [lon, lat],
        width: tileSize,
        height: tileSize,
      };

      renderer.render(params, (error, buffer) => {
        this.renderersPool.release(renderer);
        if (error) {
          return errorCallback(error);
        }

        for (let i = 0; i < buffer.length; i += 4) {
          const alpha = buffer[i + 3];
          const norm = alpha / 255;
          if (alpha === 0) {
            buffer[i] = 0;
            buffer[i + 1] = 0;
            buffer[i + 2] = 0;
          } else {
            buffer[i] = buffer[i] / norm;
            buffer[i + 1] = buffer[i + 1] / norm;
            buffer[i + 2] = buffer[i + 2] / norm;
          }
        }

        sharp(buffer, {
          raw: {
            width: params.width as number,
            height: params.height as number,
            channels: 4,
          },
        })
          .png({ adaptiveFiltering: false })
          .toBuffer({ resolveWithObject: false })
          .then(successCallback)
          .catch(errorCallback);
      });
    });
  }

  private createPool(ratio: number, minResources: number, maxResources: number): Pool<Map> {
    const createRenderer = (ratio: number, createCallback: (err: Error | null, renderer: Map) => void): void => {
      const renderer = new Map({ ...this.renderHandler.renderOptions, ratio });
      renderer.load(this.loadedStyle);
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

  private loadStyle(styleFilePath: string): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.loadedStyle = require(styleFilePath) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`could not find provided style path: ${styleFilePath}.`);
    }
  }
}
