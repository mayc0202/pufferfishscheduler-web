<template>
  <div class="field-select-config">
    <div class="config-content">
      <FlowConfigHero
        badge="转换"
        title="字段选择"
        description="从数据流中挑选字段、重命名及调整长度精度，剔除不需要的列。"
        tone="violet"
        icon="el-icon-s-check"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="字段选择">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">选择字段：</label>
          <div class="field-mapping">
            <div class="field-table-wrap">
              <el-table
                :data="formData.fieldList"
                border
                style="width: 100%"
                max-height="260"
                empty-text="暂无数据"
              >
                <el-table-column type="index" label="#" width="50" />
                <el-table-column label="名称" min-width="120" prop="name" show-overflow-tooltip />
                <el-table-column label="改名为" min-width="120" prop="rename" show-overflow-tooltip />
                <el-table-column label="长度" width="88" prop="length" />
                <el-table-column label="精度" width="88" prop="precision" />
              </el-table>
            </div>
            <div class="field-actions">
              <button type="button" class="dash-btn" @click="openFieldDialog">
                <i class="el-icon-edit" /> 编辑字段
              </button>
            </div>
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
      title="更新字段"
      width="820px"
      top="6vh"
      append-to-body
      :close-on-click-modal="false"
      @open="onFieldDialogOpen"
    >
      <div class="dialog-field-toolbar">
        <span class="dialog-field-label"><span class="req-mark">*</span> 字段：</span>
        <el-tooltip placement="right" max-width="400">
          <div slot="content">
            「流字段」须与上游输出列名一致；「改名为」留空表示不改变列名。长度、精度与 Kettle 字段元数据一致，不填时按 -1 交由引擎处理。
          </div>
          <span class="hint-link"><i class="el-icon-info" /> 说明</span>
        </el-tooltip>
      </div>
      <el-table :data="fieldDialog.rows" border max-height="420" empty-text="暂无数据">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column min-width="200">
          <template slot="header">
            <span class="req-before">流字段</span>
          </template>
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.name"
              filterable
              allow-create
              default-first-option
              clearable
              placeholder="下拉选择或者手动输入"
              class="stream-select"
              size="small"
            >
              <el-option
                v-for="opt in streamFieldOptions"
                :key="'sf-' + opt"
                :label="opt"
                :value="opt"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="改名为" min-width="140">
          <template slot-scope="scope">
            <el-input v-model="scope.row.rename" size="small" placeholder="请输入名称" />
          </template>
        </el-table-column>
        <el-table-column label="长度" width="100">
          <template slot-scope="scope">
            <el-input v-model="scope.row.length" size="small" placeholder="请输入长度" />
          </template>
        </el-table-column>
        <el-table-column label="精度" width="100">
          <template slot-scope="scope">
            <el-input v-model="scope.row.precision" size="small" placeholder="请输入精度" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="72" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="removeFieldRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="add-row-wrap">
        <button type="button" class="dash-btn" @click="addFieldRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>
      <span slot="footer" class="field-select-dlg-footer">
        <el-button type="primary" :loading="fieldFetchLoading" @click="fetchStreamFields">获取字段</el-button>
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

function coerceMetaInt(raw, fallback = -1) {
  if (raw === undefined || raw === null || raw === '') return fallback
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.trunc(n)
}

function emptySelectRow() {
  return { name: '', rename: '', length: '', precision: '' }
}

function normalizeSelectRow(r) {
  if (!r || typeof r !== 'object') return emptySelectRow()
  const lenNum = r.length === undefined || r.length === null || r.length === '' ? -1 : Number(r.length)
  const precNum = r.precision === undefined || r.precision === null || r.precision === '' ? -1 : Number(r.precision)
  return {
    name: r.name != null ? String(r.name).trim() : '',
    rename: r.rename != null ? String(r.rename).trim() : '',
    length: Number.isFinite(lenNum) && lenNum !== -1 ? String(lenNum) : '',
    precision: Number.isFinite(precNum) && precNum !== -1 ? String(precNum) : ''
  }
}

function rowToPayload(r) {
  const name = r.name != null ? String(r.name).trim() : ''
  const rename = r.rename != null ? String(r.rename).trim() : ''
  return {
    name,
    rename,
    length: coerceMetaInt(r.length, -1),
    precision: coerceMetaInt(r.precision, -1)
  }
}

