import { PUFFERFISH_API } from '@/api/http'
import { PUFFERFISH_SERVICE } from '@/api/request'

const BASE = '/qualiteval/report'

/** GET /qualiteval/report/summary.do */
export function summary(params = {}) {
  return PUFFERFISH_API.get(`${BASE}/summary.do`, params)
}

/**
 * GET /qualiteval/report/issues.do
 * 分页参数：后端使用 limit 时，由 pageSize 映射为 limit；也可显式传 limit
 */
export function issues(params = {}) {
  const q = {}
  if (params.modelId != null && params.modelId !== '') q.modelId = params.modelId
  if (params.resultId != null && params.resultId !== '') q.resultId = params.resultId
  if (params.ruleId != null && params.ruleId !== '') q.ruleId = params.ruleId
  if (params.status) q.status = params.status
  if (params.pageNo != null) q.pageNo = params.pageNo
  const lim = params.limit != null ? params.limit : params.pageSize
  if (lim != null) q.limit = lim
  return PUFFERFISH_API.get(`${BASE}/issues.do`, q)
}

/** POST /qualiteval/report/export.do — 直接文件流 */
export function exportReport(data) {
  return PUFFERFISH_SERVICE({
    method: 'post',
    url: `${BASE}/export.do`,
    data,
    responseType: 'blob',
    timeout: 120000
  })
}
