import { fastify, FastifyInstance, HookHandlerDoneFunction, RegisterOptions } from 'fastify';
import { inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import * as secureJsonParse from 'secure-json-parse';
import fastifyCompression, { FastifyCompressOptions } from 'fastify-compress';
import { FastifyStaticSwaggerOptions, fastifySwagger } from 'fastify-swagger';
import httpStatus from 'http-status-codes';
import { Services } from './common/constants';
import { IConfig, OpenApiConfig, RequestHandler } from './common/interfaces';
import { resourceNameRoutesRegistry } from './resourceName/routes/resourceNameRouter';
import { FastifyBodyParserOptions } from './common/types';

@injectable()
export class ServerBuilder {
  private readonly serverInstance: FastifyInstance;

  public constructor(@inject(Services.CONFIG) private readonly config: IConfig, @inject(Services.LOGGER) private readonly logger: Logger) {
    this.serverInstance = fastify();
  }

  public build(): FastifyInstance {
    this.registerPreRoutesMiddleware();
    this.buildRoutes();

    return this.serverInstance;
  }

  private registerPreRoutesMiddleware(): void {
    if (this.config.get<boolean>('server.response.compression.enabled')) {
      const compressionOptions = this.config.get<FastifyCompressOptions>('server.response.compression.options');
      this.serverInstance.register(fastifyCompression, compressionOptions);
    }

    const bodyParserOptions = this.config.get<FastifyBodyParserOptions>('server.request.payload');

    this.serverInstance.addContentTypeParser('application/json', bodyParserOptions, (req, body: string | Buffer, done) => {
      let json;
      try {
        json = secureJsonParse.parse(body);
      } catch (err) {
        err.statusCode = 400;
        return done(err, undefined);
      }
      done(null, json);
    });
  }

  private buildRoutes(): void {
    this.buildProbeRoutes();
    this.serverInstance.register(resourceNameRoutesRegistry, { prefix: '/resourceName' });
    this.buildDocsRoutes();
  }

  private buildDocsRoutes(): void {
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

    this.serverInstance.register(fastifySwagger, swaggerOptions);
  }

  private buildProbeRoutes(): void {
    this.serverInstance.register(this.healthCheckPlugin);
  }

  private readonly healthCheckPlugin = (fastify: FastifyInstance, _: RegisterOptions, done: HookHandlerDoneFunction) => {
    fastify.get('/liveness', healthcheckHandler);
    done();
  };
}

const healthcheckHandler: RequestHandler = (request, reply) => {
  stubHealthcheck();
  return reply.status(httpStatus.OK).send(':D');
};

const stubHealthcheck = async (): Promise<void> => Promise.resolve();
