import { PUFFERFISH_API } from '@/api/http'
import { issues as reportIssues } from '@/api/qualiteval/report'

/** PUT /qualiteval/report/issue/fix.do?id= */
export function fix(id) {
  const qid = encodeURIComponent(String(id))
  return PUFFERFISH_API.put(`/qualiteval/report/issue/fix.do?id=${qid}`, {})
}

/**
 * 问题明细分页（与 report/issues.do 一致）
 */
export function list(params = {}) {
  return reportIssues(params)
}
