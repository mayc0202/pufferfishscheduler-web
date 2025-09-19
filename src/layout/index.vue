<template>
  <div :class="classObj" class="app-wrapper">
    <div v-if="device==='mobile'&&sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <!-- 侧边栏容器 -->
    <div class="sidebar-wrapper">
      <sidebar class="sidebar-container" />
    </div>
    <div :class="{hasTagsView:needTagsView}" class="main-container">
      <!-- 导航栏容器 -->
      <div class="navbar-wrapper">
        <div :class="{'fixed-header':fixedHeader}">
          <navbar />
        </div>
      </div>
      <!-- 滚动容器 -->
      <div class="scroll-container">
        <app-main />
      </div>
    </div>
  </div>
</template>

<script>
import { AppMain, Navbar, Sidebar } from './components'
import ResizeMixin from './mixin/ResizeHandler'
import { mapState } from 'vuex'

export default {
  name: 'Layout',
  components: {
    AppMain,
    Navbar,
    Sidebar
  },
  mixins: [ResizeMixin],
  computed: {
    ...mapState({
      sidebar: state => state.app.sidebar,
      device: state => state.app.device,
      showSettings: state => state.settings.showSettings,
      needTagsView: state => state.settings.tagsView,
      fixedHeader: state => state.settings.fixedHeader
    }),
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile'
      }
    }
  },
  methods: {
    handleClickOutside() {
      this.$store.dispatch('app/closeSideBar', { withoutAnimation: false })
    }
  }
}
</script>

<style lang="scss" scoped>
  @import "~@/styles/mixin.scss";
  @import "~@/styles/variables.scss";

  .app-wrapper {
    @include clearfix;
    position: relative;
    height: 100%;
    width: 100%;
    display: flex; /* 使用 Flex 布局 */

    &.mobile.openSidebar {
      position: fixed;
      top: 0;
    }
  }

  /* 侧边栏容器 */
  .sidebar-wrapper {
    position: relative;
    z-index: 2001; /* 高于导航栏 */
  }

   /* 导航栏容器 */
  .navbar-wrapper {
    position: relative;
    z-index: 2000; /* 确保在侧边栏下方 */
    width: 100%;
  }

   /* 滚动容器样式 */
  .scroll-container {
    height: calc(100vh - 50px); /* 减去导航栏高度 */
    overflow-y: auto; /* 启用垂直滚动 */
    width: 100%;
  }

  /* 主容器调整 */
  .main-container {
    flex: 1;
    min-width: 0; /* 关键：允许内容区域收缩 */
    position: relative;
    margin-left: $sideBarWidth; /* 保留侧边栏空间 */
    transition: margin-left 0.28s;
  }

  .hideSidebar .main-container {
    margin-left: 54px; /* 侧边栏折叠时的宽度 */
  }

  .drawer-bg {
    background: #000;
    opacity: 0.3;
    width: 100%;
    top: 0;
    height: 100%;
    position: absolute;
    z-index: 999;
  }

  .fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9;
    width: calc(100% - #{$sideBarWidth});
    transition: width 0.28s;
  }

  .hideSidebar .fixed-header {
    width: calc(100% - 54px)
  }

  .mobile .fixed-header {
    width: 100%;
  }

</style>
