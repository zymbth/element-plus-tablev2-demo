<script setup lang="jsx">
import { ref, reactive, toRefs, onMounted, readonly, watch, computed } from 'vue'
import CustomSelector from '@/components/custom-selector.vue'
import { TableV2SortOrder } from 'element-plus'
import { sortByStr, generalFilterHandler } from '@/utils/el-table-v2-utils'

/**
 * el-table-v2 组件封装
 * 通过传入的表格源数据、表格 columns 数据、表格自定义单元格渲染方法
 * 实现可排序、可筛选、可自定义单元格渲染的 el-table-v2 组件
 * 
 * @prop {Array} originData 表格数据
 * @prop {Array} columnData 表格columns数据
 * @prop {Function} handleCellRender 单元格自定义渲染方法
 * @prop {number} [tbHeight] 表格高度
 * @prop {Object} [initSort] 初始排序
 * @expose {Object} 通过 defineExpose 暴露给父组件可能需要使用的数据
 * - {Array} filterableCols 只读，从源数据中提取的各筛选项信息
 * - {Array} tableData 只读，当前表格数据(经排序、筛选后的)
 */
const props = defineProps({
  originData: { type: Array, default: [] }, // 表格数据
  columnData: { type: Array, default: [] }, // 表格columns数据
  handleCellRender: { type: Function },     // 返回单元格自定义渲染方法
  loading: { type: Boolean, default: false },// 表格数据加载中
  tbHeight: { type: Number, default: 500 }, // 表格高度
  initSort: { type: Object },               // 初始排序 { key, order }
  tbprops: { type: Object, default: {} },
})

const { originData, columnData } = toRefs(props)

const tbv2props = computed(() => {
  return Object.assign(
    {
      cache: 2,
      'estimated-row-height': undefined, // 不要开启动态高度行，很卡
      'row-height': 50,
      'header-height': 50,
      'scrollbar-always-on': false
    },
    props.tbprops ?? {}
  )
})

// 默认单元格渲染方法
const defaultCellRenderer = ({ cellData }) => cellData;
// 计算单元格渲染方法
const handleCellRender1 = computed(() => {
  return props.handleCellRender instanceof Function ? props.handleCellRender : defaultCellRenderer
})

const tableData = ref([])  // 表格当前数据（排序、筛选后）
const tempData = ref([])   // 中间变量，对源数据的筛选

