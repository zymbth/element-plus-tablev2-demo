<script setup>
const code = `<el-table-v2
  :columns="columns"
  :data="data"
  :estimated-row-height="40"
  row-key="no"
  :width="700"
  :height="400"
  fixed
/>
`
</script>
<template>
  <section>
    <h3>Notes:</h3>
    <h4>1. 动态高度行的使用：</h4>
    <p>使用 <code>estimated-row-height</code> 属性设置预估高度，<code>row-height</code> 属性会失效。</p>
    <p>最重要的，<code>row-key</code> 默认为 <code>id</code>，表格数据中没有id属性的话，需指定 <code>row-key</code>，否则，动态高度行无法生效！</p>
    <p>示例：</p>
    <pre>{{ code }}</pre>
  </section>
</template>
 
<style scoped>
section {
  text-align: left;
}
</style>