import { UPMS_API } from '@/api/http'

/**
 * login
 * @param {*} username
 * @param {*} password
 * @returns
 */
export function login(username, password) {
  return UPMS_API.post(
    '/user/login.do',
    {
      'username': username,
      'password': password
    })
}

/**
 * getUserInfos
 * @returns
 */
export function getUserInfo() {
  return UPMS_API.get('/user/getUserInfo.do')
}

/**
 * logout
 * @param {*} userId
 * @returns
 */
export function logout() {
  return UPMS_API.post('/user/logout.do')
}
