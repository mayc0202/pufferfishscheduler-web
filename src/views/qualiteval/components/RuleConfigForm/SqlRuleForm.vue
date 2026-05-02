<template>
  <el-form-item label="SQL 语句">
    <el-input
      :value="value"
      type="textarea"
      :rows="10"
      class="code-input"
      placeholder="请输入 SQL 关联校验语句"
      @input="$emit('input', $event)"
    />
  </el-form-item>
</template>

<script>
export default {
  name: 'SqlRuleForm',
  props: {
    value: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss" scoped>
.code-input ::v-deep textarea {
  font-family: Consolas, Menlo, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  background: #fafcff;
}
</style>
