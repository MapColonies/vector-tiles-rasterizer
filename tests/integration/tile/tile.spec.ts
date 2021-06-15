/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import faker from 'faker';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { FastifyInstance } from 'fastify';

import { Services } from '../../../src/common/constants';
import { IApplicationConfig, IGlobalConfig } from '../../../src/common/interfaces';
import { GetTileParams } from '../../../src/tile/controllers/tileController';
import { registerTestValues } from '../testContainerConfig';
import { getDefaultTileRequestParams, getTestTileBuffer } from '../../helpers';
import { POWERS_OF_TWO_PER_ZOOM_LEVEL, PNG_CONTENT_TYPE } from '../../../src/common/constants';
import * as requestSender from './helpers/requestSender';

let app: FastifyInstance;
let appWithSadStyle: FastifyInstance;
let applicationConfig: IApplicationConfig;
let globalConfig: IGlobalConfig;
let tileBuffer: Buffer;

describe('rasterize', function () {
  beforeAll(async function () {
    await registerTestValues();
    app = await requestSender.getApp();
    applicationConfig = container.resolve(Services.APPLICATION);
    globalConfig = container.resolve(Services.GLOBAL);
    tileBuffer = await getTestTileBuffer();
  });
  afterEach(function () {
    container.clearInstances();
    jest.clearAllMocks();
  });
  afterAll(function () {
    container.reset();
  });
  describe('Happy Path', function () {
    it('should return 200 status code with the tile buffer', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();

      const response = await requestSender.getTile(app, tileRequestParams);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toMatchObject(tileBuffer);
      expect(response.get('last-modified')).toMatch(globalConfig.appInitTime);
      expect(response.get('content-type')).toMatch(PNG_CONTENT_TYPE);
    });

    it('should return 200 status code with the tile buffer if last modified is too old', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();

      const fakePastModifiedSince = faker.date.past(undefined, globalConfig.appInitTime).toUTCString();
      const response = await requestSender.getTile(app, tileRequestParams, { modifiedSince: fakePastModifiedSince });

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toMatchObject(tileBuffer);
      expect(response.get('last-modified')).toMatch(globalConfig.appInitTime);
      expect(response.get('content-type')).toMatch(PNG_CONTENT_TYPE);
    });

    it('should return 200 status code with the tile buffer if request had cache control value of no-cache', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();

      const fakePastModifiedSince = faker.date.past(undefined, globalConfig.appInitTime).toUTCString();
      const response = await requestSender.getTile(app, tileRequestParams, { modifiedSince: fakePastModifiedSince, cacheControl: 'no-cache' });

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toMatchObject(tileBuffer);
      expect(response.get('last-modified')).toMatch(globalConfig.appInitTime);
      expect(response.get('content-type')).toMatch(PNG_CONTENT_TYPE);
    });

    it('should return 304 status code and return an empty body', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();
      const fakeFutureModifiedSince = faker.date.future(undefined, globalConfig.appInitTime).toUTCString();
      const response = await requestSender.getTile(app, tileRequestParams, { modifiedSince: fakeFutureModifiedSince });

      expect(response.status).toBe(httpStatusCodes.NOT_MODIFIED);
      expect(response.body).toMatchObject({});
    });
  });
  describe('Bad Path', function () {
    it('should return 400 status code for lower than min zoom level', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();
      tileRequestParams.z = (applicationConfig.zoom.min - 1).toString();

      const response = await requestSender.getTile(app, tileRequestParams);
      const { z, x, y } = tileRequestParams;

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', `tile request for z: ${z}, x: ${x}, y: ${y} is out of bounds.`);
    });

    it('should return 400 status code for higher than max zoom level', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();
      tileRequestParams.z = (applicationConfig.zoom.max + 1).toString();

      const response = await requestSender.getTile(app, tileRequestParams);
      const { z, x, y } = tileRequestParams;

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', `tile request for z: ${z}, x: ${x}, y: ${y} is out of bounds.`);
    });

    it('should return 400 status code for a negative x axis tile', async function () {
      const randomZoom = faker.datatype.number({ min: applicationConfig.zoom.min, max: applicationConfig.zoom.max });
      const tileRequestParams: GetTileParams = {
        z: randomZoom.toString(),
        x: '-1',
        y: '0',
      };

      const response = await requestSender.getTile(app, tileRequestParams);
      const { z, x, y } = tileRequestParams;

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', `tile request for z: ${z}, x: ${x}, y: ${y} is out of bounds.`);
    });

    it('should return 400 status code for a too high x axis tile per zoom', async function () {
      const randomZoom = faker.datatype.number({ min: applicationConfig.zoom.min, max: applicationConfig.zoom.max });
      const tileRequestParams: GetTileParams = {
        z: randomZoom.toString(),
        x: (POWERS_OF_TWO_PER_ZOOM_LEVEL[randomZoom] + 1).toString(),
        y: '0',
      };

      const response = await requestSender.getTile(app, tileRequestParams);
      const { z, x, y } = tileRequestParams;

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', `tile request for z: ${z}, x: ${x}, y: ${y} is out of bounds.`);
    });

    it('should return 400 status code for a too high y axis tile per zoom', async function () {
      const { zoom } = applicationConfig;
      const randomZoom = faker.datatype.number({ min: zoom.min, max: zoom.max });
      const tileRequestParams: GetTileParams = {
        z: randomZoom.toString(),
        x: '0',
        y: (POWERS_OF_TWO_PER_ZOOM_LEVEL[randomZoom] + 1).toString(),
      };

      const response = await requestSender.getTile(app, tileRequestParams);
      const { z, x, y } = tileRequestParams;

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', `tile request for z: ${z}, x: ${x}, y: ${y} is out of bounds.`);
    });
  });
  beforeAll(async () => {
    appWithSadStyle = await requestSender.getAppWithSadStyle();
  });
  describe('Sad Path', function () {
    it.skip('should return 500 status code for unreachable tiles url', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();

      const response = await requestSender.getTile(appWithSadStyle, tileRequestParams);

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
});
