import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import * as _ from 'lodash';
import { createProject } from '../../factory/project';
import { createTable } from '../../factory/table';
import init from '../../init';
import { createView, getFormView, getView } from '../../factory/view';
import { ViewTypes } from 'nocodb-sdk';

function FormViewTests() {
  let context;
  let project;
  let table;
  let formView;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    formView = await createView(context, { title: 'formViewTests', table, type: ViewTypes.FORM })
  });

  describe('POST /api/v1/db/meta/tables/:tableId/forms', function () {
    it('Creates a form view', async function () {
      const response = await request(context.app)
        .post(`/api/v1/db/meta/tables/${table.id}/forms`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.containSubset({
        "fk_model_id": table.id,
        "is_default": null,
        "lock_type": "collaborative",
        "meta": null,
        "order": 2,
        "password": null,
        "project_id": project.id,
        "show": 1,
        "show_system_fields": null,
        "title": null,
        "type": 1,
        "uuid": null,
      });
    });
  })

  describe('GET /api/v1/db/meta/forms/:formViewId', function () {
    it('Gets a form view', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/forms/${formView.id}`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.containSubset({
        project_id: project.id,
        fk_view_id: formView.id,
        heading: formView.title,
        subheading: null,
        success_msg: null,
        redirect_url: null,
        redirect_after_secs: null,
        email: null,
        submit_another_form: null,
        show_blank_form: null,
        uuid: null,
        banner_image_url: null,
        logo_url: null,
        meta: {},
        columns: [
          {
            project_id: project.id,
            fk_view_id: formView.id,
            uuid: null,
            label: null,
            help: null,
            description: null,
            required: null,
            show: 0,
            order: 1,
            meta: {}
          },
          {
            project_id: project.id,
            fk_view_id: formView.id,
            uuid: null,
            label: null,
            help: null,
            description: null,
            required: null,
            show: 1,
            order: 2,
            meta: {}
          },
          {
            project_id: project.id,
            fk_view_id: formView.id,
            uuid: null,
            label: null,
            help: null,
            description: null,
            required: null,
            show: 0,
            order: 3,
            meta: {}
          },
          {
            project_id: project.id,
            fk_view_id: formView.id,
            uuid: null,
            label: null,
            help: null,
            description: null,
            required: null,
            show: 0,
            order: 4,
            meta: {}
          }
        ]
      });
    });
  })

  describe('PATCH /api/v1/db/meta/forms/:formViewId', function () {
    it('updates a form view', async function () {
      const subheading = "test updating a view";
      const response = await request(context.app)
        .patch(`/api/v1/db/meta/forms/${formView.id}`)
        .set('xc-auth', context.token)
        .send({
          subheading
        })
        .expect(200);

      expect(response.body).to.equal(1);
      const updatedView = await getFormView(formView.id);
      expect(updatedView.subheading).to.equal(subheading);
    });
  })

  describe('PATCH /api/v1/db/meta/form-columns/:formViewColumnId', function () {
    it('updates a form view column', async function () {
      const columns = await formView.getColumns();
      const helpText = 'patchFormViewColumnTest';
      console.log(columns[0]);
      await request(context.app)
        .patch(`/api/v1/db/meta/form-columns/${columns[0].id}`)
        .set('xc-auth', context.token)
        .send({
          show: 1,
          order: 5,
          help: helpText
        })
        .expect(200);

      const updatedColumn = (await formView.getColumns()).find(col => col.id === columns[0].id);
      expect(updatedColumn.show).to.equal(1);
      expect(updatedColumn.order).to.equal(5);
      expect(updatedColumn.help).to.equal(helpText);
    });
  })
}

export default function () {
  describe('FormViews', FormViewTests);
}
