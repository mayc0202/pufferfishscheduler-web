import { PUFFERFISH_API } from '@/api/http'

export function list(groupId, formulaName, pageNo, pageSize) {
  const params = new URLSearchParams()
  if (groupId !== null && groupId !== undefined && String(groupId) !== '') {
    params.append('groupId', groupId)
  }
  if (formulaName != null && String(formulaName) !== '') {
    params.append('formulaName', String(formulaName))
  }
  params.append('pageNo', pageNo == null ? 1 : pageNo)
  params.append('pageSize', pageSize == null ? 10 : pageSize)
  return PUFFERFISH_API.get('/microscopic/list.do?' + params.toString())
}

export function detail(formulaId) {
  return PUFFERFISH_API.get('/microscopic/detail.do?formulaId=' + encodeURIComponent(String(formulaId)))
}

export function addFormula(form) {
  return PUFFERFISH_API.post('/microscopic/add.do', form)
}

export function updateFormula(form) {
  return PUFFERFISH_API.put('/microscopic/update.do', form)
}

export function deleteFormula(formulaId) {
  return PUFFERFISH_API.put('/microscopic/delete.do?formulaId=' + encodeURIComponent(String(formulaId)))
}

/** 启用/禁用公式（与清洗规则 release 一致） */
export function releaseFormula(formulaId, status) {
  return PUFFERFISH_API.put(
    '/microscopic/release.do?formulaId=' +
      encodeURIComponent(String(formulaId)) +
      '&status=' +
      status
  )
}

export function validateFormula(form) {
  return PUFFERFISH_API.post('/microscopic/validate.do', form, { bizErrorAsMessage: true })
}

export function testFormula(json) {
  return PUFFERFISH_API.post('/microscopic/test.do', json, { bizErrorAsMessage: true })
}

/** 内置公式模板（分组：算术/比较/逻辑/字符串/日期等，每项含 name、syntax、example） */
export function getBuiltinTemplates() {
  return PUFFERFISH_API.get('/microscopic/builtin.do')
}

/** 运算符面板：panelTitle + groups[{ code, name, operators[] }] */
export function getOperatorPanel() {
  return PUFFERFISH_API.get('/microscopic/operatorPanel.do')
}

