import 'mocha';
import init from '../../init';
import { BaseModelSqlv2 } from '../../../../src/lib/db/sql-data-mapper/lib/sql/BaseModelSqlv2';
import { createProject } from '../../factory/project';
import { createTable } from '../../factory/table';
import NcConnectionMgrv2 from '../../../../src/lib/utils/common/NcConnectionMgrv2';
import Base from '../../../../src/lib/models/Base';
import Model from '../../../../src/lib/models/Model';
import Project from '../../../../src/lib/models/Project';
import View from '../../../../src/lib/models/View';
import { createRow, generateDefaultRowAttributes } from '../../factory/row';
import Audit from '../../../../src/lib/models/Audit';
import { expect } from 'chai';
import Filter from '../../../../src/lib/models/Filter';
import { createLtarColumn } from '../../factory/column';
import LinkToAnotherRecordColumn from '../../../../src/lib/models/LinkToAnotherRecordColumn';
import { isSqlite } from '../../init/db';

function baseModelSqlTests() {
  let context;
  let project: Project;
  let table: Model;
  let view: View;
  let baseModelSql: BaseModelSqlv2;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    view = await table.getViews()[0];

    const base = await Base.get(table.base_id);
    baseModelSql = new BaseModelSqlv2({
      dbDriver: NcConnectionMgrv2.get(base),
      model: table,
      view
    })
  });

  it('Insert record', async () => {
    const request = {
      clientIp: '::ffff:192.0.0.1',
      user: {email: 'test@example.com'}
    }
    const columns = await table.getColumns();

    const inputData = generateDefaultRowAttributes({columns})
    const response = await baseModelSql.insert(generateDefaultRowAttributes({columns}), undefined, request);
    const insertedRow = (await baseModelSql.list())[0];

    expect(insertedRow).to.include(inputData);
    expect(insertedRow).to.include(response);

    const rowInsertedAudit = (await Audit.projectAuditList(project.id, {})).find((audit) => audit.op_sub_type === 'INSERT');
    expect(rowInsertedAudit).to.include({
      user: 'test@example.com',
      ip: '::ffff:192.0.0.1',
      base_id: null,
      project_id: project.id,
      fk_model_id: table.id,
      row_id: '1',
      op_type: 'DATA',
      op_sub_type: 'INSERT',
      description: '1 inserted into Table1_Title',
    });
  });

  it('Bulk insert record', async () => {
    const columns = await table.getColumns();
    const request = {
      clientIp: '::ffff:192.0.0.1',
      user: {email: 'test@example.com'}
    }
    const bulkData = Array(10).fill(0).map((_, index) => generateDefaultRowAttributes({columns, index}))
    await baseModelSql.bulkInsert(bulkData, {cookie:request});

    const insertedRows = await baseModelSql.list();

    bulkData.forEach((inputData, index) => {
      expect(insertedRows[index]).to.include(inputData);
    });

    const rowBulkInsertedAudit = (await Audit.projectAuditList(project.id, {})).find((audit) => audit.op_sub_type === 'BULK_INSERT');;
    expect(rowBulkInsertedAudit).to.include({
      user: 'test@example.com',
      ip: '::ffff:192.0.0.1',
      base_id: null,
      project_id: project.id,
      fk_model_id: table.id,
      row_id: null,
      op_type: 'DATA',
      op_sub_type: 'BULK_INSERT',
      status: null,
      description: '10 records bulk inserted into Table1_Title',
      details: null,
    });
  });

  it('Update record', async () => {
    const rowId = 1;
    const request = {
      clientIp: '::ffff:192.0.0.1',
      user: {email: 'test@example.com'},
      params: { rowId },
      body: {Title: 'test'}
    }

    const columns = await table.getColumns();

    await baseModelSql.insert(generateDefaultRowAttributes({columns}));
    await baseModelSql.updateByPk(rowId, request.body, undefined, request);

    const updatedRow = await baseModelSql.readByPk(1);

    expect(updatedRow).to.include({Id: rowId, Title: 'test'});

    const rowUpdatedAudit = (await Audit.projectAuditList(project.id, {})).find((audit) => audit.op_sub_type === 'UPDATE');
    expect(rowUpdatedAudit).to.include({
      user: 'test@example.com',
      ip: '::ffff:192.0.0.1',
      base_id: null,
      project_id: project.id,
      fk_model_id: table.id,
      row_id: '1',
      op_type: 'DATA',
      op_sub_type: 'UPDATE',
      description: `Table ${table.table_name} : 1 field Title got changed from test-0 to test`,
    });
  });

  it('Bulk update record', async () => {
    // Since sqlite doesn't support multiple sql connections, we can't test bulk update in sqlite
    if(isSqlite(context)) return

    const columns = await table.getColumns();
    const request = {
      clientIp: '::ffff:192.0.0.1',
      user: {email: 'test@example.com'}
    }
    const bulkData = Array(10).fill(0).map((_, index) => generateDefaultRowAttributes({columns, index}))
    await baseModelSql.bulkInsert(bulkData, {cookie:request});

    const insertedRows: any[] = await baseModelSql.list();

    await baseModelSql.bulkUpdate(insertedRows.map((row)=> ({...row, Title: `new-${row['Title']}`})), { cookie: request });

    const updatedRows = await baseModelSql.list();

    updatedRows.forEach((row, index) => {
      expect(row['Title']).to.equal(`new-test-${index}`);
    })
    const rowBulkUpdateAudit = (await Audit.projectAuditList(project.id, {})).find((audit) => audit.op_sub_type === 'BULK_UPDATE');
    expect(rowBulkUpdateAudit).to.include({
      user: 'test@example.com',
      ip: '::ffff:192.0.0.1',
      base_id: null,
      fk_model_id: table.id,
      project_id: project.id,
      row_id: null,
      op_type: 'DATA',
      op_sub_type: 'BULK_UPDATE',
      status: null,
      description: '10 records bulk updated in Table1_Title',
      details: null,
    });
  });

  it('Bulk update all record', async () => {
    const columns = await table.getColumns();
    const request = {
      clientIp: '::ffff:192.0.0.1',
      user: {email: 'test@example.com'}
    }
    const bulkData = Array(10).fill(0).map((_, index) => generateDefaultRowAttributes({columns, index}))
    await baseModelSql.bulkInsert(bulkData, {cookie:request});

    const idColumn = columns.find((column) => column.title === 'Id')!;

    await baseModelSql.bulkUpdateAll({filterArr: [
      new Filter({
        logical_op: 'and',
        fk_column_id: idColumn.id,
        comparison_op: 'lt',
        value: 5,
      })
    ]}, ({Title: 'new-1'}), { cookie: request });

    const updatedRows = await baseModelSql.list();

    updatedRows.forEach((row) => {
      if(row.id < 5) expect(row['Title']).to.equal('new-1');
    })
    const rowBulkUpdateAudit = (await Audit.projectAuditList(project.id, {})).find((audit) => audit.op_sub_type === 'BULK_UPDATE');
    expect(rowBulkUpdateAudit).to.include({
      user: 'test@example.com',
      ip: '::ffff:192.0.0.1',
      base_id: null,
      fk_model_id: table.id,
      project_id: project.id,
      row_id: null,
      op_type: 'DATA',
      op_sub_type: 'BULK_UPDATE',
      status: null,
      description: '4 records bulk updated in Table1_Title',
      details: null,
    });
  });

  it('Delete record', async () => {
    const request = {
      clientIp: '::ffff:192.0.0.1',
      user: {email: 'test@example.com'},
      params: {id: 1}
    }

    const columns = await table.getColumns();
    const bulkData = Array(10).fill(0).map((_, index) => generateDefaultRowAttributes({columns, index}))
    await baseModelSql.bulkInsert(bulkData, {cookie:request});
    
    const rowIdToDeleted = 1;
    await baseModelSql.delByPk(rowIdToDeleted,undefined ,request);

    const deletedRow = await baseModelSql.readByPk(rowIdToDeleted);

    expect(deletedRow).to.be.undefined;

    console.log('Delete record', await Audit.projectAuditList(project.id, {}));
    const rowDeletedAudit = (await Audit.projectAuditList(project.id, {})).find((audit) => audit.op_sub_type === 'DELETE');
    expect(rowDeletedAudit).to.include({
      user: 'test@example.com',
      ip: '::ffff:192.0.0.1',
      base_id: null,
      project_id: project.id,
      fk_model_id: table.id,
      row_id: '1',
      op_type: 'DATA',
      op_sub_type: 'DELETE',
      description: '1 deleted from Table1_Title',
    });
  });

  it('Bulk delete records', async () => {
    const columns = await table.getColumns();
    const request = {
      clientIp: '::ffff:192.0.0.1',
      user: {email: 'test@example.com'}
    }
    const bulkData = Array(10).fill(0).map((_, index) => generateDefaultRowAttributes({columns, index}))
    await baseModelSql.bulkInsert(bulkData, {cookie:request});

    const insertedRows: any[] = await baseModelSql.list();

    await baseModelSql.bulkDelete(
      insertedRows
        .filter((row) => row['Id'] < 5)
        .map((row)=> ({'id': row['Id']})), 
      { cookie: request }
    );

    const remainingRows = await baseModelSql.list();

    expect(remainingRows).to.length(6);

    const rowBulkDeleteAudit = (await Audit.projectAuditList(project.id, {})).find((audit) => audit.op_sub_type === 'BULK_DELETE');

    expect(rowBulkDeleteAudit).to.include({
      user: 'test@example.com',
      ip: '::ffff:192.0.0.1',
      base_id: null,
      fk_model_id: table.id,
      project_id: project.id,
      row_id: null,
      op_type: 'DATA',
      op_sub_type: 'BULK_DELETE',
      status: null,
      description: '4 records bulk deleted in Table1_Title',
      details: null,
    });
  });

  it('Bulk delete all record', async () => {
    const columns = await table.getColumns();
    const request = {
      clientIp: '::ffff:192.0.0.1',
      user: {email: 'test@example.com'}
    }
    const bulkData = Array(10).fill(0).map((_, index) => generateDefaultRowAttributes({columns, index}))
    await baseModelSql.bulkInsert(bulkData, {cookie:request});

    const idColumn = columns.find((column) => column.title === 'Id')!;

    await baseModelSql.bulkDeleteAll({filterArr: [
      new Filter({
        logical_op: 'and',
        fk_column_id: idColumn.id,
        comparison_op: 'lt',
        value: 5,
      })
    ]}, { cookie: request });

    const remainingRows = await baseModelSql.list();

    expect(remainingRows).to.length(6);
    const rowBulkDeleteAudit = (await Audit.projectAuditList(project.id, {})).find((audit) => audit.op_sub_type === 'BULK_DELETE');
    expect(rowBulkDeleteAudit).to.include({
      user: 'test@example.com',
      ip: '::ffff:192.0.0.1',
      base_id: null,
      fk_model_id: table.id,
      project_id: project.id,
      row_id: null,
      op_type: 'DATA',
      op_sub_type: 'BULK_DELETE',
      status: null,
      description: '4 records bulk deleted in Table1_Title',
      details: null,
    });
  });

  it('Nested insert', async () => {
    const childTable = await createTable(context, project, {
      title: 'Child Table',
      table_name: 'child_table',
    })
    const ltarColumn = await createLtarColumn(context, {
      title: 'Ltar Column',
      parentTable: table,
      childTable,
      type: "hm"
    })
    const childRow = await createRow(context, {
      project,
      table: childTable,
    })
    const ltarColOptions = await ltarColumn.getColOptions<LinkToAnotherRecordColumn>();
    const childCol = await ltarColOptions.getChildColumn();


    const columns = await table.getColumns();
    const request = {
      clientIp: '::ffff:192.0.0.1',
      user: {email: 'test@example.com'}
    }

    await baseModelSql.nestedInsert(
      {...generateDefaultRowAttributes({columns}), [ltarColumn.title]: [{'Id': childRow['Id']}]}, 
      undefined, 
      request
    );

    const childBaseModel = new BaseModelSqlv2({
      dbDriver: NcConnectionMgrv2.get(await Base.get(table.base_id)),
      model: childTable,
      view
    })
    const insertedChildRow = await childBaseModel.readByPk(childRow['Id']);
    expect(insertedChildRow[childCol.column_name]).to.equal(childRow['Id']);

    const rowInsertedAudit = (await Audit.projectAuditList(project.id, {}))
      .filter((audit) => audit.fk_model_id === table.id)
      .find((audit) => audit.op_sub_type === 'INSERT');

    expect(rowInsertedAudit).to.include({
      user: 'test@example.com',
      ip: '::ffff:192.0.0.1',
      base_id: null,
      project_id: project.id,
      fk_model_id: table.id,
      row_id: '1',
      op_type: 'DATA',
      op_sub_type: 'INSERT',
      description: '1 inserted into Table1_Title',
    });
  })

  it('Link child', async () => {
    const childTable = await createTable(context, project, {
      title: 'Child Table',
      table_name: 'child_table',
    })
    const ltarColumn = await createLtarColumn(context, {
      title: 'Ltar Column',
      parentTable: table,
      childTable,
      type: "hm"
    })
    const insertedChildRow = await createRow(context, {
      project,
      table: childTable,
    })
    const ltarColOptions = await ltarColumn.getColOptions<LinkToAnotherRecordColumn>();
    const childCol = await ltarColOptions.getChildColumn();

    const columns = await table.getColumns();
    const request = {
      clientIp: '::ffff:192.0.0.1',
      user: {email: 'test@example.com'}
    }

    await baseModelSql.insert(generateDefaultRowAttributes({columns}), undefined, request);
    const insertedRow = await baseModelSql.readByPk(1);

    await baseModelSql.addChild({
      colId: ltarColumn.id,
      rowId: insertedRow['Id'],
      childId: insertedChildRow['Id'],
      cookie: request
    });
    
    const childBaseModel = new BaseModelSqlv2({
      dbDriver: NcConnectionMgrv2.get(await Base.get(table.base_id)),
      model: childTable,
      view
    })
    const updatedChildRow = await childBaseModel.readByPk(insertedChildRow['Id']);

    expect(updatedChildRow[childCol.column_name]).to.equal(insertedRow['Id']);

    const rowInsertedAudit = (await Audit.projectAuditList(project.id, {}))
      .filter((audit) => audit.fk_model_id === table.id)
      .find((audit) => audit.op_sub_type === 'LINK_RECORD');

    expect(rowInsertedAudit).to.include({
      user: 'test@example.com',
      ip: '::ffff:192.0.0.1',
      base_id: null,
      project_id: project.id,
      fk_model_id: table.id,
      row_id: '1',
      op_type: 'DATA',
      op_sub_type: 'LINK_RECORD',
      description: 'Record [id:1] record linked with record [id:1] record in Table1_Title',
    });
  })

  it('Unlink child', async () => {
    const childTable = await createTable(context, project, {
      title: 'Child Table',
      table_name: 'child_table',
    })
    const ltarColumn = await createLtarColumn(context, {
      title: 'Ltar Column',
      parentTable: table,
      childTable,
      type: "hm"
    })
    const insertedChildRow = await createRow(context, {
      project,
      table: childTable,
    })
    const ltarColOptions = await ltarColumn.getColOptions<LinkToAnotherRecordColumn>();
    const childCol = await ltarColOptions.getChildColumn();

    const columns = await table.getColumns();
    const request = {
      clientIp: '::ffff:192.0.0.1',
      user: {email: 'test@example.com'}
    }

    await baseModelSql.insert(generateDefaultRowAttributes({columns}), undefined, request);
    const insertedRow = await baseModelSql.readByPk(1);

    await baseModelSql.addChild({
      colId: ltarColumn.id,
      rowId: insertedRow['Id'],
      childId: insertedChildRow['Id'],
      cookie: request
    });

    await baseModelSql.removeChild({
      colId: ltarColumn.id,
      rowId: insertedRow['Id'],
      childId: insertedChildRow['Id'],
      cookie: request
    });
    
    const childBaseModel = new BaseModelSqlv2({
      dbDriver: NcConnectionMgrv2.get(await Base.get(table.base_id)),
      model: childTable,
      view
    })
    const updatedChildRow = await childBaseModel.readByPk(insertedChildRow['Id']);

    expect(updatedChildRow[childCol.column_name]).to.be.null;

    const rowInsertedAudit = (await Audit.projectAuditList(project.id, {}))
      .filter((audit) => audit.fk_model_id === table.id)
      .find((audit) => audit.op_sub_type === 'UNLINK_RECORD');

    expect(rowInsertedAudit).to.include({
      user: 'test@example.com',
      ip: '::ffff:192.0.0.1',
      base_id: null,
      project_id: project.id,
      fk_model_id: table.id,
      row_id: '1',
      op_type: 'DATA',
      op_sub_type: 'UNLINK_RECORD',
      description: 'Record [id:1] record unlinked with record [id:1] record in Table1_Title',
    });
  })
}

export default function () {
  describe('BaseModelSql', baseModelSqlTests);
}
