<template>
  <div class="field-splitter-config">
    <div class="config-content">
      <FlowConfigHero
        badge="转换"
        title="字段拆分为多列"
        description="按分隔符将单个字段拆成多列，可配置每列类型与去空格策略。"
        tone="violet"
        icon="el-icon-s-grid"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="字段拆分为多列">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">
            需要拆分的字段名称
            <el-tooltip content="选择或输入上游流中的字段名，按分隔符拆分为多列。" placement="top">
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

        <div class="section-header section-header--static">
          <h4>输出字段配置</h4>
        </div>
        <div class="section-content">
          <div class="field-table-wrap field-table-wrap--compact">
            <el-table
              class="api-param-table api-param-table--fill"
              :data="displayFieldList"
              border
              style="width: 100%"
              max-height="150"
              empty-text="暂无数据"
            >
              <el-table-column type="index" label="#" width="44" align="center" header-align="center" />
              <el-table-column prop="fieldName" label="输出字段名称" min-width="120" show-overflow-tooltip align="center" header-align="center" />
              <el-table-column label="字段类型" min-width="120" align="center" header-align="center">
                <template slot-scope="scope">
                  {{ fieldTypeLabel(scope.row.fieldType) }}
                </template>
              </el-table-column>
              <el-table-column label="是否需要去除空格" min-width="140" align="center" header-align="center">
                <template slot-scope="scope">
                  {{ fieldTrimTypeLabel(scope.row.fieldTrimType) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="field-actions">
            <button type="button" class="dash-btn" @click.stop="openFieldDialog">
              <i class="el-icon-edit" /> 编辑转换配置
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

    <el-dialog
      :visible.sync="fieldDialog.visible"
      title="输出字段配置"
      width="920px"
      custom-class="api-input-param-dialog"
      append-to-body
      :close-on-click-modal="false"
      @open="onFieldDialogOpen"
      @close="onFieldDialogClose"
    >
      <div class="dlg-body">
        <div class="field-config-label">
          <span class="req-mark">*</span> 字段配置：
        </div>
        <div class="dlg-table dlg-table--param-editor">
          <el-table
            class="api-param-table api-param-table--fill api-param-table--dialog"
            :data="fieldDialog.rows"
            border
            style="width: 100%"
            :max-height="paramEditorBodyMaxHeight(fieldDialog.rows)"
            empty-text="暂无数据"
          >
            <el-table-column type="index" label="#" width="44" align="center" header-align="center" />
            <el-table-column min-width="160" align="center" header-align="center">
              <template slot="header">
                <span class="req-before">输出字段名称</span>
              </template>
              <template slot-scope="scope">
                <el-input v-model="scope.row.fieldName" size="small" placeholder="请输入输出字段名称" />
              </template>
            </el-table-column>
            <el-table-column min-width="160" align="center" header-align="center">
              <template slot="header">
                <span class="header-with-hint">
                  <span class="req-before">字段类型</span>
                  <el-tooltip content="与 Kettle 值类型编码一致，具体选项由组件树 config 字典 fieldType 提供。" placement="top">
                    <i class="el-icon-question help-i help-i--inline" />
                  </el-tooltip>
                </span>
              </template>
              <template slot-scope="scope">
                <el-select v-model="scope.row.fieldType" size="small" class="w-100" placeholder="请选择类型" filterable>
                  <el-option
                    v-for="t in fieldTypeOptions"
                    :key="'ft-' + t.value"
                    :label="t.label"
                    :value="String(t.value)"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column min-width="200" align="center" header-align="center">
              <template slot="header">
                <span class="req-before">是否需要去除空格</span>
              </template>
              <template slot-scope="scope">
                <el-select
                  v-model="scope.row.fieldTrimType"
                  size="small"
                  class="w-100"
                  placeholder="请选择是否需要去除空格"
                  filterable
                >
                  <el-option
                    v-for="t in fieldTrimTypeOptions"
                    :key="'tr-' + t.value"
                    :label="t.label"
                    :value="String(t.value)"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="72" fixed="right" align="center" header-align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="removeDialogRow(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <button type="button" class="dash-btn dlg-add-row-btn" @click="addDialogRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>
      <span slot="footer" class="dialog-footer dlg-footer">
        <el-button type="primary" @click="confirmFieldDialog">确定</el-button>
        <el-button @click="fieldDialog.visible = false">取消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

function safeParseJson(raw) {
  if (raw == null || raw === '') return null
  if (typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  }
  return null
}

const DEFAULT_FIELD_TYPE_OPTIONS = [
  { label: 'BigNumber', value: '6' },
  { label: 'Binary', value: '8' },
  { label: 'Boolean', value: '4' },
  { label: 'Date', value: '3' },
  { label: 'Integer', value: '5' },
  { label: 'Number', value: '1' },
  { label: 'String', value: '2' },
  { label: 'Timestamp', value: '9' }
]

const DEFAULT_FIELD_TRIM_TYPE_OPTIONS = [
  { label: '不去掉空格', value: '0' },
  { label: '去掉左空格', value: '1' },
  { label: '去掉右空格', value: '2' },
  { label: '去掉左右两端空格', value: '3' }
]

function dictOptionsFromTreeRow(row) {
  if (!row || !Array.isArray(row.list)) return []
  return row.list
    .map((x) => {
      const value = x?.code != null ? String(x.code) : ''
      const label = x?.value != null ? String(x.value) : value
      return value ? { label, value } : null
    })
    .filter(Boolean)
}

function emptyDialogRow(fieldTypeOptions, trimOptions) {
  const ft = fieldTypeOptions[0] ? String(fieldTypeOptions[0].value) : '2'
  const tr = trimOptions[0] ? String(trimOptions[0].value) : '0'
  return { fieldName: '', fieldType: ft, fieldTrimType: tr }
}

export default {
  name: 'FieldSplitterConfig',
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
      streamFieldOptions: [],
      fieldDialog: {
        visible: false,
        rows: []
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
    },
    dictRows() {
      const raw = safeParseJson(this.componentTreeConfig)
      if (Array.isArray(raw)) return raw
      if (raw && Array.isArray(raw.list)) return raw.list
      if (raw && Array.isArray(raw.data)) return raw.data
      if (raw && Array.isArray(raw.dicts)) return raw.dicts
      return []
    },
    fieldTypeOptions() {
      const row = this.dictRows.find(x => String(x?.dictCode || '').trim() === 'fieldType')
      const opts = dictOptionsFromTreeRow(row)
      return opts.length ? opts : DEFAULT_FIELD_TYPE_OPTIONS
    },
    fieldTrimTypeOptions() {
      const row = this.dictRows.find(x => String(x?.dictCode || '').trim() === 'fieldTrimType')
      const opts = dictOptionsFromTreeRow(row)
      return opts.length ? opts : DEFAULT_FIELD_TRIM_TYPE_OPTIONS
    },
    streamFieldOptionList() {
      return this.streamFieldOptions.filter(Boolean)
    },
    displayFieldList() {
      const list = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      return list.map((r) => ({
        fieldName: r?.fieldName != null ? String(r.fieldName) : '',
        fieldType: r?.fieldType,
        fieldTrimType: r?.fieldTrimType
      }))
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
    },
    componentTreeConfig: {
      handler() {
        this.initDefaults()
      },
      deep: true
    }
  },
  mounted() {
    this.initDefaults()
    this.refreshFieldOptionsFromGraph()
  },
  methods: {
    paramEditorBodyMaxHeight(list) {
      return Array.isArray(list) && list.length > 0 ? 280 : undefined
    },
    fieldTypeLabel(v) {
      const s = v != null && v !== '' ? String(v) : ''
      const hit = this.fieldTypeOptions.find(x => String(x.value) === s)
      return hit ? hit.label : s
    },
    fieldTrimTypeLabel(v) {
      const s = v != null && v !== '' ? String(v) : ''
      const hit = this.fieldTrimTypeOptions.find(x => String(x.value) === s)
      return hit ? hit.label : s
    },
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', '字段拆分为多列')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.splitField === undefined) this.$set(this.formData, 'splitField', '')
      if (this.formData.delimiter === undefined || this.formData.delimiter === '') {
        this.$set(this.formData, 'delimiter', ',')
      }
      if (!Array.isArray(this.formData.fieldList)) this.$set(this.formData, 'fieldList', [])
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
    },
    normalizeStoredRow(r) {
      if (!r || typeof r !== 'object') {
        return {
          fieldName: '',
          fieldType: this.fieldTypeOptions[0] ? Number(this.fieldTypeOptions[0].value) : 2,
          fieldTrimType: this.fieldTrimTypeOptions[0] ? Number(this.fieldTrimTypeOptions[0].value) : 0
        }
      }
      const name = r.fieldName != null ? String(r.fieldName).trim() : ''
      const ft = Math.trunc(Number(r.fieldType))
      const tr = Math.trunc(Number(r.fieldTrimType))
      const ftOk = this.fieldTypeOptions.some(o => Number(o.value) === ft)
      const trOk = this.fieldTrimTypeOptions.some(o => Number(o.value) === tr)
      return {
        fieldName: name,
        fieldType: ftOk ? ft : (this.fieldTypeOptions[0] ? Number(this.fieldTypeOptions[0].value) : 2),
        fieldTrimType: trOk ? tr : (this.fieldTrimTypeOptions[0] ? Number(this.fieldTrimTypeOptions[0].value) : 0)
      }
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
          code: this.formData.code || 'FieldSplitter',
          data: {
            name: this.formData.name,
            code: this.formData.code || 'FieldSplitter',
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
          stepName: this.formData.name || '字段拆分为多列',
          code: this.formData.code || 'FieldSplitter',
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
        }
      } catch (e) {
        /* ignore */
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
    openFieldDialog() {
      this.fieldDialog.visible = true
    },
    onFieldDialogOpen() {
      const list = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      this.fieldDialog.rows = list.length
        ? list.map((r) => {
          const n = this.normalizeStoredRow(r)
          return {
            fieldName: n.fieldName,
            fieldType: String(n.fieldType),
            fieldTrimType: String(n.fieldTrimType)
          }
        })
        : []
    },
    onFieldDialogClose() {
      this.fieldDialog.rows = []
    },
    addDialogRow() {
      const row = emptyDialogRow(this.fieldTypeOptions, this.fieldTrimTypeOptions)
      this.fieldDialog.rows.push(row)
    },
    removeDialogRow(index) {
      this.fieldDialog.rows.splice(index, 1)
    },
    confirmFieldDialog() {
      const rows = Array.isArray(this.fieldDialog.rows) ? this.fieldDialog.rows : []
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        const name = String(r?.fieldName || '').trim()
        if (!name) {
          this.$message.warning(`第 ${i + 1} 行请填写输出字段名称`)
          return
        }
        if (r.fieldType === undefined || r.fieldType === null || r.fieldType === '') {
          this.$message.warning(`第 ${i + 1} 行请选择字段类型`)
          return
        }
        if (r.fieldTrimType === undefined || r.fieldTrimType === null || r.fieldTrimType === '') {
          this.$message.warning(`第 ${i + 1} 行请选择是否需要去除空格`)
          return
        }
      }
      const normalized = rows.map((r) => ({
        fieldName: String(r.fieldName).trim(),
        fieldType: Math.trunc(Number(r.fieldType)),
        fieldTrimType: Math.trunc(Number(r.fieldTrimType))
      }))
      this.$set(this.formData, 'fieldList', normalized)
      this.fieldDialog.visible = false
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
      const list = Array.isArray(this.formData.fieldList) ? this.formData.fieldList.map(r => this.normalizeStoredRow(r)) : []
      const filled = list.filter(r => r.fieldName)
      if (!filled.length) {
        this.$message.warning('请至少配置一条输出字段（点击「编辑转换配置」）')
        return
      }
      const copies = this.formData.copiesCache != null && this.formData.copiesCache !== ''
        ? Math.max(1, Math.trunc(Number(this.formData.copiesCache)))
        : 1

      this.$set(this.formData, 'name', name)
      this.$set(this.formData, 'splitField', splitField)
      this.$set(this.formData, 'delimiter', delimiter)
      this.$set(this.formData, 'fieldList', filled)
      this.$set(this.formData, 'copiesCache', copies)

      this.$emit('save', this.formData)
    }
  }
}
</script>

