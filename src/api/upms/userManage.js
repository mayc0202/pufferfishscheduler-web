import { PUFFERFISH_API } from '@/api/http'

/**
 * 用户管理分页列表
 * 支持 account/name 模糊查询
 */
export function list(params = {}) {
  const q = {}
  if (params && params.account != null && params.account !== '') q.account = String(params.account)
  if (params && params.name != null && params.name !== '') q.name = String(params.name)
  if (params && params.pageNo != null && params.pageNo !== '') q.pageNo = params.pageNo
  if (params && params.pageSize != null && params.pageSize !== '') q.pageSize = params.pageSize

  const search = new URLSearchParams(q).toString()
  const url = '/user/manage/list.do' + (search ? `?${search}` : '')
  return PUFFERFISH_API.get(url)
}

/**
 * 获取用户详情（含 roleIds、roleNames）
 */
export function detail(id) {
  return PUFFERFISH_API.get('/user/manage/detail.do?id=' + Number(id))
}

/**
 * 获取可分配角色列表（admin、editor）
 * 仅支持角色：admin / editor
 */
export function roles() {
  return PUFFERFISH_API.get('/user/manage/rolesOptions.do')
}

/**
 * 新增用户
 */
export function add(form) {
  return PUFFERFISH_API.post('/user/manage/add.do', form)
}

/**
 * 编辑用户
 */
export function update(form) {
  return PUFFERFISH_API.put('/user/manage/update.do', form)
}

/**
 * 注销用户（逻辑删除）
 */
export function deactivate(id) {
  return PUFFERFISH_API.put('/user/manage/deactivate.do?id=' + Number(id))
}

