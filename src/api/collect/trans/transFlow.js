import { PUFFERFISH_API } from '@/api/http'

/**
 * 获取流程列表
 * @param {*} flowName 流程名称
 * @param {*} groupId 分组ID
 * @param {*} pageNo 页码
 * @param {*} pageSize 每页数量
 * @returns
 */
export function list(flowName, groupId, pageNo, pageSize) {
  const params = new URLSearchParams()
  if (flowName) params.append('flowName', flowName)
  if (groupId !== null && groupId !== undefined) params.append('groupId', groupId)
  if (pageNo) params.append('pageNo', pageNo)
  if (pageSize) params.append('pageSize', pageSize)
  const url = `/trans/flow/list.do?${params.toString()}`
  return PUFFERFISH_API.get(url)
}

/**
 * 添加流程
 * @param {*} flow 流程数据
 * @returns
 */
export function addFlow(flow) {
  return PUFFERFISH_API.post('/trans/flow/add.do', flow)
}

/**
 * 更新流程
 * @param {*} flow 流程数据
 * @returns
 */
export function updateFlow(flow) {
  return PUFFERFISH_API.put('/trans/flow/update.do', flow)
}

/**
 * 删除流程
 * @param {*} id 流程ID
 * @returns
 */
export function deleteFlow(id) {
  return PUFFERFISH_API.put('/trans/flow/delete.do?id=' + id)
}

/**
 * 设置流程配置
 * @param {*} data 配置数据
 * @returns
 */
export function setConfig(data) {
  return PUFFERFISH_API.post('/trans/flow/setConfig.do', data)
}

/**
 * 获取流程详情
 * @param {*} id 流程ID
 * @returns
 */
export function getFlowDetail(id) {
  return PUFFERFISH_API.get(`/trans/flow/detail.do?id=${id}`)
}

/**
 * 执行流程
 * @param {*} id 流程ID
 * @returns
 */
export function executeFlow(id) {
  return PUFFERFISH_API.get(`/trans/flow/execute.do?id=${id}`)
}

/**
 * 停止流程
 * @param {*} id 流程ID
 * @returns
 */
export function stopFlow(id) {
  // 直接使用 _request 方法设置 60 秒超时
  return PUFFERFISH_API._request({
    method: 'get',
    timeout: 60000, // 60秒超时
    url: `/trans/flow/stop.do?id=${id}`
  })
}

/**
 * 预览数据
 * @param {*} data 数据
 * @returns
 */
export function previewData(data) {
  return PUFFERFISH_API.post(`/trans/flow/preview.do`, data)
}

/**
 * 获取转换日志
 * @param {*} id 流程ID
 * @returns
 */
export function getProcessLog(id) {
  return PUFFERFISH_API.get(`/trans/flow/getProcessLog.do?id=${id}`)
}

/**
 * 检查转换状态
 * @param {*} id 流程ID
 * @returns
 */
export function checkTransStatus(id) {
  return PUFFERFISH_API.get(`/trans/flow/checkTransStatus.do?id=${id}`)
}

/**
 * 复制流程
 * @param {*} id 流程ID
 * @returns
 */
export function copyFlow(id) {
  return PUFFERFISH_API.post(`/trans/flow/copy.do?id=${id}`)
}

/**
 * 展示转换图片
 * @param {*} id 流程ID
 * @returns
 */
export function showTransImg(id) {
  return PUFFERFISH_API.get(`/trans/flow/showTransImg.do?id=${id}`)
}

/**
 * 获取字段流
 * @param {*} id 流程ID
 * @returns
 */
export function getFieldStream(flowIdOrForm, config) {
  // 兼容两种调用方式：
  // 1) getFieldStream({flowId, config, stepName, code, dbId, tableId})  [推荐]
  // 2) getFieldStream(flowId, config)  [历史写法，会补齐 stepName 默认值以避免必填报错]
  if (flowIdOrForm && typeof flowIdOrForm === 'object') {
    return getFieldStreamByForm(flowIdOrForm)
  }

  return PUFFERFISH_API.post(
    '/trans/flow/getFieldStream.do',
    {
      flowId: flowIdOrForm,
      // config 必填，兜底给空对象字符串而不是空字符串
      config: config == null ? '{}' : config,
      // stepName 为必填，这里用默认值避免必填校验失败
      stepName: '转换步骤',
      code: ''
    },
    { bizErrorAsMessage: true }
  )
}

/**
 * 获取字段流（推荐）
 * 后端：FieldStreamForm
 * flowId: Integer (NotNull)
 * config: String (NotBlank)
 * stepName: String (NotBlank)
 */
export function getFieldStreamByForm(form) {
  const body = {
    flowId: form?.flowId,
    config: form?.config,
    stepName: form?.stepName,
    code: form?.code,
    dbId: form?.dbId,
    tableId: form?.tableId
  }
  return PUFFERFISH_API.post('/trans/flow/getFieldStream.do', body, { bizErrorAsMessage: true })
}

/**
 * 查询转换流程树形结构（分组+流程）
 *
 * 对接：GET /trans/flow/tree.do
 *
 * @returns {Promise<{ data: Array }>}
 */
export function tree() {
  return PUFFERFISH_API.get('/trans/flow/tree.do')
}
