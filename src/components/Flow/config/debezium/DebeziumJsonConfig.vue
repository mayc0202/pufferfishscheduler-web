<template>
  <div class="debezium-json-config">
    <div class="config-content">
      <FlowConfigHero
        badge="CDC"
        title="解析 Debezium 报文"
        description="将 Debezium 变更捕获 JSON 解析为扁平字段，便于关系库或数仓同步。"
        tone="teal"
        icon="el-icon-connection"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">节点名称：</label>
          <input
            v-model="formData.name"
            type="text"
            class="form-input"
            placeholder="解析Debezium报文"
          >
        </div>

        <div class="form-item">
          <label class="form-label">节点说明：</label>
          <textarea
            v-model="formData.description"
            class="form-textarea"
            placeholder="请输入说明"
            rows="3"
          />
        </div>

        <div class="form-item">
          <label class="form-label required">源字段：</label>
          <el-select
            v-model="formData.sourceField"
            filterable
            allow-create
            clearable
            default-first-option
            placeholder="下拉选择或者手动输入"
            class="form-select"
            popper-class="debezium-source-field-popper"
            @visible-change="(v) => v && loadAvailableFields()"
          >
            <el-option v-for="fd in availableFieldOptions" :key="fd" :label="fd" :value="fd" />
          </el-select>
        </div>

        <div class="section-header" @click="sectionOpen.outputFields = !sectionOpen.outputFields">
          <h4>输出字段配置</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.outputFields ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>

        <div v-show="sectionOpen.outputFields" class="section-content">
          <div class="field-table-wrap">
            <el-table :data="formData.fieldList" border style="width: 100%" max-height="260">
              <el-table-column type="index" label="#" width="60" />
              <el-table-column label="名称" min-width="180" show-overflow-tooltip>
                <template slot-scope="scope">
                  <div class="wrap-cell">{{ scope.row.name }}</div>
                </template>
              </el-table-column>
              <el-table-column label="类型" min-width="180" show-overflow-tooltip>
                <template slot-scope="scope">
                  <div class="wrap-cell">{{ scope.row.type }}</div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="field-actions">
            <button type="button" class="dash-btn" @click="openFieldEditor">
              <i class="el-icon-edit" /> 编辑字段
            </button>
          </div>
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
          <div class="radio-row">
            <div class="radio-label">数据分发模式：</div>
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
            <label class="form-label">并发数量：</label>
            <input
              v-model.number="formData.copiesCache"
              type="number"
              min="1"
              class="form-input"
              placeholder="1"
            >
          </div>
        </div>
        </div>
      </template>

      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <el-dialog
      :visible.sync="fieldEditor.visible"
      title="编辑字段"
      width="960px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="debezium-field-dialog"
      @open="onFieldDialogOpen"
    >
      <div class="field-editor-toolbar">
        <div class="toolbar-left">
          <div class="toolbar-sub">维护输出字段（名称 / 类型 / 长度 / 精度）</div>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" size="mini" plain icon="el-icon-magic-stick" @click="quickConfig.visible = true">
            快速配置
          </el-button>
        </div>
      </div>

      <el-table :data="fieldEditor.rows" border style="width: 100%" max-height="360">
        <el-table-column type="index" label="#" width="56" />
        <el-table-column label="名称" min-width="240">
          <template slot-scope="scope">
            <el-input v-model="scope.row.name" size="small" placeholder="请输入名称" />
          </template>
        </el-table-column>
        <el-table-column label="类型" width="180">
          <template slot-scope="scope">
            <el-select v-model="scope.row.type" placeholder="请选择类型" size="small" class="field-type-select">
              <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="长度" width="140">
          <template slot-scope="scope">
            <el-input
              v-model.number="scope.row.length"
              size="small"
              type="number"
              placeholder="请输入长度"
            />
          </template>
        </el-table-column>
        <el-table-column label="精度" width="140">
          <template slot-scope="scope">
            <el-input
              v-model.number="scope.row.precision"
              size="small"
              type="number"
              placeholder="请输入精度"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="88" align="center">
          <template slot-scope="scope">
            <el-button type="text" @click="removeFieldRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="add-row-wrap">
        <button type="button" class="btn add-row-btn" @click="addFieldRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="confirmFieldEditor">确定</el-button>
        <el-button @click="fieldEditor.visible = false">取消</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="quickConfig.visible"
      title="快速配置"
      width="900px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="debezium-quick-dialog"
    >
      <el-alert
        class="quick-alert"
        type="info"
        :closable="false"
        show-icon
        title="粘贴一条 Debezium JSON 消息，系统将自动解析 payload.after / after / payload.before / before 并生成输出字段。"
      />
      <div class="quick-title">
        <span class="req-dot">*</span>JSON报文：
        <span class="quick-sub">通过Debezium JSON格式报文，快速解析输出字段。</span>
      </div>
      <textarea
        v-model="formData.sample"
        class="quick-textarea"
        placeholder="粘贴一条 Debezium JSON 消息（支持 payload.after / after / payload.before 等结构）"
        rows="16"
      />
      <span slot="footer" class="dialog-footer">
        <el-button @click="quickConfig.visible = false">取消</el-button>
        <el-button :loading="quickConfig.loading" type="primary" @click="parseJsonToFields">解析</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import { parseSampleData as parseDebeziumSampleData } from '@/api/collect/plugin/debezium'
