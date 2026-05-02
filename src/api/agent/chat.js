import store from '@/store'
import { PUFFERFISH_API } from '@/api/http'

const AGENT_BASE = '/agent'

function resolveBaseUrl() {
  return (process.env.VUE_APP_PUFFERFISH_SCHEDULER || '').replace(/\/$/, '')
}

function buildUrl(apiBase, path, params = {}) {
  const q = new URLSearchParams()
  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value !== undefined && value !== null && String(value) !== '') {
      q.set(key, String(value))
    }
  })
  const query = q.toString()
  const base = String(apiBase || '').replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${resolveBaseUrl()}${base}${p}${query ? `?${query}` : ''}`
}

function getAuthHeaders() {
  const token = store.getters.token
  const headers = {
    Accept: 'text/event-stream'
  }
  if (token) {
    headers['Pufferfish-Token'] = token
    headers['X-Token'] = token
  }
  return headers
}

/** 去掉行首重复的 SSE `data:` 前缀（兼容服务端写成 `data:data:`） */
function stripLeadingDataPrefixes(line) {
  let s = String(line || '').replace(/\r$/, '')
  while (true) {
    const m = s.match(/^\s*data:\s*/i)
    if (!m) break
    s = s.slice(m.index + m[0].length)
  }
  return s.trim()
}

/**
 * 解析单行 SSE data 负载并投递给回调。
 * @param {string} dataStr - 已去掉前缀的字符串
 * @param {(text: string, meta?: { replace?: boolean }) => void} onChunk
 */
function dispatchSseJsonPayload(dataStr, onChunk) {
  const payload = String(dataStr || '').trim()
  if (!payload || payload === '[DONE]') return
  let obj
  try {
    obj = JSON.parse(payload)
  } catch {
    return
  }
  const type = obj.type
  if (type === 'token' && typeof obj.content === 'string') {
    onChunk(obj.content)
    return
  }
  if (type === 'start') {
    return
  }
  if (type === 'complete') {
    if (typeof obj.response === 'string' && obj.response.length) {
      onChunk(obj.response, { replace: true })
    }
    return
  }
  if (typeof obj.content === 'string' && obj.content) {
    onChunk(obj.content)
  }
}

async function requestSseStream(apiBase, path, { chatId, question, signal, onChunk }) {
  const url = buildUrl(apiBase, path, { chatId, question })
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    signal
  })
  if (!response.ok) {
    throw new Error(`智能体请求失败（HTTP ${response.status}）`)
  }
  if (!response.body) {
    throw new Error('当前浏览器不支持流式读取')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let pending = ''

  const processLine = (rawLine) => {
    const trimmed = rawLine.replace(/\r$/, '')
    if (!trimmed.trim()) return
    const dataStr = stripLeadingDataPrefixes(trimmed)
    if (!dataStr || dataStr === '[DONE]') return
    dispatchSseJsonPayload(dataStr, onChunk)
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    pending += decoder.decode(value, { stream: true })
    let idx
    while ((idx = pending.indexOf('\n')) >= 0) {
      const line = pending.slice(0, idx)
      pending = pending.slice(idx + 1)
      processLine(line)
    }
  }
  if (pending.trim()) {
    processLine(pending)
  }
}

export function askAgentStream(payload) {
  return requestSseStream(AGENT_BASE, '/askAgent.do', payload)
}

export function askCleaningRuleAgentStream(payload) {
  return requestSseStream(AGENT_BASE, '/askCleaningRuleAgent.do', payload)
}

export function askBusinessFieldFunctionAgentStream(payload) {
  return requestSseStream(AGENT_BASE, '/askBusinessFieldFunctionAgent.do', payload)
}

/**
 * 微观计算公式生成（SSE），与 AgentController#askMicroFormulaAgent 行为一致。
 * GET /microscopic/askFormulaAgent.do?chatId=&question=
 */
export function askMicroscopicFormulaAgentStream(payload) {
  return requestSseStream('/microscopic', '/askFormulaAgent.do', payload)
}

export function getAgentHistory(chatId) {
  return PUFFERFISH_API.get(`${AGENT_BASE}/history.do`, { chatId })
}

export function clearAgentHistory(chatId) {
  return PUFFERFISH_API.get(`${AGENT_BASE}/clearHistory`, { chatId })
}
