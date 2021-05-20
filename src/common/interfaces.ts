import { FastifyReply, FastifyRequest } from 'fastify';

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

interface ParsedQs {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[];
}

export interface RequestHandler<Params = { [key: string]: string }, ReqBody = any, ReqQuery = ParsedQs> {
  (request: FastifyRequest<{ Params: Params; Body: ReqBody; Querystring: ReqQuery }>, reply: FastifyReply): void;
}
