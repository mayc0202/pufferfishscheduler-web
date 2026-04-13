<template>
  <div class="clean-transform-config">
    <div class="config-content">
      <FlowConfigHero
        badge="清洗"
        title="数据清洗转换"
        description="按规则对字段做校验、脱敏与格式化处理，并输出清洗后的字段结构。"
        tone="teal"
        icon="el-icon-magic-stick"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <div v-show="activeTab === 'basic'">
      <div class="form-item">
        <label class="form-label required">节点名称：</label>
        <input v-model="formData.name" type="text" class="form-input" placeholder="数据清洗转换">
      </div>

      <div class="form-item">
        <label class="form-label">节点说明：</label>
        <textarea v-model="formData.description" class="form-textarea" placeholder="请输入节点说明" rows="3" />
      </div>

      <div class="section-header" @click="sectionOpen.fields = !sectionOpen.fields">
        <h4>清洗字段</h4>
        <div class="section-toggle">
          <i :class="sectionOpen.fields ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        </div>
      </div>

      <div v-show="sectionOpen.fields" class="section-content">
        <div class="field-table-wrap clean-fields-summary-wrap">
          <el-table
            :data="formData.fieldList"
            class="clean-fields-summary-table"
            border
            style="width: 100%"
            max-height="200"
          >
            <el-table-column type="index" label="#" width="52" align="center" />
            <el-table-column prop="name" label="清洗字段名称" min-width="72" show-overflow-tooltip />
            <el-table-column label="清洗规则" min-width="72">
              <template slot-scope="scope">
                <div class="rule-tags">
                  <el-tag
                    v-for="(r, i) in (scope.row.ruleList || [])"
                    :key="r.uuId || i"
                    size="mini"
                    class="rule-tag"
                  >
                    {{ r.ruleName || r.ruleCode || '-' }}
                  </el-tag>
                  <span v-if="!scope.row.ruleList || scope.row.ruleList.length === 0" class="empty-text">暂无数据</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="field-actions">
          <button type="button" class="dash-btn" @click="openRuleEditor">
            <i class="el-icon-edit" /> 编辑清洗规则
          </button>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
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
        <div class="form-actions">
          <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
          <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
        </div>
      </div>
    </div>

    <!-- 编辑清洗规则弹窗 -->
    <el-dialog
      v-dialog-drag
      :visible.sync="ruleEditor.visible"
      width="1200px"
      top="6vh"
      append-to-body
      modal-append-to-body
      :z-index="200000"
      :modal-z-index="199999"
      :close-on-click-modal="false"
      custom-class="clean-rule-editor-dialog"
      @close="closeRuleEditor"
    >
      <div slot="title" class="dlg-title">
        <span class="dlg-title-text">编辑清洗规则</span>
        <span class="dlg-title-sub">按字段配置多个清洗规则，并完善输出字段与参数</span>
      </div>

      <div class="dlg-body">
        <div class="dlg-left">
          <div class="left-block">
            <div class="block-hd">
              <div class="block-hd-title">
                <span class="req-dot">*</span>添加清洗字段
              </div>
            </div>
            <div class="block-bd">
              <div class="field-add-row">
                <el-select
                  v-model="ruleEditor.selectedFieldName"
                  filterable
                  clearable
                  placeholder="请选择字段"
                  size="small"
                  class="field-select"
                  popper-class="clean-field-select-popper"
                >
                  <el-option
                    v-for="fd in availableFieldOptions"
                    :key="fd"
                    :label="fd"
                    :value="fd"
                  />
                </el-select>
                <el-button type="primary" size="small" icon="el-icon-plus" @click="addFieldToRuleEditor">
                  添加
                </el-button>
              </div>

              <div class="field-list">
                <div
                  v-for="(f, idx) in ruleEditor.fields"
                  :key="f.name"
                  class="field-row"
                  :class="{ active: ruleEditor.activeFieldIndex === idx }"
                  @click="setActiveField(idx)"
                >
                  <div class="field-row-main">
                    <span class="field-dot" />
                    <span class="field-name">{{ f.name }}</span>
                  </div>
                  <div class="field-row-actions">
                    <el-tooltip content="上移" placement="top">
                      <i class="el-icon-top action-icon" @click.stop="moveField(idx, -1)" />
                    </el-tooltip>
                    <el-tooltip content="下移" placement="top">
                      <i class="el-icon-bottom action-icon" @click.stop="moveField(idx, 1)" />
                    </el-tooltip>
                    <el-tooltip content="移除字段" placement="top">
                      <i class="el-icon-close action-icon danger" @click.stop="removeField(idx)" />
                    </el-tooltip>
                  </div>
                </div>

                <div v-if="ruleEditor.fields.length === 0" class="left-empty">
                  还没有添加字段。先从上方选择字段并点击“添加”。
                </div>
              </div>
            </div>
          </div>

          <div class="left-block" style="margin-top: 12px;">
            <div class="block-hd">
              <div class="block-hd-title">
                规则列表
              </div>
              <el-button
                type="text"
                icon="el-icon-plus"
                :disabled="!activeField"
                @click="addRuleToActiveField"
              >
                添加规则
              </el-button>
            </div>
            <div class="block-bd">
              <div v-if="!activeField" class="left-empty">
                请先选择左侧字段
              </div>

              <div v-else-if="!activeField.ruleList || activeField.ruleList.length === 0" class="left-empty">
                当前字段暂无规则，点击右上角“添加规则”
              </div>

              <div v-else class="rule-list">
                <div
                  v-for="(r, ridx) in activeField.ruleList"
                  :key="r.uuId || ridx"
                  class="rule-row"
                  :class="{ active: ruleEditor.activeRuleIndex === ridx }"
                  @click="setActiveRule(ridx)"
                >
                  <div class="rule-row-main">
                    <div class="rule-row-title">
                      {{ r.ruleName || '未选择规则' }}
                    </div>
                    <div class="rule-row-sub">
                      {{ r.rename ? ('输出：' + r.rename + ' / ' + (r.renameType || 'String')) : '请配置输出字段' }}
                    </div>
                  </div>
                  <div class="rule-row-actions">
                    <el-tooltip content="上移" placement="top">
                      <i class="el-icon-top action-icon" @click.stop="moveRule(ridx, -1)" />
                    </el-tooltip>
                    <el-tooltip content="下移" placement="top">
                      <i class="el-icon-bottom action-icon" @click.stop="moveRule(ridx, 1)" />
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                      <i class="el-icon-close action-icon danger" @click.stop="removeRule(ridx)" />
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dlg-right">
          <div v-if="!activeField" class="right-empty">
            <div class="right-empty-title">请选择字段</div>
            <div class="right-empty-sub">在左侧添加并选中一个字段后，才能继续配置规则。</div>
          </div>

          <div v-else-if="!activeRule" class="right-empty">
            <div class="right-empty-title">请选择规则</div>
            <div class="right-empty-sub">为当前字段添加一条规则并选中，右侧将展示配置表单。</div>
          </div>

          <div v-else class="right-form">
            <el-form :model="activeRule" label-width="110px" size="small">
              <div class="right-section">
                <div class="right-section-title">
                  <span class="req-dot">*</span>规则配置
                </div>
                <el-form-item label="清洗转换规则" required>
                  <el-cascader
                    v-model="ruleEditor.rulePickerValue"
                    :options="ruleTreeOptions"
                    :props="ruleCascaderProps"
                    filterable
                    clearable
                    size="small"
                    style="width: 100%"
                    placeholder="请选择清洗转换规则"
                    popper-class="clean-rule-cascader-popper"
                    @visible-change="handleRuleCascaderVisibleChange"
                    @change="handleRulePicked"
                  />
                </el-form-item>

                <el-form-item label="规则描述">
                  <el-input
                    v-model="activeRule.ruleDescription"
                    type="textarea"
                    :rows="4"
                    placeholder="—"
                    readonly
                    class="readonly-textarea"
                  />
                </el-form-item>
              </div>

              <div class="right-section">
                <div class="right-section-title">
                  <span class="req-dot">*</span>输出字段
                </div>
                <el-form-item label="输出字段名称" required>
                  <el-input v-model="activeRule.rename" placeholder="请输入输出字段名称" />
                </el-form-item>

                <el-form-item label="返回值类型" required>
                  <el-select v-model="activeRule.renameType" placeholder="请选择字段类型" style="width: 100%">
                    <el-option label="String" value="String" />
                    <el-option label="Long" value="Long" />
                    <el-option label="Double" value="Double" />
                    <el-option label="Boolean" value="Boolean" />
                    <el-option label="Date" value="Date" />
                    <el-option label="Object" value="Object" />
                  </el-select>
                </el-form-item>
              </div>

              <div class="right-section">
                <div class="right-section-title row-between" @click="ruleEditor.paramOpen = !ruleEditor.paramOpen">
                  <div>
                    <span class="req-dot">*</span>参数配置
                  </div>
                  <i :class="ruleEditor.paramOpen ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
                </div>

                <div v-show="ruleEditor.paramOpen">
                  <el-table
                    :data="activeRule.fieldList || []"
                    border
                    size="mini"
                    style="width: 100%"
                    max-height="260"
                  >
                    <el-table-column type="index" label="#" width="50" />
                    <el-table-column prop="name" label="参数名称" width="160" />
                    <el-table-column prop="description" label="参数描述" min-width="200" show-overflow-tooltip />
                    <el-table-column label="是否必填" width="90">
                      <template slot-scope="scope">
                        <span :class="{ 'req-badge': scope.row.requires }">{{ scope.row.requires ? '是' : '否' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="参数值" width="260">
                      <template slot-scope="scope">
                        <template v-if="Number(scope.row.controlType) === 2">
                          <el-select
                            v-model="scope.row.value"
                            size="mini"
                            clearable
                            placeholder="请选择"
                            style="width: 100%"
                          >
                            <el-option
                              v-for="(opt, oidx) in (scope.row.selectArray || [])"
                              :key="oidx"
                              :label="opt.label || opt.name || String(opt)"
                              :value="opt.value || opt.code || opt.id || String(opt)"
                            />
                          </el-select>
                        </template>
                        <template v-else>
                          <el-input
                            v-model="scope.row.value"
                            size="mini"
                            :placeholder="scope.row.requires ? '必填' : '可选'"
                            :class="{ 'is-invalid': ruleEditor.validateAttempted && scope.row.requires && isEmpty(scope.row.value) }"
                          />
                        </template>
                      </template>
                    </el-table-column>
                  </el-table>

                  <div v-if="!activeRule.fieldList || activeRule.fieldList.length === 0" class="param-empty">
                    该规则无需配置参数
                  </div>
                </div>
              </div>
            </el-form>
          </div>
        </div>
      </div>

      <div slot="footer" class="dlg-footer">
        <div class="dlg-footer-left">
          <span class="footer-hint">提示：规则未选择/输出字段为空/必填参数未填，将无法保存。</span>
        </div>
        <div class="dlg-footer-right">
          <el-button size="small" @click="closeRuleEditor">取消</el-button>
          <el-button type="primary" size="small" @click="confirmRuleEditor">确认</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { tree as ruleTree, detail as ruleDetail } from '@/api/collect/rule/rule'
import { detail as processorDetail } from '@/api/collect/rule/ruleProcessor'
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

function genFrontUuid() {
  const rnd = Math.random().toString(16).slice(2)
  return `P${Date.now().toString(16)}${rnd}`.slice(0, 17)
}

export default {
  name: 'CleanTransformConfig',
  components: { FlowConfigHero },
  directives: {
    /**
     * ElementUI el-dialog 拖拽（仅本组件使用）
     * 按住 header 拖动，限制在视窗范围内
     */
    dialogDrag: {
      inserted(el) {
        const headerEl = el.querySelector('.el-dialog__header')
        const dialogEl = el.querySelector('.el-dialog')
        if (!headerEl || !dialogEl) return

        headerEl.style.cursor = 'move'
        headerEl.onselectstart = () => false

        headerEl.onmousedown = (e) => {
          if (e.button !== 0) return
          // 点击关闭按钮等交互时不触发拖拽定位切换
          const target = e.target
          if (target && (target.closest('.el-dialog__headerbtn') || target.closest('.el-dialog__close'))) {
            return
          }

          const startX = e.clientX
          const startY = e.clientY
          const rect = dialogEl.getBoundingClientRect()
          let baseLeft = rect.left
          let baseTop = rect.top
          const startW = rect.width
          const startH = rect.height
          const threshold = 3
          let dragging = false

          const pad = 8
          const maxLeft = () => window.innerWidth - startW - pad
          const maxTop = () => window.innerHeight - startH - pad

          const ensureFixedPositioning = () => {
            if (dragging) return
            // 进入拖拽时做“位置补偿”，避免切换定位方式导致弹窗跳动
            const before = dialogEl.getBoundingClientRect()

            dialogEl.style.margin = '0'
            dialogEl.style.position = 'fixed'
            dialogEl.style.transform = 'none'
            dialogEl.style.left = `${before.left}px`
            dialogEl.style.top = `${before.top}px`

            requestAnimationFrame(() => {
              const after = dialogEl.getBoundingClientRect()
              const dx = after.left - before.left
              const dy = after.top - before.top
              baseLeft = before.left - dx
              baseTop = before.top - dy
              dialogEl.style.left = `${baseLeft}px`
              dialogEl.style.top = `${baseTop}px`
              dragging = true
            })
          }

          const onMouseMove = (ev) => {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            if (!dragging && (Math.abs(dx) > threshold || Math.abs(dy) > threshold)) {
              ensureFixedPositioning()
            }
            if (!dragging) return

            let nextLeft = baseLeft + dx
            let nextTop = baseTop + dy

            nextLeft = Math.min(Math.max(nextLeft, pad), Math.max(pad, maxLeft()))
            nextTop = Math.min(Math.max(nextTop, pad), Math.max(pad, maxTop()))

            dialogEl.style.left = `${nextLeft}px`
            dialogEl.style.top = `${nextTop}px`
          }

          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
          }

          document.addEventListener('mousemove', onMouseMove)
          document.addEventListener('mouseup', onMouseUp)
        }
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
    // 用于后端计算“清洗转换”可选输入字段
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
        fields: true,
        distribution: false,
        parallel: false
      },
      ruleTreeOptions: [],
      availableFieldOptions: [],
      ruleEditor: {
        visible: false,
        selectedFieldName: '',
        fields: [],
        activeFieldIndex: 0,
        activeRuleIndex: 0,
        rulePickerValue: null,
        paramOpen: true,
        validateAttempted: false
      },
      loadingRuleTree: false
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
    ruleCascaderProps() {
      return {
        value: 'value',
        label: 'label',
        children: 'children',
        emitPath: false,
        checkStrictly: true
      }
    },
    activeField() {
      if (!this.ruleEditor.fields || this.ruleEditor.fields.length === 0) return null
      return this.ruleEditor.fields[this.ruleEditor.activeFieldIndex] || null
    },
    activeRule() {
      if (!this.activeField || !this.activeField.ruleList || this.activeField.ruleList.length === 0) return null
      return this.activeField.ruleList[this.ruleEditor.activeRuleIndex] || null
    }
  },
  watch: {
    'ruleEditor.visible': {
      handler(v) {
        if (v) {
          this.bootstrapRuleEditorFromForm()
        }
      }
    }
  },
  mounted() {
    this.initDefaults()
    // 不在 mounted 阶段强拉规则树，改成打开下拉时再拉，避免无意义请求
    this.loadAvailableFields()
  },
  methods: {
    parseParamsConfig(paramsConfig) {
      if (!paramsConfig) return null
      try {
        const parsed = typeof paramsConfig === 'string' ? JSON.parse(paramsConfig) : paramsConfig
        // 兼容多种返回结构：
        // 1) { data: { renameType, rename, fieldList: [...] } }
        // 2) { paramsConfig: { ... } }
        // 3) 直接是 { renameType, rename, fieldList: [...] } 或 { paramName: {...} }
        if (parsed && parsed.data && typeof parsed.data === 'object') return parsed.data
        if (parsed && parsed.paramsConfig && typeof parsed.paramsConfig === 'object') return parsed.paramsConfig
        if (parsed && typeof parsed === 'object') return parsed
        return null
      } catch (e) {
        return null
      }
    },

    /**
     * 从处理器 paramsConfig 构造参数列表
     * 约定（后端返回）：
     * {
     *   data: {
     *     renameType: 'String',
     *     rename: '',
     *     fieldList: [{ controlType, dataType, name, description, selectArray, value, requires }]
     *   }
     * }
     */
    buildParamsFromProcessor(runtimeConfig, existingList = []) {
      if (!runtimeConfig || typeof runtimeConfig !== 'object') return []
      const list = Array.isArray(runtimeConfig.fieldList) ? runtimeConfig.fieldList : []
      const existMap = new Map((existingList || []).map(p => [p.name, p]))
      return list.map(p => {
        const prev = existMap.get(p.name)
        const nextValue = prev && prev.value != null
          ? prev.value
          : (p.value != null ? String(p.value) : '')
        return {
          controlType: p.controlType != null ? p.controlType : 1,
          dataType: p.dataType != null ? p.dataType : 1,
          name: p.name,
          description: p.description || '',
          selectArray: Array.isArray(p.selectArray) ? p.selectArray : [],
          value: nextValue,
          requires: !!p.requires
        }
      })
    },
    async handleRuleCascaderVisibleChange(visible) {
      if (!visible) return
      await this.loadRuleTree()
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

      // 与画布保存保持一致：
      // node.data = { name, code, data: { name, code, data: {...formData} } }
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

    initDefaults() {
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)
      if (!Array.isArray(this.formData.fieldList)) this.$set(this.formData, 'fieldList', [])
      if (this.formData.supportCopy === undefined) this.$set(this.formData, 'supportCopy', true)
      if (this.formData.supportError === undefined) this.$set(this.formData, 'supportError', true)
      if (this.formData.supportInput === undefined) this.$set(this.formData, 'supportInput', true)
    },
    async loadAvailableFields() {
      if (!this.flowId) return
      try {
        const mergedFlowConfig = this.buildFlowConfigWithCurrentNode()
        const configStr = JSON.stringify(mergedFlowConfig)
        const res = await getFlowFieldStream({
          flowId: this.flowId,
          config: configStr,
          stepName: this.formData.name || '数据清洗转换',
          code: this.formData.code || '',
          dbId: this.formData.dbId,
          tableId: this.formData.tableId
        })
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          this.availableFieldOptions = res.data.map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream))).filter(Boolean)
        } else if (res && res.code === '000000' && res.data && Array.isArray(res.data.fieldList)) {
          this.availableFieldOptions = res.data.fieldList
        } else {
          this.availableFieldOptions = []
        }
      } catch (e) {
        this.availableFieldOptions = []
      }
    },
    async loadRuleTree() {
      if (this.loadingRuleTree) return
      this.loadingRuleTree = true
      try {
        const res = await ruleTree()
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          this.ruleTreeOptions = this.normalizeRuleTree(res.data)
        } else {
          this.ruleTreeOptions = []
        }
      } catch (e) {
        this.ruleTreeOptions = []
      } finally {
        this.loadingRuleTree = false
      }
    },

    // 规则分组树（/rule/group/tree.do）不在此弹窗使用，避免多余接口调用
    normalizeRuleTree(nodes) {
      const walk = (arr) => {
        if (!Array.isArray(arr)) return []
        return arr.map(n => {
          const children = walk(n.children)
          const nodeType = n.type || n.nodeType || n.kind || ''
          const isRule = nodeType === 'RULE'
          // 关键：规则节点取 treeId（字符串 UUID）；分组节点仍是 int id
          const ruleTreeId = n.treeId || n.ruleId || n.id
          const value = isRule ? ruleTreeId : n.id
          const label = n.ruleName || n.name || n.label || '-'
          const node = {
            value: String(value),
            label,
            meta: {
              type: isRule ? 'RULE' : 'GROUP',
              treeId: ruleTreeId != null ? String(ruleTreeId) : '',
              id: n.id != null ? String(n.id) : ''
            }
          }
          if (children && children.length) {
            node.children = children
            // 分组节点禁选，避免把 groupId 当 ruleId 调详情
            node.disabled = true
          }
          // 兼容后端直接把规则挂在 group.children 中
          if (!node.children && Array.isArray(n.ruleList)) {
            node.children = n.ruleList.map(r => {
              const rid = r.treeId || r.ruleId || r.id
              return {
                value: String(rid),
                label: r.ruleName || r.name,
                meta: {
                  type: 'RULE',
                  treeId: rid != null ? String(rid) : '',
                  id: r.id != null ? String(r.id) : ''
                }
              }
            })
            node.disabled = true
          }
          return node
        })
      }
      return walk(nodes)
    },
    openRuleEditor() {
      this.ruleEditor.visible = true
      this.ruleEditor.validateAttempted = false
    },
    closeRuleEditor() {
      // 关闭时把当前编辑态同步到组件配置弹窗（仅前端内存）
      this.syncRuleEditorToForm()
      this.ruleEditor.visible = false
      this.ruleEditor.rulePickerValue = null
      this.ruleEditor.paramOpen = true
      this.ruleEditor.validateAttempted = false
    },
    bootstrapRuleEditorFromForm() {
      const fields = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      this.ruleEditor.fields = JSON.parse(JSON.stringify(fields)).map(f => ({
        name: f.name,
        businessName: f.businessName || '',
        ruleList: Array.isArray(f.ruleList) ? f.ruleList : []
      }))
      if (this.ruleEditor.fields.length === 0) {
        this.ruleEditor.activeFieldIndex = 0
        this.ruleEditor.activeRuleIndex = 0
      } else {
        this.ruleEditor.activeFieldIndex = Math.min(this.ruleEditor.activeFieldIndex, this.ruleEditor.fields.length - 1)
        const rl = this.ruleEditor.fields[this.ruleEditor.activeFieldIndex].ruleList || []
        this.ruleEditor.activeRuleIndex = rl.length ? Math.min(this.ruleEditor.activeRuleIndex, rl.length - 1) : 0
      }
    },
    setActiveField(idx) {
      this.ruleEditor.activeFieldIndex = idx
      this.ruleEditor.activeRuleIndex = 0
      this.ruleEditor.rulePickerValue = null
      this.ruleEditor.validateAttempted = false
    },
    addFieldToRuleEditor() {
      const name = (this.ruleEditor.selectedFieldName || '').trim()
      if (!name) {
        this.$message.warning('请选择字段')
        return
      }
      const exists = this.ruleEditor.fields.some(f => f.name === name)
      if (exists) {
        this.$message.warning('字段已存在')
        return
      }
      this.ruleEditor.fields.push({ name, businessName: '', ruleList: [] })
      this.ruleEditor.selectedFieldName = ''
      this.setActiveField(this.ruleEditor.fields.length - 1)
    },
    removeField(idx) {
      this.ruleEditor.fields.splice(idx, 1)
      if (this.ruleEditor.activeFieldIndex >= this.ruleEditor.fields.length) {
        this.ruleEditor.activeFieldIndex = Math.max(0, this.ruleEditor.fields.length - 1)
      }
      this.ruleEditor.activeRuleIndex = 0
    },
    moveField(idx, delta) {
      const next = idx + delta
      if (next < 0 || next >= this.ruleEditor.fields.length) return
      const tmp = this.ruleEditor.fields[idx]
      this.$set(this.ruleEditor.fields, idx, this.ruleEditor.fields[next])
      this.$set(this.ruleEditor.fields, next, tmp)
      if (this.ruleEditor.activeFieldIndex === idx) this.ruleEditor.activeFieldIndex = next
      else if (this.ruleEditor.activeFieldIndex === next) this.ruleEditor.activeFieldIndex = idx
    },
    addRuleToActiveField() {
      if (!this.activeField) {
        this.$message.warning('请先选择字段')
        return
      }
      if (!Array.isArray(this.activeField.ruleList)) this.$set(this.activeField, 'ruleList', [])
      const rule = {
        uuId: genFrontUuid(),
        ruleCode: '',
        ruleId: '',
        ruleName: '',
        ruleDescription: '',
        fieldList: [],
        ruleType: 1,
        renameType: 'String',
        rename: '',
        javaCode: '',
        mappingType: '',
        dataSourceId: '',
        tableName: '',
        beforefieldName: '',
        afterfieldName: '',
        outerQueryParams: {
          condition: 'and',
          queryConditions: [],
          queryParamForms: []
        },
        sqlCode: '',
        dataSourceSQLId: '',
        resultSetting: '0',
        stdCode: '',
        stdName: '',
        stdType: '',
        csCodeId: '',
        identifier: '',
        csCodeName: '',
        groupId: null,
        ruleProcessorId: null,
        ruleLxType: null
      }
      this.activeField.ruleList.push(rule)
      this.setActiveRule(this.activeField.ruleList.length - 1)
    },
    setActiveRule(idx) {
      this.ruleEditor.activeRuleIndex = idx
      this.ruleEditor.rulePickerValue = this.activeRule ? String(this.activeRule.ruleId || '') : null
      this.ruleEditor.validateAttempted = false
    },
    moveRule(idx, delta) {
      if (!this.activeField || !Array.isArray(this.activeField.ruleList)) return
      const next = idx + delta
      if (next < 0 || next >= this.activeField.ruleList.length) return
      const tmp = this.activeField.ruleList[idx]
      this.$set(this.activeField.ruleList, idx, this.activeField.ruleList[next])
      this.$set(this.activeField.ruleList, next, tmp)
      if (this.ruleEditor.activeRuleIndex === idx) this.ruleEditor.activeRuleIndex = next
      else if (this.ruleEditor.activeRuleIndex === next) this.ruleEditor.activeRuleIndex = idx
    },
    removeRule(idx) {
      if (!this.activeField || !Array.isArray(this.activeField.ruleList)) return
      this.activeField.ruleList.splice(idx, 1)
      if (this.ruleEditor.activeRuleIndex >= this.activeField.ruleList.length) {
        this.ruleEditor.activeRuleIndex = Math.max(0, this.activeField.ruleList.length - 1)
      }
      this.ruleEditor.rulePickerValue = this.activeRule ? String(this.activeRule.ruleId || '') : null
      this.ruleEditor.validateAttempted = false
    },
    isEmpty(v) {
      return v === null || v === undefined || String(v).trim() === ''
    },
    async handleRulePicked(val) {
      if (!this.activeRule) return
      if (!val) return
      const picked = this.findRuleNode(String(val), this.ruleTreeOptions)
      if (!picked) {
        this.$message.warning('规则不存在，请刷新后重试')
        this.ruleEditor.rulePickerValue = null
        return
      }
      if (picked.meta?.type !== 'RULE') {
        this.$message.warning('请选择具体规则（非分组）')
        this.ruleEditor.rulePickerValue = null
        return
      }
      const ruleId = picked.meta.treeId || String(val)
      await this.fillRuleById(ruleId)
    },

    findRuleNode(value, options) {
      const target = String(value)
      const walk = (arr) => {
        if (!Array.isArray(arr)) return null
        for (const n of arr) {
          if (!n) continue
          if (String(n.value) === target) return n
          if (n.children) {
            const hit = walk(n.children)
            if (hit) return hit
          }
        }
        return null
      }
      return walk(options)
    },
    async fillRuleById(ruleId) {
      if (!this.activeRule) return
      try {
        const res = await ruleDetail(ruleId)
        if (!res || res.code !== '000000' || !res.data) {
          this.$message.error(res?.message || '获取规则详情失败')
          return
        }
        const d = res.data
        const target = this.activeRule
        target.ruleId = d.id || d.ruleId || ruleId
        target.ruleCode = d.code || d.ruleCode || ''
        target.ruleName = d.name || d.ruleName || ''
        target.ruleDescription = d.description || d.ruleDescription || target.ruleDescription || ''
        target.javaCode = d.javaCode || target.javaCode || ''
        target.sqlCode = d.sqlCode || target.sqlCode || ''
        target.mappingType = d.mappingType || target.mappingType || ''
        target.groupId = d.groupId || target.groupId || null
        target.ruleProcessorId = d.processorId || d.ruleProcessorId || target.ruleProcessorId || null
        target.ruleLxType = d.ruleLxType || target.ruleLxType || null
        target.ruleType = d.ruleType != null ? d.ruleType : (target.ruleType != null ? target.ruleType : 1)

        // 参数配置：
        // 1) 优先使用 ruleDetail 返回的 fieldList/paramsConfig/params（有些规则会直接带）
        // 2) 如果为空但存在 processorId，则调用 processorDetail 获取 paramsConfig（通用/系统规则常用）
        const params = d.fieldList || d.paramsConfig || d.params || []
        if (Array.isArray(params) && params.length > 0) {
          target.fieldList = params.map(p => ({
            controlType: p.controlType != null ? p.controlType : 1,
            dataType: p.dataType != null ? p.dataType : 1,
            name: p.name,
            description: p.description || '',
            selectArray: Array.isArray(p.selectArray) ? p.selectArray : [],
            value: p.value != null ? String(p.value) : '',
            requires: !!p.requires
          }))
        } else {
          const pid = d.processorId || d.ruleProcessorId || null
          if (pid) {
            const pr = await processorDetail(pid)
            if (pr && pr.code === '000000' && pr.data) {
              const runtimeConfig = this.parseParamsConfig(pr.data.paramsConfig)
              // renameType/rename 映射到输出字段（仅在用户未填写时回填默认值）
              if (runtimeConfig) {
                if ((!target.renameType || String(target.renameType).trim() === '') && runtimeConfig.renameType) {
                  target.renameType = runtimeConfig.renameType
                }
                if ((!target.rename || String(target.rename).trim() === '') && runtimeConfig.rename) {
                  target.rename = runtimeConfig.rename
                }
              }
              target.fieldList = this.buildParamsFromProcessor(runtimeConfig, target.fieldList)
            } else {
              target.fieldList = []
            }
          } else {
            target.fieldList = []
          }
        }

        if (!target.renameType) target.renameType = 'String'
      } catch (e) {
        this.$message.error('获取规则详情失败')
      }
    },
    validateRule(rule) {
      if (!rule) return false
      if (this.isEmpty(rule.ruleId)) return false
      if (this.isEmpty(rule.rename)) return false
      if (this.isEmpty(rule.renameType)) return false
      const params = Array.isArray(rule.fieldList) ? rule.fieldList : []
      for (const p of params) {
        if (p.requires && this.isEmpty(p.value)) return false
      }
      return true
    },
    confirmRuleEditor() {
      // 点击“确定”= 仅前端保存配置，不关闭弹窗
      this.ruleEditor.validateAttempted = true

      const fields = Array.isArray(this.ruleEditor.fields) ? this.ruleEditor.fields : []
      for (const f of fields) {
        const fieldName = f && f.name ? String(f.name).trim() : ''
        if (!fieldName) {
          this.$message.warning('请选择清洗字段名称')
          return
        }
        const rules = Array.isArray(f.ruleList) ? f.ruleList : []
        for (const r of rules) {
          if (!this.validateRule(r)) {
            this.$message.warning('规则未选择/输出字段为空/必填参数未填，将无法保存')
            return
          }
        }
      }

      this.syncRuleEditorToForm()
      this.$message.success('规则配置已保存')
    },
    openRuleEditorAndSyncBack() {
      this.openRuleEditor()
    },
    syncRuleEditorToForm() {
      const list = Array.isArray(this.ruleEditor.fields) ? this.ruleEditor.fields : []
      const snapshot = JSON.parse(JSON.stringify(list))
      this.$set(this.formData, 'fieldList', snapshot)

      // 关键：确认后重建编辑态，避免出现 activeRule 引用失效导致输入无法继续编辑
      if (!this.ruleEditor.visible) return

      const prevField = list[this.ruleEditor.activeFieldIndex] || null
      const prevRule = prevField && Array.isArray(prevField.ruleList)
        ? (prevField.ruleList[this.ruleEditor.activeRuleIndex] || null)
        : null
      const prevFieldName = prevField ? prevField.name : ''
      const prevRuleKey = prevRule ? (prevRule.uuId || prevRule.ruleId || '') : ''

      this.ruleEditor.fields = JSON.parse(JSON.stringify(this.formData.fieldList || []))

      if (!this.ruleEditor.fields.length) {
        this.ruleEditor.activeFieldIndex = 0
        this.ruleEditor.activeRuleIndex = 0
        this.ruleEditor.rulePickerValue = null
        return
      }

      let nextFieldIndex = this.ruleEditor.fields.findIndex(f => f && f.name === prevFieldName)
      if (nextFieldIndex < 0) {
        nextFieldIndex = Math.min(this.ruleEditor.activeFieldIndex, this.ruleEditor.fields.length - 1)
      }
      this.ruleEditor.activeFieldIndex = Math.max(0, nextFieldIndex)

      const nextRules = Array.isArray(this.ruleEditor.fields[this.ruleEditor.activeFieldIndex].ruleList)
        ? this.ruleEditor.fields[this.ruleEditor.activeFieldIndex].ruleList
        : []

      let nextRuleIndex = nextRules.findIndex(r => (r.uuId || r.ruleId || '') === prevRuleKey)
      if (nextRuleIndex < 0) {
        nextRuleIndex = Math.min(this.ruleEditor.activeRuleIndex, Math.max(0, nextRules.length - 1))
      }
      this.ruleEditor.activeRuleIndex = Math.max(0, nextRuleIndex)
      this.ruleEditor.rulePickerValue = this.activeRule ? String(this.activeRule.ruleId || '') : null
    },
    handleSubmit() {
      if (!this.formData.name) {
        this.$message.warning('请输入节点名称')
        return
      }
      // 若弹窗仍开着，先将编辑态同步回表单
      if (this.ruleEditor.visible) {
        this.syncRuleEditorToForm()
      }
      // 校验：fieldList 中每条规则必填项
      const fields = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      for (const f of fields) {
        const rules = Array.isArray(f.ruleList) ? f.ruleList : []
        for (const r of rules) {
          if (!this.validateRule(r)) {
            this.$message.warning('存在未完整配置的清洗规则，请检查后再确认')
            return
          }
        }
      }
      // 必要字段对齐后端结构
      this.formData.fieldList = fields
      this.$emit('save')
    }
  }
}
</script>

