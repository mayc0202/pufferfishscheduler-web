import { PUFFERFISH_API } from '@/api/http'

/**
 * 转换任务分页查询
 *
 * @param {Object} params
 * @param {number} [params.groupId] 分组ID
 * @param {string} [params.name] 任务名称（controller 参数名为 name）
 * @param {string} [params.status] 任务状态（字典 code）
 * @param {boolean} [params.enable] 启用状态（controller 参数类型为 Boolean）
 * @param {number} [params.pageNo] 当前页
 * @param {number} [params.pageSize] 每页条数
 */
export function list(params) {
  const q = {}
  if (params && params.groupId != null && params.groupId !== '') q.groupId = params.groupId
  if (params && params.name != null && params.name !== '') q.name = String(params.name)
  if (params && params.status != null && params.status !== '') q.status = String(params.status)
  if (params && params.enable != null && params.enable !== '') q.enable = params.enable
  if (params && params.pageNo != null && params.pageNo !== '') q.pageNo = params.pageNo
  if (params && params.pageSize != null && params.pageSize !== '') q.pageSize = params.pageSize

  const search = new URLSearchParams(q).toString()
  const url = '/trans/task/list.do' + (search ? '?' + search : '')
  return PUFFERFISH_API.get(url)
}

/**
 * 查询转换任务详情
 * @param {number|string} id
 */
export function detail(id) {
  return PUFFERFISH_API.get('/trans/task/detail.do?id=' + Number(id))
}

/**
 * 新增转换任务
 * @param {Object} form TransTaskForm
 */
export function add(form) {
  return PUFFERFISH_API.post('/trans/task/add.do', form)
}

/**
 * 编辑转换任务（TransTaskController：@PutMapping("/update.do")）
 * @param {Object} form TransTaskForm（需包含 id）
 */
export function update(form) {
  return PUFFERFISH_API.put('/trans/task/update.do', form)
}

/**
 * 删除转换任务（TransTaskController：@PutMapping("/delete.do")）
 * @param {number|string} id
 */
export function deleteTask(id) {
  return PUFFERFISH_API.put('/trans/task/delete.do?id=' + Number(id))
}

/**
 * 启用转换任务（TransTaskController：@PutMapping("/enable.do")，id 为 RequestParam）
 * @param {number|string} id
 */
export function enableTask(id) {
  return PUFFERFISH_API.put('/trans/task/enable.do?id=' + Number(id), null)
}

/**
 * 禁用转换任务（TransTaskController：@PutMapping("/disable.do")，id 为 RequestParam）
 * @param {number|string} id
 */
export function disableTask(id) {
  return PUFFERFISH_API.put('/trans/task/disable.do?id=' + Number(id), null)
}

/**
 * 立即执行转换任务
 * controller 使用 PostMapping("/immediatelyExecute.do")
 * @param {number|string} id
 */
export function immediatelyExecute(id) {
  return PUFFERFISH_API.post(
    '/trans/task/immediatelyExecute.do?id=' + Number(id),
    null
  )
}

/**
 * 立即停止转换任务
 * controller 使用 PostMapping("/immediatelyStop.do")
 * @param {number|string} id
 */
export function immediatelyStop(id) {
  return PUFFERFISH_API.post(
    '/trans/task/immediatelyStop.do?id=' + Number(id),
    null
  )
}

