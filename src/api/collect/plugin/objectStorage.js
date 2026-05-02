import { PUFFERFISH_API } from '@/api/http'

/** 阿里云 OSS 数据源树（仅 OSS 类型） */
export function aliyunOssDbTree() {
  return PUFFERFISH_API.get('/plugin/aliyunoss/ossDbTree.do')
}

/** 阿里云 OSS Bucket 列表 */
export function aliyunOssBucketList(dbId) {
  return PUFFERFISH_API.get('/plugin/aliyunoss/bucketList.do?dbId=' + encodeURIComponent(String(dbId)))
}

/** MinIO 数据源树（仅 MinIO 类型） */
export function minioOssDbTree() {
  return PUFFERFISH_API.get('/plugin/minio/ossDbTree.do')
}

/** MinIO Bucket 列表 */
export function minioBucketList(dbId) {
  return PUFFERFISH_API.get('/plugin/minio/bucketList.do?dbId=' + encodeURIComponent(String(dbId)))
}
