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

const app = getApp();

const logger = container.resolve<Logger>(Services.LOGGER);
const stubHealthcheck = async (): Promise<void> => Promise.resolve();
createTerminus(app.server, { healthChecks: { '/liveness': stubHealthcheck, onSignal: container.resolve('onSignal') } });

app.listen(port, () => {
  logger.info(`app started on port ${port}`);
});
