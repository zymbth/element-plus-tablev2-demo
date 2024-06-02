<script lang="jsx" setup>
import { ref, onMounted } from 'vue'
import { sortByNum, generalArrFilterHandler } from '@/utils/el-table-v2-utils'
import ElTbv2Comp from '@/components/el-tbv2-comp.vue'
import ElTbColsOperate from '@/components/el-tb-cols-operate.vue'

const tbHeight = ref(500) // 表格高度

onMounted(() => {
  tbHeight.value = Math.max(window.innerHeight - 270, 500)
  getData()
})

const originData = ref([])  // 表格源数据

const elTbv2CompRef = ref() // 表格对象

/**
 * 表格项信息列表
 * 
 * @prop {string} title 项名
 * @prop {string} dataKey 项值
 * @prop {string|number} width 项宽度
 * @prop {boolean} [sortable] 可排序？
 * @prop {boolean} [filterable] 可筛选？
 * @prop {Function} [filterMethod] 筛选方法
 * @prop {string|Array} [filteredValue] 默认筛选(值/列表)
 * @prop {boolean} [filterSingle] 可选单个筛选值？否，可选多个筛选值
 * @prop {boolean} [hidden] 隐藏该项？
 * @prop {boolean} [alwaysShow] 始终显示该项？
 */
 const columnData = ref([
  { key: "no", dataKey: "no", title: "No.", width: 60, sortable: true, sortMethod: sortByNum, alwaysShow: true },
  { key: "code", dataKey: "code", title: "code", width: 80, sortable: true },
  { key: "name", dataKey: "name", title: "name", width: 80 },
  { key: "age", dataKey: "age", title: "Age", width: 60, sortable: true, sortMethod: sortByNum, hidden: true },
  { key: "gender", dataKey: "gender", title: "gender", width: 80, filterable: true, filterSingle: true, filteredValue: '男' },
  { key: "city", dataKey: "city", title: "City", width: 80, sortable: true, filterable: true },
  { key: "tags", dataKey: "tags", title: "Tags", width: 300, filterable: true, filterMethod: generalArrFilterHandler }
]);

const handleCellRender = ({
  cellData,
  column: { dataKey },
  rowData: row
}) => {
  if(dataKey === 'tags') {
    return <>
      { cellData.map(tag => <el-tag class="tags">{ tag }</el-tag>) ?? '' }
    </>
  } else if(dataKey === 'age') {
    return <span style={ {
      color: ['#666','#333','green','blue','orange','yellow','red','purple'][Math.floor(cellData/10)]
    } }>{ cellData }</span>
  }
  return cellData
}

const loading = ref(false)
const getData = (total) => {
  loading.value = true
  getDataApi(total).then((res) => {
    originData.value = res ?? []
  }).finally(_ => {
    loading.value = false
  })
}
const getDataApi = (total) => {
  if (!total) total = Math.floor(Math.random() * 2000 + 1000)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(
        Array.from({ length: total }).map((_, idx) => {
          return {
            no: idx + 1,
            code: Math.floor(Math.random() * 100000).toString(16),
            name: Math.floor(Math.random() * 100000).toString(16),
            age: Math.floor(Math.random() * 30 + 18),
            gender: Math.random() > 0.5 ? "男" : "女",
            city: ["北京", "上海", "深圳"][Math.floor(Math.random() * 3)],
            tags: ['developer','Ph.D','Bachelor','Master','CEO','HRBP','HR'].sort((a,b) => Math.random() - 0.5)
              .slice(0, Math.floor(Math.random() * 4))
          }
        })
      )
    }, 500)
  })
}

</script>

<template>
  <h3>el-table-v2 排序&筛选二次封装 demo</h3>
  <span class="page-title">Statistics Table</span>
  <div class="page-content">
    <div style="margin-top:10px;color:#333;">
      <span>Total: {{ elTbv2CompRef?.tableData?.length ?? 0 }} / {{ originData.length }}</span>
      <ElTbColsOperate :columnData="columnData" />
    </div>
    <!-- List -->
    <ElTbv2Comp
      ref="elTbv2CompRef"
      class="tb-targets"
      :originData="originData"
      :columnData="columnData"
      :handleCellRender="handleCellRender"
      :loading="loading"
      :tbHeight="tbHeight"
      :initSort="{ key: 'age', order: 'desc' }"
      :tbprops="{
        cache: 0,
        'row-height': 40,
        'scrollbar-always-on': true
      }"
    />
  </div>

</template>
<style lang="scss" scope>
.tags+.tags {margin-left:4px}
</style>