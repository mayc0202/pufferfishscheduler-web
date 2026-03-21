import { PUFFERFISH_API } from '@/api/http'

/**
 * 获取树形结构
 * @returns
 */
export function tree(name) {
  return PUFFERFISH_API.get('/metadata/tree.do?name=' + String(name))
}

/**
 * 获取同步任务列表
 * @param {*} data
 * @returns
 */
export function list(data) {
  return PUFFERFISH_API.get('/metadata/list.do?groupId=' + data.groupId + '&dbId=' + data.dbId + '&dbName=' + data.dbName +
    '&status=' + data.status + '&enable=' + data.enable + '&pageNo=' + data.pageNo + '&pageSize=' + data.pageSize)
}

/**
 * 添加同步任务
 * @param {*} group
 * @returns
 */
export function add(data) {
  return PUFFERFISH_API.post('/metadata/add.do', data)
}

/**
 * 编辑同步任务
 * @param {*} group
 * @returns
 */
export function update(data) {
  return PUFFERFISH_API.post('/metadata/update.do', data)
}

/**
 * 详情
 * @param {*} id
 * @returns
 */
export function detail(id) {
  return PUFFERFISH_API.get('/metadata/detail.do?id=' + id)
}

/**
 * 删除
 * @param {*} id
 * @returns
 */
export function deleted(id) {
  return PUFFERFISH_API.get('/metadata/delete.do?id=' + id)
}

/**
 * 切换启用状态
 * @param {*} id
 * @returns
 */
export function toggleEnableStatus(id) {
  return PUFFERFISH_API.get('/metadata/toggleEnableStatus.do?id=' + id)
}

/**
 * 立即同步数据（后端接口：immediatelySync.do，使用 @RequestParam dbId）
 * 注意：本项目的 POST 默认以 application/json 发送 body。
 * 为了兼容 @RequestParam，这里把 dbId 放在 URL 查询参数里。
 * @param {number|string} dbId
 * @returns
 */
export function immediatelySync(dbId) {
  return PUFFERFISH_API.post(`/metadata/immediatelySync.do?dbId=${encodeURIComponent(String(dbId))}`, null)
}
