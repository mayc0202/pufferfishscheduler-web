<template>
  <div
    class="ai-assistant-anchor"
    :class="{ 'is-dragging': isDragging, 'dock-right': dockedToRight }"
    :style="anchorStyle"
    @mouseenter="onMenuEnter"
    @mouseleave="onMenuLeave"
  >
    <!-- 菜单在按钮上方（豆包式大圆角卡片） -->
    <transition name="assistant-fade">
      <div
        v-show="menuVisible"
        class="assistant-menu"
        @click.stop
        @mouseenter="onMenuEnter"
      >
        <button type="button" class="menu-item" @click="onMenuConsult">
          <i class="el-icon-chat-dot-round" />
          <span>产品功能问题咨询</span>
        </button>
        <button type="button" class="menu-item" @click="onMenuRuleChat">
          <i class="el-icon-magic-stick" />
          <span>生成清洗转换规则</span>
        </button>
        <button type="button" class="menu-item" @click="onMenuBizFieldFunc">
          <i class="el-icon-edit-outline" />
          <span>生成业务字段函数</span>
        </button>
      </div>
    </transition>

    <div
      class="ai-assistant-float"
      :class="{
        'is-dragging': isDragging,
        'is-pressing': isPressing,
        'is-expanded-ui': menuVisible
      }"
      @pointerdown="onDragStart"
      @mousedown="onDragStart"
      @touchstart="onDragStart"
      @click="onFloatClick"
    >
      <div class="float-orbit" aria-hidden="true" />
      <div class="float-inner">
        <div class="float-face float-face--idle">
          <div class="float-icon">
            <img
              :src="icons.aiCustomer"
              class="icon-ai"
              alt=""
              draggable="false"
              @dragstart.prevent.stop
            >
          </div>
        </div>
        <div class="float-face float-face--hover" aria-hidden="true">
          <i class="el-icon-arrow-up hover-arrow" />
        </div>
        <div class="float-glow" />
      </div>
    </div>

    <!-- 生成清洗转换规则 · 会话框（豆包式） -->
    <el-dialog
      :visible.sync="ruleDialogVisible"
      :show-close="false"
      :z-index="30050"
      width="520px"
      custom-class="assistant-rule-dialog"
      append-to-body
      :close-on-click-modal="false"
      @closed="onRuleDialogClosed"
    >
      <div class="rule-dialog-shell">
        <header class="rule-dlg-header">
          <button type="button" class="rule-icon-btn" title="关闭" @click="ruleDialogVisible = false">
            <i class="el-icon-close" />
          </button>
          <div class="rule-dlg-drag-hint" />
          <div class="rule-dlg-actions">
            <button type="button" class="rule-icon-btn" title="新对话" @click="resetRuleChat">
              <i class="el-icon-plus" />
              <span class="rule-dlg-new-txt">新对话</span>
            </button>
          </div>
        </header>
        <h3 class="rule-dlg-title">生成清洗转换规则</h3>

        <div ref="ruleMsgList" class="rule-msg-list">
          <div
            v-for="(m, idx) in ruleMessages"
            :key="idx"
            :class="['rule-msg', m.role === 'user' ? 'rule-msg--user' : 'rule-msg--bot']"
          >
            <div class="rule-msg-bubble" v-html="formatRuleHtml(m.content)" />
            <span class="rule-msg-time">{{ formatRuleTime(m.ts) }}</span>
          </div>
          <div v-if="ruleLoading" class="rule-msg rule-msg--bot">
            <div class="rule-msg-bubble rule-msg-bubble--typing">
              <span class="dot" /><span class="dot" /><span class="dot" />
            </div>
          </div>
        </div>

        <div class="rule-input-wrap">
          <textarea
            v-model="ruleInput"
            class="rule-textarea"
            rows="2"
            placeholder="描述你的清洗、转换需求，例如字段映射、过滤条件…"
            :disabled="ruleLoading"
            @keydown.enter.exact.prevent="sendRuleMessage"
          />
          <div class="rule-input-toolbar">
            <span class="rule-hint">Enter 发送 · Shift+Enter 换行</span>
            <button
              type="button"
              class="rule-send-btn"
              :disabled="ruleLoading || !ruleInput.trim()"
              @click="sendRuleMessage"
            >
              <i class="el-icon-s-promotion" />
            </button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 生成业务字段函数 · 会话框（豆包式） -->
    <el-dialog
      :visible.sync="bizDialogVisible"
      :show-close="false"
      :z-index="30050"
      width="520px"
      custom-class="assistant-rule-dialog"
      append-to-body
      :close-on-click-modal="false"
      @closed="onBizDialogClosed"
    >
      <div class="rule-dialog-shell">
        <header class="rule-dlg-header">
          <button type="button" class="rule-icon-btn" title="关闭" @click="bizDialogVisible = false">
            <i class="el-icon-close" />
          </button>
          <div class="rule-dlg-drag-hint" />
          <div class="rule-dlg-actions">
            <button type="button" class="rule-icon-btn" title="新对话" @click="resetBizChat">
              <i class="el-icon-plus" />
              <span class="rule-dlg-new-txt">新对话</span>
            </button>
          </div>
        </header>
        <h3 class="rule-dlg-title">生成业务字段函数</h3>

        <div ref="bizMsgList" class="rule-msg-list">
          <div
            v-for="(m, idx) in bizMessages"
            :key="idx"
            :class="['rule-msg', m.role === 'user' ? 'rule-msg--user' : 'rule-msg--bot']"
          >
            <div class="rule-msg-bubble" v-html="formatRuleHtml(m.content)" />
            <span class="rule-msg-time">{{ formatRuleTime(m.ts) }}</span>
          </div>
          <div v-if="bizLoading" class="rule-msg rule-msg--bot">
            <div class="rule-msg-bubble rule-msg-bubble--typing">
              <span class="dot" /><span class="dot" /><span class="dot" />
            </div>
          </div>
        </div>

        <div class="rule-input-wrap">
          <textarea
            v-model="bizInput"
            class="rule-textarea"
            rows="2"
            placeholder="描述你的业务字段函数需求，例如函数目标、输入字段、返回格式…"
            :disabled="bizLoading"
            @keydown.enter.exact.prevent="sendBizMessage"
          />
          <div class="rule-input-toolbar">
            <span class="rule-hint">Enter 发送 · Shift+Enter 换行</span>
            <button
              type="button"
              class="rule-send-btn"
              :disabled="bizLoading || !bizInput.trim()"
              @click="sendBizMessage"
            >
              <i class="el-icon-s-promotion" />
            </button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import icons from '@/assets/icon/icons.js'
