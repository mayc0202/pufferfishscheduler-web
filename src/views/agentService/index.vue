<template>
  <div class="agent-service-page" :class="{ 'dark-mode': isDark }">
    <!-- 头部 -->
    <div class="agent-header">
      <div class="header-left">
        <div class="header-avatar">
          <img
            :src="icons.logo_2"
            class="header-logo-img"
            alt="AI智能助手"
            draggable="false"
          >
        </div>
        <div class="header-info">
          <h2>AI智能助手</h2>
          <span class="status" :class="{ online: !isLoading }">
            {{ isLoading ? "思考中..." : "在线" }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <button class="back-btn" title="返回" @click="goBack">←</button>
      </div>
    </div>

    <div class="chat-container">
      <!-- 历史记录侧边栏 -->
      <Transition name="slide">
        <div v-if="showHistory" class="history-sidebar">
          <div class="history-title">历史会话记录</div>
          <div class="history-header">
            <button class="new-chat-btn" @click="startNewChat">
              <i class="el-icon-plus" />
              <span>开启新对话</span>
            </button>
          </div>
          <div class="history-list">
            <template v-if="groupedChatHistory.length > 0">
              <div
                v-for="group in groupedChatHistory"
                :key="group.key"
                class="history-group"
              >
                <div class="history-group-title">{{ group.label }}</div>
                <div
                  v-for="chat in group.items"
                  :key="chat.id"
                  class="history-item"
                  :class="{ active: currentChatId === chat.id }"
                  @click="loadChat(chat.id)"
                >
                  <el-icon class="icon el-icon-chat-dot-round" />
                  <div class="item-content">
                    <span class="title">{{ chat.title || "新对话" }}</span>
                    <span class="time">{{ formatHistoryDetailTime(chat.timestamp) }}</span>
                  </div>
                  <button
                    class="history-more-btn el-icon-more"
                    title="更多"
                    @click.stop="toggleChatMenu(chat.id)"
                  />
                  <div
                    v-if="activeHistoryMenuId === chat.id"
                    class="history-item-menu"
                    @click.stop
                  >
                    <button class="history-item-menu-btn" @click="renameChat(chat)">
                      <i class="el-icon-edit-outline" />
                      <span>重命名</span>
                    </button>
                    <button class="history-item-menu-btn" @click="togglePinChat(chat)">
                      <i class="el-icon-top" />
                      <span>{{ chat.pinned ? '取消置顶' : '置顶' }}</span>
                    </button>
                    <button class="history-item-menu-btn danger" @click="deleteChat(chat.id)">
                      <i class="el-icon-delete" />
                      <span>删除</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="empty-history">
              <p>暂无历史记录</p>
            </div>
          </div>
        </div>
      </Transition>
      <button
        class="history-toggle-handle"
        :class="{ 'history-toggle-handle--expanded': showHistory }"
        :title="showHistory ? '收起边栏' : '展开边栏'"
        @click="showHistory = !showHistory"
      >
        <i :class="showHistory ? 'el-icon-s-fold' : 'el-icon-s-unfold'" />
      </button>

      <!-- 主聊天区域：随容器铺满，仅保留适度边距 -->
      <div class="chat-main" :class="{ 'with-history': showHistory }">
        <div class="chat-main-column">
          <!-- 消息列表 -->
          <div
            ref="messageList"
            class="message-list"
            :class="{ 'message-list--welcome': isWelcomeState }"
            @scroll="handleScroll"
          >
            <!-- 欢迎消息 -->
            <div
              v-if="messages.length === 1 && messages[0].type === 'bot'"
              class="welcome-message"
            >
              <div class="welcome-content">
                <h3>你好！我是PufferfishScheduler AI智能助手</h3>
                <p>我可以帮你解答问题、处理数据、分析信息...</p>
                <div class="suggest-questions">
                  <button
                    v-for="(q, index) in suggestQuestions"
                    :key="index"
                    class="suggest-btn"
                    @click="quickQuestion(q)"
                  >
                    {{ q }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 消息列表 -->
            <div
              v-for="(message, index) in displayedMessages"
              :key="index"
              :class="['message-item', message.type + '-message']"
            >
              <div class="message-avatar">
                <img :src="message.type === 'bot' ? icons.aiAgent : icons.aiUser" class="icon">
              </div>
              <div
                class="message-content-wrapper"
                :class="{
                  'message-content-wrapper--typing':
                    message.type === 'bot' && message.streaming && !message.content
                }"
              >
                <div
                  v-if="message.type === 'bot' && message.streaming && !message.content"
                  class="message-content loading"
                >
                  <span class="dot" />
                  <span class="dot" />
                  <span class="dot" />
                </div>
                <div
                  v-else
                  class="message-content"
                  v-html="formatMessage(message.content)"
                />
                <div class="message-footer">
                  <span class="message-time">{{
                    formatTime(message.timestamp)
                  }}</span>
                  <button
                    v-if="message.type === 'bot' && message.content"
                    class="copy-btn el-icon-document-copy"
                    title="复制"
                    @click="copyMessage(message.content)"
                  />
                </div>
              </div>
            </div>

            <!-- 图表容器 -->
            <div v-if="chartConfig" ref="chartRef" class="chart-container" />

            <!-- 数据表格容器 -->
            <div v-if="tableData" class="table-container" v-html="tableData" />
          </div>

          <!-- 输入区域 -->
          <div class="input-area">
            <textarea
              ref="inputRef"
              v-model="inputMessage"
              placeholder="请输入您的问题... (Enter发送，Shift+Enter换行)"
              rows="1"
              :disabled="isLoading"
              @keydown.enter.prevent="handleKeyDown"
              @input="adjustTextareaHeight"
            />

            <div class="input-actions">
              <button
                v-if="inputMessage"
                class="action-btn el-icon-close"
                title="清空"
                @click="clearInput"
              />
              <button
                class="send-btn el-icon-s-promotion"
                :disabled="isLoading || !inputMessage.trim()"
                :class="{ sending: isLoading }"
                @click="sendMessage"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import * as echarts from 'echarts'
import icons from '@/assets/icon/icons.js'
import {
  askAgentStream,
  getAgentHistory,
  clearAgentHistory
} from '@/api/agent/chat'

export default {
  name: 'AIAgentAssistant',
  data() {
    return {
      icons,
      inputMessage: '',
      messages: [],
      isLoading: false,
      isStreaming: false,
      showHistory: false,
      showBookingModal: false,
      bookingInfo: '',
      chartConfig: null,
      tableData: null,
      currentChatId: null,
      chatHistory: [],
      activeController: null,
      isDark: false,
      activeHistoryMenuId: '',
      suggestQuestions: [
        '你们有哪些产品功能？',
        '如何接入数据源？',
        'ETL流程怎么配置？',
        '监控预警怎么设置？'
      ],
      myChart: null
    }
  },
  computed: {
    isWelcomeState() {
      return this.messages.length === 1 && this.messages[0].type === 'bot'
    },
    displayedMessages() {
      // 欢迎态下隐藏首条占位欢迎语，避免与欢迎卡片重复展示
      return this.isWelcomeState ? [] : this.messages
    },
    groupedChatHistory() {
      const groups = [
        { key: 'pinned', label: '置顶', items: [] },
        { key: 'today', label: '今天', items: [] },
        { key: 'week', label: '7 天内', items: [] },
        { key: 'month', label: '30 天内', items: [] },
        { key: 'older', label: '更早', items: [] }
      ]
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const weekMs = 7 * 24 * 60 * 60 * 1000
      const monthMs = 30 * 24 * 60 * 60 * 1000

      ;(this.chatHistory || []).forEach((chat) => {
        if (chat.pinned) {
          groups[0].items.push(chat)
          return
        }
        const ts = new Date(chat.timestamp).getTime()
        const diff = now.getTime() - ts
        if (!Number.isFinite(ts)) {
          groups[4].items.push(chat)
        } else if (ts >= startOfToday) {
          groups[1].items.push(chat)
        } else if (diff <= weekMs) {
          groups[2].items.push(chat)
        } else if (diff <= monthMs) {
          groups[3].items.push(chat)
        } else {
          groups[4].items.push(chat)
        }
      })

      return groups.filter(g => g.items.length > 0)
    }
  },
  watch: {
    chartConfig: {
      handler(val) {
        if (val) {
          this.renderChart(val)
        }
      },
      deep: true
    }
  },
  mounted() {
    this.checkDarkMode()
    this.startNewChat()

    // 监听暗色模式变化
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        this.isDark = e.matches
      })
    document.addEventListener('click', this.onDocumentClickHistoryMenu, true)
  },
  beforeUnmount() {
    if (this.activeController) {
      this.activeController.abort()
      this.activeController = null
    }
    if (this.myChart) {
      this.myChart.dispose()
    }
    document.removeEventListener('click', this.onDocumentClickHistoryMenu, true)
  },
  methods: {
    onDocumentClickHistoryMenu() {
      this.activeHistoryMenuId = ''
    },
    toggleChatMenu(chatId) {
      this.activeHistoryMenuId = this.activeHistoryMenuId === chatId ? '' : chatId
    },
    // 初始化欢迎消息
    initWelcomeMessage() {
      if (this.messages.length === 0) {
        this.messages.push({
          type: 'bot',
          content: '你好！我是AI智能助手，有什么可以帮助你的吗？',
          timestamp: new Date()
        })
      }
    },

    // 检查暗色模式
    checkDarkMode() {
      this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    },

    // 返回上一页
    goBack() {
      this.$router.back()
    },

    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date

      if (diff < 60 * 1000) {
        return '刚刚'
      } else if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + '分钟前'
      } else if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      } else {
        return date.toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit'
        })
      }
    },
    formatHistoryDetailTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      if (!Number.isFinite(date.getTime())) return ''
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    // 格式化消息（支持Markdown）
    formatMessage(content) {
      if (!content) return ''

      // 配置marked
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
      })

      const html = marked.parse(content)
      return DOMPurify.sanitize(html, {
        ADD_TAGS: ['think', 'code', 'pre'],
        ADD_ATTR: ['class', 'language']
      })
    },

    // 复制消息
    async copyMessage(content) {
      try {
        await navigator.clipboard.writeText(content)
        alert('复制成功')
      } catch (err) {
        console.error('复制失败:', err)
        alert('复制失败')
      }
    },

    // 快速问题
    quickQuestion(question) {
      this.inputMessage = question
      this.sendMessage()
    },

    // 调整输入框高度
    adjustTextareaHeight() {
      const textarea = this.$refs.inputRef
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
      }
    },

    // 清空输入框
    clearInput() {
      this.inputMessage = ''
      this.adjustTextareaHeight()
    },

    // 处理键盘事件
    handleKeyDown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    },

    // 发送消息（流式）
    async sendMessage() {
      if (this.isLoading || !this.inputMessage.trim()) return

      const messageContent = this.inputMessage.trim()

      // 添加用户消息
      this.messages.push({
        type: 'user',
        content: messageContent,
        timestamp: new Date()
      })

      // 清空输入框
      this.inputMessage = ''
      this.adjustTextareaHeight()

      // 滚动到底部
      this.scrollToBottom()

      // 显示加载状态
      this.isLoading = true
      const botMessage = {
        type: 'bot',
        content: '',
        timestamp: new Date(),
        streaming: true
      }
      this.messages.push(botMessage)
      this.scrollToBottom()

      if (!this.currentChatId) {
        this.currentChatId = Date.now().toString()
      }

      const controller = new AbortController()
      this.activeController = controller

      try {
        await askAgentStream({
          chatId: this.currentChatId,
          question: messageContent,
          signal: controller.signal,
          onChunk: (chunk, meta) => {
            if (meta && meta.replace) {
              botMessage.content = chunk
            } else {
              botMessage.content += chunk
            }
            botMessage.timestamp = new Date()
            this.$forceUpdate()
            this.scrollToBottom()
          }
        })
      } catch (error) {
        if (error && error.name !== 'AbortError') {
          botMessage.content =
            botMessage.content || '请求失败，请稍后重试。'
          this.$message.error(error.message || '请求智能体失败')
        }
      } finally {
        this.isLoading = false
        botMessage.streaming = false
        this.activeController = null
        this.syncHistoryMeta()
      }
      if (!botMessage.content) {
        botMessage.content = '未返回有效内容，请重试。'
      }
    },

    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        const messageList = this.$refs.messageList
        if (messageList) {
          messageList.scrollTop = messageList.scrollHeight
        }
      })
    },

    // 处理滚动
    handleScroll(e) {
      // 可以在这里实现加载更多历史消息
    },

    // 开始新对话
    async startNewChat() {
      if (this.activeController) {
        this.activeController.abort()
      }
      const newChatId = Date.now().toString()
      this.currentChatId = newChatId
      this.messages = []
      this.initWelcomeMessage()
      this.showHistory = true
      this.activeHistoryMenuId = ''
      this.chatHistory = this.upsertHistoryItem({
        id: newChatId,
        title: '新对话',
        timestamp: new Date().toISOString(),
        pinned: false
      })
    },

    // 对话历史元信息去重并按时间排序
    upsertHistoryItem(item) {
      const records = Array.isArray(this.chatHistory) ? [...this.chatHistory] : []
      const idx = records.findIndex(c => c.id === item.id)
      if (idx > -1) {
        records[idx] = { ...records[idx], ...item }
      } else {
        records.unshift({ pinned: false, ...item })
      }
      return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    },

    // 拉取当前会话历史消息
    async fetchCurrentChatMessages(chatId) {
      const res = await getAgentHistory(chatId)
      const list = Array.isArray(res && res.data) ? res.data : []
      if (!list.length) {
        return [{
          type: 'bot',
          content: '你好！我是AI智能助手，有什么可以帮助你的吗？',
          timestamp: new Date()
        }]
      }
      const mapped = list
        .map((m) => {
          const rawType = (m.messageType || m.type || '').toString().toLowerCase()
          const type = rawType.includes('user') ? 'user' : 'bot'
          const content =
            (m.text != null ? String(m.text) : '') ||
            (m.content != null ? String(m.content) : '')
          return {
            type,
            content,
            timestamp: new Date()
          }
        })
        .filter(msg => msg.content)
      return mapped.length ? mapped : [{
        type: 'bot',
        content: '你好！我是AI智能助手，有什么可以帮助你的吗？',
        timestamp: new Date()
      }]
    },

    // 加载聊天历史（从后端按 chatId 拉取）
    async loadChat(chatId) {
      if (!chatId) return
      try {
        this.isLoading = true
        this.messages = await this.fetchCurrentChatMessages(chatId)
        this.currentChatId = chatId
        this.activeHistoryMenuId = ''
        this.scrollToBottom()
      } catch (error) {
        this.$message.error('加载历史对话失败')
      } finally {
        this.isLoading = false
      }
    },

    // 同步侧边栏历史标题与时间
    syncHistoryMeta() {
      if (!this.currentChatId) return
      const firstUser = (this.messages || []).find(m => m.type === 'user' && m.content)
      const title = firstUser ? firstUser.content.slice(0, 24) : '新对话'
      this.chatHistory = this.upsertHistoryItem({
        id: this.currentChatId,
        title,
        timestamp: new Date().toISOString()
      })
    },

    // 清空所有历史
    async clearAllHistory() {
      if (!this.currentChatId) return
      try {
        await this.$confirm('确定要清空当前会话的历史消息吗？', '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        })
      } catch (e) {
        return
      }
      try {
        await clearAgentHistory(this.currentChatId)
        this.$message.success('已清空当前会话历史')
        this.messages = []
        this.initWelcomeMessage()
        this.chatHistory = this.chatHistory.filter(c => c.id !== this.currentChatId)
      } catch (error) {
        this.$message.error('清空历史失败')
      }
    },
    async deleteChat(chatId) {
      if (!chatId) return
      try {
        await this.$confirm('确定删除该会话吗？删除后不可恢复。', '提示', {
          type: 'warning',
          confirmButtonText: '删除',
          cancelButtonText: '取消'
        })
      } catch (e) {
        return
      }

      try {
        await clearAgentHistory(chatId)
        this.chatHistory = (this.chatHistory || []).filter(c => c.id !== chatId)
        this.$message.success('会话已删除')
        this.activeHistoryMenuId = ''

        if (this.currentChatId === chatId) {
          await this.startNewChat()
        }
      } catch (error) {
        this.$message.error('删除会话失败')
      }
    },
    async renameChat(chat) {
      if (!chat || !chat.id) return
      try {
        const { value } = await this.$prompt('请输入新的会话名称', '重命名', {
          inputValue: chat.title || '新对话',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /^(?!\s*$).+/,
          inputErrorMessage: '名称不能为空'
        })
        const title = (value || '').trim()
        if (!title) return
        this.chatHistory = (this.chatHistory || []).map((c) => {
          if (c.id === chat.id) return { ...c, title }
          return c
        })
        this.activeHistoryMenuId = ''
      } catch (e) {
        // cancel
      }
    },
    togglePinChat(chat) {
      if (!chat || !chat.id) return
      this.chatHistory = (this.chatHistory || []).map((c) => {
        if (c.id === chat.id) {
          return { ...c, pinned: !c.pinned }
        }
        return c
      })
      this.activeHistoryMenuId = ''
    },

    // 渲染图表
    renderChart(config) {
      this.$nextTick(() => {
        if (!this.$refs.chartRef) return

        if (this.myChart) {
          this.myChart.dispose()
        }

        this.myChart = echarts.init(this.$refs.chartRef)
        this.myChart.setOption(config)
      })
    },

    // 跳转到知识库管理页面（带标识以便列表页显示返回）
    goToKnowledgeBase() {
      this.$router.push({
        path: '/agent-manage/knowledge-base',
        query: { from: 'agent-assistant' }
      })
    }
  }
}
</script>

