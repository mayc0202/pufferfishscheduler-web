import { login, logout, getUserInfo, refreshToken } from '@/api/upms/auth'
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

  /**
   * 用户登录
   * @param {*} param
   * @param {*} userInfo
   * @returns
   */
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

        const token = loginResponse.data

        // Store token in Vuex and Cookie
        commit('SET_TOKEN', token)
        setToken(token)

        resolve()
      } catch (error) {
        console.log(error)
        // Reject with error message or error object
        reject(error.message || error)
      }
    })
  },

  /**
   * 获取用户信息
   * @param {*} param
   * @returns
   */
  getUserInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      // 添加缓存检查
      if (state.name && state.roles.length > 0) {
        return resolve({ name: state.name, roles: state.roles })
      }
      getUserInfo().then(response => {
        const data = response.data
        if (!data) {
          reject('验证失败，请重新登录!')
          return
        }

        // 确保角色是数组
        const roles = data.roles ? (Array.isArray(data.roles) ? data.roles : [data.roles]) : []

        // roles must be a non-empty array
        if (isEmpty(roles)) {
          reject('getUserInfo: roles must be a non-null array!')
          return
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

  /**
   * 注销用户
   * @param {*} param
   * @returns
   */
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

        // 强制跳转到登录页面
        router.push('/login')

        resolve(response.data)
      }).catch(error => {
      // 无论请求成功与否，都清理本地状态并跳转
        commit('SET_TOKEN', '')
        commit('SET_NAME', '')
        commit('SET_ROLES', [])
        removeToken()
        resetRouter()
        dispatch('tagsView/delAllViews', null, { root: true })

        // 强制跳转到登录页面
        router.push('/login')

        reject(error)
      })
    })
  },

  /**
   * 刷新token
   * @param {*} param
   * @returns
   */
  refreshToken({ commit, state }) {
    return new Promise((resolve, reject) => {
    // 调用刷新token的API
      refreshToken(state.token).then(response => {
        const newToken = response.data.token

        // 更新token
        commit('SET_TOKEN', newToken)
        setToken(newToken)

        resolve(newToken)
      }).catch(error => {
      // 刷新token失败，执行退出登录
        commit('SET_TOKEN', '')
        commit('SET_NAME', '')
        commit('SET_ROLES', [])
        removeToken()
        resetRouter()

        // 跳转到登录页面
        router.push('/login')

        reject(error)
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
