import { FastifyRequest } from 'fastify';
import * as secureJsonParse from 'secure-json-parse';
import httpStatus from 'http-status-codes';
import { ContentTypeParserDoneFunction } from 'fastify/types/content-type-parser';

import { HttpError } from '../errors';

export const jsonParserHook = (req: FastifyRequest, body: string | Buffer, done: ContentTypeParserDoneFunction): void => {
  let json: unknown;
  try {
    json = secureJsonParse.parse(body);
  } catch (error) {
    (error as HttpError).statusCode = httpStatus.BAD_REQUEST;
    done(error);
  }
  done(null, json);
};
