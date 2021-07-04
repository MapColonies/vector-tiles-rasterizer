import { lookup } from 'mime-types';

export const DEFAULT_SERVER_PORT = 80;

export const DEFAULT_APP_ADDRESS = '0.0.0.0';

export enum Services {
  LOGGER = 'ILogger',
  CONFIG = 'IConfig',
  APPLICATION = 'IApplication',
  GLOBAL = 'IGlobal',
  TESTS = 'ITests',
}

export const PNG_CONTENT_TYPE = lookup('png') as string;

export const POWERS_OF_TWO_PER_ZOOM_LEVEL: Record<number, number> = {
  0: 1,
  1: 2,
  2: 4,
  3: 8,
  4: 16,
  5: 32,
  6: 64,
  7: 128,
  8: 256,
  9: 512,
  10: 1024,
  11: 2048,
  12: 4096,
  13: 8192,
  14: 16384,
  15: 32768,
  16: 65536,
  17: 131072,
  18: 262144,
  19: 524288,
  20: 1048576,
  21: 2097152,
  22: 4194304,
};