<style scoped>
.clean-transform-config {
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
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
}

.form-item {
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
}

.form-label {
  width: 100px;
  font-weight: 400;
  color: #606266;
  margin-right: 12px;
  text-align: right;
  flex-shrink: 0;
  font-size: 14px;
  padding-top: 8px;
}

.form-label.required::before {
  content: '*';
  color: #F56C6C;
  margin-right: 4px;
}

.form-input {
  flex: 1;
  padding: 0 15px;
  height: 40px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  color: #606266;
  background: #FFF;
  transition: border-color 0.2s;
}

.form-input:hover {
  border-color: #C0C4CC;
}

.form-input:focus {
  border-color: #409EFF;
  outline: none;
}

.form-textarea {
  flex: 1;
  padding: 8px 15px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  color: #606266;
  background: #FFF;
  transition: border-color 0.2s;
  resize: none;
}

.form-textarea:hover {
  border-color: #C0C4CC;
}

.form-textarea:focus {
  border-color: #409EFF;
  outline: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #EBEEF5;
  margin-top: 16px;
  margin-bottom: 10px;
  cursor: pointer;
  user-select: none;
}

.section-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.section-toggle {
  cursor: pointer;
  color: #909399;
  font-size: 12px;
}

.section-content {
  padding: 8px 0 0;
}

