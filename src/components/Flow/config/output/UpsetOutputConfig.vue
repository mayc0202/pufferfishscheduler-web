<template>
  <form class="config-form" @submit.prevent="handleSubmit">
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
export default {
  name: 'UpsetConfig',
  props: {
    formData: {
      type: Object,
      required: true
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
</style>
