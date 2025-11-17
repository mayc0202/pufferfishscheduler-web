
import store from '@/store'
import axios from 'axios'
import { Message, MessageBox } from 'element-ui'

// 全局默认超时时间（10秒）
const DEFAULT_TIMEOUT = 10000

// 统一错误状态码
const SYSTEM_ERROR = '999999'

// 创建axios实例
const service = axios.create({
  timeout: DEFAULT_TIMEOUT
})

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

// 请求拦截器
service.interceptors.request.use(config => {
  // 区分文件上传和普通请求
  if (config.upload) {
    // 文件上传请求保留 FormData 格式
    config.headers['Content-Type'] = 'multipart/form-data'
  } else {
    // 普通请求使用 JSON 格式
    config.headers['Content-Type'] = 'application/json;charset=UTF-8'

    // 只有当数据存在且是对象时进行序列化
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.data = JSON.stringify(config.data)
    }
  }

  return config
}, error => {
  return Promise.reject(error)
})

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    // 精准拦截 "999999" 系统错误
    if (res.code !== undefined && String(res.code) === SYSTEM_ERROR) {
      const errorMsg = res.message || '系统错误（999999），请联系管理员'
      Message.error(errorMsg)

      // 特殊处理令牌过期
      if (res.message && res.message.includes('令牌')) {
        handleSessionExpired()
      }

      // 仍然返回数据，让业务方法也能处理
      return res
    }

    // 处理会话过期等其他业务错误
    const resCode = Number(res.code)
    if ([50008, 50012, 50014].includes(resCode)) {
      handleSessionExpired()
      return res // 仍然返回数据
    }

    return res
  },
  error => {
    // 网络错误处理保持不变
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

// 处理会话过期
function handleSessionExpired() {
  MessageBox.confirm('Login status has expired, please log in again!', 'system prompt', {
    confirmButtonText: 'Log in again',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }).then(() => {
    store.dispatch('asyncResetToken').then(() => {
      location.reload()
    })
  })
}

// 处理网络异常
function handleNetworkError(error) {
  const timeout = error.config?.timeout || DEFAULT_TIMEOUT
  Message.error(`请求超时（${timeout / 1000}秒），请检查网络或稍后重试`)
}

// 处理未授权
function handleUnauthorized() {
  MessageBox.confirm('The current session has expired, please log in again!', 'prompt', {
    confirmButtonText: 'Log in again',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }).then(() => {
    store.dispatch('asyncResetToken').then(() => {
      location.reload()
    })
  })
}

// 新增：创建服务特定的实例
export const createService = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: DEFAULT_TIMEOUT
  })

  // 应用相同的拦截器逻辑
  instance.interceptors.request.use(
    ...service.interceptors.request.handlers
  )
  instance.interceptors.response.use(
    ...service.interceptors.response.handlers
  )

  return instance
}

// 导出各服务的实例
export const PUFFERFISH_SERVICE = createService(process.env.VUE_APP_PUFFERFISH_SCHEDULER)

// 文件底部添加
export default {
  PUFFERFISH_SERVICE,
  createService
}

