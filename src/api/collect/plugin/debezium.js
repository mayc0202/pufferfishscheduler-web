import { PUFFERFISH_API } from '@/api/http'

/**
 * 解析 Debezium 样例 JSON 报文
 * @param {{sample: string}} data
 * @returns {Promise}
 */
export function parseSampleData(data) {
  return PUFFERFISH_API.post('/plugin/debezium/parseSampleData.do', data)
}
