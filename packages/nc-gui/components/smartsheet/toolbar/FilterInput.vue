<script setup lang="ts">
import type { ColumnType } from 'nocodb-sdk'
<<<<<<< HEAD
import { useColumn } from '~/composables/useColumn'
import { ColumnInj, EditModeInj, ReadonlyInj, computed, provide, toRef } from '#imports'
import type { Filter } from '~/lib'
import SingleSelect from '~/components/cell/SingleSelect'
import MultiSelect from '~/components/cell/MultiSelect'
import DatePicker from '~/components/cell/DatePicker'
import YearPicker from '~/components/cell/YearPicker'
import Text from '~/components/cell/Text'
import DateTimePicker from '~/components/cell/DateTimePicker'
import TimePicker from '~/components/cell/TimePicker'
import Rating from '~/components/cell/Rating'
import Duration from '~/components/cell/Duration'
import Percent from '~/components/cell/Percent'
import Currency from '~/components/cell/Currency'
import Decimal from '~/components/cell/Decimal'
import Integer from '~/components/cell/Integer'
import Float from '~/components/cell/Float'
=======
import {
  ColumnInj,
  EditModeInj,
  ReadonlyInj,
  computed,
  isBoolean,
  isCurrency,
  isDate,
  isDateTime,
  isDecimal,
  isDuration,
  isFloat,
  isInt,
  isMultiSelect,
  isPercent,
  isRating,
  isSingleSelect,
  isTextArea,
  isTime,
  isYear,
  provide,
  ref,
  toRef,
  useProject,
} from '#imports'
import type { Filter } from '~/lib'
import SingleSelect from '~/components/cell/SingleSelect.vue'
import MultiSelect from '~/components/cell/MultiSelect.vue'
import DatePicker from '~/components/cell/DatePicker.vue'
import YearPicker from '~/components/cell/YearPicker.vue'
import DateTimePicker from '~/components/cell/DateTimePicker.vue'
import TimePicker from '~/components/cell/TimePicker.vue'
import Rating from '~/components/cell/Rating.vue'
import Duration from '~/components/cell/Duration.vue'
import Percent from '~/components/cell/Percent.vue'
import Currency from '~/components/cell/Currency.vue'
import Decimal from '~/components/cell/Decimal.vue'
import Integer from '~/components/cell/Integer.vue'
import Float from '~/components/cell/Float.vue'
import Text from '~/components/cell/Text.vue'
>>>>>>> 0.105.3

interface Props {
  column: ColumnType
  filter: Filter
}

interface Emits {
  (event: 'updateFilterValue', model: any): void
}

const props = defineProps<Props>()
<<<<<<< HEAD
const emit = defineEmits<Emits>()

const column = toRef(props, 'column')
const editEnabled = ref(true)

provide(ColumnInj, column)
provide(EditModeInj, readonly(editEnabled))
provide(ReadonlyInj, ref(false))

const types = useColumn(column)
const { isInt, isFloat, isDecimal, isPercent, isBoolean, isDate, isDateTime, isTime, isYear } = types
=======

const emit = defineEmits<Emits>()

const column = toRef(props, 'column')

const editEnabled = ref(true)

provide(ColumnInj, column)

provide(EditModeInj, readonly(editEnabled))

provide(ReadonlyInj, ref(false))

const checkTypeFunctions = {
  isSingleSelect,
  isMultiSelect,
  isDate,
  isYear,
  isDateTime,
  isTime,
  isRating,
  isDuration,
  isPercent,
  isCurrency,
  isDecimal,
  isInt,
  isFloat,
  isTextArea,
}

type FilterType = keyof typeof checkTypeFunctions

const { sqlUi } = $(useProject())

const abstractType = $computed(() => (column.value?.dt && sqlUi ? sqlUi.getAbstractType(column.value) : null))

const checkType = (filterType: FilterType) => {
  const checkTypeFunction = checkTypeFunctions[filterType]

  if (!column.value || !checkTypeFunction) {
    return false
  }

  return checkTypeFunction(column.value, abstractType)
}
>>>>>>> 0.105.3

