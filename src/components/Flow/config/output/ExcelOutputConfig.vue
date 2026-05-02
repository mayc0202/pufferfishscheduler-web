<template>
  <div class="excel-output-config excel-output-config--drawer">
    <div class="config-content">
      <FlowConfigHero
        badge="输出"
        title="Excel 输出"
        description="将数据流导出为 Excel 文件，可对接 FTP 等目标路径与拆分策略。"
        tone="jade"
        icon="el-icon-document"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="Excel输出">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="section-header" @click="sectionOpen.file = !sectionOpen.file">
          <h4>文件</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.file ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.file" class="section-content">
          <div class="form-item">
            <label class="form-label required">数据源：</label>
            <el-select
              v-model="ftpDataSourceModel"
              class="form-select excel-output-ftp-select"
              filterable
              clearable
              placeholder="请选择数据源"
              :popper-append-to-body="false"
              @visible-change="onFtpDataSourceVisible"
              @change="onDataSourceChange"
            >
              <el-option
                v-for="db in ftpDataSourceOptions"
                :key="String(db.id)"
                :label="db.name"
                :value="db.id"
              />
            </el-select>
          </div>

          <div class="form-item form-item--path-cascader">
            <label class="form-label required">输出文件目录：</label>
            <el-cascader
              v-model="outputDirectorySelection"
              class="form-select excel-output-path-cascader"
              :options="outputDirectoryOptions"
              :props="directoryCascaderProps"
              filterable
              clearable
              placeholder="请选择输出文件目录"
              :append-to-body="false"
              popper-class="excel-output-ftp-cascader-popper"
              @visible-change="onOutputDirectoryVisible"
              @change="onOutputDirectoryChange"
            />
          </div>

          <div class="form-item">
            <label class="form-label required">文件名称：</label>
            <input v-model="formData.fileName" type="text" class="form-input" placeholder="请输入文件名称">
          </div>

          <div class="form-item">
            <label class="form-label required">文件扩展名：</label>
            <el-select v-model="formData.extension" class="form-select" clearable placeholder="请选择文件扩展名">
              <el-option label="xls" value="xls" />
              <el-option label="xlsx" value="xlsx" />
            </el-select>
          </div>

          <div class="form-item">
            <label class="form-label required">如果文件已存在：</label>
            <el-select v-model="formData.ifFileExists" class="form-select" placeholder="请选择">
              <el-option label="覆盖原文件（新建）" value="new" />
              <el-option label="使用现有文件输出" value="reuse" />
            </el-select>
          </div>

          <div class="form-item form-item--checkbox">
            <label class="form-label form-label--spacer" aria-hidden="true">&nbsp;</label>
            <div class="form-item__control form-item__control--checkbox">
              <el-checkbox v-model="formData.appendLines">追加行</el-checkbox>
            </div>
          </div>
          <div class="form-item form-item--checkbox">
            <label class="form-label form-label--spacer" aria-hidden="true">&nbsp;</label>
            <div class="form-item__control form-item__control--checkbox">
              <el-checkbox v-model="formData.appendOmitHeader">追加时省略表头</el-checkbox>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="advanced-layout">
          <div class="section-header" @click="sectionOpen.fileAdv = !sectionOpen.fileAdv">
            <h4>文件</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.fileAdv ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.fileAdv" class="section-content">
            <div class="form-item">
              <label class="form-label">
                分割数据行
                <span class="help-icon" title="按行数拆分输出文件，0 表示不拆分">?</span>
                ：
              </label>
              <input v-model.number="formData.splitEvery" type="number" min="0" class="form-input" placeholder="0">
            </div>
            <div class="form-item form-item--checkbox">
              <label class="form-label form-label--spacer" aria-hidden="true">&nbsp;</label>
              <div class="form-item__control form-item__control--checkbox">
                <el-checkbox v-model="formData.streamingData">
                  采用流式写入
                  <span class="help-icon" title="大数据量时降低内存占用">?</span>
                </el-checkbox>
              </div>
            </div>
            <div class="form-item form-item--checkbox">
              <label class="form-label form-label--spacer" aria-hidden="true">&nbsp;</label>
              <div class="form-item__control form-item__control--checkbox">
                <el-checkbox v-model="formData.dateInFilename">
                  文件名中包含日期
                  <span class="help-icon" title="在文件名中追加日期时间后缀">?</span>
                </el-checkbox>
              </div>
            </div>
            <div v-if="formData.dateInFilename" class="form-item">
              <label class="form-label required">日期时间格式：</label>
              <el-select
                v-model="formData.dateTimeFormat"
                class="form-select"
                clearable
                filterable
                allow-create
                default-first-option
                placeholder="请选择日期时间格式"
              >
                <el-option v-for="f in dateTimeFormatSelectOptions" :key="f.value" :label="f.label" :value="f.value" />
              </el-select>
            </div>
            <div class="form-item">
              <label class="form-label">工作表名称：</label>
              <input v-model="formData.sheetname" type="text" class="form-input" placeholder="Sheet1">
            </div>
          </div>

          <div class="section-header" @click="sectionOpen.content = !sectionOpen.content">
            <h4>内容</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.content ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.content" class="section-content">
            <div class="form-item">
              <label class="form-label">
                数据输出起始单元格
                <span class="help-icon" title="例如 A1">?</span>
                ：
              </label>
              <input v-model="formData.startingCell" type="text" class="form-input" placeholder="A1">
            </div>
          </div>

          <div class="section-header" @click="sectionOpen.field = !sectionOpen.field">
            <h4><span class="excel-section-req">*</span>字段</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.field ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.field" class="section-content">
            <div class="field-table-wrap">
              <el-table :data="formData.fieldList" border style="width: 100%" max-height="240">
                <el-table-column type="index" label="#" width="50" />
                <el-table-column prop="name" label="名称" min-width="100" show-overflow-tooltip />
                <el-table-column prop="title" label="字段标题" min-width="100" show-overflow-tooltip />
                <el-table-column prop="type" label="类型" width="100" />
                <el-table-column prop="format" label="格式" min-width="100" show-overflow-tooltip />
              </el-table>
            </div>
            <div class="field-actions">
              <button type="button" class="dash-btn" @click="openFieldDialog">
                <i class="el-icon-edit" /> 编辑字段
              </button>
            </div>
          </div>

          <div class="section-header" @click="sectionOpen.distribution = !sectionOpen.distribution">
            <h4>数据分发</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.distribution ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.distribution" class="section-content">
            <div class="form-item">
              <label class="form-label">数据分发模式：</label>
              <div class="form-item__control form-item__control--radios">
                <el-radio-group v-model="distributionMode">
                  <el-radio label="copy">复制</el-radio>
                  <el-radio label="distribute">分发</el-radio>
                </el-radio-group>
              </div>
            </div>
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
      :visible.sync="fieldDialog.visible"
      title="编辑字段"
      width="980px"
      top="5vh"
      append-to-body
      custom-class="excel-field-dialog"
      :close-on-click-modal="false"
      @close="closeFieldDialog"
    >
      <div class="excel-field-dlg excel-field-dlg--output">
        <div class="excel-field-dlg__main">
          <div class="excel-field-dlg__label-row">
            <span class="excel-field-dlg__req">*</span> 字段
          </div>
          <div class="excel-field-dlg__scroll">
            <el-table :data="fieldDialog.staging" border class="excel-dlg-table" style="width: max-content; min-width: 100%" max-height="48vh">
              <el-table-column type="index" label="#" width="44" fixed />
              <el-table-column label="名称" min-width="140" fixed>
                <template slot-scope="scope">
                  <el-select
                    v-model="scope.row.name"
                    size="small"
                    class="w-100"
                    filterable
                    allow-create
                    default-first-option
                    placeholder="选择或输入字段名"
                  >
                    <el-option v-for="n in streamFieldOptions" :key="String(n)" :label="n" :value="n" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="字段标题" min-width="140">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.title" size="small" placeholder="请输入字段标题" />
                </template>
              </el-table-column>
              <el-table-column label="类型" width="120">
                <template slot-scope="scope">
                  <el-select v-model="scope.row.type" size="small" class="w-100" @change="onFieldTypeChange(scope.row)">
                    <el-option v-for="t in fieldTypeOptions" :key="String(t.value)" :label="t.label" :value="t.value" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column width="128">
                <template slot="header">
                  <span class="excel-sheet-editor__th-wrap">
                    <span>格式</span>
                    <el-tooltip effect="dark" placement="top" popper-class="excel-sheet-tooltip-popper">
                      <div slot="content" class="excel-sheet-tooltip__text">日期/数字等显示格式，可下拉选择或手动输入。</div>
                      <span class="excel-th-help">?</span>
                    </el-tooltip>
                  </span>
                </template>
                <template slot-scope="scope">
                  <el-select
                    v-model="scope.row.format"
                    size="small"
                    class="w-100"
                    clearable
                    filterable
                    allow-create
                    default-first-option
                    placeholder="下拉选择或手动输入"
                  >
                    <el-option v-for="f in formatOptionsForRow(scope.row)" :key="String(f.value)" :label="f.label" :value="f.value" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="64" fixed="right" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" class="excel-dlg-link-danger" @click="fieldDialog.staging.splice(scope.$index, 1)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <button type="button" class="excel-file-picker__add-row excel-field-editor__add-row" @click="addFieldRow">
            <i class="el-icon-plus" /> 添加行
          </button>
          <div class="excel-field-dlg__actions">
            <el-button
              type="primary"
              plain
              class="excel-dlg-btn-ghost"
              :loading="fieldFetchLoading"
              @click="fetchFieldsFromUpstream"
            >获取上游字段</el-button>
            <el-button type="primary" @click="confirmFieldDialog">确定</el-button>
            <el-button class="excel-dlg-footer-cancel" @click="fieldDialog.visible = false">取消</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ftpDbTree } from '@/api/database/database/dbGroup'
