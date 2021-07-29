import { FastifyInstance, HookHandlerDoneFunction } from 'fastify';
import { TileManager } from '../../tile/models/tileManager';

export const onCloseHookWrapper = (tileManager: TileManager) => {
  return (instance: FastifyInstance, done: HookHandlerDoneFunction): void => {
    tileManager.shutdown();
    done();
  };
};
