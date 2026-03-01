<template>
  <div class="ai-assistant-float" @click="openAgentPage">
    <div class="float-icon">
      <img :src="icons.aiCustomer" class="icon-ai">
    </div>
    <div class="float-text">AI小助手</div>
    <div class="float-glow" />
  </div>
</template>

<script>
import icons from '@/assets/icon/icons.js'

export default {
  name: 'AIAssistantFloat',
  data() {
    return {
      icons
    }
  },

  methods: {
    openAgentPage() {
      // 跳转到agent客服页面
      this.$router.push('/agent-assistant')
    }
  }
}
</script>

<style scoped>
.ai-assistant-float {
  position: fixed;
  bottom: 60px;
  right: 30px;
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.4);
  animation: float 3s ease-in-out infinite;
}

.ai-assistant-float:hover {
  transform: scale(1.1) translateY(-5px);
  background: rgba(255, 255, 255, 0.35);
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.6);
  animation: none;
}

.float-icon {
  font-size: 24px;
  margin-bottom: 2px;
  position: relative;
  z-index: 2;
}

.float-text {
  font-size: 11px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
  text-align: center;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);
}

/* 自定义AI图标 */
.icon-ai {
  width: 32px;
  height: 32px;
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.ai-assistant-float:hover .icon-ai {
  opacity: 1;
}

/* 背景光效 */
.float-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(57, 103, 255, 0.8), transparent 70%);
  pointer-events: none;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.ai-assistant-float:hover .float-glow {
  opacity: 0.8;
}

/* 浮动动画 */
@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* 添加脉冲光效 */
.ai-assistant-float::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
  filter: blur(8px);
}

.ai-assistant-float:hover::after {
  opacity: 0.5;
}

/* 适配暗色背景 */
.dark .ai-assistant-float {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.dark .float-text {
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.dark .icon-ai {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  opacity: 0.9;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .ai-assistant-float {
    bottom: 40px;
    right: 20px;
    width: 60px;
    height: 60px;
  }

  .icon-ai {
    width: 28px;
    height: 28px;
  }

  .float-text {
    font-size: 10px;
  }
}

/* 可选：添加不同的透明度变体 */
.ai-assistant-float.light {
  background: rgba(255, 255, 255, 0.15);
}

.ai-assistant-float.medium {
  background: rgba(255, 255, 255, 0.25);
}

.ai-assistant-float.high {
  background: rgba(255, 255, 255, 0.35);
}
</style>
