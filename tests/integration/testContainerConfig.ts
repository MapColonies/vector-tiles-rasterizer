import { container } from 'tsyringe';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { Services } from '../../src/common/constants';
import { IApplicationConfig } from '../../src/common/interfaces';
import { getMockedGlobalConfig } from '../helpers';

async function registerTestValues(shouldRegisterSadStyle: boolean): Promise<void> {
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: jsLogger({ enabled: false }) });

  const applicationConfig = config.get<IApplicationConfig>('application');
  container.register(Services.APPLICATION, { useValue: applicationConfig });

  container.register(Services.GLOBAL, { useValue: await getMockedGlobalConfig(shouldRegisterSadStyle) });
}

export { registerTestValues };
