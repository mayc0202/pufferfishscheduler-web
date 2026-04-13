<template>
  <div class="print-log-config">
    <div class="config-content">
      <FlowConfigHero
        badge="日志"
        title="打印日志"
        description="运行时将选中字段或样本行写入日志，便于联调与线上排障。"
        tone="slate"
        icon="el-icon-document"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <div v-show="activeTab === 'basic'">
      <div class="form-item">
        <label class="form-label required">节点名称：</label>
        <input
          v-model="formData.name"
          type="text"
          class="form-input"
          placeholder="打印日志"
        >
      </div>

      <div class="form-item">
        <label class="form-label">节点说明：</label>
        <textarea
          v-model="formData.description"
          class="form-textarea"
          placeholder="请输入节点说明"
          rows="3"
        />
      </div>

      <div class="form-item checkbox-row">
        <el-checkbox v-model="formData.limitRows">限制输入行数</el-checkbox>
        <span class="help-icon" title="勾选后可限制本步骤输出的日志最大行数">?</span>
      </div>

      <div v-show="formData.limitRows" class="form-item">
        <label class="form-label required">最大输出日志行数：</label>
        <input
          v-model.number="formData.limitRowsNumber"
          type="number"
          min="1"
          class="form-input"
          placeholder="1000"
        >
      </div>

      <div class="section-header" @click="sectionOpen.logFields = !sectionOpen.logFields">
        <h4>需要打印日志的字段</h4>
        <div class="section-toggle">
          <i :class="sectionOpen.logFields ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        </div>
      </div>

      <div v-show="sectionOpen.logFields" class="section-content">
        <div class="aligned-block">
          <div class="field-table-wrap">
            <el-table :data="formData.fieldList" border style="width: 100%" max-height="260">
              <el-table-column type="index" label="#" width="60" />
              <el-table-column prop="name" label="输入字段名称" min-width="200" show-overflow-tooltip />
            </el-table>
          </div>
          <div class="field-actions">
            <button type="button" class="dash-btn" @click="openFieldEditor">
              <i class="el-icon-edit" /> 编辑字段
            </button>
          </div>
        </div>
      </div>
      </div>

      <div v-show="activeTab === 'advanced'" class="advanced-layout">
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
            <label class="form-label">并发数量：</label>
            <input v-model.number="formData.copiesCache" type="number" min="1" class="form-input" placeholder="1">
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <el-dialog
      :visible.sync="fieldEditor.visible"
      title="需要打印日志的字段"
      width="640px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="print-log-field-dialog"
      @opened="onFieldDialogOpen"
    >
      <div class="field-dlg-label">字段：</div>
      <el-table :data="fieldEditor.rows" border style="width: 100%" max-height="320">
        <el-table-column type="index" label="#" width="56" />
        <el-table-column label="字段名称" min-width="220">
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.name"
              filterable
              clearable
              placeholder="请选择字段"
              size="small"
              class="field-name-select"
              popper-class="print-log-field-select-popper"
            >
              <el-option
                v-for="fd in availableFieldOptions"
                :key="fd"
                :label="fd"
                :value="fd"
              />
            </el-select>
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
  </div>
</template>

<script>
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

