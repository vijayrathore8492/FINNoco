import { Request, Response, Router } from 'express';
import * as XLSX from 'xlsx';
import ncMetaAclMw from '../../helpers/ncMetaAclMw';
import {
  extractCsvData,
  extractXlsxData,
  getViewAndModelFromRequestByAliasOrId,
} from './helpers';
import apiMetrics from '../../helpers/apiMetrics';
import View from '../../../models/View';
import setClientTimezone from '../../helpers/setClientTimezone';

async function excelDataExport(req: Request, res: Response) {
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);
  let targetView = view;
  if (!targetView) {
    targetView = await View.getDefaultView(model.id);
  }
  const { offset, elapsed, data } = await extractXlsxData(targetView, req);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, data, targetView.title);
  const buf = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  res.set({
    'Access-Control-Expose-Headers': 'nc-export-offset',
    'nc-export-offset': offset,
    'nc-export-elapsed-time': elapsed,
    'Content-Disposition': `attachment; filename="${encodeURI(
      targetView.title
    )}-export.xlsx"`,
  });
  res.end(buf);
}

async function csvDataExport(req: Request, res: Response) {
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);
  let targetView = view;
  if (!targetView) {
    targetView = await View.getDefaultView(model.id);
  }
  const { offset, elapsed, data } = await extractCsvData(targetView, req);

  res.set({
    'Access-Control-Expose-Headers': 'nc-export-offset',
    'nc-export-offset': offset,
    'nc-export-elapsed-time': elapsed,
    'Content-Disposition': `attachment; filename="${encodeURI(
      targetView.title
    )}-export.csv"`,
  });
  res.send(data);
}

const router = Router({ mergeParams: true });

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/export/csv',
  apiMetrics,
  setClientTimezone,
  ncMetaAclMw(csvDataExport, 'exportCsv')
);
router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName/export/csv',
  apiMetrics,
  setClientTimezone,
  ncMetaAclMw(csvDataExport, 'exportCsv')
);
router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/export/excel',
  apiMetrics,
  setClientTimezone,
  ncMetaAclMw(excelDataExport, 'exportExcel')
);
router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName/export/excel',
  apiMetrics,
  setClientTimezone,
  ncMetaAclMw(excelDataExport, 'exportExcel')
);

export default router;
