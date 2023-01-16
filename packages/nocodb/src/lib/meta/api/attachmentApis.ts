// @ts-ignore
import { Request, Response, Router } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import path from 'path';
import slash from 'slash';
import mimetypes, { mimeIcons } from '../../utils/mimeTypes';
import { Tele } from 'nc-help';
import ncMetaAclMw from '../helpers/ncMetaAclMw';
import catchError, { NcError } from '../helpers/catchError';
import NcPluginMgrv2 from '../helpers/NcPluginMgrv2';
import Model from '../../../lib/models/Model';
import Project from '../../../lib/models/Project';
import S3 from '../../plugins/s3/S3';
import NcConnectionMgrv2 from '../../utils/common/NcConnectionMgrv2';
import { NC_ATTACHMENT_FIELD_SIZE } from '../../constants';
import { BaseModelSqlv2 } from '../../db/sql-data-mapper/lib/sql/BaseModelSqlv2';
import Base from '../../models/Base';
import Column from '../../models/Column';

// const storageAdapter = new Local();
export async function upload(req: Request, res: Response) {
  const { column, filePath } = await extractInfoFromRequest(req);
  const attachments = await uploadAttachment(
    filePath,
    column,
    req['files'],
    req['ncSiteUrl']
  );

  Tele.emit('evt', { evt_type: 'image:uploaded' });

  res.json(attachments);
}

export async function uploadWithUpdate(req, res: Response) {
  const { model, base, column, filePath } = await extractInfoFromRequest(req);
  const attachments = await uploadAttachment(
    filePath,
    column,
    req['files'],
    req['ncSiteUrl']
  );

  Tele.emit('evt', { evt_type: 'image:uploaded' });

  const baseModel = await Model.getBaseModelSQL({
    id: model.id,
    dbDriver: NcConnectionMgrv2.get(base),
    userRoles: req?.session?.passport?.user?.roles,
  });
  const oldRowData = await baseModel.readByPk(req.params.rowId);
  let oldAttachmentColumnData = JSON.parse(oldRowData[column['title']] || '[]');
  if (!Array.isArray(oldAttachmentColumnData)) oldAttachmentColumnData = [];

  await baseModel.updateByPk(
    req.params.rowId,
    {
      [column['title']]: JSON.stringify(
        oldAttachmentColumnData.concat(attachments)
      ),
    },
    null,
    req
  );
  res.json(attachments);
}

export async function uploadViaURL(req: Request, res: Response) {
  const filePath = sanitizeUrlPath(
    req.query?.path?.toString()?.split('/') || ['']
  );
  const destPath = path.join('nc', 'uploads', ...filePath);

  const storageAdapter = await NcPluginMgrv2.storageAdapter();
  const attachments = await Promise.all(
    req.body?.map?.(async (urlMeta) => {
      const { url, fileName: _fileName } = urlMeta;
      const fileName = `${nanoid(6)}${_fileName || url.split('/').pop()}`;

      let attachmentUrl = await (storageAdapter as any).fileCreateByUrl(
        slash(path.join(destPath, fileName)),
        url
      );

      if (!attachmentUrl) {
        attachmentUrl = `${(req as any).ncSiteUrl}/download/${filePath.join(
          '/'
        )}/${fileName}`;
      }

      return {
        url: attachmentUrl,
        title: fileName,
        mimetype: urlMeta.mimetype,
        size: urlMeta.size,
        icon: mimeIcons[path.extname(fileName).slice(1)] || undefined,
      };
    })
  );

  Tele.emit('evt', { evt_type: 'image:uploaded' });

  res.json(attachments);
}

export async function fileRead(req, res) {
  try {
    const storageAdapter = await NcPluginMgrv2.storageAdapter();
    // const type = mimetypes[path.extname(req.s.fileName).slice(1)] || 'text/plain';
    const type =
      mimetypes[path.extname(req.params?.[0]).split('/').pop().slice(1)] ||
      'text/plain';
    // const img = await this.storageAdapter.fileRead(slash(path.join('nc', req.params.projectId, req.params.dbAlias, 'uploads', req.params.fileName)));
    const img = await storageAdapter.fileRead(
      slash(
        path.join(
          'nc',
          'uploads',
          req.params?.[0]
            ?.split('/')
            .filter((p) => p !== '..')
            .join('/')
        )
      )
    );
    res.writeHead(200, { 'Content-Type': type });
    res.end(img, 'binary');
  } catch (e) {
    console.log(e);
    res.status(404).send('Not found');
  }
}

