import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import { createProject } from '../../factory/project';
import { createTable } from '../../factory/table';
import init from '../../init';
import { UITypes } from 'nocodb-sdk';
import { createColumn } from '../../factory/column';
import { createRow } from '../../factory/row';

function attachmentTests() {
  let context;
  let project;
  let table;
  let attachmentColumn;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    attachmentColumn = await createColumn(context, table, {
      uidt: UITypes.Attachment,
      title: 'files',    
      column_name: 'files',
    });
  });

  describe('/upload', function() {
    it('errors when incorrect path in query', async function () {
      const buffer = Buffer.from('some data');
      await request(context.app)
        .post(`/api/v1/db/storage/upload`)
        .set('xc-auth', context.token)
        .query({
          path: '/incorrect/path'
        })
        .attach('files', buffer, 'testfile.txt')
        .expect(400);
    });
  
    it('uploads file with correct path in query', async function () {
      const buffer = Buffer.from('some data');
      const response = await request(context.app)
        .post(`/api/v1/db/storage/upload`)
        .set('xc-auth', context.token)
        .query({
          path: `/${project.title}/${table.title}/${attachmentColumn.column_name}`
        })
        .attach('files', buffer, 'testfile.txt')
        .expect(200);
  
      expect(response.body).to.containSubset([
        {
          title: "testfile.txt",
          mimetype: "text/plain",
          size: 9,
        },
      ])
    });
  })

  describe('/upload-with-update/:rowId', function() {
    it('errors when incorrect path in query', async function () {
      const buffer = Buffer.from('some data');
      await request(context.app)
        .post(`/api/v1/db/storage/upload-with-update/1`)
        .set('xc-auth', context.token)
        .query({
          path: '/incorrect/path'
        })
        .attach('files', buffer, 'testfile.txt')
        .expect(400);
    });
    
    it('errors when missing rowId', async function () {
      const buffer = Buffer.from('some data');
      await request(context.app)
        .post(`/api/v1/db/storage/upload-with-update`)
        .set('xc-auth', context.token)
        .query({
          path: `/${project.title}/${table.title}/${attachmentColumn.column_name}`
        })
        .attach('files', buffer, 'testfile.txt')
        .expect(404);
    });
    
    it('errors when incorrect rowId', async function () {
      const buffer = Buffer.from('some data');
      await request(context.app)
        .post(`/api/v1/db/storage/upload-with-update/incorret_row_id`)
        .set('xc-auth', context.token)
        .query({
          path: `/${project.title}/${table.title}/${attachmentColumn.column_name}`
        })
        .attach('files', buffer, 'testfile.txt')
        .expect(400);
    });

    it('uploads file and updates row with correct path and rowId in query', async function () {
      const row = await createRow(context, {project, table});
      const buffer = Buffer.from('some data');
      const response = await request(context.app)
        .post(`/api/v1/db/storage/upload-with-update/${row.Id}`)
        .set('xc-auth', context.token)
        .query({
          path: `/${project.title}/${table.title}/${attachmentColumn.column_name}`
        })
        .attach('files', buffer, 'testfile.txt')
        .expect(200);
  
      expect(response.body).to.containSubset([
        {
          title: "testfile.txt",
          mimetype: "text/plain",
          size: 9,
        },
      ])
    });
  })
}

export default function () {
  describe('Attachment', attachmentTests);
}
