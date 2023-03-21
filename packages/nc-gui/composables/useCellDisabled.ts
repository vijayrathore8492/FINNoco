import type { ColumnType } from 'nocodb-sdk'
import { isSystemColumn } from 'nocodb-sdk'
import type { Ref } from 'vue'
import { IsFormInj, IsLockedInj, IsPublicInj, inject, ref } from '#imports'
import { useHasAccessToColumn } from '~/composables/useHasAccessToColumn'

export const useViewDisabled = () => {
  const isPublic = inject(IsPublicInj, ref(false))
  const isLocked = inject(IsLockedInj, ref(false))
  const isForm = inject(IsFormInj, ref(false))
  const readOnly = inject(ReadonlyInj, ref(false))

  return computed(() => isLocked.value || (isPublic.value && readOnly.value && !isForm.value))
}

export const checkIsCellDisabled = (column: ColumnType, isViewDisabled: boolean, hasAccessToColumn?: boolean) => {
  return isSystemColumn(column) || isViewDisabled || !hasAccessToColumn
}

export const useCellDisabled = (column: Ref<ColumnType>) => {
  const isDisabledView = useViewDisabled()
  const { hasAccessToColumn } = useHasAccessToColumn(column)

  return computed(() => checkIsCellDisabled(column.value, isDisabledView.value, hasAccessToColumn))
}
