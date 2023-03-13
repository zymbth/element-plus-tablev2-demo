Element Plus 虚拟化表格组件的使用

# 前言

`element-plus@2.2.0` 后提供虚拟化表格组件，解决表格数据过大导致的卡顿等性能问题。相对于表格组件，用法上区别还是挺大的，尤其是一些附加的功能，例如排序、筛选、自定义单元格/表头渲染等等。本文参照官网文档、示例，结合个人使用总结，演示虚拟化表格的基本使用，记录上述附加功能的基本实现。除组件的相关接口需要按照官网规范使用外，示例中的其它具体实现的方法**仅作参考**。

github上创建了一个项目收纳本文的一些demos: [element-plus-tablev2-demo](https://github.com/zymbth/element-plus-tablev2-demo)

# 一、Element Plus 表格基础

官方介绍：

*“在前端开发领域，表格一直都是一个高频出现的组件，尤其是在中后台和数据分析场景。 但是，对于 Table V1来说，当一屏里超过 1000 条数据记录时，就会出现卡顿等性能问题，体验不是很好。
通过虚拟化表格组件，超大数据渲染将不再是一个头疼的问题。”*

官方提示：
> TIP
> 该组件**仍在测试中**，生产环境使用可能有风险。 若您发现了 bug 或问题，请于 [GitHub](https://github.com/element-plus/element-plus/issues) 报告给我们以便修复。 同时，有一些 API 并未在此文档中提及，因为部分还没有开发完全，因此我们不在此提及。
**即使**虚拟化的表格是高效的，但是当数据负载过大时，**网络**和**内存容量**也会成为您应用程序的瓶颈。 因此请牢记，虚拟化表格永远不是最完美的解决方案，请考虑数据分页、过滤器等优化方案。

> TIP
> 在 SSR 场景下，您需要将组件包裹在 `<client-only></client-only>` 之中 (如: [Nuxt](https://nuxt.com/v3)) 和 SSG (例如: [VitePress](https://vitepress.vuejs.org/)).

## 属性

详见官网，这里只说几点需要注意的地方

- 表格属性: width, height 必填（可使用 `AutoResizer` 组件使表格自动调整大小，使用方式参照官网）
- 表格属性 columns 为列 column 的配置数组，这是与表格组件最大的差异之一
- column 的配置中，可定义很多之前定义在 column 模板中的属性
- column 的配置属性中，cellRenderer 自定义单元格渲染是最大的差异（模板 ----> js）

## 简单使用

表格组件 `el-table` (TableV1):

```vue
<script setup>
const columns = [
	{ prop: 'name', label: 'Name', width: 100 },
	{ prop: 'age', label: 'Age', width: 100 },
	{ prop: 'gender', label: 'Gender', width: 100 },
	{ prop: 'tel', label: 'Tel', width: 100 }
]
const tableData = [
	{ name: '', age: '', gender: '', tel: '' },
	// ...
]
</script>
<template>
  <el-table :data="tableData">
  	<el-table-column
  		v-for="col in columns"
  		:key="col.prop"
  		:prop="col.prop"
      :label="col.label"
  		:width="col.width"
  	/>
  </el-table>
</template>
```

虚拟化表格组件 `el-table-v2` (TableV2): 
```vue
<script setup>
const columns = [
	{ key: 'name', dataKey: 'name', title: 'Name', width: 100 },
	{ key: 'age', dataKey: 'age', title: 'Age', width: 100 },
	{ key: 'gender', dataKey: 'gender', title: 'Gender', width: 100 },
	{ key: 'tel', dataKey: 'tel', title: 'Tel', width: 100 }
]
const tableData = [
	{ name: '', age: '', gender: '', tel: '' },
	// ...
]
</script>
<template>
  <el-table-v2
    :columns="columns"
    :data="tableData"
    :width="700"
    :height="400"
    fixed
  />
</template>
```

后续的示例基于 `element-plus@2.2.17`

# 二、自定义单元格渲染

## 准备工作

本文采用 `jsx` 实现， Vue CLI 创建的项目可直接在vue单文件组件的 script 标签中添加 lang="jsx" (`<script setup lang="jsx">`)

> *“`create-vue` 和 Vue CLI 都有预置的 JSX 语法支持。如果你想手动配置 JSX，请参阅 [@vue/babel-plugin-jsx](https://github.com/vuejs/jsx-next) 文档获取更多细节。”*


- `jsx` 用法可参考：

> [Vue 3 Babel JSX 插件](https://github.com/vuejs/babel-plugin-jsx/blob/dev/packages/babel-plugin-jsx/README-zh_CN.md)
> [vue官网 - 渲染函数 & JSX - JSX / TSX](https://cn.vuejs.org/guide/extras/render-function.html#jsx-tsx)
> [element-plus虚拟化表格组件el-table-v2渲染自定义组件的其中两种方式(js和jsx)及注意事项](https://blog.csdn.net/Mr_WangGeGe/article/details/127275868)
> [在Vue中使用JSX，很easy的](https://juejin.cn/post/7018742119082754062)

需掌握最基本的 插值、v-if、v-for、v-on、事件修饰符、组件的 jsx 语法，以及组件的插槽语法

- Element Plus官方文档：

>[Element Plus - Virtualized Table 虚拟化表格](https://element-plus.gitee.io/zh-CN/component/table-v2.html)

需了解该组件的常用属性方法、Column属性
本节的重点是单元格自定义渲染，在于 `cellRenderer` 方法，其参数类型如下：

```typescript
type CellRenderProps<T> = {
  cellData: T
  column: Column<T>
  columns: Column<T>[]
  columnIndex: number
  rowData: any
  rowIndex: number
}
```
分别为 单元格值、项、所有项、项下标、行数据、行下标

## 渲染方式对比（el-table vs el-table-v2）

`el-table` 中常用的自定义单元格渲染方式（定义在表格 column 模板中）：

```vue
<el-table :data="tableData">
  <el-table-column
    v-for="col in columns"
    :key="col.prop"
    :prop="col.prop"
    :label="col.label"
    :width="col.width"
  >
		<template #default="scope">
			<!-- 自定义单元格渲染 -->
			<el-tag
				v-if="col.prop === 'tag'"
			>{{ scope.row[col.prop] }}</el-tag>

			<template v-else-if="col.prop === 'link'">
				<router-link
          v-if="!!scope.row.id"
          :to="{ name: 'TargetRouteName', params: { id: scope.row.id } }"
        >{{ scope.row[col.prop] }}</router-link>
        <span v-else>{{ scope.row[col.prop] }}</span>
			</template>

			<template v-else>{{ scope.row[col.prop] }}</template>
		</template>
  </el-table-column>
</el-table>
```

`el-table-v2` 中常用的自定义单元格渲染方式（定义在 column 配置列表中）：

**vue单文件组件需要在script中加上`lang="jsx"`**

```vue
<script lang="jsx" setup>
const columns = [
	{
		key: 'link',
		title: 'Link',
		dataKey: 'link',
		width: 100,
		cellRenderer: ({ cellData, rowData }) => (
			<a href={ rowData.link } target="_blank">Go</a>
		)
	},
	// ...
]
</script>
```

## 实例列举

为了对照，会分别放上 `el-table` 与 `el-table-v2` 的自定义单元格渲染代码
为了精简代码，下述 `el-table-v2` 的示例均只展示 `cellRenderer` 函数

- 组件

```vue
<template v-else-if="col.prop === 'gene'">
  <router-link
    v-if="scope.row.id && scope.row.view &&
    (scope.row.view?.includes($store.getters.userId) || $checkRolePermission(scope.row.view))"
    :to="{ name: 'Target', params: { tid: scope.row.id } }"
    class="gene-text"
  >{{ scope.row[col.prop] || '-' }}</router-link>
  <span v-else class="gene-text">{{ scope.row[col.prop] || '-' }}</span>
</template>
```

```jsx
const cellRenderer = ({ cellData, rowData: row }) => {
  const tmp = row.id && row.view && (row.view?.includes($store.getters.userId) || $checkRolePermission(row.view))
  return tmp
    ? <router-link
      to={ { name: 'Target', params: { tid: row.id } } }
      class="gene-text"
    >{ cellData ?? '-' }</router-link>
    : <span class="gene-text">{ cellData ?? '-' }</span>
}
```
包含了插值、v-if、组件。全局注册的组件可直接在 jsx 中使用

- v-for

```vue
<template v-if="col.prop === 'result'">
  <router-link
    class="gene-source-tag"
    v-for="tag in scope.row[col.prop]"
    :to="{ name: 'TargetAnalysis', params: { tid: scope.row.id, type: tag } }"
  >
    <el-tag>{{ tag }}</el-tag>
  </router-link>
</template>
```

```jsx
const cellRenderer = ({ cellData, rowData: row }) => {
  return <>{
    cellData?.map(tag => (
      <router-link
        class="gene-source-tag"
        to={ { name: 'TargetAnalysis', params: { tid: row.id, type: tag } } }
      >
        <el-tag>{ tag }</el-tag>
      </router-link>
    )) ?? ''
  }</>
}
```

包含 v-for、组件、空标签。若并未全局引入Element Plus，需手动引入相关组件，其它自定义组件同样如此。

# 三、排序

## 介绍

TableV1 组件排序的实现过程：
设置 `el-table-column` 的 `sortable` 属性为 `true` 即可。
多个排序间相互独立

TableV2 排序的实现在我看来是“自由度很高”的，除了根据单项排序表格外，它还提供了一种叫“受控排序”的东西（可以实现多重排序）：

首先，排序值只有两种，升/降序。清空排序需要手动清空记录排序状态的变量；

其次，组件提供了排序监听事件(`@column-sort`)，但具体的排序方法需自行定义；

再次，不同于 TableV1 同时只进行一项排序，TableV2 允许多重排序。它可以记录所有可排序项的排序状态，但如何实现多重排序需要你自己在监听事件中实现。（自由度很高，一方面需要手动实现多重排序方法，另一方面需要通过管理排序状态变量控制表头UI上的三种状态: 升/降/无。为了避免UI上的疑惑，这两方面需要协调一致）

## 关键属性、事件、方法说明

先放上从官网上粘过来的相关的属性、事件、方法说明，方便对照后续示例参考

- TableV2属性

| 属性名 | 描述说明 | 类型 | 默认值 |
| :-------- | :----- | :----- | :----- |
| sort-by | 排序方式 | Object<SortBy> | {} |
| sort-state |  多个排序  | Object<SortState> |  undefined  |

- TableV2事件

| 事件名 | 描述 | 参数 |
| :-------- | :----- | :----- |
| column-sort | 列排序时调用 | Object<ColumnSortParam> |

Column属性

| 属性名 | 描述 | 类型 | 默认值 |
| :-------- | :----- | :----- | :----- |
| sortable | 设置列是否可排序 | Boolean | - |

- 相关类型

```typescript
type KeyType = string | number | symbol

type ColumnSortParam<T> = { column: Column<T>; key: KeyType; order: SortOrder }

enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

type SortBy = { key: KeyType; Order: SortOrder }
type SortState = Record<KeyType, SortOrder>
```

## 使用示例（属性、事件、方法）

示例只保留了最基本的部分，方便理解如何使用。第三小节提供了完整 demo codepen 链接，可在线调试

### 单项排序

一般想要的就是表格若干项可以排序，但只进行单项排序

```html
<el-table-v2
	:sort-by="sortState"
	@column-sort="onSort"
	...
/>
```

```javascript
// 自行编写排序事件处理方法
const handleSort = () => {}
// 记录排序状态, key: 排序项的key, order: 升/降序
const sortState = ref({ key: "no", order: 'asc' });
// 监听排序事件
const onSort = ({ key, order }) => {
	handleSort()
  sortState.value = { key, order };
};
```

### 多重排序

举个例子，有个人员表，希望按城市排序，同一城市的按性别排序，同一性别的按年龄排序

```html
<el-table-v2
	v-model:sort-state="sortState"
	@column-sort="onSort"
	...
/>
```

```javascript
// 事件处理方法：自行根据 sortState 实现多重排序
const handleSort = () => {}
// 以键值对形式记录排序状态
const sortState = ref({
	city: 'desc',
  gender: 'asc',
  age: 'asc'
});
// 监听排序事件
const onSort = ({ key, order }) => {
	handleSort()
  sortState.value[key] = order;
};
```

### 在线演示

[el-table-v2 单项排序 demo](https://codepen.io/zymbth/pen/jOvBNex)
[el-table-v2 多重排序 demo](https://codepen.io/zymbth/pen/KKxWPOG)

# 四、筛选/过滤器

## 介绍

类似于自定义单元格渲染，实现筛选需要通过自定义表头单元格渲染实现

官方示例是在可筛选的表头单元格中添加显示为筛选图标的弹出框（`el-popover` 组件），弹出框内显示可筛选选项，选项列表需要自行计算好。筛选的执行也需要自行监听实现，和排序一样，自由度非常高~

自定义表头单元格渲染：

```javascript
const columns = [
	{
		// key, dataKey, title, ...
		headerCellRenderer: (props) => {
			return props.column.title
		}
	},
  // ...
]
```

Column属性

| 属性名 | 描述 | 类型 | 默认值 |
| :-------- | :----- | :----- | :----- |
| headerCellRenderer | 自定义头部渲染器 | VueComponent/(props: HeaderRenderProps) => VNode | - |

类型

```typescript
type HeaderRenderProps<T> = {
  column: Column<T>
  columns: Column<T>[]
  columnIndex: number
  headerIndex: number
}
```

通过在 `headerCellRenderer` 方法中返回一个的 VNode 实现自定义表头单元格渲染

## 使用示例

筛选/过滤器的高自由度决定了它的具体实现方式因人而异，以下示例仅作参考。同第二节一样，示例使用的是 jsx

### 实现过程

首先，需要标识哪些 `column` 需要添加筛选功能，延续个人在TableV1中的使用习惯，在 `columns` 数组中添加相关属性，`filterable` 标识该项是否可筛选， `filterMethod` 指定筛选方法

```javascript
import { generalArrFilterHandler } from '@/use/el-table-v2-utils'

const columnData = ref([
  { key: "no", dataKey: "no", title: "No.", width: 60 },
  { key: "code", dataKey: "code", title: "code", width: 80 },
  { key: "name", dataKey: "name", title: "name", width: 80 },
  { key: "age", dataKey: "age", title: "Age", width: 60 },
  { key: "gender", dataKey: "gender", title: "gender", width: 80, filterable: true },
  { key: "city", dataKey: "city", title: "City", width: 80, filterable: true },
  { key: "tags", dataKey: "tags", title: "Tags", width: 150, filterable: true, filterMethod: generalArrFilterHandler }
]);
```

为了避免对 TableV2 的潜在影响，表格组件所使用的 columns 数组中过滤掉一些不必要的属性，`headerCellRenderer` 方法也需要定义在此。

示例中，定义了一个弹出框，点击筛选图标显示弹出框，弹出框内是一个多选框组，确定后进行筛选

```jsx
const columns = columnData.value.map(col => {
	return {
		key: col.dataKey,
    title: col.title,
    dataKey: col.dataKey,
    width: col.width ?? 100,
    headerCellRenderer: (props) => {
      if(!col.filterable) return props.column.title
      return <div class="tbv2-th-filter">
        <span class="th-cell">{ props.column.title }</span>
        <el-popover trigger="hover" {...{ width: 200 }}>
          {{
            default: () => (
            	<div class="filter-wrapper">
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
            ),
            reference: () => (
              <svg
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
                width="14" height="14" style="cursor:pointer"
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
```

别忘了，筛选项可筛选列表也需要自行计算出来。 `filterableCols` 是用来存储可筛选项相关信息的，示例中，定义了默认的筛选方法

```javascript
import { generalFilterHandler } from '@/use/el-table-v2-utils'

const originData = ref([]);
const tableData = ref([]);

/**
 * 筛选信息列表
 * props:
 * - {Array} list 可筛选值列表
 * - {Array} selected 已勾选列表
 * - {Function} [filterMethod] 筛选方法
 */
const filterableCols = reactive(
  columnData.value
    .filter(c => c.filterable)
    .reduce((prev,curr) => {
      prev[curr.dataKey] = {
        selected: [],
        list: [],
        filterMethod: curr.filterMethod ?? generalFilterHandler
      }
      return prev
    }, {})
)

// 自动获取各项筛选列表
const getFiltersFromResp = () => {
  for(let dataKey in filterableCols) {
    let list
    if(dataKey === 'tags') { // tags 项可筛选列表固定
      list = ['developer','Ph.D','Bachelor','Master','CEO','HRBP','HR'].map(p1 => ({ text: p1, value: p1 }))
    } else { // 其它项取所有非重复项
      list = originData.value.map(p => p[dataKey]).filter(Boolean)
      // 去重、转对象
      list = [...new Set(list)].map(p1 => ({ text: p1, value: p1 }))
    }
    filterableCols[dataKey].list = list
    filterableCols[dataKey].selected = []
  }
}

// const getTableData = () => { ... }
const getData = (total) => {
  getTableData(total).then((res) => {
    originData.value = res ?? [];
    tableData.value = originData.value;
    getFiltersFromResp()
  });
};
```

筛选方法需自行定义

```javascript
const onFilter = () => {
  const allFilters = Object.entries(filterableCols).filter(([_,configs]) => {
    return configs.selected?.length > 0
  })
  tableData.value = originData.value.filter(p => {
    return allFilters.every(([dataKey,configs]) => {
      return !configs.filterMethod || configs.filterMethod(p[dataKey], configs.selected)
    })
  })
};
const onReset = (dataKey) => {
  filterableCols[dataKey].selected = []
  onFilter();
};
```

### 完整代码

```vue
<script lang="jsx" setup>
import { ref, reactive, onMounted } from "vue"
import { generalFilterHandler, generalArrFilterHandler } from '@/use/el-table-v2-utils'

onMounted(() => {
  getData()
})

const originData = ref([]);
const tableData = ref([]);
const columnData = ref([
  { key: "no", dataKey: "no", title: "No.", width: 60 },
  { key: "code", dataKey: "code", title: "code", width: 80 },
  { key: "name", dataKey: "name", title: "name", width: 80 },
  { key: "age", dataKey: "age", title: "Age", width: 60 },
  { key: "gender", dataKey: "gender", title: "gender", width: 80, filterable: true },
  { key: "city", dataKey: "city", title: "City", width: 80, filterable: true },
  { key: "tags", dataKey: "tags", title: "Tags", width: 150, filterable: true, filterMethod: generalArrFilterHandler }
]);
const columns = columnData.value.map(col => {
	return {
		key: col.dataKey,
    title: col.title,
    dataKey: col.dataKey,
    width: col.width ?? 100,
    headerCellRenderer: (props) => {
      if(!col.filterable) return props.column.title
      return <div class="tbv2-th-filter">
        <span class="th-cell">{ props.column.title }</span>
        <el-popover trigger="hover" {...{ width: 200 }}>
          {{
            default: () => (
            	<div class="filter-wrapper">
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
            ),
            reference: () => (
              <svg
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
                width="14" height="14"
              	style={ {
                    cursor: 'pointer',
                    color: filterableCols[col.dataKey].selected?.length > 0 ? '#387FE5' : 'inherit'
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

/**
 * 筛选信息列表
 * props:
 * - {Array} list 可筛选值列表
 * - {Array} selected 已勾选列表
 * - {Function} [filterMethod] 筛选方法
 */
 const filterableCols = reactive(
  columnData.value
    .filter(c => c.filterable)
    .reduce((prev,curr) => {
      prev[curr.dataKey] = {
        selected: [],
        list: [],
        filterMethod: curr.filterMethod ?? generalFilterHandler
      }
      return prev
    }, {})
)

const onFilter = () => {
  const allFilters = Object.entries(filterableCols).filter(([_,configs]) => {
    return configs.selected?.length > 0
  })
  tableData.value = originData.value.filter(p => {
    return allFilters.every(([dataKey,configs]) => {
      return !configs.filterMethod || configs.filterMethod(p[dataKey], configs.selected)
    })
  })
};
const onReset = (dataKey) => {
  filterableCols[dataKey].selected = []
  onFilter();
};

const tagList = ['developer','Ph.D','Bachelor','Master','CEO','HRBP','HR']
// 自动获取各项筛选列表
const getFiltersFromResp = () => {
  for(let dataKey in filterableCols) {
    let list
    if(dataKey === 'tags') { // tags 项可筛选列表固定
      list = tagList.map(p1 => ({ text: p1, value: p1 }))
    } else { // 其它项取所有非重复项
      list = originData.value.map(p => p[dataKey]).filter(Boolean)
      // 去重、转对象
      list = [...new Set(list)].map(p1 => ({ text: p1, value: p1 }))
    }
    filterableCols[dataKey].list = list
    filterableCols[dataKey].selected = []
  }
}

const getData = (total) => {
  getTableData(total).then((res) => {
    originData.value = res ?? []
    tableData.value = originData.value
    getFiltersFromResp()
  })
}

const getTableData = (total) => {
  if (!total) total = Math.floor(Math.random() * 2000 + 1000)
  return new Promise((resolve, reject) => {
    resolve(
      Array.from({ length: total }).map((_, idx) => {
        return {
          no: idx + 1,
          code: Math.floor(Math.random() * 100000).toString(16),
          name: Math.floor(Math.random() * 100000).toString(16),
          age: Math.floor(Math.random() * 30 + 18),
          gender: Math.random() > 0.5 ? "男" : "女",
          city: ["北京", "上海", "深圳"][Math.floor(Math.random() * 3)],
          tags: tagList.sort((a,b) => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 4))
        }
      })
    )
  })
}
</script>

<template>
  <h3>el-table-v2 筛选/过滤器 demo</h3>
  <el-auto-resizer>
    <template #default="{ height, width }">
      <el-table-v2
        :columns="columns"
        :data="tableData"
        :width="width"
        :height="666"
        :fixed="true"
      />
    </template>
  </el-auto-resizer>
  <div>Total: {{ tableData.length }}</div>
  <el-button @click="getData()">刷新表格数据</el-button>
</template>
```

`el-table-v2-utils.js`:

```javascript
/**
 * element-plus TableV2 筛选方法
 * @param {string} value 单元格数值
 * @param {string|Array} filters 已选筛选值或筛选值列表
 * @returns {boolean}
 */
export function generalFilterHandler(value, filters) {
  if(filters instanceof Array)
    return filterHandler(value, filters)
  return selectFilterHandler(value, filters)
}

/**
 * element-plus TableV2 筛选方法
 * @param {string} value 单元格数值
 * @param {Array} filters 已选筛选值列表
 * @returns {boolean}
 */
function filterHandler(value, filters) {
  return !filters?.length ? true : filters.includes(value)
}

/**
 * element-plus TableV2 筛选方法
 * @param {string} value 单元格数值
 * @param {string} filter 已选中的筛选值
 * @returns {boolean}
 */
function selectFilterHandler(value, filter) {
  return !filter && filter !== 0 || filter === value
}

/**
 * element-plus TableV2 筛选方法(单元格数值类型为数组)
 * @param {string|Array} value 单元格数值
 * @param {string|Array} filters 已选筛选值或筛选值列表
 * @returns {boolean}
 */
export function generalArrFilterHandler(value, filters) {
  if(!(value instanceof Array))
    return generalFilterHandler(value, filters)
  if(filters instanceof Array)
    return arrayFilterHandler(value, filters)
  return selectArrayFilterHandler(value, filters)
}

/**
 * element-plus TableV2 筛选方法(单元格数值类型为数组)
 * @param {string} value 单元格数值
 * @param {Array} filters 已选筛选值列表
 * @returns {boolean}
 */
function arrayFilterHandler(value, filters) {
  return !filters?.length ? true : filters.some(f => value?.includes(f))
}

/**
 * element-plus TableV2 筛选方法(单元格数值类型为数组)
 * @param {string} value 单元格数值
 * @param {string} filter 已选中的筛选值
 * @returns {boolean}
 */
function selectArrayFilterHandler(value, filter) {
  return !filter && filter !== 0 || value?.includes(filter)
}
```

**注意：** 对单元格数值的筛选也分为很多种

- 最常见的，就是判断与选中筛选值是否相等(多选时，是否包含在内)。其它常见的判断有包含、以...开头、以...结尾、等等
- 其次，上例中有个特殊的项，tags，其数据类型为数组，需要筛选出存在 tag 包含在选中 tags 列表中的数据（如筛选条件为满足所有选中筛选值，筛选方法又不一样）
- 其它更特殊些的筛选都需要自行拟好筛选方法
- 需要注意，筛选方法参数与 TableV1 中的不同（示例中的自定义筛选方法是遍历一遍表格数据，而 TableV1 提供的筛选方法接口是对选中筛选值列表中的每个值，都遍历一遍表格数据。实质是一样的，只是方法参数类型不同而已）

另外，下一节方案二中，通过给源数据添加 hidden 标识是否通过筛选，无需单独记录筛选数据。改动也很简单，删除 `originData`，`onFilter` 中更新 hidden 属性值，表格绑定数据中进行筛选 hidden 不为 true 的。

### 其它附加功能

#### 默认筛选值、筛选列表单选

如 TableV1 中提供的功能，有时候，我们需要添加默认筛选值；有些筛选项我们希望做成单选的形式。

接上例，可更新代码如下：

```jsx
import CustomSelector from '@/components/custom-selector.vue'

const columnData = ref([
  // ...
  {
    key: "gender",
    dataKey: "gender",
    title: "gender",
    width: 80,
    filterable: true,
    filterSingle: true,
    filteredValue: '男'
  },
  // ...
]);

/**
 * 筛选信息列表
 * props:
 * - {Array} list 可筛选值列表
 * - {Array} selected 已勾选列表（筛选值多选时使用）
 * - {string} singleSelect 已勾选值（筛选值单选时使用）
 * - {Function} [filterMethod] 筛选方法
 * - {Array} [filteredValue] 默认筛选值
 * - {boolean} [filterSingle] 筛选值单选？
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

const onFilter = () => {
  const allFilters = Object.entries(filterableCols).filter(([_,configs]) => {
    return configs.filterSingle
      ? ![null,undefined].includes(configs.singleSelect)
      : configs.selected?.length > 0
  })
  tableData.value = originData.value.filter(p => {
    return allFilters.every(([dataKey,configs]) => {
      return !configs.filterMethod ||
        configs.filterMethod(p[dataKey], configs.filterSingle ? configs.singleSelect : configs.selected)
    })
  })
};

// 自动获取各项筛选列表
const getFiltersFromResp = () => {
  for(let dataKey in filterableCols) {
    // ...
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

const columns = columnData.value.map(col => {
  return {
    key: col.dataKey,
    title: col.title,
    dataKey: col.dataKey,
    width: col.width ?? 100,
    headerCellRenderer: (props) => {
      if(!col.filterable) return props.column.title
      return <div class="tbv2-th-filter">
        <span class="th-cell">{props.column.title}</span>
        <el-popover trigger="hover" {...{ width: 200 }}>
          {{
            default: () => {
              return filterableCols[col.dataKey].filterSingle
                ? <CustomSelector
                  v-model={ filterableCols[col.dataKey].singleSelect }
                  onChange={ onFilter }
                  list={ filterableCols[col.dataKey].list }
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
                      : filterableCols[col.dataKey].selected?.length > 0) ? '#387FE5' : 'inherit'
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
```

CustomSelector组件：单选列表（展开的 el-select ）

```vue
<script setup>
const props = defineProps({
  modelValue: { default: '' },
  list: { type: Array, default: [] }
})

const emit = defineEmits(['change','update:modelValue'])

function handleOptionClick(val) {
  if(props.modelValue === val) return
  emit('update:modelValue', val)
  emit('change', val)
}
</script>
<template>
  <div class="wrap">
    <div
      v-for="option in list"
      :key="option.value"
      :class="['item', { active: modelValue === option.value }]"
      @click="handleOptionClick(option.value)"
    >{{ option.text }}</div>
  </div>
</template>
<style lang="scss" scoped>
.wrap {
  width: 100%;
  font-size: 14px;
  color: #666;
  .item {
    line-height: 32px;
    padding: 0 12px;
    cursor: pointer;
    &.active {color: #387FE5;font-weight: bold;}
    &:hover {background-color: #f9f9f9;}
  }
}
</style>
```

#### 多级表头

官方文档在 TableV2 上给出的说法是“表头分组”，效果同 TableV1 不大一样。

V1是通过 `<el-table-column>` 嵌套实现，意义明确、实现简单，创建一个嵌套的 `columns` 列表就可以。

V2的实现是通过表格组件提供的 `header` 插槽

```vue
<script setup>
const CustomizedHeader  = ({ cells, columns, headerIndex }) => {
	return cells
}
</script>
<template>
  <el-table-v2
    :columns="columns"
    :data="tableData"
    :width="666"
    :height="666"
  >
    <template #header="props">
      <CustomizedHeader v-bind="props" />
    </template>
  </el-table-v2>
</template>
```

类型:

```typescript
type HeaderSlotProps = {
  cells: VNode[]
  columns: Column<any>[]
  headerIndex: number
}
```

官方给出的示例中，`CustomizedHeader` 的生成过程非常sao，对理解造成了很大干扰

我的理解就是，官方已经把默认生成的表头 VNode 列表返回给我们了，我们自行处理。需要实现表头分级，并保持对齐

假设 cells 长度为5，也就是原有5个表头单元格，想要将第3、4个上加上一级表头

```jsx
const CustomizedHeader = ({ cells, columns, headerIndex }) => {
  const groupCells = []
  for(let i = 0, len = columns.length; i < len; i++) {
    if(i === 2) {
      const width = cells[i].props.column.width + cells[i+1].props.column.width
      groupCells.push(<div
        style={{ width: `${width}px` }}
      >
        <div>Group</div>
        <div style="display:flex">{cells[i]}{cells[i+1]}</div>
      </div>)
      i++
    } else {
      groupCells.push(cells[i])
    }
  }
  return groupCells
}
```

上例返回的 VNode 数比原本少了一个，将第3、4个单元格放在一个自定义的 div 元素中去了。该元素的内容及样式均需要自行处理

#### 多选时，不点击确定

单选组件设置了监听事件，无需点击确定即可触发筛选事件
而多选使用的多选框组，存储选中筛选值的变量是直接绑定到组件上的，示例中通过点击确定按钮手动触发筛选事件，不点击会导致的UI与实际筛选不符的问题

想到两种解决方案，一是使用多选框组提供的 `change` 事件，代价是可能会筛选过于频繁。另一种是创建一个变量存储前一次筛选状态，每次执行筛选前与当前筛选状态进行对比，相同则不执行筛选

方案一：更新 `headerCellRenderer`
`<el-checkbox-group v-model={ filterableCols[col.dataKey].selected }>`
↓↓↓↓↓
`<el-checkbox-group v-model={ filterableCols[col.dataKey].selected } onChange={ onFilter }>`

方案二：

```javascript
const prevFilters = ref([])
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

const onFilter = () => {
  // const allFilters = ...
  if(compareFilters(allFilters)) return
  prevFilters.value = allFilters.map(([dataKey,configs]) => ({
    dataKey,
    selected: configs.selected,
    singleSelect: configs.singleSelect
  }))
  // ...
};
```

# 五、排序、筛选同时使用

按前两节示例，排序、筛选当然可以同时实现，但需要处理数据上冲突

## 问题分析

两部分的示例中，都使用了 originData 记录表格原始数据：

如果不保存源数据，在排序中，不光无法置空排序、回归原顺序，不同排序项的历史排序影响也会持续下去，其实是难以预料的多重排序结果。筛选操作也变成了基于上一次筛选结果的筛选

```javascript
const tableData = ref([])
const originData = ref([])

// handle sort
tableData.value = originData.value.slice(0).sort(sortMethod)
// handle filter
tableData.value = originData.value.filter(filterMethod)
```

两者都是基于源表格数据进行排序、筛选。两个功能同时存在时，就有冲突了，会彼此干扰此前的操作。

## 解决方案

### 方案一：创建中间变量

额外创建一个变量 `tempData`，用它记录筛选后的数据，tableData记录排序后的值
`originData` -> `tempData` -> `tableData`

- `originData` 更新时，`tempData`, `tableData` 重置为 `originData`
- 筛选时，基于源数据筛选（`originData` -> `tempData`），`tableData` 重置为 `tempData`
- 排序时，基于 `tempData` 排序（`tempData` -> `tableData`）

看起来有点绕，其实就两条依赖关系，添加两个相应的 `watch` 就可以了

```vue
<el-table-v2
  :data="tableData"
  ...
/>
```

```javascript
const tableData = ref([])  // 表格当前数据（排序、筛选后）
const tempData = ref([])   // 中间变量，对源数据的筛选
const originData = ref([]) // 表格源数据

// 源数据更新 -> 更新筛选项各自的可筛选列表, 执行筛选
watch(originData, (newVal) => {
  getFiltersFromResp()
  onFilter() // 执行筛选会更新 tempData
})
// 排序状态更新 | tempData 更新 -> 执行排序
watch(
  [sortState, tempData],
  ([newState, newData]) => {
    // handle sort ( originData --sort--> tableData )
    const { key, order } = newState ?? {}
    // 数据为空 | 当前无排序，重置 tableData
    if (!newData?.length || !key || !order) {
      tableData.value = newData
      return
    }
    // ...
    tableData.value = newData.slice(0).sort(sortMethod)
  },
  { immediate: true }
)

// handle filter
const onFilter = () => {
	// ...
	tempData.value = originData.value.filter(execFilter)
}
```

### 方案二：源数据中添加筛选标识

筛选事件处理方法中，标识数据是否通过筛选(例如：添加 hidden 属性)，与方案一相比，代码改动较小：

```javascript
const tableData = ref([])  // 表格当前数据（排序、筛选后）
// const tempData = ref([])   // 中间变量，对源数据的筛选
const originData = ref([]) // 表格源数据

// 源数据更新 -> 更新筛选项各自的可筛选列表, 执行筛选
watch(originData, (newVal) => {
  getFiltersFromResp()
  onFilter()
})
// 排序状态更新 | originData 更新(包括 hidden 更新) -> 执行排序
watch(
  [sortState, originData], // [sortState, tempData],
  ([newState, newData]) => {
    const { key, order } = newState ?? {}
    if (!newData?.length || !key || !order) {
      tableData.value = newData?.filter(p => !p.hidden) ?? [] // newData
      return
    }
    // ...
    // tableData.value = newData.slice(0).sort(sortMethod)
    tableData.value = newData.filter(p => !p.hidden).sort(sortMethod)
  },
  { immediate: true, deep: true } // { immediate: true }
)

const onFilter = () => {
	// ...
  // tempData.value = originData.value.filter(execFilter)
	originData.value.forEach(val => {
		val.hidden = !execFilter(val)
	})
}
```

无中间变量，originData 添加 hidden 属性

相比之下，少一条依赖，代码简单一点。排序和筛选其实还都是基于源数据，只是使用 hidden 属性过滤 TableV2 的绑定数据

此方法同样可以应用在上一节单独使用筛选功能时，可以做到只使用源数据。

**注意：**
上例中为了监听到源数据 hidden 的变化，进行了深层监听。如果具体业务中有其它逻辑需要频繁改动源数据其它属性，而又不需要更新排序、筛选。可以不使用 watch 监听，避免无意义的执行排序、筛选

## 其他

为了突出排序已生效，可以加上样式
`.el-table-v2__header-cell .el-table-v2__sort-icon.is-sorting {color:#387FE5}`

# 六、总结

TableV2 只加载可见区域以及前后预加载(可设置)的“行”，纵向滚动后全部重新加载一遍。只要数据拿到了，表格的加载速度很快，对表格的一些响应式操作反应也很快，如果表格数据量可能在几千行及以上，很有必要换掉 TableV1。

TableV2 的问题在于它目前是全部重新加载，哪怕是纵向滑动了一行。

## 遇到的坑

**当设置了动态高度行（`estimated-row-height`）时，可能会发生严重的卡顿现象！（与表格数据总数无关）**

调试发现，目前 TableV2 每滚动一次就重新加载一次表格内及预加载的行数，总单元格过多时，会让体验感在上面的场景下变得极差。

以本人实际生产环境中的一个表格为例，表格一行有17个的单元格，一页显示20条数据，预先多加载的行数是2，每一次需要渲染 17*24=408 个单元格。连续纵向滚动会触发多次表格内容加载，轻微卡顿，有待优化，感觉可以提供一个属性作为连续滚动的节流处理开关。另一方面就是全部重新加载这个策略。

上面说的是正常流程，不正常的是，当设置了动态高度且超出设定高度的行数不少时，一次滚动就会重复触发四五次，再加上连续滚动。假设一个只触发三次的连续滚动，408 \*4\*3=4896 个单元格渲染。如果你够年轻，手速够快，轻松破万。再加上，某些自定义渲染的单元格够“大”够“重”，那。。。

这个问题应该是个 bug，希望后续版本能修复
