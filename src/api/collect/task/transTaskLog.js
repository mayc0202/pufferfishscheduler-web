import { PUFFERFISH_API } from '@/api/http'

/**
 * 分页查询转换任务日志
 * 后端：GET /trans/task/log/list.do
 */
export function list(params) {
  const q = {}
  if (params && params.taskName != null && params.taskName !== '') q.taskName = String(params.taskName)
  if (params && params.startTime != null && params.startTime !== '') q.startTime = params.startTime
  if (params && params.endTime != null && params.endTime !== '') q.endTime = params.endTime
  if (params && params.status != null && params.status !== '') q.status = String(params.status)
  if (params && params.pageNo != null && params.pageNo !== '') q.pageNo = params.pageNo
  if (params && params.pageSize != null && params.pageSize !== '') q.pageSize = params.pageSize

  const search = new URLSearchParams(q).toString()
  const url = '/trans/task/log/list.do' + (search ? '?' + search : '')
  return PUFFERFISH_API.get(url)
}

/**
 * 查询转换任务日志详情
 * 后端：GET /trans/task/log/detail.do?id=...
 */
export function detail(id) {
  const logId = id != null ? String(id) : ''
  return PUFFERFISH_API.get('/trans/task/log/detail.do?id=' + encodeURIComponent(logId))
}

