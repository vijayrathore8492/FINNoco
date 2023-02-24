import { expect } from 'chai';
import 'mocha';
import { UITypes } from 'nocodb-sdk';
import request from 'supertest';
import { createColumn } from '../../factory/column';
import { createProject } from '../../factory/project';
import { createTable } from '../../factory/table';
import init from '../../init';

function columnTests() {
  let context;
  let project;
  let table;
  let column

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    column = await createColumn(context, table, {
      uidt: UITypes.SingleLineText,
      title: 'TestTextColumn',    
      column_name: 'test_text_column',
    })
  });

  describe('post:/api/v1/db/meta/tables/:tableId/columns/', function () {
    it('creates column', async function () {
      const expectedColumn = {
        title: "PostTestTextColumn",
        column_name: "post_test_text_column",
        uidt: "SingleLineText",
        dt: "varchar",
        np: null,
        ns: null,
        clen: null,
        pk: 0,
        pv: null,
        rqd: 0,
        un: 0,
        ct: null,
        ai: 0,
        unique: null,
        cdf: null,
        cc: null,
        csn: null,
        dtxp: "",
        dtxs: "",
        au: 0,
        validate: null,
        virtual: null,
        deleted: null,
        system: 0,
        order: null,
        meta: null,
      }
      const response = await request(context.app)
        .post(`/api/v1/db/meta/tables/${table.id}/columns`)
        .set('xc-auth', context.token)
        .send({
          uidt: UITypes.SingleLineText,
          title: expectedColumn.title,
          column_name: expectedColumn.column_name,
        })
        .expect(200);

      const createdColumn = response.body.columns.find(column => column.title === expectedColumn.title);
      expect(createdColumn).to.containSubset(expectedColumn)
    });
  })

  describe('patch:/api/v1/db/meta/columns/:columnId', function () {
    const expectedColumn = {
      title: "PatchTestColumnTitle",
      column_name: 'patch_test_column_title',
      uidt: "SingleLineText",
      dt: "varchar",
      np: null,
      ns: null,
      clen: null,
      cop: "4",
      pk: 0,
      pv: null,
      rqd: 0,
      un: 0,
      ct: null,
      ai: 0,
      unique: null,
      cdf: null,
      cc: null,
      csn: null,
      dtxp: "",
      dtxs: "",
      au: 0,
      validate: null,
      virtual: null,
      deleted: null,
      system: 0,
      order: null,
      meta: null,
    }
    it('updates column', async function () {
      const response = await request(context.app)
        .patch(`/api/v1/db/meta/columns/${column.id}`)
        .set('xc-auth', context.token)
        .send({
          column_name: expectedColumn.column_name,
          title: expectedColumn.title
        })
        .expect(200);

      const updatedColumn = response.body.columns.find(column => column.title === expectedColumn.title);
      expect(updatedColumn).to.containSubset(expectedColumn)
    });
  })

  describe('delete:/api/v1/db/meta/columns/:columnId', function () {
    it('deletes column', async function () {
      const expectedColumn = await createColumn(context, table, {
        uidt: UITypes.SingleLineText,
        title: 'DeleteTestTextColumn',    
        column_name: 'delete_test_text_column',
      })
      const response = await request(context.app)
        .delete(`/api/v1/db/meta/columns/${expectedColumn.id}`)
        .set('xc-auth', context.token)
        .expect(200);

      const deletedColumn = response.body.columns.find(c => c.title === expectedColumn.title);
      expect(deletedColumn).to.be.undefined
    });
  })

  describe('post:/api/v1/db/meta/columns/:columnId/primary', function () {
    it('set a column as primary', async function () {
      const expectedColumn = await createColumn(context, table, {
        uidt: UITypes.SingleLineText,
        title: 'PrimaryTestTextColumn',    
        column_name: 'primary_test_text_column',
      })
      const response = await request(context.app)
        .post(`/api/v1/db/meta/columns/${expectedColumn.id}/primary`)
        .set('xc-auth', context.token)
        .expect(200);

      expect(response.body).to.be.true
      const primaryColumn = (await table.getColumns()).find(
        (column) => column.title === expectedColumn.title && column.pv === 1
      );
      expect(primaryColumn).to.not.be.empty
    });
  })
}

export default function () {
  describe('Columns', columnTests);
}
