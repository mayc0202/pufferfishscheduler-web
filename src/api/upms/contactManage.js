import { PUFFERFISH_API } from '@/api/http'

/**
 * 用户中心-联系人（UserContactController，/user/contact）
 * 分页结构：{ current, size, total, records }
 */

/**
 * 联系人下拉选项（id + name，用于多选等）
 * 后端：GET /user/contact/options.do
 */
export function options() {
  return PUFFERFISH_API.get('/user/contact/options.do')
}

/**
 * 分页查询（姓名模糊）
 */
export function list(params = {}) {
  const q = {}
  if (params && params.name != null && params.name !== '') q.name = String(params.name)
  if (params && params.pageNo != null && params.pageNo !== '') q.pageNo = params.pageNo
  if (params && params.pageSize != null && params.pageSize !== '') q.pageSize = params.pageSize

  const search = new URLSearchParams(q).toString()
  const url = '/user/contact/list.do' + (search ? `?${search}` : '')
  return PUFFERFISH_API.get(url)
}

/**
 * 联系人详情（编辑前拉取，与 UserContactController#detail 对齐）
 */
export function detail(id) {
  return PUFFERFISH_API.get('/user/contact/detail.do?id=' + Number(id))
}

/**
 * 新增用户联系人
 * form.alertMethods: string[] 预警方式编码多选，如 ['0','1']（与后端 UserContactForm 一致）
 */
export function add(form) {
  return PUFFERFISH_API.post('/user/contact/add.do', form)
}

/**
 * 编辑用户联系人（需带 id）
 */
export function update(form) {
  return PUFFERFISH_API.put('/user/contact/update.do', form)
}

/**
 * 删除联系人（后端为 @PutMapping("/delete.do")，与 transtask 等一致）
 */
export function remove(id) {
  return PUFFERFISH_API.put('/user/contact/delete.do?id=' + Number(id))
}
