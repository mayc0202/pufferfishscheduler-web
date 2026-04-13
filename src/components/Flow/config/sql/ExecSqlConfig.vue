<template>
  <div class="exec-sql-config">
    <div class="config-content">
      <FlowConfigHero
        badge="SQL"
        title="执行 SQL 脚本"
        description="在指定数据源上执行 SQL，可用于初始化、维护脚本或与变量、逐行执行配合。"
        tone="slate"
        icon="el-icon-document"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">节点名称：</label>
          <el-input v-model="formData.name" placeholder="SQL脚本" />
        </div>

        <div class="form-item">
          <label class="form-label">节点说明：</label>
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入节点说明"
          />
        </div>

        <div class="form-item">
          <label class="form-label required">数据源：</label>
          <el-select
            v-model="formData.dataSourceId"
            filterable
            clearable
            placeholder="请选择数据源"
            class="db-select"
            popper-class="exec-sql-db-select-popper"
            @visible-change="onDbSelectVisibleChange"
          >
            <el-option-group
              v-for="group in processedOptions"
              :key="group.value"
              :label="group.label"
            >
              <el-option
                v-for="item in group.children"
                :key="item.value"
                :label="`${group.label} / ${item.label}`"
                :value="item.value"
              />
            </el-option-group>
          </el-select>
        </div>

        <div class="form-item">
          <label class="form-label required">
            SQL脚本：
            <el-tooltip content="填写执行的SQL脚本，多个SQL脚本之间使用分号隔开。" placement="top">
              <i class="el-icon-question help-i" />
            </el-tooltip>
          </label>
          <div class="code-editor-wrap">
            <div class="code-editor-toolbar">
              <button type="button" class="icon-btn" title="全屏" @click="sqlDialog.visible = true">
                <i class="el-icon-full-screen" />
              </button>
            </div>
            <div class="code-editor-panel">
              <div ref="sqlGutter" class="code-gutter">
                <div v-for="n in sqlLineCount" :key="n" class="gutter-line">{{ n }}</div>
              </div>
              <textarea
                ref="sqlEditor"
                v-model="formData.sql"
                class="code-editor"
                placeholder="请输入SQL脚本"
                rows="6"
                @scroll="syncSqlScroll"
              />
            </div>
          </div>
        </div>

        <div class="form-item checkbox-item">
          <label class="form-label" />
          <div class="check-row">
            <el-checkbox v-model="formData.executeEachRow">执行每一行</el-checkbox>
            <el-tooltip content="如果勾选上此选项，每条输入数据都会触发SQL脚本执行一次。否则，SQL脚本只在流程初始化时执行一次。" placement="top">
              <i class="el-icon-question help-i" />
            </el-tooltip>
          </div>
        </div>

        <div class="form-item checkbox-item">
          <label class="form-label" />
          <div class="check-row">
            <el-checkbox v-model="formData.variableReplace">变量替换</el-checkbox>
            <el-tooltip content="如果勾选上此选项，那么在执行SQL脚本之前会进行SQL中的变量替换。SQL中变量格式“${param1}”。" placement="top">
              <i class="el-icon-question help-i" />
            </el-tooltip>
          </div>
        </div>

        <div class="form-item checkbox-item">
          <label class="form-label" />
          <div class="check-row">
            <el-checkbox v-model="formData.bindVariable" :disabled="!formData.executeEachRow">绑定变量</el-checkbox>
            <el-tooltip content="如果勾选上此选项，那么可以在SQL语句中使用“?”占位符编写SQL。“?”出现顺序与参数中的参数一一对应。" placement="top">
              <i class="el-icon-question help-i" />
            </el-tooltip>
          </div>
        </div>

        <div class="params-card">
          <div class="params-hd" @click="sectionOpen.params = !sectionOpen.params">
            <div class="params-title">参数</div>
            <i :class="sectionOpen.params ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" class="params-arrow" />
          </div>
          <div v-show="sectionOpen.params" class="params-bd">
            <el-table :data="paramTableData" border style="width: 100%" max-height="240" empty-text="暂无数据">
              <el-table-column type="index" label="#" width="60" />
              <el-table-column prop="name" label="参数字段" min-width="220" show-overflow-tooltip />
            </el-table>
            <button type="button" class="dash-btn" @click="openParamEditor">
              <i class="el-icon-edit" /> 编辑字段
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
          <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
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
            <label class="form-label">并发数量：</label>
            <el-input v-model.number="formData.copiesCache" type="number" min="1" placeholder="1" />
          </div>
        </div>
        </div>
      </template>
    </div>

    <!-- SQL 全屏 -->
    <el-dialog
      :visible.sync="sqlDialog.visible"
      title="SQL脚本"
      width="1200px"
      top="6vh"
      append-to-body
      :close-on-click-modal="false"
      custom-class="exec-sql-fullscreen-dialog"
      @open="onSqlDialogOpen"
    >
      <div class="fs-editor">
        <div ref="sqlGutterFs" class="code-gutter fs-gutter">
          <div v-for="n in sqlLineCount" :key="n" class="gutter-line">{{ n }}</div>
        </div>
        <textarea
          ref="sqlEditorFs"
          v-model="formData.sql"
          class="code-editor fs-editor-area"
          placeholder="请输入SQL脚本"
          rows="22"
          @scroll="syncSqlScrollFs"
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="sqlDialog.visible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 编辑参数字段弹窗 -->
    <el-dialog
      :visible.sync="paramEditor.visible"
      title="编辑参数字段"
      width="720px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="exec-sql-param-dialog"
      @open="onParamDialogOpen"
    >
      <el-table :data="paramEditor.rows" border style="width: 100%" max-height="320">
        <el-table-column type="index" label="#" width="56" />
        <el-table-column label="作为参数的字段" min-width="260">
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.name"
              filterable
              clearable
              placeholder="下拉选择或者手动输入"
              size="small"
              class="param-field-select"
              popper-class="exec-sql-param-select-popper"
              allow-create
              default-first-option
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
            <el-button type="text" @click="removeParamRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="add-row-wrap">
        <button type="button" class="btn add-row-btn" @click="addParamRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="fetchFieldsIntoRows">获取字段</el-button>
        <el-button type="primary" @click="confirmParamEditor">确定</el-button>
        <el-button @click="paramEditor.visible = false">取消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { relationalDbTree } from '@/api/database/database/dbGroup'
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

