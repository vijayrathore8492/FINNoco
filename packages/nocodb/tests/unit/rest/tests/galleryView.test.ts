import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import * as _ from 'lodash';
import { createProject } from '../../factory/project';
import { createTable } from '../../factory/table';
import init from '../../init';
import { createView, getGalleryView } from '../../factory/view';
import { ViewTypes } from 'nocodb-sdk';

function GalleryViewTests() {
  let context;
  let project;
  let table;
  let galleryView;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
    table = await createTable(context, project);
    galleryView = await createView(context, { title: 'GalleryViewTests', table, type: ViewTypes.GALLERY })
  });

  describe('POST /api/v1/db/meta/tables/:tableId/galleries', function () {
    it('Creates a gallery view', async function () {
      const response = await request(context.app)
        .post(`/api/v1/db/meta/tables/${table.id}/galleries`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.containSubset({
        "fk_model_id": table.id,
        "is_default": null,
        "lock_type": "collaborative",
        "meta": null,
        "order": 3,
        "password": null,
        "project_id": project.id,
        "show": 1,
        "show_system_fields": null,
        "title": null,
        "type": 2,
        "uuid": null,
      });
    });
  })

  describe('GET /api/v1/db/meta/galleries/:galleryViewId', function () {
    it('Gets a gallery view', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/galleries/${galleryView.id}`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.containSubset({
        project_id: project.id,
        fk_view_id: galleryView.id,
        next_enabled: null,
        prev_enabled: null,
        cover_image_idx: null,
        fk_cover_image_col_id: null,
        cover_image: null,
        restrict_types: null,
        restrict_size: null,
        restrict_number: null,
        public: null,
        dimensions: null,
        responsive_columns: null,
        meta: null,
      });
    })
  })

  describe('PATCH /api/v1/db/meta/galleries/:galleryViewId', function () {
    it('updates a gallery view', async function () {
      const response = await request(context.app)
        .patch(`/api/v1/db/meta/galleries/${galleryView.id}`)
        .set('xc-auth', context.token)
        .send({
          next_enabled: true,
          prev_enabled: false
        })
        .expect(200);

      expect(response.body).to.equal(1);
      const updateGalleryView = await getGalleryView(galleryView.id);
      expect(updateGalleryView.next_enabled).to.be.ok
      expect(updateGalleryView.prev_enabled).not.to.ok    
    });
  })
}

export default function () {
  describe('GalleryViews', GalleryViewTests);
}
