<template>
  <div class="row-generator-config">
    <div class="config-content">
      <FlowConfigHero
        badge="输入"
        title="生成测试数据"
        description="按规则批量或定时生成行数据，用于联调、压测或占位流程。"
        tone="azure"
        icon="el-icon-odometer"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="生成测试数据">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">生成记录方式：</label>
          <el-select v-model="formData.recordGenerationType" class="form-select" placeholder="请选择生成方式">
            <el-option v-for="opt in generationTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>

        <div v-if="isBatchMode" class="form-item">
          <label class="form-label">生成记录数：</label>
          <input
            v-model="formData.rowLimit"
            type="number"
            min="1"
            class="form-input"
            placeholder="10"
          >
        </div>

        <template v-if="!isBatchMode">
          <div class="form-item">
            <label class="form-label">生成记录时间间隔（毫秒）：</label>
            <input v-model="formData.timeInterval" type="number" min="1" class="form-input" placeholder="100">
          </div>
          <div class="form-item">
            <label class="form-label">生成记录时间字段名：</label>
            <input v-model="formData.timeFieldName" type="text" class="form-input" placeholder="currentTime">
          </div>
          <div class="form-item">
            <label class="form-label">上次生成记录时间字段名：</label>
            <input v-model="formData.lastTimeFieldName" type="text" class="form-input" placeholder="lastTime">
          </div>
        </template>

        <div class="section-header" @click="sectionOpen.fields = !sectionOpen.fields">
          <h4>字段</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.fields ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.fields" class="section-content">
          <div class="field-table-wrap">
            <el-table :data="formData.fieldList" border style="width: 100%" max-height="260">
              <el-table-column type="index" label="#" width="56" />
              <el-table-column prop="fieldName" label="名称" min-width="150" show-overflow-tooltip />
              <el-table-column prop="typeText" label="类型" min-width="120" show-overflow-tooltip />
              <el-table-column prop="value" label="值" min-width="140" show-overflow-tooltip />
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
              <input v-model.number="formData.copiesCache" type="number" min="1" class="form-input" placeholder="1">
            </div>
          </div>
        </div>
      </template>

      <div class="form-actions">
        <button type="button" class="btn preview-btn" :disabled="!isBatchMode" @click="openPreviewDialog">预览数据</button>
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <el-dialog
      :visible.sync="fieldEditor.visible"
      title="编辑字段"
      width="1500px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="row-generator-field-dialog"
      @open="onFieldEditorOpen"
    >
      <el-table :data="fieldEditor.rows" border style="width: 100%" max-height="420">
        <el-table-column type="index" label="#" width="56" />
        <el-table-column label="名称" min-width="190">
          <template slot-scope="scope">
            <el-input v-model="scope.row.fieldName" size="small" placeholder="请输入名称" />
          </template>
        </el-table-column>
        <el-table-column label="类型" width="160">
          <template slot-scope="scope">
            <el-select v-model="scope.row.typeText" size="small" placeholder="请选择类型" class="field-type-select">
              <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="长度" width="120">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.fieldLength"
              size="small"
              type="text"
              placeholder="请输入长度"
              inputmode="numeric"
            />
          </template>
        </el-table-column>
        <el-table-column label="精度" width="120">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.fieldPrecision"
              size="small"
              type="text"
              placeholder="请输入精度"
              inputmode="numeric"
            />
          </template>
        </el-table-column>
        <el-table-column label="格式" width="200">
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.fieldFormat"
              filterable
              allow-create
              clearable
              default-first-option
              size="small"
              placeholder="请选择格式"
              class="field-format-select"
            >
              <el-option v-for="fmt in formatOptions" :key="fmt" :label="fmt || '(空)'" :value="fmt" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="小数符号" width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.decimal" size="small" placeholder="." />
          </template>
        </el-table-column>
        <el-table-column label="千分位符号" width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.group" size="small" placeholder="," />
          </template>
        </el-table-column>
        <el-table-column label="值" min-width="150">
          <template slot-scope="scope">
            <el-input v-model="scope.row.value" size="small" placeholder="请输入值" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="86" align="center">
          <template slot-scope="scope">
            <el-button type="text" @click="removeFieldRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="add-row-wrap">
        <button type="button" class="dash-btn" @click="addFieldRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="confirmFieldEditor">确定</el-button>
        <el-button @click="fieldEditor.visible = false">取消</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="preview.visible"
      title="预览数据"
      width="900px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="row-generator-preview-dialog"
    >
      <el-table v-loading="preview.loading" :data="preview.rows" border style="width: 100%" max-height="420">
        <el-table-column type="index" label="#" width="56" />
        <el-table-column
          v-for="col in preview.columns"
          :key="col"
          :prop="col"
          :label="col"
          min-width="130"
          show-overflow-tooltip
        />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="preview.visible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { previewData as previewDataApi } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

