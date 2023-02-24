import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import { createProject } from '../../factory/project';
import init from '../../init';
import { createTable } from '../../factory/table';
import { createHook, getHook } from '../../factory/hook';

function HookTests() {
  let context;
  let project;
  let table;
  let hook;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    hook = await createHook({ 
      fk_model_id: table.id, 
      event: 'after', 
      operation: 'insert', 
      title: 'HooksTests', 
      notification: '{"type":"URL", "payload":{"path":"http://www.google.com"}}' 
    })
  });

  describe('GET: /api/v1/db/meta/tables/:tableId/hooks', function() {
    it('Gets list of hooks applied to a table', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/tables/${table.id}/hooks/`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);
  
      expect(response.body).to.containSubset({
        list: [
          {
            id: hook.id,
            project_id: project.id,
            fk_model_id: table.id,
            title: "HooksTests",
            description: null,
            env: "all",
            type: null,
            event: "after",
            operation: "insert",
            async: 0,
            payload: 1,
            url: null,
            headers: null,
            condition: 0,
            retries: 0,
            retry_interval: 60000,
            timeout: 60000,
            active: 1
          },
        ],
      })
    });
  })

  describe('CREATE: /api/v1/db/meta/tables/:tableId/hooks/test', function() {
    it('Tests a hook on a table', async function () {
      const response = await request(context.app)
        .post(`/api/v1/db/meta/tables/${table.id}/hooks/test`)
        .set('xc-auth', context.token)
        .send({
          hook: hook,
          payload: {
            data: {
              'Title': 'TestHooKTest'
            },
            user: context.user
          }
        })
        .expect(200);
  
      expect(response.body).to.containSubset({
        msg: "Success",
      })
    });
  })

  describe('CREATE: /api/v1/db/meta/tables/:tableId/hooks', function() {
    it('Creates a hook on a table', async function () {
      const response = await request(context.app)
        .post(`/api/v1/db/meta/tables/${table.id}/hooks`)
        .set('xc-auth', context.token)
        .send({ 
          fk_model_id: table.id, 
          event: 'After', 
          operation: 'update', 
          title: 'CreateHookTests', 
          notification: '{"type":"URL", "payload":{"path":"http://www.finn.auto"}}' 
        })
        .expect(200);
  
      expect(response.body).to.containSubset({
        project_id: project.id,
        fk_model_id: table.id,
        title: "CreateHookTests",
        description: null,
        env: "all",
        type: null,
        event: "after",
        operation: "update",
        async: 0,
        payload: 1,
        url: null,
        headers: null,
        condition: 0,
        notification: "{\"type\":\"URL\", \"payload\":{\"path\":\"http://www.finn.auto\"}}",
        retries: 0,
        retry_interval: 60000,
        timeout: 60000,
        active: 1,
      })
    });
  })

  describe('PATCH: /api/v1/db/meta/hooks/:hookId', function() {
    it('Updates a hook', async function () {
      await request(context.app)
        .patch(`/api/v1/db/meta/hooks/${hook.id}`)
        .set('xc-auth', context.token)
        .send({
          active: true,
          async: true
        })
        .expect(200);
  
      const updatedHook = await getHook(hook.id);
      expect(updatedHook.active).to.be.ok;
      expect(updatedHook.async).to.be.ok;
    });
  })

  describe('DELETE: /api/v1/db/meta/hooks/:hookId', function() {
    it('Deletes a hook', async function () {
      await request(context.app)
        .delete(`/api/v1/db/meta/hooks/${hook.id}`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);
  
      const deletedHook = await getHook(hook.id);
      expect(deletedHook).to.be.undefined;
    });
  })

  describe('GET: /api/v1/db/meta/tables/:tableId/hooks/samplePayload/:operation', function() {
    it('Gets sample payload for hooks', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/tables/${table.id}/hooks/samplePayload/update`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);
  
      expect(response.body).to.containSubset({
        Id: 1,
        Title: "Sample Text",
      });
    });
  })
}

export default function () {
  describe('Hooks', HookTests);
}
