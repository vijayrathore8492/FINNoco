import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import { createProject } from '../../factory/project';
import init from '../../init';
import { createTable } from '../../factory/table';
import { createView } from '../../factory/view';
import { ViewTypes } from 'nocodb-sdk';
import { createSort, getSort } from '../../factory/sort';

function SortTests() {
  let context;
  let project;
  let table;
  let view;
  let columns;
  let sort;
  let sortOnColumnId;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    view = await createView(context, { title: 'sortsTest', table, type: ViewTypes.GRID })
    columns = await view.getColumns();
    sortOnColumnId = columns[0].fk_column_id;
    sort = await createSort({ fk_view_id: view.id, fk_column_id: sortOnColumnId, direction: 'desc' })
  });

  describe('GET: /api/v1/db/meta/views/:viewId/sorts/', function() {
    it('Gets list of sorts applied to a view', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/views/${view.id}/sorts/`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);
  
      expect(response.body).to.containSubset({
        sorts: {
          list: [
            {
              id: sort.id,
              project_id: project.id,
              fk_view_id: view.id,
              fk_column_id: sortOnColumnId,
              direction: "desc",
              order: 1,
            },
          ],
        },
      })
    });
  })

  describe('CREATE: /api/v1/db/meta/views/:viewId/sorts/', function() {
    it('Creates a sort on a view', async function () {
      const sortOnColumnId = columns[1].fk_column_id;
      const sortDirection = 'asc';
      const response = await request(context.app)
        .post(`/api/v1/db/meta/views/${view.id}/sorts/`)
        .set('xc-auth', context.token)
        .send({
          fk_column_id: sortOnColumnId,
          direction: sortDirection
        })
        .expect(200);
  
      expect(response.body).to.containSubset({
        project_id: project.id,
        fk_view_id: view.id,
        fk_column_id: sortOnColumnId,
        direction: sortDirection,
        order: 2,
      })
    });
  })

  describe('PATCH: /api/v1/db/meta/sorts/:sortId', function() {
    it('Updates a sort', async function () {
      const sortDirection = 'asc';
      await request(context.app)
        .patch(`/api/v1/db/meta/sorts/${sort.id}`)
        .set('xc-auth', context.token)
        .send({
          direction: sortDirection
        })
        .expect(200);
  
      const updatedSort = await getSort(sort.id);
      expect(updatedSort.direction).to.equal(sortDirection);
    });
  })

  describe('DELETE: /api/v1/db/meta/sorts/:sortId', function() {
    it('Deletes a sort', async function () {
      await request(context.app)
        .delete(`/api/v1/db/meta/sorts/${sort.id}`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);
  
      const deletedSort = await getSort(sort.id);
      expect(deletedSort).to.be.undefined;
    });
  })

}

export default function () {
  describe('Sorts', SortTests);
}
