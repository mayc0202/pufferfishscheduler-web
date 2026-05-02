<template>
  <el-dialog
    :visible.sync="visibleProxy"
    :title="isEdit ? '编辑质检规则' : '新增质检规则'"
    width="820px"
    top="6vh"
    custom-class="qualiteval-rule-dialog"
    :close-on-click-modal="false"
    append-to-body
    @open="onOpen"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="108px" size="small" class="rule-form-body">
      <div class="section-title">基本信息</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="规则名称" prop="ruleName">
            <el-input v-model="form.ruleName" placeholder="请输入规则名称" clearable prefix-icon="el-icon-edit-outline" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属模型" prop="modelId">
            <el-select v-model="form.modelId" placeholder="请选择质检模型" filterable style="width:100%">
              <el-option v-for="m in modelOptions" :key="m.id" :label="m.name" :value="m.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="目标表名">
            <el-input v-model="form.tableName" placeholder="可选，如 dwd.order" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="目标字段">
            <el-input v-model="form.fieldName" placeholder="可选，与下方内置规则字段可二选一" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="section-title">规则配置</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="规则类型" prop="ruleType">
            <el-select v-model="form.ruleType" placeholder="请选择规则类型" style="width:100%" @change="onRuleTypeChange">
              <el-option-group v-for="grp in typeGroups" :key="grp.label" :label="grp.label">
                <el-option v-for="opt in grp.options" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="严重程度" prop="severity">
            <el-select v-model="form.severity" style="width:100%">
              <el-option label="错误（ERROR）" value="ERROR" />
              <el-option label="警告（WARN）" value="WARN" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <builtin-rule-form v-if="isBuiltin" v-model="form.ruleConfig" :rule-type="form.ruleType" />
      <div v-else class="expr-panel">
        <java-rule-form v-if="form.ruleType === 'JAVA'" v-model="form.expression" />
        <mvel-rule-form v-else-if="form.ruleType === 'MVEL'" v-model="form.expression" />
        <sql-rule-form v-else-if="form.ruleType === 'SQL'" v-model="form.expression" />
        <el-form-item v-else label="规则表达式">
          <el-input v-model="form.expression" type="textarea" :rows="6" placeholder="请先选择规则类型" />
        </el-form-item>
      </div>

      <el-form-item label="修复建议">
        <el-input v-model="form.fixSuggestion" type="textarea" :rows="2" placeholder="可选，问题数据展示时的修复提示" />
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="visibleProxy = false">取消</el-button>
      <el-button :loading="testLoading" @click="handleTestRule">测试规则</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { testRule } from '@/api/qualiteval/rule'
import BuiltinRuleForm from './components/RuleConfigForm/BuiltinRuleForm.vue'
import JavaRuleForm from './components/RuleConfigForm/JavaRuleForm.vue'
import MvelRuleForm from './components/RuleConfigForm/MvelRuleForm.vue'
import SqlRuleForm from './components/RuleConfigForm/SqlRuleForm.vue'
import { RULE_TYPE_GROUPS, isBuiltinRuleType } from './ruleConstants'

