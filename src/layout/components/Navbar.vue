<template>
  <div class="navbar">
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />

    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" />

    <div class="right-menu">
      <template v-if="device!=='mobile'">

        <error-log class="errLog-container right-menu-item hover-effect" />

        <screenfull id="screenfull" class="right-menu-item hover-effect" />

      </template>

      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <img :src="avatar" class="user-avatar">
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown">
          <router-link to="/profile/index">
            <el-dropdown-item>个人中心</el-dropdown-item>
          </router-link>
          <router-link to="/">
            <el-dropdown-item>平台概览</el-dropdown-item>
          </router-link>
          <el-dropdown-item @click.native="logout">
            <span style="display:block;">注销用户</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'
import ErrorLog from '@/components/ErrorLog'
import Screenfull from '@/components/Screenfull'

export default {
  components: {
    Breadcrumb,
    Hamburger,
    ErrorLog,
    Screenfull
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'device'
    ])
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    /**
     * 注销用户
     */
    async logout() {
      try {
        await this.$store.dispatch('user/logout')
        // 登出成功处理
        this.$message.success('登出成功!')
        this.$router.push(`/login?redirect=${this.$route.fullPath}`)
      } catch (error) {
        // 999999 已在 request 拦截器中以 MessageBox 告警提示，此处不再重复弹窗
        if (error && (String(error.code) === '999999' || Number(error.code) === 999999)) {
          // noop
        } else {
          this.$message.error((error && error.message) || '登出失败!')
        }

        // 无论登出请求是否成功，都跳转到登录页
        this.$router.push(`/login?redirect=${this.$route.fullPath}`)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.navbar {
  height: 50px;
  overflow: hidden;
  position: relative; /* 改为相对定位 */
  background: $headerBg;
  box-shadow: none; /* 移除阴影 */
  border-bottom: 1px solid #f0f2f5; /* 统一底部边框 */

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background .3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: #f0f2f5; /* 悬浮背景色 */
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: middle; /* 垂直居中 */
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 10px; /* 调整水平间距 */
      height: 100%;
      font-size: 18px;
      color: $headerTxt;
      vertical-align: middle; /* 垂直居中 */

      &.hover-effect {
        cursor: pointer;
        transition: background .3s;

        &:hover {
          background: #f0f2f5; /* 悬浮背景色 */
          color: $headerTxtHover; /* 悬浮文字颜色 */
        }
      }
    }

    .avatar-container {
      margin-right: 20px; /* 调整右侧外边距 */

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 50%; /* 圆形头像 */
        }

        .el-icon-caret-bottom {
          cursor: pointer;
          position: absolute;
          right: -16px; /* 调整位置 */
          top: 18px; /* 调整位置 */
          font-size: 12px;
          color: $headerTxt; /* 调整颜色 */
        }
      }
    }
  }
}
</style>
