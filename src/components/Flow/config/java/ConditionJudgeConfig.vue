<template>
  <div class="condition-judge-config">
    <div class="config-content">
      <FlowConfigHero
        badge="逻辑"
        title="条件判断（Java）"
        description="用 Java 布尔表达式分流：成立走匹配步骤，否则走未匹配步骤。"
        tone="slate"
        icon="el-icon-question"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="条件判断（Java）">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea
            v-model="formData.description"
            class="form-textarea"
            rows="3"
            placeholder="请输入说明"
          />
        </div>

        <div class="form-item">
          <label class="form-label required">接收匹配行的步骤：</label>
          <el-select
            v-model="formData.trueStepName"
            class="form-select"
            clearable
            filterable
            placeholder="请选择接收匹配行的步骤"
            @visible-change="(v) => v && refreshConnectedStepOptions()"
          >
            <el-option
              v-for="opt in matchStepOptions"
              :key="opt"
              :label="opt"
              :value="opt"
            />
          </el-select>
        </div>

        <div class="form-item">
          <label class="form-label required">接收不匹配行的步骤：</label>
          <el-select
            v-model="formData.errorStepName"
            class="form-select"
            clearable
            filterable
            placeholder="请选择接收不匹配行的步骤"
            @visible-change="(v) => v && refreshConnectedStepOptions()"
          >
            <el-option
              v-for="opt in unmatchStepOptions"
              :key="opt"
              :label="opt"
              :value="opt"
            />
          </el-select>
        </div>

        <div class="form-item">
          <div class="code-head">
            <label class="required code-head-label">
              条件（Java表达式）：
              <el-tooltip content="Java表达式必须返回 True 或 False，可使用 equals、contains 等相关函数。" placement="top">
                <i class="el-icon-question help-i" />
              </el-tooltip>
            </label>
            <button type="button" class="code-fullscreen-link" @click="codeDialog.visible = true">
              <i class="el-icon-full-screen" />
              <span>全屏</span>
            </button>
          </div>
          <div class="code-editor-wrap">
            <div class="code-editor-panel">
              <div ref="codeGutter" class="code-gutter">
                <div v-for="n in lineCount" :key="n" class="gutter-line">{{ n }}</div>
              </div>
              <textarea
                ref="codeEditor"
                v-model="formData.condition"
                class="code-editor"
                rows="6"
                :readonly="false"
                :disabled="false"
                placeholder="请输入Java表达式，结果需为 true/false"
                @mousedown.stop
                @click.stop
                @keydown.stop
                @scroll="syncCodeScroll"
              />
            </div>
          </div>
          <div v-if="showConditionError" class="error-tip">请输入条件（Java表达式）</div>
        </div>
      </template>

      <template v-else>
        <div class="advanced-layout">
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
      :visible.sync="codeDialog.visible"
      title="条件（Java表达式）"
      width="960px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="condition-code-fullscreen-dialog"
      @open="onCodeDialogOpen"
    >
      <div class="fs-editor">
        <div ref="codeGutterFs" class="code-gutter fs-gutter">
          <div v-for="n in lineCount" :key="n" class="gutter-line">{{ n }}</div>
        </div>
        <textarea
          ref="codeEditorFs"
          v-model="formData.condition"
          class="code-editor fs-editor-area"
          rows="20"
          :readonly="false"
          :disabled="false"
          placeholder="请输入Java表达式，结果需为 true/false"
          @mousedown.stop
          @click.stop
          @keydown.stop
          @scroll="syncCodeScrollFs"
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="codeDialog.visible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import FlowConfigHero from '../common/FlowConfigHero.vue'

