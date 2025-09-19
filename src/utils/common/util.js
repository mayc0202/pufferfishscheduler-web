/**
* 判断是否为空
* @param value
* @returns
*/
export function isEmpty(value) {
  switch (typeof value) { // typeof检测参数类型（Number，String，Boolean）都返回object，不能检测null
    case 'string':
      if (value.replace(/(^[ \t\n\r]*)|([ \t\n\r]*$)/g, '').length === 0) return true // 去除多余符号与占位符后长度为0的
      break
    case 'number':
      if (isNaN(value)) return true // isNaN()判断是否是数值
      break
    case 'boolean':
      if (!value) return true
      break
    case 'undefined':
      return true // 未定义
    case 'object':
      if (value === null) return true // 对象是空或者长度为0
      for (var i in value) {
        return false
      }
      return true
    default:
      break
  }
  return false
}

/**
 * 连接两个路径部分，确保最终路径以 '/' 开头，并正确处理中间的斜杠
 * @param {string} firstPart - 第一个路径部分
 * @param {string} secondPart - 第二个路径部分
 * @returns {string} - 连接后的路径（始终以 '/' 开头）
 */
export function joinPathParts(firstPart, secondPart) {
  // 处理非字符串输入
  const first = typeof firstPart === 'string' ? firstPart : String(firstPart)
  const second = typeof secondPart === 'string' ? secondPart : String(secondPart)

  // 确保第一个部分不以 '/' 开头（避免双斜杠）
  const normalizedFirst = first.startsWith('/') ? first.slice(1) : first
  // 确保第二个部分不以 '/' 开头（避免双斜杠）
  const normalizedSecond = second.startsWith('/') ? second.slice(1) : second

  // 拼接并确保以 '/' 开头
  return '/' + [normalizedFirst, normalizedSecond].filter(Boolean).join('/')
}

/**
 * 身份证验证
 * @param IDNo
 * @returns
 */
export function judgeID(IDNo) {
  if (!(/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(IDNo))) return false
  else return true
}

/**
 * 手机号验证
 * @param phone
 * @returns
 */
export function judgePhone(phone) {
  if (/^((13[0-9])|(14[0-9])|(15[0-9])|(17[0-9])|(18[0-9]))\d{8}$/.test(phone)) return true
  else return false
}

/**
 * 邮箱验证
 * @param email
 * @returns
 */
export function judgeEmail(email) {
  if (/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(email)) return true
  else return false
}

/**
 * 以字母开头，只包含字母、数字、@
 * @param {*} username
 * @returns
 */
export function judgeUserName(username) {
  if (/^[A-Za-z0-9@]*$/.test(username) && username.length >= 5 && username.length <= 12) return true
  else return false
}

/**
 * 只包含字母、数字、下划线
 * @param {*} password
 * @returns
 */
export function judgePassword(password) {
  if (/^[A-Za-z0-9@]+$/.test(password) && password.length > 5 && password.length < 12) return true
  else return false
}