<style scoped>
.agent-service-page {
  --as-bg: #e8eef5;
  --as-surface: #ffffff;
  --as-surface-2: #f1f5f9;
  --as-text: #0f172a;
  --as-text-muted: #64748b;
  --as-border: rgba(15, 23, 42, 0.09);
  --as-accent: #0ea5e9;
  --as-accent-deep: #0284c7;
  --as-violet: #6366f1;
  --as-header-from: #0f172a;
  --as-header-to: #1e293b;
  --as-shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
  --as-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
  --as-bubble-user: linear-gradient(158deg, #dbeafe 0%, #e8eeff 48%, #e0e7ff 100%);
  --as-radius: 20px;
  --as-font: ui-sans-serif, system-ui, -apple-system, "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;

  width: 100%;
  height: 100vh;
  background-color: var(--as-bg);
  background-image:
    radial-gradient(ellipse 100% 60% at 50% -15%, rgba(14, 165, 233, 0.09), transparent 55%),
    radial-gradient(ellipse 70% 45% at 100% 0%, rgba(99, 102, 241, 0.07), transparent 50%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--as-font);
  color: var(--as-text);
}

/* 头部 */
.agent-header {
  position: relative;
  background: linear-gradient(
    145deg,
    var(--as-header-from) 0%,
    var(--as-header-to) 55%,
    #172554 100%
  );
  color: #f8fafc;
  padding: 14px 20px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  z-index: 10;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.25);
}

