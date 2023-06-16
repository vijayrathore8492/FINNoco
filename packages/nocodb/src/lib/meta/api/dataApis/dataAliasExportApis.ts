import { Request, Response, Router } from 'express';
import ncMetaAclMw from '../../helpers/ncMetaAclMw';
import { streamResponse } from './helpers';
import apiMetrics from '../../helpers/apiMetrics';
import setClientTimezone from '../../helpers/setClientTimezone';

async function excelDataExport(req: Request, res: Response) {
  await streamResponse(res, req, 'xlsx');
}

async function csvDataExport(req: Request, res: Response) {
  await streamResponse(res, req, 'csv');
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
