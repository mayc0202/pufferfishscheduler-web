import { PUFFERFISH_API } from '@/api/http'

/**
 * tree
 * @returns
 */
export function tree(name) {
  return PUFFERFISH_API.get('/resource/tree.do?name=' + String(name))
}

/**
 * list
 * @param {*} data
 * @returns
 */
export function list(data) {
  return PUFFERFISH_API.get('/resource/list.do?dbId=' + data.dbId + '&name=' + data.name + '&path=' + data.path + '&pageNo=' + data.pageNo + '&pageSize=' + data.pageSize)
}

/**
 * directory tree
 * @param {*} dbId
 * @param {*} path
 * @returns
 */
export function directoryTree(dbId, path) {
  return PUFFERFISH_API.tree('/resource/directoryTree.do?dbId=' + dbId + '&path=' + path)
}

/**
 * mkdir
 * @param {*} data
 * @returns
 */
export function mkdir(data) {
  return PUFFERFISH_API.post('/resource/mkdir.do', data)
}

/**
 * rename
 * @param {*} data
 * @returns
 */
export function rename(data) {
  return PUFFERFISH_API.put('/resource/rename.do', data)
}

/**
 * remove
 * @param {*} data
 * @returns
 */
export function remove(data) {
  return PUFFERFISH_API.delete('/resource/remove.do?dbId=' + data.dbId + '&type=' + data.type + '&path=' + data.path)
}

/**
 * move
 * @param {*} data
 * @returns
 */
export function move(data) {
  return PUFFERFISH_API.post('/resource/move.do', data)
}

/**
 * upload
 * @param {FormData} formData
 * @param {*} onProgress
 * @param {*} signal
 * @param {*} timeout
 * @returns
 */
export function upload(formData, onProgress, signal, timeout) {
  return PUFFERFISH_API.uploadFile('/resource/upload.do', formData, {
    onUploadProgress: onProgress,
    signal, // 支持 AbortController
    timeout: timeout // 超时时间（毫秒）
  })
}