.agent-header::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: linear-gradient(90deg, #22d3ee, #6366f1, #a78bfa);
  opacity: 0.85;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  position: relative;
  z-index: 1;
  background: rgba(248, 250, 252, 0.12);
  border: 1px solid rgba(248, 250, 252, 0.18);
  color: #f8fafc;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  font-size: 18px;
  line-height: 1;
}

.back-btn:hover {
  background: rgba(248, 250, 252, 0.22);
  border-color: rgba(248, 250, 252, 0.35);
  transform: translateX(-1px);
}

.header-avatar {
  position: relative;
  z-index: 1;
  width: 44px;
  height: 44px;
  padding: 2px;
  box-sizing: border-box;
  background: rgba(248, 250, 252, 0.1);
  border: 1px solid rgba(248, 250, 252, 0.22);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.header-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 11px;
  -webkit-user-drag: none;
  user-select: none;
}

.header-info {
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.header-info h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.35;
}

.status {
  font-size: 12px;
  color: rgba(248, 250, 252, 0.72);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.status::before {
  content: "";
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f87171;
  flex-shrink: 0;
}

.status.online::before {
  background: #34d399;
  animation: status-pulse 2.2s ease-out infinite;
}

@keyframes status-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.45);
  }
  70% {
    box-shadow: 0 0 0 7px rgba(52, 211, 153, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.35);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(14, 165, 233, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(14, 165, 233, 0);
  }
}

