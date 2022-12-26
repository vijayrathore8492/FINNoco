import request from 'supertest';
import ProjectUser from '../../../src/lib/models/ProjectUser';
import User from '../../../src/lib/models/User';

const defaultUserArgs = {
  email: 'test@example.com',
  password: 'A1234abh2@dsad',
};

const createUser = async (context, userArgs = {}) => {
  const args = { ...defaultUserArgs, ...userArgs };
  const response = await request(context.app)
    .post('/api/v1/auth/user/signup')
    .send(args);
  const user = await User.getByEmail(args.email);
  return { token: response.body.token, user };
};

const addResetPasswordToken = async (user, token: string, expiry: Date) => {
  return await User.update(user.id, {
    email: user.email,
    reset_password_token: token,
    reset_password_expires: expiry
  });
}

const addUserToProject = async (projectId, userId, roles?) => {
  return await ProjectUser.insert({
    project_id: projectId,
    fk_user_id: userId,
    roles: roles || 'editor',
  });
}

const getProjectUser = async (projectId, userId) => {
  return await ProjectUser.get( projectId, userId );
}

export { createUser, defaultUserArgs, addResetPasswordToken, addUserToProject, getProjectUser };