import {
  askCleaningRuleAgentStream,
  askMicroscopicFormulaAgentStream
} from '@/api/agent/chat'

const STORAGE_KEY = 'ai-assistant-float-pos'
const DRAG_THRESHOLD = 5
/** 贴主区左缘 / 视口左缘 */
const EDGE_PAD_LEFT = 8
/** 贴右时多留空，避免菜单挤出屏外（整体再往左） */
const EDGE_PAD_RIGHT = 24

export default {
  name: 'AIAssistantFloat',
  data() {
    return {
      icons,
      pos: { left: 0, top: 0 },
      layoutReady: false,
      isDragging: false,
      isPressing: false,
      suppressNextClick: false,
      menuHover: false,
      menuTapOpen: false,
      hideMenuTimer: null,
      _drag: {
        active: false,
        startX: 0,
        startY: 0,
        originLeft: 0,
        originTop: 0,
        moved: false
      },
      _activePointerId: null,
      _usePointerListeners: false,
      ruleDialogVisible: false,
      ruleInput: '',
      ruleLoading: false,
      ruleMessages: [],
      ruleChatId: '',
      ruleAbortController: null,
      bizDialogVisible: false,
      bizInput: '',
      bizLoading: false,
      bizMessages: [],
      bizChatId: '',
      bizAbortController: null,
      dockSide: 'right',
      lastViewport: { width: 0, height: 0 }
    }
  },

  computed: {
    floatSize() {
      return typeof window !== 'undefined' && window.innerWidth <= 768 ? 40 : 44
    },
    menuVisible() {
      if (this.isDragging) return false
      return this.menuHover || this.menuTapOpen
    },
    anchorStyle() {
      if (!this.layoutReady) {
        return { visibility: 'hidden' }
      }
      const s = this.floatSize
      return {
        left: `${this.pos.left}px`,
        top: `${this.pos.top}px`,
        right: 'auto',
        bottom: 'auto',
        width: `${s}px`,
        height: `${s}px`,
        visibility: 'visible'
      }
    },
    /** 小球中心在屏宽右半边时视为靠右吸附，菜单改右对齐向左展开 */
    dockedToRight() {
      if (!this.layoutReady || typeof window === 'undefined') return false
      return this.pos.left + this.floatSize / 2 > window.innerWidth / 2
    }
  },

  watch: {
    isDragging(v) {
      if (v) {
        this.menuTapOpen = false
        this.menuHover = false
      }
    },
    ruleDialogVisible(v) {
      if (v) {
        this.$nextTick(() => this.scrollRuleList())
      }
    },
    bizDialogVisible(v) {
      if (v) {
        this.$nextTick(() => this.scrollBizList())
      }
    }
  },

  mounted() {
    this.applyDefaultOrStoredPosition()
    this.layoutReady = true
    this.lastViewport = { width: window.innerWidth, height: window.innerHeight }
    window.addEventListener('resize', this.onResize)
    document.addEventListener('click', this.onDocClick, true)
  },

  beforeDestroy() {
    this.abortRuleStream()
    this.abortBizStream()
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('click', this.onDocClick, true)
    this.detachGlobalListeners()
    if (this.hideMenuTimer) clearTimeout(this.hideMenuTimer)
  },

  methods: {
    onMenuEnter() {
      if (this.hideMenuTimer) {
        clearTimeout(this.hideMenuTimer)
        this.hideMenuTimer = null
      }
      this.menuHover = true
    },
    onMenuLeave() {
      this.hideMenuTimer = setTimeout(() => {
        this.menuHover = false
        this.hideMenuTimer = null
      }, 220)
    },
    onDocClick(e) {
      if (!this.$el || !this.$el.contains(e.target)) {
        this.menuTapOpen = false
      }
    },
    onFloatClick(e) {
      if (this.suppressNextClick) return
      const coarse =
        typeof window !== 'undefined' &&
        (window.matchMedia('(hover: none)').matches || window.innerWidth <= 768)
      if (coarse) {
        e.stopPropagation()
        this.menuTapOpen = !this.menuTapOpen
      }
    },

    onMenuConsult() {
      this.menuTapOpen = false
      this.menuHover = false
      this.$router.push('/agent-assistant')
    },
    onMenuRuleChat() {
      this.menuTapOpen = false
      this.menuHover = false
      this.ruleDialogVisible = true
      if (this.ruleMessages.length === 0) {
        this.ensureRuleChatId()
        this.ruleMessages.push({
          role: 'bot',
          content:
            '你好，我可以根据你的描述**生成或建议清洗转换规则**（字段映射、过滤、脱敏等）。请说明数据源类型、目标字段与业务规则。',
          ts: new Date()
        })
      }
    },
    onMenuBizFieldFunc() {
      this.menuTapOpen = false
      this.menuHover = false
      this.bizDialogVisible = true
      if (this.bizMessages.length === 0) {
        this.ensureBizChatId()
        this.bizMessages.push({
          role: 'bot',
          content:
            '你好，我可以根据你的描述**生成业务字段函数**（计算、映射、拼接、格式化等）。请说明输入字段、业务逻辑与期望输出。',
          ts: new Date()
        })
      }
    },
    resetRuleChat() {
      this.abortRuleStream()
      this.ruleChatId = this.createRuleChatId()
      this.ruleMessages = [
        {
          role: 'bot',
          content: '已开始新对话。请描述你的清洗转换需求。',
          ts: new Date()
        }
      ]
      this.ruleInput = ''
    },
    onRuleDialogClosed() {
      this.abortRuleStream()
      this.ruleInput = ''
    },
    resetBizChat() {
      this.abortBizStream()
      this.bizChatId = this.createBizChatId()
      this.bizMessages = [
        {
          role: 'bot',
          content: '已开始新对话。请描述你的业务字段函数需求。',
          ts: new Date()
        }
      ]
      this.bizInput = ''
    },
    onBizDialogClosed() {
      this.abortBizStream()
      this.bizInput = ''
    },
    createRuleChatId() {
      return `rule-${Date.now()}`
    },
    createBizChatId() {
      return `biz-func-${Date.now()}`
    },
    ensureRuleChatId() {
      if (!this.ruleChatId) {
        this.ruleChatId = this.createRuleChatId()
      }
      return this.ruleChatId
    },
    ensureBizChatId() {
      if (!this.bizChatId) {
        this.bizChatId = this.createBizChatId()
      }
      return this.bizChatId
    },
    abortRuleStream() {
      if (this.ruleAbortController) {
        this.ruleAbortController.abort()
        this.ruleAbortController = null
      }
      this.ruleLoading = false
    },
    abortBizStream() {
      if (this.bizAbortController) {
        this.bizAbortController.abort()
        this.bizAbortController = null
      }
      this.bizLoading = false
    },
    formatRuleHtml(content) {
      if (!content) return ''
      marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false })
      const html = marked.parse(content)
      return DOMPurify.sanitize(html)
    },
    formatRuleTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    },
    scrollRuleList() {
      const el = this.$refs.ruleMsgList
      if (el) el.scrollTop = el.scrollHeight
    },
    scrollBizList() {
      const el = this.$refs.bizMsgList
      if (el) el.scrollTop = el.scrollHeight
    },
    async sendRuleMessage() {
      if (this.ruleLoading || !this.ruleInput.trim()) return
      const text = this.ruleInput.trim()
      this.ruleMessages.push({ role: 'user', content: text, ts: new Date() })
      this.ruleInput = ''
      this.ruleLoading = true
      this.$nextTick(() => this.scrollRuleList())
      const bot = { role: 'bot', content: '', ts: new Date() }
      this.ruleMessages.push(bot)
      this.$nextTick(() => this.scrollRuleList())

      const controller = new AbortController()
      this.ruleAbortController = controller
      try {
        await askCleaningRuleAgentStream({
          chatId: this.ensureRuleChatId(),
          question: text,
          signal: controller.signal,
          onChunk: (chunk, meta) => {
            if (meta && meta.replace) {
              bot.content = chunk
            } else {
              bot.content += chunk
            }
            bot.ts = new Date()
            this.$forceUpdate()
            this.scrollRuleList()
          }
        })
      } catch (e) {
        if (e && e.name !== 'AbortError') {
          bot.content = bot.content || '请求失败，请稍后重试。'
          this.$message.error(e.message || '生成清洗转换规则失败')
        }
      } finally {
        this.ruleLoading = false
        this.ruleAbortController = null
      }
      if (!bot.content) {
        bot.content = '未返回有效内容，请重试。'
      }
    },
    async sendBizMessage() {
      if (this.bizLoading || !this.bizInput.trim()) return
      const text = this.bizInput.trim()
      this.bizMessages.push({ role: 'user', content: text, ts: new Date() })
      this.bizInput = ''
      this.bizLoading = true
      this.$nextTick(() => this.scrollBizList())
      const bot = { role: 'bot', content: '', ts: new Date() }
      this.bizMessages.push(bot)
      this.$nextTick(() => this.scrollBizList())

      const controller = new AbortController()
      this.bizAbortController = controller
      try {
        await askMicroscopicFormulaAgentStream({
          chatId: this.ensureBizChatId(),
          question: text,
          signal: controller.signal,
          onChunk: (chunk, meta) => {
            if (meta && meta.replace) {
              bot.content = chunk
            } else {
              bot.content += chunk
            }
            bot.ts = new Date()
            this.$forceUpdate()
            this.scrollBizList()
          }
        })
      } catch (e) {
        if (e && e.name !== 'AbortError') {
          bot.content = bot.content || '请求失败，请稍后重试。'
          this.$message.error(e.message || '生成业务字段函数失败')
        }
      } finally {
        this.bizLoading = false
        this.bizAbortController = null
      }
      if (!bot.content) {
        bot.content = '未返回有效内容，请重试。'
      }
    },

    getPadding() {
      const narrow = typeof window !== 'undefined' && window.innerWidth <= 768
      return { right: narrow ? 16 : Math.max(EDGE_PAD_RIGHT, 24), bottom: narrow ? 32 : 48 }
    },

    applyDefaultOrStoredPosition() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const p = JSON.parse(raw)
          if (typeof p.left === 'number' && typeof p.top === 'number') {
            this.pos = { left: p.left, top: p.top }
            if (p.dockSide === 'left' || p.dockSide === 'right') {
              this.dockSide = p.dockSide
            } else {
              this.dockSide = p.left + this.floatSize / 2 > window.innerWidth / 2 ? 'right' : 'left'
            }
            this.$nextTick(() => this.clampToViewport())
            return
          }
        }
      } catch (e) {
        /* ignore */
      }
      this.setDefaultCorner()
    },

    getMainSnapHorizontals() {
      const w = this.floatSize
      const ml = EDGE_PAD_LEFT
      const mr = EDGE_PAD_RIGHT
      const main = document.querySelector('.app-wrapper .main-container')
      if (main && typeof main.getBoundingClientRect === 'function') {
        const r = main.getBoundingClientRect()
        if (r.width >= w + ml + mr) {
          const leftSnap = Math.round(r.left + ml)
          const rightSnap = Math.round(r.right - w - mr)
          if (rightSnap >= leftSnap) {
            return { leftSnap, rightSnap, midX: (r.left + r.right) / 2 }
          }
        }
      }
      return {
        leftSnap: ml,
        rightSnap: Math.max(ml, window.innerWidth - w - mr),
        midX: window.innerWidth / 2
      }
    },

    setDefaultCorner() {
      const w = this.floatSize
      const { bottom } = this.getPadding()
      const { rightSnap } = this.getMainSnapHorizontals()
      this.pos = {
        left: rightSnap,
        top: Math.max(8, window.innerHeight - w - bottom)
      }
      this.dockSide = 'right'
    },

    clampToViewport() {
      const w = this.floatSize
      const h = this.floatSize
      const ml = EDGE_PAD_LEFT
      const mr = EDGE_PAD_RIGHT
      const mt = 6
      const mb = 6
      this.pos.left = Math.min(
        Math.max(ml, this.pos.left),
        Math.max(ml, window.innerWidth - w - mr)
      )
      this.pos.top = Math.min(
        Math.max(mt, this.pos.top),
        Math.max(mt, window.innerHeight - h - mb)
      )
    },

    snapToNearestVerticalEdge() {
      const w = this.floatSize
      const { leftSnap, rightSnap, midX } = this.getMainSnapHorizontals()
      const cx = this.pos.left + w / 2
      if (cx <= midX) {
        this.pos.left = leftSnap
        this.dockSide = 'left'
      } else {
        this.pos.left = rightSnap
        this.dockSide = 'right'
      }
      this.clampToViewport()
    },

    savePosition() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            left: this.pos.left,
            top: this.pos.top,
            dockSide: this.dockSide
          })
        )
      } catch (e) {
        /* ignore */
      }
    },

    onResize() {
      const oldViewport = this.lastViewport
      if (oldViewport.width && oldViewport.height) {
        const h = this.floatSize
        const bottomGap = Math.max(6, oldViewport.height - (this.pos.top + h))
        this.pos.top = window.innerHeight - h - bottomGap

        const { leftSnap, rightSnap } = this.getMainSnapHorizontals()
        this.pos.left = this.dockSide === 'left' ? leftSnap : rightSnap
      }
      this.clampToViewport()
      this.lastViewport = { width: window.innerWidth, height: window.innerHeight }
    },

    detachGlobalListeners() {
      if (this._usePointerListeners) {
        document.removeEventListener('pointermove', this.onDocumentPointerMove, true)
        document.removeEventListener('pointerup', this.onDocumentPointerUp, true)
        document.removeEventListener('pointercancel', this.onDocumentPointerUp, true)
        this._usePointerListeners = false
        this._activePointerId = null
      }
      document.removeEventListener('mousemove', this.onLegacyMouseMove)
      document.removeEventListener('mouseup', this.onLegacyMouseUp)
      document.removeEventListener('touchmove', this.onLegacyTouchMove, { passive: false, capture: true })
      document.removeEventListener('touchend', this.onLegacyTouchEnd)
      document.removeEventListener('touchcancel', this.onLegacyTouchEnd)
    },

    clientXYFromEvent(e) {
      if (e.pointerType) {
        return { x: e.clientX, y: e.clientY }
      }
      if (e.touches && e.touches.length) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
      if (e.changedTouches && e.changedTouches.length) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
      }
      return { x: e.clientX, y: e.clientY }
    },

    onDragStart(e) {
      if (typeof window === 'undefined') return
      const hasPE = typeof window.PointerEvent !== 'undefined'
      if (hasPE && (e.type === 'mousedown' || e.type === 'touchstart')) {
        return
      }

      if (e.type === 'pointerdown') {
        if (e.pointerType === 'mouse' && e.button !== 0) return
      } else if (e.type === 'mousedown') {
        if (e.button !== 0) return
      }

      const { x, y } = this.clientXYFromEvent(e)
      this.isPressing = true
      this._drag.active = true
      this._drag.moved = false
      this._drag.startX = x
      this._drag.startY = y
      this._drag.originLeft = this.pos.left
      this._drag.originTop = this.pos.top

      if (e.type === 'pointerdown' && hasPE) {
        this._activePointerId = e.pointerId
        this._usePointerListeners = true
        document.addEventListener('pointermove', this.onDocumentPointerMove, true)
        document.addEventListener('pointerup', this.onDocumentPointerUp, true)
        document.addEventListener('pointercancel', this.onDocumentPointerUp, true)
      } else if (e.type === 'touchstart') {
        document.addEventListener('touchmove', this.onLegacyTouchMove, { passive: false, capture: true })
        document.addEventListener('touchend', this.onLegacyTouchEnd)
        document.addEventListener('touchcancel', this.onLegacyTouchEnd)
      } else {
        document.addEventListener('mousemove', this.onLegacyMouseMove)
        document.addEventListener('mouseup', this.onLegacyMouseUp)
      }
    },

    applyDragByClient(x, y, ev) {
      if (!this._drag.active) return
      const dx = x - this._drag.startX
      const dy = y - this._drag.startY
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        this._drag.moved = true
        this.isDragging = true
      }
      this.pos.left = this._drag.originLeft + dx
      this.pos.top = this._drag.originTop + dy
      this.clampToViewport()
      if (ev && ev.cancelable) {
        if (ev.type === 'touchmove' || ev.pointerType === 'touch') {
          ev.preventDefault()
        } else if (this._drag.moved) {
          ev.preventDefault()
        }
      }
    },

    onDocumentPointerMove(e) {
      if (e.pointerId !== this._activePointerId) return
      this.applyDragByClient(e.clientX, e.clientY, e)
    },

    onDocumentPointerUp(e) {
      if (e.pointerId !== this._activePointerId) return
      this.finishDragSession()
    },

    onLegacyMouseMove(e) {
      this.applyDragByClient(e.clientX, e.clientY, e)
    },

    onLegacyMouseUp() {
      this.finishDragSession()
    },

    onLegacyTouchMove(e) {
      this.applyDragByClient(e.touches[0].clientX, e.touches[0].clientY, e)
    },

    onLegacyTouchEnd() {
      this.finishDragSession()
    },

    finishDragSession() {
      if (!this._drag.active) return
      this._drag.active = false
      this.isPressing = false
      this.detachGlobalListeners()

      if (this._drag.moved) {
        this.snapToNearestVerticalEdge()
        this.savePosition()
        this.suppressNextClick = true
      } else {
        this.pos.left = this._drag.originLeft
        this.pos.top = this._drag.originTop
      }
      this.isDragging = false
    }
  }
}
</script>

