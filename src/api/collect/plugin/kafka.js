import { PUFFERFISH_API } from '@/api/http'

/**
 * Kafka 插件：获取 MQ 数据源树
 * 对应后端：GET /plugin/kafka/mqDbTree.do
 */
export function mqDbTree() {
  return PUFFERFISH_API.get('/plugin/kafka/mqDbTree.do')
}

/**
 * Kafka 插件：获取 topic 列表
 * 对应后端：GET /plugin/kafka/topics.do?id={dbId}
 * @param {number|string} id Kafka 数据源 ID
 */
export function topics(id) {
  return PUFFERFISH_API.get('/plugin/kafka/topics.do', { id })
}

