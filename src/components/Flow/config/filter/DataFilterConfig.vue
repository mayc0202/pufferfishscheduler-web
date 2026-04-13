<template>
  <div class="data-filter-config">
    <div class="config-content">
      <FlowConfigHero
        badge="过滤"
        title="数据过滤"
        description="按可视化条件或 Java 表达式筛选行，仅保留满足规则的数据继续下游。"
        tone="violet"
        icon="el-icon-zoom-in"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="数据过滤">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">过滤方式：</label>
          <div class="radio-row">
            <el-radio v-model="formData.filterType" label="0">可视化过滤</el-radio>
            <el-radio v-model="formData.filterType" label="1">
              Java过滤
              <el-tooltip content="Java表达式必须返回 true 或 false" placement="top">
                <i class="el-icon-question help-i" />
              </el-tooltip>
            </el-radio>
          </div>
        </div>

        <template v-if="isVisualMode">
          <div class="form-item">
            <label class="form-label required">过滤条件：</label>
            <el-button type="text" @click="openVisualDialog">
              <i class="el-icon-plus" />
              编辑过滤条件
            </el-button>
          </div>
        </template>

        <template v-else>
          <div class="form-item">
            <label class="form-label required">Java表达式：</label>
            <div class="code-editor-wrap">
              <div class="code-editor-toolbar">
                <button type="button" class="icon-btn" title="全屏" @click="javaDialog.visible = true">
                  <i class="el-icon-full-screen" />
                </button>
              </div>
              <div class="code-editor-panel">
                <div ref="codeGutter" class="code-gutter">
                  <div v-for="n in lineCount" :key="n" class="gutter-line">{{ n }}</div>
                </div>
                <textarea
                  ref="codeEditor"
                  v-model="formData.javaCode"
                  class="code-editor"
                  rows="6"
                  placeholder="请输入Java表达式，结果需为 true/false"
                  @scroll="syncCodeScroll"
                />
              </div>
            </div>
          </div>
        </template>
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
              <span class="radio-label">分发模式：</span>
              <el-radio-group v-model="distributionMode">
                <el-radio :label="'copy'">复制分发</el-radio>
                <el-radio :label="'distribute'">分流分发</el-radio>
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
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <el-dialog
      :visible.sync="visualDialog.visible"
      title="可视化过滤"
      width="980px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="visual-filter-dialog"
    >
      <div class="mapping-filter-root">
        <span>满足下列</span>
        <el-select v-model="visualCondition.condition" size="mini" class="logic-select">
          <el-option label="所有" value="ALL" />
          <el-option label="任一" value="ANY" />
        </el-select>
        <span>条件</span>
        <el-dropdown size="mini" @command="handleAddRootFilter">
          <el-button type="primary" size="mini">
            添加条件<i class="el-icon-arrow-down el-icon--right" />
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="condition">所有</el-dropdown-item>
            <el-dropdown-item command="group">组</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>

      <div class="mapping-filter-lines">
        <div
          v-for="(item, idx) in visualCondition.conditionGroups"
          :key="item.id || idx"
          class="mapping-filter-item"
        >
          <template v-if="item.type === 'condition'">
            <el-select v-model="item.field" size="mini" placeholder="字段" filterable clearable class="field-select">
              <el-option
                v-for="fd in availableFieldOptions"
                :key="fd.value"
                :label="fd.label"
                :value="fd.value"
              />
            </el-select>
            <el-select v-model="item.operator" size="mini" placeholder="操作符" clearable class="op-select">
              <el-option
                v-for="op in operatorOptions"
                :key="op.value"
                :label="op.label"
                :value="op.value"
              />
            </el-select>
            <el-input v-model="item.value" size="mini" placeholder="默认值" class="value-input" />
            <el-button type="text" @click="removeRootFilter(idx)">
              <i class="el-icon-delete" />
            </el-button>
          </template>

          <template v-else>
            <div class="mapping-filter-group">
              <div class="mapping-filter-group-title">条件组</div>
              <div class="mapping-filter-root">
                <span>满足下列</span>
                <el-select v-model="item.logic" size="mini" class="logic-select">
                  <el-option label="所有" value="ALL" />
                  <el-option label="任一" value="ANY" />
                </el-select>
                <span>条件</span>
                <el-button type="primary" size="mini" @click="addGroupCondition(item)">
                  添加条件
                </el-button>
              </div>
              <div
                v-for="(sub, subIdx) in item.conditions"
                :key="sub.id || subIdx"
                class="mapping-filter-item"
              >
                <el-select v-model="sub.field" size="mini" placeholder="字段" filterable clearable class="field-select">
                  <el-option
                    v-for="fd in availableFieldOptions"
                    :key="fd.value"
                    :label="fd.label"
                    :value="fd.value"
                  />
                </el-select>
                <el-select v-model="sub.operator" size="mini" placeholder="操作符" clearable class="op-select">
                  <el-option
                    v-for="op in operatorOptions"
                    :key="op.value"
                    :label="op.label"
                    :value="op.value"
                  />
                </el-select>
                <el-input v-model="sub.value" size="mini" placeholder="默认值" class="value-input" />
                <el-button type="text" @click="removeGroupCondition(item, subIdx)">
                  <i class="el-icon-delete" />
                </el-button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="applyVisualCondition">确认</el-button>
        <el-button @click="visualDialog.visible = false">取消</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="javaDialog.visible"
      title="Java表达式过滤"
      width="960px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="condition-code-fullscreen-dialog"
      @open="onJavaDialogOpen"
    >
      <div class="fs-editor">
        <div ref="codeGutterFs" class="code-gutter fs-gutter">
          <div v-for="n in lineCount" :key="n" class="gutter-line">{{ n }}</div>
        </div>
        <textarea
          ref="codeEditorFs"
          v-model="formData.javaCode"
          class="code-editor fs-editor-area"
          rows="20"
          placeholder="请输入Java表达式，结果需为 true/false"
          @scroll="syncCodeScrollFs"
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="javaDialog.visible = false">关闭</el-button>
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