/* 清洗字段摘要表：控制高度、避免抽屉内出现多余横向滚动条 */
.clean-fields-summary-wrap {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.clean-fields-summary-table ::v-deep .el-table__body-wrapper,
.clean-fields-summary-table ::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
}

.clean-fields-summary-table ::v-deep table {
  width: 100% !important;
}

.clean-fields-summary-table ::v-deep .el-table__body td .cell,
.clean-fields-summary-table ::v-deep .el-table__header th .cell {
  word-break: break-word;
}

.field-actions {
  display: flex;
  justify-content: center;
  padding: 12px 0 0;
}

.btn {
  padding: 0 20px;
  height: 36px;
  line-height: 36px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: #FFF;
  color: #606266;
  transition: all 0.2s;
}

.dash-btn {
  width: 100%;
  max-width: 520px;
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
  transition: all 0.2s;
}

.dash-btn:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.primary-btn {
  background: #409EFF;
  color: #FFF;
  border-color: #409EFF;
}

.primary-btn:hover {
  background: #66B1FF;
  border-color: #66B1FF;
}

.secondary-btn:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #EBEEF5;
}

.empty-text {
  color: #909399;
  font-size: 12px;
}

.rule-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.rule-tag {
  border-radius: 4px;
}

.required-dot {
  color: #F56C6C;
  margin-right: 6px;
}

