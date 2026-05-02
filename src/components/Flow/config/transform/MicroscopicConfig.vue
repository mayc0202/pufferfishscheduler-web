<template>
  <div class="microscopic-config">
    <div class="config-content">
      <FlowConfigHero
        badge="微观"
        title="微观计算"
        description="按公式解析参数并映射流字段，计算生成新字段。"
        tone="teal"
        icon="el-icon-view"
      />

      <el-tabs v-model="activeTab" class="config-tabs microscopic-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <div v-show="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">节点名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="微观计算">
        </div>

        <div class="form-item">
          <label class="form-label">节点说明：</label>
          <textarea
            v-model="formData.description"
            class="form-textarea"
            rows="3"
            placeholder="请输入节点说明"
          />
        </div>

        <div class="section-header" @click="sectionOpen.list = !sectionOpen.list">
          <h4>微观计算配置列表</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.list ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.list" class="section-content">
          <div class="field-table-wrap microscopic-summary-wrap">
            <el-table
              :data="formData.formulaList"
              border
              class="microscopic-summary-table microscopic-list-table"
              style="width: 100%"
              max-height="260"
              empty-text="暂无配置，请点击下方「编辑微观计算配置」添加公式"
            >
              <el-table-column type="index" label="#" width="52" align="center" />
              <el-table-column label="公式名称" min-width="160" show-overflow-tooltip>
                <template slot-scope="scope">
                  {{ scope.row.formulaName || '—' }}
                </template>
              </el-table-column>
              <el-table-column label="输出字段名" min-width="120" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span v-if="scope.row.outputFieldName">{{ scope.row.outputFieldName }}</span>
                  <span v-else class="empty-text">未填写</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="field-actions">
            <button type="button" class="dash-btn microscopic-dash-btn" @click="openMappingEditor">
              <i class="el-icon-edit" /> 编辑微观计算配置
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
            <label class="form-label">
              并发数量：
              <el-tooltip content="步骤多副本并行时的副本数量。" placement="top">
                <i class="el-icon-question help-i" />
              </el-tooltip>
            </label>
            <input v-model.number="formData.copiesCache" type="number" min="1" class="form-input" placeholder="1">
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
          <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
        </div>
      </div>
    </div>

    <el-dialog
      v-dialog-drag
      :visible.sync="mappingEditor.visible"
      width="1200px"
      top="6vh"
      append-to-body
      modal-append-to-body
      :z-index="200000"
      :modal-z-index="199999"
      custom-class="microscopic-editor-dialog"
      :close-on-click-modal="false"
      @open="onMappingEditorOpen"
    >
      <div slot="title" class="dlg-title">
        <span class="dlg-title-text">编辑微观计算配置</span>
        <span class="dlg-title-sub">左侧管理公式条目，右侧配置返回类型、输出字段、公式及参数字段映射；确定后写回列表。</span>
      </div>

      <div class="mic-dlg-body">
        <div class="mic-dlg-left">
          <div class="mic-left-block">
            <div class="mic-block-hd">
              <div class="mic-block-hd-title">微观计算公式</div>
              <el-button type="primary" size="small" icon="el-icon-plus" @click="addEditorFormula">添加</el-button>
            </div>
            <div class="mic-block-bd">
              <div class="mic-field-list">
                <div
                  v-for="item in mappingEditor.formulaList"
                  :key="item.uuId"
                  class="mic-field-row"
                  :class="{ active: isEditorItemActive(item) }"
                  @click="setActiveEditorByUuid(item.uuId)"
                >
                  <div v-if="isEditorItemActive(item)" class="mic-field-row-active-wrap">
                    <el-select
                      v-model="item.formulaId"
                      filterable
                      placeholder="选择微观计算公式"
                      size="small"
                      style="width: 100%; margin-bottom: 8px;"
                      popper-class="microscopic-field-select-popper"
                      @change="(val) => handleFormulaSelect(item, val)"
                    >
                      <el-option
                        v-for="f in availableFormulas"
                        :key="f.id || f.formulaId"
                        :label="f.name || f.formulaName"
                        :value="f.id || f.formulaId"
                      />
                    </el-select>
                    <div class="mic-field-row-active-bottom">
                      <div class="mic-field-row-main" style="flex: 1; min-width: 0;">
                        <span class="mic-field-dot" />
                        <div class="mic-field-title">{{ item.formulaName || '未选择公式' }}</div>
                      </div>
                      <div class="mic-field-row-actions">
                        <i class="el-icon-close mic-action-icon danger" @click.stop="removeEditorFormula(item.uuId)" />
                      </div>
                    </div>
                  </div>
                  <div v-else class="mic-field-row-inactive-wrap">
                    <div class="mic-field-row-main" style="flex: 1; min-width: 0;">
                      <span class="mic-field-dot" />
                      <div class="mic-field-title">{{ item.formulaName || '未选择公式' }}</div>
                    </div>
                    <div class="mic-field-row-actions">
                      <i class="el-icon-close mic-action-icon danger" @click.stop="removeEditorFormula(item.uuId)" />
                    </div>
                  </div>
                </div>
                <div v-if="!mappingEditor.formulaList.length" class="mic-left-empty">
                  暂无公式，请点击右上角「添加」。
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mic-dlg-right">
          <div v-if="!activeEditorItem" class="mic-right-empty">
            <div class="mic-right-empty-title">请选择公式</div>
            <div class="mic-right-empty-sub">在左侧添加并选中一条公式后，在此配置输出字段、表达式与流字段映射。</div>
          </div>

          <div v-else class="mic-right-form">
            <div class="mic-right-section">
              <div class="mic-right-section-title"><span class="mic-req-dot">*</span>输出与返回</div>
              <el-form :model="activeEditorItem" label-width="110px" size="small" label-position="right">
                <el-form-item label="输出字段名称" required>
                  <el-input v-model="activeEditorItem.outputFieldName" placeholder="请输入本公式计算结果的输出字段名" />
                </el-form-item>
                <el-form-item label="返回类型" required>
                  <el-input
                    :value="getDataTypeLabel(activeEditorItem.returnType)"
                    readonly
                    disabled
                    placeholder="选择公式后由详情自动带出"
                    class="mic-readonly-dict"
                  />
                </el-form-item>
                <el-form-item label="公式描述">
                  <el-input v-model="activeEditorItem.description" type="textarea" :rows="3" readonly disabled placeholder="自动获取" />
                </el-form-item>
              </el-form>
            </div>

            <div class="mic-right-section">
              <div class="mic-right-section-title">参数字段映射</div>
              <el-table
                :data="activeEditorItem.parameterMapping"
                border
                max-height="320"
                class="mic-map-table"
                empty-text="暂无参数，请先选择公式"
              >
                <el-table-column type="index" label="#" width="48" align="center" />
                <el-table-column prop="paramName" label="参数名称" min-width="100" show-overflow-tooltip />
                <el-table-column label="参数类型" width="120">
                  <template slot-scope="scope">
                    <span>{{ getDataTypeLabel(scope.row.paramType) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="流中字段" min-width="200">
                  <template slot-scope="scope">
                    <el-select
                      v-model="scope.row.streamField"
                      size="small"
                      filterable
                      placeholder="请选择流中字段"
                      class="w-full"
                      popper-class="microscopic-field-select-popper"
                    >
                      <el-option
                        v-for="field in getFilteredStreamFields(scope.row.paramType)"
                        :key="field.name"
                        :label="field.name"
                        :value="field.name"
                      >
                        <span :class="{ 'mic-highlight-match': field.name === scope.row.paramName }">
                          {{ field.name }}
                          <span v-if="field.typeLabel" class="mic-type-hint">({{ field.typeLabel }})</span>
                        </span>
                      </el-option>
                    </el-select>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="mappingEditor.visible = false">取消</el-button>
        <el-button type="primary" :loading="streamFieldsLoading" @click="confirmMappingEditor">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import FlowConfigHero from '../common/FlowConfigHero.vue'
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import { list as formulaListApi, detail as formulaDetailApi } from '@/api/collect/formula/formula'
import { getDict } from '@/api/dict/dict'
import dictCode from '@/api/dict/dictCode'

function clone(v) {
  try {
    return JSON.parse(JSON.stringify(v))
  } catch (e) {
    return v
  }
}

function genUuid() {
  return 'mic-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9)
}

function emptyFormulaItem() {
  return {
    uuId: genUuid(),
    formulaId: null,
    formulaName: '',
    description: '',
    returnType: '',
    outputFieldType: '',
    outputFieldName: '',
    formula: '',
    parameterMapping: []
  }
}

function normalizeParamMappingItem(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const valueLengthRaw = src.valueLength != null ? src.valueLength : src.length
  const valuePrecisionRaw = src.valuePrecision != null ? src.valuePrecision : src.precision
  return {
    ...src,
    paramName: src.paramName || src.name || '',
    paramType: src.paramType || src.type || 'String',
    streamField: src.streamField != null ? String(src.streamField) : '',
    dateFormat: src.dateFormat != null ? String(src.dateFormat) : '',
    numberFormat: src.numberFormat != null ? String(src.numberFormat) : '',
    valueLength:
      valueLengthRaw === '' || valueLengthRaw == null || Number.isNaN(Number(valueLengthRaw))
        ? undefined
        : Math.trunc(Number(valueLengthRaw)),
    valuePrecision:
      valuePrecisionRaw === '' || valuePrecisionRaw == null || Number.isNaN(Number(valuePrecisionRaw))
        ? undefined
        : Math.trunc(Number(valuePrecisionRaw))
  }
}

function parsePossibleJson(value) {
  if (typeof value !== 'string') return value
  const text = value.trim()
  if (!text) return value
  const first = text[0]
  if (first !== '[' && first !== '{') return value
  try {
    return JSON.parse(text)
  } catch (e) {
    return value
  }
}

function normalizeFormulaItem(raw) {
  if (!raw || typeof raw !== 'object') return emptyFormulaItem()
  const formula = raw.formula != null ? String(raw.formula) : ''
  const pmRaw = Array.isArray(raw.parameterMapping) ? raw.parameterMapping : []
  const pm = pmRaw.map(normalizeParamMappingItem)
  const rt =
    raw.returnType != null && String(raw.returnType).trim() !== ''
      ? String(raw.returnType)
      : raw.outputFieldType != null && String(raw.outputFieldType).trim() !== ''
        ? String(raw.outputFieldType)
        : 'String'
  return {
    uuId: raw.uuId || genUuid(),
    formulaId: raw.formulaId || null,
    formulaName: raw.formulaName || '',
    description: raw.description || '',
    returnType: rt,
    outputFieldType: raw.outputFieldType != null ? String(raw.outputFieldType) : rt,
    outputFieldName: raw.outputFieldName != null ? String(raw.outputFieldName) : '',
    formula,
    parameterMapping: pm
  }
}

/** 根级遗留字段（与 formulaList[] 重复），不落库、仅迁移时读取 */
const MICROSCOPIC_LEGACY_ROOT_KEYS = [
  'formula',
  'returnType',
  'outputFieldName',
  'outputFieldType',
  'parameterMapping',
  'formulaId',
  'formulaName'
]

export default {
  name: 'MicroscopicConfig',
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
        list: true,
        distribution: false,
        parallel: false
      },
      streamFields: [],
      streamFieldsLoading: false,
      availableFormulas: [],
      availableFormulasLoading: false,
      mappingEditor: {
        visible: false,
        formulaList: [],
        activeIndex: 0
      },
      dataTypeOptions: []
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
    activeEditorItem() {
      const list = this.mappingEditor.formulaList
      const i = this.mappingEditor.activeIndex
      if (!Array.isArray(list) || !list.length || i == null || i < 0 || i >= list.length) return null
      return list[i]
    }
  },
  mounted() {
    this.initDefaults()
    this.stripMicroscopicLegacyFlatFields()
    this.fetchStreamFields()
    this.fetchAvailableFormulas()
    this.queryDataTypeDict()
  },
  methods: {
    async queryDataTypeDict() {
      try {
        const res = await getDict(dictCode.DATA_TYPE)
        const items = Array.isArray(res && res.data) ? res.data : []
        this.dataTypeOptions = items
          .map(item => {
            const labelRaw = item && (item.name ?? item.label ?? item.value ?? item.code)
            const valueRaw = item && (item.code ?? item.id ?? item.value)
            if (valueRaw == null || labelRaw == null) return null
            return { value: String(valueRaw), label: String(labelRaw) }
          })
          .filter(Boolean)
      } catch (e) {
        this.dataTypeOptions = []
      }
    },
    formulaSnippet(f) {
      const s = f != null ? String(f).trim() : ''
      if (!s) return '—'
      return s.length > 48 ? s.slice(0, 48) + '…' : s
    },
    isEditorItemActive(item) {
      const cur = this.activeEditorItem
      return !!(cur && item && cur.uuId === item.uuId)
    },
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', '微观计算')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (!this.formData.code) this.$set(this.formData, 'code', 'Microscopic')
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)

      if (!Array.isArray(this.formData.formulaList)) {
        const legacyFormula = this.formData.formula != null ? String(this.formData.formula).trim() : ''
        if (legacyFormula || (Array.isArray(this.formData.parameterMapping) && this.formData.parameterMapping.length)) {
          this.$set(this.formData, 'formulaList', [
            normalizeFormulaItem({
              uuId: genUuid(),
              formulaId: this.formData.formulaId || null,
              formulaName: this.formData.formulaName || '',
              description: this.formData.description || '',
              outputFieldType: this.formData.outputFieldType || this.formData.returnType || 'String',
              outputFieldName: this.formData.outputFieldName != null ? String(this.formData.outputFieldName) : '',
              formula: this.formData.formula || '',
              parameterMapping: this.formData.parameterMapping
            })
          ])
        } else {
          this.$set(this.formData, 'formulaList', [])
        }
      } else {
        const normalized = this.formData.formulaList.map(normalizeFormulaItem)
        this.$set(this.formData, 'formulaList', normalized)
      }
    },
    /** 去掉根级与 formulaList 重复的遗留字段，仅以 formulaList 为权威配置 */
    stripMicroscopicLegacyFlatFields() {
      const fd = this.formData
      if (!fd || typeof fd !== 'object') return
      MICROSCOPIC_LEGACY_ROOT_KEYS.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(fd, k)) {
          this.$delete(fd, k)
        }
      })
    },
    buildFlowConfigWithCurrentNode() {
      const base = this.flowConfig ? clone(this.flowConfig) : { cells: [] }
      if (!base.cells || !Array.isArray(base.cells)) base.cells = []
      if (!this.currentNodeId) return base
      const idx = base.cells.findIndex((c) => String(c.id) === String(this.currentNodeId))
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
    async fetchAvailableFormulas() {
      this.availableFormulasLoading = true
      try {
        const res = await formulaListApi(null, '', 1, 1000)
        if (res && res.code === '000000' && res.data && Array.isArray(res.data.records)) {
          this.availableFormulas = res.data.records
        }
      } catch (e) {
        console.error('Failed to fetch formulas', e)
      } finally {
        this.availableFormulasLoading = false
      }
    },
    async fetchStreamFields() {
      if (!this.flowId) return
      this.streamFieldsLoading = true
      try {
        const mergedFlowConfig = this.buildFlowConfigWithCurrentNode()
        const res = await getFlowFieldStream({
          flowId: this.flowId,
          config: JSON.stringify(mergedFlowConfig),
          stepName: String(this.formData.name || '').trim() || '微观计算',
          code: this.formData.code || 'Microscopic'
        })
        const rows = []
        const dataRaw = res && res.code === '000000' ? parsePossibleJson(res.data) : null
        if (Array.isArray(dataRaw)) {
          dataRaw.forEach((x) => {
            const name =
              typeof x === 'string' ? String(x).trim() : (x.name || x.fieldName || x.fieldStream || x.field)
            const hasType = x && typeof x === 'object' && (x.type != null || x.valueType != null)
            const type = hasType ? (x.type != null ? x.type : x.valueType) : null
            if (name) rows.push({ name: String(name).trim(), type, typeLabel: hasType ? this.getTypeLabel(type) : '' })
          })
        } else if (dataRaw && Array.isArray(dataRaw.fieldList)) {
          dataRaw.fieldList.forEach((x) => {
            const name = x && typeof x === 'object' ? x.name || x.fieldName || x.fieldStream || x.field : ''
            const hasType = x && typeof x === 'object' && (x.type != null || x.valueType != null)
            const type = hasType ? (x.type != null ? x.type : x.valueType) : null
            if (name) rows.push({ name: String(name).trim(), type, typeLabel: hasType ? this.getTypeLabel(type) : '' })
          })
        }
        this.streamFields = rows
      } catch (e) {
        this.streamFields = []
      } finally {
        this.streamFieldsLoading = false
      }
    },
    /**
     * 数据类型字典展示：兼容字典 value（code）、接口返回的英文名、以及「中文 (English)」整段 label
     */
    getDataTypeLabel(val) {
      if (val === null || val === undefined || val === '') return '—'
      const s = String(val).trim()
      const opts = this.dataTypeOptions || []
      if (!opts.length) return s
      let opt = opts.find((o) => String(o.value) === s)
      if (opt) return opt.label
      opt = opts.find((o) => String(o.label).trim() === s)
      if (opt) return opt.label
      opt = opts.find((o) => {
        const m = String(o.label).match(/\(([^)]+)\)\s*$/)
        const en = m ? m[1].trim() : ''
        return en && en.toLowerCase() === s.toLowerCase()
      })
      if (opt) return opt.label
      opt = opts.find((o) => String(o.label).toLowerCase().includes(s.toLowerCase()))
      return opt ? opt.label : s
    },
    /** 将接口/字典中的类型转为与流字段 typeLabel 匹配的英文关键字（用于过滤） */
    normalizeParamTypeForStream(paramTypeRaw) {
      const label = this.getDataTypeLabel(paramTypeRaw)
      if (!label || label === '—') return String(paramTypeRaw || '').trim()
      const m = String(label).match(/\(([^)]+)\)\s*$/)
      if (m) return m[1].trim()
      return String(paramTypeRaw || '').trim()
    },
    getTypeLabel(typeCode) {
      const n = Math.trunc(Number(typeCode))
      const map = {
        1: 'Number',
        2: 'String',
        3: 'Date',
        4: 'Boolean',
        5: 'Integer',
        6: 'BigNumber',
        8: 'Binary',
        9: 'Timestamp'
      }
      return map[n] || 'String'
    },
    getFilteredStreamFields(paramType) {
      const key = this.normalizeParamTypeForStream(paramType)
      if (!key) return this.streamFields
      const hasTypedField = this.streamFields.some((f) => !!String(f.typeLabel || '').trim())
      if (!hasTypedField) return this.streamFields
      const typeMap = {
        Integer: ['Integer', 'Number'],
        String: ['String'],
        Date: ['Date', 'Timestamp'],
        Boolean: ['Boolean'],
        Decimal: ['Decimal', 'Number', 'BigNumber']
      }
      const allowedTypes = typeMap[key] || [key]
      return this.streamFields.filter((f) => !f.typeLabel || allowedTypes.includes(f.typeLabel))
    },
    async handleFormulaSelect(item, formulaId) {
      if (!formulaId) return
      try {
        const res = await formulaDetailApi(formulaId)
        if (res && res.code === '000000' && res.data) {
          const detail = res.data
          const currentMapping = Array.isArray(item.parameterMapping) ? item.parameterMapping : []
          const currentMappingByParamName = currentMapping.reduce((acc, cur) => {
            const k = String(cur && cur.paramName ? cur.paramName : '').trim()
            if (k) acc[k] = cur
            return acc
          }, {})
          const fName = detail.formulaName || detail.name || ''
          this.$set(item, 'formulaId', formulaId)
          this.$set(item, 'formulaName', fName)
          this.$set(item, 'description', detail.description || '')
          const rt =
            detail.returnType != null && String(detail.returnType).trim() !== ''
              ? String(detail.returnType).trim()
              : 'String'
          this.$set(item, 'returnType', rt)
          this.$set(item, 'outputFieldType', rt)
          this.$set(item, 'formula', detail.expression || '')

          let params = []
          const list = Array.isArray(detail.paramList) ? detail.paramList : (Array.isArray(detail.parameters) ? detail.parameters : [])
          if (list.length > 0) {
            params = list.map((p) => {
              const paramName = p.paramName || p.name || ''
              const old = currentMappingByParamName[String(paramName).trim()] || {}
              return normalizeParamMappingItem({
                ...old,
                ...p,
                paramName,
                paramType: p.paramType || p.type || 'String',
                streamField: old.streamField != null ? old.streamField : ''
              })
            })
          } else {
            // fallback parsing
            const text = item.formula || ''
            const regex = /\b[a-zA-Z_]\w*\b(?!\s*[\.\(])/g
            const matches = text.match(regex) || []
            const keywords = new Set(['true', 'false', 'null', 'undefined', 'and', 'or', 'not'])
            const variables = [...new Set(matches)].filter((v) => !keywords.has(v.toLowerCase()))
            params = variables.map((paramName) => {
              const old = currentMappingByParamName[String(paramName).trim()] || {}
              return normalizeParamMappingItem({
                ...old,
                paramName,
                paramType: 'String',
                streamField: old.streamField != null ? old.streamField : ''
              })
            })
          }
          this.$set(item, 'parameterMapping', params)
        }
      } catch (e) {
        console.error('Failed to fetch formula detail', e)
      }
    },
    buildParamMappingPayload(paramRaw) {
      const p = normalizeParamMappingItem(paramRaw)
      const payload = {
        paramName: p.paramName,
        paramType: p.paramType,
        streamField: p.streamField
      }
      if (p.dateFormat) payload.dateFormat = p.dateFormat
      if (p.numberFormat) payload.numberFormat = p.numberFormat
      if (p.valueLength != null) payload.valueLength = p.valueLength
      if (p.valuePrecision != null) payload.valuePrecision = p.valuePrecision
      return payload
    },
    buildFormulaItemPayload(formulaRaw) {
      const item = normalizeFormulaItem(formulaRaw)
      return {
        ...item,
        parameterMapping: (item.parameterMapping || []).map((p) => this.buildParamMappingPayload(p))
      }
    },
    openMappingEditor() {
      this.mappingEditor.visible = true
    },
    onMappingEditorOpen() {
      const src = Array.isArray(this.formData.formulaList) ? this.formData.formulaList : []
      this.mappingEditor.formulaList = src.length ? src.map((x) => normalizeFormulaItem(clone(x))) : []
      this.mappingEditor.activeIndex = this.mappingEditor.formulaList.length ? 0 : -1
      this.fetchStreamFields()
      if (!this.availableFormulas.length) {
        this.fetchAvailableFormulas()
      }
    },
    addEditorFormula() {
      const row = emptyFormulaItem()
      this.mappingEditor.formulaList.push(row)
      this.mappingEditor.activeIndex = this.mappingEditor.formulaList.length - 1
    },
    setActiveEditorByUuid(uuid) {
      const i = this.mappingEditor.formulaList.findIndex((x) => x.uuId === uuid)
      if (i >= 0) this.mappingEditor.activeIndex = i
    },
    editorIndexByUuid(uuid) {
      return this.mappingEditor.formulaList.findIndex((x) => x.uuId === uuid)
    },
    removeEditorFormula(uuid) {
      const i = this.editorIndexByUuid(uuid)
      if (i < 0) return
      this.mappingEditor.formulaList.splice(i, 1)
      if (!this.mappingEditor.formulaList.length) {
        this.mappingEditor.activeIndex = -1
      } else if (this.mappingEditor.activeIndex >= this.mappingEditor.formulaList.length) {
        this.mappingEditor.activeIndex = this.mappingEditor.formulaList.length - 1
      }
    },
    confirmMappingEditor() {
      const list = this.mappingEditor.formulaList || []
      if (!list.length) {
        this.$message.warning('请至少添加一条微观计算公式')
        return
      }
      for (let fi = 0; fi < list.length; fi++) {
        const it = normalizeFormulaItem(list[fi])
        if (!it.formulaId) {
          this.$message.warning(`第 ${fi + 1} 条：请选择微观计算公式`)
          this.setActiveEditorByUuid(it.uuId)
          return
        }
        if (!String(it.outputFieldName || '').trim()) {
          this.$message.warning(`第 ${fi + 1} 条公式：请填写输出字段名`)
          this.setActiveEditorByUuid(it.uuId)
          return
        }
        const mapping = it.parameterMapping || []
        for (let pi = 0; pi < mapping.length; pi++) {
          if (!String(mapping[pi].streamField || '').trim()) {
            this.$message.warning(`公式「${it.formulaName || '未命名'}」：请为参数「${mapping[pi].paramName}」选择流中字段映射`)
            this.setActiveEditorByUuid(it.uuId)
            return
          }
        }
        this.$set(list, fi, it)
      }
      this.$set(this.formData, 'formulaList', clone(list))
      this.stripMicroscopicLegacyFlatFields()
      this.mappingEditor.visible = false
    },
    handleSubmit() {
      const name = String(this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写节点名称')
        return
      }
      const list = Array.isArray(this.formData.formulaList) ? this.formData.formulaList : []
      if (!list.length) {
        this.$message.warning('请至少配置一条微观计算公式（点击「编辑微观计算配置」）')
        return
      }
      for (let fi = 0; fi < list.length; fi++) {
        const it = list[fi]
        if (!String(it.outputFieldName || '').trim()) {
          this.$message.warning(`第 ${fi + 1} 条公式未填写输出字段名，请点击「编辑微观计算配置」`)
          return
        }
        const mapping = it.parameterMapping || []
        for (let pi = 0; pi < mapping.length; pi++) {
          if (!String(mapping[pi].streamField || '').trim()) {
            this.$message.warning(`「${it.outputFieldName || '公式'}」：请为参数「${mapping[pi].paramName}」完成流中字段映射`)
            return
          }
        }
      }
      const copies =
        this.formData.copiesCache != null && this.formData.copiesCache !== ''
          ? Math.max(1, Math.trunc(Number(this.formData.copiesCache)))
          : 1
      this.$set(this.formData, 'copiesCache', copies)
      this.$set(this.formData, 'distributeType', !!this.formData.distributeType)
      this.stripMicroscopicLegacyFlatFields()
      const payload = {
        ...this.formData,
        code: this.formData.code || 'Microscopic',
        formulaList: list.map((it) => this.buildFormulaItemPayload(it))
      }
      this.$emit('save', payload)
    }
  }
}
</script>

