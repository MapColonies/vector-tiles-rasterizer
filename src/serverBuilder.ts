import { fastify, FastifyInstance } from 'fastify';
import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import * as secureJsonParse from 'secure-json-parse';
import fastifyCompression, { FastifyCompressOptions } from 'fastify-compress';
import { FastifyStaticSwaggerOptions, fastifySwagger } from 'fastify-swagger';
import httpStatus from 'http-status-codes';
import { Services } from './common/constants';
import { IConfig, IGlobalConfig, OpenApiConfig } from './common/interfaces';
import { tileRoutesRegistry } from './tile/routes/tileRouter';
import { FastifyBodyParserOptions } from './common/types';
import { HttpError } from './common/errors';

@injectable()
export class ServerBuilder {
  private readonly serverInstance: FastifyInstance;

  public constructor(
    @inject(Services.CONFIG) private readonly config: IConfig,
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.GLOBAL) private readonly global: IGlobalConfig
  ) {
    this.serverInstance = fastify();
  }

  public async build(): Promise<FastifyInstance> {
    await this.registerPreRoutesMiddleware();
    this.buildHooks();
    await this.buildRoutes();

    return this.serverInstance;
  }

  private async registerPreRoutesMiddleware(): Promise<void> {
    if (this.config.get<boolean>('server.response.compression.enabled')) {
      const compressionOptions = this.config.get<FastifyCompressOptions>('server.response.compression.options');
      await this.serverInstance.register(fastifyCompression, compressionOptions);
    }

    const bodyParserOptions = this.config.get<FastifyBodyParserOptions>('server.request.payload');

    this.serverInstance.addContentTypeParser('application/json', bodyParserOptions, (req, body: string | Buffer, done) => {
      let json;
      try {
        // json must be of type any
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        json = secureJsonParse.parse(body);
      } catch (error) {
        (error as HttpError).statusCode = httpStatus.BAD_REQUEST;
        return done(error, undefined);
      }
      done(null, json);
    });
  }

  private async buildRoutes(): Promise<void> {
    await this.serverInstance.register(tileRoutesRegistry);
    await this.buildDocsRoutes();
  }

  private async buildDocsRoutes(): Promise<void> {
    const { filePath, basePath, uiPath } = this.config.get<OpenApiConfig>('openapiConfig');

    const swaggerOptions: FastifyStaticSwaggerOptions = {
      mode: 'static',
      specification: {
        path: filePath,
        baseDir: '',
      },
      routePrefix: basePath + uiPath,
      exposeRoute: true,
    };

    await this.serverInstance.register(fastifySwagger, swaggerOptions);
  }

  private buildHooks(): void {
    this.serverInstance.addHook('onRequest', async (request, reply) => {
      const modifiedSince = request.headers['if-modified-since'];
      const cacheControl = request.headers['cache-control'];
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      if (modifiedSince !== undefined && (cacheControl === undefined || cacheControl.indexOf('no-cache') === -1)) {
        if (new Date(this.global.appInitTime) <= new Date(modifiedSince)) {
          return reply.code(httpStatus.NOT_MODIFIED).send();
        }
      }
    });
  }
}
