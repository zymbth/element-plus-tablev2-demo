<script setup>
import { ref, computed } from 'vue'
import { isArrElementsEqual } from '@/utils/common-methods'
import CheckboxGroupComp from './index.vue'

/**
 * 自定义筛选弹出框，显示为筛选图标，弹出框内为复选框组（el-checkbox-group）
 * 用于表头筛选
 *
 * @param {Array} modelValue 已选筛选项列表
 * @param {number} [checkSelections] 是否对比选择与前一次选择的内容，相同则不触发 change 事件
 */
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  trigger: {
    type: String,
    default: 'click',
    validator: val => ['click', 'hover', 'focus', 'contextmenu'].includes(val),
  },
  checkSelections: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'change'])

// 此前选中列表
const prevSelected = ref([...props.modelValue])
// 选中列表
const selected = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const checkboxGroupRef = ref()
// 显示 popover 时，重置 CheckboxGroup 组件中列表的显隐状态
function handleShow() {
  checkboxGroupRef.value?.beforePopShow()
}
// 隐藏 popover 时，对比选择，变动时，触发父组件 change 事件
function handleHide() {
  // 选中列表与此前选中列表不一致时，触发 change 事件
  if (props.checkSelections && isArrElementsEqual(selected.value, prevSelected.value)) return
  prevSelected.value = [...selected.value]
  emit('change', selected.value)
}
function resetSelected(val) {
  if (val && Array.isArray(val) && val.length > 0) selected.value = val.slice(0)
  prevSelected.value = selected.value.slice(0)
}
defineExpose({ resetSelected })
</script>
<template>
  <el-popover
    :trigger="trigger"
    width="230"
    @show="handleShow"
    @hide="handleHide"
    popper-class="filter-checkboxs-popover"
  >
    <template #default>
      <CheckboxGroupComp ref="checkboxGroupRef" v-model="selected" v-bind="$attrs" />
      <!-- <div>
        <el-button size="small" @click="handleReset">Reset</el-button>
        <el-button size="small" type="primary" @click="handleConfirm">Confirm</el-button>
      </div> -->
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
            color: selected.length > 0 ? 'var(--theme-color)' : 'inherit',
          }"
        >
          <path
            fill="currentColor"
            d="M735.086 796.233c0-15.58 12.727-28.818 28.891-28.818h230.4a29.257 29.257 0 0 1 28.818 28.818 28.891 28.891 0 0 1-28.745 28.818H763.977a29.257 29.257 0 0 1-28.818-28.818zm0-127.927c0-15.506 12.727-28.745 28.891-28.745h230.4a29.257 29.257 0 0 1 28.818 28.745 28.891 28.891 0 0 1-28.745 28.819H763.977a29.257 29.257 0 0 1-28.818-28.819zm28.891-156.672h230.4a29.257 29.257 0 0 1 28.818 28.819 28.891 28.891 0 0 1-28.745 28.818H763.977a29.257 29.257 0 0 1-28.818-28.818 29.257 29.257 0 0 1 28.818-28.819zM901.632 0c50.176 0 122.149 49.006 121.051 127.927 1.098 35.694-13.897 66.267-42.642 96.768-216.064 189.586-300.178 227.62-306.468 285.257-5.267 45.495-1.829 472.357-2.926 478.135a39.497 39.497 0 0 1-5.778 22.455c-18.432 18.432-37.45 12.141-47.25 4.023-72.046-58.734-232.741-189.514-251.173-228.133-21.358-41.472-13.24-126.757-13.24-276.48 0-34.085-253.512-235.154-308.296-285.257C31.744 210.285 0 181.54 0 128 0 49.59 63.927 0 134.802 0h766.83zM76.069 164.79c1.682 2.341 4.022 5.12 6.875 8.047l8.63 8.63-3.437-3.437a9235.017 9235.017 0 0 0 147.53 125.074l14.92 12.654c134.29 115.2 167.132 147.456 167.132 194.706 0 27.648 0 51.273-.585 88.137-1.756 114.103 0 145.774 8.045 161.353 3.438 6.876 47.836 49.518 108.325 101.961l17.262 14.41c32.914 27.648 57.051 54.125 57.051 51.273V747.813c0-139.996.585-221.184 3.438-244.298 1.755-13.165 5.193-25.892 10.386-38.034 15.58-35.108 40.96-59.246 105.472-111.689l89.234-72.046c40.375-34.596 81.262-69.12 121.637-104.887l-4.608 4.096c19.017-20.187 25.893-35.181 25.307-53.613C959.27 93.915 926.501 64 901.632 64h-766.83c-41.472 0-70.875 26.478-70.875 63.927 0 14.994 4.023 25.892 12.142 36.864z"
          />
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