.advanced-card {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 14px 14px 2px;
  background: #FFF;
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

/* 高级配置区块强制对齐 Debezium 间距 */
.advanced-layout {
  margin-top: 0 !important;
}

.advanced-layout .section-header {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  border-bottom: none !important;
  padding: 10px 0 !important;
}

.advanced-layout .section-content {
  padding-top: 8px;
  margin-bottom: 8px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #F0F2F5;
  border-radius: 50%;
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.is-invalid /deep/ .el-input__inner {
  border-color: #F56C6C !important;
}
</style>

<style>

/* 让弹窗遮罩层级最高 */
.clean-rule-editor-dialog .el-dialog__wrapper {
  z-index: 99998 !important;
}

/* 解决弹窗内下拉被遮挡：提升字段下拉 z-index（仅影响该 popper-class） */
.clean-field-select-popper {
  z-index: 30000 !important;
}

/* 确保规则选择面板压过抽屉与所有遮罩层 */
.clean-rule-cascader-popper {
  z-index: 31000 !important; /* 比弹窗高一点 */
}

.clean-rule-editor-dialog {
  border-radius: 10px;
  overflow: hidden;
  z-index: 99999 !important;
}

/* 下拉面板再高一级 */
.clean-field-select-popper,
.clean-rule-cascader-popper {
  z-index: 100000 !important;
}

.clean-rule-editor-dialog .el-dialog__header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid #EBEEF5;
  background: linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 100%);
}