function pickNameFromStreamItem(x) {
  if (typeof x === 'string') return x.trim()
  if (!x || typeof x !== 'object') return ''
  const n = x.name || x.fieldName || x.fieldStream || x.field
  return n != null ? String(n).trim() : ''
}

function rowFromStreamItem(x) {
  const name = pickNameFromStreamItem(x)
  if (!name) return null
  let length = -1
  let precision = -1
  if (x && typeof x === 'object') {
    if (x.length !== undefined && x.length !== null && x.length !== '') {
      length = coerceMetaInt(x.length, -1)
    }
    if (x.precision !== undefined && x.precision !== null && x.precision !== '') {
      precision = coerceMetaInt(x.precision, -1)
    }
  }
  return {
    name,
    rename: '',
    length: length === -1 ? '' : String(length),
    precision: precision === -1 ? '' : String(precision)
  }
}

export default {
  name: 'FieldSelectConfig',
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
        distribution: false,
        parallel: false
      },
      streamFieldOptions: [],
      fieldFetchLoading: false,
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
    }
  },
  watch: {
    flowConfig: {
      handler() {
        this.refreshStreamOptionsFromGraph()
      },
      deep: true
    },
    currentNodeId() {
      this.refreshStreamOptionsFromGraph()
    }
  },
  mounted() {
    this.initDefaults()
    this.refreshStreamOptionsFromGraph()
  },
  methods: {
    stripLegacyNestedData() {
      const d = this.formData.data
      if (d != null && typeof d === 'object' && !Array.isArray(d)) {
        this.$delete(this.formData, 'data')
      }
    },
    initDefaults() {
      this.stripLegacyNestedData()
      if (!this.formData.name) this.$set(this.formData, 'name', '字段选择')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (!Array.isArray(this.formData.fieldList)) {
        this.$set(this.formData, 'fieldList', [])
      } else {
        this.$set(this.formData, 'fieldList', this.formData.fieldList.map(normalizeSelectRow))
      }
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
    async loadStreamFieldOptionsFromApi() {
      if (!this.flowId) return
      try {
        const mergedFlowConfig = this.buildFlowConfigWithCurrentNode()
        const res = await getFlowFieldStream({
          flowId: this.flowId,
          config: JSON.stringify(mergedFlowConfig),
          stepName: this.formData.name || '字段选择',
          code: this.formData.code || 'FieldSelect',
          dbId: this.formData.dbId,
          tableId: this.formData.tableId
        })
        let names = []
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          names = res.data.map(pickNameFromStreamItem).filter(Boolean)
        } else if (res && res.code === '000000' && res.data && Array.isArray(res.data.fieldList)) {
          names = res.data.fieldList.map(pickNameFromStreamItem).filter(Boolean)
        }
        this.streamFieldOptions = Array.from(new Set(names))
      } catch (e) {
        this.streamFieldOptions = []
      }
    },
    refreshStreamOptionsFromGraph() {
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
          const n = x && (x.name || x.fieldName || x.fieldStream || x.outputName || x.kafkaName)
          if (n) names.push(String(n))
        }

        if (Array.isArray(data.fieldList)) data.fieldList.forEach(pushName)
        if (Array.isArray(data.filedList)) data.filedList.forEach(pushName)
      })

      this.streamFieldOptions = Array.from(new Set(names.filter(Boolean)))
    },
    async openFieldDialog() {
      await this.loadStreamFieldOptionsFromApi()
      if (!this.streamFieldOptions.length) {
        this.refreshStreamOptionsFromGraph()
      }
      this.fieldDialog.visible = true
    },
    onFieldDialogOpen() {
      const src = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      this.fieldDialog.rows = src.length ? src.map(r => normalizeSelectRow(r)) : [emptySelectRow()]
    },
    addFieldRow() {
      this.fieldDialog.rows.push(emptySelectRow())
    },
    removeFieldRow(index) {
      this.fieldDialog.rows.splice(index, 1)
      if (!this.fieldDialog.rows.length) this.fieldDialog.rows.push(emptySelectRow())
    },
    async fetchStreamFields() {
      if (this.fieldFetchLoading) return
      if (!this.flowId) {
        this.$message.warning('流程ID不存在，无法获取字段')
        return
      }
      const stepName = String(this.formData.name || '').trim()
      if (!stepName) {
        this.$message.warning('请先填写步骤名称')
        return
      }
      this.fieldFetchLoading = true
      try {
        const mergedFlowConfig = this.buildFlowConfigWithCurrentNode()
        const res = await getFlowFieldStream({
          flowId: this.flowId,
          config: JSON.stringify(mergedFlowConfig),
          stepName,
          code: this.formData.code || 'FieldSelect',
          dbId: this.formData.dbId,
          tableId: this.formData.tableId
        })

        const rows = []
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          res.data.forEach((x) => {
            const row = rowFromStreamItem(x)
            if (row) rows.push(row)
          })
        } else if (res && res.code === '000000' && res.data && Array.isArray(res.data.fieldList)) {
          res.data.fieldList.forEach((x) => {
            const row = rowFromStreamItem(x)
            if (row) rows.push(row)
          })
        }

        if (!rows.length) {
          this.$message.warning(res && res.message ? res.message : '未获取到上游字段，请检查连线与上游步骤')
          return
        }
        this.fieldDialog.rows = rows
        this.streamFieldOptions = Array.from(new Set(rows.map(r => r.name).filter(Boolean)))
        this.$message.success('获取字段成功')
      } catch (e) {
        this.$message.error('获取字段失败')
      } finally {
        this.fieldFetchLoading = false
      }
    },
    confirmFieldDialog() {
      const staged = this.fieldDialog.rows.map(normalizeSelectRow)
      for (let i = 0; i < staged.length; i++) {
        const r = staged[i]
        const any = r.name || r.rename || r.length !== '' || r.precision !== ''
        if (!any) continue
        if (!r.name) {
          this.$message.warning(`第 ${i + 1} 行请填写流字段，或删除空行`)
          return
        }
      }
      const cleaned = staged.filter(r => r.name)
      this.$set(this.formData, 'fieldList', cleaned)
      this.stripLegacyNestedData()
      this.fieldDialog.visible = false
    },
    buildPayloadForSave() {
      const raw = { ...this.formData }
      this.stripLegacyNestedData()
      if (raw.data != null && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
        delete raw.data
      }

      const list = Array.isArray(raw.fieldList) ? raw.fieldList.map(rowToPayload).filter(r => r.name) : []
      raw.fieldList = list

      const copies = raw.copiesCache != null && raw.copiesCache !== ''
        ? Math.max(1, Math.trunc(Number(raw.copiesCache)))
        : 1
      raw.copiesCache = copies
      raw.distributeType = !!raw.distributeType

      return raw
    },
    handleSubmit() {
      const name = String(this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      const list = Array.isArray(this.formData.fieldList)
        ? this.formData.fieldList.map(normalizeSelectRow).filter(r => r.name)
        : []
      if (!list.length) {
        this.$message.warning('请至少选择或配置一个流字段')
        return
      }
      for (let i = 0; i < list.length; i++) {
        const r = list[i]
        if (r.length !== '' && !Number.isFinite(Number(r.length))) {
          this.$message.warning(`第 ${i + 1} 行长度须为数字或留空`)
          return
        }
        if (r.precision !== '' && !Number.isFinite(Number(r.precision))) {
          this.$message.warning(`第 ${i + 1} 行精度须为数字或留空`)
          return
        }
      }
      this.$set(this.formData, 'fieldList', list)
      this.$emit('save', this.buildPayloadForSave())
    }
  }
}
</script>

<style scoped>
.field-select-config {
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

.help-i {
  color: #909399;
  margin-left: 4px;
  cursor: default;
}

.field-mapping {
  width: 100%;
}

.field-table-wrap {
  width: 100%;
}

.field-actions {
  margin-top: 10px;
}

.dash-btn {
  width: 100%;
  height: 40px;
  border: 1px dashed #409eff;
  border-radius: 6px;
  background: #fff;
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
}

.dash-btn:hover {
  background: #ecf5ff;
}

.add-row-wrap {
  margin-top: 12px;
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

.advanced-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.advanced-label {
  font-size: 14px;
  color: #606266;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
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

.dialog-field-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.dialog-field-label {
  font-size: 14px;
  color: #606266;
}

.req-mark {
  color: #f56c6c;
  margin-right: 2px;
}

.req-before::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.hint-link {
  font-size: 13px;
  color: #409eff;
  cursor: default;
}

.stream-select {
  width: 100%;
}

.field-select-dlg-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
</style>