async function uploadAttachment(filePath, column, files, ncSiteUrl) {
  if (!column) {
    NcError.badRequest(`Attachment column is invalid.`);
  }
  const destPath = path.join('nc', 'uploads', ...filePath);

  const storageAdapter = await NcPluginMgrv2.storageAdapter();
  return Promise.all(
    files?.map(async (file) => {
      const fileName = `${nanoid(6)}${path.extname(file.originalname)}`;
      const relativePath = slash(path.join(destPath, fileName));
      let url = await storageAdapter.fileCreate(
        relativePath,
        file,
        column.public
      );

      if (!url) {
        url = `${ncSiteUrl}/download/${filePath.join('/')}/${fileName}`;
      }

      return {
        url,
        title: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        icon: mimeIcons[path.extname(file.originalname).slice(1)] || undefined,
        ...(!column.public ? s3KeyObject(storageAdapter, relativePath) : {}),
      };
    })
  );
}

async function extractInfoFromRequest(req): Promise<{
  model: Model;
  base: Base;
  column: Column | undefined;
  filePath: string;
}> {
  const filePath = sanitizeUrlPath(
    req.query?.path?.toString()?.split('/') || ['']
  );
  const [_, projectName, tableName, columnName] = filePath;
  const project = await Project.getWithInfoByTitle(projectName);
  const base = project.bases[0];
  const model = await Model.getByAliasOrId({
    project_id: project.id,
    base_id: base.id,
    aliasOrId: tableName,
  });
  const columns = BaseModelSqlv2.filterColumnsByUserRoles(
    await model.getColumns(),
    req?.session?.passport?.user?.roles
  );
  return {
    model,
    base,
    column: columns.find((column) => column.column_name === columnName),
    filePath,
  };
}

function s3KeyObject(storageAdapter, key: string) {
  if (!(storageAdapter instanceof S3)) return {};

  return {
    S3Key: key,
    url: storageAdapter.getSignedUrl(key),
  };
}

const router = Router({ mergeParams: true });

router.get(/^\/dl\/([^/]+)\/([^/]+)\/(.+)$/, async (req, res) => {
  try {
    // const type = mimetypes[path.extname(req.params.fileName).slice(1)] || 'text/plain';
    const type =
      mimetypes[path.extname(req.params[2]).split('/').pop().slice(1)] ||
      'text/plain';

    const storageAdapter = await NcPluginMgrv2.storageAdapter();
    // const img = await this.storageAdapter.fileRead(slash(path.join('nc', req.params.projectId, req.params.dbAlias, 'uploads', req.params.fileName)));
    const img = await storageAdapter.fileRead(
      slash(
        path.join(
          'nc',
          req.params[0],
          req.params[1],
          'uploads',
          ...req.params[2].split('/')
        )
      )
    );
    res.writeHead(200, { 'Content-Type': type });
    res.end(img, 'binary');
  } catch (e) {
    res.status(404).send('Not found');
  }
});

export function sanitizeUrlPath(paths) {
  return paths.map((url) => url.replace(/[/.?#]+/g, '_'));
}

router.post(
  '/api/v1/db/storage/upload',
  multer({
    storage: multer.diskStorage({}),
    limits: {
      fieldSize: NC_ATTACHMENT_FIELD_SIZE,
    },
  }).any(),
  ncMetaAclMw(upload, 'upload')
);
router.post(
  '/api/v1/db/storage/upload-by-url',
  ncMetaAclMw(uploadViaURL, 'uploadViaURL')
);
router.post(
  '/api/v1/db/storage/upload-with-update/:rowId',
  multer({
    storage: multer.diskStorage({}),
  }).any(),
  ncMetaAclMw(uploadWithUpdate, 'upload')
);
router.get(/^\/download\/(.+)$/, catchError(fileRead));

export default router;
