import store from '@/store'
import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import router from '@/router'

// 全局默认超时时间（10秒）
const DEFAULT_TIMEOUT = 10000

// 统一错误状态码
const SYSTEM_ERROR = '999999'

// HTTP状态码错误映射
const httpErrorMap = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求资源未找到',
  405: '请求方法不允许',
  408: '请求超时',
  500: '服务器内部错误',
  501: '服务未实现',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时',
  505: 'HTTP版本不受支持'
}

// 避免会话过期弹窗重复弹出
let isSessionDialogVisible = false

// 处理会话过期（统一入口）
function handleSessionExpired() {
  if (isSessionDialogVisible) return
  isSessionDialogVisible = true

  MessageBox.confirm('当前会话已过期，请重新登录！', '系统提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      return store.dispatch('user/resetToken').then(() => {
        router.push('/login')
      })
    })
    .finally(() => {
      // 无论用户点击确定/取消，关闭弹窗后允许后续再次弹出
      isSessionDialogVisible = false
    })
}

// 处理网络异常
function handleNetworkError(error) {
  const timeout = error.config && error.config.timeout || DEFAULT_TIMEOUT
  Message.error(`请求超时（${timeout / 1000}秒），请检查网络或稍后重试`)
}

// 处理未授权（复用会话过期逻辑，避免出现两种弹窗）
function handleUnauthorized() {
  handleSessionExpired()
}

// 创建统一的拦截器配置函数
const setupInterceptors = (instance) => {
  // 请求拦截器（保持不变）
  instance.interceptors.request.use(config => {
    // 区分文件上传和普通请求
    if (config.upload) {
      config.headers['Content-Type'] = 'multipart/form-data'
    } else {
      config.headers['Content-Type'] = 'application/json;charset=UTF-8'
      if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
        config.data = JSON.stringify(config.data)
      }
    }

    // 统一携带 token：后端需要 Pufferfish-Token
    // 兼容写入 X-Token，避免项目中历史接口出现不一致
    const token = store.getters.token
    if (token) {
      config.headers['Pufferfish-Token'] = token
      config.headers['X-Token'] = token
    }
    return config
  }, error => {
    return Promise.reject(error)
  })

  // 响应拦截器（核心修改：添加Blob判断）
  instance.interceptors.response.use(
    response => {
      // 关键：如果是文件下载请求（responseType为blob），直接返回完整response对象
      if (response.request.responseType === 'blob') {
        return response // 不做任何处理，返回完整响应（包含headers、data(Blob)）
      }

      // 普通请求的原有逻辑（保持不变）
      const res = response.data
      if (res.code !== undefined && String(res.code) === SYSTEM_ERROR) {
        const errorMsg = res.message || '系统错误，请联系管理员'
        Message.warning(errorMsg)
        if (res.message && res.message.includes('令牌')) {
          handleSessionExpired()
        }
        return res
      }

      const resCode = Number(res.code)
      if ([50008, 50012, 50014].includes(resCode)) {
        handleSessionExpired()
        return res
      }

      return res
    },
    error => {
      // 错误处理逻辑（保持不变）
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        handleNetworkError(error)
      } else if (!error.response) {
        Message.error('网络异常，请检查网络连接！')
      } else {
        const status = error.response.status
        const message = httpErrorMap[status] || `请求错误（${status}）`
        if (status === 401) {
          handleUnauthorized()
        } else {
          Message.error(message)
        }
      }
      return Promise.reject(error)
    }
  )

  return instance
}

// 创建默认的axios实例
const service = axios.create({
  timeout: DEFAULT_TIMEOUT
})

// 为默认实例设置拦截器
setupInterceptors(service)

// 创建服务特定的实例
export const createService = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: DEFAULT_TIMEOUT
  })

  // 应用相同的拦截器逻辑
  return setupInterceptors(instance)
}

// 导出各服务的实例
export const PUFFERFISH_SERVICE = createService(process.env.VUE_APP_PUFFERFISH_SCHEDULER)

// 导出默认实例和其他服务实例
export default {
  // 默认实例
  service,
  // 各服务实例
  PUFFERFISH_SERVICE,
  // 创建实例的方法
  createService
}
