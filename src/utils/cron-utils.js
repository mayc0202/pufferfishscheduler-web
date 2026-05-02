/**
 * Cron 归一化与提交前处理（对齐后端策略）
 * @typedef {Object} SchedulePayload
 * @property {string} [scheduleType] // "1"=定时（元数据等）
 * @property {string} [executeType] // 兼容旧字段，逐步迁移中
 * @property {string|null} [cron]
 * @property {boolean|string} [enable]
 */

/**
 * @typedef {Object} CronNormalizeResult
 * @property {boolean} ok
 * @property {string} normalizedCron
 * @property {string} [reason]
 */

/**
 * @typedef {Object} PrepareScheduleOptions
 * @property {boolean} [forceCronSchedule] 为 true 时按「定时」分支处理 cron（清洗任务字典 code 可能不是 "1"）
 */

const TIMING_EXECUTE_TYPE = '1'

/**
 * 归一化 cron（对齐后端策略）
 * 1) 5字段 -> 补秒
 * 2) 7字段 -> 去掉 year
 * 3) month='?' -> 改为 '*'
 * @param {string|null|undefined} rawCron
 * @returns {string}
 */
export function normalizeCron(rawCron) {
  const s = (rawCron ?? '').trim()
  if (!s) return ''

  let parts = s.split(/\s+/)

  if (parts.length === 5) {
    parts = ['0', ...parts]
  } else if (parts.length === 7) {
    parts = parts.slice(0, 6)
  }

  // [sec min hour day-of-month month day-of-week]
  // month 位置是索引 4，不能为 '?'
  if (parts.length === 6 && parts[4] === '?') {
    parts[4] = '*'
  }

  return parts.join(' ')
}

/**
 * 轻量校验（前端版，避免明显脏数据）
 * 真正语义仍以后端 CronExpression.parse 为准
 * @param {string|null|undefined} rawCron
 * @returns {CronNormalizeResult}
 */
export function validateCronForSubmit(rawCron) {
  const cron = normalizeCron(rawCron)
  if (!cron) {
    return { ok: false, normalizedCron: '', reason: 'cron 表达式不能为空' }
  }

  const parts = cron.split(/\s+/)
  if (parts.length !== 6) {
    return { ok: false, normalizedCron: cron, reason: 'cron 必须为 6 段（或 5 段自动补秒）' }
  }

  if (parts[4] === '?') {
    return { ok: false, normalizedCron: cron, reason: "month（月）字段不能为 '?'" }
  }

  return { ok: true, normalizedCron: cron }
}

/**
 * 提交前统一调整 payload
 * - scheduleType=1（兼容 executeType=1）或 forceCronSchedule：必须有合法 cron，写回 normalizedCron
 * - 否则：清空 cron，避免误调度
 * @template T
 * @param {T & SchedulePayload} payload
 * @param {PrepareScheduleOptions} [options]
 * @returns {T & SchedulePayload}
 */
export function prepareSchedulePayloadForSubmit(payload, options) {
  const cloned = { ...payload }
  const forceCron = options && options.forceCronSchedule === true
  const scheduleTypeCode =
    cloned.scheduleType != null ? cloned.scheduleType : cloned.executeType
  const isTiming =
    String(scheduleTypeCode ?? '') === TIMING_EXECUTE_TYPE || forceCron

  if (isTiming) {
    const r = validateCronForSubmit(cloned.cron)
    if (!r.ok) {
      throw new Error(r.reason || 'cron 表达式不合法')
    }
    cloned.cron = r.normalizedCron
  } else {
    cloned.cron = null
  }

  return cloned
}

export { TIMING_EXECUTE_TYPE }
