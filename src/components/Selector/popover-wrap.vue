<script setup>
import { ref, computed } from 'vue'
import CustomSelectorComp from './index.vue'
import { isArrElementsEqual } from '@/utils/common-methods'

/**
 * 自定义筛选弹出框，显示为筛选图标，弹出框内为单/多选列表组件
 * 用于表头筛选
 *
 * @param {Array} modelValue 已选筛选项列表
 * @param {boolean} enableSearch 可搜索筛选项
 */
const props = defineProps({
  modelValue: { default: undefined },
  multiple: { type: Boolean, default: false },
  trigger: {
    type: String,
    default: 'click',
    validator: val => ['click', 'hover', 'focus', 'contextmenu'].includes(val),
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

// 此前选中列表
const prevSelected = ref(props.modelValue)
// 选中列表
const selected = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

function handleHide() {
  if (selected.value instanceof Array) {
    // 选中列表与此前选中列表不一致时，触发 change 事件
    if (isArrElementsEqual(selected.value, prevSelected.value)) return
    prevSelected.value = [...selected.value]
  } else {
    if (selected.value === prevSelected.value) return
    prevSelected.value = selected.value
  }
  emit('change', selected.value)
}

const selectAnyOption = computed(() => {
  return props.multiple ? selected.value.length > 0 : selected.value || selected.value === 0
})
</script>
<template>
  <el-popover
    :trigger="trigger"
    width="200"
    @hide="handleHide"
    popper-class="filter-checkboxs-popover">
    <template #default>
      <CustomSelectorComp v-model="selected" :multiple="multiple" v-bind="$attrs" />
    </template>
    <template #reference>
      <slot>
        <svg
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          :style="{
            cursor: 'pointer',
            color: selectAnyOption ? 'var(--theme-color)' : 'inherit',
          }">
          <path
            fill="currentColor"
            d="M735.086 796.233c0-15.58 12.727-28.818 28.891-28.818h230.4a29.257 29.257 0 0 1 28.818 28.818 28.891 28.891 0 0 1-28.745 28.818H763.977a29.257 29.257 0 0 1-28.818-28.818zm0-127.927c0-15.506 12.727-28.745 28.891-28.745h230.4a29.257 29.257 0 0 1 28.818 28.745 28.891 28.891 0 0 1-28.745 28.819H763.977a29.257 29.257 0 0 1-28.818-28.819zm28.891-156.672h230.4a29.257 29.257 0 0 1 28.818 28.819 28.891 28.891 0 0 1-28.745 28.818H763.977a29.257 29.257 0 0 1-28.818-28.818 29.257 29.257 0 0 1 28.818-28.819zM901.632 0c50.176 0 122.149 49.006 121.051 127.927 1.098 35.694-13.897 66.267-42.642 96.768-216.064 189.586-300.178 227.62-306.468 285.257-5.267 45.495-1.829 472.357-2.926 478.135a39.497 39.497 0 0 1-5.778 22.455c-18.432 18.432-37.45 12.141-47.25 4.023-72.046-58.734-232.741-189.514-251.173-228.133-21.358-41.472-13.24-126.757-13.24-276.48 0-34.085-253.512-235.154-308.296-285.257C31.744 210.285 0 181.54 0 128 0 49.59 63.927 0 134.802 0h766.83zM76.069 164.79c1.682 2.341 4.022 5.12 6.875 8.047l8.63 8.63-3.437-3.437a9235.017 9235.017 0 0 0 147.53 125.074l14.92 12.654c134.29 115.2 167.132 147.456 167.132 194.706 0 27.648 0 51.273-.585 88.137-1.756 114.103 0 145.774 8.045 161.353 3.438 6.876 47.836 49.518 108.325 101.961l17.262 14.41c32.914 27.648 57.051 54.125 57.051 51.273V747.813c0-139.996.585-221.184 3.438-244.298 1.755-13.165 5.193-25.892 10.386-38.034 15.58-35.108 40.96-59.246 105.472-111.689l89.234-72.046c40.375-34.596 81.262-69.12 121.637-104.887l-4.608 4.096c19.017-20.187 25.893-35.181 25.307-53.613C959.27 93.915 926.501 64 901.632 64h-766.83c-41.472 0-70.875 26.478-70.875 63.927 0 14.994 4.023 25.892 12.142 36.864z" />
        </svg>
      </slot>
    </template>
  </el-popover>
</template>
<style lang="scss">
.filter-checkboxs-popover {
  .el-checkbox {
    display: flex;
  }
}
</style>