function genId(prefix = 'c') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export default {
  name: 'DataFilterConfig',
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
      visualDialog: {
        visible: false
      },
      javaDialog: {
        visible: false
      },
      visualCondition: {
        condition: 'ALL',
        conditionGroups: []
      },
      availableFieldOptions: [],
      operatorOptions: [
        { label: '=', value: '=' },
        { label: '>', value: '>' },
        { label: '<', value: '<' },
        { label: '>=', value: '>=' },
        { label: '<=', value: '<=' },
        { label: '!=', value: '!=' },
        { label: '以..开始', value: 'START_WITH' },
        { label: '以..结尾', value: 'END_WITH' },
        { label: '包含', value: 'CONTAINS' }
      ]
    }
  },
  computed: {
    isVisualMode() {
      return String(this.formData.filterType) === '0'
    },
    distributionMode: {
      get() {
        return this.formData.distributeType ? 'copy' : 'distribute'
      },
      set(v) {
        this.$set(this.formData, 'distributeType', v === 'copy')
      }
    },
    lineCount() {
      const s = this.formData.javaCode != null ? String(this.formData.javaCode) : ''
      return Math.max(1, Math.min(5000, s.split('\n').length))
    }
  },
  watch: {
    flowConfig: {
      handler() {
        this.refreshFieldOptions()
      },
      deep: true
    },
    currentNodeId() {
      this.refreshFieldOptions()
    }
  },
  mounted() {
    this.initDefaults()
    this.refreshFieldOptions()
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', '数据过滤')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.filterType === undefined || this.formData.filterType === null || this.formData.filterType === '') {
        this.$set(this.formData, 'filterType', '0')
      } else {
        this.$set(this.formData, 'filterType', String(this.formData.filterType))
      }
      if (this.formData.javaCode === undefined) this.$set(this.formData, 'javaCode', '')
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)

      // 与“值映射-数据库字典表-过滤条件”一致：condition = { conditionGroups: [], condition: 'ALL' }
      const normalized = this.normalizeCondition(this.formData.condition)
      this.$set(this.formData, 'condition', normalized)
    },
    normalizeCondition(raw) {
      // 兼容 mappingFilter 结构：{ logic, items } -> { condition, conditionGroups }
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        if (Array.isArray(raw.conditionGroups) || raw.condition) {
          return {
            condition: raw.condition || 'ALL',
            conditionGroups: Array.isArray(raw.conditionGroups) ? clone(raw.conditionGroups) : []
          }
        }
        if (Array.isArray(raw.items) || raw.logic) {
          return {
            condition: raw.logic || 'ALL',
            conditionGroups: Array.isArray(raw.items) ? clone(raw.items) : []
          }
        }
      }
      return { condition: 'ALL', conditionGroups: [] }
    },
    createCondition() {
      return {
        id: genId('c'),
        type: 'condition',
        field: '',
        operator: '=',
        value: ''
      }
    },
    createGroup() {
      return {
        id: genId('g'),
        type: 'group',
        logic: 'ALL',
        conditions: [this.createCondition()]
      }
    },
    async openVisualDialog() {
      this.visualCondition = clone(this.normalizeCondition(this.formData.condition))
      await this.loadFieldOptionsFromApi()
      if (!this.availableFieldOptions.length) {
        this.refreshFieldOptions()
      }
      this.visualDialog.visible = true
    },
    handleAddRootFilter(command) {
      if (command === 'group') this.visualCondition.conditionGroups.push(this.createGroup())
      else this.visualCondition.conditionGroups.push(this.createCondition())
    },
    removeRootFilter(index) {
      this.visualCondition.conditionGroups.splice(index, 1)
    },
    addGroupCondition(group) {
      if (!Array.isArray(group.conditions)) this.$set(group, 'conditions', [])
      group.conditions.push(this.createCondition())
    },
    removeGroupCondition(group, index) {
      if (!Array.isArray(group.conditions)) return
      group.conditions.splice(index, 1)
    },
    applyVisualCondition() {
      // 保持后端字段不变：data.condition.condition + data.condition.conditionGroups
      this.$set(this.formData, 'condition', clone(this.visualCondition))
      this.visualDialog.visible = false
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
    async loadFieldOptionsFromApi() {
      try {
        const mergedFlowConfig = this.buildFlowConfigWithCurrentNode()
        const res = await getFlowFieldStream({
          flowId: this.flowId,
          config: JSON.stringify(mergedFlowConfig),
          stepName: this.formData.name || '数据过滤',
          code: this.formData.code || 'DataFilter',
          dbId: this.formData.dbId,
          tableId: this.formData.tableId
        })
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          const names = res.data
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
          this.availableFieldOptions = Array.from(new Set(names)).map(n => ({ label: n, value: n }))
          return
        }
        if (res && res.code === '000000' && res.data && Array.isArray(res.data.fieldList)) {
          const names = res.data.fieldList
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
          this.availableFieldOptions = Array.from(new Set(names)).map(n => ({ label: n, value: n }))
          return
        }
        this.availableFieldOptions = []
      } catch (e) {
        this.availableFieldOptions = []
      }
    },
    refreshFieldOptions() {
      const cfg = this.flowConfig && Array.isArray(this.flowConfig.cells) ? this.flowConfig : { cells: [] }
      const nodeId = String(this.currentNodeId || '')
      if (!nodeId) {
        this.availableFieldOptions = []
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

      const uniq = Array.from(new Set(names.filter(Boolean)))
      this.availableFieldOptions = uniq.map(n => ({ label: n, value: n }))
    },
    syncCodeScroll() {
      const ta = this.$refs.codeEditor
      const gutter = this.$refs.codeGutter
      if (!ta || !gutter) return
      gutter.scrollTop = ta.scrollTop
    },
    syncCodeScrollFs() {
      const ta = this.$refs.codeEditorFs
      const gutter = this.$refs.codeGutterFs
      if (!ta || !gutter) return
      gutter.scrollTop = ta.scrollTop
    },
    onJavaDialogOpen() {
      this.$nextTick(() => this.syncCodeScrollFs())
    },
    handleSubmit() {
      const name = String(this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写步骤名称')
        return
      }

      if (this.isVisualMode) {
        const c = this.normalizeCondition(this.formData.condition)
        this.$set(this.formData, 'condition', c)
      } else if (!String(this.formData.javaCode || '').trim()) {
        this.$message.warning('请输入Java表达式')
        return
      }

      this.$emit('save', this.formData)
    }
  }
}
</script>

