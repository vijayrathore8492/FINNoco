import type { ColumnType, ColumnVisibilityRulesType } from 'nocodb-sdk'
import { AccessControlType } from 'nocodb-sdk'
import type { Ref } from 'vue'
import { useRoles } from '~/composables/useRoles'
import { Role } from '~/lib'

export const checkHasAccessToColumn = (column: ColumnType, hasRole: ReturnType<typeof useRoles>['hasRole']) => {
  if (hasRole(Role.Super, true)) {
    return true
  }

  return !Object.keys(column.visibility_rules ?? {}).some(
    (role) =>
      column.visibility_rules?.[role as keyof ColumnVisibilityRulesType] === AccessControlType.Deny && hasRole(role, true),
  )
}

export const useHasAccessToColumn = (column: Ref<ColumnType | undefined>) => {
  const { hasRole } = useRoles()

  const hasAccessToColumn = column.value ? checkHasAccessToColumn(column.value, hasRole) : true

  return { hasAccessToColumn }
}
