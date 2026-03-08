import { PUFFERFISH_API } from '@/api/http'

export function tree(name) {
  return PUFFERFISH_API.get('/dbGroup/tree.do?name=' + String(name))
}

export function ftpDbTree(name) {
  return PUFFERFISH_API.get('/dbGroup/ftpDbTree.do?name=' + String(name))
}

export function relationalDbTree() {
  return PUFFERFISH_API.get('/dbGroup/relationalDbTree.do')
}

export function addGroup(group) {
  return PUFFERFISH_API.post('/dbGroup/add.do', group)
}

export function updateGroup(group) {
  return PUFFERFISH_API.put('/dbGroup/update.do', group)
}

export function deleteGroup(id) {
  return PUFFERFISH_API.put('/dbGroup/delete.do?id=' + id)
}
