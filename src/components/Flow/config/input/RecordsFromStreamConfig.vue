<template>
  <div class="records-from-stream-config">
    <div class="config-content">
      <FlowConfigHero
        badge="流"
        title="从流中获取数据"
        description="从上一步骤的数据流中读取记录结构，用于定义或校验下游字段。"
        tone="indigo"
        icon="el-icon-sort"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="从流中获取数据">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="section-header">
          <h4>字段</h4>
        </div>
        <div class="section-content">
          <div class="field-table-wrap field-preview-table-wrap">
            <el-table
              :data="displayFieldList"
              border
              class="field-preview-table"
              style="width: 100%"
              max-height="260"
            >
              <el-table-column type="index" label="#" width="48" align="center" />
              <el-table-column prop="name" label="名称" min-width="120" show-overflow-tooltip />
              <el-table-column label="类型" min-width="100" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ fieldTypeLabel(scope.row.type) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <button type="button" class="dash-btn" @click="openFieldEditor">
            <i class="el-icon-edit" /> 编辑字段
          </button>
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
                <el-radio
                  v-for="opt in distributionOptions"
                  :key="String(opt.value)"
                  :label="String(opt.value)"
                >
                  {{ opt.label }}
                </el-radio>
              </el-radio-group>
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
      title="字段"
      width="1000px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="records-from-stream-field-dialog"
      @open="onFieldDialogOpen"
    >
      <div class="field-required"><span class="req">*</span> 字段：</div>
      <el-table :data="fieldDialog.rows" border style="width: 100%" max-height="400">
        <el-table-column type="index" label="#" width="44" />
        <el-table-column label="名称" min-width="220">
          <template slot-scope="scope">
            <el-input v-model="scope.row.name" size="small" placeholder="请输入名称" />
          </template>
        </el-table-column>
        <el-table-column label="类型" min-width="240">
          <template slot-scope="scope">
            <el-select v-model="scope.row.type" size="small" class="w-100" placeholder="请选择类型">
              <el-option
                v-for="t in fieldTypeOptions"
                :key="String(t.value)"
                :label="t.label"
                :value="String(t.value)"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="长度" min-width="180">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.length"
              size="small"
              placeholder="请输入长度"
              inputmode="numeric"
            />
          </template>
        </el-table-column>
        <el-table-column label="精度" min-width="180">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.precision"
              size="small"
              placeholder="请输入精度"
              inputmode="numeric"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="72" align="center">
          <template slot-scope="scope">
            <el-button type="text" @click="removeRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <button type="button" class="dash-btn add-row-btn" @click="addRow">
        <i class="el-icon-plus" /> 添加行
      </button>

      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="confirmFieldEditor">确定</el-button>
        <el-button @click="fieldDialog.visible = false">取消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import FlowConfigHero from '../common/FlowConfigHero.vue'

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

const DEFAULT_DISTRIBUTION_OPTIONS = [
  { label: '复制', value: 'true' },
  { label: '分发', value: 'false' }
]

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

