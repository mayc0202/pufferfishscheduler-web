/**
 * 组件树可能直接给数组，或包一层 { list: [] }
 */
export function unwrapDictList(raw) {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object' && Array.isArray(raw.list)) return raw.list
  return []
}

/**
 * 组件树字典项转为 { label, value }（通用：优先 value，兼容 code/key）
 */
export function normalizeDictList(raw) {
  const arr = Array.isArray(raw) ? raw : unwrapDictList(raw)
  if (!Array.isArray(arr)) return []
  return arr
    .map((x) => {
      if (x == null) return null
      if (typeof x === 'string' || typeof x === 'number') {
        return { label: String(x), value: x }
      }
      const label = x.label != null ? String(x.label) : (x.name != null ? String(x.name) : '')
      const value = x.value != null ? x.value : (x.code != null ? x.code : x.key)
      if (value === undefined || value === null) return null
      return { label: label || String(value), value }
    })
    .filter(Boolean)
}

/**
 * data_type 类字典：list 项为 { code, value, order? }，后端持久化用 code（如 "2"），value 为类型展示名（如 "String"）。
 * 与 normalizeDictList 不同：此处以 code 作为下拉绑定值，避免把 "String" 传给期望数字的接口。
 */
export function normalizeFieldTypeDictList(raw) {
  const arr = Array.isArray(raw) ? raw : unwrapDictList(raw)
  if (!Array.isArray(arr)) return []
  const rows = arr
    .map((x, idx) => {
      if (x == null) return null
      if (typeof x === 'string' || typeof x === 'number') {
        return { order: idx, opt: { label: String(x), value: x }}
      }
      const codeStr =
        x.code !== undefined && x.code !== null && String(x.code).trim() !== ''
          ? String(x.code).trim()
          : ''
      const valueName =
        x.value !== undefined && x.value !== null ? String(x.value).trim() : ''
      const label =
        valueName ||
        (x.label != null ? String(x.label) : '') ||
        (x.name != null ? String(x.name) : '') ||
        codeStr
      if (codeStr !== '') {
        const order = x.order != null ? Number(x.order) : NaN
        return { order: Number.isFinite(order) ? order : idx, opt: { label: label || codeStr, value: codeStr }}
      }
      const value = x.value != null ? x.value : x.key
      if (value === undefined || value === null) return null
      return { order: idx, opt: { label: label || String(value), value }}
    })
    .filter(Boolean)
  rows.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return 0
  })
  return rows.map((r) => r.opt)
}
