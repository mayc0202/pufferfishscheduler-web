<template>
  <div class="formula-edit-container">
    <div class="header">
      <div>
        <div class="title">{{ isReadonly ? '查看公式' : (isEdit ? '编辑公式' : '新增公式') }}</div>
        <div class="subtitle">{{ isReadonly ? '查看公式基础信息与配置' : '配置公式基础信息与参数' }}</div>
      </div>
      <div class="back" @click="$router.back()">
        <i class="el-icon-back" />
        <span>返回列表</span>
      </div>
    </div>

    <div class="body">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" size="small" class="formula-form" :disabled="isReadonly">
        <!-- 基本信息 -->
        <div class="form-card">
          <div class="section-title">
            <i class="el-icon-document" />
            <span>基础信息</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="公式名称" prop="formulaName">
                <el-input v-model="form.formulaName" placeholder="请输入公式名称" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="公式编码">
                <el-input placeholder="由系统生成" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="所属分组" prop="groupId">
                <el-cascader
                  v-model="groupPath"
                  :options="groupOptions"
                  :props="{
                    expandTrigger: 'hover',
                    checkStrictly: true,
                    emitPath: true,
                    value: 'id',
                    label: 'name',
                    children: 'children'
                  }"
                  placeholder="请选择所属分组"
                  :show-all-levels="true"
                  clearable
                  style="width: 100%;"
                  @change="handleGroupChange"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="发布启用">
                <el-switch v-model="form.enabled" :disabled="isReadonly" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-form-item label="公式描述" prop="description">
                <el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入公式描述"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-divider content-position="left">公式配置</el-divider>
        <div class="form-card">
          <div class="section-title">
            <i class="el-icon-setting" />
            <span>公式配置</span>
          </div>
          <div class="formula-config-row">
            <div class="formula-config-cell">
              <el-form-item label="返回类型" prop="returnType">
                <el-select v-model="form.returnType" placeholder="请选择返回类型" class="rule-edit-std-select formula-config-field-ctrl" clearable @change="handleReturnTypeChange">
                  <el-option
                    v-for="opt in dataTypeOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </div>
            <div v-if="isDateType(form.returnType)" class="formula-config-cell">
              <el-form-item label="日期格式" prop="returnDateFormat">
                <el-select v-model="form.returnDateFormat" placeholder="请选择日期格式" class="rule-edit-std-select formula-config-field-ctrl" clearable>
                  <el-option
                    v-for="opt in dateFormatOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </div>
            <template v-if="isNumberType(form.returnType)">
              <div class="formula-config-cell">
                <el-form-item label="长度" prop="returnLength">
                  <el-input-number
                    v-model="form.returnLength"
                    :controls="false"
                    placeholder="长度"
                    size="small"
                    class="formula-config-field-ctrl formula-config-num-input"
                  />
                </el-form-item>
              </div>
              <div class="formula-config-cell">
                <el-form-item label="精度" prop="returnPrecision">
                  <el-input-number
                    v-model="form.returnPrecision"
                    :controls="false"
                    placeholder="精度"
                    size="small"
                    class="formula-config-field-ctrl formula-config-num-input"
                  />
                </el-form-item>
              </div>
            </template>
          </div>
        </div>

        <div class="form-card">
          <!-- 参数列表 -->
          <div class="section-title flex between">
            <div>
              <i class="el-icon-setting" />
              <span>参数列表</span>
            </div>
            <el-button v-if="!isReadonly" type="primary" size="mini" icon="el-icon-plus" @click="handleAddParam">添加参数</el-button>
          </div>
          <el-table :data="form.paramList" border style="width: 100%; margin-bottom: 20px;">
            <el-table-column label="参数名" min-width="120">
              <template slot-scope="scope">
                <el-input v-model="scope.row.paramName" placeholder="如: price" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="参数类型" min-width="120">
              <template slot-scope="scope">
                <el-select v-model="scope.row.paramType" placeholder="请选择类型" size="small" style="width: 100%;" clearable @change="handleParamTypeChange(scope.row)">
                  <el-option
                    v-for="opt in dataTypeOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="格式/长度/精度" min-width="220">
              <template slot-scope="scope">
                <div v-if="isDateType(scope.row.paramType)">
                  <el-select v-model="scope.row.dateFormat" placeholder="日期格式" size="small" style="width: 100%;" clearable>
                    <el-option
                      v-for="opt in dateFormatOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>
                <div v-else-if="isNumberType(scope.row.paramType)" style="display: flex; gap: 5px;">
                  <el-input-number v-model="scope.row.length" :controls="false" placeholder="长度" size="small" style="flex: 1;" />
                  <el-input-number v-model="scope.row.precision" :controls="false" placeholder="精度" size="small" style="flex: 1;" />
                </div>
                <div v-else style="color: #999; font-size: 12px; text-align: center;">-</div>
              </template>
            </el-table-column>
            <el-table-column label="允许为空" width="88" align="center">
              <template slot-scope="scope">
                <el-tooltip content="关闭表示该参数必填（不可为空）" placement="top">
                  <el-switch
                    :value="scope.row.isRequired !== true"
                    @change="(allowNull) => $set(scope.row, 'isRequired', !allowNull)"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="描述" min-width="150">
              <template slot-scope="scope">
                <el-input v-model="scope.row.description" placeholder="如: 商品原价" size="small" />
              </template>
            </el-table-column>
            <el-table-column v-if="!isReadonly" label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleRemoveParam(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="form-card">
          <!-- 计算公式 -->
          <div class="section-title flex between">
            <div>
              <i class="el-icon-edit-outline" />
              <span>计算公式 (MVEL表达式)</span>
            </div>
          </div>

          <!-- 顶部横向排列：左侧运算符，右侧提示 -->
          <div class="formula-top-panels">
            <!-- 快捷操作栏：参数固定；运算符由 GET /microscopic/operatorPanel.do 动态渲染 -->
            <div v-if="!isReadonly" class="formula-toolbar">
              <div v-if="validParameters.length > 0" class="toolbar-group">
                <span class="group-label">参数:</span>
                <div class="group-content">
                  <el-button v-for="p in validParameters" :key="p" size="mini" plain @click="insertText(p)">{{ p }}</el-button>
                </div>
              </div>
              <div v-if="operatorPanelTitle && operatorPanelGroups.length" class="operator-panel-title">{{ operatorPanelTitle }}</div>
              <div
                v-for="(g, gIdx) in operatorPanelGroups"
                v-show="g.operators && g.operators.length"
                :key="g.code || g.name || ('opg-' + gIdx)"
                class="toolbar-group"
              >
                <span class="group-label">{{ g.name }}:</span>
                <div class="group-content">
                  <template v-for="op in g.operators">
                    <el-tooltip
                      v-if="op === '+'"
                      :key="(g.code || '') + '-' + op + '-tip'"
                      content="加法；字符串也可用 + 连接"
                      placement="top"
                    >
                      <el-button size="mini" plain @click="insertOperatorToken(op)">{{ operatorButtonLabel(op) }}</el-button>
                    </el-tooltip>
                    <el-button
                      v-else
                      :key="(g.code || '') + '-' + op"
                      size="mini"
                      plain
                      @click="insertOperatorToken(op)"
                    >{{ operatorButtonLabel(op) }}</el-button>
                  </template>
                </div>
              </div>
              <div v-if="!isReadonly && operatorPanelLoading" class="operator-panel-loading">加载运算符面板…</div>
            </div>

            <!-- 编写说明 -->
            <div v-if="builtinTips.length" class="formula-tips">
              <div class="formula-tips-head">
                <i class="el-icon-info" />
                <span>编写说明</span>
              </div>
              <ul class="formula-tips-list">
                <li v-for="(tip, ti) in builtinTips" :key="'builtin-tip-' + ti">{{ tip }}</li>
              </ul>
            </div>
          </div>

          <div v-if="!isReadonly && builtinTemplatesLoading" class="builtin-template-loading">正在加载内置公式模板…</div>
          <!-- 后端内置公式模板 / 帮助说明 -->
          <div v-if="builtinTemplateGroups.length" class="builtin-template-wrapper" :class="{ readonly: isReadonly }">
            <el-collapse v-model="outerBuiltinPanelActive" class="outer-collapse">
              <el-collapse-item name="templates">
                <template slot="title">
                  <span class="outer-collapse-title">公式模板</span>
                </template>
                <div class="builtin-template-panel">
                  <el-collapse v-model="builtinPanelActive" accordion>
                    <el-collapse-item
                      v-for="(g, gi) in builtinTemplateGroups"
                      :key="gi + '-' + (g.groupName || 'g')"
                      :name="String(gi)"
                      :title="g.groupName || '模板'"
                    >
                      <div class="builtin-item-list">
                        <div
                          v-for="(it, ii) in g.items"
                          :key="ii + (it.name || '') + (it.syntax || '')"
                          class="builtin-item"
                        >
                          <div class="builtin-item-head">
                            <span class="builtin-name">{{ it.name || '未命名' }}</span>
                            <el-button
                              v-if="!isReadonly && it.syntax"
                              type="text"
                              size="mini"
                              @click="insertTemplateSyntax(it)"
                            >插入</el-button>
                          </div>
                          <pre v-if="it.syntax" class="builtin-syntax" @click="onBuiltinSyntaxClick(it)">{{ it.syntax }}</pre>
                          <div v-if="it.example" class="builtin-example">例：{{ it.example }}</div>
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
          <div v-else-if="!isReadonly && !builtinTemplatesLoading" class="builtin-template-empty">内置模板暂不可用，仍可使用上方快捷键输入</div>
          <div class="formula-expression-block">
            <el-form-item label-width="0" prop="expression" class="formula-expression-item">
              <el-input
                ref="expressionInput"
                v-model="form.expression"
                type="textarea"
                :rows="6"
                placeholder="在此输入 MVEL 表达式；可从上方运算符、内置模板插入片段"
                class="code-input"
              />
            </el-form-item>
          </div>
        </div>

        <div class="form-footer">
          <el-button v-if="!isReadonly" @click="handleTest">测试</el-button>
          <el-button v-if="!isReadonly" type="primary" @click="handleSave">保存</el-button>
          <el-button @click="$router.back()">{{ isReadonly ? '返回' : '取消' }}</el-button>
        </div>
      </el-form>
    </div>

    <!-- 测试弹窗：可拖动标题栏；custom-class 用于下移（挂 body，需非 scoped 样式） -->
    <el-dialog
      v-el-drag-dialog
      title="公式测试"
      :visible.sync="testDialogVisible"
      width="720px"
      custom-class="formula-test-dialog"
      append-to-body
      :modal-append-to-body="true"
      :close-on-click-modal="false"
    >
      <el-form label-width="160px" size="small" class="formula-test-form">
        <el-form-item v-for="(param, index) in form.paramList" :key="index" :label="param.paramName + ':'">
          <el-input v-model="testParams[param.paramName]" placeholder="请输入测试参数" />
        </el-form-item>
        <el-divider />
        <el-form-item label="计算结果:">
          <div class="test-result">{{ testResult }}</div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="testDialogVisible = false">关闭</el-button>
        <el-button type="primary" size="small" :loading="testing" @click="submitTest">测试</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { tree } from '@/api/collect/formula/formulaGroup'
import { getDict } from '@/api/dict/dict'
import dictCode from '@/api/dict/dictCode'
import { detail, addFormula, updateFormula, testFormula, getBuiltinTemplates, getOperatorPanel } from '@/api/collect/formula/formula'

export default {
  name: 'DataCleanFormulaEdit',
  data() {
    return {
      isEdit: false,
      isReadonly: false,
      groupOptions: [],
      groupPath: [],
      dataTypeOptions: [],
      dateFormatOptions: [],
      numberFormatOptions: [],
      form: {
        formulaId: null,
        formulaName: '',
        groupId: null,
        enabled: true,
        returnType: null,
        returnLength: undefined,
        returnPrecision: undefined,
        returnDateFormat: '',
        returnNumberFormat: '',
        description: '',
        expression: '',
        paramList: []
      },
      rules: {
        formulaName: [{ required: true, message: '请输入公式名称', trigger: 'blur' }],
        groupId: [{ required: true, message: '请选择所属分组', trigger: 'change' }],
        returnType: [{ required: true, message: '请选择返回类型', trigger: 'change' }],
        expression: [{ required: true, message: '请输入计算公式', trigger: 'blur' }]
      },
      testDialogVisible: false,
      testParams: {},
      testResult: '',
      testing: false,
      /** GET /microscopic/builtin.do 归一化后的分组模板 */
      builtinTemplateGroups: [],
      /** GET /microscopic/builtin.do 返回的 tips 提示文案 */
      builtinTips: [],
      outerBuiltinPanelActive: [], // 外层"公式模板"折叠面板，默认不展开
      builtinPanelActive: '0',
      builtinTemplatesLoading: false,
      /** GET /microscopic/operatorPanel.do */
      operatorPanelTitle: '',
      operatorPanelGroups: [],
      operatorPanelLoading: false
    }
  },

  computed: {
    validParameters() {
      return (this.form.paramList || []).map(p => p.paramName).filter(name => name && name.trim() !== '')
    }
  },
  created() {
    this.queryDataTypeDict()
    this.queryDateFormatDict()
    this.queryNumberFormatDict()
    const { id, readonly } = this.$route.query
    if (id) {
      this.isEdit = true
      if (readonly === 'true') {
        this.isReadonly = true
      }
      this.loadDetail(id)
    } else {
      // 默认添加一个参数示例
      this.form.paramList.push({ paramName: '', paramType: null, description: '', dateFormat: '', numberFormat: '', length: undefined, precision: undefined, isRequired: false })
    }
    this.loadGroupTree()
    this.loadBuiltinTemplates()
    this.loadOperatorPanel()
  },
  methods: {
    loadOperatorPanel() {
      this.operatorPanelLoading = true
      return getOperatorPanel()
        .then((res) => {
          const d = res && res.data
          this.operatorPanelTitle = (d && d.panelTitle) ? String(d.panelTitle) : '运算符面板'
          const groups = d && d.groups
          this.operatorPanelGroups = Array.isArray(groups)
            ? groups.map((g) => ({
              code: g && (g.code != null ? String(g.code) : ''),
              name: g && (g.name != null ? String(g.name) : '运算符'),
              operators: Array.isArray(g && g.operators) ? g.operators.map((o) => String(o)) : []
            }))
            : []
        })
        .catch(() => {
          this.operatorPanelTitle = ''
          this.operatorPanelGroups = []
        })
        .finally(() => {
          this.operatorPanelLoading = false
        })
    },
    /** 按钮上展示的符号（与接口 operators 一一对应，可美化为全角/符号） */
    operatorButtonLabel(op) {
      if (op == null) return ''
      const s = String(op)
      const m = { '+': '＋', '-': '－', '*': '✖', '/': '／', '%': '％', '?:': '? :' }
      if (m[s] != null) return m[s]
      if (s.toLowerCase() === 'contains') return 'contains'
      return s
    },
    /**
     * 将接口中的运算符 token 插入为合法 MVEL 片段
     */
    insertOperatorToken(op) {
      if (this.isReadonly || op == null) return
      const s = String(op).trim()
      if (s === '()') {
        this.insertParens()
        return
      }
      if (s.toLowerCase() === 'contains') {
        this.insertContains()
        return
      }
      if (s === '?:') {
        this.insertText(' ? : ')
        return
      }
      if (s === '!') {
        this.insertText(' !')
        return
      }
      const withSpaces = new Set(['+', '-', '*', '/', '%', '==', '!=', '>', '<', '>=', '<=', '&&', '||'])
      if (withSpaces.has(s)) {
        this.insertText(' ' + s + ' ')
        return
      }
      this.insertText(s)
    },
    /**
     * 在 MVEL 表达式中插入内容；insertedCaretOffset 为插入后光标在「本次插入的文本」中的偏移量（0 为插入块开头）
     */
    insertText(text, insertedCaretOffset) {
      if (this.isReadonly) return
      const inputRef = this.$refs.expressionInput
      if (!inputRef) {
        this.form.expression = (this.form.expression || '') + text
        return
      }
      const textarea = inputRef.$refs.textarea
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const currentExpr = this.form.expression || ''
        this.form.expression = currentExpr.substring(0, start) + text + currentExpr.substring(end)
        const caret = typeof insertedCaretOffset === 'number'
          ? start + Math.min(Math.max(0, insertedCaretOffset), text.length)
          : start + text.length
        this.$nextTick(() => {
          textarea.focus()
          textarea.selectionStart = textarea.selectionEnd = caret
        })
      } else {
        this.form.expression = (this.form.expression || '') + text
      }
    },
    insertParens() {
      this.insertText('()', 1)
    },
    /** 插入 .contains('') 并把光标放在引号之间 */
    insertContains() {
      this.insertText(".contains('')", 11)
    },
    /** 从内置模板插入 syntax；与 API 中 dateFuncs、示例一致 */
    insertTemplateSyntax(item) {
      if (this.isReadonly || !item) return
      const s = item.syntax != null ? String(item.syntax) : ''
      if (!s) return
      if (s.trim() === ".contains('')") {
        this.insertContains()
        return
      }
      this.insertText(s)
    },
    onBuiltinSyntaxClick(item) {
      if (this.isReadonly) return
      this.insertTemplateSyntax(item)
    },
    normalizeBuiltinItems(list) {
      if (!Array.isArray(list)) return []
      return list
        .map((it) => {
          if (!it) return null
          const name = it.name != null ? String(it.name)
            : (it.label != null ? String(it.label) : (it.title != null ? String(it.title) : ''))
          const syntax = it.syntax != null ? String(it.syntax)
            : (it.template != null ? String(it.template) : (it.code != null ? String(it.code) : ''))
          if (!syntax) return null
          const example = it.example != null ? String(it.example)
            : (it.desc != null ? String(it.desc) : (it.description != null ? String(it.description) : ''))
          return { name, syntax, example }
        })
        .filter(Boolean)
    },
    normalizeBuiltinTips(data) {
      if (data == null || typeof data !== 'object' || Array.isArray(data)) return []
      const t = data.tips
      if (!Array.isArray(t)) return []
      return t.map(s => (s != null ? String(s).trim() : '')).filter(Boolean)
    },
    normalizeBuiltinData(data) {
      if (data == null) return []
      if (typeof data === 'object' && !Array.isArray(data) && data.items && !data.groups) {
        const one = {
          groupName: data.groupName || data.name || '内置公式模板',
          items: this.normalizeBuiltinItems(data.items)
        }
        return one.items.length ? [one] : []
      }
      if (Array.isArray(data)) {
        return data
          .map((g) => ({
            groupName: (g && (g.groupName || g.name || g.title || g.label || g.group)) != null
              ? String((g && (g.groupName || g.name || g.title || g.label || g.group)) || '模板') : '模板',
            items: this.normalizeBuiltinItems(g && (g.items || g.templates || g.list || g.children))
          }))
          .filter((g) => (g.items && g.items.length))
      }
      if (typeof data === 'object') {
        if (Array.isArray(data.groups)) {
          return this.normalizeBuiltinData(data.groups)
        }
        return Object.keys(data).map((k) => ({
          groupName: k,
          items: this.normalizeBuiltinItems(data[k])
        })).filter((g) => (g.items && g.items.length))
      }
      return []
    },
    loadBuiltinTemplates() {
      this.builtinTemplatesLoading = true
      return getBuiltinTemplates()
        .then((res) => {
          const raw = res && res.data
          this.builtinTips = this.normalizeBuiltinTips(raw)
          this.builtinTemplateGroups = this.normalizeBuiltinData(raw)
        })
        .catch(() => {
          this.builtinTemplateGroups = []
          this.builtinTips = []
        })
        .finally(() => {
          this.builtinTemplatesLoading = false
        })
    },

    async queryDateFormatDict() {
      try {
        const res = await getDict(dictCode.DATE_FORMAT)
        const items = Array.isArray(res && res.data) ? res.data : []
        this.dateFormatOptions = items
          .map(item => {
            const labelRaw = item && (item.name ?? item.label ?? item.value ?? item.code)
            const valueRaw = item && (item.code ?? item.id ?? item.value)
            if (valueRaw == null || labelRaw == null) return null
            return { value: String(valueRaw), label: String(labelRaw) }
          })
          .filter(Boolean)
      } catch (e) {
        this.dateFormatOptions = []
      }
    },
    async queryNumberFormatDict() {
      try {
        const res = await getDict(dictCode.NUMBER_FORMAT)
        const items = Array.isArray(res && res.data) ? res.data : []
        this.numberFormatOptions = items
          .map(item => {
            const labelRaw = item && (item.name ?? item.label ?? item.value ?? item.code)
            const valueRaw = item && (item.code ?? item.id ?? item.value)
            if (valueRaw == null || labelRaw == null) return null
            return { value: String(valueRaw), label: String(labelRaw) }
          })
          .filter(Boolean)
      } catch (e) {
        this.numberFormatOptions = []
      }
    },
    isDateType(type) {
      if (!type) return false
      const opt = this.dataTypeOptions.find(o => o.value === String(type))
      const t = opt ? String(opt.label).toLowerCase() : String(type).toLowerCase()
      return t.includes('date') || t.includes('time') || t.includes('timestamp')
    },
    isNumberType(type) {
      if (!type) return false
      const opt = this.dataTypeOptions.find(o => o.value === String(type))
      const t = opt ? String(opt.label).toLowerCase() : String(type).toLowerCase()
      return ['decimal', 'bigdecimal', 'bignumber', 'number', 'numeric'].includes(t)
    },
    handleReturnTypeChange() {
      this.form.returnDateFormat = ''
      this.form.returnNumberFormat = ''
      this.form.returnLength = undefined
      this.form.returnPrecision = undefined
    },
    handleParamTypeChange(row) {
      row.dateFormat = ''
      row.numberFormat = ''
      row.length = undefined
      row.precision = undefined
    },
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
    loadGroupTree() {
      return tree().then(res => {
        this.groupOptions = this.formatToCascader(res.data || [])
        this.$nextTick(() => this.syncGroupCascaderPath())
      })
    },
    formatToCascader(data) {
      return (data || [])
        .filter(item => item && item.type === 'GROUP')
        .map(item => {
          const formattedItem = {
            id: item.id,
            name: item.name
          }
          if (Array.isArray(item.children) && item.children.length > 0) {
            const children = this.formatToCascader(item.children)
            if (children.length) {
              formattedItem.children = children
            }
          }
          return formattedItem
        })
    },
    sameGroupId(a, b) {
      if (a == null || b == null) return false
      return String(a) === String(b)
    },
    findParentPath(options, targetId) {
      for (const option of options || []) {
        if (this.sameGroupId(option.id, targetId)) {
          return [option.id]
        }
        if (Array.isArray(option.children) && option.children.length > 0) {
          const path = this.findParentPath(option.children, targetId)
          if (path.length > 0) {
            return [option.id, ...path]
          }
        }
      }
      return []
    },
    /** 详情里的 groupId 与级联树异步加载，需在树与 form.groupId 都就绪后回显路径 */
    syncGroupCascaderPath() {
      const gid = this.form && this.form.groupId
      if (gid == null || String(gid) === '') {
        this.groupPath = []
        return
      }
      if (!this.groupOptions || !this.groupOptions.length) {
        return
      }
      const path = this.findParentPath(this.groupOptions, gid)
      this.groupPath = path.length ? path : []
    },
    parseEnabledFromDetail(data) {
      if (!data || typeof data !== 'object') return true
      if (data.status != null) {
        const s = data.status
        if (typeof s === 'boolean') return s
        const str = String(s)
        return str === '1' || str.toLowerCase() === 'true'
      }
      if (data.enabled != null) return Boolean(data.enabled)
      return true
    },
    /** 与后端 paramList.isRequired 对齐：true 为必填，其余视为允许为空 */
    normalizeParamListFromDetail(list) {
      if (!Array.isArray(list)) return []
      return list.map((p) => {
        if (!p || typeof p !== 'object') {
          return { paramName: '', paramType: null, description: '', dateFormat: '', numberFormat: '', length: undefined, precision: undefined, isRequired: false }
        }
        const v = p.isRequired
        const isRequired = v === true || v === 1 || (typeof v === 'string' && ['1', 'true', 'yes'].includes(v.toLowerCase()))
        return { ...p, isRequired }
      })
    },
    loadDetail(id) {
      detail(id).then(res => {
        if (res && res.data) {
          this.form = {
            formulaId: res.data.formulaId || res.data.id,
            formulaName: res.data.formulaName || res.data.name,
            groupId: res.data.groupId != null ? res.data.groupId : null,
            enabled: this.parseEnabledFromDetail(res.data),
            returnType: res.data.returnType != null ? res.data.returnType : null,
            returnLength: res.data.returnLength,
            returnPrecision: res.data.returnPrecision,
            returnDateFormat: res.data.returnDateFormat || '',
            returnNumberFormat: res.data.returnNumberFormat || '',
            description: res.data.description || '',
            expression: res.data.expression || '',
            paramList: this.normalizeParamListFromDetail(
              Array.isArray(res.data.paramList)
                ? res.data.paramList
                : (Array.isArray(res.data.parameters) ? res.data.parameters : [])
            )
          }
          this.$nextTick(() => this.syncGroupCascaderPath())
        }
      })
    },
    handleGroupChange(val) {
      if (val && val.length > 0) {
        this.form.groupId = val[val.length - 1]
      } else {
        this.form.groupId = null
      }
    },
    handleAddParam() {
      this.form.paramList.push({
        paramName: '',
        paramType: null,
        description: '',
        dateFormat: '',
        numberFormat: '',
        length: undefined,
        precision: undefined,
        isRequired: false
      })
    },
    handleRemoveParam(index) {
      this.form.paramList.splice(index, 1)
    },
    handleTest() {
      if (!this.form.expression) {
        this.$message.warning('请先输入计算公式')
        return
      }
      // 初始化测试参数
      this.testParams = {}
      this.form.paramList.forEach(p => {
        if (p.paramName) {
          this.$set(this.testParams, p.paramName, '')
        }
      })
      this.testResult = ''
      this.testDialogVisible = true
    },
    submitTest() {
      this.testing = true
      const formulaPayload = {
        expression: this.form.expression,
        paramList: this.form.paramList,
        returnType: this.form.returnType,
        returnDateFormat: this.form.returnDateFormat,
        returnNumberFormat: this.form.returnNumberFormat,
        returnValueLength: this.form.returnLength,
        returnValuePrecision: this.form.returnPrecision
      }
      const testData = {
        expression: this.form.expression,
        parameters: this.form.paramList,
        paramList: this.form.paramList,
        formula: formulaPayload,
        testInputs: this.testParams
      }
      testFormula(testData).then(res => {
        this.testing = false
        if (res && res.data !== undefined) {
          this.testResult = String(res.data)
          this.$message.success('测试成功')
        }
      }).catch(() => {
        this.testing = false
      })
    },
    handleSave() {
      this.$refs.form.validate(valid => {
        if (!valid) return

        // 验证参数
        const paramNames = new Set()
        for (let i = 0; i < this.form.paramList.length; i++) {
          const p = this.form.paramList[i]
          if (!p.paramName) {
            this.$message.warning(`第 ${i + 1} 个参数名不能为空`)
            return
          }
          if (paramNames.has(p.paramName)) {
            this.$message.warning(`参数名 "${p.paramName}" 重复`)
            return
          }
          paramNames.add(p.paramName)
        }

        const api = this.isEdit ? updateFormula : addFormula
        const payload = {
          ...this.form,
          enabled: this.form.enabled,
          status: Boolean(this.form.enabled)
        }
        api(payload).then(res => {
          this.$message.success('保存成功')
          this.handleCancel()
        })
      })
    },
    handleCancel() {
      this.$router.push({ path: '/basic-config/formula' })
    }
  }
}
</script>