.header-right {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
}

/* 聊天容器 */
.chat-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* 历史记录侧边栏 */
.history-sidebar {
  width: 248px;
  background: #f3f4f6;
  border-right: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: none;
}

.history-toggle-handle {
  position: absolute;
  top: 12px;
  left: 8px;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  background: #ffffff;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 25;
  transition: left 0.2s ease, right 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.history-toggle-handle--expanded {
  left: 214px;
  right: auto;
}

.history-toggle-handle:hover {
  background: #f3f4f6;
  border-color: rgba(59, 130, 246, 0.25);
  color: #2563eb;
}

.history-header {
  padding: 6px 10px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-bottom: none;
  background: transparent;
}

.history-title {
  padding: 12px 48px 6px 12px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: #1f2937;
}

.new-chat-btn {
  flex: 1;
  height: 40px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
  color: #111827;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.new-chat-btn:hover {
  border-color: rgba(59, 130, 246, 0.28);
  background: #f8fbff;
}

.clear-history {
  background: transparent;
  border: none;
  color: var(--as-text-muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  font-size: 17px;
}

.clear-history:hover {
  background: rgba(14, 165, 233, 0.1);
  color: var(--as-accent-deep);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px 14px;
}

.history-group + .history-group {
  margin-top: 12px;
}

.history-group-title {
  padding: 7px 8px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}

.history-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
  margin-bottom: 3px;
  border: 1px solid transparent;
}

.history-item:hover {
  background: #f3f4f6;
}

.history-item.active {
  background: #eaf2ff;
  border-color: #cfe0ff;
  box-shadow: none;
}

.history-item .icon {
  font-size: 14px;
  color: #9ca3af;
  flex-shrink: 0;
  opacity: 0.8;
}

.history-more-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.16s ease, background 0.16s ease, color 0.16s ease;
  flex-shrink: 0;
}

