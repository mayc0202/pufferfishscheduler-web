
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
// 响应拦截器（适配真实后端结构，精准拦截999999）
service.interceptors.response.use(
  response => {
    const res = response.data // res = 后端返回的完整响应体（{code, message, result, status}）

    // -------------------------- 第一步：精准拦截 "999999" 系统错误 --------------------------
    // 1. 先判断code是否存在（避免后端返回格式异常导致代码报错）
    // 2. 统一转为字符串匹配（防止后端偶尔返回数字类型的999999）
    if (res.code !== undefined && String(res.code) === SYSTEM_ERROR) {
      // 错误提示：优先用后端返回的message，无则用默认文案
      const errorMsg = res.message || '系统错误（999999），请联系管理员'
      Message.error(errorMsg)
      // 拒绝Promise，让前端调用方（如login、getUserInfo）能捕获到该错误
      return Promise.reject(new Error(errorMsg))
    }

    // -------------------------- 第二步：处理会话过期等其他业务错误 --------------------------
    // 注意：后端返回的code是字符串（如"50008"），需转成数字再判断
    const resCode = Number(res.code)
    if ([50008, 50012, 50014].includes(resCode)) {
      handleSessionExpired()
      return Promise.reject(new Error(res.message || '会话已过期，请重新登录'))
    }

    // -------------------------- 第三步：成功响应（按需返回数据） --------------------------
    // 可选：如果前端业务只需要「业务数据」，可返回 res.result（如用户信息在res.result里）
    // 若需要完整响应体（如code、status），则返回 res
    return res // 或 return res.result;（根据你的业务需求选择）
  },
  // -------------------------- 第四步：网络错误/HTTP状态码错误（原逻辑保留，无需修改） --------------------------
  error => {
    // 处理超时错误
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      handleNetworkError(error)
      return Promise.reject(error)
    }

    // 处理无响应的网络错误（如断网）
    if (!error.response) {
      Message.error('网络异常，请检查网络连接！')
      return Promise.reject(error)
    }

    // 处理HTTP状态码错误（401未授权、404不存在等）
    const status = error.response.status
    const message = httpErrorMap[status] || `请求错误（${status}）`
    if (status === 401) {
      handleUnauthorized()
    } else {
      Message.error(message)
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
export const UPMS_SERVICE = createService(process.env.VUE_APP_ETL_UPMS)
export const DATABASE_SERVICE = createService(process.env.VUE_APP_ETL_DATABASE)
export const COLLECT_SERVICE = createService(process.env.VUE_APP_ETL_DATA_COLLECT)

// 文件底部添加
export default {
  UPMS_SERVICE,
  DATABASE_SERVICE,
  COLLECT_SERVICE,
  createService
}

