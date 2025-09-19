import { DATABASE_API } from '@/api/http'

/**
 * list
 * @returns
 */
export function tree(name) {
  return DATABASE_API.get('/dbGroup/tree.do?name=' + String(name))
}

/**
 * add
 * @param {*} group
 * @returns
 */
export function addGroup(group) {
  return DATABASE_API.post('/dbGroup/add.do', group)
}

/**
 * update
 * @param {*} group
 * @returns
 */
export function updateGroup(group) {
  return DATABASE_API.put('/dbGroup/update.do', group)
}

/**
 * delete
 * @param {*} id
 * @returns
 */
export function deleteGroup(id) {
  return DATABASE_API.put('/dbGroup/delete.do?id=' + id)
}