.clean-rule-editor-dialog .el-dialog__body {
  padding: 14px 16px 10px;
}

.dlg-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dlg-title-text {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  letter-spacing: 0.2px;
}

.dlg-title-sub {
  font-size: 12px;
  color: #909399;
}

.dlg-body {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 14px;
  min-height: 520px;
}

.dlg-left {
  display: flex;
  flex-direction: column;
}

.dlg-right {
  border-left: 1px solid #EBEEF5;
  padding-left: 14px;
  min-width: 0;
}

.left-block {
  border: 1px solid #EBEEF5;
  border-radius: 10px;
  background: #FFFFFF;
  overflow: hidden;
}

.block-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #F7F9FC;
  border-bottom: 1px solid #EBEEF5;
}

.block-hd-title {
  font-weight: 700;
  color: #303133;
  font-size: 13px;
}

.req-dot {
  color: #F56C6C;
  margin-right: 6px;
}

.block-bd {
  padding: 12px;
}

.field-add-row {
  display: grid;
  grid-template-columns: 1fr 78px;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.field-select {
  width: 100%;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 230px;
  overflow: auto;
  padding-right: 4px;
}

.field-row {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 10px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #FFFFFF;
}

.field-row:hover {
  border-color: #C6E2FF;
  background: #F5FAFF;
}

.field-row.active {
  border-color: #409EFF;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
  background: #F5FAFF;
}

.field-row-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.field-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FFB020;
  box-shadow: 0 0 0 3px rgba(255, 176, 32, 0.18);
}

