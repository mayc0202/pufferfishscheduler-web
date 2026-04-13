<template>
  <div class="split-field-to-rows-config">
    <div class="config-content">
      <FlowConfigHero
        badge="转换"
        title="字段拆分多行"
        description="将单个字段按分隔符拆成多行记录，用于一行变多行的展开场景。"
        tone="violet"
        icon="el-icon-s-unfold"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="字段拆分多行">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">
            需要拆分的字段名称
            <el-tooltip content="选择或输入上游流中的字段名，按分隔符拆成多行输出。" placement="top">
              <i class="el-icon-question help-i" />
            </el-tooltip>
            ：
          </label>
          <el-select
            v-model="formData.splitField"
            class="form-select"
            filterable
            allow-create
            default-first-option
            clearable
            placeholder="请选择转换字段名称"
            @visible-change="onSplitFieldDropdownVisible"
          >
            <el-option
              v-for="opt in streamFieldOptionList"
              :key="'sf-' + opt"
              :label="opt"
              :value="opt"
            />
          </el-select>
        </div>

        <div class="form-item">
          <label class="form-label required">分隔符：</label>
          <input v-model="formData.delimiter" type="text" class="form-input" placeholder="请输入分隔符，如英文逗号">
        </div>

        <div class="form-item">
          <label class="form-label required">输出字段名称：</label>
          <input v-model="formData.newFieldname" type="text" class="form-input" placeholder="请输入输出字段名称">
        </div>
      </template>

      <template v-else>
        <div class="advanced-layout">
          <div class="section-header" @click="sectionOpen.distribution = !sectionOpen.distribution">
            <h4>数据分发</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.distribution ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.distribution" class="section-content">
            <div class="form-item form-item--radios">
              <label class="form-label">数据分发模式：</label>
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
              <label class="form-label">
                并发数量：
                <el-tooltip content="步骤多副本并行时的副本数量。" placement="top">
                  <i class="el-icon-question help-i" />
                </el-tooltip>
              </label>
              <input v-model.number="formData.copiesCache" type="number" min="1" class="form-input" placeholder="1">
            </div>
          </div>
        </div>
      </template>

      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

