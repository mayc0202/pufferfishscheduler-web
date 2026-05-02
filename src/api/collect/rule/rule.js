import { PUFFERFISH_API } from '@/api/http'
import { PUFFERFISH_SERVICE } from '@/api/request'

export function list(groupId, ruleName, pageNo, pageSize) {
  const params = new URLSearchParams()
  if (groupId !== null && groupId !== undefined && String(groupId) !== '') {
    params.append('groupId', groupId)
  }
  if (ruleName != null && String(ruleName) !== '') {
    params.append('ruleName', String(ruleName))
  }
  params.append('pageNo', pageNo == null ? 1 : pageNo)
  params.append('pageSize', pageSize == null ? 10 : pageSize)
  return PUFFERFISH_API.get('/rule/list.do?' + params.toString())
}

export function detail(id) {
  return PUFFERFISH_API.get('/rule/detail.do?id=' + encodeURIComponent(String(id)))
}

export function addRule(form) {
  return PUFFERFISH_API.post('/rule/add.do', form)
}

export function updateRule(form) {
  return PUFFERFISH_API.put('/rule/update.do', form)
}

export function deleteRule(id) {
  return PUFFERFISH_API.put('/rule/delete.do?id=' + encodeURIComponent(String(id)))
}

/** 启用/禁用规则，与后端 PUT /rule/release.do?id=&enabled= 一致 */
export function releaseRule(id, enabled) {
  return PUFFERFISH_API.put(
    '/rule/release.do?id=' + encodeURIComponent(String(id)) + '&enabled=' + enabled
  )
}

export function tree() {
  return PUFFERFISH_API.get('/rule/tree.do')
}

/** 值映射 Excel 模板下载（POST + 文件流） */
export function downloadValueMappingTemplate() {
  return PUFFERFISH_SERVICE({
    method: 'post',
    url: '/rule/downloadTemplate.do',
    data: {},
    responseType: 'blob',
    timeout: 120000
  })
}

/** 值映射模板导入（multipart，字段名 file） */
export function importValueMappingTemplate(formData) {
  return PUFFERFISH_API.uploadFile('/rule/importTemplate.do', formData, {
    bizErrorAsMessage: true
  })
}

export function validateJavaCode(json) {
  return PUFFERFISH_API.post('/rule/validateJavaCode.do', json, {
    bizErrorAsMessage: true
  })
}

export function previewJavaCode(json) {
  return PUFFERFISH_API.post('/rule/previewJavaCode.do', json, {
    bizErrorAsMessage: true
  })
}

export function validateSql(json) {
  return PUFFERFISH_API.post('/rule/validateSql.do', json, {
    bizErrorAsMessage: true
  })
}

export function previewRuleData(json) {
  return PUFFERFISH_API.post('/rule/preview.do', json, { bizErrorAsMessage: true })
}
