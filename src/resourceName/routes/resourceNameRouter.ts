import { container } from 'tsyringe';
import { FastifyPluginRegister } from '../../common/interfaces';
import { ResourceNameController } from '../controllers/resourceNameController';

const resourceNameRoutesRegistry: FastifyPluginRegister = (fastify, _, done) => {
  const controller = container.resolve(ResourceNameController);

  fastify.get('/', controller.getResource);
  fastify.post('/', controller.createResource);

  done();
};

export { resourceNameRoutesRegistry };