onMounted(() => {
  // 源数据更新 -> 更新筛选项各自的可筛选列表, 执行筛选
  watch(originData, () => {
    getFiltersFromResp()
    onFilter('init')
  }, { immediate: true })
  // 表格项显隐状态更新 -> 执行筛选
  watch(colHiddens, () => {
    // console.log('watch colHiddens')
    onFilter()
  })
  // 排序状态更新 | tempData 更新 | cols' hidden 更新 -> 执行排序
  watch(
    [sortState, tempData, colHiddens],
    ([newState, newData, hiddens]) => {
      // console.log('handle sort')
      // handle sort ( originData --sort--> tableData )
      const { key, order } = newState ?? {}
      // 数据为空 | 当前无排序，重置 tableData
      if (!newData?.length || !key || !order) {
        tableData.value = newData
        return
      }
      const currCol = columnData.value.find((c) => c.dataKey === key)
      if (!currCol || currCol.hidden) { // 排序项 hidden 为 true 时，无视该排序
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
      cellRenderer: handleCellRender1.value,
      headerCellRenderer: (props) => {
        if(!col.filterable) return props.column.title
        return (
          <div class="tbv2-th-filter">
            <span class="th-cell">{ props.column.title }</span>
            <el-popover trigger="hover" { ...{ width: 200 } } onHide={ onFilter }>
              {{
                default: () => {
                  return filterableCols[col.dataKey].filterSingle
                    ? <CustomSelector
                      v-model={ filterableCols[col.dataKey].singleSelect }
                      onChange={ onFilter }
                      list={ filterableCols[col.dataKey].list }
                      props={ { label: 'text' } }
                    />
                    : <div class="tbv2-filter-wrapper">
                      <div class="tbv2-filter-group">
                        <el-checkbox-group v-model={ filterableCols[col.dataKey].selected }>{
                          filterableCols[col.dataKey].list.map(f => <el-checkbox key={ f.value } label={ f.value }>{ f.text }</el-checkbox>)
                        }</el-checkbox-group>
                      </div>
                      <div class="tbv2-filter-btn">
                        <el-button text onClick={ onFilter }>Confirm</el-button>
                        <el-button text onClick={ () => onReset(col.dataKey) }>Reset</el-button>
                      </div>
                    </div>
                },
                reference: () => (
                  <svg
                    viewBox="0 0 1024 1024"
                    xmlns="http://www.w3.org/2000/svg"
                    width="14" height="14"
                    style={ {
                      color: (filterableCols[col.dataKey].filterSingle
                        ? ![null,undefined].includes(filterableCols[col.dataKey].singleSelect)
                        : filterableCols[col.dataKey].selected?.length > 0) ? 'var(--theme-color)' : 'inherit'
                    } }
                  >
                    <path fill="currentColor" d="M735.086 796.233c0-15.58 12.727-28.818 28.891-28.818h230.4a29.257 29.257 0 0 1 28.818 28.818 28.891 28.891 0 0 1-28.745 28.818H763.977a29.257 29.257 0 0 1-28.818-28.818zm0-127.927c0-15.506 12.727-28.745 28.891-28.745h230.4a29.257 29.257 0 0 1 28.818 28.745 28.891 28.891 0 0 1-28.745 28.819H763.977a29.257 29.257 0 0 1-28.818-28.819zm28.891-156.672h230.4a29.257 29.257 0 0 1 28.818 28.819 28.891 28.891 0 0 1-28.745 28.818H763.977a29.257 29.257 0 0 1-28.818-28.818 29.257 29.257 0 0 1 28.818-28.819zM901.632 0c50.176 0 122.149 49.006 121.051 127.927 1.098 35.694-13.897 66.267-42.642 96.768-216.064 189.586-300.178 227.62-306.468 285.257-5.267 45.495-1.829 472.357-2.926 478.135a39.497 39.497 0 0 1-5.778 22.455c-18.432 18.432-37.45 12.141-47.25 4.023-72.046-58.734-232.741-189.514-251.173-228.133-21.358-41.472-13.24-126.757-13.24-276.48 0-34.085-253.512-235.154-308.296-285.257C31.744 210.285 0 181.54 0 128 0 49.59 63.927 0 134.802 0h766.83zM76.069 164.79c1.682 2.341 4.022 5.12 6.875 8.047l8.63 8.63-3.437-3.437a9235.017 9235.017 0 0 0 147.53 125.074l14.92 12.654c134.29 115.2 167.132 147.456 167.132 194.706 0 27.648 0 51.273-.585 88.137-1.756 114.103 0 145.774 8.045 161.353 3.438 6.876 47.836 49.518 108.325 101.961l17.262 14.41c32.914 27.648 57.051 54.125 57.051 51.273V747.813c0-139.996.585-221.184 3.438-244.298 1.755-13.165 5.193-25.892 10.386-38.034 15.58-35.108 40.96-59.246 105.472-111.689l89.234-72.046c40.375-34.596 81.262-69.12 121.637-104.887l-4.608 4.096c19.017-20.187 25.893-35.181 25.307-53.613C959.27 93.915 926.501 64 901.632 64h-766.83c-41.472 0-70.875 26.478-70.875 63.927 0 14.994 4.023 25.892 12.142 36.864z" />
                  </svg>
                )
              }}
            </el-popover>
          </div>
        );
      }
    }
  })
})

// 表格项显隐状态
const colHiddens = computed(() => {
  return columnData.value.map(col => !!col.hidden)
})

// 控制col显隐后，调整表格宽度
const maxTBWidth = ref(1000)
watch(colHiddens, () => {
  maxTBWidth.value = columns.value.reduce((prev,curr) => {
    return prev + (!curr.hidden && curr.width || 0)
  }, 0)
}, { immediate: true })

// 排序

