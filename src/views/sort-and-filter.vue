<script lang="jsx" setup>
import { ref, reactive, onMounted, watch } from "vue"
import { generalFilterHandler, generalArrFilterHandler } from '@/utils/el-table-v2-utils'
import CustomSelector from '@/components/custom-selector.vue'
import { TableV2SortOrder } from 'element-plus'
import { apiGetData } from "../api"

onMounted(() => {
  getData()

  // 源数据更新 -> 更新筛选项各自的可筛选列表, 执行筛选
  watch(originData, (newVal) => {
    getFiltersFromResp()
    onFilter('init')
  }, { immediate: true })
  // 筛选状态更新 | tempData 更新 -> 执行排序
  watch(
    [sortState, tempData],
    ([newState, newData]) => {
      // handle sort ( originData --sort--> tableData )
      const { key, order } = newState ?? {};
      // 数据为空 | 当前无排序，重置 tableData
      if (!newData?.length || !key || !order) {
        tableData.value = newData;
        return;
      }
      const currCol = columnData.value.find((c) => c.dataKey === key);
      if (!currCol) return;
      const currSortMethod = currCol.sortMethod ?? sortByStr;
      // 进行排序
      tableData.value = newData.slice(0).sort((a, b) => {
        const res = currSortMethod(a, b, currCol.dataKey);
        return order === TableV2SortOrder.ASC ? res : 0 - res;
      });
    },
    { immediate: true }
  );
})

const sortByNum = (a, b, prop) => a[prop] - b[prop];
const sortByStr = (a, b, prop) => a[prop].localeCompare(b[prop], "zh-CN");

const originData = ref([]) // 表格源数据
const tempData = ref([])   // 中间变量，对源数据的筛选
const tableData = ref([])  // 表格当前数据（排序、筛选后）

/* eslint-disable */
// prettier-ignore
const columnData = ref([
  { key: "no", dataKey: "no", title: "No.", width: 60, sortable: true, sortMethod: sortByNum },
  { key: "code", dataKey: "code", title: "Code", width: 80, sortable: true },
  { key: "name", dataKey: "name", title: "Name", width: 80 },
  { key: "age", dataKey: "age", title: "Age", width: 60, sortable: true, sortMethod: sortByNum },
  { key: "gender", dataKey: "gender", title: "Gender", width: 80, filterable: true, filterSingle: true, filteredValue: '男' },
  { key: "city", dataKey: "city", title: "City", width: 80, sortable: true, filterable: true },
  { key: "tags", dataKey: "tags", title: "Tags", width: 150, filterable: true, filterMethod: generalArrFilterHandler }
]);
/* eslint-enable */

const columns = columnData.value.map(col => {
	return {
		key: col.dataKey,
    title: col.title,
    dataKey: col.dataKey,
    width: col.width ?? 100,
    sortable: col.sortable,
    headerCellRenderer: (props) => {
      if(!col.filterable) return props.column.title
      return <div class="tbv2-th-filter">
        <span class="th-cell">{ props.column.title }</span>
        <el-popover trigger="hover" {...{ width: 200 }} onHide={ onFilter }>
          {{
            default: () => {
              return filterableCols[col.dataKey].filterSingle
                ? <CustomSelector
                  v-model={ filterableCols[col.dataKey].singleSelect }
                  onChange={ onFilter }
                  list={ filterableCols[col.dataKey].list }
                  props={ { label: 'text' } }
                />
                : <div class="filter-wrapper">
                  <div class="filter-group">
                    <el-checkbox-group v-model={ filterableCols[col.dataKey].selected }>
                      {
                        filterableCols[col.dataKey].list.map(f => <el-checkbox key={ f.value } label={ f.value }>{ f.text }</el-checkbox>)
                      }
                    </el-checkbox-group>
                  </div>
                  <div class="el-table-v2__demo-filter">
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
                  cursor: 'pointer',
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
    }
	}
})

// 排序

// 排序状态，是ref对象变量。key: 排序项的key, order: 排序值(asc/desc)
const sortState = ref({ key: undefined, order: undefined })
// 排序事件处理
const onSort = ({ key, order }) => {
  // console.log('onSort', { key, order })
  if (!order) order = TableV2SortOrder.ASC;
  sortState.value = { key, order };
};

// 筛选

/**
 * 筛选信息列表
 * @prop {Array} list 可筛选值列表
 * @prop {Array} selected 已勾选列表（筛选值多选时使用）
 * @prop {string} singleSelect 已勾选值（筛选值单选时使用）
 * @prop {Function} [filterMethod] 筛选方法
 * @prop {Array} [filteredValue] 默认筛选值
 * @prop {boolean} [filterSingle] 筛选值单选？
 */
 const filterableCols = reactive(
  columnData.value
    .filter(c => c.filterable)
    .reduce((prev,curr) => {
      prev[curr.dataKey] = {
        selected: [],
        list: [],
        singleSelect: undefined,
        filterMethod: curr.filterMethod ?? generalFilterHandler,
        filteredValue: curr.filteredValue,
        filterSingle: curr.filterSingle ?? false
      }
      return prev
    }, {})
)

// 前一筛选状态
const prevFilters = ref([])
// 对比筛选状态
const compareFilters = currFilters => {
  return prevFilters.value.length === currFilters.length
    && prevFilters.value.every((f,idx) => {
      let [
        currDataKey,
        { selected: currSelected, singleSelect: currSingleSelect }
      ] = currFilters[idx]
      currSelected = currSelected.slice(0).sort()
      return f.dataKey === currDataKey
        && f.singleSelect === currSingleSelect
        && f.selected.slice(0).sort().every((p,idx1) => p === currSelected[idx1])
    })
}
// 筛选
const onFilter = (flag) => {
  const allFilters = Object.entries(filterableCols).filter(([_,configs]) => {
    return configs.filterSingle
      ? ![null,undefined].includes(configs.singleSelect)
      : configs.selected?.length > 0
  })
  const compareRes = compareFilters(allFilters)
  if(flag !== 'init' && compareRes) return
  prevFilters.value = allFilters.map(([dataKey,configs]) => ({
    dataKey,
    selected: configs.selected,
    singleSelect: configs.singleSelect
  }))
  tempData.value = originData.value.filter(p => {
    return allFilters.every(([dataKey,configs]) => {
      return !configs.filterMethod ||
        configs.filterMethod(p[dataKey], configs.filterSingle ? configs.singleSelect : configs.selected)
    })
  })
};
const onReset = (dataKey) => {
  filterableCols[dataKey].selected = []
  onFilter();
};

// 自动获取各项筛选列表
const getFiltersFromResp = () => {
  for(let dataKey in filterableCols) {
    let list = originData.value
      .map(p => p[dataKey]).filter(Boolean)
      .reduce((prev,curr) => {
        if(curr instanceof Array) prev.push(...curr)
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

const getData = (total) => {
  apiGetData(total).then((res) => {
    originData.value = res ?? []
  })
}
</script>

<template>
  <h3>el-table-v2 筛选/过滤器 demo</h3>
  <el-table-v2
    :columns="columns"
    :data="tableData"
    :sort-by="sortState"
    @column-sort="onSort"
    :width="666"
    :height="666"
    fixed
  />
  <div>Total: {{ tableData.length }} / {{ originData.length }}</div>
  <el-button @click="getData()">刷新表格数据</el-button>
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
</style>