<style scoped>
.ai-assistant-anchor {
  position: fixed;
  z-index: 21000;
  pointer-events: auto;
  /* 子级菜单宽于 44px 锚点，必须可见溢出，否则菜单被当成窄盒裁字 */
  overflow: visible;
}

.assistant-fade-enter-active,
.assistant-fade-leave-active {
  transition: opacity 0.2s ease;
}
.assistant-fade-enter,
.assistant-fade-leave-to {
  opacity: 0;
}

.assistant-menu {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  box-sizing: border-box;
  /* 按文案撑开宽度，避免继承窄锚点宽度导致截字 */
  width: max-content;
  min-width: 268px;
  max-width: min(92vw, 340px);
  padding: 10px 10px;
  background: #f4f4f5;
  border-radius: 22px;
  box-shadow:
    0 8px 32px rgba(15, 23, 42, 0.12),
    0 2px 8px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  z-index: 5;
}

/* 靠右吸附：菜单右缘对齐小球，向左展开，避免贴屏幕右缘裁字 */
.ai-assistant-anchor.dock-right .assistant-menu {
  left: auto;
  right: 0;
  transform: none;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  margin: 0;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
}

.menu-item span {
  flex: 1 1 auto;
  overflow: visible;
}

.menu-item i {
  font-size: 18px;
  color: #4b5563;
  flex-shrink: 0;
}

