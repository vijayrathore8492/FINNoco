import { expect } from 'chai';
import 'mocha';
import { ViewTypes } from 'nocodb-sdk';
import request from 'supertest';
import * as _ from 'lodash';
import { createProject } from '../../factory/project';
import { createTable } from '../../factory/table';
import { createView, getAllSharedViews, getView, shareView } from '../../factory/view';
import init from '../../init';

function ViewTests() {
  let context;
  let project;
  let table;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
  });

  describe('GET /api/v1/db/meta/tables/:tableId/views', function () {
    it('Get views list', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/tables/${table.id}/views`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.containSubset({
        list: [
          {
            ptn: table.table_name,
            _ptn: table.title,
            ptype: "table",
            tn: table.title,
            _tn: table.title,
            project_id: project.id,
            fk_model_id: table.id,
            title: table.title,
            type: 3,
            is_default: 1,
            show_system_fields: null,
            lock_type: "collaborative",
            uuid: null,
            password: null,
            show: 1,
            order: 1,
            meta: {},
            view: {
              project_id: project.id,
              uuid: null,
              meta: null,
            },
            disabled: {
              owner: false,
              creator: false,
              viewer: false,
              editor: false,
              commenter: false,
              guest: false,
            },
          },
        ],
      })
    });
  })

  describe('PATCH /api/v1/db/meta/views/:viewId', function () {
    it('Updates a view', async function () {
      const view = await createView(context, { title: 'patchAViewTest', table, type: ViewTypes.GRID })
      const response = await request(context.app)
        .patch(`/api/v1/db/meta/views/${view.id}`)
        .set('xc-auth', context.token)
        .send({
          title: 'newPatchAViewTest'
        })
        .expect(200);

      expect(response.body).to.containSubset({
        project_id: project.id,
        fk_model_id: table.id,
        title: "newPatchAViewTest",
        type: 3,
        is_default: null,
        show_system_fields: null,
        lock_type: "collaborative",
        uuid: null,
        password: null,
        show: 1,
        order: 2,
        meta: {},
      })
    });
  })

  describe('DELETE /api/v1/db/meta/views/:viewId', function () {
    it('Deletes a view', async function () {
      const view = await createView(context, { title: 'deleteAViewTest', table, type: ViewTypes.GRID })
      await request(context.app)
        .delete(`/api/v1/db/meta/views/${view.id}`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);

      const deletedView = await getView(table.id, view.title);
      expect(deletedView).to.be.not.ok
    })
  })

  describe('GET /api/v1/db/meta/tables/:tableId/share', function () {
    it('List of shared views', async function () {
      const view = await createView(context, { title: 'shareAViewTest', table, type: ViewTypes.GRID })
      await shareView(view.id as string);
      const response = await request(context.app)
        .get(`/api/v1/db/meta/tables/${table.id}/share`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.containSubset([
        {
          id: view.id,
          project_id: project.id,
          fk_model_id: table.id,
          title: "shareAViewTest",
          type: 3,
          is_default: null,
          show_system_fields: null,
          lock_type: "collaborative",
          password: null,
          show: 1,
          order: 2,
          meta: "{\"allowCSVDownload\":true}",
        },
      ])
    })
  })

  describe('POST /api/v1/db/meta/tables/:tableId/share', function () {
    it('share a view', async function () {
      const view = await createView(context, { title: 'shareAViewTest', table, type: ViewTypes.GRID })
      const response = await request(context.app)
        .post(`/api/v1/db/meta/views/${view.id}/share`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      const sharedView = (await getAllSharedViews(table.id)).find(sharedView => sharedView.id === view.id);
      expect(sharedView).to.containSubset(_.omit(response.body, 'meta', 'updated_at'));
    })
  })

  describe('PATCH /api/v1/db/meta/tables/:tableId/share', function () {
    it('update a shared view', async function () {
      const view = await createView(context, { title: 'UpdateASharedViewTest', table, type: ViewTypes.GRID })
      await request(context.app)
        .patch(`/api/v1/db/meta/views/${view.id}/share`)
        .set('xc-auth', context.token)
        .send({
          show_system_fields: true
        })
        .expect(200);

      const updatedView = await getView(table.id, view.title);
      expect(updatedView.show_system_fields).to.be.ok
    })
  })

  describe('DELETE /api/v1/db/meta/tables/:tableId/share', function () {
    it('delete a shared view', async function () {
      const view = await createView(context, { title: 'DeleteASharedViewTest', table, type: ViewTypes.GRID })
      await request(context.app)
        .delete(`/api/v1/db/meta/views/${view.id}/share`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);

      const deletedView = (await getAllSharedViews(table.id)).find(sharedView => sharedView.id === view.id);
      expect(deletedView).to.be.undefined;
    })
  })
}

export default function () {
  describe('Views', ViewTests);
}
