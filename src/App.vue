<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
/* 全局样式  */
body {
  background-color: #f8f8fc;
}

/* 浮动 */
.flex {
  display: flex;
}

/* 换行 */
.wrap {
  flex-wrap: wrap;
}

/* 均匀分配 */
.around {
  justify-content: space-around;
}

/* 两边分配 */
.between {
  justify-content: space-between;
}

/* 居中 */
.center {
  text-align: center;
  justify-content: center;
}

/* 底部 */
.footer {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 底部悬浮 */
.fiex_bottom {
  display: flex;
  position: fixed;
  z-index: 999;
  border: none;
  bottom: -0.1%;
  width: 75%;
  height: 64rpx;
  padding: 30rpx 100rpx 60rpx 100rpx;
  background-color: white;
}

/* 按钮样式 */
.hand {
  cursor: pointer;
}

/* input样式统一 */
.input::-webkit-input-placeholder { /* Chrome/Opera/Safari */
  color: #b3b3b3;
  font-size: 14px;
}
.input::-moz-placeholder { /* Firefox 19+ */
  color: #b3b3b3;
  opacity: 1;
}
.input:-ms-input-placeholder { /* IE 10+ */
  color: #b3b3b3;
}
.input:-moz-placeholder { /* Firefox 18- */
  color: #b3b3b3;
  opacity: 1;
}
.input::placeholder {
  color: #b3b3b3;
  font-size: 14px;
}

// 容器
.container {
  margin: 0;
  padding: 0;
  // height: 100vh;
  background-color: rgb(255, 255, 255);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 头部
.header {
  background: #fff;
  padding: 10px;
  margin: 10px;
  position: relative;
  user-select: none;
  border-radius: 4px;
  box-shadow: $shadow;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.header .icon {
  margin-top: 0px;
  margin-right: 5px;
  width: 16px;
  height: 16px;
}

.header .font {
  padding-left: 5px;
  font-weight: 700;
  font-size: 14px;
  color: #606266;
}

.header .crurrent {
  margin-left: 10px;
  font-size: 12px;
  line-height: 16px;
  color: #606266;
}

// 分页
.pagination-wrapper {
  display: flex;
  justify-content: center; /* 水平居中 */
  width: 100%; /* 确保容器占满父级宽度 */
  margin-top: 20px;
}

/* 全局提升 Element 弹窗层级，确保始终覆盖左侧菜单和页面内容 */
.el-dialog__wrapper {
  z-index: 3000 !important;
}

.v-modal {
  z-index: 2999 !important;
}

/* 提升 MessageBox 的层级，避免被流程画布或自定义遮罩覆盖 */
.el-message-box__wrapper {
  z-index: 11000 !important;
}

.el-message-box {
  z-index: 11001 !important;
}

/* 轻提示须高于对话框、确认框与下拉层（弹窗内校验、接口错误提示不被遮挡） */
.el-message {
  z-index: 20050 !important;
}

.el-notification {
  z-index: 20050 !important;
}

/* 统一提升下拉类弹层的层级，避免被对话框遮挡导致“看起来没有选项” */
.el-popper {
  z-index: 3005 !important;
}
</style>
