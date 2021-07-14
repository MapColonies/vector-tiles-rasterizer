import config from 'config';
import faker from 'faker';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { FastifyInstance } from 'fastify';

import { Services } from '../../../src/common/constants';
import { IApplicationConfig, ITestsConfig } from '../../../src/common/interfaces';
import { GetTileParams } from '../../../src/tile/controllers/tileController';
import { registerTestValues } from '../testContainerConfig';
import { getDefaultTileRequestParams, getTestTileBuffer, waitUntilPoolIsClosed } from '../../helpers';
import { POWERS_OF_TWO_PER_ZOOM_LEVEL, PNG_CONTENT_TYPE } from '../../../src/common/constants';
import * as requestSender from './helpers/requestSender';

let app: FastifyInstance;
let appWithSadStyle: FastifyInstance;
let applicationConfig: IApplicationConfig;
let tileBuffer: Buffer;

const testsConfig = config.get<ITestsConfig>('tests');
const cachePeriod = config.get<number>('server.response.headers.cachePeriod');

describe('rasterize', function () {
  beforeAll(async function () {
    await registerTestValues();
    app = await requestSender.getApp();
    applicationConfig = container.resolve(Services.APPLICATION);
    tileBuffer = await getTestTileBuffer();
  });
  afterAll(async function () {
    container.reset();
    // so the pool will be closed
    await waitUntilPoolIsClosed(testsConfig.poolInactivityClose as number);
  });

  describe('Sad Path', function () {
    it('should return 500 status code for unreachable tiles url', async function () {
      appWithSadStyle = await requestSender.getAppWithSadStyle();

      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();
      const response = await requestSender.getTile(appWithSadStyle, tileRequestParams);

      // so the pool will be closed
      await waitUntilPoolIsClosed(testsConfig.poolInactivityClose as number);

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('Happy Path', function () {
    it('should return 200 status code with the tile buffer and a cache control header', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();

      const response = await requestSender.getTile(app, tileRequestParams);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toMatchObject(tileBuffer);
      expect(response.get('cache-control')).toMatch(`public, max-age=${cachePeriod}, must-revalidate`);
      expect(response.get('content-type')).toMatch(PNG_CONTENT_TYPE);
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

    it('should return 404 status code for a negative x axis tile', async function () {
      const randomZoom = faker.datatype.number({ min: applicationConfig.zoom.min, max: applicationConfig.zoom.max });
      const tileRequestParams: GetTileParams = {
        z: randomZoom.toString(),
        x: '-1',
        y: '0',
      };

      const response = await requestSender.getTile(app, tileRequestParams);

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
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

    it('should return 404 status code for a negative y axis tile', async function () {
      const randomZoom = faker.datatype.number({ min: applicationConfig.zoom.min, max: applicationConfig.zoom.max });
      const tileRequestParams: GetTileParams = {
        z: randomZoom.toString(),
        x: '0',
        y: '-1',
      };

      const response = await requestSender.getTile(app, tileRequestParams);

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
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
});