<style lang="scss" scoped>
.formula-edit-container {
  height: 100%;
  background: linear-gradient(180deg, #f6f8fc 0%, #f2f5fa 100%);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 16px 0;
  padding: 14px 18px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #eef2f8;
  box-shadow: 0 4px 16px rgba(30, 60, 120, 0.06);

  .title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    line-height: 24px;
  }

  .subtitle {
    margin-top: 4px;
    color: #909399;
    font-size: 12px;
  }

  .back {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: #409eff;
    font-size: 13px;
    padding: 6px 10px;
    border-radius: 6px;
    transition: all 0.2s;

    span {
      margin-left: 4px;
    }

    &:hover {
      background: #ecf5ff;
    }
  }
}

.body {
  flex: 1;
  padding: 12px 16px 16px;
  overflow: auto;
}

.formula-form {
  background: #fff;
  padding: 18px 20px 10px;
  border-radius: 8px;
  border: 1px solid #eef2f8;
  box-shadow: 0 6px 20px rgba(30, 60, 120, 0.06);
}

.form-card {
  padding: 14px 14px 2px;
  margin-bottom: 10px;
  border: 1px solid #edf1f7;
  border-radius: 8px;
  background: #fcfdff;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.flex.between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.danger-text {
  color: #f56c6c;
}

