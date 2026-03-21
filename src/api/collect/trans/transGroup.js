import { PUFFERFISH_API } from '@/api/http'

/**
 * 获取数据源树形结构
 * @returns
 */
export function tree(name) {
  return PUFFERFISH_API.get('/trans/group/tree.do?name=' + String(name))
}

/**
 * groupTree
 * 主要用于清洗任务管理左侧分组树
 *
 * @param {string} name 分组名称（接口参数）
 */
export function groupTree(name) {
  const safeName = name == null ? '' : String(name)
  return PUFFERFISH_API.get(
    '/trans/group/groupTree.do?name=' + encodeURIComponent(safeName)
  )
}

/**
 * add
 * @param {*} group
 * @returns
 */
export function addGroup(group) {
  return PUFFERFISH_API.post('/trans/group/add.do', group)
}

/**
 * update
 * @param {*} group
 * @returns
 */
export function updateGroup(group) {
  return PUFFERFISH_API.put('/trans/group/update.do', group)
}

/**
 * delete
 * @param {*} id
 * @returns
 */
export function deleteGroup(id) {
  return PUFFERFISH_API.put('/trans/group/delete.do?id=' + id)
}