.history-item:hover .history-more-btn,
.history-item.active .history-more-btn {
  opacity: 1;
}

.history-more-btn:hover {
  background: rgba(15, 23, 42, 0.08);
  color: #4b5563;
}

.history-item-menu {
  position: absolute;
  right: 8px;
  top: calc(100% - 2px);
  width: 122px;
  padding: 6px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
  z-index: 8;
}

.history-item-menu-btn {
  width: 100%;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  cursor: pointer;
}

.history-item-menu-btn:hover {
  background: #f3f4f6;
}

.history-item-menu-btn.danger {
  color: #dc2626;
}

.history-item-menu-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.item-content {
  flex: 1;
  min-width: 0;
}

.title {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
  line-height: 1.35;
}

.time {
  font-size: 10px;
  color: #9ca3af;
  opacity: 1;
}

.empty-history {
  text-align: center;
  padding: 40px 16px;
  color: var(--as-text-muted);
  font-size: 13px;
}

/* 主聊天区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  transition: all 0.3s;
}

.chat-main.with-history {
  width: calc(100% - 248px);
}

/* 主栏：占满可用宽度，超宽屏用略大边距避免贴边 */
.chat-main-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 clamp(16px, 2.2vw, 32px);
  box-sizing: border-box;
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0 20px;
  scroll-behavior: smooth;
}

