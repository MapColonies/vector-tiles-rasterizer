import { container } from 'tsyringe';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { Services } from '../../src/common/constants';
import { IApplicationConfig } from '../../src/common/interfaces';
import { getMockedGlobalConfig } from '../helpers';

const DEFAULT_TILE_SIZE = config.get<number>('application.tileSize');

async function registerTestValues(shouldRegisterSadStyle: boolean, overrideTileSize = DEFAULT_TILE_SIZE): Promise<void> {
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: jsLogger({ enabled: false }) });

  const appConfig = config.get<IApplicationConfig>('application');
  container.register(Services.APPLICATION, { useValue: { ...appConfig, tileSize: overrideTileSize } });

  container.register(Services.GLOBAL, { useValue: await getMockedGlobalConfig(shouldRegisterSadStyle) });
}

export { registerTestValues };
