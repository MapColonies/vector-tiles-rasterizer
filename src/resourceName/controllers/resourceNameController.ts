import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { RequestHandler } from '../../common/interfaces';
import { IResourceNameModel, ResourceNameManager } from '../models/resourceNameManager';
import { HttpError, NotFoundError } from '../../common/errors';

type GetResourceHandler = RequestHandler<undefined>;
type CreateResourceHandler = RequestHandler<undefined, IResourceNameModel>;

@injectable()
export class ResourceNameController {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(ResourceNameManager) private readonly manager: ResourceNameManager
  ) {}

  public getResource: GetResourceHandler = (request, reply) => {
    let resource = {};
    try {
      resource = this.manager.getResource();
    } catch (error) {
      if (error instanceof NotFoundError) {
        (error as HttpError).statusCode = httpStatus.NOT_FOUND;
      }
      throw error;
    }
    return reply.status(httpStatus.OK).send(resource);
  };

  public createResource: CreateResourceHandler = (request, reply) => {
    const createdResource = this.manager.createResource(request.body);
    return reply.status(httpStatus.CREATED).send(createdResource);
  };
}
