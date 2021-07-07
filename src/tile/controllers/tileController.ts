import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';

import { PNG_CONTENT_TYPE, Services } from '../../common/constants';
import { IGlobalConfig, RequestHandler } from '../../common/interfaces';
import { HttpError, OutOfBoundsError, BadRequestError } from '../../common/errors';
import { TileManager } from '../models/tileManager';

type GetTileHandler = RequestHandler<GetTileParams>;

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
    let tileBuffer: Buffer;
    try {
      const { x, y, z } = request.params;
      const [xNum, yNum, zNum] = [x, y, z].map((value) => +value);

      tileBuffer = await this.manager.getTile(zNum, xNum, yNum);
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof OutOfBoundsError) {
        (error as HttpError).statusCode = httpStatus.BAD_REQUEST;
      }
      throw error;
    }

    return reply.code(httpStatus.OK).type(PNG_CONTENT_TYPE).send(tileBuffer);
  };
}
