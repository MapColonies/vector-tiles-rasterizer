import { container } from 'tsyringe';
import { FastifyPluginRegister } from '../../common/interfaces';
import { TileController } from '../controllers/tileController';

const tileRoutesRegistry: FastifyPluginRegister = (fastify, _, done) => {
  const controller = container.resolve(TileController);

  fastify.get('/:z(^\\d+)/:x(^\\d+)/:y(^\\d+).png', controller.getTile);

  done();
};

export { tileRoutesRegistry };
