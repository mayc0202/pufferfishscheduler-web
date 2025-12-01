import { PUFFERFISH_API } from '@/api/http'

/**
 * 获取数据源树形结构
 * @returns
 */
export function tree(name) {
  return PUFFERFISH_API.get('/dbGroup/tree.do?name=' + String(name))
}

/**
 * 获取FTP数据源树形结构
 * @returns
 */
export function ftpDbTree(name) {
  return PUFFERFISH_API.get('/dbGroup/ftpDbTree.do?name=' + String(name))
}

/**
 * 获取关系型数据源树形结构
 * @returns
 */
export function relationalDbTree() {
  return PUFFERFISH_API.get('/dbGroup/relationalDbTree.do')
}

/**
 * add
 * @param {*} group
 * @returns
 */
export function addGroup(group) {
  return PUFFERFISH_API.post('/dbGroup/add.do', group)
}

/**
 * update
 * @param {*} group
 * @returns
 */
export function updateGroup(group) {
  return PUFFERFISH_API.put('/dbGroup/update.do', group)
}

/**
 * delete
 * @param {*} id
 * @returns
 */
export function deleteGroup(id) {
  return PUFFERFISH_API.put('/dbGroup/delete.do?id=' + id)
}