.menu-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

.ai-assistant-float {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  border-radius: 50%;
  z-index: 6;
  transition:
    left 0.32s cubic-bezier(0.25, 0.82, 0.28, 1),
    top 0.32s cubic-bezier(0.25, 0.82, 0.28, 1),
    box-shadow 0.35s ease,
    filter 0.35s ease;
}

.ai-assistant-float.is-dragging {
  cursor: grabbing;
  transition: none;
}

.ai-assistant-float.is-dragging .float-inner {
  animation: none;
}

.ai-assistant-float.is-dragging .float-orbit {
  animation-play-state: paused;
}

.float-orbit {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  pointer-events: none;
  background: conic-gradient(
    from 0deg,
    rgba(124, 92, 255, 0.35),
    rgba(56, 189, 248, 0.28),
    rgba(167, 139, 250, 0.32),
    rgba(124, 92, 255, 0.35)
  );
  opacity: 0.45;
  filter: blur(5px);
  animation: orbit-spin 12s linear infinite;
  z-index: 0;
}

@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}

.ai-assistant-anchor:hover:not(.is-dragging) .float-orbit,
.ai-assistant-float.is-expanded-ui .float-orbit {
  opacity: 0.6;
}

.float-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  z-index: 1;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.88) 0%,
    rgba(245, 243, 255, 0.75) 100%
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    0 3px 16px rgba(99, 102, 241, 0.1),
    0 8px 24px rgba(15, 23, 42, 0.06);
  animation: float-bob 3.2s ease-in-out infinite;
}

