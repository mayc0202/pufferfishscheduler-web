<template>
  <div :class="{'has-logo':showLogo}">
    <!-- <logo v-if="showLogo" :collapse="isCollapse" /> -->
    <logo :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :unique-opened="false"
        :active-text-color="variables.menuActiveText"
        :collapse-transition="false"
        mode="vertical"
      >
        <sidebar-item v-for="route in permission_routes" :key="route.path" :item="route" :base-path="route.path" />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/styles/variables.scss'

export default {
  components: {
    SidebarItem,
    Logo
  },
  computed: {
    ...mapGetters([
      'permission_routes',
      'sidebar'
    ]),
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    },
    showLogo() {
      return this.$store.state.settings.sidebarLogo
    },
    variables() {
      return variables
    },
    isCollapse() {
      return !this.sidebar.opened
    }
  }
}
</script>
<style lang="scss" scoped>
.sidebar-container {
    -webkit-transition: width 0.28s;
    transition: width 0.28s;
    width: 210px !important;
    background-color: #fff;
    height: 100%;
    position: fixed;
    font-size: 0px;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1001;
    overflow: hidden;
    border-right: none; /* 移除右侧边框 */

    .el-menu {
      border: none; /* 移除 Element UI 菜单自带的边框 */
      background-color: #fff; /* 确保菜单背景色为白色 */

      .el-menu-item, .el-submenu__title {
        height: 50px;
        line-height: 50px;

        &:hover {
          background-color: #f0f2f5 !important; /* 菜单项悬浮背景色 */
          color: #2A87FF !important; /* 菜单项悬浮文字颜色 */
        }
      }

      .el-menu-item.is-active {
        background-color: #2A87FF !important; /* 菜单项选中背景色 */
        color: #fff !important; /* 菜单项选中文字颜色 */

        .svg-icon {
          color: #fff !important; /* 选中时图标颜色 */
        }
      }
    }
}
</style>
