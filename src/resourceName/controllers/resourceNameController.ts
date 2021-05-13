import { Logger } from '@map-colonies/js-logger';
import { Meter } from '@map-colonies/telemetry';
import { BoundCounter } from '@opentelemetry/api-metrics';
import { RequestHandler } from 'express';
import { FastifyRequest, FastifyReply } from 'fastify';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';

import { IResourceNameModel, ResourceNameManager } from '../models/resourceNameManager';

type CreateResourceHandler = RequestHandler<undefined, IResourceNameModel, IResourceNameModel>;
type GetResourceHandler = RequestHandler<undefined, IResourceNameModel>;

interface ParsedQs {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[];
}

interface BaseRequestHandler<Params = { [key: string]: string }, ResBody = any, ReqBody = any, ReqQuery = ParsedQs> {
  (request: FastifyRequest, reply: FastifyReply): any;
}

type BaseFastifyRequestHandler = FastifyRequest<{
  Params: { [key: string]: string };
  Body: any;
  Querystring: ParsedQs;
}>;

type CustomRequest = FastifyRequest<{
  Body: IResourceNameModel;
}>;

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

  // public getResource: GetResourceHandler = (req, res) => {
  //   return res.status(httpStatus.OK).json(this.manager.getResource());
  // };

  public getResource = (request: any, reply: any) => {
    return reply.status(httpStatus.OK).send(this.manager.getResource());
  };

  public createResource = (request: any, reply: any) => {
    const createdResource = this.manager.createResource(request.body);
    this.createdResourceCounter.add(1);
    return reply.status(httpStatus.CREATED).send(createdResource);
  };
}
