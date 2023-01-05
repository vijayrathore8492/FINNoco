import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import { createProject } from '../../factory/project';
import { createUser, addUserToProject, getProjectUser } from '../../factory/user';
import init from '../../init';

function ProjectUserTest() {
  let context;
  let project;

  beforeEach(async function () {
    context = await init();
    project = await createProject(context);
  });

  describe('GET: /api/v1/db/meta/projects/:projectId/users', function () {
    it('Gets list of users for project', async function () {
      const response = await request(context.app)
        .get(`/api/v1/db/meta/projects/${project.id}/users`)
        .set('xc-auth', context.token)
        .send({})
        .expect(200);

      expect(response.body).to.containSubset({
        users: {
          list: [
            {
              id: context.user.id,
              email: context.user.email,
              invite_token: null,
              main_roles: context.user.roles,
              project_id: project.id,
              roles: "owner",
            },
          ],
          pageInfo: {
            totalRows: 1,
            page: 1,
            pageSize: 25,
            isFirstPage: true,
            isLastPage: true,
          },
        },
      })
    });
  });

  describe('POST: /api/v1/db/meta/projects/:projectId/users', function () {
    it('Invites a user to a project', async function () {
      const user = await createUser(context, {email: 'new-invite@user.com'})
      const response = await request(context.app)
        .post(`/api/v1/db/meta/projects/${project.id}/users`)
        .set('xc-auth', context.token)
        .send({
          email: user.user.email
        })
        .expect(200);

      expect(response.body).to.deep.equal({
        msg: "success",
      });
    });
  });

  describe('PATCH: /api/v1/db/meta/projects/:projectId/users/:userId', function () {
    it('Updates a user for a project', async function () {
      const user = await createUser(context, {email: 'new-update@user.com'})
      await addUserToProject(project.id, user.user.id, 'viewer');
      const response = await request(context.app)
        .patch(`/api/v1/db/meta/projects/${project.id}/users/${user.user.id}`)
        .set('xc-auth', context.token)
        .send({
          project_id: project.id,
          roles: 'editor'
        })
        .expect(200);

      expect(response.body).to.deep.equal({
        msg: "User details updated successfully",
      });

      const updatedProjectUser = await getProjectUser(project.id, user.user.id);
      expect(updatedProjectUser.roles).to.equal('editor');
    });
  });

  describe('DELETE: /api/v1/db/meta/projects/:projectId/users/:userId', function () {
    it('Deletes a user from a project', async function () {
      const user = await createUser(context, {email: 'new-update@user.com'})
      await addUserToProject(project.id, user.user.id, 'viewer');
      const response = await request(context.app)
        .delete(`/api/v1/db/meta/projects/${project.id}/users/${user.user.id}`)
        .set('xc-auth', context.token)
        .expect(200);

      expect(response.body).to.deep.equal({
        msg: "success",
      });

      const updatedProjectUser = await getProjectUser(project.id, user.user.id);
      expect(updatedProjectUser).to.be.undefined;
    });
  });

  describe('POST: /api/v1/db/meta/projects/:projectId/users/:userId/resend-invite', function () {
    it('resend project invitation to a user', async function () {
      const user = await createUser(context, {email: 'new-invite@user.com'})
      const response = await request(context.app)
        .post(`/api/v1/db/meta/projects/${project.id}/users/${user.user.id}/resend-invite`)
        .set('xc-auth', context.token)
        .send()
        .expect(200);

      expect(response.body).to.deep.equal({
        msg: "success",
      });
    });
  });
}

export default function () {
  describe('ProjectUsers', ProjectUserTest);
}
