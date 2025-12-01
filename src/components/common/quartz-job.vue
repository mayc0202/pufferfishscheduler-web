<template>
  <!-- 其他内容 -->
  <el-dialog
    :close-on-click-modal="false"
    :visible.sync="visible"
    :title="title"
    :center="true"
    :width="width + 'px'"
    :before-close="handleCancel"
  >
    <div :style="{height: height + 'px'}">

      <div class="form-group">
        <label class="form-label">数据源</label>
        <el-cascader
          v-model="selectedValue"
          :options="cascaderOptions"
          :props="cascaderProps"
          :show-all-levels="false"
          placeholder="请选择数据源"
          clearable
          filterable
          class="full-width"
          @change="handleChange"
        />
      </div>

      <div class="form-group">
        <label class="form-label">执行时间设置</label>
        <div class="cron-input-group">
          <el-input
            v-model="formData.cron"
            placeholder="0 0 * * ? *"
            clearable
            class="cron-input"
          />
          <el-button type="primary" @click="showCronHelp">cron生成器</el-button>
        </div>
      </div>

      <!-- 添加Cron表达式生成器 -->
      <cron-helper
        v-model="formData.cron"
        :visible.sync="showCronDialog"
        @apply="handleCronApply"
      />

      <div class="form-group">
        <label class="form-label">失败策略</label>
        <el-select
          v-model="formData.failurePolicy"
          placeholder="请选择失败策略"
          clearable
          class="full-width"
        >
          <el-option
            v-for="policy in failurePolicyOptions"
            :key="policy.code"
            :label="policy.code"
            :value="policy.value"
          />
        </el-select>
      </div>

      <div class="form-group">
        <label class="form-label">通知策略</label>
        <el-select
          v-model="formData.notifyPolicy"
          placeholder="请选择通知策略"
          clearable
          class="full-width"
        >
          <el-option
            v-for="policy in notifyPolicyOptions"
            :key="policy.code"
            :label="policy.code"
            :value="policy.value"
          />
        </el-select>
      </div>

      <div class="form-group">
        <label class="form-label">Worker分组</label>
        <el-select
          v-model="formData.workerId"
          placeholder="请选择Worker分组"
          clearable
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
        <label class="form-label">启用状态</label>
        <el-radio-group v-model="formData.enable">
          <el-radio label="0">启用</el-radio>
          <el-radio label="1">禁用</el-radio>
        </el-radio-group>
      </div>

      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import CronHelper from './cron-helper.vue'

import dictCode from '@/api/dict/dictCode.js'
import { getDict } from '@/api/dict/dict'
import { relationalDbTree } from '@/api/database/database/dbGroup'

import {
  detail
} from '@/api/database/metadata/metadata'

