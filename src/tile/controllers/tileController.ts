import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';

import { Services } from '../../common/constants';
import { IGlobalConfig, RequestHandler } from '../../common/interfaces';
import { HttpError, OutOfBoundsError } from '../../common/errors';
import { TileManager } from '../models/tileManager';

interface GetTileParams {
  z: string;
  x: string;
  y: string;
}

type GetTileHandler = RequestHandler<GetTileParams>;

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

    let tileBuffer = {};
    try {
      tileBuffer = await this.manager.getTile(zNum, xNum, yNum);
    } catch (error) {
      if (error instanceof OutOfBoundsError) {
        (error as HttpError).statusCode = httpStatus.BAD_REQUEST;
      }
      throw error;
    }

    return reply.code(httpStatus.OK).header('Last-Modified', this.global.appInitTime).type('image/png').send(tileBuffer);
  };
}
