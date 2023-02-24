import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import * as _ from 'lodash';
import { createProject } from '../../factory/project';
import { createTable } from '../../factory/table';
import init from '../../init';
import { createView } from '../../factory/view';
import { ViewTypes } from 'nocodb-sdk';

function GridViewTests() {
  let context;
  let project;
  let table;
  let gridView;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    gridView = await createView(context, { title: 'GridViewTests', table, type: ViewTypes.GRID })
  });

  describe('POST /api/v1/db/meta/tables/:tableId/grids', function () {
    it('Creates a grid view', async function () {
      const response = await request(context.app)
        .post(`/api/v1/db/meta/tables/${table.id}/grids`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.containSubset({
        project_id: project.id,
        fk_model_id: table.id,
        title: null,
        type: 3,
        is_default: null,
        show_system_fields: null,
        lock_type: "collaborative",
        uuid: null,
        password: null,
        show: 1,
        meta: {},
      });
    });
  })

  describe('GET /api/v1/db/meta/grids/:gridViewId/grid-columns', function () {
    it('Get columns of a grid view', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/grids/${gridView.id}/grid-columns`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.containSubset([
        {
          fk_view_id: gridView.id,
          project_id: project.id,
          uuid: null,
          label: null,
          help: null,
          width: "200px",
          show: 1,
          order: 1,
        },
        {
          fk_view_id: gridView.id,
          project_id: project.id,
          uuid: null,
          label: null,
          help: null,
          width: "200px",
          show: 0,
          order: 2,
        },
        {
          fk_view_id: gridView.id,
          project_id: project.id,
          uuid: null,
          label: null,
          help: null,
          width: "200px",
          show: 0,
          order: 3,
        },
        {
          fk_view_id: gridView.id,
          project_id: project.id,
          uuid: null,
          label: null,
          help: null,
          width: "200px",
          show: 0,
          order: 4,
        },
      ]);
    });
  })

  describe('PATCH /api/v1/db/meta/grid-columns/:gridViewColumnId', function () {
    it('Update a grid view column', async function () {
      const columns = await gridView.getColumns();
      await request(context.app)
        .patch(`/api/v1/db/meta/grid-columns/${columns[0].id}`)
        .set('xc-auth', context.token)
        .send({
          show: false,
          order: 10
        })
        .expect(200);

      const updatedColumn = (await gridView.getColumns()).find(col => col.id === columns[0].id);
      expect(updatedColumn.show).not.to.be.ok;
      expect(updatedColumn.order).to.be.equal(10);
    });
  })
}

export default function () {
  describe('GridViews', GridViewTests);
}
