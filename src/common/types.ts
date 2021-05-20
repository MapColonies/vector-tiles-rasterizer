export interface FastifyBodyParserOptions {
  parseAs: string | Buffer extends Buffer ? 'buffer' : 'string';
  bodyLimit?: number;
}
