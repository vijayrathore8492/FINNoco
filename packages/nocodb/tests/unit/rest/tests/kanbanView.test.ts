import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import * as _ from 'lodash';
import { createProject } from '../../factory/project';
import { createTable } from '../../factory/table';
import init from '../../init';
import { createView, getKanbanView } from '../../factory/view';
import { UITypes, ViewTypes } from 'nocodb-sdk';
import { createColumn } from '../../factory/column';

function KanbanViewTests() {
  let context;
  let project;
  let table;
  let singleSelectColumn;
  let kanbanView;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);    
    singleSelectColumn = await createColumn(context, table, {
      uidt: UITypes.SingleSelect,
      title: 'TestSingleSelectColumn',    
      column_name: 'test_single_select_column',
      colOptions: {
        options: [
          {title: 'optionA'},
          {title: 'optionB'}
        ]
      }
    })
    kanbanView = await createView(context, { title: 'kanbanViewTests', table, type: ViewTypes.KANBAN })
  });

  describe('POST /api/v1/db/meta/tables/:tableId/kanbans', function () {
    it('Creates a kanban view', async function () {
      const response = await request(context.app)
        .post(`/api/v1/db/meta/tables/${table.id}/kanbans`)
        .set('xc-auth', context.token)
        .send({
          fk_grp_col_id: singleSelectColumn.id
        })
        .expect(200);

      expect(response.body).to.containSubset({
        project_id: project.id,
        fk_model_id: table.id,
        title: null,
        type: 4,
        is_default: null,
        show_system_fields: null,
        lock_type: "collaborative",
        uuid: null,
        password: null,
        show: 1,
        order: 3,
        meta: {},
      });
    });
  })

  describe('PATCH /api/v1/db/meta/kanbans/:kanbanViewId', function () {
    it('Updates a kanban view', async function () {
      const title = 'PatchAKanbanViewTest';
      await request(context.app)
        .patch(`/api/v1/db/meta/kanbans/${kanbanView.id}`)
        .set('xc-auth', context.token)
        .send({
          title
        })
        .expect(200);

      const updatedKanbanView = await getKanbanView(kanbanView.id);
      expect(updatedKanbanView.title).to.equal(title);
    });
  })

  describe('GET /api/v1/db/meta/kanbans/:kanbanViewId', function () {
    it('Gets a kanban view', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/kanbans/${kanbanView.id}`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);

      expect(response.body).to.containSubset({
        fk_view_id: kanbanView.id,
        project_id: project.id,
        show: null,
        order: null,
        uuid: null,
        title: null,
        public: null,
        password: null,
        show_all_fields: null,
        fk_grp_col_id: null,
        fk_cover_image_col_id: null,
        meta: null,
      });
    });
  })
}

export default function () {
  describe('KanbanViews', KanbanViewTests);
}
