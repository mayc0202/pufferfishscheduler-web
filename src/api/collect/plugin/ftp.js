import { PUFFERFISH_API } from '@/api/http'

/**
 * 获取本地目录列表
 * @param {string} path 目录路径
 * @returns {Promise}
 */
export function getLocalDirectory(path) {
  return PUFFERFISH_API.get('/plugin/ftp/getLocalDirectory.do', { path })
}
