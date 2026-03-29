<template>
  <div class="sidebar-logo-container" :class="{'collapse':collapse}">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <img v-if="icons.logo_2" :src="icons.logo_2" class="sidebar-logo">
        <h1 v-else class="sidebar-title">{{ title }} </h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img :src="icons.logo_2" class="sidebar-logo">
        <h1 class="sidebar-title">{{ title }} </h1>
      </router-link>
    </transition>
  </div>
</template>

<script>
import icons from '@/assets/icon/icons.js'
export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      icons,
      title: 'PufferfishScheduler'
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: #ffffff;
  text-align: center;
  overflow: hidden;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;

      & .sidebar-logo {
        width: 32px; /* 略微增大 Logo */
        height: 32px;
        margin-right: 8px;
        vertical-align: middle;
      }

      & .sidebar-title {
        display: inline-block;
        margin: 0;
        color: #333639; /* 标题颜色调整为深色 */
        font-weight: 600; /* 字重适中 */
        line-height: 50px;
        font-size: 18px; /* 标题字体增大 */
        font-family: 'Inter', Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
        vertical-align: middle;
      }
    }
  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background-color: #f0f2f5; /* 增加底部边框 */
  }
}
</style>
