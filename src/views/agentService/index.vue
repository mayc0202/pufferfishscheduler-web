<template>
  <div class="agent-service-page" :class="{ 'dark-mode': isDark }">
    <!-- 头部 -->
    <div class="agent-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">←</button>
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
        <button class="header-btn el-icon-coin" title="知识库" @click="goToKnowledgeBase" />
        <button
          class="header-btn el-icon-time"
          title="历史记录"
          @click="showHistory = !showHistory"
        />
        <button class="header-btn el-icon-circle-plus-outline" title="新对话" @click="startNewChat" />
        <button class="close-btn el-icon-close" title="关闭对话" @click="goBack" />
      </div>
    </div>

    <div class="chat-container">
      <!-- 历史记录侧边栏 -->
      <Transition name="slide">
        <div v-if="showHistory" class="history-sidebar">
          <div class="history-header">
            <h3>历史对话</h3>
            <button
              class="clear-history el-icon-delete"
              title="清空历史"
              @click="clearAllHistory"
            />
          </div>
          <div class="history-list">
            <div
              v-for="chat in chatHistory"
              :key="chat.id"
              class="history-item"
              :class="{ active: currentChatId === chat.id }"
              @click="loadChat(chat.id)"
            >
              <el-icon class="icon el-icon-chat-dot-round" />
              <div class="item-content">
                <span class="title">{{ chat.title || "新对话" }}</span>
                <span class="time">{{ formatTime(chat.timestamp) }}</span>
              </div>
            </div>
            <div v-if="chatHistory.length === 0" class="empty-history">
              <p>暂无历史记录</p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 主聊天区域 -->
      <div class="chat-main" :class="{ 'with-history': showHistory }">
        <!-- 消息列表 -->
        <div ref="messageList" class="message-list" @scroll="handleScroll">
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
            v-for="(message, index) in messages"
            :key="index"
            :class="['message-item', message.type + '-message']"
          >
            <div class="message-avatar">
              <img :src="message.type === 'bot' ? icons.aiAgent : icons.aiUser" class="icon">
            </div>
            <div class="message-content-wrapper">
              <div
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

          <!-- 加载动画 -->
          <div v-if="isLoading" class="message-item bot-message">
            <div class="message-avatar">
              <img :src="icons.aiAgent" class="icon">
            </div>
            <div class="message-content loading">
              <span class="dot" />
              <span class="dot" />
              <span class="dot" />
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
</template>

