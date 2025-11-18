<template>
  <div class="login-container">
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" autocomplete="on" label-position="left">

      <div class="title-container">
        <h3 class="title">
          <img :src="icons.logo" class="sidebar-logo">
          PufferfishScheduler
        </h3>
      </div>

      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="username"
          v-model="loginForm.username"
          size="small"
          placeholder="用户名"
          name="username"
          type="text"
          tabindex="1"
          autocomplete="on"
        />
      </el-form-item>

      <el-tooltip v-model="capsTooltip" content="Caps lock is On" placement="right" manual>
        <el-form-item prop="password">
          <span class="svg-container">
            <svg-icon icon-class="password" />
          </span>
          <el-input
            :key="passwordType"
            ref="password"
            v-model="loginForm.password"
            size="small"
            :type="passwordType"
            placeholder="密码"
            name="password"
            tabindex="2"
            autocomplete="on"
            @keyup.native="checkCapslock"
            @blur="capsTooltip = false"
            @keyup.enter.native="handleLogin"
          />
          <span class="show-pwd" @click="showPwd">
            <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
          </span>
        </el-form-item>
      </el-tooltip>

      <el-button :loading="loading" type="primary" class="login" @click.native.prevent="handleLogin">登录</el-button>
    </el-form>
  </div>
</template>

<script>
import icons from '@/assets/icon/icons.js'
import { isEmpty } from '@/utils/validate'
import router from '@/router'
// import SocialSign from './components/SocialSignin'

export default {
  name: 'Login',
  components: {
    // SocialSign,
  },
  data() {
    const validateUsername = (rule, value, callback) => {
      if (isEmpty(value)) {
        callback(new Error('请输入用户名!'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (isEmpty(value)) {
        callback(new Error('请输入密码!'))
      } else {
        callback()
      }
    }
    return {
      icons,
      loginForm: {
        username: 'develop',
        password: '1q2w3e4R'
      },
      loginRules: {
        username: [{ required: true, trigger: 'blur', validator: validateUsername }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }]
      },
      passwordType: 'password',
      capsTooltip: false,
      loading: false,
      showDialog: false,
      redirect: undefined,
      otherQuery: {}
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        const query = route.query
        if (query) {
          this.redirect = query.redirect
          this.otherQuery = this.getOtherQuery(query)
        }
      },
      immediate: true
    }
  },
  created() {
    // window.addEventListener('storage', this.afterQRScan)
  },
  mounted() {
    if (this.loginForm.username === '') {
      this.$refs.username.focus()
    } else if (this.loginForm.password === '') {
      this.$refs.password.focus()
    }
  },
  destroyed() {
    // window.removeEventListener('storage', this.afterQRScan)
  },
  methods: {
    checkCapslock(e) {
      const { key } = e
      this.capsTooltip = key && key.length === 1 && (key >= 'A' && key <= 'Z')
    },

    /**
     * 展示密码
     */
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },

    /**
     * 登录
     */
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          this.$store.dispatch('user/login', this.loginForm)
            .then(() => {
              // 步骤1：获取用户信息（含角色）
              return this.$store.dispatch('user/getUserInfo')
            })
            .then(userInfo => {
              // 步骤2：确保传递角色数组，如果后端返回的是单个角色，包装成数组
              return this.$store.dispatch(
                'permission/generateRoutes',
                Array.isArray(userInfo.roles) ? userInfo.roles : [userInfo.roles]
              )
            })
            .then(accessRoutes => {
              // 使用导入的router实例
              router.addRoutes(accessRoutes)
              // 处理跳转
              const redirect = this.$route.query.redirect || '/'
              this.$router.push(redirect).catch(() => {})
            })
            .catch(err => {
              this.$message.error(err || 'Login failed!')
            })
            .finally(() => {
              this.loading = false
            })
        }
      })
    },

    getOtherQuery(query) {
      return Object.keys(query).reduce((acc, cur) => {
        if (cur !== 'redirect') {
          acc[cur] = query[cur]
        }
        return acc
      }, {})
    }
  }
}
</script>

<style lang="scss">
$bg:#ffffff;
$light_gray:#fff;
$cursor: #2c2c2c;
$input-border: 1px solid rgb(201, 201, 201); // 1px solid rgba(255, 255, 255, 0.1)
$input-bg: #fff; // rgba(0, 0, 0, 0.1)

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.login-container {
   /* 背景图片设置 */
  // background-image: url('./../../assets/img/bj.png');
  background-size: cover; /* 覆盖整个容器，保持宽高比 */
  background-position: center; /* 图片居中显示 */
  background-repeat: no-repeat; /* 不重复图片 */
  background-attachment: fixed; /* 固定背景，不随内容滚动 */

  /* 确保容器全屏 */
  width: 100vw;
  height: 100vh;
  min-height: 400px;
  margin: 0;
  padding: 0;

  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: $cursor;
      height: 47px;
      caret-color: $cursor;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  .el-form-item {
    border: $input-border;
    background: $input-bg;
    border-radius: 5px;
    color: $cursor;
  }
}
</style>

<style lang="scss" scoped>
$bg:#3797f0;
$dark_gray:#7e7e7e;
// $light_gray:#eee;
// $login_form_bg: rgba(0, 0, 0, 0.5);
$light_gray:#333333;
$login_form_bg: rgba(255, 255, 255);

.login-container {
  min-height: 100%;
  width: 100%;
  height: 100%;
  background-color: $bg;
  overflow: hidden;

  .login-form {
    user-select: none;
    position: relative;
    width: 400px;
    max-width: 100%;
    border-radius: 1%;
    padding: 30px 30px;
    margin: 0 auto;
    overflow: hidden;
    background-color: $login_form_bg;
    position: absolute;
    z-index: 999;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 16px 32px 0 rgba(48, 55, 66, 0.15);
  }

  .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: 500;

      .sidebar-logo {
        width: 50px;
        height: 50px;
        position: relative;
        top: 10px;
      }
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }

  .login {
    width:100%;
    margin-bottom:30px;
    background-color: #1c9eda;
    border-radius: 20px;
  }

  .login:hover {
    background-color: #4fc7ff;
  }

  .thirdparty-button {
    position: absolute;
    right: 0;
    bottom: 6px;
  }

  @media only screen and (max-width: 470px) {
    .thirdparty-button {
      display: none;
    }
  }
}
</style>