<style scoped>
.data-filter-config { height: 100%; }
.config-content { display: flex; flex-direction: column; padding: 20px; }
.config-tabs { margin: 0 0 8px; }
.form-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 12px; }
.form-item { margin-bottom: 16px; display: block; }
.form-label { display: block; width: 100%; text-align: left; line-height: 20px; color: #606266; font-size: 14px; margin-bottom: 8px; }
.form-label.required::before { content: '*'; color: #f56c6c; margin-right: 4px; }
.form-input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; outline: none; box-sizing: border-box; }
.form-textarea { width: 100%; padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; resize: vertical; outline: none; box-sizing: border-box; }
.radio-row { display: flex; align-items: center; gap: 12px; }
.radio-label { font-size: 14px; color: #606266; }
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-top: 1px solid #ebeef5; cursor: pointer; user-select: none; }
.section-header h4 { margin: 0; font-size: 14px; font-weight: 600; color: #303133; }
.section-toggle { color: #909399; }
.section-content { padding-top: 8px; margin-bottom: 8px; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #ebeef5; }
.btn { padding: 0 20px; height: 36px; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; font-size: 14px; background: #fff; color: #606266; }
.primary-btn { background: #409eff; color: #fff; border-color: #409eff; }
.help-i { color: #909399; margin-left: 4px; }

.code-editor-wrap { width: 100%; }
.code-editor-toolbar { display: flex; justify-content: flex-end; margin-bottom: 6px; }
.icon-btn { width: 30px; height: 30px; border: 1px solid #e4e7ed; background: #fff; border-radius: 4px; cursor: pointer; color: #606266; }
.code-editor-panel { display: grid; grid-template-columns: 44px 1fr; border: 1px solid #dcdfe6; border-radius: 4px; overflow: hidden; }
.code-gutter { background: #f5f7fa; border-right: 1px solid #ebeef5; color: #909399; font-size: 12px; line-height: 24px; text-align: center; overflow: hidden; max-height: 240px; }
.gutter-line { height: 24px; }
.code-editor { border: none; outline: none; resize: vertical; padding: 8px 10px; min-height: 120px; font-size: 13px; line-height: 24px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.fs-editor { display: grid; grid-template-columns: 44px 1fr; border: 1px solid #dcdfe6; border-radius: 4px; overflow: hidden; }
.fs-gutter { max-height: 60vh; }
.fs-editor-area { min-height: 52vh; max-height: 60vh; }

.mapping-filter-root { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.logic-select { width: 120px; }
.mapping-filter-lines { max-height: 50vh; overflow: auto; padding-right: 4px; }
.mapping-filter-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.field-select { width: 180px; }
.op-select { width: 140px; }
.value-input { width: 220px; }
.mapping-filter-group { width: 100%; border: 1px solid #ebeef5; border-radius: 4px; padding: 10px; background: #fafafa; }
.mapping-filter-group-title { font-size: 12px; color: #909399; margin-bottom: 8px; }
</style>
