<template>
  <div class="sort-rows-config">
    <div class="config-content">
      <FlowConfigHero
        badge="转换"
        title="排序记录"
        description="按指定字段对数据流排序，可配置升序、降序及是否区分大小写。"
        tone="violet"
        icon="el-icon-sort"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="排序记录">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">最大缓存记录数：</label>
          <input v-model="formData.sortSize" type="text" class="form-input" placeholder="1000">
        </div>

        <div class="form-item">
          <label class="form-label">字段：</label>
          <div class="field-mapping">
            <div class="field-table-wrap">
              <el-table
                :data="formData.fieldList"
                border
                style="width: 100%"
                max-height="260"
                empty-text="暂无数据"
              >
                <el-table-column type="index" label="#" width="50" />
                <el-table-column label="字段名称" min-width="120" prop="name" />
                <el-table-column label="排序方式" min-width="100">
                  <template slot-scope="scope">
                    {{ formatAscending(scope.row.ascending) }}
                  </template>
                </el-table-column>
                <el-table-column label="是否大小写敏感" min-width="130">
                  <template slot-scope="scope">
                    {{ formatCaseSensitive(scope.row.caseSensitive) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div class="field-actions">
              <button type="button" class="dash-btn" @click="openEditDialog">
                <i class="el-icon-edit" /> 编辑字段
              </button>
            </div>
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
        </div>
      </template>

      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <el-dialog
      :visible.sync="editDialog.visible"
      title="字段"
      width="720px"
      append-to-body
      :close-on-click-modal="false"
      @open="onEditDialogOpen"
    >
      <div class="dialog-label">字段：</div>
      <el-table :data="editDialog.rows" border max-height="360" empty-text="暂无数据">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column min-width="140">
          <template slot="header">
            <span class="required-cell">字段名称</span>
          </template>
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.name"
              filterable
              allow-create
              default-first-option
              clearable
              size="small"
              placeholder="请选择或输入"
              style="width:100%"
            >
              <el-option
                v-for="fd in availableFieldOptions"
                :key="'f-' + fd.value + '-' + scope.$index"
                :label="fd.label"
                :value="fd.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column min-width="120">
          <template slot="header">
            <span class="required-cell">排序方式</span>
          </template>
          <template slot-scope="scope">
            <el-select v-model="scope.row.ascending" size="small" placeholder="请选择" style="width:100%">
              <el-option
                v-for="opt in ascendingTypeOptions"
                :key="'asc-' + opt.code"
                :label="opt.label"
                :value="opt.code"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column min-width="140">
          <template slot="header">
            <span class="required-cell">是否大小写敏感</span>
          </template>
          <template slot-scope="scope">
            <el-select v-model="scope.row.caseSensitive" size="small" placeholder="请选择" style="width:100%">
              <el-option
                v-for="opt in caseSensitiveTypeOptions"
                :key="'cs-' + opt.code"
                :label="opt.label"
                :value="opt.code"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="72" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="removeEditRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="add-row-wrap">
        <button type="button" class="dash-btn" @click="addEditRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="applyEditDialog">确定</el-button>
        <el-button @click="editDialog.visible = false">取消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import { unwrapDictList } from '@/utils/component-dict-normalize'
import FlowConfigHero from '../common/FlowConfigHero.vue'

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

/** 解析组件树节点上的 config（可能为 JSON 字符串、数组或 { list }） */
function parseComponentConfigArray(raw) {
  if (raw == null || raw === '') return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object' && Array.isArray(raw.list)) return raw.list
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw)
      if (Array.isArray(v)) return v
      if (v && typeof v === 'object' && Array.isArray(v.list)) return v.list
    } catch (e) {
      return []
    }
  }
  return []
}

function sortDictItems(list) {
  const arr = unwrapDictList(list)
  if (!Array.isArray(arr)) return []
  return [...arr].sort((a, b) => {
    const oa = a.order != null ? Number(a.order) : 0
    const ob = b.order != null ? Number(b.order) : 0
    if (Number.isFinite(oa) && Number.isFinite(ob) && oa !== ob) return oa - ob
    return 0
  })
}

function legacyBoolToYn(v) {
  if (v === true || v === 'true' || v === 1 || v === '1') return 'Y'
  if (v === false || v === 'false' || v === 0 || v === '0') return 'N'
  return ''
}

