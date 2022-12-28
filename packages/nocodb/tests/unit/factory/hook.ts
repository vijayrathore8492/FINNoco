import Hook from '../../../src/lib/models/Hook';

const createHook = async (hookInfo: {
  fk_model_id?: string,
  title?: string,
  description?: string,
  env?: string,
  type?: string,
  event?: 'After' | 'Before',
  operation?: 'insert' | 'delete' | 'update',
  async?: boolean,
  payload?: string,
  url?: string,
  headers?: string,
  condition?: boolean,
  notification?: string,
  retries?: number,
  retry_interval?: number,
  timeout?: number,
  active?: boolean,
}) => {
  return await Hook.insert(hookInfo);
}

const getHook =async (hookId: string) => {
  return await Hook.get(hookId);
}

export {
  createHook, 
  getHook
}