const filterInput = computed({
  get: () => {
    return props.filter.value
  },
  set: (value) => {
    emit('updateFilterValue', value)
  },
})

const booleanOptions = [
  { value: true, label: 'true' },
  { value: false, label: 'false' },
  { value: null, label: 'unset' },
]

<<<<<<< HEAD
type FilterType = keyof typeof types

const componentMap: Partial<Record<FilterType, any>> = {
  isSingleSelect: SingleSelect,
  isMultiSelect: MultiSelect,
  isDate: DatePicker,
  isYear: YearPicker,
  isDateTime: DateTimePicker,
  isTime: TimePicker,
  isRating: Rating,
  isDuration: Duration,
  isPercent: Percent,
  isCurrency: Currency,
  isDecimal: Decimal,
  isInt: Integer,
  isFloat: Float,
}

const filterType = $computed(() => Object.keys(componentMap).find((key) => types[key as FilterType]?.value))
const isNumeric = $computed(() => isPercent.value || isInt.value || isDecimal.value || isFloat.value)

const hasExtraPadding = $computed(() => {
  return column.value && (isInt.value || isDate.value || isDateTime.value || isTime.value || isYear.value)
=======
const componentMap: Partial<Record<FilterType, any>> = $computed(() => {
  return {
    // use MultiSelect for SingleSelect columns for anyof / nanyof filters
    isSingleSelect: ['anyof', 'nanyof'].includes(props.filter.comparison_op!) ? MultiSelect : SingleSelect,
    isMultiSelect: MultiSelect,
    isDate: DatePicker,
    isYear: YearPicker,
    isDateTime: DateTimePicker,
    isTime: TimePicker,
    isRating: Rating,
    isDuration: Duration,
    isPercent: Percent,
    isCurrency: Currency,
    isDecimal: Decimal,
    isInt: Integer,
    isFloat: Float,
  }
})

const filterType = $computed(() => {
  return Object.keys(componentMap).find((key) => checkType(key as FilterType))
})

const componentProps = $computed(() => {
  switch (filterType) {
    case 'isSingleSelect':
    case 'isMultiSelect': {
      return { disableOptionCreation: true }
    }
    case 'isPercent':
    case 'isDecimal':
    case 'isFloat':
    case 'isInt': {
      return { class: 'h-32px' }
    }
    case 'isDuration': {
      return { showValidationError: false }
    }
    default: {
      return {}
    }
  }
})

const hasExtraPadding = $computed(() => {
  return (
    column.value &&
    (isInt(column.value, abstractType) ||
      isDate(column.value, abstractType) ||
      isDateTime(column.value, abstractType) ||
      isTime(column.value, abstractType) ||
      isYear(column.value, abstractType))
  )
>>>>>>> 0.105.3
})
</script>

<template>
<<<<<<< HEAD
  <a-select v-if="isBoolean" v-model:value="filterInput" :disabled="filter.readOnly" :options="booleanOptions"></a-select>
  <div
    v-else
    class="bg-white border-1 flex min-w-120px max-w-170px min-h-32px h-full items-center"
=======
  <a-select
    v-if="column && isBoolean(column, abstractType)"
    v-model:value="filterInput"
    :disabled="filter.readOnly"
    :options="booleanOptions"
  />
  <div
    v-else
    class="bg-white border-1 flex min-w-120px max-w-170px min-h-32px h-full"
>>>>>>> 0.105.3
    :class="{ 'px-2': hasExtraPadding }"
    @mouseup.stop
  >
    <component
<<<<<<< HEAD
      :is="componentMap[filterType] ?? Text"
      v-model="filterInput"
      :column="column"
      :disabled="filter.readOnly"
      :class="{ 'h-32px': isNumeric }"
=======
      :is="filterType ? componentMap[filterType] : Text"
      v-model="filterInput"
      :disabled="filter.readOnly"
      placeholder="Enter a value"
      :column="column"
      class="flex"
      v-bind="componentProps"
>>>>>>> 0.105.3
    />
  </div>
</template>
