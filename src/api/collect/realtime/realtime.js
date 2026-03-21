import { PUFFERFISH_API } from '@/api/http'

/**
 * 查询实时归集任务列表（分页）
 * @param {Object} params
 * @param {string} [params.taskName] - 任务名称
 * @param {number} [params.sourceDbId] - 来源库ID
 * @param {number} [params.targetDbId] - 目标库ID
 * @param {string} [params.taskStatus] - 任务状态
 * @param {number} [params.pageNo] - 当前页
 * @param {number} [params.pageSize] - 每页条数
 * @returns {Promise<{ data: { records: Array, total: number, size: number, current: number, pages: number } }>}
 */
export function list(params) {
  const q = {}
  if (params.taskName != null && params.taskName !== '') q.taskName = String(params.taskName)
  if (params.sourceDbId != null && params.sourceDbId !== '') q.sourceDbId = params.sourceDbId
  if (params.targetDbId != null && params.targetDbId !== '') q.targetDbId = params.targetDbId
  if (params.taskStatus != null && params.taskStatus !== '') q.taskStatus = params.taskStatus
  if (params.pageNo != null && params.pageNo !== '') q.pageNo = params.pageNo
  if (params.pageSize != null && params.pageSize !== '') q.pageSize = params.pageSize
  const search = new URLSearchParams(q).toString()
  const url = '/realtime/task/list.do' + (search ? '?' + search : '')
  return PUFFERFISH_API.get(url)
}

/**
 * 查询实时数据同步任务详情（含表映射、字段映射）
 * @param {number} taskId 任务ID
 * @returns {Promise<{ data: { taskId, taskName, sourceDbId, targetDbId, engineType, tableMappers, ... } }>}
 */
export function detail(taskId) {
  const url = '/realtime/task/detail.do?taskId=' + Number(taskId)
  return PUFFERFISH_API.get(url)
}

/**
 * 添加实时归集任务
 * @param {Object} task 实时归集任务数据，与后端 RealTimeTaskForm 对应
 * @param {string} task.taskName - 任务名称
 * @param {number} task.sourceDbId - 源数据库ID
 * @param {number} task.targetDbId - 目标数据库ID
 * @param {string} task.engineType - 同步引擎 0-Kafka 1-Flink
 * @param {string} task.syncType - 同步类型 0-全量+增量 1-增量
 * @param {number} task.sourceTableId - 来源表ID（首组或主表）
 * @param {number} task.targetTableId - 目标表ID（首组或主表）
 * @param {string} task.writeType - 写入方式 INSERT / UPSERT
 * @param {number} task.batchSize - 批量提交记录数
 * @param {boolean} task.deleteFlag - 是否删除重复号（任务启动前清空目标表）
 * @param {boolean} task.parallelWriteFlag - 是否开启并发写入
 * @param {number} task.parallelThreadNum - 并发写入线程数
 * @param {Array} task.tableMappers - 表映射列表，每项含 deleteFlag/parallelWriteFlag/parallelThreadNum/writeType/batchSize/fieldMappers
 * @returns {Promise}
 */
export function add(task) {
  return PUFFERFISH_API.post('/realtime/task/add.do', task)
}

/**
 * 更新实时数据同步任务（仅未启动/已停止/失败/异常状态可修改）
 * @param {Object} taskForm 与 add 相同结构，且含 taskId
 * @returns {Promise}
 */
export function update(taskForm) {
  return PUFFERFISH_API.post('/realtime/task/update.do', taskForm)
}

/**
 * 删除实时数据同步任务（逻辑删除，仅未启动/已停止/失败/异常状态可删）
 * @param {number} taskId 任务ID
 * @returns {Promise}
 */
export function deleteTask(taskId) {
  const url = '/realtime/task/delete.do?taskId=' + Number(taskId)
  return PUFFERFISH_API.post(url)
}

/**
 * 启动实时数据同步任务（仅未启动/已停止/失败/异常状态可启动）
 * @param {number} taskId 任务ID
 * @returns {Promise}
 */
export function start(taskId) {
  const url = '/realtime/task/start.do?taskId=' + Number(taskId)
  return PUFFERFISH_API.post(url)
}

/**
 * 停止实时数据同步任务（仅运行中状态可停止）
 * @param {number} taskId 任务ID
 * @returns {Promise}
 */
export function stop(taskId) {
  const url = '/realtime/task/stop.do?taskId=' + Number(taskId)
  return PUFFERFISH_API.post(url)
}