const GENERATION_TYPE_BATCH = 1
const GENERATION_TYPE_CONTINUOUS = 2

export default {
  name: 'RowGeneratorConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
    },
    flowId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        fields: true,
        distribution: false,
        parallel: false
      },
      generationTypeOptions: [
        { label: '批量生成记录', value: GENERATION_TYPE_BATCH },
        { label: '持续生成记录', value: GENERATION_TYPE_CONTINUOUS }
      ],
      typeOptions: ['String', 'Number', 'Integer', 'Boolean', 'Date', 'Timestamp', 'Binary', 'BigNumber'],
      formatOptions: ['', 'dd-MM-yyyy', 'yyyy-MM-ddTHH:mm:ss.SSSXXX', 'yyyy-MM-dd HH:mm:ss.SSS', '#,##0.###', '0.00', '0000000000000', '#.#', '#'],
      fieldEditor: {
        visible: false,
        rows: []
      },
      preview: {
        visible: false,
        loading: false,
        columns: [],
        rows: []
      }
    }
  },
  computed: {
    isBatchMode() {
      return Number(this.formData.recordGenerationType) === GENERATION_TYPE_BATCH
    },
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
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', '生成测试数据')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (!this.formData.recordGenerationType) this.$set(this.formData, 'recordGenerationType', GENERATION_TYPE_BATCH)
      if (this.formData.rowLimit === undefined || this.formData.rowLimit === '') this.$set(this.formData, 'rowLimit', '10')
      if (this.formData.timeInterval === undefined || this.formData.timeInterval === '') this.$set(this.formData, 'timeInterval', '100')
      if (this.formData.timeFieldName === undefined || this.formData.timeFieldName === '') this.$set(this.formData, 'timeFieldName', 'currentTime')
      if (this.formData.lastTimeFieldName === undefined || this.formData.lastTimeFieldName === '') this.$set(this.formData, 'lastTimeFieldName', 'lastTime')
      if (!Array.isArray(this.formData.fieldList)) this.$set(this.formData, 'fieldList', [])
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
    },

    openFieldEditor() {
      this.fieldEditor.visible = true
    },
    onFieldEditorOpen() {
      const list = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      this.fieldEditor.rows = list.length ? list.map(row => this.normalizeFieldForUI(row)) : []
      if (!this.fieldEditor.rows.length) this.addFieldRow()
    },
    normalizeFieldForUI(row) {
      return {
        fieldName: row?.fieldName != null ? String(row.fieldName) : '',
        typeText: row?.typeText != null ? String(row.typeText) : 'String',
        fieldFormat: row?.fieldFormat != null ? String(row.fieldFormat) : '',
        fieldLength: this.normalizeNumberForUI(row?.fieldLength),
        fieldPrecision: this.normalizeNumberForUI(row?.fieldPrecision),
        decimal: row?.decimal != null ? String(row.decimal) : '',
        value: row?.value != null ? String(row.value) : '',
        group: row?.group != null ? String(row.group) : ''
      }
    },
    addFieldRow() {
      this.fieldEditor.rows.push({
        fieldName: '',
        typeText: 'String',
        fieldFormat: '',
        fieldLength: '',
        fieldPrecision: '',
        decimal: '.',
        value: '',
        group: ','
      })
    },
    removeFieldRow(index) {
      this.fieldEditor.rows.splice(index, 1)
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
    confirmFieldEditor() {
      const rows = Array.isArray(this.fieldEditor.rows) ? this.fieldEditor.rows : []
      const invalid = rows.some(r => !r || !String(r.fieldName || '').trim() || !String(r.typeText || '').trim())
      if (rows.length && invalid) {
        this.$message.warning('请填写每一行的字段名称与类型')
        return
      }
      const normalized = rows
        .filter(r => r && String(r.fieldName || '').trim())
        .map(r => ({
          fieldName: String(r.fieldName).trim(),
          typeText: String(r.typeText || 'String'),
          fieldFormat: r.fieldFormat != null ? String(r.fieldFormat) : '',
          fieldLength: this.normalizeNumberForSave(r.fieldLength),
          fieldPrecision: this.normalizeNumberForSave(r.fieldPrecision),
          decimal: r.decimal != null ? String(r.decimal) : '',
          value: r.value != null ? String(r.value) : '',
          group: r.group != null ? String(r.group) : ''
        }))
      this.$set(this.formData, 'fieldList', normalized)
      this.fieldEditor.visible = false
    },

    normalizePositiveIntText(v, defVal) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 1) return String(defVal)
      return String(Math.floor(n))
    },
    buildPayloadForSave() {
      const raw = { ...this.formData }
      raw.name = String(raw.name || '').trim()
      raw.description = raw.description != null ? String(raw.description) : ''
      raw.recordGenerationType = Number(raw.recordGenerationType) || GENERATION_TYPE_BATCH
      raw.rowLimit = this.normalizePositiveIntText(raw.rowLimit, 10)
      raw.timeInterval = this.normalizePositiveIntText(raw.timeInterval, 100)
      raw.timeFieldName = raw.timeFieldName != null ? String(raw.timeFieldName) : ''
      raw.lastTimeFieldName = raw.lastTimeFieldName != null ? String(raw.lastTimeFieldName) : ''
      raw.copiesCache = raw.copiesCache != null && raw.copiesCache !== '' ? Math.max(1, Math.trunc(Number(raw.copiesCache))) : 1
      raw.distributeType = !!raw.distributeType
      raw.fieldList = Array.isArray(raw.fieldList)
        ? raw.fieldList.map(x => ({
          fieldName: String(x.fieldName || ''),
          typeText: String(x.typeText || 'String'),
          fieldFormat: x.fieldFormat != null ? String(x.fieldFormat) : '',
          fieldLength: this.normalizeNumberForSave(x.fieldLength),
          fieldPrecision: this.normalizeNumberForSave(x.fieldPrecision),
          decimal: x.decimal != null ? String(x.decimal) : '',
          value: x.value != null ? String(x.value) : '',
          group: x.group != null ? String(x.group) : ''
        })).filter(x => x.fieldName)
        : []
      return raw
    },

    handleSubmit() {
      const name = (this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      const rowLimit = Number(this.formData.rowLimit)
      if (!Number.isFinite(rowLimit) || rowLimit < 1) {
        this.$message.warning('生成记录数必须为正整数')
        return
      }
      if (!this.isBatchMode) {
        const interval = Number(this.formData.timeInterval)
        if (!Number.isFinite(interval) || interval < 1) {
          this.$message.warning('生成时间间隔必须为正整数')
          return
        }
      }
      this.$emit('save', this.buildPayloadForSave())
    },

    async openPreviewDialog() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在')
        return
      }
      if (!this.isBatchMode) {
        this.$message.warning('仅“批量生成记录”模式支持预览数据')
        return
      }
      const fields = Array.isArray(this.formData.fieldList) ? this.formData.fieldList.filter(f => f && f.fieldName) : []
      if (!fields.length) {
        this.$message.warning('请先配置字段')
        return
      }

      this.preview.visible = true
      this.preview.loading = true
      this.preview.columns = []
      this.preview.rows = []

      try {
        const payloadData = this.buildPayloadForSave()
        const config = {
          name: payloadData.name,
          code: 'RowGenerator',
          data: {
            ...payloadData
          }
        }
        const data = {
          id: this.flowId,
          config: JSON.stringify(config)
        }
        const res = await previewDataApi(data)
        if (res && res.code === '000000' && res.data) {
          if (res.data.fieldList && res.data.fieldList.length > 0) {
            this.preview.columns = res.data.fieldList
            if (res.data.dataList && res.data.dataList.length > 0) {
              this.preview.rows = res.data.dataList.map(row => {
                const obj = {}
                res.data.fieldList.forEach((field, index) => {
                  obj[field] = row[index]
                })
                return obj
              })
            } else {
              this.preview.rows = []
            }
          } else {
            this.preview.columns = []
            this.preview.rows = []
          }
        } else {
          this.$message.error((res && res.message) || '获取预览数据失败')
        }
      } catch (error) {
        this.$message.error('预览数据失败')
      } finally {
        this.preview.loading = false
      }
    }
  }
}
</script>

<style scoped>
.row-generator-config {
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

.form-select {
  width: 100%;
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

.field-table-wrap {
  margin-bottom: 10px;
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

.advanced-layout .radio-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.radio-label {
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

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.preview-btn {
  background: #ecf5ff;
  border-color: #b3d8ff;
  color: #409eff;
}

.primary-btn {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}
</style>
