import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import { createProject } from '../../factory/project';
import { createApiToken } from '../../factory/apiToken';
import init from '../../init';

function apiTokenTests() {
  let context;
  let project;
  let apiToken;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    apiToken = await createApiToken({description: 'test token', fk_user_id: context.user.id})
  });

  it('Get tokens list', async function () {
    const response = await request(context.app)
      .get(`/api/v1/db/meta/projects/${project.id}/api-tokens`)
      .set('xc-auth', context.token)
      .send({})
      .expect(200);

    expect(response.body).to.containSubset([
      {
        id: 1,
        project_id: null,
        db_alias: null,
        description: "test token",
        permissions: null,
        expiry: null,
        enabled: 1,
        fk_user_id: context.user.id,
      },
    ])
  });

  it('Creates new API token', async function () {
    const response = await request(context.app)
      .post(`/api/v1/db/meta/projects/${project.id}/api-tokens`)
      .set('xc-auth', context.token)
      .send({description: 'token with create api'})
      .expect(200);

    expect(response.body).to.containSubset({
      id: 2,
      project_id: null,
      db_alias: null,
      description: "token with create api",
      permissions: null,
      expiry: null,
      enabled: 1,
      fk_user_id: context.user.id,
    })
  });

  it('Deletes API token', async function () {
    const response = await request(context.app)
      .delete(`/api/v1/db/meta/projects/${project.id}/api-tokens/${apiToken.token}`)
      .set('xc-auth', context.token)
      .send({})
      .expect(200);

    expect(response.body).to.be.equal(1);
  });

  it('Errors when token not found in Delete API token', async function () {
    const response = await request(context.app)
      .delete(`/api/v1/db/meta/projects/${project.id}/api-tokens/incorrect_token`)
      .set('xc-auth', context.token)
      .send({})
      .expect(404);

    expect(response.body).to.deep.equal({
      msg: "Token not found",
    })
  });
}

export default function () {
  describe('ApiTokens', apiTokenTests);
}