import { directoryTree } from '@/api/database/resource/resource'
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import { getDict } from '@/api/dict/dict'
import dictCode from '@/api/dict/dictCode'
import { normalizeDictList, normalizeFieldTypeDictList } from '@/utils/component-dict-normalize'
import FlowConfigHero from '../common/FlowConfigHero.vue'

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

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

/** 与 data_type 字典 code 一致；下拉绑定 code，展示用 value 文案（如 String） */
const DEFAULT_FIELD_TYPES = [
  { label: 'Number', value: '1' },
  { label: 'String', value: '2' },
  { label: 'Date', value: '3' },
  { label: 'Boolean', value: '4' },
  { label: 'Int', value: '5' },
  { label: 'BigNumber', value: '6' },
  { label: 'Binary', value: '8' },
  { label: 'Timestamp', value: '9' }
]

const DATE_FORMAT_PRESETS = [
  { label: 'yyyyMMddHHmmss', value: 'yyyyMMddHHmmss' },
  { label: 'yyyy-MM-dd', value: 'yyyy-MM-dd' },
  { label: 'yyyyMMdd', value: 'yyyyMMdd' }
]

const INVALID_FILE_NAME_RE = /[\\/:*?"<>|]/

function emptyOutputFieldRow() {
  return {
    name: '',
    title: '',
    type: '2',
    format: ''
  }
}

export default {
  name: 'ExcelOutputConfig',
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
        file: true,
        fileAdv: true,
        content: true,
        field: true,
        distribution: true
      },
      ftpDataSourceOptions: [],
      outputDirectoryOptions: [],
      outputDirectorySelection: [],
      directoryCascaderProps: {
        checkStrictly: true,
        emitPath: true
      },
      fieldDialog: {
        visible: false,
        staging: []
      },
      streamFieldOptions: [],
      fieldFetchLoading: false,
      apiDateFormatOptions: [],
      apiNumberFormatOptions: [],
      /** 避免 initDefaults 与 watch 与 mounted 首屏重复拉 FTP */
      _ftpEchoReady: false
    }
  },
  computed: {
    parsedTreeConfig() {
      return safeParseJson(this.componentTreeConfig) || {}
    },
    dictRoot() {
      const p = this.parsedTreeConfig
      const inner = p && typeof p.data === 'object' && !Array.isArray(p.data) ? p.data : null
      return inner && Object.keys(inner).length ? inner : p
    },
    fieldTypeOptions() {
      const raw =
        this.dictRoot.fieldType ||
        this.dictRoot.fieldTypes ||
        this.dictRoot.valueType ||
        this.dictRoot.types
      const fromApi = normalizeFieldTypeDictList(raw)
      return fromApi.length ? fromApi : DEFAULT_FIELD_TYPES
    },
    formatDictBundle() {
      const d = this.dictRoot
      const fmt = d.format || d.formats || d.formatDict
      if (fmt && typeof fmt === 'object' && !Array.isArray(fmt)) {
        return {
          all: normalizeDictList(fmt.all || fmt.string || fmt.str),
          date: normalizeDictList(fmt.date || fmt.time),
          number: normalizeDictList(fmt.number || fmt.num)
        }
      }
      return {
        all: normalizeDictList(d.formatAll || d.stringFormat),
        date: normalizeDictList(d.formatDate || d.dateFormat),
        number: normalizeDictList(d.formatNumber || d.numberFormat)
      }
    },
    ftpDataSourceModel: {
      get() {
        const v =
          this.formData.ftpDataSourceId != null && this.formData.ftpDataSourceId !== ''
            ? this.formData.ftpDataSourceId
            : (this.formData.dataSourceId != null && this.formData.dataSourceId !== ''
              ? this.formData.dataSourceId
              : this.formData.dataSource)
        return v !== '' && v != null ? v : null
      },
      set(v) {
        this.$set(this.formData, 'ftpDataSourceId', v)
        this.$set(this.formData, 'dataSource', v)
        this.$set(this.formData, 'dataSourceId', v)
      }
    },
    distributionMode: {
      get() {
        return this.formData.distributeType ? 'copy' : 'distribute'
      },
      set(v) {
        this.$set(this.formData, 'distributeType', v === 'copy')
      }
    },
    /** 仅随数据源/目录相关字段变重拉 FTP 与级联，避免 fileName 等输入触发整表刷新 */
    ftpPathEchoSignature() {
      const f = this.formData || {}
      return [
        f.dataSourceId,
        f.ftpDataSourceId,
        f.dataSource,
        f.databaseId,
        f.resourceDbId,
        f.dbId,
        f.outputPath
      ]
        .map((x) => (x != null && x !== '' ? String(x) : ''))
        .join('\u0001')
    },
    /** 文件名日期后缀：字典优先，缺省沿用原内置三项 */
    dateTimeFormatSelectOptions() {
      const merged = this.mergeFormatDictOptions(this.apiDateFormatOptions, DATE_FORMAT_PRESETS)
      return merged.length ? merged : DATE_FORMAT_PRESETS
    }
  },
  watch: {
    ftpPathEchoSignature() {
      if (!this._ftpEchoReady) return
      this.runFtpAndPathEcho()
    },
    outputDirectoryOptions(val) {
      if (!Array.isArray(val) || val.length === 0) return
      this.$nextTick(() => {
        this.syncOutputPathSelectionFromForm()
      })
    }
  },
  async mounted() {
    this.initDefaults()
    this.queryDateFormatDict()
    this.queryNumberFormatDict()
    await this.runFtpAndPathEcho()
    this._ftpEchoReady = true
  },
  methods: {
    async queryDateFormatDict() {
      try {
        const res = await getDict(dictCode.DATE_FORMAT)
        const items = Array.isArray(res && res.data) ? res.data : []
        this.apiDateFormatOptions = items
          .map(item => {
            const labelRaw = item && (item.name ?? item.label ?? item.value ?? item.code)
            const valueRaw = item && (item.code ?? item.id ?? item.value)
            if (valueRaw == null || labelRaw == null) return null
            return { value: String(valueRaw), label: String(labelRaw) }
          })
          .filter(Boolean)
      } catch (e) {
        this.apiDateFormatOptions = []
      }
    },
    async queryNumberFormatDict() {
      try {
        const res = await getDict(dictCode.NUMBER_FORMAT)
        const items = Array.isArray(res && res.data) ? res.data : []
        this.apiNumberFormatOptions = items
          .map(item => {
            const labelRaw = item && (item.name ?? item.label ?? item.value ?? item.code)
            const valueRaw = item && (item.code ?? item.id ?? item.value)
            if (valueRaw == null || labelRaw == null) return null
            return { value: String(valueRaw), label: String(labelRaw) }
          })
          .filter(Boolean)
      } catch (e) {
        this.apiNumberFormatOptions = []
      }
    },
    mergeFormatDictOptions(primary, secondary) {
      const seen = new Set()
      const out = []
      ;[...(primary || []), ...(secondary || [])].forEach((o) => {
        if (!o || o.value === undefined || o.value === null) return
        const k = String(o.value)
        if (seen.has(k)) return
        seen.add(k)
        out.push({
          label: o.label != null ? String(o.label) : k,
          value: o.value
        })
      })
      return out
    },
    initDefaults() {
      if (this.formData.code === undefined || this.formData.code === '') {
        this.$set(this.formData, 'code', 'ExcelOutput')
      }
      if (!Array.isArray(this.formData.fieldList)) this.$set(this.formData, 'fieldList', [])
      /* 仅支持 FTP 输出，与后端 Constants.FILE_SOURCE_TYPE.FTP_FILE 一致 */
      this.$set(this.formData, 'fileSourceType', 'FTP_FILE')
      if (this.formData.outputPath === undefined) this.$set(this.formData, 'outputPath', '')
      if (this.formData.fileName === undefined) this.$set(this.formData, 'fileName', '')
      if (this.formData.extension === undefined || this.formData.extension === '') {
        this.$set(this.formData, 'extension', 'xls')
      }
      if (this.formData.ifFileExists === undefined || this.formData.ifFileExists === '') {
        this.$set(this.formData, 'ifFileExists', 'new')
      }
      if (this.formData.splitEvery === undefined || this.formData.splitEvery === null || this.formData.splitEvery === '') {
        this.$set(this.formData, 'splitEvery', 0)
      }
      if (this.formData.streamingData === undefined) this.$set(this.formData, 'streamingData', false)
      if (this.formData.dateInFilename === undefined) this.$set(this.formData, 'dateInFilename', false)
      if (this.formData.dateTimeFormat === undefined) this.$set(this.formData, 'dateTimeFormat', '')
      if (!this.formData.sheetname) this.$set(this.formData, 'sheetname', 'Sheet1')
      if (!this.formData.startingCell) this.$set(this.formData, 'startingCell', 'A1')
      if (this.formData.appendLines === undefined) this.$set(this.formData, 'appendLines', false)
      if (this.formData.appendOmitHeader === undefined) this.$set(this.formData, 'appendOmitHeader', false)
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      /* 后端可能用 databaseId / dbId 等字段名 */
      let dsId = this.formData.dataSourceId
      if (dsId == null || dsId === '') dsId = this.formData.ftpDataSourceId
      if (dsId == null || dsId === '') dsId = this.formData.dataSource
      if (dsId == null || dsId === '') dsId = this.formData.databaseId
      if (dsId == null || dsId === '') dsId = this.formData.resourceDbId
      if (dsId == null || dsId === '') dsId = this.formData.dbId
      if (dsId != null && dsId !== '') {
        this.$set(this.formData, 'dataSourceId', dsId)
        this.$set(this.formData, 'ftpDataSourceId', dsId)
        this.$set(this.formData, 'dataSource', dsId)
      }
      /* 回显：字段类型与下拉选项对齐（字典 code / 旧英文） */
      if (Array.isArray(this.formData.fieldList)) {
        this.formData.fieldList.forEach((row, i) => {
          if (!row) return
          const t = this.coerceFieldTypeToOptionValue(row.type != null ? String(row.type) : '')
          if (String(row.type) !== String(t)) this.$set(this.formData.fieldList[i], 'type', t)
        })
      }
    },
    /** 旧数据可能存英文类型名；提交与下拉统一为字典 code（如 "2"） */
    coerceFieldTypeToOptionValue(raw) {
      const opts = this.fieldTypeOptions || []
      const defaultCode = '2'
      if (!opts.length) {
        const s = raw == null || raw === '' ? '' : String(raw).trim()
        return s || defaultCode
      }
      const s = String(raw ?? '').trim()
      if (!s) {
        const d = opts.find(o => String(o.value) === defaultCode)
        return String(d ? d.value : opts[0].value)
      }
      if (opts.some(o => String(o.value) === s)) return s
      const hit = opts.find(o => String(o.label).toLowerCase() === s.toLowerCase())
      if (hit) return String(hit.value)
      const intAlias = { integer: 'Int', int: 'Int' }
      const mapped = intAlias[s.toLowerCase()]
      if (mapped) {
        const h2 = opts.find(o => String(o.label).toLowerCase() === mapped.toLowerCase())
        if (h2) return String(h2.value)
      }
      return s
    },
    formatDictKeyForType(type) {
      const c = String(type ?? '').trim()
      if (c === '3' || c === '9') return 'date'
      if (c === '1' || c === '5' || c === '6' || c === '8') return 'number'
      const opts = this.fieldTypeOptions || []
      const hit = opts.find(o => String(o.value) === c)
      const n = (hit && hit.label != null ? String(hit.label) : c).toLowerCase()
      if (n.includes('timestamp') || (n.includes('time') && !n.includes('date'))) return 'date'
      if (n === 'date' || n.includes('date')) return 'date'
      if (n.includes('number') || n.includes('int') || n.includes('big') || n.includes('binary')) return 'number'
      return 'all'
    },
    formatOptionsForRow(row) {
      const key = this.formatDictKeyForType(row && row.type)
      const b = this.formatDictBundle
      if (key === 'date') {
        const merged = this.mergeFormatDictOptions(this.apiDateFormatOptions, b.date)
        if (merged.length) return merged
        return b.all.length ? b.all : []
      }
      if (key === 'number') {
        const merged = this.mergeFormatDictOptions(this.apiNumberFormatOptions, b.number)
        if (merged.length) return merged
        return b.all.length ? b.all : []
      }
      return b.all.length ? b.all : []
    },
    onFieldTypeChange(row) {
      if (!row) return
      const opts = this.formatOptionsForRow(row)
      if (opts.length && row.format) {
        const hit = opts.some(o => String(o.value) === String(row.format))
        if (!hit) this.$set(row, 'format', '')
      }
    },
    async onFtpDataSourceVisible(visible) {
      if (!visible) return
      if (!this.ftpDataSourceOptions.length) {
        await this.loadFtpDataSources()
        this.normalizeFtpDataSourceWithOptions()
      }
    },
    async runFtpAndPathEcho() {
      await this.loadFtpDataSources()
      this.normalizeFtpDataSourceWithOptions()
      this.syncOutputPathSelectionFromForm()
      if (this.ftpDataSourceModel != null && this.ftpDataSourceModel !== '') {
        await this.loadOutputDirectoryTree('/')
        this.$nextTick(() => {
          this.syncOutputPathSelectionFromForm()
        })
      }
    },
    async loadFtpDataSources() {
      try {
        const res = await ftpDbTree('')
        const nodes = Array.isArray(res?.data) ? res.data : []
        this.ftpDataSourceOptions = this.flattenDatabaseNodes(nodes)
      } catch (e) {
        this.ftpDataSourceOptions = []
      }
    },
    /** 与 FTP 上传一致：保证 el-select 能匹配已保存的 dataSourceId（类型与列表项 id 对齐） */
    normalizeFtpDataSourceWithOptions() {
      const raw =
        this.formData.ftpDataSourceId != null && this.formData.ftpDataSourceId !== ''
          ? this.formData.ftpDataSourceId
          : (this.formData.dataSourceId != null && this.formData.dataSourceId !== ''
            ? this.formData.dataSourceId
            : this.formData.dataSource)
      if (raw == null || raw === '') return
      const hit = this.ftpDataSourceOptions.find(db => String(db.id) === String(raw))
      if (hit) {
        const v = hit.id
        this.$set(this.formData, 'ftpDataSourceId', v)
        this.$set(this.formData, 'dataSourceId', v)
        this.$set(this.formData, 'dataSource', v)
        return
      }
      const n = Number(raw)
      const optId = Number.isFinite(n) ? n : raw
      this.ftpDataSourceOptions = [
        { id: optId, name: `ID ${raw}（当前 FTP 数据源列表中未找到）` },
        ...this.ftpDataSourceOptions
      ]
      this.$set(this.formData, 'ftpDataSourceId', optId)
      this.$set(this.formData, 'dataSourceId', optId)
      this.$set(this.formData, 'dataSource', optId)
    },
    flattenDatabaseNodes(nodes) {
      const out = []
      const walk = (arr) => {
        const list = arr || []
        list.forEach((n) => {
          if (!n) return
          if (String(n.type || '').toUpperCase() === 'DATABASE') {
            out.push({ id: n.id, name: n.name || String(n.id) })
          }
          if (Array.isArray(n.children) && n.children.length) walk(n.children)
        })
      }
      walk(nodes)
      return out
    },
    /**
     * 与 outputPath / emitPath 对齐：保存的是「末级目录名」（与 FTP 上传 remoteDirectory 一致），
     * 节点 value 必须是每一级的目录名，不能用整段 path（如 /knowledge），否则 v-model 无法匹配、不回显。
     */
    directoryNodeSegmentValue(x) {
      if (!x) return ''
      const pathParts = (s) => {
        const t = String(s || '').trim().replace(/^\/+|\/+$/g, '')
        return t ? t.split('/').filter(Boolean) : []
      }
      if (x.value != null && String(x.value).trim() !== '') {
        const v = String(x.value).trim()
        if (v.includes('/')) {
          const parts = pathParts(v)
          return parts.length ? parts[parts.length - 1] : v
        }
        return v
      }
      if (x.name != null && String(x.name).trim() !== '') return String(x.name).trim()
      if (x.path != null && String(x.path).trim() !== '') {
        const parts = pathParts(x.path)
        return parts.length ? parts[parts.length - 1] : ''
      }
      return ''
    },
    normalizeDirectoryOptions(raw) {
      if (!Array.isArray(raw)) return []
      return raw
        .filter(x => String(x?.type || '').toUpperCase() !== 'FILE')
        .map((x) => {
          const children = this.normalizeDirectoryOptions(x.children || [])
          const value = this.directoryNodeSegmentValue(x)
          const label =
            x.label != null && String(x.label) !== ''
              ? String(x.label)
              : (x.name != null && String(x.name) !== '' ? String(x.name) : value)
          const leaf = children.length === 0
          return {
            ...x,
            value,
            label: label || value,
            children,
            leaf
          }
        })
        .filter(x => x.value !== '')
    },
    async loadOutputDirectoryTree(path = '/') {
      const dbId = Number(this.ftpDataSourceModel)
      if (!Number.isFinite(dbId) || dbId <= 0) {
        this.outputDirectoryOptions = []
        return
      }
      try {
        const res = await directoryTree(dbId, path || '/')
        this.outputDirectoryOptions = this.normalizeDirectoryOptions(res?.data || [])
      } catch (e) {
        this.outputDirectoryOptions = []
      }
    },
    async onOutputDirectoryVisible(visible) {
      if (!visible) return
      /* 级联第一列必须是根目录下列表；用 outputPath 当请求 path 会把「当前目录子项」误当作第一列，导致与 v-model 路径不一致、回显空白 */
      await this.loadOutputDirectoryTree('/')
    },
    onDataSourceChange() {
      this.outputDirectorySelection = []
      this.$set(this.formData, 'outputPath', '')
      this.loadOutputDirectoryTree('/')
    },
    onOutputDirectoryChange(values) {
      const arr = Array.isArray(values) ? values : []
      this.$set(this.formData, 'outputPath', arr.length ? String(arr[arr.length - 1] || '') : '')
    },
    syncOutputPathSelectionFromForm() {
      const p = this.formData.outputPath ? String(this.formData.outputPath).trim() : ''
      if (!p) {
        this.outputDirectorySelection = []
        return
      }
      const normalized = p.replace(/^\/+|\/+$/g, '')
      const segments = normalized.split('/').filter(Boolean)
      this.outputDirectorySelection = segments.length ? segments : [p]
    },
    openFieldDialog() {
      const rows = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      this.fieldDialog.staging = rows.length ? clone(rows).map((r) => this.normalizeFieldRow(r)) : []
      this.fieldDialog.visible = true
      this.loadStreamFieldOptions()
    },
    closeFieldDialog() {},
    addFieldRow() {
      this.fieldDialog.staging.push(emptyOutputFieldRow())
    },
    normalizeFieldRow(r) {
      const row = r || {}
      const typeRaw = row.type != null ? String(row.type) : ''
      return {
        name: row.name != null ? String(row.name) : '',
        title: row.title != null ? String(row.title) : (row.fieldTitle != null ? String(row.fieldTitle) : ''),
        type: this.coerceFieldTypeToOptionValue(typeRaw || '2'),
        format: row.format != null ? String(row.format) : ''
      }
    },
    confirmFieldDialog() {
      const rows = (this.fieldDialog.staging || [])
        .map((r) => this.normalizeFieldRow(r))
        .filter((r) => r.name)
      this.$set(this.formData, 'fieldList', rows)
      this.fieldDialog.visible = false
    },
    buildTempFlowConfigForStream() {
      let flowData = this.flowConfig
      if (!flowData || !flowData.cells) {
        const stepId = this.currentNodeId || 'temp-excel-output'
        flowData = {
          cells: [
            {
              id: stepId,
              shape: 'rect',
              data: {
                name: this.formData.name,
                code: 'ExcelOutput',
                data: this.buildBackendDataPayload()
              }
            }
          ]
        }
      }
      return flowData
    },
    async loadStreamFieldOptions() {
      if (!this.flowId) return
      try {
        const flowData = this.buildTempFlowConfigForStream()
        const res = await getFlowFieldStream({
          flowId: Number(this.flowId),
          config: JSON.stringify(flowData),
          stepName: this.formData.name || 'Excel输出',
          code: 'ExcelOutput'
        })
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          this.streamFieldOptions = res.data
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
        } else if (res && res.code === '000000' && res.data && Array.isArray(res.data.fieldList)) {
          this.streamFieldOptions = res.data.fieldList.filter(Boolean)
        } else {
          this.streamFieldOptions = []
        }
      } catch (e) {
        this.streamFieldOptions = []
      }
    },
    async fetchFieldsFromUpstream() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在')
        return
      }
      if (!String(this.formData.name || '').trim()) {
        this.$message.warning('请先填写步骤名称')
        return
      }
      this.fieldFetchLoading = true
      try {
        await this.loadStreamFieldOptions()
        if (!this.streamFieldOptions.length) {
          this.$message.warning('未获取到上游字段，请检查连线与上游步骤')
          return
        }
        const existing = new Set(
          (this.fieldDialog.staging || []).map(r => String(r && r.name || '').trim()).filter(Boolean)
        )
        const added = []
        this.streamFieldOptions.forEach((name) => {
          const n = String(name || '').trim()
          if (!n || existing.has(n)) return
          existing.add(n)
          added.push({
            name: n,
            title: n,
            type: this.coerceFieldTypeToOptionValue('String'),
            format: ''
          })
        })
        if (!added.length) {
          this.$message.info('字段已在列表中')
          return
        }
        this.fieldDialog.staging = [...(this.fieldDialog.staging || []), ...added]
        this.$message.success(`已添加 ${added.length} 个字段`)
      } finally {
        this.fieldFetchLoading = false
      }
    },
    buildBackendDataPayload() {
      const fd = this.formData
      const splitEvery = fd.splitEvery != null && fd.splitEvery !== '' ? Math.max(0, Math.trunc(Number(fd.splitEvery))) : 0
      const copies = fd.copiesCache != null && fd.copiesCache !== '' ? Math.max(1, Math.trunc(Number(fd.copiesCache))) : 1
      const rows = Array.isArray(fd.fieldList)
        ? fd.fieldList.map((r) => ({
          name: r && r.name != null ? String(r.name) : '',
          title: r && (r.title != null ? String(r.title) : ''),
          type: this.coerceFieldTypeToOptionValue(r && r.type != null ? String(r.type) : ''),
          format: r && r.format != null ? String(r.format) : ''
        })).filter((r) => r.name)
        : []
      const dsRaw = this.ftpDataSourceModel
      let dataSourceId = ''
      if (dsRaw !== null && dsRaw !== undefined && dsRaw !== '') {
        const n = Number(dsRaw)
        dataSourceId = Number.isFinite(n) ? n : dsRaw
      }
      const payload = {
        outputPath: fd.outputPath != null ? String(fd.outputPath).trim() : '',
        fileName: fd.fileName != null ? String(fd.fileName).trim() : '',
        dataSourceId,
        ftpDataSourceId: dataSourceId,
        dataSource: dataSourceId,
        fileSourceType: 'FTP_FILE',
        extension: fd.extension != null ? String(fd.extension).trim() : 'xls',
        ifFileExists: fd.ifFileExists != null && String(fd.ifFileExists).trim() !== '' ? String(fd.ifFileExists).trim() : 'new',
        splitEvery,
        streamingData: !!fd.streamingData,
        dateInFilename: !!fd.dateInFilename,
        dateTimeFormat: fd.dateTimeFormat != null ? String(fd.dateTimeFormat).trim() : '',
        sheetname: fd.sheetname != null && String(fd.sheetname).trim() !== '' ? String(fd.sheetname).trim() : 'Sheet1',
        startingCell: fd.startingCell != null && String(fd.startingCell).trim() !== '' ? String(fd.startingCell).trim() : 'A1',
        appendLines: !!fd.appendLines,
        appendOmitHeader: !!fd.appendOmitHeader,
        fieldList: rows,
        copiesCache: copies,
        distributeType: !!fd.distributeType
      }
      return payload
    },
    handleSubmit() {
      if (!this.formData.name || !String(this.formData.name).trim()) {
        this.$message.warning('请输入步骤名称')
        return
      }
      if (this.ftpDataSourceModel == null || this.ftpDataSourceModel === '') {
        this.$message.warning('请选择数据源')
        return
      }
      if (!this.formData.outputPath || !String(this.formData.outputPath).trim()) {
        this.$message.warning('请选择输出文件目录')
        return
      }
      const fn = this.formData.fileName != null ? String(this.formData.fileName).trim() : ''
      if (!fn) {
        this.$message.warning('请输入文件名称')
        return
      }
      if (INVALID_FILE_NAME_RE.test(fn)) {
        this.$message.warning('文件名称不能包含 \\ / : * ? " < > | 等特殊字符')
        return
      }
      if (!this.formData.extension) {
        this.$message.warning('请选择文件扩展名')
        return
      }
      if (this.formData.dateInFilename && !String(this.formData.dateTimeFormat || '').trim()) {
        this.$message.warning('已勾选「文件名中包含日期」，请选择日期时间格式')
        return
      }
      if (!this.formData.fieldList || !this.formData.fieldList.length) {
        this.$message.warning('字段列表不能为空')
        return
      }
      const badField = this.formData.fieldList.find((r) => !r || !String(r.name || '').trim())
      if (badField) {
        this.$message.warning('字段名称不能为空')
        return
      }

      const payload = {
        name: String(this.formData.name).trim(),
        code: 'ExcelOutput',
        description: this.formData.description != null ? String(this.formData.description) : '',
        ...this.buildBackendDataPayload()
      }
      this.$emit('save', payload)
    }
  }
}
</script>

