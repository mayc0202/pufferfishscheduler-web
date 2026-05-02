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
    <div class="quartz-job-body">

      <div class="form-group">
        <label class="form-label">数据源</label>
        <el-cascader
          v-model="selectedValue"
          :options="cascaderOptions"
          :props="cascaderProps"
          placeholder="请选择数据源"
          clearable
          filterable
          separator=" / "
          popper-class="relation-db-cascader-popper"
          class="full-width quartz-relation-db-cascader"
        >
          <template slot-scope="{ data }">
            <span class="mq-node">
              <i :class="data.type === 'GROUP' ? 'el-icon-folder' : 'el-icon-link'" class="mq-node-icon" />
              <span class="mq-node-label">{{ data.label }}</span>
            </span>
          </template>
        </el-cascader>
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
            :key="String(policy.code)"
            :label="policy.value"
            :value="String(policy.code)"
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
            :key="String(policy.code)"
            :label="policy.value"
            :value="String(policy.code)"
          />
        </el-select>
      </div>

      <div class="form-group">
        <label class="form-label">联系人</label>
        <el-select
          v-model="selectedContactIds"
          multiple
          filterable
          collapse-tags
          clearable
          placeholder="请选择联系人（可多选）"
          class="full-width"
        >
          <el-option
            v-for="c in contactSelectOptions"
            :key="String(c.id)"
            :label="c.name"
            :value="String(c.id)"
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
import { options as contactOptions } from '@/api/upms/contactManage'
import {
  parseContactIdListToValues,
  joinContactIds,
  normalizeContactOptionsFromApi,
  augmentContactOptions
} from '@/utils/contactIds'
import { prepareSchedulePayloadForSubmit } from '@/utils/cron-utils'

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
        // workerId：新增时不展示下拉框，交给后端策略推断；编辑时通过回填携带
        workerId: null, // 工作组id
        enable: '0' // 是否启用
      },
      // 数据源列表
      dbList: [],
      selectedValue: null,
      cascaderProps: {
        emitPath: false,
        expandTrigger: 'hover',
        value: 'value',
        label: 'label',
        children: 'children'
      },
      // 失败策略
      failurePolicyOptions: [],
      // 通知策略
      notifyPolicyOptions: [],
      /** 联系人 options.do */
      contactBaseOptions: [],
      /** 多选：与 el-option value 一致，存字符串 id */
      selectedContactIds: []
    }
  },
  computed: {
    cascaderOptions() {
      return this.transformToCascader(this.dbList)
    },
    contactSelectOptions() {
      return augmentContactOptions(this.contactBaseOptions, this.selectedContactIds)
    }
  },
  watch: {
    selectedValue(val) {
      if (val == null || val === '') {
        this.formData.dbId = null
        return
      }
      const n = Number(val)
      this.formData.dbId = Number.isFinite(n) ? n : val
    },
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
    this.loadContactOptions()

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
        .map((group) => {
          const children = group.children
            .filter(child => child.type === 'DATABASE')
            .map(db => ({
              value: String(db.id),
              label: db.name || '未命名',
              type: 'DATABASE'
            }))
          if (!children.length) return null
          return {
            value: String(group.id),
            label: group.name || '未知分组',
            type: 'GROUP',
            children
          }
        })
        .filter(Boolean)
    },

    async loadContactOptions() {
      try {
        const res = await contactOptions()
        const body = res && res.data != null ? res.data : res
        this.contactBaseOptions = normalizeContactOptionsFromApi(body)
      } catch (error) {
        console.error('获取联系人选项失败:', error)
        this.$message.error('获取联系人列表失败')
      }
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

    // 后端 enable 字段可能是 boolean / 0|1 / '0'|'1' 等多种类型
    // 统一归一化：返回 true 表示“启用”
    isEnabled(val) {
      if (val === true) return true
      if (val === false) return false
      if (val === 1 || val === '1') return true
      if (val === 0 || val === '0') return false
      if (val === 'true' || val === 'TRUE') return true
      if (val === 'false' || val === 'FALSE') return false
      return Boolean(val)
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
          enable: this.isEnabled(taskData.enable) ? '0' : '1'
        }

        const rawContact =
          taskData.contactIdList != null ? taskData.contactIdList : taskData.contactIds
        this.selectedContactIds = parseContactIdListToValues(rawContact)

        // 设置级联选择器选中的值（与 option.value 字符串一致）
        this.selectedValue =
          taskData.dbId != null && taskData.dbId !== '' ? String(taskData.dbId) : null
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
      this.selectedValue =
        data.dbId != null && data.dbId !== '' ? String(data.dbId) : null
      if (data && (data.contactIdList != null || data.contactIds != null)) {
        const raw = data.contactIdList != null ? data.contactIdList : data.contactIds
        this.selectedContactIds = parseContactIdListToValues(raw)
      }
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
      this.selectedContactIds = []
    },

    // 修改handleSubmit方法
    handleSubmit() {
      let formData = { ...this.formData }
      // 新增场景不传 workerId，让后端按默认策略处理
      if (formData.workerId == null) delete formData.workerId

      // 如果是编辑模式，确保包含ID
      if (this.formData.id) {
        formData.id = this.formData.id
      }

      // 多选联系人：逗号分隔 id 串（与后端 Metadata 任务表单字段约定一致，字段名 contactIds）
      formData.contactIds = joinContactIds(this.selectedContactIds)

      try {
        formData = prepareSchedulePayloadForSubmit(formData, { forceCronSchedule: true })
      } catch (e) {
        this.$message.error(e.message)
        return
      }

      this.$emit('submit', formData)
    }
  }

}
</script>
<style scoped>
::v-deep .el-dialog {
  border-radius: 12px;
  overflow: hidden;
}

::v-deep .el-dialog__header {
  background: #f8faff;
  border-bottom: 1px solid #e9eef8;
  padding: 16px 20px;
}

::v-deep .el-dialog__title {
  color: #1f3358;
  font-weight: 600;
  font-size: 16px;
}

::v-deep .el-dialog__body {
  padding: 24px 24px 20px;
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
  font-size: 13px;
  font-weight: 500;
  color: #6a7486;
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

.quartz-job-body {
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  margin-bottom: 0;
}

.quartz-relation-db-cascader ::v-deep .el-input {
  width: 100%;
}

.quartz-relation-db-cascader ::v-deep .el-input__inner {
  height: 36px;
  line-height: 36px;
  border-radius: 8px;
  padding: 0 12px;
  color: #31415f;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.quartz-relation-db-cascader ::v-deep .el-input__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
}

::v-deep .el-input__inner {
  border-radius: 8px;
  height: 36px;
  line-height: 36px;
}

::v-deep .el-button {
  border-radius: 6px;
}

.mq-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.mq-node-icon {
  color: #909399;
  font-size: 14px;
}

.mq-node-label {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<style>
.relation-db-cascader-popper.el-popper[x-placement^='bottom'] {
  margin-top: 6px;
}

.relation-db-cascader-popper {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.relation-db-cascader-popper .el-cascader-menu {
  min-width: 200px;
}
</style>
