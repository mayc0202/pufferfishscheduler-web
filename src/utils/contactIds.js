/**
 * 联系人多选：与后端 contactIdList / 逗号分隔字符串互转，及下拉选项补全。
 */

/**
 * 将详情中的 contactIdList（或逗号串）规范为 el-select 多选的 value 数组（字符串）
 * @param {unknown} raw
 * @returns {string[]}
 */
export function parseContactIdListToValues(raw) {
  if (raw == null || raw === '') return []
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
  }
  return [String(raw).trim()].filter(Boolean)
}

/**
 * 多选 value 数组 → 传给后端的逗号分隔 id 串
 * @param {unknown[]} values
 * @returns {string}
 */
export function joinContactIds(values) {
  if (!values || !values.length) return ''
  return values.map((v) => String(v).trim()).filter(Boolean).join(',')
}

/**
 * 解析 options.do 响应为 { id, name }[]
 * @param {unknown} data axios 业务体（常见为数组，或包在 data 里）
 * @returns {{ id: string|number, name: string }[]}
 */
export function normalizeContactOptionsFromApi(data) {
  let list = []
  if (Array.isArray(data)) {
    list = data
  } else if (data && typeof data === 'object') {
    list = data.records || data.list || data.items
    if (!Array.isArray(list) && Array.isArray(data.data)) {
      list = data.data
    }
    if (!Array.isArray(list)) list = []
  }
  if (!Array.isArray(list)) return []
  return list
    .map((item) => {
      const id = item && (item.id != null ? item.id : item.value)
      const name = item && (item.name != null ? item.name : item.label)
      if (id == null || id === '') return null
      return { id, name: name != null ? String(name) : String(id) }
    })
    .filter(Boolean)
}

/**
 * 为已选但不在选项里的 id 补一条展示项（避免下拉只显示 id）
 * @param {{ id: string|number, name: string }[]} options
 * @param {string[]} selectedIds
 */
export function augmentContactOptions(options, selectedIds) {
  const opts = (options || []).map((o) => ({ ...o }))
  const byId = new Map(opts.map((o) => [String(o.id), o]))
  ;(selectedIds || []).forEach((sid) => {
    const s = String(sid).trim()
    if (!s || byId.has(s)) return
    const row = { id: sid, name: `联系人(${s})` }
    opts.push(row)
    byId.set(s, row)
  })
  return opts
}
