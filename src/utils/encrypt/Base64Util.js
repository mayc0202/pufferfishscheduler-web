/* eslint-disable no-undef */
// base64-utils.js
const Base64Utils = {
  /**
   * Base64编码
   */
  encode(str) {
    if (typeof str !== 'string') {
      throw new Error('参数必须是字符串类型')
    }
    return btoa(unescape(encodeURIComponent(str)))
  },

  /**
   * Base64解码
   */
  decode(str) {
    if (typeof str !== 'string') {
      throw new Error('参数必须是字符串类型')
    }
    try {
      return decodeURIComponent(escape(atob(str)))
    } catch (error) {
      throw new Error('Base64解码失败: ' + error.message)
    }
  },

  /**
   * 检查是否为有效的Base64
   */
  isValid(str) {
    if (typeof str !== 'string') return false

    // Base64正则表达式
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(str)) return false

    try {
      this.decode(str)
      return true
    } catch {
      return false
    }
  },

  /**
   * 编码对象为Base64 JSON字符串
   */
  encodeObject(obj) {
    const jsonString = JSON.stringify(obj)
    return this.encode(jsonString)
  },

  /**
   * 解码Base64 JSON字符串为对象
   */
  decodeObject(base64Str) {
    const jsonString = this.decode(base64Str)
    return JSON.parse(jsonString)
  }
}

// 导出方式（根据环境选择）
if (typeof module !== 'undefined' && module.exports) {
  // Node.js环境
  module.exports = Base64Utils
} else if (typeof define === 'function' && define.amd) {
  // AMD环境
  define(function() { return Base64Utils })
} else {
  // 浏览器全局变量
  window.Base64Utils = Base64Utils
}
