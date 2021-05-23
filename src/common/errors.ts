import { StatusCodes } from 'http-status-codes';

export interface HttpError extends Error {
  error: string;
  statusCode: StatusCodes;
}

export class NotFoundError extends Error {}