import FlowConfigHero from '../common/FlowConfigHero.vue'

export default {
  name: 'DebeziumJsonConfig',
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
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        outputFields: true,
        distribution: false,
        parallel: false
      },
      availableFieldOptions: [],
      typeOptions: ['String', 'Number', 'Integer', 'Boolean', 'Date', 'Timestamp', 'Binary', 'BigNumber'],
      fieldEditor: {
        visible: false,
        rows: []
      },
      quickConfig: {
        visible: false,
        loading: false
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
    this.initDefaults()
    this.loadAvailableFields()
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', '解析Debezium报文')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.sourceField === undefined) this.$set(this.formData, 'sourceField', '')
      if (!Array.isArray(this.formData.fieldList)) this.$set(this.formData, 'fieldList', [])
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
      if (this.formData.sample === undefined || this.formData.sample === null) this.$set(this.formData, 'sample', '')
    },

    buildFlowConfigWithCurrentNode() {
      const base = this.flowConfig ? JSON.parse(JSON.stringify(this.flowConfig)) : { cells: [] }
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
          code: this.formData.code,
          data: {
            name: this.formData.name,
            code: this.formData.code,
            data: {
              ...this.formData
            }
          }
        }
      }
      return base
    },

    async loadAvailableFields() {
      if (!this.flowId) return
      try {
        const mergedFlowConfig = this.buildFlowConfigWithCurrentNode()
        const configStr = JSON.stringify(mergedFlowConfig)
        const res = await getFlowFieldStream({
          flowId: this.flowId,
          config: configStr,
          stepName: this.formData.name || '解析Debezium报文',
          code: this.formData.code || '',
          dbId: this.formData.dbId,
          tableId: this.formData.tableId
        })
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          this.availableFieldOptions = res.data
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
        } else if (res && res.code === '000000' && res.data && Array.isArray(res.data.fieldList)) {
          this.availableFieldOptions = res.data.fieldList
        } else {
          this.availableFieldOptions = []
        }
      } catch (e) {
        this.availableFieldOptions = []
      }
    },

    openFieldEditor() {
      this.fieldEditor.visible = true
    },

    onFieldDialogOpen() {
      const list = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      this.fieldEditor.rows = list.length
        ? list.map(r => ({
          name: r?.name != null ? String(r.name) : '',
          type: r?.type != null ? String(r.type) : 'String',
          length: this.normalizeNumberForUI(r?.length),
          precision: this.normalizeNumberForUI(r?.precision)
        }))
        : []
    },

    addFieldRow() {
      this.fieldEditor.rows.push({ name: '', type: 'String', length: '', precision: '' })
    },

    removeFieldRow(index) {
      this.fieldEditor.rows.splice(index, 1)
    },

    normalizeNumberOrMinusOne(v) {
      if (v === null || v === undefined || v === '') return -1
      const n = Number(v)
      return Number.isFinite(n) ? Math.trunc(n) : -1
    },

    normalizeNumberForUI(v) {
      if (v === null || v === undefined || v === '' || Number(v) === -1) return ''
      const n = Number(v)
      return Number.isFinite(n) ? Math.trunc(n) : ''
    },

    normalizeNumberOrEmpty(v) {
      if (v === null || v === undefined || v === '') return ''
      const n = Number(v)
      return Number.isFinite(n) ? Math.trunc(n) : ''
    },

    confirmFieldEditor() {
      const rows = Array.isArray(this.fieldEditor.rows) ? this.fieldEditor.rows : []
      const invalid = rows.some(r => !r || !String(r.name || '').trim() || !String(r.type || '').trim())
      if (rows.length && invalid) {
        this.$message.warning('请填写每一行的字段名称与类型')
        return
      }
      const normalized = rows
        .filter(r => r && String(r.name || '').trim())
        .map(r => ({
          name: String(r.name).trim(),
          type: String(r.type || 'String'),
          length: this.normalizeNumberOrEmpty(r.length),
          precision: this.normalizeNumberOrEmpty(r.precision)
        }))
      this.$set(this.formData, 'fieldList', normalized)
      this.fieldEditor.visible = false
    },

    async parseJsonToFields() {
      const sample = String(this.formData.sample || '').trim()
      if (!sample) {
        this.$message.warning('请先输入JSON报文')
        return
      }

      this.quickConfig.loading = true
      try {
        const res = await parseDebeziumSampleData({ sample })
        if (!res || res.code !== '000000') {
          this.$message.warning((res && res.message) || '解析失败，请校验报文格式')
          return
        }

        const rows = Array.isArray(res.data) ? res.data : []
        const fields = rows
          .map((r) => {
            const fieldName = String(r?.field || r?.name || r?.fieldName || '').trim()
            const fieldType = String(r?.dataType || r?.type || 'String').trim() || 'String'
            return {
              name: fieldName,
              type: fieldType,
              length: this.normalizeNumberOrEmpty(r?.length),
              precision: this.normalizeNumberOrEmpty(r?.precision)
            }
          })
          .filter(r => r.name)

        if (!fields.length) {
          this.$message.warning('未解析到可用字段')
          return
        }

        this.fieldEditor.rows = fields
        this.quickConfig.visible = false
        this.$message.success(`已解析 ${fields.length} 个字段，请点击“确定”保存到输出字段配置`)
      } catch (e) {
        this.$message.error((e && e.message) || '解析失败，请稍后重试')
      } finally {
        this.quickConfig.loading = false
      }
    },

    buildPayloadForSave() {
      const raw = { ...this.formData }
      raw.name = String(raw.name || '').trim()
      raw.description = raw.description != null ? String(raw.description) : ''
      raw.sourceField = raw.sourceField != null ? String(raw.sourceField).trim() : ''
      raw.sample = raw.sample != null ? String(raw.sample) : ''
      raw.copiesCache = raw.copiesCache != null && raw.copiesCache !== '' ? Math.max(1, Math.trunc(Number(raw.copiesCache))) : 1
      raw.distributeType = !!raw.distributeType
      raw.fieldList = Array.isArray(raw.fieldList)
        ? raw.fieldList
          .filter(r => r && r.name)
          .map(r => ({
            name: String(r.name),
            type: String(r.type || 'String'),
            length: this.normalizeNumberOrMinusOne(r.length),
            precision: this.normalizeNumberOrMinusOne(r.precision)
          }))
        : []
      return raw
    },

    handleSubmit() {
      const nodeName = (this.formData.name || '').trim()
      if (!nodeName) {
        this.$message.warning('请填写节点名称')
        return
      }
      if (this.activeTab === 'basic') {
        const sourceField = (this.formData.sourceField || '').trim()
        if (!sourceField) {
          this.$message.warning('请选择或输入源字段')
          return
        }
      }
      this.$emit('save', this.buildPayloadForSave())
    }
  }
}
</script>

