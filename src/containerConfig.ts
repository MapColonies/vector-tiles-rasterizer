import { container } from 'tsyringe';
import config from 'config';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { Services } from './common/constants';

function registerExternalValues(): void {
  const loggerConfig = config.get<LoggerOptions>('logger');
  const logger = jsLogger({ ...loggerConfig, prettyPrint: false });
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: logger });
  container.register('onSignal', {
    useValue: async (): Promise<void> => {
      await Promise.resolve();
    },
  });
}

export { registerExternalValues };
