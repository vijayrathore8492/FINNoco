import { OrgUserRoles } from 'nocodb-sdk';
import ModelRoleVisibility from '../../../src/lib/models/ModelRoleVisibility';

const createVisibilityRule = async (fk_view_id: string, role: OrgUserRoles, disabled: boolean) => {
  await ModelRoleVisibility.insert({
    fk_view_id: fk_view_id,
    disabled: disabled,
    role,
  });
}

export {createVisibilityRule}