<style scoped>
.excel-output-config {
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
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.form-item {
  margin-bottom: 14px;
  display: flex;
  align-items: flex-start;
}

.form-label {
  width: 118px;
  font-weight: 400;
  color: #606266;
  margin-right: 10px;
  text-align: right;
  flex-shrink: 0;
  font-size: 14px;
  padding-top: 8px;
}

.form-label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

/* 占位标签：与常规标签同宽，使复选框与输入框左缘对齐 */
.form-label--spacer {
  visibility: hidden;
  user-select: none;
  pointer-events: none;
}

.form-item__control {
  flex: 1;
  min-width: 0;
}

.form-item__control--checkbox,
.form-item__control--radios {
  display: flex;
  align-items: center;
  padding-top: 8px;
  min-height: 36px;
  box-sizing: border-box;
}

.form-item--checkbox {
  margin-bottom: 8px;
}

.excel-output-config .form-item__control--checkbox ::v-deep .el-checkbox,
.excel-output-config .form-item__control--radios ::v-deep .el-radio-group {
  line-height: 1.5;
}

.excel-output-config .form-item__control--checkbox ::v-deep .el-checkbox {
  margin-left: 0;
  margin-right: 0;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  background: #f0f2f5;
  border-radius: 50%;
  font-size: 11px;
  color: #909399;
  cursor: default;
  vertical-align: middle;
}

.form-input {
  flex: 1;
  padding: 0 12px;
  height: 36px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  box-sizing: border-box;
}

.form-textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  resize: none;
  min-height: 72px;
  box-sizing: border-box;
}

