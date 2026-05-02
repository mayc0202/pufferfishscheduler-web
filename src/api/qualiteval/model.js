import { PUFFERFISH_API } from '@/api/http'
import { PUFFERFISH_SERVICE } from '@/api/request'

const BASE = '/qualiteval/model'

/**
 * 质检模型分页列表（GET /qualiteval/model/list.do）
 * @param {{ name?: string, status?: string, themeId?: string|number, pageNo?: number, pageSize?: number }} params
 */
export function list(params = {}) {
  const q = {}
  if (params.name) q.name = params.name
  if (params.status !== '' && params.status != null) q.status = params.status
  if (params.themeId != null && params.themeId !== '') q.themeId = params.themeId
  if (params.pageNo != null) q.pageNo = params.pageNo
  if (params.pageSize != null) q.pageSize = params.pageSize
  return PUFFERFISH_API.get(`${BASE}/list.do`, q)
}

/** POST /qualiteval/model/create.do — QualitevalModelForm */
export function create(data) {
  return PUFFERFISH_API.post(`${BASE}/create.do`, data)
}

/** PUT /qualiteval/model/update.do */
export function update(data) {
  return PUFFERFISH_API.put(`${BASE}/update.do`, data)
}

/** DELETE /qualiteval/model/delete.do?id= */
export function remove(id) {
  return PUFFERFISH_API.delete(`${BASE}/delete.do`, { params: { id }})
}

/** 模型详情（扩展接口，与主 CRUD 契约分离） */
export function detail(id) {
  return PUFFERFISH_API.get(`${BASE}/detail.do`, { id })
}

/** 主题分类树（扩展接口） */
export function themeTree() {
  return PUFFERFISH_API.get(`${BASE}/theme/tree.do`)
}

/** 导出所有观测（Blob，扩展接口） */
export function exportObservations(params = {}) {
  return PUFFERFISH_SERVICE({
    method: 'get',
    url: `${BASE}/exportObservations.do`,
    params,
    responseType: 'blob',
    timeout: 120000
  })
}

/** 复制模型（扩展接口） */
export function copyModel(id) {
  return PUFFERFISH_API.post(`${BASE}/copy.do`, { id })
}

/** 清除模型下所有问题（扩展接口） */
export function clearIssues(id) {
  return PUFFERFISH_API.post(`${BASE}/clearIssues.do`, { id })
}