.message-list--welcome {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: clamp(24px, 8vh, 72px);
}

.message-list::-webkit-scrollbar {
  width: 8px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.12);
  border-radius: 100px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 23, 42, 0.22);
  background-clip: padding-box;
}

.message-item {
  display: flex;
  align-items: flex-end;
  margin-bottom: 22px;
  gap: 2px;
  animation: fadeIn 0.32s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bot-message {
  flex-direction: row;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  font-size: 24px;
  margin: 0 4px 22px;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #ffffff, #f8fafc);
  border-radius: 12px;
  border: 1px solid var(--as-border);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.05),
    0 6px 16px rgba(15, 23, 42, 0.06);
}

.user-message .message-avatar {
  background: linear-gradient(160deg, #1d4ed8, #312e81);
  border-color: rgba(30, 64, 175, 0.35);
  box-shadow:
    0 2px 4px rgba(30, 64, 175, 0.25),
    0 8px 20px rgba(49, 46, 129, 0.18);
}

.message-avatar .icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
  display: block;
}

.message-content-wrapper {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
}

.message-content-wrapper--typing {
  max-width: 124px;
}

.message-content {
  padding: 14px 18px 15px;
  border-radius: var(--as-radius);
  line-height: 1.65;
  font-size: 15px;
  letter-spacing: 0.01em;
  word-wrap: break-word;
}

.bot-message .message-content {
  background: var(--as-surface);
  color: var(--as-text);
  border: 1px solid var(--as-border);
  border-top-left-radius: 8px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.85) inset,
    0 2px 8px rgba(15, 23, 42, 0.04),
    0 12px 32px rgba(15, 23, 42, 0.06);
}

.user-message .message-content {
  background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
  color: #ffffff;
  border: none;
  border-top-right-radius: 6px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
}

.user-message .message-content :deep(p) {
  color: #ffffff;
}

.user-message .message-content :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.user-message .message-content :deep(pre) {
  background: rgba(0, 0, 0, 0.15);
  border: none;
  color: #ffffff;
}

.message-content :deep(p) {
  margin: 0 0 8px;
}

.message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.message-content :deep(code) {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.message-content :deep(pre) {
  background: #f1f5f9;
  padding: 12px 14px;
  border-radius: 10px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid var(--as-border);
}

.message-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 0 2px 0 4px;
}

.user-message .message-footer {
  justify-content: flex-end;
  padding: 0 4px 0 2px;
}

.message-time {
  font-size: 12px;
  color: var(--as-text-muted);
  opacity: 0.92;
  letter-spacing: 0.02em;
}

.copy-btn {
  background: transparent;
  border: none;
  color: var(--as-text-muted);
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease, color 0.2s ease;
  font-size: 15px;
}

.copy-icon {
  width: 20px;
  height: 20px;
}

