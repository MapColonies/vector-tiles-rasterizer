import { FastifyReply, FastifyRequest } from 'fastify';
import httpStatus from 'http-status-codes';

export const onSendHookWrapper = (cachePeriod: number) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<undefined> => {
    if (reply.statusCode === httpStatus.OK) {
      return reply.header('Cache-Control', `public, max-age=${cachePeriod}, must-revalidate`);
    }
  };
};
