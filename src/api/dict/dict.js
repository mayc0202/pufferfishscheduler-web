import { PUFFERFISH_API } from '@/api/http'

/**
 * getDict
 * @returns
 */
export function getDict(dictCode) {
  return PUFFERFISH_API.get('/dict/getDict.do?dictCode=' + String(dictCode))
}

