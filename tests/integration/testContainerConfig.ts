import { container } from 'tsyringe';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { Services } from '../../src/common/constants';
import { IApplicationConfig } from '../../src/common/interfaces';
import { getMockedGlobalConfig } from '../helpers';

async function registerTestValues(): Promise<void> {
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: jsLogger({ enabled: false }) });

  const applicationConfig = config.get<IApplicationConfig>('application');
  container.register(Services.APPLICATION, { useValue: applicationConfig });

  const globalConfig = await getMockedGlobalConfig();
  container.register(Services.GLOBAL, { useValue: globalConfig });
}

export { registerTestValues };