export default {
  name: 'QuartzJob',
  components: {
    CronHelper
  },
  props: {
    title: {
      // 标题
      type: String,
      default: '定时任务配置'
    },
    visible: {
      // 是否可见
      type: Boolean,
      default: false
    },
    width: {
      // 长度
      type: Number,
      default: 630
    },
    // eslint-disable-next-line vue/require-prop-types
    height: {
      // 高度
      typeof: Number,
      default: 460
    },
    editData: {
      // 编辑模式的数据
      type: Object,
      default: null
    }
  },
  data() {
    return {
      // 其他数据保持不变
      showCronDialog: false,
      formData: {
        id: null, // 任务id
        dbId: null, // 数据源id
        cron: '0 0 * * ? *', // cron表达式
        failurePolicy: '0', // 失败策略
        notifyPolicy: '0', // 通知策略
        workerId: null, // 工作组id
        enable: '0' // 是否启用
      },
      // 数据源列表
      dbList: [],
      selectedValue: null,
      cascaderProps: {
        emitPath: false,
        expandTrigger: 'hover',
        checkStrictly: false
      },
      // 失败策略
      failurePolicyOptions: [],
      // 通知策略
      notifyPolicyOptions: [],
      workerGroupOptions: [
        { value: 0, label: 'node1' },
        { value: 1, label: 'node2' },
        { value: 2, label: 'node3' }
      ]
    }
  },
  computed: {
    cascaderOptions() {
      return this.transformToCascader(this.dbList)
    }
  },
  watch: {
    // 监听editData变化
    editData: {
      immediate: true,
      handler(newVal) {
        if (newVal && newVal.id) {
          // 编辑模式，加载任务详情
          this.loadTaskDetail(newVal.id)
        }
      }
    }
  },
  mounted() {
    // 加载字典数据
    this.initDict()

    // 加载数据源列表
    this.loadDbData()

    // 其他代码保持不变
    this.formData = {
      dbId: null,
      cron: '0 0 * * ? *',
      failurePolicy: '0',
      notifyPolicy: '0',
      workerId: null,
      enable: '0'
    }
  },
  methods: {
    // 转换数据格式
    transformToCascader(data) {
      if (!data || !Array.isArray(data)) return []
      return data
        .filter(item => item.type === 'GROUP' && item.children && item.children.length > 0)
        .map(group => ({
          value: group.id,
          label: group.name,
          disabled: false,
          children: group.children
            .filter(child => child.type === 'DATABASE')
            .map(db => ({
              value: db.id,
              label: db.name
            }))
        }))
        .filter(group => group.children.length > 0) // 过滤掉没有有效子节点的分组
    },

    // 获取数据
    async loadDbData() {
      try {
        const res = await relationalDbTree()
        this.dbList = res.data
      } catch (error) {
        console.error('获取数据失败:', error)
        this.$message.error('获取数据源列表失败')
      }
    },

    // 选择变化处理
    handleChange(value) {
      this.formData.dbId = value
      // 如果是编辑模式，确保级联选择器选中正确的值
      if (value && this.cascaderOptions.length > 0) {
        // 可以在这里添加额外的逻辑来处理级联选择器的回填
      }
    },

    // 加载字典数据
    initDict() {
      getDict(dictCode.FAILURE_POLICY).then((res) => {
        this.failurePolicyOptions = res.data
      })
      getDict(dictCode.NOTIFY_POLICY).then((res) => {
        this.notifyPolicyOptions = res.data
      })
    },

    showCronHelp() {
      this.showCronDialog = true
    },
    handleCronApply(cron) {
      this.formData.cron = cron
      this.$message.success('Cron表达式已应用')
    },
    handleCancel() {
      this.$emit('cancel')
    },
    // handleSubmit() {
    //   const formData = {
    //     ...this.formData
    //   }
    //   this.$emit('submit', formData)
    // },

    /**
     * 加载任务详情
     * @param taskId 任务ID
     */
    async loadTaskDetail(taskId) {
      try {
        // 这里调用获取任务详情的API
        // 假设有一个 getTaskDetail 的方法
        const res = await detail(taskId)
        const taskData = res.data

        // 填充表单数据
        this.formData = {
          id: taskData.id,
          dbId: taskData.dbId,
          cron: taskData.cron,
          failurePolicy: taskData.failurePolicy || '0',
          notifyPolicy: taskData.notifyPolicy || '0',
          workerId: taskData.workerId,
          enable: taskData.enable ? '0' : '1'
        }

        // 设置级联选择器选中的值
        this.selectedValue = taskData.dbId
      } catch (error) {
        console.error('加载任务详情失败:', error)
        this.$message.error('加载任务详情失败')
      }
    },

    /**
     * 外部调用设置表单数据的方法
     * @param data 表单数据
     */
    setFormData(data) {
      this.formData = {
        ...this.formData,
        ...data
      }
      this.selectedValue = data.dbId
    },

    /**
     * 重置表单
     */
    resetForm() {
      this.formData = {
        id: null,
        dbId: null,
        cron: '0 0 * * ? *',
        failurePolicy: '0',
        notifyPolicy: '0',
        workerId: null,
        enable: '0'
      }
      this.selectedValue = null
    },

    // 修改handleSubmit方法
    handleSubmit() {
      const formData = {
        ...this.formData
      }

      // 如果是编辑模式，确保包含ID
      if (this.formData.id) {
        formData.id = this.formData.id
      }

      this.$emit('submit', formData)
    }
  }

}
</script>
<style scoped>
::v-deep .el-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color:#4b4b4b;
  margin-bottom: 20px;
}

.task-schedule-form {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #696969;
  display: block;
  margin-bottom: 8px;
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
