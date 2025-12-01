<template>
  <el-dialog
    title="Cron表达式生成器"
    :visible.sync="cronDialogVisible"
    width="560px"
    :before-close="handleCronClose"
    :modal-append-to-body="false"
    :append-to-body="true"
    custom-class="cron-generator-dialog"
  >
    <div class="cron-generator">
      <!-- 预设选项 -->
      <div class="preset-section">
        <h4>快速选择</h4>
        <el-radio-group v-model="presetType" @change="handlePresetChange">
          <el-radio label="minute">每分钟</el-radio>
          <el-radio label="hourly">每小时</el-radio>
          <el-radio label="daily">每天</el-radio>
          <el-radio label="weekly">每周</el-radio>
          <el-radio label="monthly">每月</el-radio>
          <el-radio label="custom">自定义</el-radio>
        </el-radio-group>
      </div>

      <!-- 自定义配置 -->
      <div v-show="presetType === 'custom'" class="custom-section">
        <div class="cron-field">
          <label>秒（0-59）</label>
          <el-input v-model="cronConfig.second" placeholder="*" />
          <span class="cron-example">例：0,10,20,30,40,50</span>
        </div>

        <div class="cron-field">
          <label>分钟（0-59）</label>
          <el-input v-model="cronConfig.minute" placeholder="*" />
          <span class="cron-example">例：0,15,30,45</span>
        </div>

        <div class="cron-field">
          <label>小时（0-23）</label>
          <el-input v-model="cronConfig.hour" placeholder="*" />
          <span class="cron-example">例：0,6,12,18</span>
        </div>

        <div class="cron-field">
          <label>日期（1-31）</label>
          <el-input v-model="cronConfig.dayOfMonth" placeholder="*" />
          <span class="cron-example">例：1,15 或 1-5</span>
        </div>

        <div class="cron-field">
          <label>月份（1-12）</label>
          <el-input v-model="cronConfig.month" placeholder="*" />
          <span class="cron-example">例：1,6,12 或 JAN,DEC</span>
        </div>

        <div class="cron-field">
          <label>星期（0-6）</label>
          <el-input v-model="cronConfig.dayOfWeek" placeholder="*" />
          <span class="cron-example">例：1-5 或 MON-FRI</span>
        </div>
      </div>

      <!-- 最近执行时间预览（简化版） -->
      <div class="preview-section">
        <h4>执行时间说明</h4>
        <div class="time-list">
          <div class="time-item">{{ cronDescription }}</div>
        </div>
      </div>

      <!-- 生成的表达式 -->
      <div class="result-section">
        <h4>生成的Cron表达式</h4>
        <el-input v-model="generatedCron" readonly>
          <template slot="append">
            <el-button @click="copyCron">复制</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCronClose">取消</el-button>
      <el-button type="primary" @click="applyCron">应用</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'CronHelper',
  props: {
    value: {
      type: String,
      default: ''
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      cronDialogVisible: this.visible,
      presetType: 'daily',
      generatedCron: this.value || '0 0 * * ? *',
      cronConfig: {
        second: '0',
        minute: '0',
        hour: '0',
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '?'
      },
      presetExpressions: {
        minute: '0 * * * * ?',
        hourly: '0 0 * * * ?',
        daily: '0 0 0 * * ?',
        weekly: '0 0 0 ? * 1',
        monthly: '0 0 0 1 * ?',
        yearly: '0 0 0 1 1 ?'
      }
    }
  },
  computed: {
    cronDescription() {
      const descriptions = {
        minute: '每分钟执行一次',
        hourly: '每小时执行一次',
        daily: '每天零点执行',
        weekly: '每周一零点执行',
        monthly: '每月1号零点执行',
        yearly: '每年1月1号零点执行',
        custom: '自定义执行时间'
      }
      return descriptions[this.presetType] || '未知频率'
    }
  },
  watch: {
    visible(newVal) {
      this.cronDialogVisible = newVal
    },
    cronDialogVisible(newVal) {
      this.$emit('update:visible', newVal)
    },
    value(newVal) {
      this.generatedCron = newVal
      this.parseCronExpression(newVal)
    },
    cronConfig: {
      handler() {
        if (this.presetType === 'custom') {
          this.generateCustomCron()
        }
      },
      deep: true
    }
  },
  methods: {
    handlePresetChange(type) {
      if (type !== 'custom') {
        this.generatedCron = this.presetExpressions[type]
      }
    },

    generateCustomCron() {
      const { second, minute, hour, dayOfMonth, month, dayOfWeek } = this.cronConfig
      this.generatedCron = `${second} ${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`
    },

    parseCronExpression(cronExpr) {
      try {
        const parts = cronExpr.split(' ')
        if (parts.length === 6) {
          this.cronConfig = {
            second: parts[0],
            minute: parts[1],
            hour: parts[2],
            dayOfMonth: parts[3],
            month: parts[4],
            dayOfWeek: parts[5]
          }
        }
      } catch (error) {
        console.error('解析cron表达式失败:', error)
      }
    },

    copyCron() {
      navigator.clipboard.writeText(this.generatedCron).then(() => {
        this.$message.success('Cron表达式已复制到剪贴板')
      }).catch(() => {
        // 降级方案
        const textarea = document.createElement('textarea')
        textarea.value = this.generatedCron
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.$message.success('Cron表达式已复制到剪贴板')
      })
    },

    applyCron() {
      this.$emit('input', this.generatedCron)
      this.$emit('update:visible', false)
      this.$emit('apply', this.generatedCron)
    },

    handleCronClose() {
      this.cronDialogVisible = false
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
::v-deep .el-dialog--center .el-dialog__body {
    text-align: initial;
    padding: 20px;
}

.cron-generator {
  padding: 20px 0;
}

.preset-section,
.custom-section,
.preview-section,
.result-section {
  margin-bottom: 24px;
}

.preset-section h4,
.preview-section h4,
.result-section h4 {
  margin-bottom: 12px;
  color: #303133;
}

.cron-field {
  margin-bottom: 16px;
}

.cron-field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #606266;
}

.cron-example {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.time-list {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
}

.time-item {
  padding: 4px 0;
  color: #606266;
}

.dialog-footer {
  text-align: right;
}
</style>
<style>
/* 全局样式修复 */
.cron-dialog-fix {
  background: #fff !important;
}

.cron-dialog-fix .el-dialog {
  background: #fff !important;
}

.cron-dialog-fix .el-dialog__header {
  background: #fff !important;
}

.cron-dialog-fix .el-dialog__body {
  background: #fff !important;
}

.cron-dialog-fix .el-dialog__footer {
  background: #fff !important;
}

/* 确保蒙层正确显示 */
.v-modal {
  background: #000 !important;
  opacity: 0.5 !important;
}
</style>

<style>
/* 强制修复对话框样式 */
.cron-generator-dialog {
  background: #fff !important;
}

.cron-generator-dialog .el-dialog {
  background: #fff !important;
}

.cron-generator-dialog .el-dialog__header {
  background: #fff !important;
  border-bottom: 1px solid #e4e7ed !important;
}

.cron-generator-dialog .el-dialog__body {
  background: #fff !important;
}

.cron-generator-dialog .el-dialog__footer {
  background: #fff !important;
  border-top: 1px solid #e4e7ed !important;
}

/* 修复动画问题 */
.el-dialog__wrapper {
  background-color: rgba(0, 0, 0, 0.5) !important;
}

.el-dialog {
  background: #fff !important;
}
</style>
