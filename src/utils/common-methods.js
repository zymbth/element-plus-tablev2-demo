// typeof link: https://juejin.cn/post/7000300249235357709#heading-3
export function myTypeof(data) {
  return data instanceof Element
    ? 'element'
    : Object.prototype.toString
        .call(data)
        .replace(/\[object\s(.+)\]/, '$1')
        .toLowerCase()
}

/**
 * 是否是数字（或字符串数字）
 * @param {*} val
 * @returns {boolean}
 */
export function myIsNumber(val) {
  if (isNaN(val) || val === true) return false
  if (!val && val !== 0) return false
  if (String(val).trim().length === 0) return false
  return true
}

// 判断两个数组是否包含相同元素集，不考虑元素顺序
export function isArrElementsEqual(arr1, arr2) {
  if (!(arr1 instanceof Array) || !(arr2 instanceof Array) || arr1.length !== arr2.length)
    return false
  return arr1.every(p1 => arr2.includes(p1))
}

/**
 * 去弹跳，会在一个延时后执行 fn 函数
 *
 * @param {Function} fn 实际要执行的函数
 * @param {Number} delay 延迟时间，也就是阈值，单位是毫秒（ms）
 * @param {Object} _this this
 * @returns {Function} 返回一个“去弹跳”了的函数
 */
export function debounce(fn, delay = 200, _this) {
  var timer

  return function () {
    // 保存函数调用时的上下文和参数，传递给 fn
    var context = _this
    var args = arguments

    // 每次这个返回的函数被调用，就清除定时器，以保证不执行 fn
    clearTimeout(timer)

    // 当返回的函数被最后一次调用后（也就是用户停止了某个连续的操作），
    // 再过 delay 毫秒就执行 fn
    timer = setTimeout(function () {
      context ? fn.apply(context, args) : fn(...args)
    }, delay)
  }
}

/**
 * 节流，指定时间间隔内，最多执行一次
 *
 * @param {Function} fn 实际要执行的函数
 * @param {Number} threshhold 执行间隔，单位是毫秒（ms）
 * @param {Object} _this this
 * @returns
 */
export function throttle(fn, threshhold = 250, _this) {
  let last // 记录上次执行的时间
  let timer

  // 返回的函数，每过 threshhold 毫秒就执行一次 fn 函数
  return function () {
    // 保存函数调用时的上下文和参数，传递给 fn
    let context = _this
    let args = arguments
    let now = +new Date()

    // 如果距离上次执行 fn 函数的时间小于 threshhold，那么就放弃
    // 执行 fn，并重新计时
    if (last && now < last + threshhold) {
      clearTimeout(timer)

      // 保证在当前时间区间结束后，再执行一次 fn
      timer = setTimeout(function () {
        last = now
        context ? fn.apply(context, args) : fn(...args)
      }, threshhold)
    } else {
      last = now
      context ? fn.apply(context, args) : fn(...args)
    }
  }
}

/**
 * 手动延时
 *
 * @param {number} t 延时
 * @returns
 */
export function manualDelay(t = 1500) {
  return new Promise(resolve => {
    setTimeout(resolve, t, 'Manual Delay')
  })
}