<script>
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import * as echarts from 'echarts'
import icons from '@/assets/icon/icons.js'

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
      isDark: false,
      suggestQuestions: [
        '你们有哪些产品功能？',
        '如何接入数据源？',
        'ETL流程怎么配置？',
        '监控预警怎么设置？'
      ],
      myChart: null
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
    this.loadChatHistory()
    this.checkDarkMode()
    this.initWelcomeMessage()

    // 监听暗色模式变化
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        this.isDark = e.matches
      })
  },
  beforeUnmount() {
    if (this.myChart) {
      this.myChart.dispose()
    }
  },
  methods: {
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

    // 发送消息
    sendMessage() {
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

      // 模拟AI回复（实际项目中替换为真实API调用）
      setTimeout(() => {
        this.isLoading = false
        this.messages.push({
          type: 'bot',
          content: this.getAIResponse(messageContent),
          timestamp: new Date()
        })
        this.scrollToBottom()

        // 保存对话
        this.saveCurrentChat()
      }, 1500)
    },

    // 模拟AI回复（示例）
    getAIResponse(message) {
      const lowerMsg = message.toLowerCase()

      if (lowerMsg.includes('功能') || lowerMsg.includes('能做什么')) {
        return `我可以帮您处理很多事情：

**📊 数据源管理**
- 数据源接入配置
- 元数据采集管理

**⚙️ 数据清洗流程**
- 可视化流程设计
- 任务调度管理

**💬 其他功能**
- 智能问答咨询
- 技术支持帮助
- 产品使用指导

有什么具体问题需要我帮忙吗？`
      } else if (lowerMsg.includes('数据源')) {
        return `**数据源接入步骤：**

1. **选择数据源类型**
   - 关系型数据库（MySQL、Oracle等）
   - 大数据平台（Hive、HBase等）
   - 文件数据（CSV、Excel等）

2. **配置连接信息**
   - 主机地址、端口
   - 数据库名称
   - 用户名和密码

3. **测试连接**
   - 验证配置是否正确
   - 检查网络连通性

4. **保存配置**
   - 完成数据源接入

需要我详细说明某个步骤吗？`
      } else if (lowerMsg.includes('etl') || lowerMsg.includes('流程')) {
        return `**ETL流程开发指南：**

1. **数据抽取**
   - 支持多种数据源
   - 全量/增量抽取
   - 定时任务配置

2. **数据转换**
   - 字段映射转换
   - 数据清洗过滤
   - 业务逻辑处理

3. **数据加载**
   - 目标表映射
   - 写入策略配置
   - 性能优化建议

4. **流程监控**
   - 任务执行状态
   - 数据质量检查
   - 异常告警通知

您是想创建新的ETL流程吗？`
      } else {
        return `感谢您的提问！关于"${message}"的问题，我建议您：

1. 查看系统帮助文档
2. 联系技术支持团队
3. 在工作时间拨打客服热线

或者您可以告诉我更具体的问题，我会尽力帮您解答。`
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
    startNewChat() {
      const newChatId = Date.now().toString()
      this.currentChatId = newChatId
      this.messages = []
      this.initWelcomeMessage()
      this.showHistory = false

      const newChat = {
        id: newChatId,
        title: '新对话',
        timestamp: new Date().toISOString()
      }
      this.chatHistory = [newChat, ...this.chatHistory]
      this.saveChatHistory()
    },

    // 加载聊天历史
    loadChatHistory() {
      try {
        const savedHistory = localStorage.getItem('chat_history_agent')
        if (savedHistory) {
          this.chatHistory = JSON.parse(savedHistory)
        }
      } catch (error) {
        console.error('加载历史失败:', error)
      }
    },

    // 保存聊天历史
    saveChatHistory() {
      try {
        localStorage.setItem(
          'chat_history_agent',
          JSON.stringify(this.chatHistory)
        )
      } catch (error) {
        console.error('保存历史失败:', error)
      }
    },

    // 加载特定对话
    loadChat(chatId) {
      try {
        const savedMessages = localStorage.getItem(`chat_${chatId}`)
        if (savedMessages) {
          this.messages = JSON.parse(savedMessages)
        }
        this.currentChatId = chatId
        this.showHistory = false
        this.scrollToBottom()
      } catch (error) {
        console.error('加载对话失败:', error)
      }
    },

    // 保存当前对话
    saveCurrentChat() {
      if (this.currentChatId && this.messages.length > 0) {
        try {
          localStorage.setItem(
            `chat_${this.currentChatId}`,
            JSON.stringify(this.messages)
          )

          // 更新历史记录
          const chatIndex = this.chatHistory.findIndex(
            (c) => c.id === this.currentChatId
          )
          if (chatIndex !== -1) {
            this.chatHistory[chatIndex].timestamp = new Date().toISOString()
            this.chatHistory[chatIndex].title =
              this.messages[0]?.content?.slice(0, 20) || '新对话'
            this.saveChatHistory()
          }
        } catch (error) {
          console.error('保存对话失败:', error)
        }
      }
    },

    // 清空所有历史
    clearAllHistory() {
      if (confirm('确定要清空所有历史记录吗？')) {
        this.chatHistory = []
        localStorage.removeItem('chat_history_agent')
        this.startNewChat()
      }
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

    // 跳转到知识库管理页面
    goToKnowledgeBase() {
      this.$router.push('/knowledge-base')
    }
  }
}
</script>

<style scoped>
.agent-service-page {
  --as-bg: #eef2f6;
  --as-surface: #ffffff;
  --as-surface-2: #f8fafc;
  --as-text: #0f172a;
  --as-text-muted: #64748b;
  --as-border: rgba(15, 23, 42, 0.08);
  --as-accent: #0ea5e9;
  --as-accent-deep: #0284c7;
  --as-violet: #6366f1;
  --as-header-from: #0f172a;
  --as-header-to: #1e293b;
  --as-shadow: 0 4px 24px rgba(15, 23, 42, 0.07);
  --as-shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06);
  --as-radius: 18px;
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
  gap: 6px;
}

.header-btn {
  background: rgba(248, 250, 252, 0.1);
  border: 1px solid rgba(248, 250, 252, 0.14);
  width: 40px;
  height: 40px;
  color: #f8fafc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  font-size: 18px;
}

.header-btn:hover {
  background: rgba(248, 250, 252, 0.2);
  border-color: rgba(248, 250, 252, 0.28);
  transform: translateY(-1px);
}

.close-btn {
  background: rgba(248, 250, 252, 0.1);
  border: 1px solid rgba(248, 250, 252, 0.14);
  color: #f8fafc;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  margin-left: 4px;
  font-size: 18px;
}

.close-btn:hover {
  background: rgba(248, 113, 113, 0.22);
  border-color: rgba(248, 113, 113, 0.35);
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
  width: 280px;
  background: var(--as-surface);
  border-right: 1px solid var(--as-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 4px 0 24px rgba(15, 23, 42, 0.04);
}

.history-header {
  padding: 16px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--as-border);
  background: var(--as-surface-2);
}

.history-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--as-text);
  letter-spacing: 0.02em;
}

