<script lang="jsx" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { sortByNum, getFilterListsByPropsFromObjArr } from '@/utils/el-table-v2-utils'
import ElTbv2Comp from '@/components/el-tbv2-comp.vue'
import { apiGetData } from '../api'

const tbHeight = ref(500) // 表格高度

onMounted(() => {
  tbHeight.value = Math.max(window.innerHeight - 270, 500)
  getData()
})

const originData = ref([]) // 表格源数据

const elTbv2CompRef = ref() // 表格对象

const selectAll = computed(() => {
  const len = elTbv2CompRef.value?.tableData.length
  return len > 0 && elTbv2CompRef.value.tableData.every(p => p._selected)
})
const indeterminate = computed(() => {
  const len = elTbv2CompRef.value?.tableData.length
  return len > 1
    && elTbv2CompRef.value.tableData.some(p => !p._selected)
    && elTbv2CompRef.value.tableData.some(p => p._selected)
})

/* eslint-disable */
// prettier-ignore

// 表格项信息列表
const columnData = ref([
  {
    key: 'selection', dataKey: 'selection', title: ' ', width: 45, alwaysShow: true,
    headerCellRenderer: ({ column }) => {
      const onChange = v => {
        const indexList = elTbv2CompRef.value?.tableData.map(p => originData.value.indexOf(p))
        indexList.forEach(idx => originData.value[idx]._selected = v)
      }
      return (
        <ElCheckbox
          v-model={selectAll.value}
          onChange={onChange}
          indeterminate={indeterminate.value}
          label={column.title ?? ''}
        />
      )
    }
  },
  { key: 'no', dataKey: 'no', title: 'No.', width: 60, sortable: true, sortMethod: sortByNum, alwaysShow: true },
  { key: 'code', dataKey: 'code', title: 'Code', width: 80, sortable: true },
  { key: 'name', dataKey: 'name', title: 'Name', width: 80 },
  { key: 'age', dataKey: 'age', title: 'Age', width: 60, sortable: true, sortMethod: sortByNum },
  { key: 'gender', dataKey: 'gender', title: 'Hender', width: 80, filterable: true, filterSingle: true, filteredValue: '男' },
  { key: 'city', dataKey: 'city', title: 'City', width: 80, sortable: true, filterable: true },
  { key: 'tags', dataKey: 'tags', title: 'Tags', width: 300 },
])
/* eslint-enable */

const filters = reactive(
  columnData.value.reduce((prev, curr) => {
    if (curr.filterable) prev[curr.dataKey] = undefined
    return prev
  }, {})
)

const handleCellRender = ({ cellData, column: { dataKey }, rowData }) => {
  if (dataKey === 'selection') {
    return (
      <ElCheckbox v-model={rowData._selected} label=" " />
    )
  }
  if (dataKey === 'tags') {
    return <>{cellData.map(tag => <el-tag class='tags'>{tag}</el-tag>) ?? ''}</>
  }
  return cellData
}

const loading = ref(false)

async function getData(total) {
  loading.value = true
  try {
    const res = await apiGetData(total)
    originData.value = res ?? []
    originData.value.forEach(item => item._selected = false)

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
  <h3>el-table-v2 多选 demo</h3>
  <div class="page-content">
    <div style="margin-top: 10px; color: #333">
      <span>Total: {{ elTbv2CompRef?.tableData?.length ?? 0 }} / {{ originData.length }}</span>
      <el-button @click="getData()">刷新表格数据</el-button>
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
      :initSort="{ key: 'age', order: 'desc' }"
      :filters="filters"
      :row-height="40"
      :scrollbar-always-on="true"
      :isFullWidth="true" />
  </div>
</template>
