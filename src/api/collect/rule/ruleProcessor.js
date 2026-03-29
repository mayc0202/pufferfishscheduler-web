import { PUFFERFISH_API } from '@/api/http'

/** 规则处理器列表 */
export function list() {
  return PUFFERFISH_API.get('/rule/processor/list.do')
}

/** 规则处理器字典（下拉） */
export function dict() {
  return PUFFERFISH_API.get('/rule/processor/dict.do')
}

/** 规则处理器详情（含 paramsConfig） */
export function detail(id) {
  return PUFFERFISH_API.get('/rule/processor/detail.do?id=' + encodeURIComponent(String(id)))
}
