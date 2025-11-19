<script setup>
import { ref, onMounted } from 'vue'
import { apiGetData } from '../api';

onMounted(() => {
  getData();
});

const tableData = ref([]);
const columns = [
  { key: "no", dataKey: "no", title: "No.", width: 60 },
  { key: "code", dataKey: "code", title: "Code", width: 80 },
  { key: "name", dataKey: "name", title: "Name", width: 80 },
  { key: "age", dataKey: "age", title: "Age", width: 60 },
  { key: "gender", dataKey: "gender", title: "Gender", width: 80 },
  { key: "city", dataKey: "city", title: "City", width: 80 }
];

const getData = (total) => {
  apiGetData(total).then((res) => {
    tableData.value = res ?? [];
  });
};
</script>

<template>
  <h3>el-table-v2 基本使用 demo</h3>
  <el-table-v2
    :columns="columns"
    :data="tableData"
    :width="666"
    :height="666"
    :fixed="true"
  />
  <div>Total: {{ tableData.length }}</div>
  <el-button @click="getData()">刷新表格数据</el-button>
</template>
 