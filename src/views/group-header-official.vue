<script setup lang="jsx">
import { ref, onMounted, watch } from 'vue'
import { TableV2SortOrder } from 'element-plus'

onMounted(() => {
  getData()
})

const sortByNum = (a, b, prop) => a[prop] - b[prop]
const sortByStr = (a, b, prop) => a[prop].localeCompare(b[prop], 'zh-CN')

const originData = ref([])
const tableData = ref([])

/* eslint-disable */
// prettier-ignore
const columns = [
  { key: 'no', dataKey: 'no', title: 'No.', width: 60, sortable: true, sortMethod: sortByNum },
  { key: 'code', dataKey: 'code', title: 'code', width: 80, _group: 'Group 1' },
  { key: 'name', dataKey: 'name', title: 'name', width: 80, _group: 'Group 1' },
  { key: 'age', dataKey: 'age', title: 'Age', width: 60, sortable: true, sortMethod: sortByNum, _group: 'Group 2' },
  { key: 'gender', dataKey: 'gender', title: 'gender', width: 80, sortable: true, _group: 'Group 2' },
  { key: 'city', dataKey: 'city', title: 'City', width: 80, sortable: true },
]
/* eslint-enable */

// 排序状态，是ref对象变量。key: 排序项的key, order: 排序值(asc/desc)
const sortState = ref({ key: 'no', order: TableV2SortOrder.ASC })

watch(
  [sortState, originData],
  ([newState, newData]) => {
    if (!newData?.length) return
    const { key, order } = newState ?? {}
    if (!key || !order) {
      // 当前无排序，重置 tableData 顺序
      tableData.value = originData.value
      return
    }
    const currCol = columns.find(c => c.key === key)
    if (!currCol) return
    const currSortMethod = currCol.sortMethod ?? sortByStr
    // 进行排序
    tableData.value = originData.value.slice(0).sort((a, b) => {
      const res = currSortMethod(a, b, currCol.dataKey)
      return order === TableV2SortOrder.ASC ? res : 0 - res
    })
  },
  { immediate: true }
)
// 排序事件处理
const onSort = ({ key, order }) => {
  if (!order) order = TableV2SortOrder.ASC
  // 单项排序，sortState 只记录最新排序信息
  sortState.value = { key, order }
}

const CustomizedHeader = ({ cells, columns, headerIndex }) => {
  if (headerIndex === 1) return cells
  const groupCells = []
  let currGroupCell = []
  for (let i = 0, len = columns.length; i < len; i++) {
    currGroupCell.push(cells[i])
    if (!columns[i]._group || columns[i]._group !== columns[i + 1]?._group) {
      const width = currGroupCell.reduce((prev, curr) => prev + curr.props.column.width, 0)
      groupCells.push(
        <div class='cell-group' style={{ width: `${width}px` }}>
          {columns[i]._group ?? ''}
        </div>
      )
      currGroupCell = []
    }
  }
  return groupCells
}

const getData = total => {
  getDataApi(total).then(res => {
    originData.value = res ?? []
    tableData.value = originData.value
  })
}
const getDataApi = total => {
  if (!total) total = Math.floor(Math.random() * 2000 + 1000)
  return new Promise((resolve, reject) => {
    resolve(
      Array.from({ length: total }).map((_, idx) => {
        return {
          no: idx + 1,
          code: Math.floor(Math.random() * 100000).toString(16),
          name: Math.floor(Math.random() * 100000).toString(16),
          age: Math.floor(Math.random() * 30 + 18),
          gender: Math.random() > 0.5 ? '男' : '女',
          city: ['北京', '上海', '深圳'][Math.floor(Math.random() * 3)],
        }
      })
    )
  })
}
</script>

<template>
  <h3>el-table-v2 单项排序 demo</h3>
  <el-table-v2
    class="tb-group-th"
    :columns="columns"
    :data="tableData"
    :sort-by="sortState"
    @column-sort="onSort"
    :width="666"
    :height="666"
    :header-height="[36, 50]"
    :fixed="true">
    <template #header="props">
      <CustomizedHeader v-bind="props" />
    </template>
  </el-table-v2>
  <div>Total: {{ tableData.length }}</div>
  <div>sortState: {{ sortState }}</div>
  <el-button @click="getData()">刷新表格数据</el-button>
</template>
<style lang="scss" scoped>
.tb-group-th {
  --tablev2-border: var(--el-table-border, 1px solid #ebeef5);
  border: var(--tablev2-border);
  &:deep(.el-table-v2__table) {
    .el-table-v2__header-cell:not(:first-child),
    .el-table-v2__row-cell:not(:first-child),
    .cell-group {
      border-left: var(--tablev2-border);
    }
  }
}

:deep(.cell-group) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
