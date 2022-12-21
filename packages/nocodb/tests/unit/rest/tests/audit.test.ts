import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import { createProject } from '../../factory/project';
import { createRow } from '../../factory/row';
import { createTable } from '../../factory/table';
import { createAuditEntry } from '../../factory/audit';
import init from '../../init';
import { AuditOperationTypes } from 'nocodb-sdk';

function auditTests() {
  let context;
  let project;
  let table;
  let row;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    row = await createRow(context, {project, table});
  });

  describe('GET:/audits/comments', function() {
    it('gets comments list', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/audits/comments`)
        .set('xc-auth', context.token)
        .query({
          row_id: row.Id,
          fk_model_id: table.id
        })
        .expect(200);

      expect(response.body).to.containSubset([
        {
          user: "test@example.com",
          ip: "::ffff:127.0.0.1",
          base_id: null,
          project_id: project.id,
          fk_model_id: table.id,
          row_id: String(row.Id),
          op_type: "DATA",
          op_sub_type: "INSERT",
          status: null,
          description: "1 inserted into Table1_Title",
          details: null
        },
      ])
    });
  })

  describe('GET:/audits/comments/count', function() {
    it('gets comments count', async function () {
      await createAuditEntry({
        user: context.user.id,
        ip: '127.0.0.1',
        base_id: project.base_id,
        project_id: project.id,
        fk_model_id: table.id,
        row_id: row.Id,
        op_type: AuditOperationTypes.COMMENT,
        created_at: new Date(),
        updated_at: new Date()
      });

      const response = await request(context.app)
        .get(`/api/v1/db/meta/audits/comments/count`)
        .set('xc-auth', context.token)
        .query({
          'ids[]': row.Id,
          fk_model_id: table.id
        })
        .expect(200);

      expect(response.body).to.deep.equal([
        {
          count: 1,
          row_id: "1",
        },
      ])
    });
  })
  
  describe('GET:/projects/:projectId/audits', function() {
    it('gets all project audits list', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/projects/${project.id}/audits`)
        .set('xc-auth', context.token)
        .expect(200);

      expect(response.body).to.containSubset({
        list: [
          {
            user: "test@example.com",
            ip: "::ffff:127.0.0.1",
            base_id: null,
            project_id: project.id,
            fk_model_id: null,
            row_id: null,
            op_type: "TABLE",
            op_sub_type: "CREATED",
            status: null,
            description: `created table ${table.table_name} with alias ${table.title}  `,
            details: null
          },
          {
            user: "test@example.com",
            ip: "::ffff:127.0.0.1",
            base_id: null,
            project_id: project.id,
            fk_model_id: table.id,
            row_id: String(row.Id),
            op_type: "DATA",
            op_sub_type: "INSERT",
            status: null,
            description: `1 inserted into ${table.title}`,
            details: null,
          },
        ],
        pageInfo: {
          totalRows: 2,
          page: 1,
          pageSize: 25,
          isFirstPage: true,
          isLastPage: true,
        },
      })
    });
  })

  describe('POST:/audits/comments', function() {
    it('creates audit comment', async function () {
      const response = await request(context.app)
        .post(`/api/v1/db/meta/audits/comments`)
        .set('xc-auth', context.token)
        .send({
          ip: '127.0.0.1',
          base_id: project.base_id,
          project_id: project.id,
          fk_model_id: table.id,
          row_id: row.Id,
          description: 'New comment',
          created_at: new Date(),
          updated_at: new Date()
        })
        .expect(200);

      expect(response.body).to.containSubset({
        user: context.user.email,
        ip: "127.0.0.1",
        project_id: project.id,
        row_id: row.Id,
        fk_model_id: table.id,
        op_type: "COMMENT",
        description: "New comment",
      })
    });
  })
}

export default function () {
  describe('Audits', auditTests);
}
