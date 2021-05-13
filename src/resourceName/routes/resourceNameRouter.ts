// import { Router } from 'express';
import { fastify, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { DependencyContainer, FactoryFunction } from 'tsyringe';
import { ResourceNameController } from '../controllers/resourceNameController';

// const resourceNameRouterFactory: FactoryFunction<FastifyInstance> = (dependencyContainer) => {
//   const router = fastify();
//   const controller = dependencyContainer.resolve(ResourceNameController);

//   router.get('/', controller.getResource);
//   router.post('/', controller.createResource);

//   return router;
// };

// export default function (fastify: FastifyInstance, done: Function) {
//   const controller = dependencyContainer.resolve(ResourceNameController);

//   fastify.get('/', controller.getResource);
//   fastify.post('/', controller.createResource);

//   done();
// };
