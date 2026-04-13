import Vue from 'vue'
import MessageMain from 'element-ui/packages/message/src/main.vue'
import { PopupManager } from 'element-ui/src/utils/popup'
import { isVNode } from 'element-ui/src/utils/vdom'

const MessageConstructor = Vue.extend(MessageMain)
let instance
const instances = []
let seed = 1

function isErrorLike(o) {
  return (
    o instanceof Error ||
    o?.isAxiosError === true ||
    o?.name === 'AxiosError'
  )
}

/** 从 Error / Axios 错误 / 后端结构中提取可读文案（避免把 Error 展开进 data 导致 message 丢失） */
function extractErrorText(o) {
  if (o == null) return ''
  if (typeof o === 'string') return o
  if (typeof o !== 'object') return String(o)
  if (typeof o.message === 'string' && o.message) return o.message
  const d = o.response && o.response.data
  if (d == null) return ''
  if (typeof d === 'string') return d
  if (typeof d === 'object') {
    return String(d.message || d.msg || d.error || '')
  }
  return ''
}

function normalizeMessageOptions(options) {
  if (typeof options === 'string') {
    return { message: options.trim() || '操作失败，请稍后重试' }
  }
  if (!options || typeof options !== 'object') {
    return options || {}
  }
  if (isVNode(options.message)) {
    return options
  }
  // 传入的是 Error / AxiosError 等：不可枚举字段无法被 { ...options } 拷贝，需转成普通对象
  if (isErrorLike(options)) {
    const message = extractErrorText(options) || '操作失败，请稍后重试'
    return { message, type: options.type }
  }
  // 已是 Element 配置且 message 为非空字符串
  if (typeof options.message === 'string' && options.message.trim()) {
    return options
  }
  // message 缺省、空串或非字符串（常见于 reject 了后端 { code, message: '' }）：禁止空白条
  const message =
    extractErrorText(options) ||
    (typeof options.message === 'string' ? options.message.trim() : '') ||
    '操作失败，请稍后重试'
  return { ...options, message }
}

function createMessageInstance(options) {
  return new MessageConstructor({
    data() {
      return { ...options }
    }
  })
}

const Message = (rawOptions) => {
  if (Vue.prototype.$isServer) return

  const options = normalizeMessageOptions(rawOptions)
  const userOnClose = options.onClose
  const id = 'message_' + seed++

  options.onClose = function() {
    Message.close(id, userOnClose)
  }

  instance = createMessageInstance(options)
  instance.id = id

  if (isVNode(instance.message)) {
    instance.$slots.default = [instance.message]
    instance.message = null
  }

  instance.$mount()
  document.body.appendChild(instance.$el)

  let verticalOffset = options.offset || 20
  instances.forEach(item => {
    verticalOffset += item.$el.offsetHeight + 16
  })
  instance.verticalOffset = verticalOffset
  instance.visible = true
  instance.$el.style.zIndex = PopupManager.nextZIndex()
  instances.push(instance)
  return instance
}

;['success', 'warning', 'info', 'error'].forEach(type => {
  Message[type] = options => {
    const normalizedOptions = normalizeMessageOptions(options)
    normalizedOptions.type = type
    return Message(normalizedOptions)
  }
})

Message.close = (id, userOnClose) => {
  const len = instances.length
  let index = -1
  let removedHeight

  for (let i = 0; i < len; i++) {
    if (id === instances[i].id) {
      removedHeight = instances[i].$el.offsetHeight
      index = i
      if (typeof userOnClose === 'function') {
        userOnClose(instances[i])
      }
      instances.splice(i, 1)
      break
    }
  }

  if (len <= 1 || index === -1 || index > instances.length - 1) return

  for (let i = index; i < len - 1; i++) {
    const dom = instances[i].$el
    dom.style.top = parseInt(dom.style.top, 10) - removedHeight - 16 + 'px'
  }
}

Message.closeAll = () => {
  for (let i = instances.length - 1; i >= 0; i--) {
    instances[i].close()
  }
}

export default Message