.ai-assistant-anchor:hover:not(.is-dragging) .float-inner,
.ai-assistant-float.is-expanded-ui .float-inner {
  animation: float-bob-hover 2.8s ease-in-out infinite;
}

@keyframes float-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes float-bob-hover {
  0%,
  100% {
    transform: scale(1.04) translateY(0);
  }
  50% {
    transform: scale(1.04) translateY(-3px);
  }
}

.float-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
}

.float-face--idle {
  opacity: 1;
  z-index: 2;
}

.float-face--hover {
  opacity: 0;
  z-index: 3;
  pointer-events: none;
}

.ai-assistant-anchor:hover:not(.is-dragging) .float-face--idle,
.ai-assistant-float.is-expanded-ui .float-face--idle {
  opacity: 0;
}

.ai-assistant-anchor:hover:not(.is-dragging) .float-face--hover,
.ai-assistant-float.is-expanded-ui .float-face--hover {
  opacity: 1;
}

.hover-arrow {
  font-size: 20px;
  color: #6366f1;
  font-weight: bold;
}

.float-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-ai {
  width: 24px;
  height: 24px;
  display: block;
  object-fit: contain;
  -webkit-user-drag: none;
  pointer-events: none;
  filter: drop-shadow(0 1px 4px rgba(99, 102, 241, 0.2));
}

