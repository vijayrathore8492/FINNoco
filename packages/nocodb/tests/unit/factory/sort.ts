import Sort from '../../../src/lib/models/Sort';

const createSort = async (sortInfo: {fk_view_id: string, fk_column_id: string, direction?: 'asc' | 'desc'}) => {
  return await Sort.insert(sortInfo);
}

const getSort =async (sortId: string) => {
  return await Sort.get(sortId);
}

export {
  createSort, 
  getSort
}