import ApiToken from '../../../src/lib/models/ApiToken';

const createApiToken = async (tokenInfo: {fk_user_id: string, description: string}) => {
  return await ApiToken.insert(tokenInfo)
}

export {
  createApiToken
}