<script setup lang="jsx">
import { ref, reactive, toRefs, onMounted, readonly, watch, computed } from 'vue'
// import CustomSelector from '@/components/custom-selector.vue'
import { TableV2SortOrder } from 'element-plus'
import {
  sortByStr,
  generalFilterHandler,
  getFilterListsByPropsFromObjArr,
} from '@/utils/el-table-v2-utils'
import CustomSelector from '@/components/Selector/popover-wrap.vue'
import CustomCheckboxGroup from '@/components/CheckboxGroup/popover-wrap.vue'
import { myTypeof } from '@/utils/common-methods'

/**
 * el-table-v2 组件封装
 *
 * 通过传入的表格源数据、表格 columns 数据、表格自定义单元格渲染方法
 * 实现可排序、可筛选、可自定义单元格渲染的 el-table-v2 组件
 *
 * @prop {Array} originData 表格数据
 * @prop {Array} columnData 表格columns数据
 * @prop {Function} handleCellRender 单元格自定义渲染方法
 * @prop {number} [tbHeight] 表格高度
 * @prop {Object} [initSort] 初始排序 { key, order }
 * @prop {boolean} [filters] 各筛选项列表，若未提供或未提供完全，则从源数据中提取
 * @prop {Object} [tbprops] tablev2其它属性
 * @expose {Object} 通过 defineExpose 暴露给父组件可能需要使用的数据
 * - {Array} filterableCols 只读，从源数据中提取的各筛选项信息
 * - {Array} tableData 只读，当前表格数据(经排序、筛选后的)
 */
const props = defineProps({
  originData: { type: Array, default: [] },
  columnData: { type: Array, default: [] },
  handleCellRender: { type: Function },
  loading: { type: Boolean, default: false },
  tbHeight: { type: Number, default: 500 },
  initSort: { type: Object },
  filters: { type: Object },
  tbprops: { type: Object, default: {} },
})

const { originData, columnData } = toRefs(props)

const tbv2props = Object.assign(
  {
    cache: 2,
    'estimated-row-height': undefined, // 不要开启动态高度行，很卡
    'row-height': 50,
    'header-height': 50,
    'scrollbar-always-on': false,
  },
  props.tbprops ?? {}
)

// 默认单元格渲染方法
const defaultCellRenderer = ({ cellData }) => cellData
// 单元格渲染方法
const cellRenderer =
  props.handleCellRender instanceof Function ? props.handleCellRender : defaultCellRenderer

const tableData = ref([]) // 表格当前数据（排序、筛选后）
const tempData = ref([]) // 中间变量，对源数据的筛选

onMounted(() => {
  // 源数据更新 -> 更新筛选项各自的可筛选列表, 执行筛选
  watch(
    originData,
    () => {
      resetAllFiltersList()
      resetAllFilters()
      onFilter('init')
    },
    { immediate: true }
  )

  // 表格项显隐状态更新 -> 执行筛选
  watch(colHiddens, () => onFilter())

  // 排序状态更新 | tempData 更新 | cols' hidden 更新 -> 执行排序
  watch(
    [sortState, tempData, colHiddens],
    ([newState, newData, hiddens]) => {
      // handle sort ( originData --sort--> tableData )
      const { key, order } = newState ?? {}
      // 数据为空 | 当前无排序 -> 重置 tableData
      if (!newData?.length || !key || !order) {
        tableData.value = newData
        return
      }
      const currCol = columnData.value.find(c => c.dataKey === key)
      if (!currCol || currCol.hidden) {
        // 排序项 hidden 为 true 时，无视该排序
        tableData.value = newData
        return
      }
      const currSortMethod = currCol.sortMethod ?? sortByStr
      // 进行排序
      tableData.value = newData.slice(0).sort((a, b) => {
        const res = currSortMethod(a, b, currCol.dataKey)
        return order === TableV2SortOrder.ASC ? res : 0 - res
      })
    },
    { immediate: true }
  )
})

/**
 * TableV2 所需的 columns
 *
 * @prop {string} key column key
 * @prop {string} title 项名
 * @prop {string} dataKey 项值
 * @prop {string|number} width 项宽度
 * @prop {boolean} [sortable] 可排序？
 * @prop {boolean} [hidden] 隐藏该项？
 * @prop {Function} [headerCellRenderer] 自定义表头渲染方法
 * @prop {Function} [cellRenderer] 自定义单元格渲染方法
 */