export default {
  name: 'RecordsFromStreamConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
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
        distribution: true
      },
      fieldDialog: {
        visible: false,
        rows: []
      }
    }
  },
  computed: {
    parsedTreeConfig() {
      return safeParseJson(this.componentTreeConfig)
    },
    dictRows() {
      const raw = this.parsedTreeConfig
      if (Array.isArray(raw)) return raw
      if (raw && Array.isArray(raw.list)) return raw.list
      if (raw && Array.isArray(raw.data)) return raw.data
      return []
    },
    distributionOptions() {
      const row = this.dictRows.find(x => String(x?.dictCode || '') === 'supportCopy')
      if (!row || !Array.isArray(row.list)) return DEFAULT_DISTRIBUTION_OPTIONS
      const list = row.list
        .map((x) => {
          const value = x?.code != null ? String(x.code) : ''
          const label = x?.value != null ? String(x.value) : value
          return value ? { label, value } : null
        })
        .filter(Boolean)
      return list.length ? list : DEFAULT_DISTRIBUTION_OPTIONS
    },
    fieldTypeOptions() {
      const row = this.dictRows.find(x => String(x?.dictCode || '') === 'fieldType')
      if (!row || !Array.isArray(row.list)) return DEFAULT_FIELD_TYPE_OPTIONS
      const list = row.list
        .map((x) => {
          const value = x?.code != null ? String(x.code) : ''
          const label = x?.value != null ? String(x.value) : value
          return value ? { label, value } : null
        })
        .filter(Boolean)
      return list.length ? list : DEFAULT_FIELD_TYPE_OPTIONS
    },
    distributionMode: {
      get() {
        return this.formData.distributeType ? 'true' : 'false'
      },
      set(v) {
        this.$set(this.formData, 'distributeType', String(v) === 'true')
      }
    },
    displayFieldList() {
      const list = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      return list.map((r) => ({
        name: r?.name != null ? String(r.name) : '',
        type: r?.type != null ? String(r.type) : '',
        length: this.normalizeNumberForUI(r?.length),
        precision: this.normalizeNumberForUI(r?.precision)
      }))
    }
  },
  mounted() {
    this.initDefaults()
  },
  methods: {
    initDefaults() {
      if (this.formData.code === undefined || this.formData.code === '') this.$set(this.formData, 'code', 'RecordsFromStream')
      if (!this.formData.name) this.$set(this.formData, 'name', '从流中获取数据')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (!Array.isArray(this.formData.fieldList)) this.$set(this.formData, 'fieldList', [])
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
    },
    fieldTypeLabel(type) {
      const v = String(type != null ? type : '')
      const hit = this.fieldTypeOptions.find(x => String(x.value) === v)
      return hit ? hit.label : v
    },
    normalizeNumberForUI(v) {
      if (v === null || v === undefined || v === '' || Number(v) === -1) return ''
      const n = Number(v)
      return Number.isFinite(n) ? Math.trunc(n) : ''
    },
    normalizeNumberForSave(v) {
      if (v === null || v === undefined || v === '') return -1
      const n = Number(v)
      return Number.isFinite(n) ? Math.trunc(n) : -1
    },
    openFieldEditor() {
      this.fieldDialog.visible = true
    },
    onFieldDialogOpen() {
      const list = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      this.fieldDialog.rows = list.length
        ? list.map(r => ({
          name: r?.name != null ? String(r.name) : '',
          type: r?.type != null ? String(r.type) : (this.fieldTypeOptions[0] ? String(this.fieldTypeOptions[0].value) : '2'),
          length: this.normalizeNumberForUI(r?.length),
          precision: this.normalizeNumberForUI(r?.precision)
        }))
        : [{
          name: '',
          type: this.fieldTypeOptions[0] ? String(this.fieldTypeOptions[0].value) : '2',
          length: '',
          precision: ''
        }]
    },
    addRow() {
      this.fieldDialog.rows.push({
        name: '',
        type: this.fieldTypeOptions[0] ? String(this.fieldTypeOptions[0].value) : '2',
        length: '',
        precision: ''
      })
    },
    removeRow(index) {
      this.fieldDialog.rows.splice(index, 1)
    },
    confirmFieldEditor() {
      const rows = Array.isArray(this.fieldDialog.rows) ? this.fieldDialog.rows : []
      const invalid = rows.some(r => !String(r?.name || '').trim() || !String(r?.type || '').trim())
      if (rows.length && invalid) {
        this.$message.warning('请填写每一行的名称和类型')
        return
      }
      const normalized = rows
        .filter(r => r && String(r.name || '').trim())
        .map((r) => ({
          name: String(r.name).trim(),
          type: Number(String(r.type)),
          length: this.normalizeNumberForSave(r.length),
          precision: this.normalizeNumberForSave(r.precision)
        }))
      this.$set(this.formData, 'fieldList', normalized)
      this.fieldDialog.visible = false
    },
    buildPayloadForSave() {
      const raw = { ...this.formData }
      raw.name = String(raw.name || '').trim()
      raw.description = raw.description != null ? String(raw.description) : ''
      raw.copiesCache = raw.copiesCache != null && raw.copiesCache !== ''
        ? Math.max(1, Math.trunc(Number(raw.copiesCache)))
        : 1
      raw.distributeType = !!raw.distributeType
      raw.fieldList = Array.isArray(raw.fieldList)
        ? raw.fieldList
          .filter(r => r && String(r.name || '').trim())
          .map((r) => ({
            name: String(r.name).trim(),
            type: Number(String(r.type)),
            length: this.normalizeNumberForSave(r.length),
            precision: this.normalizeNumberForSave(r.precision)
          }))
        : []
      return raw
    },
    handleSubmit() {
      if (!String(this.formData.name || '').trim()) {
        this.$message.warning('请填写步骤名称')
        return
      }
      this.$emit('save', this.buildPayloadForSave())
    }
  }
}
</script>

<style scoped>
.records-from-stream-config {
  width: 100%;
}

.config-content {
  padding: 20px;
}

.config-tabs {
  margin: 0 0 8px;
}

.form-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 16px;
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
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #ebeef5;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.section-toggle {
  color: #909399;
  cursor: pointer;
}

.section-content {
  padding-top: 8px;
  margin-bottom: 8px;
}

.field-table-wrap {
  margin-bottom: 10px;
}

/* 预览表仅展示 # / 名称 / 类型，避免出现横向滚动条 */
.field-preview-table-wrap >>> .el-table__body-wrapper,
.field-preview-table-wrap >>> .el-table__header-wrapper {
  overflow-x: hidden !important;
}

.dash-btn {
  width: 100%;
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
}

.dash-btn:hover {
  background: #ecf5ff;
}

.advanced-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.advanced-label {
  color: #606266;
  font-size: 14px;
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

.w-100 {
  width: 100%;
}

.field-required {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.req {
  color: #f56c6c;
}

.add-row-btn {
  margin-top: 12px;
}
</style>
