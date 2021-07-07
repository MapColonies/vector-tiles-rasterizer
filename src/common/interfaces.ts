import { FastifyInstance, FastifyReply, FastifyRequest, HookHandlerDoneFunction, RegisterOptions } from 'fastify';

interface ParsedQs {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[];
}

export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}

export interface IServerConfig {
  port: string;
}

export interface IGlobalConfig {
  styleContent: unknown;
}

export interface IApplicationConfig {
  styleFilePath: string;
  tileSize: number;
  ratio: number;
  poolResources: {
    min: number;
    max: number;
  };
  zoom: {
    min: number;
    max: number;
  };
  cachePeriod: number;
}

export interface ITestsConfig {
  enabled: boolean;
  poolInactivityClose?: number;
}

export interface RequestHandler<Params = { [key: string]: string }, ReqBody = unknown, ReqQuery = ParsedQs> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  (request: FastifyRequest<{ Params: Params; Body: ReqBody; Querystring: ReqQuery }>, reply: FastifyReply): void;
}

export interface FastifyPluginRegister {
  (fastify: FastifyInstance, options: RegisterOptions, done: HookHandlerDoneFunction): void;
}
