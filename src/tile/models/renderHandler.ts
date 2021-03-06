import { IncomingHttpHeaders } from 'http';
import { Readable } from 'stream';
import { URL } from 'url';
import { gunzip } from 'zlib';
import { promisify } from 'util';
import { inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import axios, { AxiosResponse } from 'axios';
import httpStatus from 'http-status-codes';
import { RenderOptions, RequestCallback, RenderRequset, RenderResponse } from '@naturalatlas/mapbox-gl-native';

import { NotFoundError, RequestFailedError } from '../../common/errors';
import { Services } from '../../common/constants';
import { IApplicationConfig } from '../../common/interfaces';

const EMPTY_BUFFER = Buffer.alloc(0);

const promisifyGunzip = promisify(gunzip);

@injectable()
export class RenderHandler {
  private readonly ratio: number;
  private readonly request: (req: RenderRequset, callback: RequestCallback) => void;

  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.APPLICATION) private readonly appConfig: IApplicationConfig
  ) {
    this.ratio = this.appConfig.ratio;
    this.request = (req: RenderRequset, callback: RequestCallback): void => {
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
    };
  }

  public getRenderOptions = (): RenderOptions => {
    return {
      request: this.request,
      ratio: this.ratio,
    };
  };

  private async asyncRequestHandler(req: RenderRequset): Promise<RenderResponse> {
    const url = new URL(req.url);
    const method = 'GET';
    let responseData: AxiosResponse<Readable>;
    try {
      responseData = await axios.request<Readable>({ method, baseURL: url.origin, url: url.pathname, responseType: 'stream' });
    } catch (err) {
      throw new RequestFailedError(`requesting ${req.url} has failed.`);
    }

    const renderResponse: RenderResponse = { data: EMPTY_BUFFER };

    const { status, data } = responseData;

    if (status < httpStatus.OK || status >= httpStatus.MULTIPLE_CHOICES) {
      if (status === httpStatus.NOT_FOUND) {
        throw new NotFoundError(`could not find resource type ${req.kind} in ${req.url} recieved status code of ${status}.`);
      }
      throw new Error(`request for ${req.url} failed with status code of ${status}.`);
    }

    const chuncksArr: Uint8Array[] = [];
    for await (const chunk of data) {
      chuncksArr.push(chunk);
    }

    renderResponse.data = Buffer.concat(chuncksArr);

    const headers = responseData.headers as IncomingHttpHeaders;
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