export default {
  name: 'ConditionJudgeConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
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
        parallel: false
      },
      connectedStepOptions: [],
      codeDialog: {
        visible: false
      },
      submitAttempted: false
    }
  },
  computed: {
    lineCount() {
      const s = this.formData.condition != null ? String(this.formData.condition) : ''
      const n = s.split('\n').length
      return Math.max(1, Math.min(5000, n))
    },
    matchStepOptions() {
      const selectedUnmatch = this.formData.errorStepName || ''
      return this.connectedStepOptions.filter(x => x !== selectedUnmatch)
    },
    unmatchStepOptions() {
      const selectedMatch = this.formData.trueStepName || ''
      return this.connectedStepOptions.filter(x => x !== selectedMatch)
    },
    showConditionError() {
      return this.submitAttempted && !String(this.formData.condition || '').trim()
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
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', '条件判断（Java）')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.trueStepName === undefined) {
        this.$set(this.formData, 'trueStepName', this.formData.matchStepName || '')
      }
      if (this.formData.errorStepName === undefined) {
        this.$set(this.formData, 'errorStepName', this.formData.unmatchStepName || '')
      }
      if (this.formData.condition === undefined) {
        this.$set(this.formData, 'condition', this.formData.conditionExpression || 'true')
      }
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)
      // 条件判断不支持复制/分发，固定为分发模式（distributeType=false）
      this.$set(this.formData, 'distributeType', false)
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
          if (!n) return ''
          return n?.data?.name || n?.label || ''
        })
        .filter(Boolean)

      this.connectedStepOptions = Array.from(new Set(options))

      if (this.formData.trueStepName && !this.connectedStepOptions.includes(this.formData.trueStepName)) {
        this.$set(this.formData, 'trueStepName', '')
      }
      if (this.formData.errorStepName && !this.connectedStepOptions.includes(this.formData.errorStepName)) {
        this.$set(this.formData, 'errorStepName', '')
      }
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
    onCodeDialogOpen() {
      this.$nextTick(() => this.syncCodeScrollFs())
    },
    buildPayloadForSave() {
      const raw = { ...this.formData }
      raw.name = String(raw.name || '').trim()
      raw.description = raw.description != null ? String(raw.description) : ''
      raw.trueStepName = raw.trueStepName != null ? String(raw.trueStepName) : ''
      raw.errorStepName = raw.errorStepName != null ? String(raw.errorStepName) : ''
      raw.condition = raw.condition != null ? String(raw.condition) : 'true'
      raw.copiesCache = raw.copiesCache != null && raw.copiesCache !== '' ? Math.max(1, Math.trunc(Number(raw.copiesCache))) : 1
      raw.distributeType = false
      return raw
    },
    handleSubmit() {
      this.submitAttempted = true
      const name = String(this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      if (!String(this.formData.condition || '').trim()) {
        this.$message.warning('请输入条件（Java表达式）')
        return
      }
      // 可选步骤：如果已连线节点则建议选择；未连线时允许为空
      this.$emit('save', this.buildPayloadForSave())
    }
  }
}
</script>

<style scoped>
.condition-judge-config {
  height: 100%;
}

.config-content {
  display: flex;
  flex-direction: column;
  padding: 16px 20px 20px;
}

.config-tabs {
  margin: 0 0 10px;
}

.config-tabs ::v-deep .el-tabs__item {
  height: 34px;
  line-height: 34px;
  font-size: 14px;
}

.config-tabs ::v-deep .el-tabs__header {
  margin-bottom: 10px;
}

.form-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 14px;
}

.form-item {
  margin-bottom: 14px;
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
  transition: all 0.2s ease;
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
  min-height: 72px;
  transition: all 0.2s ease;
}

.form-input:hover,
.form-textarea:hover {
  border-color: #c0c4cc;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
}

.form-select {
  width: 100%;
}

.form-select ::v-deep .el-input__inner {
  height: 40px;
  line-height: 40px;
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

.code-editor-wrap {
  width: 100%;
  border-radius: 4px;
}

.code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.code-head-label {
  color: #606266;
  font-size: 14px;
  text-align: left;
  margin-bottom: 0;
  flex: 1;
  min-width: 0;
  width: auto;
  line-height: 20px;
  display: flex;
  align-items: center;
}

.code-head-label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.code-fullscreen-link {
  border: none;
  background: transparent;
  color: #909399;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  line-height: 20px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.code-fullscreen-link:hover {
  color: #409eff;
}

.code-editor-toolbar {
  display: none;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #e4e7ed;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  color: #606266;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  color: #409eff;
  border-color: #bfd9ff;
  background: #ecf5ff;
}

.code-editor-panel {
  display: grid;
  grid-template-columns: 44px 1fr;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.code-gutter {
  background: #f5f7fa;
  border-right: 1px solid #ebeef5;
  color: #909399;
  font-size: 12px;
  line-height: 24px;
  text-align: center;
  overflow: hidden;
  max-height: 240px;
}

.gutter-line {
  height: 24px;
}

.code-editor {
  position: relative;
  z-index: 2;
  pointer-events: auto;
  background: #fff;
  border: none;
  outline: none;
  resize: vertical;
  padding: 8px 10px;
  min-height: 140px;
  max-height: 260px;
  font-size: 13px;
  line-height: 24px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.error-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #f56c6c;
}

.advanced-layout .section-header {
  margin-top: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.btn {
  padding: 0 20px;
  min-width: 72px;
  height: 34px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: #fff;
  color: #606266;
  transition: all 0.2s ease;
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

.secondary-btn:hover {
  color: #409eff;
  border-color: #b3d8ff;
}

.help-i {
  color: #909399;
  margin-left: 4px;
}

.radio-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.radio-label {
  font-size: 14px;
  color: #606266;
}

.fs-editor {
  display: grid;
  grid-template-columns: 44px 1fr;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.fs-gutter {
  max-height: 60vh;
}

.fs-editor-area {
  min-height: 52vh;
  max-height: 60vh;
}
</style>
