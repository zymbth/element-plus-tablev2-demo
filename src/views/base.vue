<script setup>
import { ref, onMounted } from 'vue'

onMounted(() => {
  getData();
});

const tableData = ref([]);
const columns = [
  { key: "no", dataKey: "no", title: "No.", width: 60 },
  { key: "code", dataKey: "code", title: "code", width: 80 },
  { key: "name", dataKey: "name", title: "name", width: 80 },
  { key: "age", dataKey: "age", title: "Age", width: 60 },
  { key: "gender", dataKey: "gender", title: "gender", width: 80 },
  { key: "city", dataKey: "city", title: "City", width: 80 }
];

const getData = (total) => {
  getDataApi(total).then((res) => {
    tableData.value = res ?? [];
  });
};
const getDataApi = (total) => {
  if (!total) total = Math.floor(Math.random() * 2000 + 1000);
  return new Promise((resolve, reject) => {
    resolve(
      Array.from({ length: total }).map((_, idx) => {
        return {
          no: idx + 1,
          code: Math.floor(Math.random() * 100000).toString(16),
          name: Math.floor(Math.random() * 100000).toString(16),
          age: Math.floor(Math.random() * 30 + 18),
          gender: Math.random() > 0.5 ? "男" : "女",
          city: ["北京", "上海", "深圳"][Math.floor(Math.random() * 3)]
        };
      })
    );
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
 