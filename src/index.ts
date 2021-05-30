// this import must be called before the first import of tsyring
import 'reflect-metadata';
import { Logger } from '@map-colonies/js-logger';
import { createTerminus } from '@godaddy/terminus';
import { container } from 'tsyringe';
import { get } from 'config';

import { IServerConfig } from './common/interfaces';
import { DEFAULT_SERVER_PORT, Services } from './common/constants';
import { getApp } from './app';

const serverConfig = get<IServerConfig>('server');
const port: number = parseInt(serverConfig.port) || DEFAULT_SERVER_PORT;
let logger: Logger | null;

const stubHealthcheck = async (): Promise<void> => Promise.resolve();

async function initializeApp(): Promise<void> {
  const app = await getApp();
  createTerminus(app.server, { healthChecks: { '/liveness': stubHealthcheck } });
  await app.listen(port);
}

void initializeApp()
  .then(() => {
    logger = container.resolve<Logger>(Services.LOGGER);
    logger.info(`app started on port ${port}`);
  })
  .catch((error: Error) => {
    const failedMessage = '😢 - failed initializing the server';
    if (logger) {
      logger.error(failedMessage);
      logger.error(error.message);
    }
    console.error(failedMessage);
    console.error(error.message);
  });
