import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import { createProject } from '../../factory/project';
import init from '../../init';

function PluginTests() {
  let context;
  let project;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
  });

  describe('GET: /api/v1/db/meta/plugins', function () {
    it('Gets list of plugins', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/plugins`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.deep.equal({
        list: [
        ],
      })
    });
  });

  describe('GET: /api/v1/db/meta/plugins/:pluginTitle/status', function () {
    it('Checks if plugin is active', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/plugins/S3/status`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.be.false
    });
  });
}

export default function () {
  describe('Plugins', PluginTests);
}
