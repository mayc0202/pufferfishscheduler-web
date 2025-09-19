import { DATABASE_API } from '@/api/http'

/**
 * Retrieve the collection of database types
 * @returns
 */
export function getDbCategoryList() {
  return DATABASE_API.get('/dbBasic/getDbCategoryList.do')
}

/**
 * query database basic list
 * @returns
 */
export function getDbBasicList() {
  return DATABASE_API.get('/dbBasic/getDbBasicList.do')
}

/**
 * query database basic list by category id
 * @param {*} id
 * @returns
 */
export function getDbBasicListByCategoryId(id) {
  return DATABASE_API.get('/dbBasic/getDbBasicListByCategoryId.do?id=' + id)
}
