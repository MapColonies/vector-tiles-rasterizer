import { Logger } from '@map-colonies/js-logger';
import { Meter } from '@map-colonies/telemetry';
import { BoundCounter } from '@opentelemetry/api-metrics';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';

import { IResourceNameModel, ResourceNameManager } from '../models/resourceNameManager';

type CreateResourceHandler = RequestHandler<undefined, IResourceNameModel, IResourceNameModel>;
type GetResourceHandler = RequestHandler<undefined, IResourceNameModel>;

@injectable()
export class ResourceNameController {
  private readonly createdResourceCounter: BoundCounter;

  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(ResourceNameManager) private readonly manager: ResourceNameManager,
    @inject(Services.METER) private readonly meter: Meter
  ) {
    this.createdResourceCounter = meter.createCounter('created_resource');
  }

  public getResource: GetResourceHandler = (req, res) => {
    return res.status(httpStatus.OK).json(this.manager.getResource());
  };

  public createResource: CreateResourceHandler = (req, res) => {
    const createdResource = this.manager.createResource(req.body);
    this.createdResourceCounter.add(1);
    return res.status(httpStatus.CREATED).json(createdResource);
  };
}