<style scoped>
.microscopic-config {
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

.microscopic-tabs ::v-deep .el-tabs__item.is-active {
  color: #1677ff;
}

.microscopic-tabs ::v-deep .el-tabs__active-bar {
  background-color: #1677ff;
  height: 3px;
}

.microscopic-tabs ::v-deep .el-tabs__item:hover {
  color: #1677ff;
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
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  color: #303133;
  background: #fff;
  transition: border-color 0.2s;
}

.form-input:hover {
  border-color: #c0c4cc;
}

.form-input:focus {
  border-color: #1677ff;
  outline: none;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  color: #303133;
  background: #fff;
  transition: border-color 0.2s;
}

.form-textarea:hover {
  border-color: #c0c4cc;
}

.form-textarea:focus {
  border-color: #1677ff;
  outline: none;
}

.w-full {
  width: 100%;
}

.help-i {
  color: #909399;
  margin-left: 4px;
  cursor: default;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
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

.microscopic-summary-wrap {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.microscopic-list-table ::v-deep .el-table__header th {
  background: #f5f7fa !important;
  color: #303133;
}

.microscopic-summary-table ::v-deep .el-table__body-wrapper,
.microscopic-summary-table ::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
}

.microscopic-summary-table ::v-deep table {
  width: 100% !important;
}

.microscopic-summary-table ::v-deep .el-table__body td .cell,
.microscopic-summary-table ::v-deep .el-table__header th .cell {
  word-break: break-word;
}

.empty-text {
  color: #909399;
  font-size: 12px;
}

.field-actions {
  display: flex;
  justify-content: center;
  padding: 12px 0 0;
}

.microscopic-dash-btn {
  width: 100%;
  max-width: none;
  height: 40px;
  border: 1px dashed #1677ff;
  background: #f0f9ff;
  color: #1677ff;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  font-size: 14px;
}

.microscopic-dash-btn:hover {
  border-color: #1677ff;
  background: #e6f7ff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.btn {
  padding: 0 20px;
  height: 36px;
  line-height: 36px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: #fff;
  color: #606266;
  transition: all 0.2s;
}

.primary-btn {
  background: #1677ff;
  color: #fff;
  border-color: #1677ff;
}

.primary-btn:hover {
  background: #4096ff;
  border-color: #4096ff;
}

.secondary-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.advanced-layout {
  padding-top: 4px;
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
</style>

<style>
.microscopic-editor-dialog .el-dialog__wrapper {
  z-index: 99998 !important;
}

.microscopic-field-select-popper {
  z-index: 31000 !important;
}

.microscopic-editor-dialog {
  border-radius: 10px;
  overflow: hidden;
  z-index: 99999 !important;
}

.microscopic-editor-dialog .el-dialog__header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(180deg, #f8faff 0%, #ffffff 100%);
}

.microscopic-editor-dialog .el-dialog__body {
  padding: 14px 16px 10px;
}

.microscopic-editor-dialog .dlg-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.microscopic-editor-dialog .dlg-title-text {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  letter-spacing: 0.2px;
}

.microscopic-editor-dialog .dlg-title-sub {
  font-size: 12px;
  color: #909399;
}

.microscopic-editor-dialog .mic-dlg-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  min-height: 520px;
}

.microscopic-editor-dialog .mic-dlg-left {
  display: flex;
  flex-direction: column;
}

.microscopic-editor-dialog .mic-dlg-right {
  min-width: 0;
}

.microscopic-editor-dialog .mic-left-block {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.microscopic-editor-dialog .mic-block-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.microscopic-editor-dialog .mic-block-hd-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.microscopic-editor-dialog .mic-block-bd {
  padding: 16px;
}

.microscopic-editor-dialog .mic-field-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 440px;
  overflow: auto;
}

.microscopic-editor-dialog .mic-field-row {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
}

.microscopic-editor-dialog .mic-field-row:hover {
  border-color: #c6e2ff;
}

.microscopic-editor-dialog .mic-field-row.active {
  border-color: #1677ff;
  background: #e6f7ff;
}

.microscopic-editor-dialog .mic-field-row-active-wrap {
  display: flex;
  flex-direction: column;
}

.microscopic-editor-dialog .mic-field-row-active-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.microscopic-editor-dialog .mic-field-row-inactive-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.microscopic-editor-dialog .mic-field-row-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.microscopic-editor-dialog .mic-field-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffb020;
  flex-shrink: 0;
}

.microscopic-editor-dialog .mic-field-text {
  min-width: 0;
}

.microscopic-editor-dialog .mic-field-title {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.microscopic-editor-dialog .mic-field-row-actions {
  display: inline-flex;
  gap: 8px;
  color: #909399;
  flex-shrink: 0;
}

.microscopic-editor-dialog .mic-action-icon {
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.microscopic-editor-dialog .mic-action-icon:hover {
  background: #f2f6fc;
  color: #1677ff;
}

.microscopic-editor-dialog .mic-action-icon.danger:hover {
  color: #f56c6c;
}

.microscopic-editor-dialog .mic-left-empty {
  color: #909399;
  font-size: 13px;
  padding: 20px 0;
  text-align: center;
}

.microscopic-editor-dialog .mic-right-empty {
  min-height: 520px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.microscopic-editor-dialog .mic-right-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.microscopic-editor-dialog .mic-right-empty-sub {
  font-size: 13px;
  color: #909399;
  max-width: 420px;
}

.microscopic-editor-dialog .mic-right-form {
  padding-right: 2px;
}

.microscopic-editor-dialog .mic-right-section {
  margin-bottom: 24px;
}

.microscopic-editor-dialog .mic-right-section-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.microscopic-editor-dialog .mic-req-dot {
  color: #f56c6c;
  margin-right: 2px;
}

.microscopic-editor-dialog .mic-map-table {
  border-radius: 4px;
  overflow: hidden;
}

.microscopic-editor-dialog .mic-map-table .el-table__header th {
  background: #f5f7fa !important;
  color: #606266;
  font-weight: 500;
}

.microscopic-editor-dialog .mic-highlight-match {
  color: #1677ff;
  font-weight: 500;
  background: #e6f7ff;
  padding: 2px 4px;
  border-radius: 2px;
}

.microscopic-editor-dialog .mic-type-hint {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}

.microscopic-editor-dialog .el-button--primary {
  background-color: #1677ff;
  border-color: #1677ff;
}

.microscopic-editor-dialog .el-button--primary:hover {
  background-color: #4096ff;
  border-color: #4096ff;
}

.microscopic-editor-dialog .el-form-item {
  margin-bottom: 18px;
}

.microscopic-editor-dialog .el-form-item__label {
  font-weight: 500;
  color: #606266;
}

.microscopic-editor-dialog .el-input.is-disabled .el-input__inner,
.microscopic-editor-dialog .el-textarea.is-disabled .el-textarea__inner {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #303133;
  cursor: not-allowed;
}

.microscopic-editor-dialog .mic-readonly-dict.is-disabled .el-input__inner {
  color: #303133;
  -webkit-text-fill-color: #303133;
}
</style>