<style lang="scss" scoped>
.debezium-json-config {
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

.form-input:focus {
  border-color: #409eff;
}

.form-select {
  width: 100%;
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

.form-textarea:focus {
  border-color: #409eff;
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

.field-table-wrap {
  width: 100%;
  max-width: 560px;
  margin-bottom: 10px;
}

.field-actions {
  width: 100%;
  max-width: 560px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wrap-cell {
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
}

.radio-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 0 8px;
}

.radio-label {
  font-size: 13px;
  color: #606266;
  flex: 0 0 auto;
}

.checkbox-item {
  align-items: center;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #f0f2f5;
  border-radius: 50%;
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
  cursor: default;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  height: 36px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s;
}

.dash-btn {
  width: 100%;
  margin-top: 0;
  height: 40px;
  border: 1px dashed #409eff;
  background: #fff;
  color: #409eff;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s, border-color 0.2s;
}

.dash-btn:hover {
  background: #ecf5ff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.primary-btn {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.primary-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.secondary-btn {
  background: #fff;
  color: #606266;
  border-color: #dcdfe6;
}

.secondary-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.add-row-wrap {
  margin-top: 12px;
}

.add-row-btn {
  width: 100%;
  height: 40px;
  border: 1px dashed #409eff;
  background: #fff;
  color: #409eff;
}

.add-row-btn:hover {
  background: #ecf5ff;
}

.field-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: linear-gradient(180deg, #f8faff 0%, #ffffff 100%);
}

.toolbar-sub {
  font-size: 12px;
  color: #909399;
}

.quick-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.req-dot {
  color: #f56c6c;
  margin-right: 6px;
}

.quick-sub {
  margin-left: 6px;
  font-size: 12px;
  color: #909399;
}

.quick-textarea {
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  min-height: 300px;
}

.quick-textarea:focus {
  border-color: #409eff;
}

.quick-alert {
  margin-bottom: 12px;
}
</style>

<style>
.debezium-source-field-popper {
  z-index: 30000 !important;
}

.debezium-field-dialog .el-dialog__body,
.debezium-quick-dialog .el-dialog__body {
  padding-top: 10px;
}

.debezium-quick-dialog .el-alert.quick-alert {
  margin-bottom: 10px;
}
</style>
