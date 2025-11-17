import { PUFFERFISH_API } from '@/api/http'

/**
 * 获取认证信息
 * @returns
 */
export function getAuth() {
  return PUFFERFISH_API.get('/auth/getAuth.do')
}

/**
 * 登录
 * @param {*} username
 * @param {*} password
 * @returns
 */
export function login(username, password) {
  return PUFFERFISH_API.post(
    '/auth/login.do',
    {
      'username': username,
      'password': password
    })
}

/**
 * 获取用户信息
 * @returns
 */
export function getUserInfo() {
  return PUFFERFISH_API.get('/auth/getUserInfo.do')
}

/**
 * 注销
 * @param {*} userId
 * @returns
 */
export function logout() {
  return PUFFERFISH_API.post('/auth/logout.do')
}
