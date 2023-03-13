/**
 * 是否是数字（或字符串数字）
 * @param {*} val 
 * @returns {boolean}
 */
export function mIsNumber(val) {
  if(isNaN(val) || val === true) return false
  if(!val && val !== 0) return false
  if(String(val).trim().length === 0) return false
  return true
}