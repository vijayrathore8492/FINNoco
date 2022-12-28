import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import { createProject } from '../../factory/project';
import init from '../../init';
import { createTable } from '../../factory/table';
import { createHook } from '../../factory/hook';
import { createFilter, getFilter } from '../../factory/filter';

function HookFilterTests() {
  let context;
  let project;
  let table;
  let view;
  let hook;
  let hookFilter;
  let column;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    view = (await table.getViews())[0];
    column = (await table.getColumns())[0];
    hook = await createHook({ 
      fk_model_id: table.id, 
      event: 'After', 
      operation: 'insert', 
      title: 'HooksTests', 
      notification: '{"type":"URL", "payload":{"path":"http://www.google.com"}}' 
    })
    hookFilter = await createFilter({
      fk_view_id: view.id,
      fk_column_id: column.id,
      comparison_op: 'eq',
      fk_hook_id: hook.id,
      value: '1',
    });
  });

  describe('GET: /hooks/:hookId/filters/', function() {
    it('Gets list of filters on a hook', async function () {
      const response = await request(context.app)
        .get(`/hooks/${hook.id}/filters/`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);
  
      expect(response.body).to.containSubset([
        {
          id: hookFilter.id,
          project_id: project.id,
          fk_view_id: view.id,
          fk_hook_id: hook.id,
          fk_column_id: column.id,
          fk_parent_id: null,
          logical_op: null,
          comparison_op: "eq",
          value: "1",
          is_group: null,
          order: 1,
        },
      ])
    });
  })

  describe('GET: /api/v1/db/meta/hooks/:hookId/filters', function() {
    it('Gets list of filters conditions of a hook', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/hooks/${hook.id}/filters`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);
  
      expect(response.body).to.containSubset([
        {
          id: hookFilter.id,
          project_id: project.id,
          fk_view_id: view.id,
          fk_hook_id: hook.id,
          fk_column_id: column.id,
          fk_parent_id: null,
          logical_op: null,
          comparison_op: "eq",
          value: "1",
          is_group: null,
          order: 1,
        },
      ])
    });
  })

  describe('CREATE: /hooks/:hookId/filters/', function() {
    it('Creates a filter for a hook', async function () {
      const response = await request(context.app)
        .post(`/hooks/${hook.id}/filters/`)
        .set('xc-auth', context.token)
        .send({
          fk_view_id: view.id,
          fk_column_id: column.id,
          comparison_op: 'neq',
          fk_hook_id: hook.id,
          value: '2',
        })
        .expect(200);
  
      expect(response.body).to.containSubset({
        project_id: project.id,
        fk_view_id: view.id,
        fk_hook_id: hook.id,
        fk_column_id: column.id,
        fk_parent_id: null,
        logical_op: null,
        comparison_op: "neq",
        value: "2",
        is_group: null,
        order: 2,
      });
    });
  })

  describe('CREATE: /api/v1/db/meta/hooks/:hookId/filters', function() {
    it('Creates a filter condition for a hook', async function () {
      const response = await request(context.app)
        .post(`/api/v1/db/meta/hooks/${hook.id}/filters`)
        .set('xc-auth', context.token)
        .send({
          fk_view_id: view.id,
          fk_column_id: column.id,
          comparison_op: 'neq',
          fk_hook_id: hook.id,
          value: '2',
        })
        .expect(200);
  
      expect(response.body).to.containSubset({
        project_id: project.id,
        fk_view_id: view.id,
        fk_hook_id: hook.id,
        fk_column_id: column.id,
        fk_parent_id: null,
        logical_op: null,
        comparison_op: "neq",
        value: "2",
        is_group: null,
        order: 2,
      });
    });
  })

  describe('GET: /hooks/:hookId/filters/:filterId', function() {
    it('Gets filter by hookId and filterId', async function () {
      const response = await request(context.app)
        .get(`/hooks/${hook.id}/filters/${hookFilter.id}`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);
  
      expect(response.body).to.containSubset({
        is_group: true,
        children: [
          {
            project_id: project.id,
            fk_view_id: view.id,
            fk_hook_id: hook.id,
            fk_column_id: column.id,
            fk_parent_id: null,
            logical_op: null,
            comparison_op: "eq",
            value: "1",
            is_group: null,
            order: 1,
          },
        ],
        logical_op: "AND",
      });
    });
  })

  describe('PATCH: /hooks/:hookId/filters/:filterId', function() {
    it('Updates a filter', async function () {
      await request(context.app)
        .patch(`/hooks/${hook.id}/filters/${hookFilter.id}`)
        .set('xc-auth', context.token)
        .send({
          comparison_op: 'isnotnull',
          value: null,
        })
        .expect(200);
  
      const updatedHookFilter = await getFilter(hookFilter.id);
      expect(updatedHookFilter.comparison_op).to.equal('isnotnull');
      expect(updatedHookFilter.value).to.equal(null);
    });
  })

  describe('DELETE: /hooks/:hookId/filters/:filterId', function() {
    it('Deletes a filter', async function () {
      await request(context.app)
        .delete(`/hooks/${hook.id}/filters/${hookFilter.id}`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);
  
      const updatedHookFilter = await getFilter(hookFilter.id);
      expect(updatedHookFilter.comparison_op).to.be.undefined;
    });
  })

  describe('GET: /hooks/:hookId/filters/:filterParentId/children', function() {
    it('GET filter children', async function () {
      const filterParent = await createFilter({ 
        fk_view_id: view.id, 
        fk_column_id: column.id, 
        logical_op: 'and', 
        is_group: true, 
        fk_hook_id: hook.id 
      })
      const filter = await createFilter({ 
        fk_view_id: view.id, 
        fk_column_id: column.id, 
        comparison_op: 'notempty', 
        fk_parent_id: filterParent.id, 
        fk_hook_id: hook.id 
      })
      const response = await request(context.app)
        .get(`/hooks/${hook.id}/filters/${filterParent.id}/children`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);
  
      expect(response.body).to.containSubset([
        {
          id: filter.id,
          project_id: project.id,
          fk_view_id: view.id,
          fk_hook_id: hook.id,
          fk_column_id: column.id,
          fk_parent_id: filterParent.id,
          logical_op: null,
          comparison_op: "notempty",
          value: null,
          is_group: null,
          order: 3,
        },
      ])
    });
  })
}

export default function () {
  describe('HookFilters', HookFilterTests);
}
