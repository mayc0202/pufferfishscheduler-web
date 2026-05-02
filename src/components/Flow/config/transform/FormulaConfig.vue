<template>
  <div class="formula-config">
    <div class="config-content">
      <FlowConfigHero
        badge="转换"
        title="公式"
        description="通过算术、逻辑与文本表达式计算新字段，字段引用使用 [字段名] 语法。"
        tone="indigo"
        icon="el-icon-edit-outline"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="公式">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">字段：</label>
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
                <el-table-column label="新字段名称" min-width="120" prop="fieldName" show-overflow-tooltip />
                <el-table-column label="公式" min-width="160" prop="formula" show-overflow-tooltip />
                <el-table-column label="类型" min-width="100">
                  <template slot-scope="scope">
                    {{ valueTypeLabel(scope.row.valueType) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div class="field-actions">
              <button type="button" class="dash-btn" @click="openFieldsDialog">
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
      :visible.sync="fieldsDialog.visible"
      title="字段"
      width="920px"
      append-to-body
      top="6vh"
      custom-class="formula-fields-dialog"
      :close-on-click-modal="false"
      @open="onFieldsDialogOpen"
    >
      <div class="dialog-field-toolbar">
        <span class="dialog-field-label"><span class="req-mark">*</span>字段：</span>
        <el-button type="text" class="hint-link-btn" @click="helpDialog.visible = true">公式编写说明</el-button>
      </div>
      <el-table :data="fieldsDialog.rows" border max-height="420" empty-text="暂无数据">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column min-width="130">
          <template slot="header">
            <span class="req-before">新字段名称</span>
          </template>
          <template slot-scope="scope">
            <el-input v-model="scope.row.fieldName" size="small" placeholder="请输入新字段名称" />
          </template>
        </el-table-column>
        <el-table-column min-width="220">
          <template slot="header">
            <span class="req-before">公式</span>
            <el-button type="text" class="inline-help" @click="helpDialog.visible = true">（公式编写说明）</el-button>
          </template>
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.formula"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 4 }"
              size="small"
              placeholder="请输入公式"
            />
          </template>
        </el-table-column>
        <el-table-column min-width="120">
          <template slot="header">
            <span class="req-before">类型</span>
            <el-tooltip placement="top" max-width="360">
              <div slot="content">
                与 Kettle ValueMeta 类型编码一致，将写入后端 valueType。
              </div>
              <i class="el-icon-question help-i-header" />
            </el-tooltip>
          </template>
          <template slot-scope="scope">
            <el-select v-model="scope.row.valueType" size="small" placeholder="请选择" style="width:100%">
              <el-option
                v-for="opt in valueTypeOptions"
                :key="'vt-' + opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="长度" width="100">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.valueLength"
              :min="0"
              :controls="false"
              size="small"
              class="num-in-table"
              placeholder="长度"
            />
          </template>
        </el-table-column>
        <el-table-column label="精度" width="100">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.valuePrecision"
              :min="0"
              :controls="false"
              size="small"
              class="num-in-table"
              placeholder="精度"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="72" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="removeFieldRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="add-row-wrap">
        <button type="button" class="dash-btn" @click="addFieldRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="confirmFieldsDialog">确定</el-button>
        <el-button @click="fieldsDialog.visible = false">取消</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="helpDialog.visible"
      title="公式编写说明"
      width="720px"
      append-to-body
      custom-class="formula-help-dialog"
    >
      <div class="help-body" v-html="formattedHelpHtml" />
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="helpDialog.visible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import FlowConfigHero from '../common/FlowConfigHero.vue'

/** 与 org.pentaho.di.core.row.ValueMetaInterface 类型编码一致（不含 TYPE_NONE=0，避免「默认」歧义） */
const VALUE_TYPE_OPTIONS = [
  { value: 1, label: 'Number' },
  { value: 2, label: 'String' },
  { value: 3, label: 'Date' },
  { value: 4, label: 'Boolean' },
  { value: 5, label: 'Integer' },
  { value: 6, label: 'BigNumber' },
  { value: 8, label: 'Binary' },
  { value: 9, label: 'Timestamp' }
]

const ALLOWED_FORMULA_VALUE_TYPES = new Set(VALUE_TYPE_OPTIONS.map((o) => o.value))
/** 新增行及历史 valueType=0/非法值时的落库类型（Integer） */
const DEFAULT_FORMULA_VALUE_TYPE = 5

const FORMULA_HELP_TEXT = `公式可用于编写算术运算、逻辑运算、文本运算表达式，通过表达式计算生成新的结果数据（示例：[a]+[b]）。

一、数据流字段获取方法
公式中可通过「[]」符号获取输入流中的字段值，格式为 [字段名]。例如：[a] 表示获取输入流中字段名为「a」的字段值。

二、算术运算
支持 +（加）、-（减）、*（乘）、/（除）等常规算术运算符，示例：[a] * [b] + [c]。
运算优先级规则：
- 默认优先级：从左到右，先计算乘法（*）、除法（/），再计算加法（+）、减法（-）；
- 优先级调整：若需改变运算顺序，可用「()」将需优先计算的部分括起，示例：([a]+[b])*[c]（先计算[a]+[b]，再将结果与[c]相乘）。

三、逻辑运算
支持与（AND）、或（OR）、非（NOT）、异或（XOR）、条件判断（IF）、是否相等（EQUALS）等运算，语法及示例如下：
1. 与运算（AND）
规则：计算所有参数的逻辑与，仅当所有参与运算的参数均为真（true）时，返回结果为真（true），否则为假（false）。
语法：AND([参数1];[参数2];...)（可支持多个参数）
示例：若参数p1=true、p2=false，则 AND([p1];[p2]) 返回 false。
2. 或运算（OR）
规则：计算所有参数的逻辑或，只要有一个参与运算的参数为真（true），返回结果即为真（true）。
语法：OR([参数1];[参数2];...)（可支持多个参数）
示例：若参数p1=true、p2=false，则 OR([p1];[p2]) 返回 true。
3. 非运算（NOT）
规则：计算参数的逻辑非，若参数为真（true），返回假（false）；若参数为假（false），返回真（true）。
语法：NOT([参数])（仅支持单个参数）
示例：若参数p1=true，则 NOT([p1]) 返回 false。
4. 异或运算（XOR）
规则：计算所有参数的逻辑异或，若参与运算的真（true）参数个数为奇数，返回真（true）；为偶数则返回假（false）。
语法：XOR([参数1];[参数2];...)（可支持多个参数）
示例：① 若p1=true、p2=true，则 XOR([p1];[p2]) 返回 false；② 若p1=true、p3=false，则 XOR([p1];[p3]) 返回 true。
5. 条件判断（IF）
规则：根据判定条件的真假，返回对应结果；条件为真则返回结果1，条件为假则返回结果2。
语法：IF([判定条件];[结果1];[结果2])
示例：若p1=true、p2=1、p3=2，则 IF([p1];[p2];[p3]) 返回 1。
6. 是否相等（EQUALS）
规则：比较两个参数的值是否相等，相等则返回真（true），不相等则返回假（false）。
语法：EQUALS([参数1];[参数2])
示例：若p1=1、p2=1，则 EQUALS([p1];[p2]) 返回 true。

四、文本运算
支持字符串连接、比较、长度计算、大小写转换、替换、去空格等运算，语法及示例如下：
1. 字符串连接（&）
规则：将两个或多个字符串拼接为一个字符串。
语法：[参数1] & [参数2]（可支持多个参数拼接）
示例：若p1="Hello"、p2="World"，则 [p1] & [p2] 返回 "HelloWorld"。
2. 字符串比较（EXACT）
规则：严格区分大小写，比较两个字符串是否完全相等，相等则返回真（true），否则返回假（false）。
语法：EXACT([参数1];[参数2])
示例：若p1="A"、p2="a"，则 EXACT([p1];[p2]) 返回 false。
3. 字符串长度（LEN）
规则：返回指定字符串的字符个数（含符号、数字，不含首尾空格）。
语法：LEN([参数])
示例：若p1="ABC"，则 LEN([p1]) 返回 3。
4. 大写转小写（LOWER）
规则：将字符串中所有大写字母转换为小写字母，其他字符保持不变，返回转换后的字符串。
语法：LOWER([参数])
示例：若p1="AbC"，则 LOWER([p1]) 返回 "abc"。
5. 小写转大写（UPPER）
规则：将字符串中所有小写字母转换为大写字母，其他字符保持不变，返回转换后的字符串。
语法：UPPER([参数])
示例：若p1="AbC"，则 UPPER([p1]) 返回 "ABC"。
6. 字符串替换（REPLACE）
规则：根据指定的索引位置、替换长度，将字符串中对应部分替换为指定值，返回替换后的字符串（索引从1开始计数）。
语法：REPLACE([字符串参数];[索引位置];[替换长度];[替换值])
示例：若p1="ABCEEFG"，则 REPLACE([p1];4;4;"D") 返回 "ABCD"（从第4位开始，替换4个字符为"D"）。
7. 去空格（TRIM）
规则：去除字符串开头和结尾的所有空格，同时将字符串中间的多个连续空格替换为单个空格，返回处理后的字符串。
语法：TRIM([参数])
示例：若p1="  ABC  "（首尾各2个空格），则 TRIM([p1]) 返回 "ABC"；若p1="A  BC  D"（中间2个空格），则 TRIM([p1]) 返回 "A BC D"。`

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeFormulaRow(r) {
  if (!r || typeof r !== 'object') {
    return { fieldName: '', formula: '', valueType: DEFAULT_FORMULA_VALUE_TYPE, valueLength: 0, valuePrecision: 0 }
  }
  const vt = Math.trunc(Number(r.valueType))
  const vl = Math.trunc(Number(r.valueLength))
  const vp = Math.trunc(Number(r.valuePrecision))
  const coercedVt = Number.isFinite(vt) && ALLOWED_FORMULA_VALUE_TYPES.has(vt) ? vt : DEFAULT_FORMULA_VALUE_TYPE
  return {
    fieldName: r.fieldName != null ? String(r.fieldName).trim() : '',
    formula: r.formula != null ? String(r.formula) : '',
    valueType: coercedVt,
    valueLength: Number.isFinite(vl) && vl >= 0 ? vl : 0,
    valuePrecision: Number.isFinite(vp) && vp >= 0 ? vp : 0
  }
}

function emptyFormulaRow() {
  return { fieldName: '', formula: '', valueType: DEFAULT_FORMULA_VALUE_TYPE, valueLength: 0, valuePrecision: 0 }
}

export default {
  name: 'FormulaConfig',
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
      valueTypeOptions: VALUE_TYPE_OPTIONS,
      activeTab: 'basic',
      sectionOpen: {
        distribution: false,
        parallel: false
      },
      fieldsDialog: {
        visible: false,
        rows: []
      },
      helpDialog: {
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
    },
    formattedHelpHtml() {
      const blocks = FORMULA_HELP_TEXT.split(/\n{2,}/)
      return blocks
        .map((b) => `<p class="help-p">${escapeHtml(b).replace(/\n/g, '<br/>')}</p>`)
        .join('')
    }
  },
  mounted() {
    this.initDefaults()
  },
  methods: {
    valueTypeLabel(v) {
      const n = Math.trunc(Number(v))
      const hit = this.valueTypeOptions.find((o) => o.value === n)
      if (hit) return hit.label
      if (!Number.isFinite(n)) return '—'
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
      if (!this.formData.name) this.$set(this.formData, 'name', '公式')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (!Array.isArray(this.formData.fieldList)) {
        this.$set(this.formData, 'fieldList', [])
      } else {
        this.$set(this.formData, 'fieldList', this.formData.fieldList.map(normalizeFormulaRow))
      }
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
      if (!this.formData.code) this.$set(this.formData, 'code', 'Formula')
    },
    openFieldsDialog() {
      this.fieldsDialog.visible = true
    },
    onFieldsDialogOpen() {
      const src = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      this.fieldsDialog.rows = src.length ? src.map((r) => normalizeFormulaRow(r)) : []
    },
    addFieldRow() {
      this.fieldsDialog.rows.push(emptyFormulaRow())
    },
    removeFieldRow(index) {
      this.fieldsDialog.rows.splice(index, 1)
    },
    confirmFieldsDialog() {
      const staged = this.fieldsDialog.rows.map(normalizeFormulaRow)
      for (let i = 0; i < staged.length; i++) {
        const r = staged[i]
        const touched = r.fieldName || r.formula || r.valueLength || r.valuePrecision
        if (!touched) continue
        if (!r.fieldName) {
          this.$message.warning(`第 ${i + 1} 行请填写新字段名称，或删除无效行`)
          return
        }
        if (!String(r.formula || '').trim()) {
          this.$message.warning(`第 ${i + 1} 行请填写公式，或删除无效行`)
          return
        }
      }
      const cleaned = staged.filter((r) => r.fieldName && String(r.formula || '').trim())
      this.$set(this.formData, 'fieldList', cleaned)
      this.stripLegacyNestedData()
      this.fieldsDialog.visible = false
    },
    buildPayloadForSave() {
      const raw = { ...this.formData }
      this.stripLegacyNestedData()
      if (raw.data != null && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
        delete raw.data
      }
      raw.fieldList = Array.isArray(raw.fieldList)
        ? raw.fieldList.map(normalizeFormulaRow).filter((r) => r.fieldName && String(r.formula || '').trim())
        : []
      raw.copiesCache =
        raw.copiesCache != null && raw.copiesCache !== ''
          ? Math.max(1, Math.trunc(Number(raw.copiesCache)))
          : 1
      raw.distributeType = !!raw.distributeType
      raw.code = raw.code || 'Formula'
      return raw
    },
    handleSubmit() {
      const name = String(this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      const list = Array.isArray(this.formData.fieldList)
        ? this.formData.fieldList.map(normalizeFormulaRow).filter((r) => r.fieldName && String(r.formula || '').trim())
        : []
      if (!list.length) {
        this.$message.warning('请至少配置一条公式字段（可点击「编辑字段」添加）')
        return
      }
      this.$set(this.formData, 'fieldList', list)
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
.formula-config { height: 100%; }
.config-content { display: flex; flex-direction: column; padding: 20px; }
.config-tabs { margin: 0 0 8px; }
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
.secondary-btn { background: #fff; color: #606266; border-color: #dcdfe6; }
.secondary-btn:hover { background: #f5f7fa; border-color: #c0c4cc; color: #606266; }

.dialog-field-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
.dialog-field-label { font-size: 14px; color: #606266; }
.req-mark { color: #f56c6c; margin-right: 2px; }
.req-before::before { content: '*'; color: #f56c6c; margin-right: 4px; }
.hint-link-btn { padding: 0; font-size: 13px; }
.inline-help { padding: 0 0 0 4px; font-size: 12px; vertical-align: baseline; }
.help-i-header { color: #909399; margin-left: 4px; cursor: default; }
.num-in-table { width: 100%; }
</style>

<style>
.formula-fields-dialog .el-dialog__body {
  padding-top: 8px;
}
.formula-help-dialog .help-body {
  max-height: 65vh;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.65;
  color: #303133;
}
.formula-help-dialog .help-p {
  margin: 0 0 12px;
}
</style>
