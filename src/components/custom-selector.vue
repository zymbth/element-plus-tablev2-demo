<script setup>
/**
 * 组件：单/多选列表（展开的 el-select ）
 */

import { onMounted } from 'vue'

const props = defineProps({
  modelValue: { default: '' },
  multiple: { type: Boolean, default: false },
  list: { type: Array, default: [] },
  props: { type: Object, default: {} }
})

const emit = defineEmits(['change','update:modelValue'])

const labelVal = props.props?.label ?? 'label'
const valueVal = props.props?.value ?? 'value'

onMounted(() => {
  if(props.multiple === true && !(props.modelValue instanceof Array))
    emit('update:modelValue', [])
  else if(props.multiple === false && typeof props.modelValue === 'object')
    emit('update:modelValue', '')
})

function handleOptionClick(val) {
  let res
  if(props.multiple) {
    res = [...props.modelValue]
    const idx = props.modelValue.indexOf(val)
    if(idx > -1) res.splice(idx, 1)
    else res.push(val)
  } else {
    // if(props.modelValue === val) return
    res = props.modelValue === val ? null : val
  }
  emit('update:modelValue', res)
  emit('change', res)
}
function checkSelected(val) {
  return props.multiple ? props.modelValue?.includes(val) : props.modelValue === val
}
</script>
<template>
  <div class="wrap">
    <div
      v-for="option in list"
      :key="option[valueVal]"
      :class="['item', { active: checkSelected(option[valueVal]) }]"
      @click="handleOptionClick(option[valueVal])"
    >{{ option[labelVal] }}</div>
  </div>
</template>
<style lang="scss" scoped>
.wrap {
  width: 100%;
  font-size: 14px;
  color: #666;
  .item {
    line-height: 32px;
    padding: 0 12px;
    cursor: pointer;

    &.active {
      color: #387FE5;
      font-weight: bold;
      // background-color: ;
    }
    &:hover {
      background-color: #f9f9f9;
    }
  }
}
</style>