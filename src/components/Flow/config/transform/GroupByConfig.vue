<template>
  <div class="group-by-config">
    <div class="config-content">
      <FlowConfigHero
        badge="转换"
        title="分组统计"
        description="按指定字段分组，对组内字段进行求和、均值、最值、字符串拼接等聚合，输出一行一组。"
        tone="teal"
        icon="el-icon-s-grid"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="分组统计">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">
            分组字段名称：
            <el-tooltip placement="top" max-width="420">
              <div slot="content">
                选择一个或多个字段作为分组键；同一组内多行会合并为一行，并按下方统计配置输出聚合结果。
              </div>
              <i class="el-icon-question help-i" />
            </el-tooltip>
          </label>
          <el-select
            v-model="formData.groupField"
            multiple
            filterable
            clearable
            collapse-tags
            placeholder="请选择分组字段名称（可多选）"
            class="full-select"
            @visible-change="(open) => open && refreshFieldOptions()"
          >
            <el-option
              v-for="fd in availableFieldOptions"
              :key="'gf-' + fd.value"
              :label="fd.label"
              :value="fd.value"
            />
          </el-select>
        </div>

        <div class="form-item">
          <label class="form-label required">统计配置：</label>
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
                <el-table-column label="输出字段名称" min-width="120" prop="aggregateField" show-overflow-tooltip />
                <el-table-column label="统计字段名称" min-width="120" prop="subjectField" show-overflow-tooltip />
                <el-table-column label="统计类型" min-width="140">
                  <template slot-scope="scope">
                    {{ aggregateTypeLabel(scope.row.aggregateType) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div class="field-actions">
              <button type="button" class="dash-btn" @click="openStatsDialog">
                <i class="el-icon-edit" /> 编辑统计配置
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
      :visible.sync="statsDialog.visible"
      title="编辑统计配置信息"
      width="880px"
      append-to-body
      top="6vh"
      custom-class="group-by-stats-dialog"
      :close-on-click-modal="false"
      @open="onStatsDialogOpen"
    >
      <div class="dialog-field-toolbar">
        <span class="dialog-field-label"><span class="req-mark">*</span>字段配置</span>
        <el-tooltip placement="right" max-width="440">
          <div slot="content">
            统计类型取值与 Kettle GroupBy 一致；「百分位」及「自定义分隔符连接」需在「值」列填写参数。选择「使用英文分号连接同组字符串」时由后端固定为分号分隔，无需填「值」。
          </div>
          <span class="hint-link"><i class="el-icon-info" /> 说明</span>
        </el-tooltip>
      </div>
      <el-table :data="statsDialog.rows" border max-height="420" empty-text="暂无数据">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column min-width="140">
          <template slot="header">
            <span class="req-before">统计字段名称</span>
          </template>
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.subjectField"
              filterable
              clearable
              size="small"
              placeholder="请选择统计字段名称"
              style="width:100%"
              @visible-change="(open) => open && refreshFieldOptions()"
            >
              <el-option
                v-for="fd in availableFieldOptions"
                :key="'s-' + fd.value + '-' + scope.$index"
                :label="fd.label"
                :value="fd.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column min-width="200">
          <template slot="header">
            <span class="req-before">统计类型</span>
          </template>
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.aggregateType"
              size="small"
              placeholder="请选择统计类型"
              style="width:100%"
            >
              <el-option
                v-for="opt in aggregateTypeOptions"
                :key="'at-' + opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="值" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.valueField" size="small" placeholder="请输入值" />
          </template>
        </el-table-column>
        <el-table-column min-width="140">
          <template slot="header">
            <span class="req-before">输出字段名称</span>
          </template>
          <template slot-scope="scope">
            <el-input v-model="scope.row.aggregateField" size="small" placeholder="请输入输出字段名称" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="72" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="removeStatsRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="add-row-wrap">
        <button type="button" class="dash-btn" @click="addStatsRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>
      <span slot="footer" class="field-select-dlg-footer">
        <el-button type="primary" @click="confirmStatsDialog">确定</el-button>
        <el-button @click="statsDialog.visible = false">取消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

/**
 * 与 Kettle 8.x GroupByMeta 常量一致（见 Pentaho Javadoc），便于后端直接写入 aggregateType。
 * 特例：21 为业务字典「英文分号连接」，后端会转为 TYPE_GROUP_CONCAT_STRING + 分号分隔符。
 */
const AGGREGATE_TYPE_OPTIONS = [
  { label: '求和', value: 1 },
  { label: '平均数', value: 2 },
  { label: '中位数', value: 3 },
  { label: '百分位（在「值」中指定百分比，如 90）', value: 4 },
  { label: '最小值', value: 5 },
  { label: '最大值', value: 6 },
  { label: '记录数（全部）', value: 7 },
  { label: '使用英文逗号连接同组字符串', value: 8 },
  { label: '标准差（总体）', value: 15 },
  { label: '标准差（样本）', value: 19 },
  { label: '使用自定义分隔符连接字符串（在「值」中填分隔符）', value: 16 },
  { label: '使用英文分号连接同组字符串', value: 21 }
]

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

function emptyStatsRow() {
  return {
    subjectField: '',
    aggregateType: undefined,
    valueField: '',
    aggregateField: ''
  }
}

function coerceAggregateType(raw) {
  if (raw === undefined || raw === null || raw === '') return undefined
  const n = Math.trunc(Number(raw))
  return Number.isFinite(n) ? n : undefined
}

function normalizeStatsRow(r) {
  if (!r || typeof r !== 'object') return emptyStatsRow()
  return {
    subjectField: r.subjectField != null ? String(r.subjectField).trim() : '',
    aggregateType: coerceAggregateType(r.aggregateType),
    valueField: r.valueField != null ? String(r.valueField) : '',
    aggregateField: r.aggregateField != null ? String(r.aggregateField).trim() : ''
  }
}

function normalizeGroupFieldList(raw) {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (!t) return []
    try {
      const parsed = JSON.parse(t)
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x).trim()).filter(Boolean)
      }
    } catch (e) {
      /* 单字段字符串 */
    }
    return [t]
  }
  return []
}

