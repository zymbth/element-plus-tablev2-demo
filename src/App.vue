<script setup>
import { ref, computed, shallowRef } from 'vue'
import baseView from '@/views/base.vue'
import sortView from '@/views/sort.vue'
import multiSortView from '@/views/multi-sort.vue'
import filterView from '@/views/filter.vue'
import sortAndFilterView from '@/views/sort-and-filter.vue'
import reencapsulateView from '@/views/reencapsulate.vue'

// const currView = shallowRef(baseView)

const currNo = ref(1)
const views = shallowRef([
  { no: 1, title: 'TableV2基本使用', value: baseView },
  { no: 2, title: '单项排序', value: sortView },
  { no: 3, title: '多重排序', value: multiSortView },
  { no: 4, title: '筛选/过滤器', value: filterView },
  { no: 5, title: '排序&筛选', value: sortAndFilterView },
  { no: 6, title: 'TableV2二次封装(排序&筛选&表项操作)', value: reencapsulateView }
])
const currView = computed(() => views.value.find(v => v.no === currNo.value)?.value)

const handleClick = no => currNo.value = no
</script>

<template>
  <div>
    <div class="views">
      <span
        :class="['view',{'active':view.no === currNo}]"
        v-for="view in views"
        :key="view.no"
        @click="handleClick(view.no)"
      >{{ view.title }}</span>
    </div>
    <component :is="currView" />
  </div>
</template>

<style lang="scss" scoped>
.views {
  // display: flex;
  .view {
    color: #333;
    cursor: pointer;
    &.active {
      color: var(--theme-color);
      cursor: default;
    }
  }
  .view + .view {margin-left:10px}
}
</style>
