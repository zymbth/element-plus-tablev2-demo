<script setup>
import { ref, computed, watch } from 'vue'
import { myTypeof, debounce, myIsNumber } from '@/utils/common-methods'

/**
 * 组件 - 自定义复选框组
 * 内容为一个复选框组，提供对复选项的搜索、筛选、排序、全选/反选功能
 *
 * @param {Array} modelValue 已选筛选项列表
 * @param {Array} list 筛选项列表，元素可以是字符串或对象，对象格式：{ value: 'xxx', text: 'xxx' }
 * @param {boolean} [enableSearch] 可搜索筛选项
 * @param {boolean} [enableSelectAll] 可全选/反选筛选项
 * @param {boolean} [enableSort] 可升降序筛选项
 * @param {number} [autoEnabledAmount] 可选项超出限度时，自动开启相关菜单
 */
const props = defineProps({
  modelValue: { type: Array, default: [] },
  list: { type: Array, default: [] },
  enableSearch: { type: Boolean, default: false },
  enableSelectAll: { type: Boolean, default: false },
  enableSort: { type: Boolean, default: false },
  autoEnabledAmount: { type: [Number, String], default: -1 },
})

const emit = defineEmits(['update:modelValue'])

// 选中列表
const selected = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const filterList = ref([]) // 可筛选值列表
const enableAllIfNeeded = ref(false) // 是否根据列表总数启动搜索项

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
      tmp._hidden = false
      return tmp
    })
    if (myIsNumber(props.autoEnabledAmount) && props.autoEnabledAmount > -1)
      enableAllIfNeeded.value = filterList.value.length >= Number(props.autoEnabledAmount)
  },
  { immediate: true }
)

// 搜索字符串
const queryStr = ref('')
// 搜索可筛选值
const handleQuery = () => {
  const q = queryStr.value.trim().toLowerCase()
  if (!q) {
    filterList.value.forEach(item => (item._hidden = false))
    updSelectAll()
  } else {
    filterList.value.forEach(item => {
      item._hidden = String(item.text)?.toLowerCase()?.indexOf(q) === -1
    })
    selected.value = selected.value.filter(
      p => !filterList.value.find(item => item.value === p)._hidden
    )
  }
}
const debounceHandleQuery = debounce(handleQuery, 500)

// 重置列表的显隐状态
function beforePopShow() {
  queryStr.value = ''
  filterList.value.forEach(item => (item._hidden = false))
}
defineExpose({ beforePopShow })

// 排序
const orderBy = ref('default')
// 更新排序
function handleSwitchAsc(order) {
  if (orderBy.value === order) orderBy.value = 'default'
  else orderBy.value = order
}
// 当前排序、筛选后的列表
const currFilterList = computed(() => {
  if (orderBy.value === 'default') return filterList.value.slice(0).filter(item => !item._hidden)
  else if (orderBy.value === 'asc')
    return filterList.value
      .slice(0)
      .sort((a, b) => a.text.localeCompare(b.text))
      .filter(item => !item._hidden)
  else if (orderBy.value === 'desc')
    return filterList.value
      .slice(0)
      .sort((a, b) => b.text.localeCompare(a.text))
      .filter(item => !item._hidden)
})

// 全选状态
const selectAll = ref(false)
// 中间状态
const isIndeterminate = computed(() => {
  return !selectAll.value && selected.value.length > 0
})
// 更新全选状态
function updSelectAll() {
  selectAll.value =
    selected.value.length === currFilterList.value.length &&
    currFilterList.value.every(item => selected.value.includes(item.value))
}
// 全选状态计算
watch(
  selected,
  newVal => {
    // selectAll.value = newVal.length === props.list.length
    updSelectAll()
  },
  { deep: true, immediate: true }
)

