import config from 'config';
import faker from 'faker';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { FastifyInstance } from 'fastify';

import { Services } from '../../../src/common/constants';
import { IApplicationConfig } from '../../../src/common/interfaces';
import { GetTileParams } from '../../../src/tile/controllers/tileController';
import { registerTestValues } from '../testContainerConfig';
import { getDefaultTileRequestParams, getTestTileBuffer } from '../../helpers';
import { POWERS_OF_TWO_PER_ZOOM_LEVEL, PNG_CONTENT_TYPE } from '../../../src/common/constants';
import * as requestSender from './helpers/requestSender';

let app: FastifyInstance;
let appx2: FastifyInstance;
let appWithSadStyle: FastifyInstance;
let appConfig: IApplicationConfig;

const cachePeriod = config.get<number>('server.response.headers.cachePeriod');

describe('rasterize', function () {
  beforeAll(async function () {
    await registerTestValues(false);
    app = await requestSender.getApp();
    appConfig = container.resolve(Services.APPLICATION);
  });
  afterAll(async function () {
    await app.close();
    await appx2.close();
    await appWithSadStyle.close();
  });

  describe('Happy Path', function () {
    it('should return 200 status code with the tile buffer and a cache control header', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();

      const response = await requestSender.getTile(app, tileRequestParams);

      const expectedTileBuffer = await getTestTileBuffer(256);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toMatchObject(expectedTileBuffer);
      expect(response.get('cache-control')).toMatch(`public, max-age=${cachePeriod}, must-revalidate`);
      expect(response.get('content-type')).toMatch(PNG_CONTENT_TYPE);
    });

    beforeAll(async function () {
      container.clearInstances();
      await registerTestValues(false, 512);
      appx2 = await requestSender.getApp();
    });
    it('should return 200 status code with the x2 tile buffer and a cache control header', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();

      const response = await requestSender.getTile(appx2, tileRequestParams);

      const expectedTileBuffer = await getTestTileBuffer(512);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toMatchObject(expectedTileBuffer);
      expect(response.get('cache-control')).toMatch(`public, max-age=${cachePeriod}, must-revalidate`);
      expect(response.get('content-type')).toMatch(PNG_CONTENT_TYPE);
    });
  });

  describe('Bad Path', function () {
    it('should return 400 status code for lower than min zoom level', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();
      tileRequestParams.z = (appConfig.zoom.min - 1).toString();

      const response = await requestSender.getTile(app, tileRequestParams);
      const { z, x, y } = tileRequestParams;

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', `tile request for z: ${z}, x: ${x}, y: ${y} is out of bounds.`);
    });

    it('should return 400 status code for higher than max zoom level', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();
      tileRequestParams.z = (appConfig.zoom.max + 1).toString();

      const response = await requestSender.getTile(app, tileRequestParams);
      const { z, x, y } = tileRequestParams;

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', `tile request for z: ${z}, x: ${x}, y: ${y} is out of bounds.`);
    });

    it('should return 404 status code for a negative x axis tile', async function () {
      const randomZoom = faker.datatype.number({ min: appConfig.zoom.min, max: appConfig.zoom.max });
      const tileRequestParams: GetTileParams = {
        z: randomZoom.toString(),
        x: '-1',
        y: '0',
      };

      const response = await requestSender.getTile(app, tileRequestParams);

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });

    it('should return 400 status code for a too high x axis tile per zoom', async function () {
      const randomZoom = faker.datatype.number({ min: appConfig.zoom.min, max: appConfig.zoom.max });
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
      const randomZoom = faker.datatype.number({ min: appConfig.zoom.min, max: appConfig.zoom.max });
      const tileRequestParams: GetTileParams = {
        z: randomZoom.toString(),
        x: '0',
        y: '-1',
      };

      const response = await requestSender.getTile(app, tileRequestParams);

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });

    it('should return 400 status code for a too high y axis tile per zoom', async function () {
      const { zoom } = appConfig;
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

  describe('Sad Path', function () {
    beforeAll(async function () {
      container.clearInstances();
      await registerTestValues(true);
      appWithSadStyle = await requestSender.getApp();
    });
    it('should return 500 status code for unreachable tiles url', async function () {
      const tileRequestParams: GetTileParams = getDefaultTileRequestParams();

      const response = await requestSender.getTile(appWithSadStyle, tileRequestParams);

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
});
