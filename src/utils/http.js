import store from '@/store'
// 获取token
import { getToken } from '@/utils/auth'
// 导入axios
import axios from 'axios'
// 使用element-ui Message做消息提醒
import { Message, MessageBox } from 'element-ui'

//1. 创建新的axios实例，
const service = axios.create({
  // // 公共接口
  // baseURL: process.env.VUE_APP_BASE_API_CLIENT,
  // 超时时间 单位是ms，这里设置了5s的超时时间
  timeout: 5 * 1000
})
// 2.请求拦截器
service.interceptors.request.use(config => {
  //发请求前做的一些处理，数据转化，配置请求头，设置token,设置loading等，根据需求去添加
  config.data = JSON.stringify(config.data); //数据转化,也可以使用qs转换
  if (!config.upload) {
    config.headers['Content-Type'] = 'application/json;charset=UTF-8'; // 'application/x-www-form-urlencoded' 'multipart/form-data'(文件上传)
  } else {
    // config.headers['Content-Type'] = 'multipart/form-data';
  }
  // console.log('config', config);
  // 在发送请求之前做点什么
  if (store.getters.token) {
    // 让每个请求携带令牌
    // ['X-Token'] 是自定义标头键
    // 请根据实际情况进行修改
    config.headers['X-Token'] = getToken() // 从cookie中获取token
  }
  return config
}, error => {
  console.log('request请求异常:', error) // for debug
  return Promise.reject(error)
})

// 3.响应拦截器
service.interceptors.response.use(response => {
  //接收到响应数据并成功后的一些共有的处理，关闭loading等
  /**
   * 通过自定义代码确定请求状态
   * 也可以通过HTTP状态代码来判断状态
   */
  var res = response.data
  // 50008: 非法令牌; 50012: 其他客户端已登录; 50014: 令牌过期;
  if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
    // to re-login
    MessageBox.confirm('您已注销，您可以取消以留在此页面，也可以重新登录', '确认注销', {
      confirmButtonText: 'Re-Login',
      cancelButtonText: 'Cancel',
      type: 'warning'
    }).then(() => {
      store.dispatch('asyncResetToken').then(() => {
        location.reload()
      })
    })
  }
  return response
}, error => {
  console.log('异常', error.response);
  /***** 接收到异常响应的处理开始 *****/
  if (error && error.response) {
    // 1.公共错误处理
    // 2.根据响应码具体处理
    var err = {
      status: error.response.status,
      message: ''
    }
    switch (err.status) {
      case 400:
        err.message = '错误请求'
        break;
      case 401:
        err.message = '未授权，请重新登录'
        break;
      case 403:
        err.message = '拒绝访问'
        break;
      case 404:
        err.message = '请求错误,未找到该资源'
        break;
      case 405:
        err.message = '请求方法未允许'
        break;
      case 408:
        err.message = '请求超时'
        break;
      case 500:
        err.message = '服务器端出错'
        break;
      case 501:
        err.message = '网络未实现'
        break;
      case 502:
        err.message = '网络错误'
        break;
      case 503:
        err.message = '服务不可用'
        break;
      case 504:
        err.message = '网络超时'
        break;
      case 505:
        err.message = 'http版本不支持该请求'
        break;
      default:
        err.message = `连接错误${err.status}`
        break;
    }
    Message.error(err.message)
    return err
  } else {
    // 超时处理
    if (JSON.stringify(error).includes('timeout')) {
      Message.warning('服务器响应超时，请刷新当前页')
    }
  }
  /***** 处理结束 *****/
  //如果不需要错误处理，以上的处理过程都可省略
  return Promise.resolve(error)
})
//4.导入文件
export default service