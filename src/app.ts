import { container } from 'tsyringe';
import { FastifyInstance } from 'fastify';
import { registerExternalValues } from './containerConfig';
import { ServerBuilder } from './serverBuilder';

function getApp(): FastifyInstance {
  registerExternalValues();
  const app = container.resolve(ServerBuilder).build();
  return app;
}

export { getApp };