const columns = computed(() => {
  // console.log('computed columns')
  return columnData.value.map(col => {
    return {
      key: col.dataKey,
      title: col.title,
      dataKey: col.dataKey,
      width: col.width ?? 100,
      sortable: col.sortable ?? false,
      fixed: col.fixed,
      hidden: col.hidden,
      cellRenderer: cellRenderer,
      headerCellRenderer: props => {
        if (!col.filterable) return props.column.title
        return (
          <div class='tbv2-th-filter'>
            <span class='th-cell'>{props.column.title}</span>
            {filterableCols[col.dataKey].filterSingle ? (
              <CustomSelector
                trigger='hover'
                v-model={filterableCols[col.dataKey].singleSelect}
                list={filterableCols[col.dataKey].list}
                onChange={onFilter}
              />
            ) : (
              <CustomCheckboxGroup
                trigger='hover'
                v-model={filterableCols[col.dataKey].selected}
                list={filterableCols[col.dataKey].list}
                autoEnabledAmount='20'
                onChange={onFilter}
              />
            )}
          </div>
        )
      },
    }
  })
})

// 表格项显隐状态
const colHiddens = computed(() => {
  return columnData.value.map(col => !!col.hidden)
})

// 控制col显隐后，调整表格宽度
const maxTBWidth = ref(1000)
watch(
  colHiddens,
  () => {
    maxTBWidth.value = columns.value.reduce((prev, curr) => {
      return prev + ((!curr.hidden && curr.width) || 0)
    }, 0)
  },
  { immediate: true }
)

// 排序

// 排序状态，是ref对象变量。key: 排序项的key, order: 排序值(asc/desc)
const sortState = ref({
  key: props.initSort?.key ?? undefined,
  order: props.initSort?.order ?? undefined,
})
// 排序事件处理
const onSort = ({ key, order }) => {
  // console.log('onSort', { key, order })
  if (!order) order = TableV2SortOrder.ASC
  sortState.value = { key, order }
}

// 筛选

/**
 * 筛选信息列表
 *
 * @prop {Array} list 可筛选值列表
 * @prop {Array} selected 已勾选列表（筛选值多选时使用）
 * @prop {string} singleSelect 已勾选值（筛选值单选时使用）
 * @prop {Function} [filterMethod] 筛选方法
 * @prop {Array} [filteredValue] 默认筛选值
 * @prop {boolean} [filterSingle] 筛选值单选？
 * @example
 * {
 *   gender: { list: [], selected: [], singleSelect: undefined, filterSingle: true },
 *   // ...
 * }
 */
const filterableCols = reactive(
  columnData.value
    .filter(c => c.filterable)
    .reduce((prev, curr) => {
      prev[curr.dataKey] = {
        list: [],
        selected: [],
        singleSelect: undefined,
        filterMethod: curr.filterMethod ?? generalFilterHandler,
        filteredValue: curr.filteredValue,
        filterSingle: curr.filterSingle ?? false,
      }
      return prev
    }, {})
)

// 重置所有筛选项的列表
function resetAllFiltersList() {
  const filterKeys = Object.keys(filterableCols)
  // 已提供的list
  if (myTypeof(props.filters) === 'object') {
    Object.entries(props.filters).forEach(([key, val]) => {
      const idx = filterKeys.indexOf(key)
      if (idx > -1 && Array.isArray(val)) {
        filterableCols[key].list = val
        filterKeys.splice(idx, 1)
      }
    })
  }
  // 未提供的，批量从原始数据中提取
  if (filterKeys.length > 0) {
    const tmpFilters = getFilterListsByPropsFromObjArr(originData.value, filterKeys)
    for (const key in tmpFilters) {
      filterableCols[key].list = tmpFilters[key]
    }
  }
}

// 重置所有筛选的选择
function resetAllFilters() {
  for (let dataKey in filterableCols) {
    // 根据是否多选，获取对应默认排序（值/列表）
    filterableCols[dataKey].selected = !filterableCols[dataKey].filterSingle
      ? filterableCols[dataKey].filteredValue instanceof Array
        ? filterableCols[dataKey].filteredValue
        : []
      : []
    filterableCols[dataKey].singleSelect = filterableCols[dataKey].filterSingle
      ? typeof filterableCols[dataKey].filteredValue !== 'object'
        ? filterableCols[dataKey].filteredValue
        : undefined
      : undefined
  }
}

