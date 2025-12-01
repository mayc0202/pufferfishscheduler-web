// src/utils/fileExport.js

import { Message } from 'element-ui'

/**
 * 从响应对象导出文件
 * @param {Object} response - axios响应对象
 * @param {string} customFileName - 自定义文件名（可选）
 */
export function exportFileFromResponse(response, customFileName = '') {
  try {
    // 验证响应数据
    if (!response || !response.data) {
      throw new Error('响应数据为空')
    }

    // 获取blob数据
    const blob = response.data

    // 检查是否是blob类型
    if (!(blob instanceof Blob)) {
      throw new Error('响应数据不是有效的文件格式')
    }

    // 提取文件名
    const fileName = extractFileNameFromHeaders(response.headers, customFileName)

    // 获取文件类型
    const contentType = response.headers['content-type'] || 'application/octet-stream'

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }))

    // 创建隐藏的下载链接
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'

    // 添加到DOM并触发点击
    document.body.appendChild(link)
    link.click()

    // 清理资源
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log(`文件导出成功: ${fileName}`)
  } catch (error) {
    console.error('文件导出失败:', error)
    Message.error('文件导出失败: ' + error.message)
    throw error
  }
}

/**
 * 从响应头提取文件名
 * @param {Object} headers - 响应头
 * @param {string} customFileName - 自定义文件名
 * @returns {string} 文件名
 */
function extractFileNameFromHeaders(headers, customFileName = '') {
  // 优先使用自定义文件名
  if (customFileName) {
    return customFileName
  }

  // 从 Content-Disposition 头提取文件名
  const contentDisposition = headers['content-disposition']
  if (contentDisposition) {
    const fileName = extractFileNameFromContentDisposition(contentDisposition)
    if (fileName) {
      return fileName
    }
  }

  // 如果都无法获取，使用默认文件名
  return `download_${new Date().getTime()}.zip`
}

/**
 * 从 Content-Disposition 头提取文件名
 * @param {string} contentDisposition - Content-Disposition 头
 * @returns {string|null} 文件名
 */
function extractFileNameFromContentDisposition(contentDisposition) {
  if (!contentDisposition) return null

  // 处理 RFC 5987 编码的文件名 (filename*=UTF-8'')
  const utf8FilenameRegex = /filename\*=UTF-8''([^;]+)/
  const utf8Matches = utf8FilenameRegex.exec(contentDisposition)
  if (utf8Matches && utf8Matches[1]) {
    try {
      return decodeURIComponent(utf8Matches[1])
    } catch (e) {
      console.warn('UTF-8文件名解码失败:', e)
    }
  }

  // 处理普通文件名 (filename="...")
  const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
  const matches = filenameRegex.exec(contentDisposition)
  if (matches && matches[1]) {
    const filename = matches[1].replace(/['"]/g, '')
    try {
      return decodeURIComponent(filename)
    } catch (e) {
      return filename
    }
  }

  return null
}
