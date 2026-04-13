import { PUFFERFISH_API } from '@/api/http'

/**
 * Redis 插件：获取 Redis 数据源树形结构
 * 对应后端：GET /plugin/redis/redisDbTree.do
 */
export function redisDbTree() {
  return PUFFERFISH_API.get('/plugin/redis/redisDbTree.do')
}
