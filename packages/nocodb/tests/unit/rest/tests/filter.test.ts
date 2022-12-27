import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import { createProject } from '../../factory/project';
import init from '../../init';
import { createTable } from '../../factory/table';
import { createView } from '../../factory/view';
import { ViewTypes } from 'nocodb-sdk';
import { createFilter, getFilter } from '../../factory/filter';

function FilterTests() {
  let context;
  let project;
  let table;
  let view;
  let columns;
  let filterOnColumnId;
  let filter;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    view = await createView(context, { title: 'filtersTest', table, type: ViewTypes.GRID })
    columns = await view.getColumns();
    filterOnColumnId = columns[0].fk_column_id;
    filter = await createFilter({ fk_view_id: view.id, fk_column_id: filterOnColumnId, comparison_op: 'notempty' })
  });

  describe('GET: /api/v1/db/meta/views/:viewId/filters/', function() {
    it('Gets list of filters applied to a view', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/views/${view.id}/filters/`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);
  
      expect(response.body).to.containSubset([
        {
          id: filter.id,
          project_id: project.id,
          fk_view_id: view.id,
          fk_hook_id: null,
          fk_column_id: filterOnColumnId,
          fk_parent_id: null,
          logical_op: null,
          comparison_op: "notempty",
          value: null,
          is_group: null,
          order: 1,
        },
      ])
    });
  })

  describe('POST: /api/v1/db/meta/views/:viewId/filters/', function() {
    it('Creates a filter on a view', async function () {
      const filterOnColumnId = columns[1].fk_column_id;
      const comparisonOp = 'notnull'
      const response = await request(context.app)
        .post(`/api/v1/db/meta/views/${view.id}/filters/`)
        .set('xc-auth', context.token)
        .send(
          { fk_view_id: view.id, fk_column_id: filterOnColumnId, comparison_op: comparisonOp }
        )
        .expect(200);
  
      expect(response.body).to.containSubset({
        project_id: project.id,
        fk_view_id: view.id,
        fk_hook_id: null,
        fk_column_id: filterOnColumnId,
        fk_parent_id: null,
        logical_op: null,
        comparison_op: comparisonOp,
        value: null,
        is_group: null,
        order: 2,
      })
    });
  })

  describe('GET: /api/v1/db/meta/filters/:filterId', function() {
    it('Gets a filter', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/filters/${filter.id}`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);
  
      expect(response.body).to.containSubset({
        project_id: project.id,
        fk_view_id: view.id,
        fk_hook_id: null,
        fk_column_id: filterOnColumnId,
        fk_parent_id: null,
        logical_op: null,
        comparison_op: "notempty",
        value: null,
        is_group: null,
        order: 1,
      })
    });
  })

  describe('PATCH: /api/v1/db/meta/filters/:filterId', function() {
    it('Updates a filter', async function () {
      await request(context.app)
        .patch(`/api/v1/db/meta/filters/${filter.id}`)
        .set('xc-auth', context.token)
        .send({
          comparison_op: 'eq',
          value: '2'
        })
        .expect(200);
  
      const updatedFilter = await getFilter(filter.id);
      expect(updatedFilter.comparison_op).to.equal('eq');
      expect(updatedFilter.value).to.equal('2');
    });
  })

  describe('DELETE: /api/v1/db/meta/filters/:filterId', function() {
    it('Deletes a filter', async function () {
      await request(context.app)
        .delete(`/api/v1/db/meta/filters/${filter.id}`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);
  
      const updatedFilter = await getFilter(filter.id);
      expect(updatedFilter).to.be.undefined;
    });
  })

  describe('GET: /api/v1/db/meta/filters/:filterParentId/children', function() {
    it('Gets children filters', async function () {
      const filterParent = await createFilter({ fk_view_id: view.id, fk_column_id: filterOnColumnId, logical_op: 'and', is_group: true })
      const filter = await createFilter({ fk_view_id: view.id, fk_column_id: filterOnColumnId, comparison_op: 'notempty', fk_parent_id: filterParent.id })
      const response = await request(context.app)
        .get(`/api/v1/db/meta/filters/${filterParent.id}/children`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);
  
      expect(response.body).to.containSubset([
        {
          id: filter.id,
          project_id: project.id,
          fk_view_id: view.id,
          fk_hook_id: null,
          fk_column_id: filterOnColumnId,
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
  describe('Filters', FilterTests);
}
