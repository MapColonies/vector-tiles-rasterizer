import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { lookup } from 'mime-types';

import { Services } from '../../common/constants';
import { IGlobalConfig, RequestHandler } from '../../common/interfaces';
import { HttpError, OutOfBoundsError } from '../../common/errors';
import { TileManager } from '../models/tileManager';

type GetTileHandler = RequestHandler<GetTileParams>;
const mimeType = lookup('png') as string;

export interface GetTileParams {
  z: string;
  x: string;
  y: string;
}

@injectable()
export class TileController {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(TileManager) private readonly manager: TileManager,
    @inject(Services.GLOBAL) private readonly global: IGlobalConfig
  ) {}

  public getTile: GetTileHandler = async (request, reply) => {
    const { x, y, z } = request.params;
    const [xNum, yNum, zNum] = [x, y, z].map((value) => +value);

    let tileBuffer: Buffer;
    try {
      tileBuffer = await this.manager.getTile(zNum, xNum, yNum);
    } catch (error) {
      if (error instanceof OutOfBoundsError) {
        (error as HttpError).statusCode = httpStatus.BAD_REQUEST;
      }
      throw error;
    }

    return reply.code(httpStatus.OK).header('Last-Modified', this.global.appInitTime).type(mimeType).send(tileBuffer);
  };
}