<style scoped>
.field-splitter-config {
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

.help-i--inline {
  margin-left: 2px;
  vertical-align: middle;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.section-header--static {
  cursor: default;
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
  margin-bottom: 16px;
}

.field-table-wrap {
  width: 100%;
}

.field-table-wrap--compact {
  width: 100%;
  min-width: 0;
}

.field-splitter-config ::v-deep .api-param-table--fill.el-table {
  width: 100% !important;
}

.field-splitter-config ::v-deep .api-param-table--fill .el-table__header-wrapper table,
.field-splitter-config ::v-deep .api-param-table--fill .el-table__body-wrapper table {
  width: 100% !important;
  table-layout: fixed;
}

.field-splitter-config ::v-deep .api-param-table .cell {
  text-align: center;
}

.field-splitter-config ::v-deep .api-param-table .el-table__empty-text {
  display: block;
  width: 100%;
  text-align: center;
}

.field-actions {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.dash-btn {
  width: 100%;
  max-width: 100%;
  height: 40px;
  border: 1px dashed #409eff;
  border-radius: 6px;
  background: #fff;
  color: #409eff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.dash-btn:hover {
  background: #ecf5ff;
}

.advanced-layout {
  padding-top: 4px;
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

.field-config-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.req-mark {
  color: #f56c6c;
  margin-right: 4px;
}

.req-before::before {
  content: '*';
  color: #f56c6c;
  margin-right: 2px;
}

.dlg-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.dlg-table {
  width: 100%;
}

.dlg-table--param-editor {
  flex: 0 0 auto;
}

.dlg-add-row-btn {
  margin-top: 0;
}

.dlg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.w-100 {
  width: 100%;
}

.header-with-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
</style>
