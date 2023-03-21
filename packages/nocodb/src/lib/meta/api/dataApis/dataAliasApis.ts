import { Request, Response, Router } from 'express';
import Model from '../../../models/Model';
import { nocoExecute } from 'nc-help';
import Base from '../../../models/Base';
import NcConnectionMgrv2 from '../../../utils/common/NcConnectionMgrv2';
import { PagedResponseImpl } from '../../helpers/PagedResponse';
import View from '../../../models/View';
import ncMetaAclMw from '../../helpers/ncMetaAclMw';
import { getViewAndModelFromRequestByAliasOrId } from './helpers';
import apiMetrics from '../../helpers/apiMetrics';
import getAst from '../../../db/sql-data-mapper/lib/sql/helpers/getAst';
import { parseHrtimeToSeconds } from '../helpers';
import { NcError } from '../../helpers/catchError';

// todo: Handle the error case where view doesnt belong to model
async function dataList(req: Request, res: Response) {
  const startTime = process.hrtime();
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);
  const responseData = await getDataList(model, view, req);
  const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
  res.setHeader('xc-db-response', elapsedSeconds);
  res.json(responseData);
}

async function dataFindOne(req: Request, res: Response) {
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);
  res.json(await getFindOne(model, view, req));
}

async function dataGroupBy(req: Request, res: Response) {
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);
  res.json(await getDataGroupBy(model, view, req));
}

async function dataCount(req, res: Response) {
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);

  const base = await Base.get(model.base_id);

  const baseModel = await Model.getBaseModelSQL({
    id: model.id,
    viewId: view?.id,
    dbDriver: NcConnectionMgrv2.get(base),
    userRoles: req?.session?.passport?.user?.roles,
  });

  const countArgs: any = { ...req.query };
  try {
    countArgs.filterArr = JSON.parse(countArgs.filterArrJson);
  } catch (e) {}

  const count = await baseModel.count(countArgs);

  res.json({ count });
}

// todo: Handle the error case where view doesnt belong to model
async function dataInsert(req, res: Response) {
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);

  const base = await Base.get(model.base_id);

  const baseModel = await Model.getBaseModelSQL({
    id: model.id,
    viewId: view?.id,
    dbDriver: NcConnectionMgrv2.get(base),
    userRoles: req?.session?.passport?.user?.roles,
  });

  res.json(await baseModel.insert(req.body, null, req));
}

async function dataUpdate(req, res: Response) {
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);
  const base = await Base.get(model.base_id);

  const baseModel = await Model.getBaseModelSQL({
    id: model.id,
    viewId: view?.id,
    dbDriver: NcConnectionMgrv2.get(base),
    userRoles: req?.session?.passport?.user?.roles,
  });

  res.json(await baseModel.updateByPk(req.params.rowId, req.body, null, req));
}

async function dataDelete(req, res: Response) {
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);
  const base = await Base.get(model.base_id);
  const baseModel = await Model.getBaseModelSQL({
    id: model.id,
    viewId: view?.id,
    dbDriver: NcConnectionMgrv2.get(base),
    userRoles: req?.session?.passport?.user?.roles,
  });

  // todo: Should have error http status code
  const message = await baseModel.hasLTARData(req.params.rowId, model);
  if (message.length) {
    res.json({ message });
    return;
  }
  res.json(await baseModel.delByPk(req.params.rowId, null, req));
}

async function getDataList(model, view: View, req) {
  const base = await Base.get(model.base_id);

  const baseModel = await Model.getBaseModelSQL({
    id: model.id,
    viewId: view?.id,
    dbDriver: NcConnectionMgrv2.get(base),
    userRoles: req?.session?.passport?.user?.roles,
  });

  const requestObj = await getAst({ model, query: req.query, view });

  const listArgs: any = { ...req.query };
  try {
    listArgs.filterArr = JSON.parse(listArgs.filterArrJson);
  } catch (e) {}
  try {
    listArgs.sortArr = JSON.parse(listArgs.sortArrJson);
  } catch (e) {}

  let data = [];
  let count = 0;
  try {
    data = await nocoExecute(
      requestObj,
      await baseModel.list(listArgs),
      {},
      listArgs
    );
    count = await baseModel.count(listArgs);
  } catch (e) {
    console.log(e);
    NcError.internalServerError(
      'Internal Server Error, check server log for more details'
    );
  }

  return new PagedResponseImpl(data, {
    ...req.query,
    count,
  });
}

async function getDataGroupBy(model, view: View, req) {
  const base = await Base.get(model.base_id);

  const baseModel = await Model.getBaseModelSQL({
    id: model.id,
    viewId: view?.id,
    dbDriver: NcConnectionMgrv2.get(base),
    userRoles: req?.session?.passport?.user?.roles,
  });

  const listArgs: any = { ...req.query };
  const data = await baseModel.groupBy({ ...req.query });
  const count = await baseModel.count(listArgs);

  return new PagedResponseImpl(data as any[], {
    ...req.query,
    count,
  });
}

async function getFindOne(model, view: View, req) {
  const base = await Base.get(model.base_id);

  const baseModel = await Model.getBaseModelSQL({
    id: model.id,
    viewId: view?.id,
    dbDriver: NcConnectionMgrv2.get(base),
    userRoles: req?.session?.passport?.user?.roles,
  });

  const args: any = { ...req.query };
  try {
    args.filterArr = JSON.parse(args.filterArrJson);
  } catch (e) {}
  try {
    args.sortArr = JSON.parse(args.sortArrJson);
  } catch (e) {}

  const data = await baseModel.findOne(args);

  return data?.[0]
    ? await nocoExecute(
        await getAst({ model, query: args, view }),
        data?.[0],
        {},
        {}
      )
    : {};
}

