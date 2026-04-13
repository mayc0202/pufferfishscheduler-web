<template>
  <div class="flow-config-hero" :class="heroToneClass">
    <div class="flow-config-hero__glow" aria-hidden="true" />
    <div class="flow-config-hero__inner">
      <div class="flow-config-hero__badge">
        <i v-if="icon" :class="icon" class="flow-config-hero__badge-icon" />
        <span>{{ badge }}</span>
      </div>
      <h2 class="flow-config-hero__title">{{ title }}</h2>
      <p v-if="description" class="flow-config-hero__desc">{{ description }}</p>
    </div>
  </div>
</template>

<script>
const VALID_TONES = ['azure', 'jade', 'violet', 'amber', 'indigo', 'slate', 'coral', 'rose', 'teal']

export default {
  name: 'FlowConfigHero',
  props: {
    badge: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    tone: {
      type: String,
      default: 'azure',
      validator: (v) => VALID_TONES.includes(v)
    }
  },
  computed: {
    heroToneClass() {
      return `flow-config-hero--${this.tone}`
    }
  }
}
</script>

<style scoped>
/*
 * 与配置抽屉：四周不再使用负 margin，避免与各组件 .config-content 不同 padding 叠加后左右/顶底不一致。
 * 与页签间距：仅保留下边距 12px。
 */
.flow-config-hero {
  margin: 0 0 12px;
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.2);
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #0a0f1a 100%);
}

.flow-config-hero__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.flow-config-hero__inner {
  position: relative;
  padding: 16px 18px 18px;
  color: #f8fafc;
}

.flow-config-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.07);
  color: #e2e8f0;
}

.flow-config-hero__badge-icon {
  font-size: 12px;
  opacity: 0.92;
}

.flow-config-hero__title {
  margin: 10px 0 6px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.flow-config-hero__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: rgba(248, 250, 252, 0.74);
  max-width: 38em;
}

/* 色调：按步骤类别区分光晕，统一深色底 */
.flow-config-hero--azure .flow-config-hero__glow {
  background: radial-gradient(ellipse 90% 70% at 100% 0%, rgba(56, 189, 248, 0.45), transparent 58%);
}

.flow-config-hero--jade .flow-config-hero__glow {
  background: radial-gradient(ellipse 90% 70% at 100% 0%, rgba(52, 211, 153, 0.42), transparent 58%);
}

.flow-config-hero--violet .flow-config-hero__glow {
  background: radial-gradient(ellipse 90% 70% at 100% 0%, rgba(167, 139, 250, 0.45), transparent 58%);
}

.flow-config-hero--amber .flow-config-hero__glow {
  background: radial-gradient(ellipse 90% 70% at 100% 0%, rgba(251, 191, 36, 0.38), transparent 58%);
}

.flow-config-hero--indigo .flow-config-hero__glow {
  background: radial-gradient(ellipse 90% 70% at 100% 0%, rgba(129, 140, 248, 0.48), transparent 58%);
}

.flow-config-hero--slate .flow-config-hero__glow {
  background: radial-gradient(ellipse 90% 70% at 100% 0%, rgba(148, 163, 184, 0.35), transparent 58%);
}

.flow-config-hero--coral .flow-config-hero__glow {
  background: radial-gradient(ellipse 90% 70% at 100% 0%, rgba(248, 113, 113, 0.45), transparent 58%);
}

.flow-config-hero--rose .flow-config-hero__glow {
  background: radial-gradient(ellipse 90% 70% at 100% 0%, rgba(244, 114, 182, 0.42), transparent 58%);
}

.flow-config-hero--teal .flow-config-hero__glow {
  background: radial-gradient(ellipse 90% 70% at 100% 0%, rgba(45, 212, 191, 0.4), transparent 58%);
}
</style>
