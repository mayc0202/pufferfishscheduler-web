<template>
  <div class="java-code-config">
    <div class="config-content">
      <FlowConfigHero
        badge="脚本"
        title="Java 代码"
        description="在步骤中执行自定义 Java，读写字段、调用工具类，扩展流程能力。"
        tone="slate"
        icon="el-icon-edit-outline"
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
            placeholder="Java代码"
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

        <div class="section-header" @click="sectionOpen.fields = !sectionOpen.fields">
          <h4>字段</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.fields ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>

        <div v-show="sectionOpen.fields" class="section-content">
          <div class="aligned-block">
            <div class="field-table-wrap">
              <el-table :data="formData.fieldList" border style="width: 100%" max-height="260">
                <el-table-column type="index" label="#" width="60" />
                <el-table-column prop="name" label="名称" min-width="200" show-overflow-tooltip />
                <el-table-column prop="type" label="类型" min-width="140" show-overflow-tooltip />
              </el-table>
            </div>
            <div class="field-actions">
              <button type="button" class="dash-btn" @click="openFieldEditor">
                <i class="el-icon-edit" /> 编辑字段
              </button>
            </div>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label required">代码：</label>
          <div class="code-editor-wrap">
            <div class="code-editor-toolbar">
              <button type="button" class="icon-btn" title="全屏" @click="codeDialog.visible = true">
                <i class="el-icon-full-screen" />
              </button>
            </div>
            <textarea
              v-model="formData.javaCode"
              class="code-editor"
              placeholder="请输入Java代码"
              rows="10"
            />
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
      width="900px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="java-code-field-dialog"
      @open="onFieldDialogOpen"
    >
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
              placeholder="-1"
              min="-1"
            />
          </template>
        </el-table-column>
        <el-table-column label="精度" width="140">
          <template slot-scope="scope">
            <el-input
              v-model.number="scope.row.precision"
              size="small"
              type="number"
              placeholder="-1"
              min="-1"
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
      :visible.sync="codeDialog.visible"
      title="Java代码"
      width="90%"
      append-to-body
      :close-on-click-modal="false"
      custom-class="java-code-fullscreen-dialog"
    >
      <textarea
        v-model="formData.javaCode"
        class="code-editor code-editor--fullscreen"
        placeholder="请输入Java代码"
        rows="22"
      />
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="codeDialog.visible = false">确定</el-button>
        <el-button @click="codeDialog.visible = false">取消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import FlowConfigHero from '../common/FlowConfigHero.vue'

export default {
  name: 'JavaCodeConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
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
      typeOptions: ['String', 'Number', 'Integer', 'Boolean', 'Date', 'Timestamp', 'Binary', 'BigNumber'],
      fieldEditor: {
        visible: false,
        rows: []
      },
      codeDialog: {
        visible: false
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
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', 'Java代码')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (!Array.isArray(this.formData.fieldList)) this.$set(this.formData, 'fieldList', [])
      if (this.formData.javaCode === undefined) this.$set(this.formData, 'javaCode', '')
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
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
          length: r?.length != null && r.length !== '' ? Number(r.length) : -1,
          precision: r?.precision != null && r.precision !== '' ? Number(r.precision) : -1
        }))
        : []
    },
    addFieldRow() {
      this.fieldEditor.rows.push({ name: '', type: 'String', length: -1, precision: -1 })
    },
    removeFieldRow(index) {
      this.fieldEditor.rows.splice(index, 1)
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
          length: this.normalizeNumberOrMinusOne(r.length),
          precision: this.normalizeNumberOrMinusOne(r.precision)
        }))
      this.$set(this.formData, 'fieldList', normalized)
      this.fieldEditor.visible = false
    },

    normalizeNumberOrMinusOne(v) {
      if (v === null || v === undefined || v === '') return -1
      const n = Number(v)
      return Number.isFinite(n) ? Math.trunc(n) : -1
    },

    buildPayloadForSave() {
      const raw = { ...this.formData }
      raw.name = String(raw.name || '').trim()
      raw.description = raw.description != null ? String(raw.description) : ''
      raw.javaCode = raw.javaCode != null ? String(raw.javaCode) : ''
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
      const javaCode = (this.formData.javaCode || '').trim()
      if (!javaCode) {
        this.$message.warning('请填写Java代码')
        return
      }
      this.$emit('save', this.buildPayloadForSave())
    }
  }
}
</script>

<style lang="scss" scoped>
.java-code-config {
  height: 100%;
}

.config-content {
  display: flex;
  flex-direction: column;
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

.aligned-block {
  margin-left: calc(var(--label-width, 140px) + var(--label-gap, 8px));
}

.radio-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0 8px;
}

.radio-label {
  font-size: 13px;
  color: #606266;
  flex: 0 0 auto;
}

.field-table-wrap {
  margin-bottom: 10px;
}

.field-actions {
  margin-bottom: 8px;
}

.code-editor-wrap {
  flex: 1;
  min-width: 0;
  position: relative;
}

.code-editor-toolbar {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 2;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #e4e7ed;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  color: #606266;
}

.icon-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.code-editor {
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
}

.code-editor:focus {
  border-color: #409eff;
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
</style>

<style>
.java-code-fullscreen-dialog .el-dialog__body {
  padding-top: 10px;
}

.java-code-fullscreen-dialog .code-editor--fullscreen {
  height: 60vh;
  resize: none;
}
</style>