.form-select {
  flex: 1;
  width: 100% !important;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
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

.excel-section-req {
  color: #f56c6c;
  margin-right: 2px;
}

.section-toggle {
  color: #909399;
}

.section-content {
  padding-top: 6px;
  margin-bottom: 8px;
}

.field-table-wrap {
  width: 100%;
}

.field-actions {
  margin-top: 10px;
}

.dash-btn {
  width: 100%;
  padding: 10px 12px;
  border: 1px dashed #409eff;
  border-radius: 4px;
  background: #fff;
  color: #409eff;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.dash-btn:hover {
  background: #ecf5ff;
}

.form-item__control--checkbox .help-icon {
  margin-left: 6px;
  vertical-align: middle;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid #ebeef5;
}

.btn {
  padding: 0 18px;
  height: 34px;
  line-height: 34px;
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

.secondary-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.w-100 {
  width: 100%;
}

.excel-field-dlg {
  display: block;
}

.excel-field-dlg--output .excel-field-dlg__main {
  width: 100%;
  min-width: 0;
}

.excel-field-dlg__label-row {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.excel-field-dlg__req {
  color: #f56c6c;
  margin-right: 4px;
}

.excel-field-dlg__scroll {
  overflow-x: auto;
}

/* 与 Excel 输入「编辑字段」一致的虚线添加行 */
.excel-file-picker__add-row {
  width: 100%;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px dashed #409eff;
  border-radius: 4px;
  background: #fff;
  color: #409eff;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.excel-file-picker__add-row:hover {
  background: #ecf5ff;
}

.excel-field-editor__add-row {
  margin-top: 2px;
}

.excel-field-dlg__actions {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
  padding-top: 4px;
}

.excel-dlg-table {
  font-size: 12px;
}

.excel-th-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  font-size: 11px;
  color: #909399;
  background: #f0f2f5;
  border-radius: 50%;
  cursor: default;
  vertical-align: middle;
  line-height: 1;
}

.excel-dlg-link-danger {
  color: #f56c6c;
}

.excel-dlg-btn-ghost {
  border-color: #b3d8ff;
  color: #409eff;
  background: #fff;
}

.excel-dlg-btn-ghost:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.excel-dlg-footer-cancel {
  border-color: #dcdfe6;
  background: #fff;
  color: #606266;
}
</style>

<style>
/* 编辑字段弹窗无 slot footer：底部留白与取消按钮样式（与 Excel 输入弹窗一致） */
.excel-field-dialog .el-dialog__body {
  padding-bottom: 20px;
}

.excel-field-dialog .excel-dlg-footer-cancel {
  background: #fff;
  border-color: #dcdfe6;
  color: #606266;
}

.excel-field-dialog .excel-dlg-footer-cancel:hover {
  border-color: #c0c4cc;
  color: #409eff;
}

/* 仅 Excel 输出：抵消 ConfigDrawer 对 .form-item 的 block 覆盖，恢复横向排版，减轻下拉被 overflow 裁切 */
.drawer-body .excel-output-config--drawer .form-item {
  display: flex !important;
  align-items: flex-start !important;
  margin-bottom: 14px !important;
}

.drawer-body .excel-output-config--drawer .form-label {
  display: block !important;
  width: 118px !important;
  max-width: 118px !important;
  text-align: right !important;
  line-height: 1.5 !important;
  margin: 0 10px 0 0 !important;
  padding-top: 8px !important;
  flex-shrink: 0 !important;
}

.drawer-body .excel-output-config--drawer .form-select {
  flex: 1 !important;
  width: auto !important;
  min-width: 0 !important;
}

.drawer-body .excel-output-config--drawer .form-item--path-cascader {
  margin-bottom: 20px !important;
}

/* 下拉留在抽屉 DOM 内（appendToBody=false），保证相对输入框定位；提高层级避免被表格/区块盖住 */
.drawer-body .excel-output-config--drawer .excel-output-ftp-select .el-select-dropdown {
  z-index: 2100 !important;
  min-width: 100%;
}

.drawer-body .excel-output-config--drawer .excel-output-path-cascader .excel-output-ftp-cascader-popper {
  z-index: 2101 !important;
}

.excel-output-ftp-cascader-popper .el-cascader-menu {
  min-width: 140px;
  max-width: 280px;
}

.excel-output-ftp-cascader-popper .el-cascader-panel {
  max-width: 100%;
}
</style>
