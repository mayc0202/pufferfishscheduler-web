import { asyncRoutes, constantRoutes } from '@/router'
import router from '@/router'
import Router from 'vue-router' // 新增导入
import store from '@/store'
import NProgress from 'nprogress' // progress bar
// import { Message } from 'element-ui'
import { getToken } from '@/utils/auth' // get token from cookie

const whiteList = ['/login']

let isGenerating = false // 添加全局状态锁

router.beforeEach(async(to, from, next) => {
  if (to.path === from.path) return next()

  // 白名单直接放行（需恢复 whiteList 检查）
  if (whiteList.includes(to.path)) return next()

  const hasToken = getToken()
  if (!hasToken) return next(`/login?redirect=${to.path}`)

  const hasRoles = store.getters.roles?.length > 0
  if (hasRoles) return next()

  // 防止并发请求
  if (isGenerating) return
  isGenerating = true

  try {
    NProgress.start()
    const { roles } = await store.dispatch('user/getUserInfo')
    const accessRoutes = await store.dispatch('permission/generateRoutes', roles)

    // 精确重置路由
    resetRouter()
    router.addRoutes(accessRoutes)

    // 确保路由生效
    next({ ...to, replace: true })
  } catch (error) {
    await store.dispatch('user/resetToken')
    next(`/login?redirect=${to.path}`)
  } finally {
    // eslint-disable-next-line require-atomic-updates
    isGenerating = false
    NProgress.done()
  }

  // NProgress.start()
  // const hasToken = getToken()

  // if (hasToken) {
  //   if (to.path === '/login') {
  //     next({ path: '/' })
  //     NProgress.done()
  //   } else {
  //     const hasRoles = store.getters.roles && store.getters.roles.length > 0
  //     if (hasRoles) {
  //       next()
  //     } else {
  //       try {
  //         // 1. 获取用户信息（含角色）
  //         const { roles } = await store.dispatch('user/getInfo')
  //         // 2. 生成动态路由
  //         const accessRoutes = await store.dispatch('permission/generateRoutes', roles)
  //         // 3. 动态添加路由
  //         router.addRoutes(accessRoutes)
  //         // 4. 确保路由注入完成
  //         next({ ...to, replace: true })
  //       } catch (error) {
  //         await store.dispatch('user/resetToken')
  //         Message.error(error?.message || '权限获取失败')
  //         next(`/login?redirect=${to.path}`)
  //         NProgress.done()
  //       }
  //     }
  //   }
  // } else {
  //   // 未登录时放行白名单
  //   whiteList.includes(to.path) ? next() : next(`/login?redirect=${to.path}`)
  //   NProgress.done()
  // }
})

router.afterEach(() => {
  NProgress.done()
})

/**
 * Use meta.role to determine if the current user has permission
 * @param roles
 * @param route
 */
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    return true
  }
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param roles
 */
export function filterAsyncRoutes(routes, roles) {
  const res = []

  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })

  return res
}

const state = {
  routes: [],
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

// 新增重置路由的函数
const resetRouter = () => {
  // 彻底清除所有动态路由（Vue Router 3 兼容方案）
  const newRouter = new Router({
    mode: router.mode, // 通过 mode 获取当前路由模式
    routes: constantRoutes
  })

  // 替换路由匹配器
  router.matcher = newRouter.matcher

  // 清理历史记录（通用方法）
  if (router.history && router.history.transition) {
    router.history.transitionTo(
      router.history.getCurrentLocation(),
      () => {
        router.app.$nextTick(() => {
          router.history.cleanup()
        })
      }
    )
  }
}

const actions = {
  generateRoutes({ commit }, roles) {
    return new Promise(resolve => {
      let accessedRoutes
      if (roles.includes('admin')) {
        accessedRoutes = asyncRoutes || []
      } else {
        accessedRoutes = filterAsyncRoutes(asyncRoutes, roles)
      }

      // 重置路由（清除旧动态路由）
      resetRouter()

      // 添加新动态路由
      router.addRoutes(accessedRoutes)
      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
