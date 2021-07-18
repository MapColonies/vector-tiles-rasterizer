import { fastify, FastifyInstance } from 'fastify';
import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import fastifyCompression, { FastifyCompressOptions } from 'fastify-compress';
import { FastifyStaticSwaggerOptions, fastifySwagger } from 'fastify-swagger';

import { Services } from './common/constants';
import { IConfig, OpenApiConfig } from './common/interfaces';
import { tileRoutesRegistry } from './tile/routes/tileRouter';
import { FastifyBodyParserOptions } from './common/types';
import { jsonParserHook } from './common/hooks/jsonParser';
import { onSendHookWrapper } from './common/hooks/onSend';
import { onCloseHookWrapper } from './common/hooks/onClose';
import { TileManager } from './tile/models/tileManager';

@injectable()
export class ServerBuilder {
  private readonly serverInstance: FastifyInstance;

  public constructor(
    @inject(Services.CONFIG) private readonly config: IConfig,
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(TileManager) private readonly manager: TileManager
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
    this.serverInstance.addContentTypeParser('application/json', bodyParserOptions, jsonParserHook);
  }

  private buildHooks(): void {
    const cachePeriod = this.config.get<number>('server.response.headers.cachePeriod');
    this.serverInstance.addHook('onSend', onSendHookWrapper(cachePeriod));
    this.serverInstance.addHook('onClose', onCloseHookWrapper(this.manager));
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
}
