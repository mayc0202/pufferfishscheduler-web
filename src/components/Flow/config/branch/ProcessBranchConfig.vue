<template>
  <div class="process-branch-config">
    <div class="config-content">
      <FlowConfigHero
        badge="流程"
        title="流程分支"
        description="按字段值映射到不同下游步骤，支持多分支与默认路径，实现多路路由。"
        tone="rose"
        icon="el-icon-share"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="流程分支">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">
            条件字段
            <el-tooltip content="当该字段的值与流程分支配置中设置的值一致时，执行相应的流程分支。" placement="top">
              <i class="el-icon-question help-i" />
            </el-tooltip>
            ：
          </label>
          <el-select
            v-model="formData.conditionFiled"
            class="form-select"
            filterable
            clearable
            placeholder="请选择条件字段"
            @visible-change="(v) => v && refreshFieldOptions()"
          >
            <el-option
              v-for="fd in conditionFieldOptions"
              :key="fd.value"
              :label="fd.label"
              :value="fd.value"
            />
          </el-select>
        </div>

        <div class="form-item">
          <label class="form-label">流程分支设置：</label>
          <div class="branch-preview">
            <el-table :data="previewRows" border style="width: 100%">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column prop="caseValue" label="值" min-width="160" show-overflow-tooltip />
              <el-table-column prop="stepName" label="步骤名称" min-width="180" show-overflow-tooltip />
            </el-table>
            <button type="button" class="dash-btn" @click="editor.visible = true">
              <i class="el-icon-edit" />
              编辑流程分支
            </button>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">默认目标步骤：</label>
          <el-select
            v-model="formData.defaultTargetStep"
            class="form-select"
            filterable
            clearable
            placeholder="请选择默认目标步骤"
            @visible-change="(v) => v && refreshConnectedStepOptions()"
          >
            <el-option
              v-for="opt in defaultTargetStepOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
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
              <span class="radio-label">数据分发模式：</span>
              <el-radio-group v-model="distributionMode">
                <el-radio :label="'copy'">复制</el-radio>
                <el-radio :label="'distribute'">分发</el-radio>
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
      :visible.sync="editor.visible"
      title="流程分支设置"
      width="820px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="process-branch-editor-dialog"
      @open="onEditorOpen"
    >
      <div class="editor-body">
        <div class="editor-title">流程分支：</div>
        <el-table :data="editor.rows" border style="width: 100%">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column label="值" min-width="220">
            <template slot-scope="scope">
              <el-input v-model="scope.row.caseValue" size="small" placeholder="请输入值" />
            </template>
          </el-table-column>
          <el-table-column label="步骤名称" min-width="260">
            <template slot-scope="scope">
              <el-select
                v-model="scope.row.stepId"
                filterable
                clearable
                size="small"
                placeholder="请选择步骤名称"
                style="width: 100%"
              >
                <el-option
                  v-for="opt in editorStepOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="70" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="removeEditorRow(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <button type="button" class="dash-btn add-btn" @click="addEditorRow">
          <i class="el-icon-plus" />
          添加行
        </button>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="confirmEditor">确定</el-button>
        <el-button @click="editor.visible = false">取消</el-button>
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

export default {
  name: 'ProcessBranchConfig',
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
        distribution: true
      },
      conditionFieldOptions: [],
      connectedStepOptions: [],
      editor: {
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
    previewRows() {
      const rows = Array.isArray(this.formData.ProcessBranchSetup) ? this.formData.ProcessBranchSetup : []
      return rows.map((r) => {
        const stepId = r && r.stepId != null ? String(r.stepId) : ''
        const opt = this.connectedStepOptions.find(x => x.value === stepId)
        const stepName = (r && r.stepName) || (opt && opt.label) || ''
        return {
          caseValue: r && r.caseValue != null ? String(r.caseValue) : '',
          stepId,
          stepName
        }
      })
    },
    defaultTargetStepOptions() {
      return this.connectedStepOptions
    },
    editorStepOptions() {
      return this.connectedStepOptions
    }
  },
  watch: {
    flowConfig: {
      handler() {
        this.refreshConnectedStepOptions()
      },
      deep: true
    },
    currentNodeId() {
      this.refreshConnectedStepOptions()
    }
  },
  mounted() {
    this.initDefaults()
    this.refreshConnectedStepOptions()
    this.refreshFieldOptions()
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', '流程分支')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.conditionFiled === undefined) this.$set(this.formData, 'conditionFiled', '')
      if (!Array.isArray(this.formData.ProcessBranchSetup)) this.$set(this.formData, 'ProcessBranchSetup', [])
      if (this.formData.defaultTargetStep === undefined) this.$set(this.formData, 'defaultTargetStep', '')
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', true)
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
    async refreshFieldOptions() {
      if (!this.flowId) {
        this.conditionFieldOptions = []
        return
      }
      try {
        const mergedFlowConfig = this.buildFlowConfigWithCurrentNode()
        const res = await getFlowFieldStream({
          flowId: this.flowId,
          config: JSON.stringify(mergedFlowConfig),
          stepName: this.formData.name || '流程分支',
          code: this.formData.code || 'ProcessBranch',
          dbId: this.formData.dbId,
          tableId: this.formData.tableId
        })
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          const names = res.data
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
          this.conditionFieldOptions = Array.from(new Set(names)).map(n => ({ label: n, value: n }))
          return
        }
        if (res && res.code === '000000' && res.data && Array.isArray(res.data.fieldList)) {
          const names = res.data.fieldList
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
          this.conditionFieldOptions = Array.from(new Set(names)).map(n => ({ label: n, value: n }))
          return
        }
        this.conditionFieldOptions = []
      } catch (e) {
        this.conditionFieldOptions = []
      }
    },
    refreshConnectedStepOptions() {
      const cfg = this.flowConfig && Array.isArray(this.flowConfig.cells) ? this.flowConfig : { cells: [] }
      const nodeId = String(this.currentNodeId || '')
      if (!nodeId) {
        this.connectedStepOptions = []
        return
      }
      const nodeMap = new Map()
      const edges = []
      cfg.cells.forEach((c) => {
        if (!c) return
        if (c.shape === 'edge') edges.push(c)
        else nodeMap.set(String(c.id), c)
      })

      const outTargetIds = edges
        .filter((e) => String(e?.source?.cell || '') === nodeId)
        .map(e => String(e?.target?.cell || ''))
        .filter(Boolean)

      const options = outTargetIds
        .map((tid) => {
          const n = nodeMap.get(tid)
          if (!n) return null
          const name = n?.data?.name || n?.label || ''
          if (!name) return null
          return { label: String(name), value: tid }
        })
        .filter(Boolean)

      const uniqMap = new Map()
      options.forEach((o) => {
        if (!uniqMap.has(o.value)) uniqMap.set(o.value, o)
      })
      this.connectedStepOptions = Array.from(uniqMap.values())

      const setupRows = Array.isArray(this.formData.ProcessBranchSetup) ? this.formData.ProcessBranchSetup : []
      const validIds = new Set(this.connectedStepOptions.map(x => x.value))
      const normalizedSetup = setupRows
        .map((r) => {
          const stepId = r && r.stepId != null ? String(r.stepId) : ''
          if (!stepId || !validIds.has(stepId)) return null
          const opt = this.connectedStepOptions.find(x => x.value === stepId)
          return {
            caseValue: r && r.caseValue != null ? String(r.caseValue) : '',
            stepId,
            stepName: opt ? opt.label : ''
          }
        })
        .filter(Boolean)
      this.$set(this.formData, 'ProcessBranchSetup', normalizedSetup)

      // 默认目标步骤：历史/后端可能保存“步骤名称”而不是“步骤ID”，这里做一次兼容回填
      const defaultStepRaw = this.formData.defaultTargetStep != null ? String(this.formData.defaultTargetStep).trim() : ''
      const defaultStepNameRaw = this.formData.defaultTargetStepName != null ? String(this.formData.defaultTargetStepName).trim() : ''
      const defaultStep = defaultStepRaw || defaultStepNameRaw
      if (!defaultStep) return

      // 1) 已经是下游节点 id：直接保留
      if (validIds.has(defaultStep)) {
        if (defaultStepRaw !== defaultStep) {
          this.$set(this.formData, 'defaultTargetStep', defaultStep)
        }
        return
      }

      // 2) 尝试把“步骤名称”映射为 id
      const matched = this.connectedStepOptions.find(o => String(o.label).trim() === defaultStep)
      if (matched && matched.value) {
        this.$set(this.formData, 'defaultTargetStep', String(matched.value))
        return
      }

      // 3) 无法映射则清空，避免提交无效值
      this.$set(this.formData, 'defaultTargetStep', '')
    },
    onEditorOpen() {
      this.refreshConnectedStepOptions()
      const src = Array.isArray(this.formData.ProcessBranchSetup) ? this.formData.ProcessBranchSetup : []
      this.editor.rows = src.map((r) => {
        const stepId = r && r.stepId != null ? String(r.stepId) : ''
        const opt = this.connectedStepOptions.find(x => x.value === stepId)
        return {
          caseValue: r && r.caseValue != null ? String(r.caseValue) : '',
          stepId,
          stepName: (r && r.stepName) || (opt && opt.label) || ''
        }
      })
    },
    addEditorRow() {
      this.editor.rows.push({
        caseValue: '',
        stepId: '',
        stepName: ''
      })
    },
    removeEditorRow(index) {
      this.editor.rows.splice(index, 1)
    },
    confirmEditor() {
      for (let i = 0; i < this.editor.rows.length; i++) {
        const row = this.editor.rows[i]
        const caseValue = String(row.caseValue || '').trim()
        const stepId = String(row.stepId || '').trim()
        if (!caseValue) {
          this.$message.warning(`第 ${i + 1} 行的“值”不能为空`)
          return
        }
        if (!stepId) {
          this.$message.warning(`第 ${i + 1} 行的“步骤名称”不能为空`)
          return
        }
      }
      const setup = this.editor.rows.map((r) => {
        const stepId = String(r.stepId || '').trim()
        const opt = this.connectedStepOptions.find(x => x.value === stepId)
        return {
          caseValue: String(r.caseValue || '').trim(),
          stepId,
          stepName: opt ? opt.label : ''
        }
      })
      this.$set(this.formData, 'ProcessBranchSetup', setup)
      this.editor.visible = false
    },
    handleSubmit() {
      const name = String(this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      if (!String(this.formData.conditionFiled || '').trim()) {
        this.$message.warning('请选择条件字段')
        return
      }
      const rows = Array.isArray(this.formData.ProcessBranchSetup) ? this.formData.ProcessBranchSetup : []
      if (!rows.length) {
        this.$message.warning('请配置流程分支设置')
        return
      }

      const setup = rows.map((r) => ({
        caseValue: String(r.caseValue || '').trim(),
        stepId: String(r.stepId || '').trim(),
        stepName: String(r.stepName || '')
      })).filter(r => r.caseValue && r.stepId)
      this.$set(this.formData, 'ProcessBranchSetup', setup)

      this.$emit('save', { ...this.formData })
    }
  }
}
</script>

