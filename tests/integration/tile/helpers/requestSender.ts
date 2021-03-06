import * as supertest from 'supertest';
import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { ServerBuilder } from '../../../../src/serverBuilder';
import { GetTileParams } from '../../../../src/tile/controllers/tileController';

interface RequestCacheHeaders {
  cacheControl?: string;
}

export async function getApp(): Promise<FastifyInstance> {
  const builder = container.resolve<ServerBuilder>(ServerBuilder);
  const app = await builder.build();
  await app.ready();
  return app;
}

export async function getTile(
  app: FastifyInstance,
  params: GetTileParams,
  requestCacheHeaders: RequestCacheHeaders | undefined = undefined
): Promise<supertest.Test> {
  const { z, x, y } = params;
  let testRequest = supertest.agent(app.server).get(`/${z}/${x}/${y}.png`);

  if (requestCacheHeaders?.cacheControl != undefined) {
    testRequest = testRequest.set('cache-control', requestCacheHeaders.cacheControl);
  }

  return testRequest;
}