.message-item:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  background: rgba(14, 165, 233, 0.12);
  color: var(--as-accent-deep);
}

/* 加载动画 */
.message-content.loading {
  display: flex;
  gap: 6px;
  padding: 16px 20px;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border-top-left-radius: 8px;
}

.message-content.loading .dot {
  width: 8px;
  height: 8px;
  background: linear-gradient(180deg, #94a3b8, #64748b);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.message-content.loading .dot:nth-child(1) {
  animation-delay: -0.32s;
}
.message-content.loading .dot:nth-child(2) {
  animation-delay: -0.16s;
}
.message-content.loading .dot:nth-child(3) {
  animation-delay: 0;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 欢迎消息 */
.welcome-message {
  width: 100%;
  max-width: 900px;
  text-align: center;
  padding: 0 0 24px;
}

.welcome-content {
  max-width: 860px;
  margin: 0 auto;
  padding: 22px 20px 24px;
  background: var(--as-surface);
  border: 1px solid var(--as-border);
  border-radius: 16px;
  box-shadow:
    var(--as-shadow-sm),
    0 10px 28px rgba(15, 23, 42, 0.06);
}

.welcome-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.welcome-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--as-text);
  margin: 0 0 10px;
  letter-spacing: 0.01em;
  line-height: 1.45;
}

.welcome-content p {
  color: var(--as-text-muted);
  margin: 0 0 22px;
  font-size: 14px;
  line-height: 1.55;
}

.suggest-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.suggest-btn {
  background: var(--as-surface-2);
  border: 1px solid var(--as-border);
  padding: 9px 16px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--as-text);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease,
    box-shadow 0.2s ease;
}

.suggest-btn:hover {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(99, 102, 241, 0.1));
  border-color: rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.12);
}

/* 图表和表格容器 */
.chart-container {
  width: 100%;
  height: 400px;
  margin: 20px 0;
  background: var(--as-surface);
  border-radius: var(--as-radius);
  padding: 16px;
  border: 1px solid var(--as-border);
  box-shadow: var(--as-shadow-sm);
}

.table-container {
  margin: 20px 0;
}

.table-container :deep(table) {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-container :deep(th) {
  background: #f8f9fa;
  padding: 12px;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

.table-container :deep(td) {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  color: #666;
}

.table-container :deep(tr:last-child td) {
  border-bottom: none;
}

/* 输入区域 */
.input-area {
  padding: 12px 0 18px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  border-top: none;
  background: transparent;
  box-shadow: none;
}

.input-area textarea {
  flex: 1;
  resize: none;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 13px 18px;
  font-size: 14px;
  line-height: 1.55;
  max-height: 150px;
  min-height: 50px;
  font-family: inherit;
  color: var(--as-text);
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 6px 18px rgba(15, 23, 42, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.input-area textarea:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.45);
  background: var(--as-surface);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.input-area textarea:disabled {
  background: var(--as-surface-2);
  opacity: 0.75;
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: var(--as-surface-2);
  border: 1px solid var(--as-border);
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--as-text-muted);
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  font-size: 18px;
}

.action-btn:hover {
  background: rgba(248, 113, 113, 0.08);
  border-color: rgba(248, 113, 113, 0.25);
  color: #dc2626;
}

.send-btn {
  background: linear-gradient(145deg, #0ea5e9 0%, #6366f1 55%, #7c3aed 100%);
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  font-size: 18px;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
}

.send-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  box-shadow: none;
}

.send-btn.sending {
  animation: pulse 1.5s ease-out infinite;
}

/* 弹窗样式 */
.booking-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.modal-header .close-btn {
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  font-size: 18px;
}

.modal-header .close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
  color: #666;
  line-height: 1.6;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  text-align: right;
}

.confirm-btn {
  background: linear-gradient(145deg, #0ea5e9, #6366f1);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 999px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.confirm-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
}

/* 暗色模式 */
.dark-mode {
  --as-bg: #0f1419;
  --as-surface: #1a1f2e;
  --as-surface-2: #141824;
  --as-text: #f1f5f9;
  --as-text-muted: #94a3b8;
  --as-border: rgba(248, 250, 252, 0.08);
  --as-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  --as-shadow-sm: 0 2px 12px rgba(0, 0, 0, 0.25);
  --as-header-from: #020617;
  --as-header-to: #0f172a;

  background-color: var(--as-bg);
  background-image:
    radial-gradient(ellipse 100% 50% at 50% 0%, rgba(14, 165, 233, 0.12), transparent 45%),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(99, 102, 241, 0.1), transparent 50%);
}

.dark-mode .agent-header {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.dark-mode .history-sidebar {
  background: #0f131f;
  border-right-color: rgba(248, 250, 252, 0.06);
}

.dark-mode .history-title {
  color: #f3f4f6;
}

.dark-mode .history-toggle-handle {
  background: #171c2a;
  border-color: rgba(248, 250, 252, 0.12);
  color: #9ca3af;
}

.dark-mode .history-toggle-handle:hover {
  background: #1c2333;
  border-color: rgba(129, 140, 248, 0.35);
  color: #c7d2fe;
}

.dark-mode .new-chat-btn {
  background: #171c2a;
  border-color: rgba(248, 250, 252, 0.1);
  color: #e5e7eb;
}

.dark-mode .new-chat-btn:hover {
  background: #1c2333;
  border-color: rgba(129, 140, 248, 0.35);
}

.dark-mode .history-item:hover {
  background: rgba(148, 163, 184, 0.12);
}

.dark-mode .history-item.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(96, 165, 250, 0.4);
}

.dark-mode .title {
  color: #e5e7eb;
}

.dark-mode .time,
.dark-mode .history-group-title,
.dark-mode .history-item .icon {
  color: #94a3b8;
}

.dark-mode .history-more-btn {
  color: #94a3b8;
}

.dark-mode .history-item-menu {
  background: #171c2a;
  border-color: rgba(248, 250, 252, 0.1);
}

.dark-mode .history-item-menu-btn {
  color: #e5e7eb;
}

.dark-mode .history-item-menu-btn:hover {
  background: rgba(148, 163, 184, 0.14);
}

.dark-mode .history-item-menu-btn.danger {
  color: #fca5a5;
}

.dark-mode .welcome-content {
  background: var(--as-surface);
}

.dark-mode .input-area textarea {
  background: rgba(26, 31, 46, 0.94);
  border-color: rgba(248, 250, 252, 0.12);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.28),
    0 8px 20px rgba(0, 0, 0, 0.22);
}