export default {
  name: 'SplitFieldToRowsConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
    },
    flowId: {
      type: [Number, String],
      default: null
    },
    flowConfig: {
      type: Object,
      default: null
    },
    currentNodeId: {
      type: String,
      default: ''
    },
    componentTreeConfig: {
      type: [Object, String, Array],
      default: null
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        distribution: false,
        parallel: false
      },
      streamFieldOptions: []
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
    },
    streamFieldOptionList() {
      return this.streamFieldOptions.filter(Boolean)
    }
  },
  watch: {
    flowConfig: {
      handler() {
        this.refreshFieldOptionsFromGraph()
      },
      deep: true
    },
    currentNodeId() {
      this.refreshFieldOptionsFromGraph()
    }
  },
  mounted() {
    this.initDefaults()
    this.refreshFieldOptionsFromGraph()
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', '字段拆分多行')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.splitField === undefined) this.$set(this.formData, 'splitField', '')
      if (this.formData.delimiter === undefined || this.formData.delimiter === '') {
        this.$set(this.formData, 'delimiter', ',')
      }
      if (this.formData.newFieldname === undefined) this.$set(this.formData, 'newFieldname', '')
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
    },
    buildFlowConfigWithCurrentNode() {
      const base = this.flowConfig ? clone(this.flowConfig) : { cells: [] }
      if (!base.cells || !Array.isArray(base.cells)) base.cells = []
      if (!this.currentNodeId) return base

      const idx = base.cells.findIndex(c => String(c.id) === String(this.currentNodeId))
      if (idx < 0) return base

      const cell = base.cells[idx] || {}
      const cellData = cell.data && typeof cell.data === 'object' ? cell.data : {}
      base.cells[idx] = {
        ...cell,
        data: {
          ...cellData,
          name: this.formData.name,
          code: this.formData.code || 'SplitFieldToRows',
          data: {
            name: this.formData.name,
            code: this.formData.code || 'SplitFieldToRows',
            data: {
              ...this.formData
            }
          }
        }
      }
      return base
    },
    async loadFieldOptionsFromApi() {
      try {
        const mergedFlowConfig = this.buildFlowConfigWithCurrentNode()
        const res = await getFlowFieldStream({
          flowId: this.flowId,
          config: JSON.stringify(mergedFlowConfig),
          stepName: this.formData.name || '字段拆分多行',
          code: this.formData.code || 'SplitFieldToRows',
          dbId: this.formData.dbId,
          tableId: this.formData.tableId
        })
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          const names = res.data
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
          this.streamFieldOptions = Array.from(new Set(names.map(n => String(n))))
          return
        }
        if (res && res.code === '000000' && res.data && Array.isArray(res.data.fieldList)) {
          const names = res.data.fieldList
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
          this.streamFieldOptions = Array.from(new Set(names.map(n => String(n))))
          return
        }
      } catch (e) {
        /* 忽略，保留图解析结果 */
      }
    },
    refreshFieldOptionsFromGraph() {
      const cfg = this.flowConfig && Array.isArray(this.flowConfig.cells) ? this.flowConfig : { cells: [] }
      const nodeId = String(this.currentNodeId || '')
      if (!nodeId) {
        this.streamFieldOptions = []
        return
      }

      const nodeMap = new Map()
      const incomingFromIds = []
      cfg.cells.forEach((c) => {
        if (!c) return
        if (c.shape === 'edge') {
          const targetId = String(c?.target?.cell || '')
          if (targetId === nodeId) {
            incomingFromIds.push(String(c?.source?.cell || ''))
          }
        } else {
          nodeMap.set(String(c.id), c)
        }
      })

      const names = []
      incomingFromIds.forEach((sid) => {
        const node = nodeMap.get(sid)
        if (!node) return
        const dataWrap = node.data || {}
        const data = dataWrap.data && typeof dataWrap.data === 'object' ? dataWrap.data : dataWrap

        const pushName = (x) => {
          const n = x && (x.name || x.fieldName || x.fieldStream)
          if (n) names.push(String(n))
        }

        if (Array.isArray(data.fieldList)) data.fieldList.forEach(pushName)
        if (Array.isArray(data.filedList)) data.filedList.forEach(pushName)
      })

      this.streamFieldOptions = Array.from(new Set(names.filter(Boolean)))
    },
    async onSplitFieldDropdownVisible(open) {
      if (!open) return
      await this.loadFieldOptionsFromApi()
      if (!this.streamFieldOptions.length) {
        this.refreshFieldOptionsFromGraph()
      }
    },
    handleSubmit() {
      const name = String(this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请输入步骤名称')
        return
      }
      const splitField = String(this.formData.splitField || '').trim()
      if (!splitField) {
        this.$message.warning('请选择需要拆分的字段名称')
        return
      }
      const delimiter = this.formData.delimiter != null ? String(this.formData.delimiter) : ''
      if (!delimiter) {
        this.$message.warning('请输入分隔符')
        return
      }
      const newFieldname = String(this.formData.newFieldname || '').trim()
      if (!newFieldname) {
        this.$message.warning('请输入输出字段名称')
        return
      }

      const copies = this.formData.copiesCache != null && this.formData.copiesCache !== ''
        ? Math.max(1, Math.trunc(Number(this.formData.copiesCache)))
        : 1

      this.$set(this.formData, 'name', name)
      this.$set(this.formData, 'splitField', splitField)
      this.$set(this.formData, 'delimiter', delimiter)
      this.$set(this.formData, 'newFieldname', newFieldname)
      this.$set(this.formData, 'copiesCache', copies)

      this.$emit('save', this.formData)
    }
  }
}
</script>

<style scoped>
.split-field-to-rows-config {
  height: 100%;
}

.config-content {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.config-tabs {
  margin: 0 0 8px;
}

.form-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.form-item {
  margin-bottom: 16px;
  display: block;
}

.form-item--radios {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.form-item--radios .form-label {
  margin-bottom: 0;
  flex-shrink: 0;
}

.form-item--radios .el-radio-group {
  flex: 1;
  min-width: 0;
}

.form-label {
  display: block;
  width: 100%;
  text-align: left;
  line-height: 20px;
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.form-label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.form-select {
  width: 100%;
}

.help-i {
  color: #909399;
  margin: 0 4px;
  cursor: default;
}

.advanced-layout {
  padding-top: 4px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.btn {
  padding: 0 20px;
  height: 36px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: #fff;
  color: #606266;
}

.primary-btn {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.secondary-btn {
  background: #fff;
  border: 1px solid #dcdfe6;
}

.secondary-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}
</style>
