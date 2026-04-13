import { PUFFERFISH_API } from '@/api/http'

/** 解析工作表名、表头字段等可能较慢（FTP 拉取大表等），单独 2 分钟超时 */
const EXCEL_SHEETS_FIELDS_TIMEOUT_MS = 2 * 60 * 1000

/**
 * FTP 目录下 xlsx、xls 等资源（与 ExcelController#getResources 对齐）
 * @param {number} dbId FTP 数据源 ID
 * @param {string} [path] 目录路径，默认 /
 */
export function getExcelResources(dbId, path) {
  return PUFFERFISH_API.get('/plugin/excel/getResources.do', {
    dbId,
    path: path == null || path === '' ? '/' : path
  })
}

/**
 * 获取 Excel 工作表名称
 * 请求体：TransConfigForm — flowId、config（JSON 字符串，非空）、stepName
 * @param {{ flowId: number, config: string, stepName?: string }} form
 */
export function getExcelSheets(form) {
  return PUFFERFISH_API.post(
    '/plugin/excel/getSheets.do',
    {
      flowId: form.flowId,
      config: form.config,
      stepName: form.stepName != null ? form.stepName : ''
    },
    { timeout: EXCEL_SHEETS_FIELDS_TIMEOUT_MS }
  )
}

/**
 * 从表头等解析字段列表
 * 请求体：TransConfigForm
 * @param {{ flowId: number, config: string, stepName?: string }} form
 */
export function getExcelFields(form) {
  return PUFFERFISH_API.post(
    '/plugin/excel/getFields.do',
    {
      flowId: form.flowId,
      config: form.config,
      stepName: form.stepName != null ? form.stepName : ''
    },
    { timeout: EXCEL_SHEETS_FIELDS_TIMEOUT_MS }
  )
}
