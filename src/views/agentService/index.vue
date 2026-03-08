<template>
  <div class="agent-service-page" :class="{ 'dark-mode': isDark }">
    <!-- 头部 -->
    <div class="agent-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">←</button>
        <div class="header-avatar">
          <img :src="icons.aiCustomer" class="icon">
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
/* 样式保持不变，和之前的一样 */
.agent-service-page {
  width: 100%;
  height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

/* 头部样式 */
.agent-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 20px;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.header-avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.header-info h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.status {
  font-size: 12px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d4f;
}

.status.online::before {
  background: #52c41a;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(82, 196, 26, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 40px;
  height: 40px;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 20px;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 4px;
  font-size: 20px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
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
  background: white;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.history-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.history-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.clear-history {
  background: transparent;
  border: none;
  color: #999;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 18px;
}

.clear-history:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #309bff;
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
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.history-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.history-item.active {
  background: rgba(102, 126, 234, 0.1);
  border-left: 3px solid #667eea;
}

.history-item .icon {
  font-size: 20px;
  color: #666;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.title {
  display: block;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.time {
  font-size: 12px;
  color: #999;
}

.empty-history {
  text-align: center;
  padding: 32px 16px;
  color: #999;
  font-size: 14px;
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
  padding: 20px;
}

.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
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
  margin: 0 12px;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 50%;
}

.message-content-wrapper {
  max-width: 70%;
}

.message-content {
  padding: 12px 16px;
  border-radius: 18px;
  line-height: 1.5;
  font-size: 14px;
  word-wrap: break-word;
}

.bot-message .message-content {
  background-color: white;
  border-top-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.user-message .message-content {
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  background-color: white;
  color: black;
  border-top-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
  background: #f6f8fa;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}

.user-message .message-content :deep(code) {
  background: rgba(255, 255, 255, 0.2);
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
  color: #999;
}

.copy-btn {
  background: transparent;
  border: none;
  color: #999;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  font-size: 16px;
}

.copy-icon {
  width: 20px;
  height: 20px;
}

.message-item:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #666;
}

/* 加载动画 */
.message-content.loading {
  display: flex;
  gap: 4px;
  padding: 16px 20px;
}

.message-content.loading .dot {
  width: 8px;
  height: 8px;
  background: #999;
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
  padding: 40px 20px;
}

.welcome-content {
  max-width: 500px;
  margin: 0 auto;
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
  font-size: 20px;
  color: #333;
  margin: 0 0 8px;
}

.welcome-content p {
  color: #666;
  margin: 0 0 24px;
}

.suggest-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.suggest-btn {
  background: white;
  border: 1px solid #e0e0e0;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.suggest-btn:hover {
  background: #667eea;
  border-color: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

/* 图表和表格容器 */
.chart-container {
  width: 100%;
  height: 400px;
  margin: 20px 0;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background: white;
}

.input-area textarea {
  flex: 1;
  resize: none;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  max-height: 150px;
  min-height: 48px;
  font-family: inherit;
  transition: all 0.2s;
}

.input-area textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-area textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: transparent;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
  font-size: 20px;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #666;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s;
  font-size: 20px;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn.sending {
  animation: pulse 1.5s infinite;
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
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 30px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:hover {
  background: #5a67d8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 暗色模式 */
.dark-mode {
  background-color: #1a1a1a;
}

.dark-mode .agent-header {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
}

.dark-mode .history-sidebar {
  background: #2d2d2d;
  border-right-color: rgba(255, 255, 255, 0.05);
}

.dark-mode .history-header {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.dark-mode .history-header h3 {
  color: #fff;
}

.dark-mode .history-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.dark-mode .history-item.active {
  background: rgba(102, 126, 234, 0.2);
}

.dark-mode .history-item .icon {
  color: #999;
}

.dark-mode .title {
  color: #fff;
}

.dark-mode .bot-message .message-content {
  background: #2d2d2d;
  color: #fff;
}

.dark-mode .message-avatar {
  background: #3d3d3d;
}

.dark-mode .input-area {
  background: #2d2d2d;
  border-top-color: rgba(255, 255, 255, 0.05);
}

.dark-mode .input-area textarea {
  background: #3d3d3d;
  border-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.dark-mode .input-area textarea:focus {
  border-color: #667eea;
}

.dark-mode .suggest-btn {
  background: #3d3d3d;
  border-color: #4d4d4d;
  color: #fff;
}

.dark-mode .suggest-btn:hover {
  background: #667eea;
  border-color: #667eea;
}

.dark-mode .chart-container {
  background: #2d2d2d;
}

.dark-mode .table-container :deep(table) {
  background: #2d2d2d;
}

.dark-mode .table-container :deep(th) {
  background: #3d3d3d;
  color: #fff;
  border-bottom-color: #4d4d4d;
}

.dark-mode .table-container :deep(td) {
  border-bottom-color: #4d4d4d;
  color: #ccc;
}

.dark-mode .modal-content {
  background: #2d2d2d;
}

.dark-mode .modal-header {
  border-bottom-color: #4d4d4d;
}

.dark-mode .modal-header h3 {
  color: #fff;
}

.dark-mode .modal-body {
  color: #ccc;
}

.dark-mode .modal-footer {
  border-top-color: #4d4d4d;
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
