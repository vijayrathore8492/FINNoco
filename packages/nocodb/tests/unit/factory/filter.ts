import Filter from '../../../src/lib/models/Filter';

const createFilter = async (
  filterInfo: {
    fk_view_id: string, 
    fk_column_id: string, 
    fk_hook_id?: string,
    comparison_op?, 
    fk_parent_id?: string,
    is_group?: boolean,
    logical_op?: string,
    value? 
  }
  ) => {
  return await Filter.insert(filterInfo);
}

const getFilter =async (filterId: string) => {
  return await Filter.get(filterId);
}

export {
  createFilter, 
  getFilter
}