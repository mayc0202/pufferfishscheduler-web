import { PUFFERFISH_API } from '@/api/http'

/**
 * 首页仪表盘汇总（任务卡片、状态分布、模块健康度、知识库概览）
 */
export function getDashboardSummary() {
  return PUFFERFISH_API.get('/dashboard/summary.do')
}