// 排序状态，是ref对象变量。key: 排序项的key, order: 排序值(asc/desc)
const sortState = ref({
  key: props.initSort?.key ?? undefined,
  order: props.initSort?.order ?? undefined
})
// 排序事件处理
const onSort = ({ key, order }) => {
  // console.log('onSort', { key, order })
  if (!order) order = TableV2SortOrder.ASC;
  sortState.value = { key, order };
};

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
    .reduce((prev,curr) => {
      prev[curr.dataKey] = {
        list: [],
        selected: [],
        singleSelect: undefined,
        filterMethod: curr.filterMethod ?? generalFilterHandler,
        filteredValue: curr.filteredValue,
        filterSingle: curr.filterSingle ?? false
      }
      return prev
    }, {})
)

// 自动获取各项筛选列表
function getFiltersFromResp() {
  for(let dataKey in filterableCols) {
    let list = originData.value
      .map(p => p[dataKey]).filter(Boolean)
      .reduce((prev,curr) => {
        if(curr instanceof Array) prev.push(...curr) // 数组特殊处理
        else prev.push(curr)
        return prev
      }, [])
    // 去重、转对象
    list = [...new Set(list)].map(p1 => ({ text: p1, value: p1 }))

    filterableCols[dataKey].list = list
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
  return prevFilters.value.length === currFilters.length
    && prevFilters.value.every((f,idx) => {
      let [
        currDataKey,
        {
          selected: currSelected,
          singleSelect: currSingleSelect
        }
      ] = currFilters[idx]
      currSelected = currSelected.slice(0).sort()
      return f.dataKey === currDataKey
        && f.singleSelect === currSingleSelect
        && f.selected.slice(0).sort().every((p,idx1) => p === currSelected[idx1])
    })
}
// 筛选
const onFilter = (flag) => {
  // console.log('on Filter')
  const allFilters = Object.entries(filterableCols).filter(([dataKey,configs]) => {
    const currCol = columnData.value.find(c => c.dataKey === dataKey)
    return currCol && !currCol.hidden && configs.filterSingle
      ? ![null,undefined].includes(configs.singleSelect)
      : configs.selected?.length > 0
  })
  const compareRes = compareFilters(allFilters)
  // console.log('compareRes', compareRes, flag !== 'init' && compareRes)
  if(flag !== 'init' && compareRes) return
  prevFilters.value = allFilters.map(([dataKey,configs]) => ({
    dataKey,
    selected: configs.selected,
    singleSelect: configs.singleSelect
  }))
  tempData.value = originData.value.filter(p => {
    return allFilters.every(([dataKey,configs]) => {
      return !configs.filterMethod
        || configs.filterMethod(p[dataKey], configs.filterSingle ? configs.singleSelect : configs.selected)
    })
  })
};
const onReset = (dataKey) => {
  filterableCols[dataKey].selected = []
  onFilter();
}


defineExpose({
  filterableCols: readonly(filterableCols),
  tableData: readonly(tableData)
})
</script>
<template>
  <div :style="{
    height: tbHeight + 'px',
    'max-width': maxTBWidth + 'px'
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
          :cache="tbv2props.cache"
          :estimated-row-height="tbv2props['estimated-row-height']"
          :row-height="tbv2props['row-height']"
          :header-height="tbv2props['header-height']"
          :scrollbar-always-on="tbv2props['scrollbar-always-on']"
        >
          <template v-if="loading" #overlay>
            <div
              class="el-loading-mask"
              style="display: flex; align-items: center; justify-content: center"
            >
              <svg
                class="loading-icon"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
                width="50" height="50"
              >
                <path d="M85.33300000000003 512a426.667 426.667 0 1 0 853.334 0 426.667 426.667 0 1 0-853.334 0z" fill="#959BA7" fill-opacity=".3"/>
                <path d="M938.667 512c0-235.648-191.019-426.667-426.667-426.667V512h426.667z" fill="#387FE5" data-spm-anchor-id="a313x.7781069.0.i3" class="selected"/>
                <path d="M192 512a320 320 0 1 0 640 0 320 320 0 1 0-640 0z" fill="#FFF"/>
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
    >svg {
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
.el-table-v2__header-cell .el-table-v2__sort-icon.is-sorting {color:var(--theme-color)}
@keyframes rotating {
  0% {transform:rotate(0);}
  100% {transform:rotate(360deg);}
}
.loading-icon {
  animation: rotating 2s linear infinite;
}
</style>