<template>
  <el-form-item label="MVEL 表达式">
    <el-input
      :value="value"
      type="textarea"
      :rows="8"
      class="code-input"
      placeholder="例如：单行布尔表达式，返回 true 表示通过校验"
      @input="$emit('input', $event)"
    />
  </el-form-item>
</template>

<script>
export default {
  name: 'MvelRuleForm',
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