.dark-mode .bot-message .message-content {
  background: var(--as-surface);
  color: var(--as-text);
}

.dark-mode .user-message .message-content {
  background: linear-gradient(145deg, rgba(30, 58, 138, 0.55), rgba(67, 56, 202, 0.45));
  color: #e0e7ff;
  border-color: rgba(129, 140, 248, 0.25);
}

.dark-mode .message-content :deep(pre) {
  background: #0f172a;
  border-color: var(--as-border);
}

.dark-mode .message-avatar {
  background: var(--as-surface-2);
  border-color: var(--as-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.dark-mode .user-message .message-avatar {
  background: linear-gradient(160deg, #1d4ed8, #4f46e5);
  border-color: rgba(129, 140, 248, 0.35);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.35),
    0 8px 22px rgba(67, 56, 202, 0.25);
}

.dark-mode .message-list::-webkit-scrollbar-thumb {
  background: rgba(248, 250, 252, 0.15);
  background-clip: padding-box;
}

.dark-mode .message-list::-webkit-scrollbar-thumb:hover {
  background: rgba(248, 250, 252, 0.28);
  background-clip: padding-box;
}

.dark-mode .table-container :deep(table) {
  background: var(--as-surface);
}

.dark-mode .table-container :deep(th) {
  background: var(--as-surface-2);
  color: var(--as-text);
  border-bottom-color: var(--as-border);
}

.dark-mode .table-container :deep(td) {
  border-bottom-color: var(--as-border);
  color: var(--as-text-muted);
}

.dark-mode .modal-content {
  background: var(--as-surface);
}

.dark-mode .modal-header {
  border-bottom-color: var(--as-border);
}

.dark-mode .modal-header h3 {
  color: var(--as-text);
}

.dark-mode .modal-body {
  color: var(--as-text-muted);
}

.dark-mode .modal-footer {
  border-top-color: var(--as-border);
}

/* 动画 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .history-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 20;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  }

  .history-toggle-handle {
    top: 10px;
    left: 0;
  }

  .history-toggle-handle--expanded {
    left: auto;
    right: 10px;
  }

  .chat-main.with-history {
    width: 100%;
  }

  .header-info {
    display: none;
  }

  .message-content-wrapper {
    max-width: min(100%, 88vw);
  }

  .chat-main-column {
    padding: 0 14px;
  }

  .message-list--welcome {
    padding-top: 18px;
  }

  .message-content {
    font-size: 14px;
  }
}

.icon {
  width: 30px;
  height: 30px;
}

</style>