.field-name {
  font-weight: 700;
  color: #303133;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.field-row-actions,
.rule-row-actions {
  display: inline-flex;
  gap: 8px;
  color: #909399;
  flex-shrink: 0;
}

.action-icon {
  font-size: 14px;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.action-icon:hover {
  background: #F2F6FC;
  color: #409EFF;
}

.action-icon.danger:hover {
  color: #F56C6C;
}

.left-empty {
  color: #909399;
  font-size: 12px;
  padding: 10px 4px;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 230px;
  overflow: auto;
  padding-right: 4px;
}

.rule-row {
  border: 1px solid #EBEEF5;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #FFFFFF;
}

.rule-row:hover {
  border-color: #C6E2FF;
  background: #F5FAFF;
}

.rule-row.active {
  border-color: #409EFF;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
  background: #F5FAFF;
}

.rule-row-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-row-title {
  font-weight: 700;
  color: #303133;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 230px;
}

.rule-row-sub {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 230px;
}

.right-empty {
  height: 100%;
  min-height: 520px;
  border: 1px dashed #DCDFe6;
  border-radius: 12px;
  background: linear-gradient(180deg, #FFFFFF 0%, #FAFBFF 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.right-empty-title {
  font-size: 16px;
  font-weight: 800;
  color: #303133;
  margin-bottom: 6px;
}

.right-empty-sub {
  font-size: 12px;
  color: #909399;
  max-width: 420px;
}

.right-form {
  padding-right: 2px;
}

.right-section {
  border: 1px solid #EBEEF5;
  border-radius: 12px;
  padding: 12px 12px 4px;
  margin-bottom: 12px;
  background: #FFFFFF;
}

.right-section-title {
  font-weight: 800;
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.row-between {
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.req-badge {
  color: #F56C6C;
  font-weight: 700;
}

.param-empty {
  color: #909399;
  font-size: 12px;
  padding: 8px 2px 0;
}

.dlg-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 2px;
}

.footer-hint {
  color: #909399;
  font-size: 12px;
}

/* 规则描述只读展示 */
.readonly-textarea .el-textarea__inner {
  background: #F5F7FA;
  color: #606266;
  cursor: default;
}

</style>
