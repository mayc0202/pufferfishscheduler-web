import { PUFFERFISH_API } from '@/api/http'

/**
 * 获取转换组件树结构
 * @returns
 */
export function getTransComponentTree() {
  return PUFFERFISH_API.get('/trans/component/tree.do')
}
