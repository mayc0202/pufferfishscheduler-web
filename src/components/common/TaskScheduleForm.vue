<template>
  <div class="task-schedule-form">
    <h2 class="form-title">定时前请先设置参数</h2>

    <div class="form-group">
      <label class="form-label">起止时间</label>
      <el-date-picker
        v-model="formData.timeRange"
        type="datetimerange"
        range-separator="→"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
        class="full-width"
      />
    </div>

    <div class="form-group">
      <label class="form-label">定时</label>
      <div class="cron-input-group">
        <el-input
          v-model="formData.cronExpression"
          placeholder="0 0 * * ? *"
          class="cron-input"
        />
        <el-button type="primary" @click="showCronHelp">执行时间</el-button>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">时区</label>
      <el-select
        v-model="formData.timezone"
        placeholder="请选择时区"
        class="full-width"
      >
        <el-option
          v-for="tz in timezoneOptions"
          :key="tz.value"
          :label="tz.label"
          :value="tz.value"
        />
      </el-select>
    </div>

    <div class="form-group">
      <label class="form-label">失败策略</label>
      <el-radio-group v-model="formData.failureStrategy">
        <el-radio label="CONTINUE">继续</el-radio>
        <el-radio label="END">结束</el-radio>
      </el-radio-group>
    </div>

    <div class="form-group">
      <label class="form-label">通知策略</label>
      <el-select
        v-model="formData.notifyStrategy"
        placeholder="请选择通知策略"
        class="full-width"
      >
        <el-option
          v-for="strategy in notifyStrategyOptions"
          :key="strategy.value"
          :label="strategy.label"
          :value="strategy.value"
        />
      </el-select>
    </div>

    <div class="form-group">
      <label class="form-label">流程优先级</label>
      <el-select
        v-model="formData.priority"
        placeholder="请选择优先级"
        class="full-width"
      >
        <el-option
          v-for="priority in priorityOptions"
          :key="priority.value"
          :label="priority.label"
          :value="priority.value"
        />
      </el-select>
    </div>

    <div class="form-group">
      <label class="form-label">Worker分组</label>
      <el-select
        v-model="formData.workerGroup"
        placeholder="请选择Worker分组"
        class="full-width"
      >
        <el-option
          v-for="group in workerGroupOptions"
          :key="group.value"
          :label="group.label"
          :value="group.value"
        />
      </el-select>
    </div>

    <div class="form-group">
      <label class="form-label">租户</label>
      <el-select
        v-model="formData.tenant"
        placeholder="请选择租户"
        class="full-width"
      >
        <el-option
          v-for="tenant in tenantOptions"
          :key="tenant.value"
          :label="tenant.label"
          :value="tenant.value"
        />
      </el-select>
    </div>

    <div class="form-group">
      <label class="form-label">环境名称</label>
      <el-select
        v-model="formData.environment"
        placeholder="请选择环境"
        class="full-width"
      >
        <el-option
          v-for="env in environmentOptions"
          :key="env.value"
          :label="env.label"
          :value="env.value"
        />
      </el-select>
    </div>

    <div class="form-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskScheduleForm',
  data() {
    return {
      formData: {
        timeRange: [],
        cronExpression: '0 0 * * ? *',
        timezone: 'Asia/Shanghai',
        failureStrategy: 'CONTINUE',
        notifyStrategy: 'NONE',
        priority: 'MEDIUM',
        workerGroup: 'default',
        tenant: 'default',
        environment: ''
      },
      timezoneOptions: [
        { value: 'Asia/Shanghai', label: 'Asia/Shanghai' },
        { value: 'UTC', label: 'UTC' },
        { value: 'America/New_York', label: 'America/New_York' },
        { value: 'Europe/London', label: 'Europe/London' }
      ],
      notifyStrategyOptions: [
        { value: 'NONE', label: '都不发' },
        { value: 'SUCCESS', label: '成功时通知' },
        { value: 'FAILURE', label: '失败时通知' },
        { value: 'ALL', label: '全部通知' }
      ],
      priorityOptions: [
        { value: 'HIGH', label: '↑ HIGH' },
        { value: 'MEDIUM', label: '↑ MEDIUM' },
        { value: 'LOW', label: '↑ LOW' }
      ],
      workerGroupOptions: [
        { value: 'default', label: 'default' },
        { value: 'group1', label: 'group1' },
        { value: 'group2', label: 'group2' }
      ],
      tenantOptions: [
        { value: 'default', label: 'default' },
        { value: 'tenant1', label: 'tenant1' },
        { value: 'tenant2', label: 'tenant2' }
      ],
      environmentOptions: [
        { value: 'dev', label: '开发环境' },
        { value: 'test', label: '测试环境' },
        { value: 'prod', label: '生产环境' }
      ]
    }
  },
  methods: {
    showCronHelp() {
      this.$message.info('执行时间帮助信息：支持标准的cron表达式格式')
    },
    handleCancel() {
      this.$emit('cancel')
    },
    handleSubmit() {
      const formData = {
        ...this.formData,
        startTime: this.formData.timeRange?.[0],
        endTime: this.formData.timeRange?.[1]
      }
      this.$emit('submit', formData)
    }
  }
}
</script>
<style scoped>
.task-schedule-form {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 16px;
  font-weight: bold;
  color: #000;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #000;
  font-size: 14px;
}

.full-width {
  width: 100%;
}

.cron-input-group {
  display: flex;
  gap: 10px;
}

.cron-input {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}
</style>
