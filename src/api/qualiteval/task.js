import { PUFFERFISH_API } from '@/api/http'

const BASE = '/qualiteval/task'

/** GET /qualiteval/task/list.do */
export function list(params = {}) {
  const q = {}
  if (params.modelId != null && params.modelId !== '') q.modelId = params.modelId
  if (params.taskName != null && String(params.taskName).trim() !== '') q.taskName = String(params.taskName).trim()
  if (params.status !== '' && params.status != null) q.status = params.status
  if (params.pageNo != null) q.pageNo = params.pageNo
  if (params.pageSize != null) q.pageSize = params.pageSize
  return PUFFERFISH_API.get(`${BASE}/list.do`, q)
}

/** POST /qualiteval/task/create.do — QualitevalTaskForm */
export function create(data) {
  return PUFFERFISH_API.post(`${BASE}/create.do`, data)
}

/** PUT /qualiteval/task/update.do */
export function update(data) {
  return PUFFERFISH_API.put(`${BASE}/update.do`, data)
}

/** POST /qualiteval/task/execute.do?id= */
export function execute(id) {
  return PUFFERFISH_API.post(`${BASE}/execute.do`, {}, { params: { id }})
}

/** DELETE /qualiteval/task/delete.do?id= */
export function remove(id) {
  return PUFFERFISH_API.delete(`${BASE}/delete.do`, { params: { id }})
}

/** 启停扩展接口（若无后端实现可改用 update 提交 enable） */
export function setStatus(id, status) {
  return PUFFERFISH_API.post(`${BASE}/setStatus.do`, { id, status })
}