.clear-history {
  background: transparent;
  border: none;
  color: var(--as-text-muted);
  width: 34px;
  height: 34px;
  border-radius: 10px;
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
  padding: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 4px;
  border: 1px solid transparent;
}

.history-item:hover {
  background: var(--as-surface-2);
}

.history-item.active {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(99, 102, 241, 0.08));
  border-color: rgba(99, 102, 241, 0.2);
  box-shadow: var(--as-shadow-sm);
}

.history-item .icon {
  font-size: 18px;
  color: var(--as-text-muted);
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.title {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--as-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.time {
  font-size: 11px;
  color: var(--as-text-muted);
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
  overflow: hidden;
  transition: all 0.3s;
}

.chat-main.with-history {
  width: calc(100% - 280px);
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 20px 28px;
  scroll-behavior: smooth;
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
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
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
  margin: 0 10px;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--as-surface);
  border-radius: 14px;
  border: 1px solid var(--as-border);
  box-shadow: var(--as-shadow-sm);
}

.message-content-wrapper {
  max-width: min(72%, 640px);
}

.message-content {
  padding: 12px 16px 13px;
  border-radius: var(--as-radius);
  line-height: 1.6;
  font-size: 14px;
  word-wrap: break-word;
}

.bot-message .message-content {
  background: var(--as-surface);
  color: var(--as-text);
  border: 1px solid var(--as-border);
  border-top-left-radius: 6px;
  box-shadow: var(--as-shadow-sm);
}

.user-message .message-content {
  background: linear-gradient(145deg, #e0f2fe 0%, #e0e7ff 100%);
  color: #0c4a6e;
  border: 1px solid rgba(14, 165, 233, 0.18);
  border-top-right-radius: 6px;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.08);
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

.user-message .message-content :deep(code) {
  background: rgba(14, 165, 233, 0.12);
  color: #0369a1;
}

.user-message .message-content :deep(pre) {
  background: rgba(255, 255, 255, 0.65);
  border-color: rgba(14, 165, 233, 0.15);
}

.message-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 0 8px;
}

.message-time {
  font-size: 11px;
  color: var(--as-text-muted);
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
  gap: 5px;
  padding: 14px 18px;
  align-items: center;
  min-height: 44px;
}

.message-content.loading .dot {
  width: 7px;
  height: 7px;
  background: var(--as-text-muted);
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
  text-align: center;
  padding: 28px 16px 36px;
}

.welcome-content {
  max-width: 520px;
  margin: 0 auto;
  padding: 28px 24px 32px;
  background: var(--as-surface);
  border: 1px solid var(--as-border);
  border-radius: var(--as-radius);
  box-shadow: var(--as-shadow);
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
  padding: 14px 20px 20px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  border-top: 1px solid var(--as-border);
  background: var(--as-surface);
  box-shadow: 0 -12px 40px rgba(15, 23, 42, 0.04);
}

.input-area textarea {
  flex: 1;
  resize: none;
  border: 1px solid var(--as-border);
  border-radius: 20px;
  padding: 13px 18px;
  font-size: 14px;
  line-height: 1.55;
  max-height: 150px;
  min-height: 50px;
  font-family: inherit;
  color: var(--as-text);
  background: var(--as-surface-2);
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

.dark-mode .welcome-content {
  background: var(--as-surface);
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

.dark-mode .user-message .message-content :deep(code) {
  background: rgba(255, 255, 255, 0.12);
  color: #bae6fd;
}

.dark-mode .user-message .message-content :deep(pre) {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(129, 140, 248, 0.2);
}

.dark-mode .message-content :deep(pre) {
  background: #0f172a;
  border-color: var(--as-border);
}

.dark-mode .message-avatar {
  background: var(--as-surface-2);
  border-color: var(--as-border);
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

  .chat-main.with-history {
    width: 100%;
  }

  .header-info {
    display: none;
  }

  .message-content-wrapper {
    max-width: 85%;
  }
}

.icon {
  width: 30px;
  height: 30px;
}

</style>
