/** 质检规则类型：与后端约定 code 一致，展示中文标签 */
export const RULE_TYPE_GROUPS = [
  {
    label: '内置规则',
    options: [
      { label: '空值检测', value: 'NULL_CHECK' },
      { label: '长度校验', value: 'LENGTH_CHECK' },
      { label: '日期格式', value: 'DATE_FORMAT' },
      { label: '唯一性校验', value: 'UNIQUENESS' },
      { label: '正则表达式', value: 'REGEX' },
      { label: '枚举校验', value: 'ENUM_CHECK' }
    ]
  },
  {
    label: '高级规则',
    options: [
      { label: 'Java 自定义', value: 'JAVA' },
      { label: 'MVEL 表达式', value: 'MVEL' },
      { label: 'SQL 关联查询', value: 'SQL' }
    ]
  }
]

export const RULE_TYPE_LABEL_MAP = {}
RULE_TYPE_GROUPS.forEach((g) => {
  g.options.forEach((o) => {
    RULE_TYPE_LABEL_MAP[o.value] = o.label
  })
})
/** 与 QualitevalRuleType 枚举一致（types.do） */
RULE_TYPE_LABEL_MAP.BUILTIN = RULE_TYPE_LABEL_MAP.BUILTIN || '内置规则'

export const BUILTIN_TYPES = new Set([
  'NULL_CHECK',
  'LENGTH_CHECK',
  'DATE_FORMAT',
  'UNIQUENESS',
  'REGEX',
  'ENUM_CHECK',
  'BUILTIN'
])

export function isBuiltinRuleType(ruleType) {
  const v = String(ruleType || '').toUpperCase()
  return BUILTIN_TYPES.has(v)
}
