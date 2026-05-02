import { PUFFERFISH_API } from '@/api/http'

const BASE = '/qualiteval/rule'

/** GET /qualiteval/rule/list.do */
export function list(params = {}) {
  const q = {}
  if (params.modelId != null && params.modelId !== '') q.modelId = params.modelId
  if (params.ruleName != null && String(params.ruleName).trim() !== '') q.ruleName = String(params.ruleName).trim()
  if (params.ruleType != null && String(params.ruleType).trim() !== '') q.ruleType = String(params.ruleType).trim()
  if (params.status !== '' && params.status != null) q.status = params.status
  if (params.pageNo != null) q.pageNo = params.pageNo
  if (params.pageSize != null) q.pageSize = params.pageSize
  return PUFFERFISH_API.get(`${BASE}/list.do`, q)
}

/** POST /qualiteval/rule/create.do — QualitevalRuleForm */
export function create(data) {
  return PUFFERFISH_API.post(`${BASE}/create.do`, data)
}

/** PUT /qualiteval/rule/update.do */
export function update(data) {
  return PUFFERFISH_API.put(`${BASE}/update.do`, data)
}

/** GET /qualiteval/rule/types.do — data: { types: string[] } */
export function types() {
  return PUFFERFISH_API.get(`${BASE}/types.do`)
}

/** 规则试运行（扩展接口） */
export function testRule(data) {
  return PUFFERFISH_API.post(`${BASE}/test.do`, data)
}

/** DELETE /qualiteval/rule/delete.do?id= */
export function remove(id) {
  return PUFFERFISH_API.delete(`${BASE}/delete.do`, { params: { id }})
}
