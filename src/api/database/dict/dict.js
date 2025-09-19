import { DATABASE_API } from '@/api/http'

/**
 * getDict
 * @returns
 */
export function getDict(dictCode) {
  return DATABASE_API.get('/dict/getDict.do?dictCode=' + String(dictCode))
}

