<script setup>
import { ref, toRefs, watch } from 'vue'

/**
 * el-table columns 显示/隐藏功能组件
 * 只操作 column 的 hidden 属性
 *
 * @prop {Array} columnData 表格columns数据
 */
const props = defineProps({
  columnData: { type: Array, default: [] },
})

const { columnData } = toRefs(props)

const optColsRef = ref()
// 展示在表格中的字段
const shownCols = ref([])
function handleBeforeEnter() {
  shownCols.value = columnData.value.filter(c => !c.hidden).map(c => c.dataKey)
}
// 全选状态
const checkAll = ref(false)
watch(
  shownCols,
  newVal => {
    checkAll.value = newVal.length === columnData.value.length
  },
  { deep: true }
)
// 中间状态
const isIndeterminate = ref(false)
watch(
  [shownCols, checkAll],
  ([cols, all]) => {
    isIndeterminate.value = !all && cols.length > 0
  },
  { deep: true }
)
// 事件：全选/取消全选
function handleCheckAllChange(val) {
  if (val) shownCols.value = columnData.value.map(c => c.dataKey)
  else shownCols.value = columnData.value.filter(c => c.alwaysShow).map(c => c.dataKey)
}
// 取消选择
function handleCancelColsOperation() {
  optColsRef.value.hide()
}
// 确认选择
function handleColsOperation() {
  columnData.value.forEach(c => {
    const show = shownCols.value.includes(c.dataKey)
    if (!c.hidden !== show) c.hidden = !show
  })
  optColsRef.value.hide()
}
</script>
<template>
  <el-popover
    ref="optColsRef"
    trigger="click"
    placement="bottom"
    :width="200"
    @before-enter="handleBeforeEnter">
    <template #reference>
      <el-button style="margin-left: 16px">Show/Hide columns</el-button>
    </template>
    <div>
      <el-checkbox
        v-model="checkAll"
        :indeterminate="isIndeterminate"
        @change="handleCheckAllChange"
        >Check all</el-checkbox
      >
      <el-divider style="margin: 4px 0" />
      <el-checkbox-group v-model="shownCols">
        <el-checkbox
          v-for="col in columnData"
          :key="col.dataKey"
          :label="col.dataKey"
          :disabled="!!col.alwaysShow"
          >{{ col.title }}</el-checkbox
        >
      </el-checkbox-group>
      <div style="text-align: right">
        <el-button size="small" @click="handleCancelColsOperation">Cancel</el-button>
        <el-button type="primary" size="small" @click="handleColsOperation">Confirm</el-button>
      </div>
    </div>
  </el-popover>
</template>
