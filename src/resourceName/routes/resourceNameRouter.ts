import { FastifyInstance, RegisterOptions, HookHandlerDoneFunction } from 'fastify';
import { container } from 'tsyringe';
import { ResourceNameController } from '../controllers/resourceNameController';

const resourceNameRoutesRegistry = (fastify: FastifyInstance, _: RegisterOptions, done: HookHandlerDoneFunction): void => {
  const controller = container.resolve(ResourceNameController);

  fastify.get('/', controller.getResource);
  fastify.post('/', controller.createResource);

  done();
};

export { resourceNameRoutesRegistry };