export default {
  name: 'GroupByConfig',
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
      aggregateTypeOptions: AGGREGATE_TYPE_OPTIONS,
      availableFieldOptions: [],
      statsDialog: {
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
  watch: {
    flowConfig: {
      handler() {
        this.refreshFieldOptions()
      },
      deep: true
    },
    currentNodeId() {
      this.refreshFieldOptions()
    },
    flowId() {
      this.refreshFieldOptions()
    }
  },
  mounted() {
    this.initDefaults()
    this.refreshFieldOptions()
  },
  methods: {
    aggregateTypeLabel(v) {
      const n = coerceAggregateType(v)
      const hit = this.aggregateTypeOptions.find((o) => o.value === n)
      if (hit) return hit.label
      if (n === undefined) return '—'
      return String(n)
    },
    stripLegacyNestedData() {
      const d = this.formData.data
      if (d != null && typeof d === 'object' && !Array.isArray(d)) {
        this.$delete(this.formData, 'data')
      }
    },
    initDefaults() {
      this.stripLegacyNestedData()
      if (!this.formData.name) this.$set(this.formData, 'name', '分组统计')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      const gf = normalizeGroupFieldList(this.formData.groupField)
      this.$set(this.formData, 'groupField', gf)
      if (!Array.isArray(this.formData.fieldList)) {
        this.$set(this.formData, 'fieldList', [])
      } else {
        this.$set(this.formData, 'fieldList', this.formData.fieldList.map(normalizeStatsRow))
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
          stepName: this.formData.name || '分组统计',
          code: this.formData.code || 'GroupBy',
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
    fillFieldOptionsFromGraph() {
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
    async refreshFieldOptions() {
      const nodeId = String(this.currentNodeId || '')
      if (!nodeId) {
        this.availableFieldOptions = []
        return
      }
      if (this.flowId) {
        await this.loadFieldOptionsFromApi()
        if (this.availableFieldOptions.length) return
      }
      this.fillFieldOptionsFromGraph()
    },
    async openStatsDialog() {
      await this.refreshFieldOptions()
      this.statsDialog.visible = true
    },
    onStatsDialogOpen() {
      const src = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      this.statsDialog.rows = src.length ? src.map((r) => normalizeStatsRow(r)) : []
    },
    addStatsRow() {
      this.statsDialog.rows.push(emptyStatsRow())
    },
    removeStatsRow(index) {
      this.statsDialog.rows.splice(index, 1)
    },
    confirmStatsDialog() {
      const staged = this.statsDialog.rows.map(normalizeStatsRow)
      for (let i = 0; i < staged.length; i++) {
        const r = staged[i]
        const touched =
          r.subjectField ||
          r.aggregateField ||
          r.valueField ||
          (r.aggregateType !== undefined && r.aggregateType !== null)
        if (!touched) continue
        if (!r.subjectField) {
          this.$message.warning(`第 ${i + 1} 行请选择统计字段名称，或删除无效行`)
          return
        }
        if (r.aggregateType === undefined || r.aggregateType === null || r.aggregateType === '') {
          this.$message.warning(`第 ${i + 1} 行请选择统计类型，或删除无效行`)
          return
        }
        if (!r.aggregateField) {
          this.$message.warning(`第 ${i + 1} 行请填写输出字段名称，或删除无效行`)
          return
        }
        const at = Math.trunc(Number(r.aggregateType))
        if (at === 4 && !String(r.valueField || '').trim()) {
          this.$message.warning(`第 ${i + 1} 行：百分位类型请在「值」中填写百分比`)
          return
        }
        if (at === 16 && !String(r.valueField || '').trim()) {
          this.$message.warning(`第 ${i + 1} 行：自定义分隔符连接请在「值」中填写分隔符`)
          return
        }
      }
      const cleaned = staged.filter(
        (r) =>
          r.subjectField &&
          r.aggregateField &&
          r.aggregateType !== undefined &&
          r.aggregateType !== null &&
          r.aggregateType !== ''
      )
      this.$set(
        this.formData,
        'fieldList',
        cleaned.map((r) => ({
          subjectField: r.subjectField,
          aggregateType: Math.trunc(Number(r.aggregateType)),
          valueField: r.valueField != null ? String(r.valueField) : '',
          aggregateField: r.aggregateField
        }))
      )
      this.stripLegacyNestedData()
      this.statsDialog.visible = false
    },
    buildPayloadForSave() {
      const raw = { ...this.formData }
      this.stripLegacyNestedData()
      if (raw.data != null && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
        delete raw.data
      }
      raw.groupField = normalizeGroupFieldList(raw.groupField)
      raw.fieldList = Array.isArray(raw.fieldList)
        ? raw.fieldList.map((r) => {
          const n = normalizeStatsRow(r)
          return {
            subjectField: n.subjectField,
            aggregateType: Math.trunc(Number(n.aggregateType)),
            valueField: n.valueField != null ? String(n.valueField) : '',
            aggregateField: n.aggregateField
          }
        })
        : []
      raw.copiesCache =
        raw.copiesCache != null && raw.copiesCache !== ''
          ? Math.max(1, Math.trunc(Number(raw.copiesCache)))
          : 1
      raw.distributeType = !!raw.distributeType
      return raw
    },
    handleSubmit() {
      const name = String(this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      const gfs = normalizeGroupFieldList(this.formData.groupField)
      if (!gfs.length) {
        this.$message.warning('请至少选择一个分组字段名称')
        return
      }
      this.$set(this.formData, 'groupField', gfs)

      const list = Array.isArray(this.formData.fieldList)
        ? this.formData.fieldList
          .map(normalizeStatsRow)
          .filter(
            (r) =>
              r.subjectField &&
              r.aggregateField &&
              r.aggregateType !== undefined &&
              r.aggregateType !== null &&
              r.aggregateType !== ''
          )
        : []
      if (!list.length) {
        this.$message.warning('请至少配置一条统计规则（可点击「编辑统计配置」添加）')
        return
      }
      for (let i = 0; i < list.length; i++) {
        const r = list[i]
        const at = Math.trunc(Number(r.aggregateType))
        if (at === 4 && !String(r.valueField || '').trim()) {
          this.$message.warning(`统计配置第 ${i + 1} 行：百分位类型请在「值」中填写百分比`)
          return
        }
        if (at === 16 && !String(r.valueField || '').trim()) {
          this.$message.warning(`统计配置第 ${i + 1} 行：自定义分隔符连接请在「值」中填写分隔符`)
          return
        }
      }
      this.$set(
        this.formData,
        'fieldList',
        list.map((r) => ({
          subjectField: r.subjectField,
          aggregateType: Math.trunc(Number(r.aggregateType)),
          valueField: r.valueField != null ? String(r.valueField) : '',
          aggregateField: r.aggregateField
        }))
      )

      const copies = this.formData.copiesCache != null && this.formData.copiesCache !== ''
        ? Math.max(1, Math.trunc(Number(this.formData.copiesCache)))
        : 1
      this.$set(this.formData, 'copiesCache', copies)

      this.$emit('save', this.buildPayloadForSave())
    }
  }
}
</script>

<style scoped>
.group-by-config { height: 100%; }
.config-content { display: flex; flex-direction: column; padding: 20px; }
.config-tabs { margin: 0 0 8px; }
.form-item { margin-bottom: 16px; display: block; }
.form-label { display: block; width: 100%; text-align: left; line-height: 20px; color: #606266; font-size: 14px; margin-bottom: 8px; }
.form-label.required::before { content: '*'; color: #f56c6c; margin-right: 4px; }
.form-input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; outline: none; box-sizing: border-box; }
.form-textarea { width: 100%; padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; resize: vertical; outline: none; box-sizing: border-box; }
.full-select { width: 100%; }
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

.dialog-field-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.dialog-field-label { font-size: 14px; color: #606266; }
.req-mark { color: #f56c6c; margin-right: 2px; }
.hint-link { font-size: 13px; color: #409eff; cursor: default; }
.req-before::before { content: '*'; color: #f56c6c; margin-right: 4px; }
.field-select-dlg-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 10px; }
</style>

<style>
.group-by-stats-dialog .el-dialog__body {
  padding-top: 8px;
}
</style>