export default {
  name: 'ExecSqlConfig',
  components: { FlowConfigHero },
  directives: {
    'click-outside': {
      bind(el, binding) {
        el._clickOutside = function(event) {
          if (!(el === event.target || el.contains(event.target))) {
            binding.value()
          }
        }
        document.addEventListener('click', el._clickOutside)
      },
      unbind(el) {
        document.removeEventListener('click', el._clickOutside)
      }
    }
  },
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
        params: true,
        distribution: false,
        parallel: false
      },
      processedOptions: [],
      availableFieldOptions: [],
      sqlDialog: {
        visible: false
      },
      paramEditor: {
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
    paramTableData() {
      const list = Array.isArray(this.formData.filedList) ? this.formData.filedList : []
      return list.filter(Boolean).map(x => ({ name: String(x) }))
    },
    sqlLineCount() {
      const s = this.formData.sql != null ? String(this.formData.sql) : ''
      const n = s.split('\n').length
      return Math.max(1, Math.min(5000, n))
    }
  },
  watch: {
    'formData.executeEachRow': {
      handler(v) {
        if (!v) {
          this.$set(this.formData, 'bindVariable', false)
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.initDefaults()
    this.loadDbData()
    this.loadAvailableFields()
  },
  methods: {
    initDefaults() {
      if (this.formData.executeEachRow === undefined) this.$set(this.formData, 'executeEachRow', false)
      if (this.formData.variableReplace === undefined) this.$set(this.formData, 'variableReplace', false)
      if (this.formData.bindVariable === undefined) this.$set(this.formData, 'bindVariable', false)
      if (!Array.isArray(this.formData.filedList)) this.$set(this.formData, 'filedList', [])
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
    },
    onDbSelectVisibleChange(v) {
      if (v && (!this.processedOptions || this.processedOptions.length === 0)) {
        this.loadDbData()
      }
    },
    async loadDbData() {
      try {
        const res = await relationalDbTree()
        if (res && res.code === '000000' && res.data) {
          this.processData(res.data)
        } else {
          this.$message.error('获取数据源列表失败')
          this.$set(this, 'processedOptions', [])
        }
      } catch (e) {
        this.$message.error('获取数据源列表失败')
        this.$set(this, 'processedOptions', [])
      }
    },
    processData(dbList) {
      if (!dbList || dbList.length === 0) {
        this.processedOptions = []
        return
      }
      const result = []
      for (const group of dbList) {
        if (!group || group.type !== 'GROUP') continue
        if (!group.children || !Array.isArray(group.children)) continue
        const children = []
        for (const child of group.children) {
          if (child && child.type === 'DATABASE') {
            children.push({
              value: String(child.id),
              label: child.name
            })
          }
        }
        if (children.length > 0) {
          result.push({
            value: String(group.id),
            label: group.name || '未知分组',
            children
          })
        }
      }
      this.$set(this, 'processedOptions', result)
    },

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

    async loadAvailableFields() {
      if (!this.flowId) return
      try {
        const mergedFlowConfig = this.buildFlowConfigWithCurrentNode()
        const configStr = JSON.stringify(mergedFlowConfig)
        const res = await getFlowFieldStream({
          flowId: this.flowId,
          config: configStr,
          stepName: this.formData.name || '执行SQL脚本',
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

    syncSqlScroll() {
      const ed = this.$refs.sqlEditor
      const gut = this.$refs.sqlGutter
      if (ed && gut) {
        gut.scrollTop = ed.scrollTop
      }
    },
    syncSqlScrollFs() {
      const ed = this.$refs.sqlEditorFs
      const gut = this.$refs.sqlGutterFs
      if (ed && gut) {
        gut.scrollTop = ed.scrollTop
      }
    },
    onSqlDialogOpen() {
      this.$nextTick(() => {
        this.syncSqlScrollFs()
        const ed = this.$refs.sqlEditorFs
        if (ed && ed.focus) ed.focus()
      })
    },

    openParamEditor() {
      this.paramEditor.visible = true
    },
    onParamDialogOpen() {
      const list = Array.isArray(this.formData.filedList) ? this.formData.filedList : []
      this.paramEditor.rows = list.length ? list.map(x => ({ name: String(x || '') })) : []
      this.loadAvailableFields()
    },
    addParamRow() {
      this.paramEditor.rows.push({ name: '' })
    },
    removeParamRow(index) {
      this.paramEditor.rows.splice(index, 1)
    },
    fetchFieldsIntoRows() {
      if (!this.availableFieldOptions || this.availableFieldOptions.length === 0) {
        this.$message.warning('暂无可用字段')
        return
      }
      this.paramEditor.rows = this.availableFieldOptions.map(x => ({ name: x }))
    },
    confirmParamEditor() {
      const valid = this.paramEditor.rows.every(r => r.name)
      if (this.paramEditor.rows.length && !valid) {
        this.$message.warning('请为每一行选择字段名称')
        return
      }
      // 注意：后端字段名为 filedList（拼写如此）
      this.$set(
        this.formData,
        'filedList',
        this.paramEditor.rows
          .filter(r => r.name)
          .map(r => String(r.name))
      )
      this.paramEditor.visible = false
    },

    /**
     * 与后端 ExecSql 构造器对齐：
     * data.dataSourceId、data.sql、data.executeEachRow、data.bindVariable、data.variableReplace、data.filedList
     */
    buildPayloadForSave() {
      const raw = { ...this.formData }
      raw.dataSourceId = raw.dataSourceId != null ? String(raw.dataSourceId) : ''
      raw.sql = raw.sql != null ? String(raw.sql) : ''
      raw.executeEachRow = !!raw.executeEachRow
      raw.bindVariable = !!raw.bindVariable
      raw.variableReplace = !!raw.variableReplace
      raw.filedList = Array.isArray(raw.filedList) ? raw.filedList.filter(Boolean).map(String) : []
      if (!raw.executeEachRow) {
        raw.bindVariable = false
      }
      return raw
    },

    handleSubmit() {
      const name = (this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写节点名称')
        return
      }
      if (!this.formData.dataSourceId) {
        this.$message.warning('请选择数据源')
        return
      }
      const sql = (this.formData.sql || '').trim()
      if (!sql) {
        this.$message.warning('请输入SQL脚本')
        return
      }
      this.$emit('save', this.buildPayloadForSave())
    }
  }
}
</script>

<style lang="scss" scoped>
.exec-sql-config {
  height: 100%;
}

.config-content {
  display: flex;
  flex-direction: column;
  padding: 0 6px;
}

.aligned-block {
  margin-left: calc(var(--label-width, 140px) + var(--label-gap, 8px));
}

.form-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 14px;
}

.config-tabs {
  margin: 0 0 8px;
}

.form-item {
  margin-bottom: 16px;
  display: grid;
  grid-template-columns: 92px 1fr;
  align-items: start;
  column-gap: 14px;
}

.checkbox-item {
  align-items: center;
}

.form-label {
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

.db-select {
  min-width: 0;
}

.db-select ::v-deep .el-input__inner {
  height: 32px;
  line-height: 32px;
}

.check-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.help-i {
  margin-left: 6px;
  color: #a8abb2;
  cursor: pointer;
  font-size: 12px;
  line-height: 12px;
}

.help-i:hover {
  color: #409eff;
}

.code-editor-wrap {
  min-width: 0;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.code-editor-toolbar {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 6px;
  background: #f7f9fc;
  border-bottom: 1px solid #ebeef5;
}

.icon-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: #606266;
}

.icon-btn i {
  font-size: 14px;
}

.icon-btn:hover {
  background: #ecf5ff;
  color: #409eff;
}

.code-editor-panel {
  display: grid;
  grid-template-columns: 44px 1fr;
  min-height: 140px;
}

.code-gutter {
  background: #f5f7fa;
  border-right: 1px solid #ebeef5;
  color: #a8abb2;
  font-size: 12px;
  line-height: 20px;
  padding: 10px 8px;
  overflow: hidden;
  text-align: right;
  user-select: none;
}

.gutter-line {
  height: 20px;
}

.code-editor {
  width: 100%;
  border: none;
  outline: none;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 20px;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  background: #fff;
}

.fs-editor {
  display: grid;
  grid-template-columns: 52px 1fr;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.fs-gutter {
  padding: 12px 10px;
}

.fs-editor-area {
  resize: none;
  min-height: 600px;
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

.edit-btn {
  width: 100%;
  border: 1px dashed #409eff;
  background: #fff;
  color: #409eff;
}

.edit-btn:hover {
  background: #ecf5ff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 18px;
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

.params-card {
  margin-top: 6px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.params-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #fff;
  cursor: pointer;
  user-select: none;
}

.params-title {
  font-weight: 700;
  color: #303133;
}

.params-arrow {
  color: #909399;
}

.params-bd {
  padding: 12px;
  background: #fff;
  border-top: 1px solid #ebeef5;
}

.dash-btn {
  width: 100%;
  margin-top: 10px;
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

.advanced-card {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 14px 14px 2px;
  background: #fff;
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
</style>

<style>
.exec-sql-param-select-popper {
  z-index: 30000 !important;
}

.exec-sql-db-select-popper {
  z-index: 30000 !important;
}

.exec-sql-fullscreen-dialog .el-dialog__body {
  padding-top: 10px;
}
</style>
