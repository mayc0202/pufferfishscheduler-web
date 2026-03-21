import { PUFFERFISH_API } from '@/api/http'

/**
 * 获取字段流
 * @param {*} data 数据
 * @returns 字段流
 */
export function getFieldStream(data) {
  return PUFFERFISH_API.post(`/plugin/tableOutput/getFieldStream.do`, data)
}
