import { PUFFERFISH_API } from '@/api/http'

export function list(flowName, groupId, pageNo, pageSize) {
  const params = new URLSearchParams()
  if (flowName) params.append('flowName', flowName)
  if (groupId !== null && groupId !== undefined) params.append('groupId', groupId)
  if (pageNo) params.append('pageNo', pageNo)
  if (pageSize) params.append('pageSize', pageSize)
  const url = `/trans/flow/list.do?${params.toString()}`
  return PUFFERFISH_API.get(url)
}

export function addFlow(flow) {
  return PUFFERFISH_API.post('/trans/flow/add.do', flow)
}

export function updateFlow(flow) {
  return PUFFERFISH_API.put('/trans/flow/update.do', flow)
}

export function deleteFlow(id) {
  return PUFFERFISH_API.put('/trans/flow/delete.do?id=' + id)
}

export function setConfig(data) {
  return PUFFERFISH_API.post('/trans/flow/setConfig.do', data)
}

export function getFlowDetail(id) {
  return PUFFERFISH_API.get(`/trans/flow/detail.do?id=${id}`)
}

export function executeFlow(id) {
  return PUFFERFISH_API.get(`/trans/flow/execute.do?id=${id}`)
}

export function previewData(id, stepName) {
  return PUFFERFISH_API.get(`/trans/flow/preview.do?id=${id}&stepName=${encodeURIComponent(stepName)}`)
}