.float-glow {
  position: absolute;
  top: -15%;
  left: 8%;
  width: 84%;
  height: 75%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 50% 40%,
    rgba(129, 140, 248, 0.35) 0%,
    transparent 65%
  );
  pointer-events: none;
  z-index: 0;
}

.ai-assistant-float.is-pressing:not(.is-dragging) .float-inner {
  transform: scale(0.95);
  animation: none;
}

.dark .float-inner {
  background: linear-gradient(145deg, rgba(30, 27, 46, 0.92), rgba(40, 35, 65, 0.85));
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .assistant-menu {
  background: #2a2a32;
  border-color: rgba(255, 255, 255, 0.08);
}
.dark .menu-item {
  color: #e5e7eb;
}
.dark .menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
}
.dark .menu-item i {
  color: #9ca3af;
}
.dark .hover-arrow {
  color: #a5b4fc;
}

@media (max-width: 768px) {
  .icon-ai {
    width: 22px;
    height: 22px;
  }
  .assistant-menu {
    min-width: 252px;
    max-width: calc(100vw - 24px);
    border-radius: 18px;
  }
  .menu-item {
    white-space: normal;
    align-items: flex-start;
  }
  .menu-item span {
    white-space: normal;
    word-break: break-word;
  }
}
</style>

<style lang="scss">
/* 会话框：豆包式大圆角 + 浅灰底（非 scoped，作用于 append-to-body） */
.assistant-rule-dialog.el-dialog {
  border-radius: 20px;
  overflow: hidden;
  margin-top: 8vh !important;
  background: linear-gradient(180deg, #f3f4f6 0%, #ebecef 100%);
  box-shadow:
    0 20px 56px rgba(15, 23, 42, 0.2),
    0 4px 16px rgba(15, 23, 42, 0.08);
}

@media (max-width: 560px) {
  .assistant-rule-dialog.el-dialog {
    width: 92vw !important;
  }
}

.assistant-rule-dialog .el-dialog__header {
  display: none;
}

.assistant-rule-dialog .el-dialog__body {
  padding: 0;
  background: transparent;
}

.rule-dialog-shell {
  display: flex;
  flex-direction: column;
  max-height: min(76vh, 680px);
}

.rule-dlg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 0;
  gap: 8px;
}