export default {
  name: 'PrintLogConfig',
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
        logFields: true,
        distribution: false,
        parallel: false
      },
      availableFieldOptions: [],
      fieldEditor: {
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
  mounted() {
    this.initDefaults()
    this.loadAvailableFields()
  },
  methods: {
    buildFlowConfigWithCurrentNode() {
      const base = this.flowConfig ? JSON.parse(JSON.stringify(this.flowConfig)) : { cells: [] }
      if (!base.cells || !Array.isArray(base.cells)) {
        base.cells = []
      }
      if (!this.currentNodeId) {
        return base
      }

      const idx = base.cells.findIndex(c => String(c.id) === String(this.currentNodeId))
      if (idx < 0) {
        return base
      }

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

    migrateLegacyKeys() {
      if (this.formData.limitRows === undefined && this.formData.limitInputRows !== undefined) {
        this.$set(this.formData, 'limitRows', !!this.formData.limitInputRows)
      }
      if (
        (this.formData.limitRowsNumber === undefined || this.formData.limitRowsNumber === '') &&
        this.formData.maxOutputLogRows != null &&
        this.formData.maxOutputLogRows !== ''
      ) {
        const n = parseInt(String(this.formData.maxOutputLogRows), 10)
        if (Number.isFinite(n)) {
          this.$set(this.formData, 'limitRowsNumber', n)
        }
      }
      // 仅当 fieldList 尚不存在（非数组）时从 logFieldList 迁移；[] 表示已清空，绝不能被 logFieldList 覆盖
      if (
        !Array.isArray(this.formData.fieldList) &&
        Array.isArray(this.formData.logFieldList) &&
        this.formData.logFieldList.length
      ) {
        this.$set(
          this.formData,
          'fieldList',
          this.formData.logFieldList
            .map(x => ({ name: x.fieldName || x.name || '' }))
            .filter(x => x.name)
        )
      }
      if (Object.prototype.hasOwnProperty.call(this.formData, 'logFieldList')) {
        this.$delete(this.formData, 'logFieldList')
      }
      this.stripLegacyNestedData()
    },

    /** 去掉 node.data 里套 data 的历史结构，避免与顶层 fieldList 双轨导致删字段后又被盖回 */
    stripLegacyNestedData() {
      const d = this.formData.data
      if (d != null && typeof d === 'object' && !Array.isArray(d)) {
        this.$delete(this.formData, 'data')
      }
    },

    initDefaults() {
      this.migrateLegacyKeys()
      if (this.formData.limitRows === undefined) {
        this.$set(this.formData, 'limitRows', true)
      }
      if (this.formData.limitRowsNumber === undefined || this.formData.limitRowsNumber === '') {
        this.$set(this.formData, 'limitRowsNumber', 1000)
      }
      if (!Array.isArray(this.formData.fieldList)) {
        this.$set(this.formData, 'fieldList', [])
      }
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined) {
        this.$set(this.formData, 'distributeType', false)
      }
    },

    async loadAvailableFields() {
      if (!this.flowId) return
      try {
        const mergedFlowConfig = this.buildFlowConfigWithCurrentNode()
        const configStr = JSON.stringify(mergedFlowConfig)
        const res = await getFlowFieldStream({
          flowId: this.flowId,
          config: configStr,
          stepName: this.formData.name || '打印日志',
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
      this.fieldEditor.rows = list.length ? list.map(r => ({ name: r.name || '' })) : []
      this.loadAvailableFields()
    },

    addFieldRow() {
      this.fieldEditor.rows.push({ name: '' })
    },

    removeFieldRow(index) {
      this.fieldEditor.rows.splice(index, 1)
    },

    confirmFieldEditor() {
      const valid = this.fieldEditor.rows.every(r => r.name)
      if (this.fieldEditor.rows.length && !valid) {
        this.$message.warning('请为每一行选择字段名称')
        return
      }
      this.$set(
        this.formData,
        'fieldList',
        this.fieldEditor.rows.filter(r => r.name).map(r => ({ name: r.name }))
      )
      if (Object.prototype.hasOwnProperty.call(this.formData, 'logFieldList')) {
        this.$delete(this.formData, 'logFieldList')
      }
      this.stripLegacyNestedData()
      this.fieldEditor.visible = false
    },

    /**
     * 与后端 WriteToLogConstructor 对齐：
     * data.limitRows、data.limitRowsNumber、data.fieldList[{ name }]
     */
    buildPayloadForSave() {
      const raw = { ...this.formData }
      delete raw.limitInputRows
      delete raw.maxOutputLogRows
      delete raw.logFieldList
      if (raw.data != null && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
        delete raw.data
      }

      let limitRowsNumber = 1000
      if (raw.limitRowsNumber != null && raw.limitRowsNumber !== '') {
        const n = Number(raw.limitRowsNumber)
        if (Number.isFinite(n)) {
          limitRowsNumber = Math.floor(n)
        }
      }
      raw.limitRowsNumber = limitRowsNumber

      raw.fieldList = Array.isArray(raw.fieldList)
        ? raw.fieldList.filter(r => r && r.name).map(r => ({ name: String(r.name) }))
        : []

      return raw
    },

    handleSubmit() {
      const name = (this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写节点名称')
        return
      }
      if (this.formData.limitRows) {
        const n = Number(this.formData.limitRowsNumber)
        if (!Number.isFinite(n) || n < 1) {
          this.$message.warning('最大输出日志行数须为正整数')
          return
        }
      }
      this.$emit('save', this.buildPayloadForSave())
    }
  }
}
</script>

<style lang="scss" scoped>
.print-log-config {
  height: 100%;
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.config-tabs {
  margin: 0 0 8px;
}

.form-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.form-label {
  flex: 0 0 140px;
  text-align: right;
  line-height: 32px;
  color: #606266;
  font-size: 14px;
}

.form-label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.form-input {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.form-input:focus {
  border-color: #409eff;
}

.form-textarea {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  outline: none;
}

.form-textarea:focus {
  border-color: #409eff;
}

.checkbox-row {
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
  margin-bottom: 8px;
}

.advanced-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.advanced-label {
  color: #606266;
  font-size: 14px;
}

.aligned-block {
  margin-left: calc(var(--label-width, 140px) + var(--label-gap, 8px));
}

.field-table-wrap {
  margin-bottom: 10px;
}

.field-actions {
  margin-bottom: 8px;
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

.field-dlg-label {
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.field-name-select {
  width: 100%;
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
</style>

<style>
.print-log-field-dialog .el-dialog__body {
  padding-top: 10px;
}

.print-log-field-select-popper {
  z-index: 30000 !important;
}
</style>
