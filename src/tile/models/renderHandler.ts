import { URL } from 'url';
import { gunzip } from 'zlib';
import { promisify } from 'util';
import { inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { Client } from 'undici';
import httpStatus from 'http-status-codes';

import { RenderOptions, RequestCallback, RenderRequset, RenderResponse } from '@naturalatlas/mapbox-gl-native';
import { NotFoundError, RequestFailedError } from '../../common/errors';
import { Services } from '../../common/constants';

const DEFAULT_RATIO = 1;
const EMPTY_BUFFER = Buffer.alloc(0);

const promisifyGunzip = promisify(gunzip);

@injectable()
export class RenderHandler {
  public renderOptions: RenderOptions = {
    ratio: DEFAULT_RATIO,
    request: (req: RenderRequset, callback: RequestCallback): void => {
      this.asyncRequestHandler(req)
        .then((renderResponse) => {
          callback(null, renderResponse);
        })
        .catch((err) => {
          if (err instanceof RequestFailedError || err instanceof NotFoundError) {
            this.logger.error(err.message);
          }
          callback(err);
        });
    },
  };

  public constructor(@inject(Services.LOGGER) private readonly logger: Logger) {}

  private async asyncRequestHandler(req: RenderRequset): Promise<RenderResponse> {
    const url = new URL(req.url);
    const client = new Client(url.origin);
    const method = 'GET';
    let responseData;
    try {
      responseData = await client.request({ path: url.pathname, method });
    } catch {
      throw new RequestFailedError(`failed to initialize request for ${req.url}.`);
    }

    const renderResponse: RenderResponse = { data: EMPTY_BUFFER };

    const { statusCode, body, headers } = responseData;

    if (statusCode < httpStatus.OK || statusCode >= httpStatus.MULTIPLE_CHOICES) {
      if (statusCode === httpStatus.NOT_FOUND) {
        throw new NotFoundError(`could not find resource type ${req.kind} in ${req.url} recieved status code of ${statusCode}.`);
      }
      throw new Error(`request for ${req.url} failed with status code of ${statusCode}.`);
    }

    const chuncksArr: Uint8Array[] = [];
    for await (const chunk of body) {
      chuncksArr.push(chunk);
    }

    renderResponse.data = Buffer.concat(chuncksArr);

    if (headers['content-encoding'] === 'gzip') {
      renderResponse.data = await promisifyGunzip(renderResponse.data);
    }
    if (headers['last-modified'] !== undefined) {
      renderResponse.modified = new Date(headers['last-modified']);
    }
    if (headers.expires !== undefined) {
      renderResponse.expires = new Date(headers.expires);
    }
    if (headers.etag !== undefined) {
      renderResponse.etag = headers.etag;
    }

    return renderResponse;
  }
}
