import { ViewTypes } from 'nocodb-sdk';
import request from 'supertest';
import Model from '../../../src/lib/models/Model';
import View from '../../../src/lib/models/View';

const createView = async (context, { title, table, type }: { title: string, table: Model, type: ViewTypes }) => {
  const viewTypeStr = (type) => {
    switch (type) {
      case ViewTypes.GALLERY:
        return 'galleries';
      case ViewTypes.FORM:
        return 'forms';
      case ViewTypes.GRID:
        return 'grids';
      case ViewTypes.KANBAN:
        return 'kanbans';
      default:
        throw new Error('Invalid view type');
    }
  };

  const response = await request(context.app)
    .post(`/api/v1/db/meta/tables/${table.id}/${viewTypeStr(type)}`)
    .set('xc-auth', context.token)
    .send({
      title,
      type,
    });
  if (response.status !== 200) {
    throw new Error('createView', response.body.message);
  }

  const view = await View.getByTitleOrId({ fk_model_id: table.id, titleOrId: title }) as View;

  return view
}

const getView = async (tableId, viewTitle) => {
  return await View.getByTitleOrId({ fk_model_id: tableId, titleOrId: viewTitle }) as View;
}

const shareView = async (viewId: string) => {
  return await View.share(viewId)
}

const getAllSharedViews = async (tableId: string) => {
  return await View.shareViewList(tableId);
}

const insertOrUpdateColumnInView = async (viewId, columnId, colData) => {
  return await View.insertOrUpdateColumn(
    viewId,
    columnId,
    colData
  );
}

export { createView, getView, shareView, getAllSharedViews, insertOrUpdateColumnInView }