<template>
  <!-- 其他内容 -->
  <el-dialog
    :close-on-click-modal="false"
    :visible.sync="visible"
    :center="true"
    :title="title"
    :width="width + 'px'"
    :before-close="onClose"
    :show-bth="showBth"
  >
    <div :style="{height: height + 'px'}">
      <slot name="content" />
    </div>
    <!-- 弹窗内容 -->
    <span v-if="showBth" slot="footer" class="dialog-footer">
      <el-button type="primary" size="small" @click="onConfirm">确定</el-button>
      <el-button size="small" @click="onClose">取消</el-button>
    </span>
  </el-dialog>
</template>
<script>
export default {
  name: 'DynamicDialog', // 组件名称
  props: {
    title: {
      // 标题
      type: String,
      default: '标题'
    },
    visible: {
      // 是否可见
      type: Boolean,
      default: false
    },
    width: {
      // 长度
      type: Number,
      default: 630
    },
    // eslint-disable-next-line vue/require-prop-types
    height: {
      // 高度
      typeof: Number,
      default: 460
    },
    showBth: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {}
  },

  created() {},

  mounted() {},

  methods: {
    /**
     * 弹窗关闭
     */
    onClose() {
      this.$emit('onClose')
    },

    /**
     * 弹窗确定
     */
    onConfirm() {
      this.$emit('onConfirm')
    }
  }
}
</script>

<style lang='scss' scoped>
@import '~@/styles/variables.scss';
.containner {
  overflow-x: initial;
  overflow-y: auto;
}

.el-dialog__wrapper {
  ::v-deep .el-dialog {
    border-radius: 7px !important;
    .el-dialog__header {
      position: relative;
      border-bottom: 1px solid #ebebeb;
      padding: 10px 15px;
      font-size: 14px;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      border-radius: 4px 4px 0 0;
      background-color: #f5f6fa;
      .el-dialog__title {
        display: flex;
        justify-content: left;
        font-size: 14px !important;
        line-height: 23px !important;
        color: #606266;
        font-weight: 700;
      }
      .el-dialog__headerbtn .el-dialog__close {
        right: 15px;
        top: 50% !important;
        -webkit-transform: translateY(-50%) !important;
        transform: translateY(-50%) !important;
        height: 20px;
        width: 20px;
        padding: 2px;
        z-index: 9999;
        margin-top: 2px;
        color: #fff;
        background: #afafaf;
        border-radius: 50%;
      }
      .el-dialog__headerbtn .el-dialog__close:hover {
      }
    }
  }
}
</style>
