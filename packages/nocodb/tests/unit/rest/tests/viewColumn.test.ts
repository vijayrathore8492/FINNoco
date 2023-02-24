import { expect } from 'chai';
import 'mocha';
import { UITypes, ViewTypes } from 'nocodb-sdk';
import request from 'supertest';
import * as _ from 'lodash';
import { createProject } from '../../factory/project';
import { createTable } from '../../factory/table';
import { createView, insertOrUpdateColumnInView } from '../../factory/view';
import init from '../../init';
import { createColumn } from '../../factory/column';

function ViewColumnTests() {
  let context;
  let project;
  let table;
  let view;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    view = await createView(context, { title: 'viewColumnTestsView', table, type: ViewTypes.GRID })
  });

  describe('GET /api/v1/db/meta/views/:viewId/columns/', function () {
    it('Get list of columns of a view', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/views/${view.id}/columns`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.containSubset([
        {
          fk_view_id: view.id,
          project_id: project.id,
          uuid: null,
          label: null,
          help: null,
          width: "200px",
          show: 1,
          order: 1,
        },
        {
          fk_view_id: view.id,
          project_id: project.id,
          uuid: null,
          label: null,
          help: null,
          width: "200px",
          show: 0,
          order: 2,
        },
        {
          fk_view_id: view.id,
          project_id: project.id,
          uuid: null,
          label: null,
          help: null,
          width: "200px",
          show: 0,
          order: 3,
        },
        {
          fk_view_id: view.id,
          project_id: project.id,
          uuid: null,
          label: null,
          help: null,
          width: "200px",
          show: 0,
          order: 4,
        },
      ])
    });
  })

  describe('POST /api/v1/db/meta/views/:viewId/columns/', function () {
    it('Adds a columns to a view', async function () {
      const column = await createColumn(context, table, {
        uidt: UITypes.SingleLineText,
        title: 'TestViewAddColumn',    
        column_name: 'test_view_add_column',
      })
      const response = await request(context.app)
        .post(`/api/v1/db/meta/views/${view.id}/columns`)
        .set('xc-auth', context.token)
        .send({
          fk_column_id: column.id,
          order: 5, 
          show: 0
        })
        .expect(200);

      expect(response.body).to.containSubset({
        fk_view_id: view.id,
        fk_column_id: column.id,
        project_id: project.id,
        uuid: null,
        label: null,
        help: null,
        width: "200px",
        show: 0,
        order: 5,
        view_id: view.id,
      })
    });
  })

  describe('PATCH /api/v1/db/meta/views/:viewId/columns/', function () {
    it('Updates a column of a view', async function () {
      const column = await createColumn(context, table, {
        uidt: UITypes.SingleLineText,
        title: 'TestViewAddColumn',    
        column_name: 'test_view_add_column',
      })
      const viewColumn = await insertOrUpdateColumnInView(view.id, column.id, {order: 6, show: 0})
      const response = await request(context.app)
        .patch(`/api/v1/db/meta/views/${view.id}/columns/${viewColumn.id}`)
        .set('xc-auth', context.token)
        .send({
          order: 1,
          show: 1
        })
        .expect(200);

      const updatedColumn = response.body.find(col => col.fk_column_id === column.id);
      expect(updatedColumn.order).to.eq(1);
      expect(updatedColumn.show).to.eq(1);
    });
  })
}

export default function () {
  describe('ViewColumnTests', ViewColumnTests);
}
