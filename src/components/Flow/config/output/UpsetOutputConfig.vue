<template>
  <form class="config-form" @submit.prevent="handleSubmit">
    <FlowConfigHero
      badge="输出"
      title="Upset 输出"
      description="按目标表与更新字段配置执行写入，适用于自定义 Upset 语义。"
      tone="jade"
      icon="el-icon-finished"
    />
    <el-tabs v-model="activeTab" class="config-tabs">
      <el-tab-pane label="基础配置" name="basic" />
      <el-tab-pane label="高级配置" name="advanced" />
    </el-tabs>

    <div v-show="activeTab === 'basic'">
    <div class="form-item">
      <label class="form-label">组件名称</label>
      <input
        v-model="formData.name"
        type="text"
        class="form-input"
        placeholder="请输入组件名称"
        required
      >
    </div>

    <div class="form-item">
      <label class="form-label">组件类型</label>
      <input
        v-model="formData.type"
        type="text"
        class="form-input"
        disabled
      >
    </div>

    <div class="form-item">
      <label class="form-label">目标表</label>
      <input
        v-model="formData.targetTable"
        type="text"
        class="form-input"
        placeholder="请输入目标表名"
        required
      >
    </div>

    <div class="form-item">
      <label class="form-label">更新字段</label>
      <input
        v-model="formData.updateField"
        type="text"
        class="form-input"
        placeholder="请输入更新字段"
        required
      >
    </div>
    </div>

    <div v-show="activeTab === 'advanced'" class="advanced-layout">
      <div class="section-header" @click="sectionOpen.distribution = !sectionOpen.distribution">
        <h4>数据分发</h4>
        <div class="section-toggle">
          <i :class="sectionOpen.distribution ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        </div>
      </div>
      <div v-show="sectionOpen.distribution" class="section-content">
        <div class="advanced-row">
          <span class="advanced-label">数据分发模式：</span>
          <el-radio-group v-model="distributionMode">
            <el-radio :label="'copy'">复制</el-radio>
            <el-radio :label="'distribute'">分发</el-radio>
          </el-radio-group>
        </div>
      </div>

      <div class="section-header" @click="sectionOpen.parallel = !sectionOpen.parallel">
        <h4>并发配置</h4>
        <div class="section-toggle">
          <i :class="sectionOpen.parallel ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        </div>
      </div>
      <div v-show="sectionOpen.parallel" class="section-content">
        <div class="form-item">
          <label class="form-label">并发数量</label>
          <input v-model.number="formData.copiesCache" type="number" min="1" class="form-input" placeholder="1">
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn primary-btn">保存配置</button>
      <button
        type="button"
        class="btn secondary-btn"
        @click="$emit('cancel')"
      >
        取消
      </button>
    </div>
  </form>
</template>

<script>
import FlowConfigHero from '../common/FlowConfigHero.vue'

export default {
  name: 'UpsetConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        distribution: false,
        parallel: false
      }
    }
  },
  computed: {
    distributionMode: {
      get() {
        return this.formData.distributeType ? 'copy' : 'distribute'
      },
      set(v) {
        this.$set(this.formData, 'distributeType', v === 'copy')
      }
    }
  },
  mounted() {
    if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
      this.$set(this.formData, 'copiesCache', 1)
    }
    if (this.formData.distributeType === undefined) {
      this.$set(this.formData, 'distributeType', false)
    }
  },
  methods: {
    handleSubmit() {
      if (!this.formData.name) {
        this.$message.error('请输入组件名称')
        return
      }
      if (!this.formData.targetTable) {
        this.$message.error('请输入目标表名')
        return
      }
      if (!this.formData.updateField) {
        this.$message.error('请输入更新字段')
        return
      }
      this.$emit('save')
    }
  }
}
</script>

<style scoped>
/* 同InputConfig.vue的样式，可复用（也可抽离为公共样式） */
.config-form {
  width: 100%;
}

.config-tabs {
  margin: 0 0 10px;
}

.form-item {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.form-label {
  width: 100px;
  font-weight: 600;
  color: #333;
  margin-right: 16px;
  text-align: right;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
  width: 100%;
}

.form-input:focus {
  outline: none;
  border-color: #5f95ff;
  box-shadow: 0 0 0 2px rgba(95, 149, 255, 0.2);
}

.form-input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.form-actions {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 24px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.primary-btn {
  background: #5f95ff;
  color: white;
  border-color: #5f95ff;
}

.primary-btn:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.secondary-btn {
  background: white;
  color: #333;
}

.secondary-btn:hover {
  border-color: #5f95ff;
  color: #5f95ff;
}

.advanced-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.advanced-label {
  font-size: 14px;
  color: #606266;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  margin-top: 4px;
  border-top: 1px solid #ebeef5;
  cursor: pointer;
  user-select: none;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.section-toggle {
  color: #909399;
}

.section-content {
  padding-top: 8px;
  margin-bottom: 8px;
}
</style>
