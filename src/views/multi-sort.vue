<script setup>
import { ref, onMounted, watch } from "vue";
import { TableV2SortOrder } from 'element-plus'
import { apiGetData } from "../api";

onMounted(() => {
  getData(20);
});

const sortByNum = (a, b, prop) => a[prop] - b[prop];
const sortByStr = (a, b, prop) => a[prop].localeCompare(b[prop], "zh-CN");

const originData = ref([]);
const tableData = ref([]);

/* eslint-disable */
// prettier-ignore
const columns = [
  { key: "no", dataKey: "no", title: "No.", width: 60, sortable: true, sortMethod: sortByNum },
  { key: "code", dataKey: "code", title: "Code", width: 80 },
  { key: "name", dataKey: "name", title: "Name", width: 80 },
  { key: "age", dataKey: "age", title: "Age", width: 60, sortable: true, sortMethod: sortByNum },
  { key: "gender", dataKey: "gender", title: "Gender", width: 80, sortable: true },
  { key: "city", dataKey: "city", title: "City", width: 80, sortable: true }
];
/* eslint-enable */

// 排序状态，ref对象变量。对象的键、值分别对于排序项的key、排序值(asc/desc)
const sortState = ref({
  // 初始排序
  city: TableV2SortOrder.DESC,
  gender: TableV2SortOrder.ASC
});
// 监听 排序状态的变化 与 表格数据的更新，进行排序
watch(
  [sortState, originData],
  ([newState, newData]) => {
    if (!newData?.length) return;
    // 多重排序
    // 获取排序信息
    const sortList = Object.entries(newState)?.reduce((prev, curr) => {
      const [key, order] = curr;
      if (!key || !order) return prev;
      const currCol = columns.find((c) => c.key === key);
      if (!currCol) return prev;
      const currSortMethod = currCol.sortMethod ?? sortByStr;
      prev.push({
        key,
        order,
        dataKey: currCol.dataKey,
        sortMethod: currSortMethod
      });
      return prev;
    }, []);
    // 无排序
    if (!sortList?.length) {
      tableData.value = originData.value;
      return;
    }
    // 进行排序
    tableData.value = originData.value
      .slice(0)
      .sort((a, b) => recursiveSort(a, b, sortList));
  },
  { immediate: true, deep: true }
);
// 多个排序规则，递归排序
const recursiveSort = (a, b, sortList) => {
  const currSort = sortList[0];
  if (!currSort) return 0;
  const res = currSort.sortMethod(a, b, currSort.dataKey);
  return res === 0
    ? recursiveSort(a, b, sortList.slice(1))
    : currSort.order === TableV2SortOrder.ASC
      ? res
      : 0 - res;
};

// 排序事件处理
const onSort = ({ key, order }) => {
  // 多重排序，记录所有可排序项的排序信息
  sortState.value[key] = order || TableV2SortOrder.ASC;
};
// 清空排序
const clearSort = () => {
  sortState.value = {};
};

const getData = (total) => {
  apiGetData(total).then((res) => {
    originData.value = res ?? [];
    tableData.value = originData.value;
  });
};
</script>

<template>
  <h3>el-table-v2 多重排序 demo</h3>
  <el-table-v2
    :columns="columns"
    :data="tableData"
    v-model:sort-state="sortState"
    @column-sort="onSort"
    :width="666"
    :height="666"
    fixed
  />
  <div>Total: {{ tableData.length }}</div>
  <div>sortState: {{ sortState }}</div>
  <el-button @click="clearSort()">清空排序</el-button>
  <!--   <el-button @click="getData()">刷新表格数据</el-button> -->
</template>