// 组件事件监听：全选/取消全选
function handleSelectAllChange(val) {
  selected.value = val ? filterList.value.filter(item => !item._hidden).map(item => item.value) : []
}
// 点击事件：全选/取消全选
function handleSelectAll() {
  selectAll.value = !selectAll.value
  handleSelectAllChange(selectAll.value)
}
// 点击事件：反选
function handleSelectInvert() {
  selected.value = filterList.value
    .filter(item => !item._hidden && !selected.value.includes(item.value))
    .map(item => item.value)
}
</script>
<template>
  <!-- query filters -->
  <el-input
    v-if="enableSearch || enableAllIfNeeded"
    v-model="queryStr"
    @input="debounceHandleQuery"
    clearable
    placeholder="Enter keywords to query"
    size="small">
    <template #suffix>
      <svg
        @click="handleQuery"
        style="cursor: pointer"
        viewBox="0 0 1024 1024"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M831.903 415.94c0 91.786-29.795 176.573-79.988 245.363l253.163 253.363c24.996 24.996 24.996 65.59 0 90.587s-65.59 24.996-90.587 0L661.328 751.89c-68.79 50.392-153.577 79.988-245.364 79.988C186.198 831.878.025 645.705.025 415.94S186.198 0 415.965 0s415.938 186.173 415.938 415.94zM415.964 703.896a287.958 287.958 0 1 0 0-575.916 287.958 287.958 0 1 0 0 575.916z" />
      </svg>
    </template>
  </el-input>
  <!-- orderby -->
  <div v-if="enableSort || enableAllIfNeeded" class="sort-menus">
    <span @click="handleSwitchAsc('asc')" :class="{ active: orderBy === 'asc' }">
      <svg viewBox="0 0 1152 1024" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M640 448h192c35.34 0 64-28.66 64-64s-28.66-64-64-64H641.8c-35.34 0-64 28.66-64 64s26.8 64 62.2 64zm0 256h320c35.34 0 64-28.66 64-64s-28.66-64-64-64H641.8c-35.34 0-64 28.66-64 64s26.8 64 62.2 64zm0-512h64c35.34 0 62.2-28.66 62.2-64S737.54 64 704 64h-64c-35.34 0-64 28.66-64 64s28.6 64 64 64zm448 640H641.8c-35.34 0-64 28.66-64 64s28.66 64 64 64H1088c35.34 0 64-28.66 64-64s-28.6-64-64-64zM384.8 661.4L320 732.2V128.06C320 92.66 291.4 64 256 64s-64 28.66-64 64.06v604l-64.8-70.66c-12.624-13.766-29.88-20.76-47.22-20.76a63.744 63.744 0 0 0-43.22 16.828c-26.06 23.9-27.8 64.44-3.938 90.54l174.2 192.18c24.24 26.52 70.12 26.52 94.38 0l174.2-192.18c23.88-26.1 22.12-66.62-3.938-90.54C449.2 633.6 408.8 635.4 384.8 661.4z" />
      </svg>
      Ascending
    </span>
    <span @click="handleSwitchAsc('desc')" :class="{ active: orderBy === 'desc' }">
      <svg viewBox="0 0 1152 1024" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M303.2 939.2C291 952.4 274 960 256 960s-35-7.6-47.2-20.8l-176-192c-23.8-26-22.2-66.6 4-90.4s66.6-22.2 90.4 4l64.8 70.6V128c0-35.4 28.6-64 64-64s64 28.6 64 64v603.4l64.8-70.8c23.8-26 64.4-27.8 90.4-4s27.8 64.4 4 90.4l-176 192zM640 960c-35.4 0-64-28.6-64-64s28.6-64 64-64h64c35.4 0 64 28.6 64 64s-28.6 64-64 64h-64zm0-256c-35.4 0-64-28.6-64-64s28.6-64 64-64h192c35.4 0 64 28.6 64 64s-28.6 64-64 64H640zm0-256c-35.4 0-64-28.6-64-64s28.6-64 64-64h320c35.4 0 64 28.6 64 64s-28.6 64-64 64H640zm0-256c-35.4 0-64-28.6-64-64s28.6-64 64-64h448c35.4 0 64 28.6 64 64s-28.6 64-64 64H640z" />
      </svg>
      Descending
    </span>
  </div>
  <!-- select btns -->
  <div v-if="enableSelectAll || enableAllIfNeeded" class="select-btns">
    <el-checkbox
      v-model="selectAll"
      :indeterminate="isIndeterminate"
      @change="handleSelectAllChange"></el-checkbox>
    <span style="padding-left: 8px">
      (<span class="select-btn" @click.prevent="handleSelectAll">Select all</span> |
      <span class="select-btn" @click.prevent="handleSelectInvert">Select invert</span>)
    </span>
  </div>
  <!-- scrollable checkbox group -->
  <el-scrollbar max-height="460px" :always="true">
    <el-checkbox-group v-model="selected" class="checkboxs-wrap">
      <el-checkbox v-for="item in currFilterList" :key="item.value" :label="item.value">{{
        item.text
      }}</el-checkbox>
    </el-checkbox-group>
  </el-scrollbar>
</template>
<style lang="scss" scoped>
.sort-menus {
  margin: 6px 0 0;
  user-select: none;
  > span {
    cursor: pointer;
    &.active {
      color: var(--theme-color);
    }
    &:hover {
      font-weight: bold;
    }
    &:first-child {
      margin-right: 6px;
    }
  }
}
.select-btns {
  display: flex;
  align-items: center;
}
.select-btn {
  color: var(--theme-color);
  cursor: pointer;
}
.checkboxs-wrap {
  user-select: none;
  .el-checkbox {
    display: flex;
  }
}
:deep(svg) {
  display: inline-block;
  height: 1em;
  width: auto;
  vertical-align: middle;
}
</style>