.code-input ::v-deep textarea {
  font-family: Consolas, Monaco, monospace;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.test-result {
  min-height: 32px;
  padding: 5px 15px;
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
  color: #67c23a;
  font-weight: bold;
}

.formula-test-form ::v-deep .el-form-item__label {
  word-break: break-all;
  line-height: 1.4;
}

.formula-form ::v-deep .el-form-item {
  margin-bottom: 18px;
}

.formula-form ::v-deep .el-input__inner,
.formula-form ::v-deep .el-textarea__inner {
  border-radius: 6px;
}

.formula-form ::v-deep .el-divider--horizontal {
  margin: 14px 0;
}

.form-footer {
  margin-top: 12px;
  padding: 12px 0 4px;
  border-top: 1px solid #edf1f7;
  text-align: right;
}

.rule-edit-std-select {
  width: 260px;
  max-width: 100%;
}

/* 公式配置：返回类型、日期格式、长度、精度同一行；各列等分，控件宽度与返回类型下拉一致 */
.formula-config-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
}

.formula-config-cell {
  flex: 1;
  min-width: 0;
}

/* 仅「返回类型」时与原先 el-col :span="8" 一致，不占满整行 */
.formula-config-row > .formula-config-cell:only-child {
  flex: 0 0 33.333333%;
  max-width: 33.333333%;
}

