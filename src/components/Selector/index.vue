<script setup>
import { ref, onMounted, computed, watch, toRefs } from 'vue'
import { myTypeof } from '@/utils/common-methods'

/**
 * 组件：单/多选列表（类似展开的 el-select ）
 *
 * @prop {Array|String} modelValue 已选
 * @prop {boolean} [multiple] 是否多选
 * @prop {Array} list 列表，[{ text: 'Option1', value: 'option1', ... }]
 * @prop {Object} [props] 属性
 */
const props = defineProps({
  modelValue: { default: undefined },
  multiple: { type: Boolean, default: false },
  list: { type: Array, default: [] },
  props: { type: Object, default: {} },
})
const { multiple } = toRefs(props)

const emit = defineEmits(['change', 'update:modelValue'])
const selected = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

// 选项 label, value 对应列表元素的属性，默认为 text, value
// 即，list的元素预期为：{ text: 'Option1', value: 'option1', ... }
const labelVal = props.props?.label ?? 'text'
const valueVal = props.props?.value ?? 'value'

const filterList = ref([]) // 可筛选值列表

// 监听，更新可筛选值列表
watch(
  () => props.list,
  newVal => {
    filterList.value = newVal.map(item => {
      let tmp
      if (myTypeof(item) !== 'object') {
        tmp = { value: item, text: item }
      } else {
        tmp = { ...item }
      }
      return tmp
    })
  },
  { immediate: true }
)

onMounted(() => {
  // 策略：以 multiple 属性值为标准，调整绑定值类型
  if (multiple.value === true && !(props.modelValue instanceof Array)) selected.value = []
  else if (multiple.value === false && typeof props.modelValue === 'object')
    selected.value = undefined
})

// 列表点击事件
function handleOptionClick(val) {
  let res
  if (multiple.value) {
    res = selected.value.slice(0)
    const idx = res.indexOf(val)
    if (idx > -1) res.splice(idx, 1)
    else res.push(val)
  } else {
    res = selected.value === val ? null : val
  }
  selected.value = res
  emit('change', res)
}

/**
 * 是否选择该项
 * @param {*} val 该项的值
 * @returns {boolean}
 */
function checkSelected(val) {
  return multiple.value ? selected.value?.includes(val) : selected.value === val
}
</script>
<template>
  <div class="wrap">
    <div
      v-for="option in filterList"
      :key="option[valueVal]"
      :class="['item', { active: checkSelected(option[valueVal]) }]"
      @click="handleOptionClick(option[valueVal])">
      {{ option[labelVal] }}
    </div>
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
      color: #387fe5;
      font-weight: bold;
      // background-color: ;
    }
    &:hover {
      background-color: #f9f9f9;
    }
  }
}
</style>
