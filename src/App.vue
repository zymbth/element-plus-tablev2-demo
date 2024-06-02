<script setup>
import { ref, computed, shallowRef } from 'vue'
import BaseView from '@/views/base.vue'
import SortView from '@/views/sort.vue'
import MultiSortView from '@/views/multi-sort.vue'
import FilterView from '@/views/filter.vue'
import SortAndFilterView from '@/views/sort-and-filter.vue'
import GroupHeaderOfficialView from '@/views/group-header-official.vue'
import GroupHeaderView from '@/views/group-header.vue'
import ReencapsulateView from '@/views/reencapsulate.vue'

const currNo = ref(1)
const views = shallowRef([
  { no: 1, title: 'TableV2基本使用', value: BaseView },
  { no: 2, title: '单项排序', value: SortView },
  { no: 3, title: '多重排序', value: MultiSortView },
  { no: 4, title: '筛选/过滤器', value: FilterView },
  { no: 5, title: '排序&筛选', value: SortAndFilterView },
  { no: 6, title: '表头分组(官方,多一级表头存放分组)', value: GroupHeaderOfficialView },
  { no: 7, title: '表头分组(非官方,不增加表头层级)', value: GroupHeaderView },
  { no: 8, title: 'TableV2二次封装(排序&筛选&表项操作)', value: ReencapsulateView },
])
const currView = computed(() => views.value.find(v => v.no === currNo.value)?.value)

const handleClick = no => (currNo.value = no)
</script>

<template>
  <div>
    <div class="views">
      <span
        :class="['view', { active: view.no === currNo }]"
        v-for="view in views"
        :key="view.no"
        @click="handleClick(view.no)"
        >{{ view.title }}</span
      >
    </div>
    <hr />
    <component :is="currView" />
  </div>
</template>

<style lang="scss" scoped>
.views {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em 1em;
  .view {
    color: #333;
    cursor: pointer;
    &.active {
      color: var(--theme-color);
      cursor: default;
    }
  }
}
</style>