.formula-config-cell ::v-deep .el-form-item {
  margin-bottom: 0;
}

.formula-config-field-ctrl {
  width: 100%;
  max-width: 100%;
}

.formula-config-row .rule-edit-std-select {
  width: 100%;
  max-width: 100%;
}

.formula-config-num-input ::v-deep .el-input {
  width: 100%;
}

.formula-config-num-input ::v-deep .el-input__inner {
  text-align: left;
}

.formula-top-panels {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: stretch;
}

.formula-toolbar {
  flex: 0 0 auto;
  min-width: 360px;
  background-color: #f8faff;
  border: 1px solid #edf2fb;
  border-radius: 4px;
  padding: 12px;
}
.toolbar-group {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
}
.toolbar-group:last-child {
  margin-bottom: 0;
}
.group-label {
  font-size: 13px;
  color: #606266;
  width: 70px;
  min-width: 70px;
  text-align: right;
  margin-right: 10px;
  font-weight: bold;
  line-height: 28px;
}
.group-content {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.formula-toolbar .el-button {
  margin-left: 0 !important;
  padding: 6px 12px;
}

.operator-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #31415f;
  margin: 4px 0 8px;
  padding-left: 2px;
}
.operator-panel-loading {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.builtin-template-loading {
  font-size: 12px;
  color: #909399;
  margin: 0 0 10px;
}
.builtin-template-empty {
  font-size: 12px;
  color: #909399;
  margin: 0 0 10px;
}
.formula-tips {
  flex: 1;
  margin: 0;
  padding: 12px 16px;
  background-color: #f4f9ff;
  border-radius: 6px;
  border: 1px solid #e6f1fc;
}
.formula-tips-head {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}
.formula-tips-head i {
  margin-right: 6px;
  font-size: 15px;
}
.formula-tips-list {
  margin: 0;
  padding: 0 0 0 20px;
  color: #606266;
  font-size: 12px;
  line-height: 1.8;
}
.formula-tips-list li {
  list-style-type: disc;
  margin-bottom: 2px;
}
.formula-tips-list li::marker {
  color: #a0cfff;
}
.formula-tips-list li:last-child {
  margin-bottom: 0;
}

.builtin-template-wrapper {
  margin-bottom: 16px;
  border: 1px solid #edf2fb;
  border-radius: 6px;
  background: #fcfdff;
  overflow: hidden;
}
.outer-collapse {
  border: none;
}
.outer-collapse ::v-deep .el-collapse-item__header {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  padding: 0 16px;
  height: 44px;
  line-height: 44px;
  background-color: #f8faff;
  border-bottom: none;
}
.outer-collapse ::v-deep .el-collapse-item__header.is-active {
  border-bottom: 1px solid #edf2fb;
}
.outer-collapse ::v-deep .el-collapse-item__wrap {
  border-bottom: none;
}
.outer-collapse ::v-deep .el-collapse-item__content {
  padding: 12px;
}

.builtin-template-panel {
  border: 1px solid #edf2fb;
  border-radius: 6px;
  overflow: hidden;
}
.builtin-template-panel ::v-deep .el-collapse-item__header {
  font-weight: 600;
  color: #31415f;
  font-size: 13px;
  padding: 0 12px;
  height: 40px;
  line-height: 40px;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
}
.builtin-template-panel ::v-deep .el-collapse-item__header.is-active {
  border-bottom: 1px solid #ebeef5;
}
.builtin-template-panel ::v-deep .el-collapse-item__wrap {
  border-bottom: 1px solid #ebeef5;
}
.builtin-template-panel ::v-deep .el-collapse-item:last-child .el-collapse-item__wrap {
  border-bottom: none;
}
.builtin-template-panel ::v-deep .el-collapse-item__content {
  padding: 12px 12px 16px 12px;
}

.builtin-item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.builtin-item {
  border: 1px solid #e8edf5;
  border-radius: 6px;
  padding: 8px 10px;
  background: #fff;
}
.builtin-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.builtin-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}
.builtin-syntax {
  margin: 4px 0 0;
  padding: 8px 10px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #1e3a5f;
  white-space: pre-wrap;
  word-break: break-all;
  cursor: text;
  user-select: text;
}
.builtin-template-wrapper:not(.readonly) .builtin-syntax {
  cursor: pointer;
}
.builtin-template-wrapper:not(.readonly) .builtin-syntax:hover {
  background: #e8f1ff;
}
.builtin-example {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
  line-height: 1.4;
}
.formula-expression-block {
  margin-top: 2px;
}
.formula-expression-item {
  margin-bottom: 0 !important;
}
.formula-expression-block ::v-deep .el-textarea__inner {
  min-height: 120px;
  font-family: Consolas, Monaco, monospace;
  background-color: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
  transition: all 0.2s;
}
.formula-expression-block ::v-deep .el-textarea__inner:focus {
  border-color: #409eff;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}
</style>

<!-- append-to-body 的 el-dialog 不在组件根下，scoped 无法命中 custom-class -->
<style lang="scss">
.el-dialog.formula-test-dialog:not(.is-fullscreen) {
  margin-top: clamp(48px, 12vh, 140px) !important;
}
</style>
