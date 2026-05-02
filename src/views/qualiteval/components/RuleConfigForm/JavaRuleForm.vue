<template>
  <el-form-item label="Java 代码">
    <el-input
      :value="value"
      type="textarea"
      :rows="10"
      class="code-input"
      placeholder="请输入 Java 自定义校验逻辑（与后端约定接口）"
      @input="$emit('input', $event)"
    />
  </el-form-item>
</template>

<script>
export default {
  name: 'JavaRuleForm',
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
