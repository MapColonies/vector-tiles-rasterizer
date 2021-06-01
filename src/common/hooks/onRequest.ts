import { FastifyReply, FastifyRequest } from 'fastify';
import httpStatus from 'http-status-codes';

const NO_CACHE_NOT_FOUND_VALUE = -1;

export const onRequestHookWrapper = (appInitTime: string) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<undefined> => {
    const modifiedSince = request.headers['if-modified-since'];
    const cacheControl = request.headers['cache-control'];
    if (modifiedSince !== undefined && (cacheControl === undefined || cacheControl.indexOf('no-cache') === NO_CACHE_NOT_FOUND_VALUE)) {
      if (new Date(appInitTime) <= new Date(modifiedSince)) {
        return reply.code(httpStatus.NOT_MODIFIED).send();
      }
    }
  };
};
