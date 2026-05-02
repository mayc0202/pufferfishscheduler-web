import { PUFFERFISH_API } from '@/api/http'

const BASE = '/agent/knowledgeBase'

/**
 * 分页查询知识（title 模糊、categoryId）
 */
export function listKnowledge(params = {}) {
  const q = new URLSearchParams()
  if (params.title != null && String(params.title).trim() !== '') {
    q.set('title', String(params.title).trim())
  }
  if (params.categoryId != null && params.categoryId !== '') {
    q.set('categoryId', String(params.categoryId))
  }
  q.set('pageNo', String(params.pageNo != null ? params.pageNo : 1))
  q.set('pageSize', String(params.pageSize != null ? params.pageSize : 10))
  const qs = q.toString()
  return PUFFERFISH_API.get(`${BASE}/list.do${qs ? `?${qs}` : ''}`)
}

/**
 * 知识详情（含附件）
 * @param {string} id 知识主键
 */
export function getKnowledgeDetail(id) {
  const q = encodeURIComponent(id == null ? '' : String(id))
  return PUFFERFISH_API.get(`${BASE}/detail.do?id=${q}`)
}

/**
 * 新增知识（application/json）
 * form 常见字段：title、categoryId、tags、enabled、qaPairs（{ question, answer }[]）
 */
export function addKnowledge(form) {
  return PUFFERFISH_API.post(`${BASE}/add.do`, form)
}

/**
 * 更新知识（application/json）；可传 files: [] 清空附件
 */
export function updateKnowledgeJson(form) {
  return PUFFERFISH_API.put(`${BASE}/update.do`, form)
}

/**
 * 更新知识（multipart：part form=JSON，part files=附件）
 */
export function updateKnowledgeMultipart(formData, config = {}) {
  return PUFFERFISH_API.putUpload(`${BASE}/update.do`, formData, config)
}

/**
 * 删除知识（后端 @RequestBody String id，按 JSON 字符串提交）
 */
export function deleteKnowledge(id) {
  return PUFFERFISH_API.post(`${BASE}/delete.do`, JSON.stringify(id == null ? '' : String(id)))
}
