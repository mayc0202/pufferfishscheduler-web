import { PUFFERFISH_API } from '@/api/http'

/**
 * list
 * @returns
 */
export function tree(name) {
  return PUFFERFISH_API.get('/dbGroup/tree.do?name=' + String(name))
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