<style scoped>
.process-branch-config { height: 100%; }
.config-content { display: flex; flex-direction: column; padding: 16px 20px 20px; }
.config-tabs { margin: 0 0 10px; }
.form-title { font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 14px; }
.form-item { margin-bottom: 14px; display: block; }
.form-label { display: block; width: 100%; text-align: left; line-height: 20px; color: #606266; font-size: 14px; margin-bottom: 8px; }
.form-label.required::before { content: '*'; color: #f56c6c; margin-right: 4px; }
.form-input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; outline: none; box-sizing: border-box; }
.form-textarea { width: 100%; padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; resize: vertical; outline: none; box-sizing: border-box; min-height: 72px; }
.form-select { width: 100%; }
.help-i { color: #909399; margin-left: 4px; }
.branch-preview { width: 100%; }
.dash-btn {
  width: 100%;
  height: 36px;
  margin-top: 12px;
  border: 1px dashed #409eff;
  border-radius: 4px;
  background: #fff;
  color: #409eff;
  cursor: pointer;
}
.dash-btn:hover { background: #ecf5ff; }
.add-btn { margin-top: 10px; }
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-top: 1px solid #ebeef5; cursor: pointer; user-select: none; }
.section-header h4 { margin: 0; font-size: 14px; font-weight: 600; color: #303133; }
.section-toggle { color: #909399; }
.section-content { padding-top: 8px; margin-bottom: 8px; }
.radio-row { display: flex; align-items: center; gap: 12px; }
.radio-label { font-size: 14px; color: #606266; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 18px; padding-top: 14px; border-top: 1px solid #ebeef5; background: #fff; }
.btn { padding: 0 20px; min-width: 72px; height: 34px; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; font-size: 14px; background: #fff; color: #606266; }
.primary-btn { background: #409eff; color: #fff; border-color: #409eff; }
.primary-btn:hover { background: #66b1ff; border-color: #66b1ff; }
.secondary-btn:hover { color: #409eff; border-color: #b3d8ff; }
.editor-body { padding: 4px 0 0; }
.editor-title { margin-bottom: 10px; color: #606266; }
</style>
