import { ProjectRole, Role } from './enums'

export const NOCO = 'noco'

export const SYSTEM_COLUMNS = ['id', 'title', 'created_at', 'updated_at']

export const BASE_FALLBACK_URL = process.env.NODE_ENV === 'production' ? '..' : 'http://localhost:8080'
/**
 * Each permission value means the following
 * `*` - which is wildcard, means all permissions are allowed
 *  `include` - which is an object, means only the permissions listed in the object are allowed
 *  `exclude` - which is an object, means all permissions are allowed except the ones listed in the object
 *  `undefined` or `{}` - which is the default value, means no permissions are allowed
 * */
export const rolePermissions = {
  // general role permissions

  [Role.Super]: '*',
  [Role.Admin]: {} as Record<string, boolean>,
  [Role.Guest]: {} as Record<string, boolean>,
  [Role.OrgLevelCreator]: {
    include: {
      projectCreate: true,
      projectActions: true,
      projectSettings: true,
    },
  },

  // Project role permissions
  [ProjectRole.Creator]: {
    exclude: {
      appStore: true,
      superAdminUserManagement: true,
      superAdminAppSettings: true,
      appLicense: true,
    },
  },
  [ProjectRole.Owner]: {
    exclude: {
      appStore: true,
      superAdminUserManagement: true,
      superAdminAppSettings: true,
      appLicense: true,
    },
  },
  [ProjectRole.Editor]: {
    include: {
      smartSheet: true,
      xcDatatableEditable: true,
      column: true,
      tableAttachment: true,
      tableRowUpdate: true,
      dataInsert: true,
      rowComments: true,
      gridViewOptions: true,
      sortSync: true,
      fieldsSync: true,
      gridColUpdate: true,
      filterSync: true,
      filterChildrenRead: true,
      csvImport: true,
      apiDocs: true,
      projectSettings: true,
      newUser: false,
      virtualViewsCreateOrEdit: true,
      settings: true,
      apiTokenTab: true,
      teamAndAuth: true,
      hideAllColumns: true,
      showAllColumns: true,
    },
  },
  [ProjectRole.Commenter]: {
    include: {
      smartSheet: true,
      column: true,
      rowComments: true,
      projectSettings: true,
      hideAllColumns: true,
      showAllColumns: true,
    },
  },
  [ProjectRole.Viewer]: {
    include: {
      filterSync: true,
      filterChildrenRead: true,
      smartSheet: true,
      column: true,
      projectSettings: true,
      virtualViewsCreateOrEdit: true,
      sortSync: true,
      fieldsSync: true,
      settings: true,
      apiTokenTab: true,
      teamAndAuth: true,
      hideAllColumns: true,
      showAllColumns: true,
    },
  },
} as const
