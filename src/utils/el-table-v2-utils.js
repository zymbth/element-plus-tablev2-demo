import { mIsNumber } from "@/utils/common-methods"

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

/**
 * 数值排序方法（针对对象指定属性进行数值对比）
 * 
 * @param {Object} a 对象a
 * @param {Object} b 对象b
 * @param {string} prop 对象属性, e.g, 'no'
 * @returns {number}
 * @example
 * import { sortByNum } from '@/use/el-table-v2-utils'
 * 
 * const arr = [] // Array of Object
 * const target = arr.slice(0).sort((a,b) => sortByNum(a,b,'no))
 */
export function sortByNum(a, b, prop) {
  try {
    const a1 = mIsNumber(a[prop]) ? Number(a[prop]) : -1
    const b1 = mIsNumber(b[prop]) ? Number(b[prop]) : -1
    return a1 - b1
  } catch (err) {
    return 0
  }
}

export function sortByStr(a, b, prop) {
  try {
    const a1 = a[prop] + ''
    const b1 = b[prop] + ''
    return a1.localeCompare(b1, "zh-CN")
  } catch(err) {
    return 0
  }
}