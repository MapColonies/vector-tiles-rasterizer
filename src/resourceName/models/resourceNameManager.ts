import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';

const resourceInstance: IResourceNameModel = {
  id: 1,
  name: 'ronin',
  description: 'can you do a logistics run?',
};

function generateRandomId(): number {
  const rangeOfIds = 100;
  return Math.floor(Math.random() * rangeOfIds);
}
export interface IResourceNameModel {
  id?: number;
  name: string;
  description: string;
}

@injectable()
export class ResourceNameManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: Logger) {}
  public getResource(): IResourceNameModel {
    this.logger.info('loggging');
    return resourceInstance;
  }
  public createResource(resource: IResourceNameModel): IResourceNameModel {
    return { id: generateRandomId(), ...resource };
  }
}