export default {
  name: 'QualitevalRuleForm',
  components: { BuiltinRuleForm, JavaRuleForm, MvelRuleForm, SqlRuleForm },
  props: {
    visible: { type: Boolean, default: false },
    value: { type: Object, default: () => ({}) },
    modelOptions: { type: Array, default: () => [] },
    ruleTypeOptions: { type: Array, default: () => [] }
  },
  data() {
    return {
      testLoading: false,
      form: this.emptyForm(),
      rules: {
        modelId: [{ required: true, message: '请选择模型', trigger: 'change' }],
        ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
        ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }]
      }
    }
  },
  computed: {
    visibleProxy: {
      get() {
        return this.visible
      },
      set(v) {
        this.$emit('update:visible', v)
      }
    },
    isEdit() {
      return !!this.form.id
    },
    isBuiltin() {
      return isBuiltinRuleType(this.form.ruleType)
    },
    typeGroups() {
      const base = JSON.parse(JSON.stringify(RULE_TYPE_GROUPS))
      const codes = new Set()
      base.forEach((g) => g.options.forEach((o) => codes.add(o.value)))
      const api = this.ruleTypeOptions || []
      const extra = api
        .map((i) => ({
          label: i.label || i.value || i.code,
          value: i.value || i.code
        }))
        .filter((o) => o.value && !codes.has(o.value))
      if (extra.length) {
        base.push({ label: '接口扩展', options: extra })
      }
      return base
    }
  },
  watch: {
    value: {
      immediate: true,
      deep: true,
      handler(v) {
        this.applyValue(v)
      }
    }
  },
  methods: {
    emptyForm() {
      return {
        id: null,
        modelId: '',
        ruleName: '',
        ruleType: '',
        severity: 'ERROR',
        expression: '',
        ruleConfig: {},
        tableName: '',
        fieldName: '',
        fixSuggestion: ''
      }
    },
    applyValue(v) {
      const rc = v && v.ruleConfig != null ? v.ruleConfig : (v && v.rule_config != null ? v.rule_config : {})
      this.form = {
        id: v && v.id ? v.id : null,
        modelId: v && v.modelId != null ? v.modelId : '',
        ruleName: v && (v.ruleName || v.name) ? (v.ruleName || v.name) : '',
        ruleType: v && v.ruleType ? v.ruleType : '',
        severity: v && v.severity ? v.severity : 'ERROR',
        expression: v && v.expression ? v.expression : '',
        ruleConfig: rc && typeof rc === 'object' ? { ...rc } : {},
        tableName: v && (v.tableName || v.table_name) ? (v.tableName || v.table_name) : '',
        fieldName: v && (v.fieldName || v.field_name) ? (v.fieldName || v.field_name) : '',
        fixSuggestion: v && (v.fixSuggestion || v.fix_suggestion) ? (v.fixSuggestion || v.fix_suggestion) : ''
      }
    },
    onOpen() {
      this.$nextTick(() => {
        if (this.$refs.formRef) this.$refs.formRef.clearValidate()
      })
    },
    onRuleTypeChange() {
      this.form.ruleConfig = {}
      this.form.expression = ''
    },
    handleTestRule() {
      this.$refs.formRef.validate(async(valid) => {
        if (!valid) return
        this.testLoading = true
        try {
          await testRule({
            modelId: this.form.modelId,
            ruleType: this.form.ruleType,
            tableName: this.form.tableName || undefined,
            fieldName: this.form.fieldName || undefined,
            expression: this.form.expression || undefined,
            ruleConfig: this.isBuiltin ? this.form.ruleConfig : undefined,
            severity: this.form.severity,
            fixSuggestion: this.form.fixSuggestion || undefined
          })
          this.$message.success('测试通过')
        } catch (e) {
          this.$message.error((e && e.message) || '测试失败')
        } finally {
          this.testLoading = false
        }
      })
    },
    handleSubmit() {
      this.$refs.formRef.validate((valid) => {
        if (!valid) return
        this.$emit('submit', {
          id: this.form.id,
          modelId: this.form.modelId,
          ruleName: this.form.ruleName,
          ruleType: this.form.ruleType,
          severity: this.form.severity,
          expression: this.form.expression,
          ruleConfig: this.isBuiltin ? this.form.ruleConfig : null,
          tableName: this.form.tableName || undefined,
          fieldName: this.form.fieldName || undefined,
          fixSuggestion: this.form.fixSuggestion || undefined
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f3358;
  margin: 8px 0 14px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
  line-height: 1.2;
}
.expr-panel {
  padding: 4px 0 8px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.rule-form-body ::v-deep .el-form-item {
  margin-bottom: 16px;
}
</style>

<style lang="scss">
/* 弹窗全局样式（非 scoped，对应 custom-class） */
.qualiteval-rule-dialog .el-dialog {
  border-radius: 12px;
  overflow: hidden;
}
.qualiteval-rule-dialog .el-dialog__header {
  background: #f8faff;
  border-bottom: 1px solid #e9eef8;
  padding: 16px 20px;
}
.qualiteval-rule-dialog .el-dialog__title {
  color: #1f3358;
  font-weight: 600;
  font-size: 16px;
}
.qualiteval-rule-dialog .el-dialog__body {
  padding: 16px 20px 8px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}
.qualiteval-rule-dialog .el-dialog__footer {
  border-top: 1px solid #e9eef8;
  padding: 12px 20px;
  background: #fafbfd;
}
</style>