export default {
  name: 'SortRowsConfig',
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
    /** 组件树节点 config（含 dictCode + list），来自 /trans/component/tree.do */
    componentTreeConfig: {
      type: [Object, String, Array],
      default: null
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        distribution: false,
        parallel: false
      },
      availableFieldOptions: [],
      editDialog: {
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
    transComponentConfigDicts() {
      return parseComponentConfigArray(this.componentTreeConfig)
    },
    /** ascendingType：绑定值为 list[].code，展示为 list[].value，按 order 排序 */
    ascendingTypeOptions() {
      const hit = this.transComponentConfigDicts.find(d => d && d.dictCode === 'ascendingType')
      const sorted = sortDictItems(hit && hit.list)
      const opts = sorted
        .map((item) => ({
          code: item.code != null ? String(item.code).trim() : '',
          label: item.value != null ? String(item.value) : String(item.code || '')
        }))
        .filter((o) => o.code !== '')
      return opts.length
        ? opts
        : [
          { code: 'Y', label: '升序' },
          { code: 'N', label: '降序' }
        ]
    },
    /** caseSensitiveType：同上（若后台配置与 Java 语义不一致，以 config 为准） */
    caseSensitiveTypeOptions() {
      const hit = this.transComponentConfigDicts.find(d => d && d.dictCode === 'caseSensitiveType')
      const sorted = sortDictItems(hit && hit.list)
      const opts = sorted
        .map((item) => ({
          code: item.code != null ? String(item.code).trim() : '',
          label: item.value != null ? String(item.value) : String(item.code || '')
        }))
        .filter((o) => o.code !== '')
      return opts.length
        ? opts
        : [
          { code: 'Y', label: '是' },
          { code: 'N', label: '否' }
        ]
    },
    defaultAscendingCode() {
      const o = this.ascendingTypeOptions
      return o.length ? o[0].code : 'Y'
    },
    defaultCaseSensitiveCode() {
      const o = this.caseSensitiveTypeOptions
      return o.length ? o[0].code : 'N'
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
    dictLabel(options, code) {
      const c = code != null ? String(code).trim() : ''
      const hit = (options || []).find(o => String(o.code) === c)
      return hit ? hit.label : (c || '—')
    },
    formatAscending(v) {
      return this.dictLabel(this.ascendingTypeOptions, v)
    },
    formatCaseSensitive(v) {
      return this.dictLabel(this.caseSensitiveTypeOptions, v)
    },
    /** 将存盘值约束到当前字典 code；兼容布尔与 Y/N 旧数据 */
    normalizeFieldCode(raw, options) {
      const opts = Array.isArray(options) && options.length ? options : []
      const codes = opts.map(o => String(o.code))
      const set = new Set(codes)
      if (raw !== undefined && raw !== null && raw !== '') {
        const s = String(raw).trim()
        if (set.has(s)) return s
      }
      if (set.has('Y') && set.has('N')) {
        const yn = legacyBoolToYn(raw)
        if (yn) return yn
      }
      return codes.length ? codes[0] : ''
    },
    createEmptySortRow() {
      return {
        name: '',
        ascending: this.defaultAscendingCode,
        caseSensitive: this.defaultCaseSensitiveCode
      }
    },
    normalizeSortRow(r) {
      if (!r || typeof r !== 'object') return this.createEmptySortRow()
      return {
        name: r.name != null ? String(r.name).trim() : '',
        ascending: this.normalizeFieldCode(r.ascending, this.ascendingTypeOptions),
        caseSensitive: this.normalizeFieldCode(r.caseSensitive, this.caseSensitiveTypeOptions)
      }
    },
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', '排序记录')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.sortSize === undefined || this.formData.sortSize === '') {
        this.$set(this.formData, 'sortSize', '1000')
      }
      if (!Array.isArray(this.formData.fieldList)) {
        this.$set(this.formData, 'fieldList', [])
      } else {
        this.$set(this.formData, 'fieldList', this.formData.fieldList.map(row => this.normalizeSortRow(row)))
      }
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
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
          stepName: this.formData.name || '排序记录',
          code: this.formData.code || 'SortRows',
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
    async openEditDialog() {
      await this.loadFieldOptionsFromApi()
      if (!this.availableFieldOptions.length) {
        this.refreshFieldOptions()
      }
      this.editDialog.visible = true
    },
    onEditDialogOpen() {
      const src = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      this.editDialog.rows = src.length
        ? clone(src.map(row => this.normalizeSortRow(row)))
        : [this.createEmptySortRow()]
    },
    addEditRow() {
      this.editDialog.rows.push(this.createEmptySortRow())
    },
    removeEditRow(index) {
      this.editDialog.rows.splice(index, 1)
      if (!this.editDialog.rows.length) this.editDialog.rows.push(this.createEmptySortRow())
    },
    applyEditDialog() {
      const cleaned = this.editDialog.rows
        .map(row => this.normalizeSortRow(row))
        .filter(r => r.name)
      this.$set(this.formData, 'fieldList', cleaned)
      this.editDialog.visible = false
    },
    handleSubmit() {
      const name = String(this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      const sortSize = String(this.formData.sortSize != null ? this.formData.sortSize : '').trim()
      if (!sortSize) {
        this.$message.warning('请填写最大缓存记录数')
        return
      }
      const ascSet = new Set(this.ascendingTypeOptions.map(o => String(o.code)))
      const csSet = new Set(this.caseSensitiveTypeOptions.map(o => String(o.code)))
      const rows = Array.isArray(this.formData.fieldList)
        ? this.formData.fieldList.map(row => this.normalizeSortRow(row))
        : []
      const filled = rows.filter(r => r.name)
      if (!filled.length) {
        this.$message.warning('请至少配置一个排序字段')
        return
      }
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        if (!r.name) continue
        if (!r.ascending || !ascSet.has(String(r.ascending))) {
          this.$message.warning(`排序字段第 ${i + 1} 行请选择排序方式`)
          return
        }
        if (!r.caseSensitive || !csSet.has(String(r.caseSensitive))) {
          this.$message.warning(`排序字段第 ${i + 1} 行请选择是否大小写敏感`)
          return
        }
      }
      this.$set(this.formData, 'fieldList', filled)

      const copies = this.formData.copiesCache != null && this.formData.copiesCache !== ''
        ? Math.max(1, Math.trunc(Number(this.formData.copiesCache)))
        : 1
      this.$set(this.formData, 'copiesCache', copies)
      this.$set(this.formData, 'sortSize', sortSize)

      this.$emit('save', this.formData)
    }
  }
}
</script>

