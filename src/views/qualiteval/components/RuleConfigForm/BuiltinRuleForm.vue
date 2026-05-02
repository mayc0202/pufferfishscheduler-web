<template>
  <div class="builtin-panel">
    <p class="panel-hint">根据所选规则类型填写校验参数，将序列化为规则配置 JSON 提交后端。</p>

    <!-- 空值检测 -->
    <template v-if="t === 'NULL_CHECK'">
      <el-form-item label="校验字段">
        <el-input v-model="inner.field" placeholder="请输入字段名，如 user_id" clearable @input="sync" />
      </el-form-item>
      <el-form-item label="允许空值">
        <el-switch v-model="inner.nullAllowed" @change="sync" />
        <span class="switch-tip">{{ inner.nullAllowed ? '允许字段为空' : '不允许为空' }}</span>
      </el-form-item>
    </template>

    <!-- 长度校验 -->
    <template v-else-if="t === 'LENGTH_CHECK'">
      <el-form-item label="校验字段">
        <el-input v-model="inner.field" placeholder="如 phone" clearable @input="sync" />
      </el-form-item>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="最小长度">
            <el-input-number v-model="inner.minLength" :min="0" controls-position="right" style="width:100%" @change="sync" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最大长度">
            <el-input-number v-model="inner.maxLength" :min="0" controls-position="right" style="width:100%" @change="sync" />
          </el-form-item>
        </el-col>
      </el-row>
    </template>

    <!-- 日期格式 -->
    <template v-else-if="t === 'DATE_FORMAT'">
      <el-form-item label="校验字段">
        <el-input v-model="inner.field" placeholder="如 birthday" clearable @input="sync" />
      </el-form-item>
      <el-form-item label="日期格式">
        <el-input v-model="inner.format" placeholder="如 yyyy-MM-dd" clearable @input="sync" />
      </el-form-item>
    </template>

    <!-- 唯一性 -->
    <template v-else-if="t === 'UNIQUENESS'">
      <el-form-item label="校验字段">
        <el-input v-model="inner.field" placeholder="需在模型范围内唯一的字段" clearable @input="sync" />
      </el-form-item>
    </template>

    <!-- 正则 -->
    <template v-else-if="t === 'REGEX'">
      <el-form-item label="校验字段">
        <el-input v-model="inner.field" clearable @input="sync" />
      </el-form-item>
      <el-form-item label="正则表达式">
        <el-input v-model="inner.pattern" type="textarea" :rows="2" placeholder="如 ^1[3-9]\\d{9}$" @input="sync" />
      </el-form-item>
    </template>

    <!-- 枚举 -->
    <template v-else-if="t === 'ENUM_CHECK'">
      <el-form-item label="校验字段">
        <el-input v-model="inner.field" clearable @input="sync" />
      </el-form-item>
      <el-form-item label="允许取值">
        <el-input
          v-model="inner.enumValuesStr"
          type="textarea"
          :rows="3"
          placeholder="多个枚举值用英文逗号分隔，如 ACTIVE,INACTIVE,PENDING"
          @input="sync"
        />
      </el-form-item>
    </template>

    <!-- 兼容后端返回 BUILTIN 或未细分时 -->
    <template v-else>
      <el-form-item label="扩展 JSON">
        <el-input
          v-model="inner.rawJson"
          type="textarea"
          :rows="6"
          placeholder="{&quot;field&quot;:&quot;col&quot;,&quot;nullAllowed&quot;:false}"
          @input="onRawJson"
        />
      </el-form-item>
    </template>
  </div>
</template>

<script>
export default {
  name: 'BuiltinRuleForm',
  props: {
    value: {
      type: Object,
      default: () => ({})
    },
    ruleType: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      inner: this.emptyInner()
    }
  },
  computed: {
    t() {
      return String(this.ruleType || '').toUpperCase()
    }
  },
  watch: {
    value: {
      immediate: true,
      deep: true,
      handler(v) {
        this.inner = this.fromValue(v)
      }
    },
    ruleType() {
      this.inner = this.fromValue(this.value)
    }
  },
  methods: {
    emptyInner() {
      return {
        field: '',
        nullAllowed: false,
        minLength: undefined,
        maxLength: undefined,
        format: 'yyyy-MM-dd',
        pattern: '',
        enumValuesStr: '',
        rawJson: ''
      }
    },
    fromValue(v) {
      const base = this.emptyInner()
      if (!v || typeof v !== 'object') return base
      base.field = v.field != null ? String(v.field) : ''
      if (v.nullAllowed != null) base.nullAllowed = Boolean(v.nullAllowed)
      if (v.minLength != null) base.minLength = Number(v.minLength)
      if (v.maxLength != null) base.maxLength = Number(v.maxLength)
      if (v.format != null) base.format = String(v.format)
      if (v.pattern != null) base.pattern = String(v.pattern)
      if (Array.isArray(v.enumValues)) {
        base.enumValuesStr = v.enumValues.join(',')
      } else if (v.enumValuesStr != null) {
        base.enumValuesStr = String(v.enumValuesStr)
      }
      if (this.t === 'BUILTIN' || !this.t) {
        try {
          base.rawJson = Object.keys(v).length ? JSON.stringify(v, null, 2) : ''
        } catch (e) {
          base.rawJson = ''
        }
      }
      return base
    },
    buildPayload() {
      const type = this.t
      if (type === 'NULL_CHECK') {
        return { field: this.inner.field, nullAllowed: this.inner.nullAllowed }
      }
      if (type === 'LENGTH_CHECK') {
        const o = { field: this.inner.field }
        if (this.inner.minLength != null && this.inner.minLength !== '') o.minLength = this.inner.minLength
        if (this.inner.maxLength != null && this.inner.maxLength !== '') o.maxLength = this.inner.maxLength
        return o
      }
      if (type === 'DATE_FORMAT') {
        return { field: this.inner.field, format: this.inner.format }
      }
      if (type === 'UNIQUENESS') {
        return { field: this.inner.field }
      }
      if (type === 'REGEX') {
        return { field: this.inner.field, pattern: this.inner.pattern }
      }
      if (type === 'ENUM_CHECK') {
        const parts = String(this.inner.enumValuesStr || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        return { field: this.inner.field, enumValues: parts }
      }
      try {
        if (this.inner.rawJson && this.inner.rawJson.trim()) {
          return JSON.parse(this.inner.rawJson)
        }
      } catch (e) {
        return {}
      }
      return {}
    },
    sync() {
      this.$emit('input', this.buildPayload())
    },
    onRawJson() {
      try {
        const parsed = this.inner.rawJson && this.inner.rawJson.trim() ? JSON.parse(this.inner.rawJson) : {}
        this.$emit('input', parsed)
      } catch (e) {
        // 编辑中可能不完整，不频繁报错
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.builtin-panel {
  padding: 12px 14px;
  background: #fafcff;
  border: 1px solid #e9eef8;
  border-radius: 10px;
  margin-bottom: 4px;
}
.panel-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: #6a7486;
  line-height: 1.5;
}
.switch-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