// 前一筛选状态
const prevFilters = ref([])
// 对比筛选状态
const compareFilters = currFilters => {
  return (
    prevFilters.value.length === currFilters.length &&
    prevFilters.value.every((f, idx) => {
      let [currDataKey, { selected: currSelected, singleSelect: currSingleSelect }] =
        currFilters[idx]
      currSelected = currSelected.slice(0).sort()
      return (
        f.dataKey === currDataKey &&
        f.singleSelect === currSingleSelect &&
        f.selected
          .slice(0)
          .sort()
          .every((p, idx1) => p === currSelected[idx1])
      )
    })
  )
}
// 筛选
const onFilter = flag => {
  // console.log('on Filter')
  const allFilters = Object.entries(filterableCols).filter(([dataKey, configs]) => {
    const currCol = columnData.value.find(c => c.dataKey === dataKey)
    return currCol && !currCol.hidden && configs.filterSingle
      ? ![null, undefined].includes(configs.singleSelect)
      : configs.selected?.length > 0
  })
  const compareRes = compareFilters(allFilters)
  // console.log('compareRes', compareRes, flag !== 'init' && compareRes)
  if (flag !== 'init' && compareRes) return
  prevFilters.value = allFilters.map(([dataKey, configs]) => ({
    dataKey,
    selected: configs.selected,
    singleSelect: configs.singleSelect,
  }))
  tempData.value = originData.value.filter(p => {
    return allFilters.every(([dataKey, configs]) => {
      return (
        !configs.filterMethod ||
        configs.filterMethod(
          p[dataKey],
          configs.filterSingle ? configs.singleSelect : configs.selected
        )
      )
    })
  })
}
const onReset = dataKey => {
  filterableCols[dataKey].selected = []
  onFilter()
}

defineExpose({
  filterableCols: readonly(filterableCols),
  tableData: readonly(tableData),
})
</script>
<template>
  <div
    :style="{
      height: tbHeight + 'px',
      'max-width': maxTBWidth + 'px',
    }">
    <el-auto-resizer>
      <template #default="{ height, width }">
        <el-table-v2
          :columns="columns"
          :data="tableData"
          :sort-by="sortState"
          @column-sort="onSort"
          :width="width"
          :height="height"
          fixed
          v-bind="tbv2props">
          <template v-if="loading" #overlay>
            <div
              class="el-loading-mask"
              style="display: flex; align-items: center; justify-content: center">
              <svg
                class="loading-icon"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
                width="50"
                height="50">
                <path
                  d="M85.33300000000003 512a426.667 426.667 0 1 0 853.334 0 426.667 426.667 0 1 0-853.334 0z"
                  fill="#959BA7"
                  fill-opacity=".3" />
                <path
                  d="M938.667 512c0-235.648-191.019-426.667-426.667-426.667V512h426.667z"
                  fill="#387FE5"
                  data-spm-anchor-id="a313x.7781069.0.i3"
                  class="selected" />
                <path d="M192 512a320 320 0 1 0 640 0 320 320 0 1 0-640 0z" fill="#FFF" />
              </svg>
            </div>
          </template>
        </el-table-v2>
      </template>
    </el-auto-resizer>
  </div>
</template>

<style lang="scss">
.tbv2-th-filter {
  display: flex;
  justify-content: center;
  align-items: center;
  .th-cell {
    margin-right: 6px;
  }
  .el-tooltip__trigger {
    line-height: 14px;
    > svg {
      vertical-align: top;
      cursor: pointer;
    }
  }
}
.tbv2-filter-btn {
  border-top: 1px solid #eee;
  margin: 12px -12px -12px;
  padding: 0 12px;
  display: flex;
  justify-content: space-evenly;
}
.el-table-v2__header-cell .el-table-v2__sort-icon.is-sorting {
  color: var(--theme-color);
}
@keyframes rotating {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}
.loading-icon {
  animation: rotating 2s linear infinite;
}
</style>
