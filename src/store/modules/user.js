import { login, logout, getUserInfo } from '@/api/upms/auth'
import { encrypt } from '@/utils/encrypt/RsaUtil'
import { getToken, setToken, removeToken } from '@/utils/auth'
import router, { resetRouter } from '@/router'
import { isEmpty } from '@/utils/validate'

const state = {
  token: getToken(),
  name: '',
  avatar: '',
  introduction: '',
  roles: []
}

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_INTRODUCTION: (state, introduction) => {
    state.introduction = introduction
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  },
  GET_TOKEN: (state) => {
    return state.token
  }
}

const actions = {

  // user login
  login({ commit }, userInfo) {
    const { username, password } = userInfo
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async(resolve, reject) => {
      try {
        const encryptedPassword = await encrypt(password)

        if (!encryptedPassword) {
          throw new Error('密码加密失败!')
        }

        // Encrypt password and login
        const loginResponse = await login(
          username,
          encryptedPassword
        )

        const token = loginResponse.data.data

        // Store token in Vuex and Cookie
        commit('SET_TOKEN', token)
        setToken(token)

        resolve()
      } catch (error) {
      // Reject with error message or error object
        reject(error.message || error)
      }
    })
  },

  // get user info
  getUserInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      // 添加缓存检查
      if (state.name && state.roles.length > 0) {
        return resolve({ name: state.name, roles: state.roles })
      }
      getUserInfo().then(response => {
        const data = response.data.data
        if (!data) {
          reject('验证失败，请重新登录!')
        }

        // 确保角色是数组
        const roles = data.roles ? (Array.isArray(data.roles) ? data.roles : [data.roles]) : []

        // roles must be a non-empty array
        if (isEmpty(roles)) {
          reject('getUserInfo: roles must be a non-null array!')
        }

        commit('SET_ROLES', roles)
        commit('SET_NAME', data.name)
        commit('SET_AVATAR', data.avatar)
        // commit('SET_INTRODUCTION', introduction)
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user logout
  logout({ commit, state, dispatch }) {
    return new Promise((resolve, reject) => {
      logout().then((response) => {
        // 清理本地状态
        commit('SET_TOKEN', '')
        commit('SET_NAME', '')
        commit('SET_ROLES', [])
        removeToken()
        resetRouter()
        dispatch('tagsView/delAllViews', null, { root: true })

        resolve(response.data) // 返回业务数据
      }).catch(error => {
        // 获取服务器返回的具体业务错误信息
        const serverError = error.response?.data

        // 无论如何都要清理本地状态
        commit('SET_TOKEN', '')
        commit('SET_NAME', '')
        commit('SET_ROLES', [])
        removeToken()
        resetRouter()
        dispatch('tagsView/delAllViews', null, { root: true })

        if (serverError) {
        // 返回具体的业务错误信息
          reject(serverError)
        } else {
        // 返回网络错误信息
          reject({
            code: 'NETWORK_ERROR',
            message: error.message || '网络请求失败',
            data: null,
            status: 'ERROR'
          })
        }
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      commit('SET_NAME', '')
      removeToken()
      resolve()
    })
  },

  // dynamically modify permissions
  async changeRoles({ commit, dispatch }, role) {
    const token = role + '-token'

    commit('SET_TOKEN', token)
    setToken(token)

    const { roles } = await dispatch('getUserInfo')

    resetRouter()

    // generate accessible routes map based on roles
    const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true })
    // dynamically add accessible routes
    router.addRoutes(accessRoutes)

    // reset visited views and cached views
    dispatch('tagsView/delAllViews', null, { root: true })
  }
}

export default {
  namespaced: true, // 确保启用命名空间
  state,
  mutations,
  actions
}
