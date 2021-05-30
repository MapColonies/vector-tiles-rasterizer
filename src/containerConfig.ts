import { container } from 'tsyringe';
import config from 'config';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { Services } from './common/constants';
import { IApplicationConfig, IGlobalConfig } from './common/interfaces';

function registerExternalValues(): void {
  const loggerConfig = config.get<LoggerOptions>('logger');
  const logger = jsLogger({ ...loggerConfig, prettyPrint: false });
  container.register(Services.LOGGER, { useValue: logger });

  container.register(Services.CONFIG, { useValue: config });

  const applicationConfig = config.get<IApplicationConfig>('application');
  container.register(Services.APPLICATION, { useValue: applicationConfig });

  const global: IGlobalConfig = {
    appInitTime: new Date().toUTCString(),
  };
  container.register(Services.GLOBAL, { useValue: global });
}

export { registerExternalValues };
