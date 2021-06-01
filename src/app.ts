import { container } from 'tsyringe';
import { FastifyInstance } from 'fastify';
import { registerExternalValues } from './containerConfig';
import { ServerBuilder } from './serverBuilder';

async function getApp(): Promise<FastifyInstance> {
  await registerExternalValues();
  const app = await container.resolve(ServerBuilder).build();
  return app;
}

export { getApp };