.rule-icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}
.rule-icon-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.rule-dlg-drag-hint {
  flex: 1;
  height: 4px;
  max-width: 40px;
  margin: 0 auto;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.12);
}

.rule-dlg-actions {
  display: flex;
  align-items: center;
}

.rule-dlg-new-txt {
  font-size: 13px;
  margin-left: 2px;
}

.rule-dlg-title {
  margin: 6px 0 10px;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  text-align: center;
  letter-spacing: 0.2px;
}

.rule-msg-list {
  flex: 1;
  min-height: 200px;
  max-height: 42vh;
  overflow-y: auto;
  padding: 10px 16px 14px;
  scroll-behavior: smooth;
}

.rule-msg-list::-webkit-scrollbar {
  width: 8px;
}

.rule-msg-list::-webkit-scrollbar-thumb {
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.55);
}

.rule-msg-list::-webkit-scrollbar-track {
  background: transparent;
}

.rule-msg {
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.rule-msg--user {
  align-items: flex-end;
}

.rule-msg-bubble {
  max-width: 92%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.55;
  color: #1f2937;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 6px 18px rgba(15, 23, 42, 0.06),
    0 1px 4px rgba(15, 23, 42, 0.04);
  word-break: break-word;
}

.rule-msg-bubble p {
  margin: 0.4em 0;
}
.rule-msg-bubble p:first-child {
  margin-top: 0;
}
.rule-msg-bubble h3 {
  margin: 0.5em 0 0.35em;
  font-size: 15px;
}

.rule-msg--user .rule-msg-bubble {
  background: linear-gradient(180deg, #e3e8ff 0%, #dbe4ff 100%);
  color: #1e1b4b;
}

.rule-msg-bubble pre {
  margin: 0.55em 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #f8fafc;
  overflow-x: auto;
}

.rule-msg-bubble code {
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 12px;
  color: #0f172a;
}

.rule-msg-bubble :not(pre) > code {
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.06);
}

.rule-msg-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  padding: 0 4px;
}

.rule-msg-bubble--typing {
  display: flex;
  gap: 4px;
  align-items: center;
  min-height: 36px;
}
.rule-msg-bubble--typing .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: rule-typing 1.2s ease-in-out infinite;
}
.rule-msg-bubble--typing .dot:nth-child(2) {
  animation-delay: 0.15s;
}
.rule-msg-bubble--typing .dot:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes rule-typing {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: scale(0.9);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.rule-input-wrap {
  padding: 12px 14px 14px;
  background: linear-gradient(180deg, rgba(241, 243, 247, 0.92) 0%, #eceef2 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.rule-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  background: #fff;
  color: #111827;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.rule-textarea:focus {
  border-color: rgba(99, 102, 241, 0.45);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.rule-textarea::placeholder {
  color: #9ca3af;
}

.rule-input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.rule-hint {
  font-size: 11px;
  color: #9ca3af;
}

.rule-send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: opacity 0.2s, transform 0.15s;
}
.rule-send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.rule-send-btn:not(:disabled):hover {
  transform: scale(1.05);
}
</style>
