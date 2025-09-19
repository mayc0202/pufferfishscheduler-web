import { DATABASE_API } from '@/api/http'

/**
 * 获取数据源
 * @param {*} data
 * @returns
 */
export function getDbList(data) {
  return DATABASE_API.get('/dbDatabase/list.do?groupId=' + data.groupId + '&dbId=' + data.dbId + '&name=' + data.name + '&pageNo=' + data.pageNo + '&pageSize=' + data.pageSize)
}

/**
 * 添加数据源
 * @param {*} group
 * @returns
 */
export function saveDb(database) {
  return DATABASE_API.post('/dbDatabase/save.do', database)
}

/**
 * 修改数据源
 * @param {*} group
 * @returns
 */
export function updateDb(database) {
  return DATABASE_API.put('/dbDatabase/update.do', database)
}

/**
 * 删除数据源
 * @param {*} id
 * @returns
 */
export function deleteDb(id) {
  return DATABASE_API.put('/dbDatabase/delete.do?id=' + id)
}

/**
 * 数据源详情
 * @param {*} id
 * @returns
 */
export function detailDb(id) {
  return DATABASE_API.get('/dbDatabase/detail.do?id=' + id)
}

/**
 * 测试连接
 * @param {*} database
 * @returns
 */
export function connect(database) {
  return DATABASE_API.post('/dbDatabase/connect.do', database)
}
