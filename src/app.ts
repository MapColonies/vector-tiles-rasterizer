import { container } from 'tsyringe';
import { Application } from 'express';
import { Tracing } from '@map-colonies/telemetry';
import { registerExternalValues } from './containerConfig';
import { ServerBuilder } from './serverBuilder';

function getApp(tracing: Tracing): Application {
  registerExternalValues(tracing);
  const app = container.resolve(ServerBuilder).build();
  return app;
}

export { getApp };
