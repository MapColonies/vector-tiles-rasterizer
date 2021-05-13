import express from 'express';
import { fastify, FastifyInstance } from 'fastify';
import bodyParser from 'body-parser';
import { OpenapiViewerRouter, OpenapiRouterConfig } from '@map-colonies/openapi-express-viewer';
import { container, inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { Services } from './common/constants';
import { IConfig } from './common/interfaces';
// import resourceNameRouter from './resourceName/routes/resourceNameRouter';
import fastifyCompression, { FastifyCompressOptions } from 'fastify-compress';

@injectable()
export class ServerBuilder {
  private readonly serverInstance: FastifyInstance;

  public constructor(@inject(Services.CONFIG) private readonly config: IConfig, @inject(Services.LOGGER) private readonly logger: Logger) {
    this.serverInstance = fastify();
  }

  public build(): FastifyInstance {
    this.registerPreRoutesMiddleware();
    this.buildRoutes();
    this.registerPostRoutesMiddleware();

    return this.serverInstance;
  }

  // private buildDocsRoutes(): void {
  //   const openapiRouter = new OpenapiViewerRouter(this.config.get<OpenapiRouterConfig>('openapiConfig'));
  //   openapiRouter.setup();
  //   this.serverInstance.use(this.config.get<string>('openapiConfig.basePath'), openapiRouter.getRouter());
  // }

  private buildRoutes(): void {
    // this.serverInstance.route('/resourceName', resourceNameRouterFactory(container));
    // this.serverInstance.register(resourceNameRouter, { prefix: '/resourceName' });
    // this.buildDocsRoutes();
  }

  private registerPreRoutesMiddleware(): void {
    if (this.config.get<boolean>('server.response.compression.enabled')) {
      // this.serverInstance.use(compression(this.config.get<compression.CompressionFilter>('server.response.compression.options')));
      const compressionOptions = this.config.get<FastifyCompressOptions>('server.response.compression.options');
      this.serverInstance.register(fastifyCompression, compressionOptions);
    }

    const bodyParserOptions = this.config.get<bodyParser.Options>('server.request.payload');

    const jsonParser = bodyParser.json(bodyParserOptions);
    // this.serverInstance.register(bodyParser, bodyParserOptions);

    const ignorePathRegex = new RegExp(`^${this.config.get<string>('openapiConfig.basePath')}/.*`, 'i');
    const apiSpecPath = this.config.get<string>('openapiConfig.filePath');
    // this.serverInstance.use(OpenApiMiddleware({ apiSpec: apiSpecPath, validateRequests: true, ignorePaths: ignorePathRegex }));
  }

  private registerPostRoutesMiddleware(): void {}
}
