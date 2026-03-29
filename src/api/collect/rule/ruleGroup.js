import { PUFFERFISH_API } from '@/api/http'

/** 规则分类树 */
export function tree(name) {
  const q = name != null && String(name) !== '' ? '?name=' + encodeURIComponent(String(name)) : ''
  return PUFFERFISH_API.get('/rule/group/tree.do' + q)
}

/** 新增规则分类 */
export function addGroup(form) {
  return PUFFERFISH_API.post('/rule/group/add.do', form)
}

/** 编辑规则分类 */
export function updateGroup(form) {
  return PUFFERFISH_API.put('/rule/group/update.do', form)
}

/** 删除规则分类 */
export function deleteGroup(id) {
  return PUFFERFISH_API.put('/rule/group/delete.do?id=' + encodeURIComponent(String(id)))
}

/** 固定分类（通用）ID */
export function regularGroupId() {
  return PUFFERFISH_API.get('/rule/group/regularGroupId.do')
}