async function dataRead(req, res: Response) {
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);

  const base = await Base.get(model.base_id);

  const baseModel = await Model.getBaseModelSQL({
    id: model.id,
    viewId: view?.id,
    dbDriver: NcConnectionMgrv2.get(base),
    userRoles: req?.session?.passport?.user?.roles,
  });

  const data = await baseModel.readByPk(req.params.rowId);
  if (!data) return res.json({});

  return res.json(
    await nocoExecute(
      await getAst({ model, query: req.query, view }),
      data,
      {},
      req.query
    )
  );
}

async function dataExist(req, res: Response) {
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);

  const base = await Base.get(model.base_id);

  const baseModel = await Model.getBaseModelSQL({
    id: model.id,
    viewId: view?.id,
    dbDriver: NcConnectionMgrv2.get(base),
    userRoles: req?.session?.passport?.user?.roles,
  });

  res.json(await baseModel.exist(req.params.rowId));
}

// todo: Handle the error case where view doesnt belong to model
async function groupedDataList(req: Request, res: Response) {
  const startTime = process.hrtime();
  const { model, view } = await getViewAndModelFromRequestByAliasOrId(req);
  const groupedData = await getGroupedDataList(model, view, req);
  const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
  res.setHeader('xc-db-response', elapsedSeconds);
  res.json(groupedData);
}

async function getGroupedDataList(model, view: View, req) {
  const base = await Base.get(model.base_id);

  const baseModel = await Model.getBaseModelSQL({
    id: model.id,
    viewId: view?.id,
    dbDriver: NcConnectionMgrv2.get(base),
    userRoles: req?.session?.passport?.user?.roles,
  });

  const requestObj = await getAst({ model, query: req.query, view });

  const listArgs: any = { ...req.query };
  try {
    listArgs.filterArr = JSON.parse(listArgs.filterArrJson);
  } catch (e) {}
  try {
    listArgs.sortArr = JSON.parse(listArgs.sortArrJson);
  } catch (e) {}
  try {
    listArgs.options = JSON.parse(listArgs.optionsArrJson);
  } catch (e) {}

  let data = [];
  // let count = 0
  try {
    const groupedData = await baseModel.groupedList({
      ...listArgs,
      groupColumnId: req.params.columnId,
    });
    data = await nocoExecute(
      { key: 1, value: requestObj },
      groupedData,
      {},
      listArgs
    );
    const countArr = await baseModel.groupedListCount({
      ...listArgs,
      groupColumnId: req.params.columnId,
    });
    data = data.map((item) => {
      // todo: use map to avoid loop
      const count =
        countArr.find((countItem: any) => countItem.key === item.key)?.count ??
        0;

      item.value = new PagedResponseImpl(item.value, {
        ...req.query,
        count: count,
      });
      return item;
    });
  } catch (e) {
    console.log(e);
    NcError.internalServerError(
      'Internal Server Error, check server log for more details'
    );
  }
  return data;
}

const router = Router({ mergeParams: true });

// table data crud apis
router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName',
  apiMetrics,
  ncMetaAclMw(dataList, 'dataList')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/find-one',
  apiMetrics,
  ncMetaAclMw(dataFindOne, 'dataFindOne')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/groupby',
  apiMetrics,
  ncMetaAclMw(dataGroupBy, 'dataGroupBy')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/group/:columnId',
  apiMetrics,
  ncMetaAclMw(groupedDataList, 'groupedDataList')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/:rowId/exist',
  apiMetrics,
  ncMetaAclMw(dataExist, 'dataExist')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/count',
  apiMetrics,
  ncMetaAclMw(dataCount, 'dataCount')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName/count',
  apiMetrics,
  ncMetaAclMw(dataCount, 'dataCount')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/:rowId',
  apiMetrics,
  ncMetaAclMw(dataRead, 'dataRead')
);

router.patch(
  '/api/v1/db/data/:orgs/:projectName/:tableName/:rowId',
  apiMetrics,
  ncMetaAclMw(dataUpdate, 'dataUpdate')
);

router.delete(
  '/api/v1/db/data/:orgs/:projectName/:tableName/:rowId',
  apiMetrics,
  ncMetaAclMw(dataDelete, 'dataDelete')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName',
  apiMetrics,
  ncMetaAclMw(dataList, 'dataList')
);

// table view data crud apis
router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName',
  apiMetrics,
  ncMetaAclMw(dataList, 'dataList')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName/find-one',
  apiMetrics,
  ncMetaAclMw(dataFindOne, 'dataFindOne')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName/groupby',
  apiMetrics,
  ncMetaAclMw(dataGroupBy, 'dataGroupBy')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName/group/:columnId',
  apiMetrics,
  ncMetaAclMw(groupedDataList, 'groupedDataList')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName/:rowId/exist',
  apiMetrics,
  ncMetaAclMw(dataExist, 'dataExist')
);

router.post(
  '/api/v1/db/data/:orgs/:projectName/:tableName',
  apiMetrics,
  ncMetaAclMw(dataInsert, 'dataInsert')
);

router.post(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName',
  apiMetrics,
  ncMetaAclMw(dataInsert, 'dataInsert')
);

router.patch(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName/:rowId',
  apiMetrics,
  ncMetaAclMw(dataUpdate, 'dataUpdate')
);

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName/:rowId',
  apiMetrics,
  ncMetaAclMw(dataRead, 'dataRead')
);

router.delete(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName/:rowId',
  apiMetrics,
  ncMetaAclMw(dataDelete, 'dataDelete')
);

export default router;
