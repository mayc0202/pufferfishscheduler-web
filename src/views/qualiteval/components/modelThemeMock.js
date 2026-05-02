/**
 * 主题分类树占位数据（后端 /qualiteval/model/theme/tree.do 就绪后自动替换）
 * @returns {Array<{ id: number|string, name: string, children?: Array }>}
 */
export function defaultThemeTree() {
  return [
    { id: 't1', name: 'UAT部署测试主题', children: [] },
    { id: 't2', name: 'HRMS贴源库-徐凯翔', children: [] },
    { id: 't3', name: '热力数据-原始', children: [] },
    { id: 't4', name: 'CRM数据', children: [] },
    { id: 't5', name: 'AI-轮胎-贴源', children: [] }
  ]
}
