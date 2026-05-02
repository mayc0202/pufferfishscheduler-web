import { PUFFERFISH_API } from '@/api/http'

export function tree(name) {
  const q = name != null && String(name) !== '' ? '?name=' + encodeURIComponent(String(name)) : ''
  return PUFFERFISH_API.get('/microscopic/group/tree.do' + q)
}

export function addGroup(form) {
  return PUFFERFISH_API.post('/microscopic/group/add.do', form)
}

export function updateGroup(form) {
  return PUFFERFISH_API.put('/microscopic/group/update.do', form)
}

export function deleteGroup(id) {
  return PUFFERFISH_API.put('/microscopic/group/delete.do?id=' + encodeURIComponent(String(id)))
}
