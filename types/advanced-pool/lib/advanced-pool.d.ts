/* eslint-disable @typescript-eslint/ban-types */
declare module 'advanced-pool' {
  export interface PoolOptions<T> {
    name?: string; // 'pool'
    min?: number; // 2
    max?: number; // 4
    create: Function;
    destroy?: Function;
    idleTimeout?: number; // 30000
    idleCheckInterval?: number; // 1000
    log?: boolean; // false
    queue?: SimpleQueue<T>;
  }

  type ObjectCallback<T> = (error: Error | null, object: T) => void;

  class SimpleQueue<T> {
    public queueSize: string;
    public queue: T[];
    public push: (callback: ObjectCallback<T>, params?: unknown) => void;
    public constructor(queueSize: number);
    public pop(): T[] | null;
    public size(): number;
  }

  export class Pool<T> {
    public acquire: (client: ObjectCallback<T>, queueParam?: unknown) => void;
    public release: (object: T) => void;
    public close: () => void;
    public constructor(options: PoolOptions<T>);
  }
}