<style scoped>
.sort-rows-config { height: 100%; }
.config-content { display: flex; flex-direction: column; padding: 20px; }
.config-tabs { margin: 0 0 8px; }
.form-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 12px; }
.form-item { margin-bottom: 16px; display: block; }
.form-label { display: block; width: 100%; text-align: left; line-height: 20px; color: #606266; font-size: 14px; margin-bottom: 8px; }
.form-label.required::before { content: '*'; color: #f56c6c; margin-right: 4px; }
.form-input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; outline: none; box-sizing: border-box; }
.form-textarea { width: 100%; padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; resize: vertical; outline: none; box-sizing: border-box; }
.help-i { color: #909399; margin-left: 4px; cursor: default; }

.field-mapping { width: 100%; }
.field-table-wrap { width: 100%; }
.field-actions { margin-top: 10px; }
.dash-btn {
  width: 100%;
  height: 40px;
  border: 1px dashed #409eff;
  border-radius: 6px;
  background: #fff;
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
}
.dash-btn:hover { background: #ecf5ff; }
.add-row-wrap { margin-top: 12px; }

.advanced-layout { padding-top: 4px; }
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-top: 1px solid #ebeef5; cursor: pointer; user-select: none; }
.section-header h4 { margin: 0; font-size: 14px; font-weight: 600; color: #303133; }
.section-toggle { color: #909399; }
.section-content { padding-top: 8px; margin-bottom: 8px; }
.advanced-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
.advanced-label { font-size: 14px; color: #606266; }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #ebeef5; }
.btn { padding: 0 20px; height: 36px; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; font-size: 14px; background: #fff; color: #606266; }
.primary-btn { background: #409eff; color: #fff; border-color: #409eff; }

.dialog-label { font-size: 14px; color: #606266; margin-bottom: 8px; }
.required-cell::before { content: '*'; color: #f56c6c; margin-right: 2px; }
</style>
