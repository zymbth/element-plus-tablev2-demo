<script lang="jsx" setup>
import { TableV2SortOrder } from 'element-plus'
import { ref, reactive, onMounted } from 'vue'
import {
  sortByNum,
  generalArrFilterHandler,
  getFilterListsByPropsFromObjArr,
} from '@/utils/el-table-v2-utils'
import ElTbv2Comp from '@/components/el-tbv2-comp.vue'
import ElTbColsOperate from '@/components/el-tb-cols-operate.vue'
import { apiGetData } from '../api'

const tbHeight = ref(500) // 表格高度

onMounted(() => {
  tbHeight.value = Math.max(window.innerHeight - 270, 500)
  getData()
})

const originData = ref([]) // 表格源数据

const elTbv2CompRef = ref() // 表格对象

/* eslint-disable */
// prettier-ignore

/**
 * 表格项信息列表
 *
 * @prop {string} title 项名
 * @prop {string} key 项key
 * @prop {string} dataKey 项值
 * @prop {string|number} width 项宽度
 * @prop {boolean} [sortable] 可排序？
 * @prop {boolean} [filterable] 可筛选？
 * @prop {Function} [filterMethod] 筛选方法
 * @prop {string|Array} [filteredValue] 默认筛选(值/列表)
 * @prop {boolean} [filterSingle] 可选单个筛选值？否，可选多个筛选值
 * @prop {boolean} [hidden] 隐藏该项？
 * @prop {boolean} [alwaysShow] 始终显示该项？
 * @prop {string} [_group] 表头分组
 */
const columnData = ref([
  { key: 'no', dataKey: 'no', title: 'No.', width: 60, sortable: true, sortMethod: sortByNum, alwaysShow: true },
  { key: 'code', dataKey: 'code', title: 'Code', width: 80, sortable: true, _group: 'Group 1' },
  { key: 'name', dataKey: 'name', title: 'Name', width: 80, _group: 'Group 1' },
  { key: 'age', dataKey: 'age', title: 'Age', width: 60, sortable: true, sortMethod: sortByNum },
  { key: 'gender', dataKey: 'gender', title: 'Gender', width: 80, filterable: true, filterSingle: true, filteredValue: '男', _group: 'Group 2' },
  { key: 'city', dataKey: 'city', title: 'City', width: 80, sortable: true, filterable: true, _group: 'Group 2' },
  { key: 'tags', dataKey: 'tags', title: 'Tags', width: 300, filterable: true, filterMethod: generalArrFilterHandler },
])
/* eslint-enable */

const filters = reactive(
  columnData.value.reduce((prev, curr) => {
    if (curr.filterable) prev[curr.dataKey] = undefined
    return prev
  }, {})
)

const handleCellRender = ({ cellData, column: { dataKey }, rowData: row }) => {
  if (dataKey === 'tags') {
    return <>{cellData.map(tag => <el-tag class='tags'>{tag}</el-tag>) ?? ''}</>
  } else if (dataKey === 'age') {
    return (
      <span
        style={{
          color: ['#666', '#333', 'green', 'blue', 'orange', 'yellow', 'red', 'purple'][
            Math.floor(cellData / 10)
          ],
        }}>
        {cellData}
      </span>
    )
  }
  return cellData
}

const CustomizedHeader = ({ cells, columns, headerIndex }) => {
  const groupCells = []
  let currGroupCell = []
  for (let i = 0, len = columns.length; i < len; i++) {
    currGroupCell.push(cells[i])
    if (!columns[i]._group || columns[i]._group !== columns[i + 1]?._group) {
      const width = currGroupCell.reduce((prev, curr) => prev + curr.props.column.width, 0)
      groupCells.push(
        currGroupCell.length > 1 ? (
          <div class='cell-group' style={{ width: `${width}px` }}>
            <div class='group-title'>{columns[i]._group ?? ''}</div>
            <div class='cells-wrap'>{currGroupCell}</div>
          </div>
        ) : (
          currGroupCell[0]
        )
      )
      currGroupCell = []
    }
  }
  return groupCells
}

const loading = ref(false)

async function getData(total) {
  loading.value = true
  try {
    const res = await apiGetData(total)
    originData.value = res ?? []

    const tagsFilter = [...new Set(originData.value.flatMap(p => p.tags).filter(Boolean))]
    filters.tags = tagsFilter
    const autoExtractFilters = Object.keys(filters).filter(k => k !== 'tags')
    if (autoExtractFilters.length > 0) {
      const tmpFilters = getFilterListsByPropsFromObjArr(originData.value, autoExtractFilters)
      for (const key in tmpFilters) filters[key] = tmpFilters[key]
    }
  } catch (error) {}
  loading.value = false
}
</script>

<template>
  <h3>el-table-v2 排序&筛选二次封装 demo</h3>
  <div class="page-content">
    <div style="margin-top: 10px; color: #333">
      <span>Total: {{ elTbv2CompRef?.tableData?.length ?? 0 }} / {{ originData.length }}</span>
      <ElTbColsOperate :columnData="columnData" />
    </div>
    <!-- List -->
    <ElTbv2Comp
      ref="elTbv2CompRef"
      class="tb-test"
      :originData="originData"
      :columnData="columnData"
      :handleCellRender="handleCellRender"
      :loading="loading"
      :tbHeight="tbHeight"
      :initSort="{ key: 'age', order: TableV2SortOrder.ASC }"
      :filters="filters"
      :row-height="40"
      :scrollbar-always-on="true"
    >
      <template #header="props">
        <CustomizedHeader v-bind="props" />
      </template>
    </ElTbv2Comp>
  </div>
</template>
<style lang="scss" scope>
.tags + .tags {
  margin-left: 4px;
}
</style>
