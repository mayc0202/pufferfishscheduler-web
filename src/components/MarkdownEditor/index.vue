<template>
  <div class="markdown-editor">
    <div class="markdown-editor__head">
      <span class="title">{{ title }}</span>
      <span v-if="hint" class="hint">{{ hint }}</span>
    </div>
    <el-input
      :value="value"
      type="textarea"
      :rows="rows"
      :placeholder="placeholder"
      resize="vertical"
      class="markdown-editor__textarea"
      @input="$emit('input', $event)"
    />
  </div>
</template>

<script>
export default {
  name: 'MarkdownEditor',
  props: {
    value: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: 'Markdown 编辑区'
    },
    hint: {
      type: String,
      default: ''
    },
    rows: {
      type: Number,
      default: 16
    },
    placeholder: {
      type: String,
      default: '请输入 Markdown 内容'
    }
  }
}
</script>

<style lang="scss" scoped>
.markdown-editor {
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.markdown-editor__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.title {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.hint {
  font-size: 12px;
  color: #64748b;
}

.markdown-editor__textarea ::v-deep .el-textarea__inner {
  border: none;
  border-radius: 0;
  min-height: 320px;
  font-family: SFMono-Regular, Menlo, Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #334155;
  background: #f8fafc;
}
</style>
