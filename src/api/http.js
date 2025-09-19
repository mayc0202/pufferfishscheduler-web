import { UPMS_SERVICE, DATABASE_SERVICE, COLLECT_SERVICE } from '@/utils/request'

// 全局超时时间（30秒）
const DEFAULT_TIMEOUT = 30000

/**
 * HTTP 服务工厂类
 * 为每个后端服务创建独立的 HTTP 请求工具
 */
class HttpServiceFactory {
  /**
   * 创建 HTTP 服务实例
   * @param {Object} service - axios 服务实例 (upmsService/databaseService/collectService)
   * @returns {Object} HTTP 工具实例
   */
  static create(service) {
    return {
      /**
       * 基础请求方法
       * @param {Object} config - 请求配置
       * @returns {Promise} 请求Promise
       */
      _request(config) {
        const baseConfig = {
          upload: false,
          headers: {}
        }
        return service({ ...baseConfig, ...config })
      },

      /**
       * GET请求
       * @param {string} url - 请求地址
       * @param {Object} [params] - 查询参数
       * @returns {Promise} 请求Promise
       */
      get(url, params) {
        return this._request({
          method: 'get',
          url,
          params
        })
      },

      /**
       * POST请求
       * @param {string} url - 请求地址
       * @param {Object} [data] - 请求体数据
       * @returns {Promise} 请求Promise
       */
      post(url, data) {
        return this._request({
          method: 'post',
          url,
          data
        })
      },

      /**
       * PUT请求
       * @param {string} url - 请求地址
       * @param {Object} [data] - 请求体数据
       * @returns {Promise} 请求Promise
       */
      put(url, data) {
        return this._request({
          method: 'put',
          url,
          data
        })
      },

      /**
       * DELETE请求
       * @param {string} url - 请求地址
       * @param {Object} [params] - 查询参数（URL参数）
       * @param {Object} [data] - 请求体数据（可选）
       * @returns {Promise} 请求Promise
       */
      delete(url, config = {}) {
        const { params = undefined, data = undefined } = config
        return this._request({
          method: 'delete',
          url,
          params,
          data
        })
      },

      /**
       * 递归请求
       * @param {string} url - 请求地址
       * @param {Object} [params] - 查询参数
       * @returns {Promise} 请求Promise
       */
      tree(url, params) {
        return this._request({
          method: 'get',
          url,
          params,
          timeout: DEFAULT_TIMEOUT // 设置30秒超时
        })
      },

      /**
       * 文件上传（通用方法）
       * @param {string} url - 上传地址
       * @param {FormData} formData - 包含文件的FormData对象
       * @param {Object} [config] - 额外配置项
       * @returns {Promise} 上传请求Promise
       */
      uploadFile(url, formData, config = {}) {
        return this._request({
          method: 'post',
          url,
          data: formData,
          upload: true,
          onUploadProgress: config.onUploadProgress, // 确保这里传递了进度回调
          headers: {
            ...config.headers
          },
          ...config
        })
      },

      /**
       * 专用头像上传
       * @param {string} url - 上传地址
       * @param {FormData} formData - 包含头像文件的FormData
       * @returns {Promise} 上传请求Promise
       */
      uploadAvatar(url, formData) {
        return this.uploadFile(url, formData, {
          headers: {
            'X-File-Type': 'avatar'
          }
        })
      }
    }
  }
}

// 为每个服务创建独立的 HTTP 工具实例
const UPMS_API = HttpServiceFactory.create(UPMS_SERVICE)
const DATABASE_API = HttpServiceFactory.create(DATABASE_SERVICE)
const COLLECT_API = HttpServiceFactory.create(COLLECT_SERVICE)

export {
  UPMS_API,
  DATABASE_API,
  COLLECT_API
}
