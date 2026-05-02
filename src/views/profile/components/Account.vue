<template>
  <div class="profile-account">
    <el-alert
      v-if="!canSave"
      title="未获取到可编辑的用户标识或角色信息时无法提交保存（仅管理员可在用户管理中维护完整资料）。"
      type="info"
      :closable="false"
      show-icon
      class="mb-16"
    />

    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" class="account-form">
      <el-form-item label="账号">
        <el-input :value="profile.account" disabled />
      </el-form-item>
      <el-form-item label="姓名">
        <el-input :value="profile.name" disabled />
      </el-form-item>
      <el-form-item label="手机" prop="phone">
        <el-input v-model.trim="form.phone" maxlength="11" show-word-limit placeholder="选填" clearable />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model.trim="form.email" maxlength="64" show-word-limit placeholder="选填" clearable />
      </el-form-item>
      <el-form-item label="微信" prop="wechat">
        <el-input v-model.trim="form.wechat" maxlength="64" show-word-limit placeholder="选填" clearable />
      </el-form-item>
      <el-form-item label="头像">
        <avatar-base64-upload v-model="form.avatar" :max-size-mb="2" />
      </el-form-item>
      <el-form-item class="account-form-actions">
        <el-button type="primary" :loading="submitting" :disabled="!canSave" @click="submit">
          保存
        </el-button>
        <el-button class="btn-reset" @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { update } from '@/api/upms/userManage'
import AvatarBase64Upload from '@/components/Upload/AvatarBase64Upload.vue'

export default {
  name: 'ProfileAccount',
  components: { AvatarBase64Upload },
  props: {
    profile: {
      type: Object,
      required: true
    },
    canSave: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const validatePhone = (rule, value, callback) => {
      if (value == null || String(value).trim() === '') return callback()
      const s = String(value).trim()
      if (s.length > 11) return callback(new Error('手机号长度不能超过 11 位'))
      return callback()
    }
    const validateEmail = (rule, value, callback) => {
      if (value == null || String(value).trim() === '') return callback()
      const s = String(value).trim()
      if (s.length > 64) return callback(new Error('邮箱最长 64 位'))
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
      if (!ok) return callback(new Error('邮箱格式不正确'))
      return callback()
    }

    return {
      form: {
        phone: '',
        email: '',
        wechat: '',
        avatar: ''
      },
      submitting: false,
      rules: {
        phone: [{ validator: validatePhone, trigger: 'blur' }],
        email: [{ validator: validateEmail, trigger: 'blur' }],
        wechat: [{ max: 64, message: '微信最长 64 位', trigger: 'blur' }]
      }
    }
  },
  watch: {
    profile: {
      immediate: true,
      deep: true,
      handler(p) {
        this.syncFromProfile(p)
      }
    }
  },
  methods: {
    syncFromProfile(p) {
      if (!p) return
      this.form = {
        phone: p.phone != null ? String(p.phone) : '',
        email: p.email != null ? String(p.email) : '',
        wechat: p.wechat != null ? String(p.wechat) : '',
        avatar: p.avatar != null ? String(p.avatar) : ''
      }
      this.$nextTick(() => {
        if (this.$refs.formRef) this.$refs.formRef.clearValidate()
      })
    },

    resetForm() {
      this.syncFromProfile(this.profile)
    },

    isManageApiSuccess(res) {
      if (!res || typeof res !== 'object') return false
      const code = res.code
      const codeStr = code != null ? String(code) : ''
      if (codeStr === '999999') return false
      if (String(res.status || '').toUpperCase() === 'ERROR') return false
      if (code === '000000' || code === 200 || codeStr === '200') return true
      if (res.success === true) return true
      if (String(res.status || '').toUpperCase() === 'OK' && codeStr === '000000') return true
      return false
    },

    throwIfManageApiFailed(res, defaultMsg = '操作失败') {
      if (this.isManageApiSuccess(res)) return
      const msg = (res && res.message) || defaultMsg
      if (String(res && res.code) !== '999999') {
        this.$message.error(msg)
      }
      throw new Error(msg)
    },

    normalizeExpireForPayload(val) {
      if (val == null || val === '') return null
      const s = String(val).split('T')[0].split(' ')[0]
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
    },

    buildBasicPayload() {
      const phone = String(this.form.phone || '').trim() || null
      const email = String(this.form.email || '').trim() || null
      const wechat = String(this.form.wechat || '').trim() || null
      const avatar = String(this.form.avatar || '').trim() || null
      const expireDate = this.normalizeExpireForPayload(this.profile.expireDate)
      return { phone, email, wechat, avatar, expireDate }
    },

    submit() {
      if (!this.canSave) return
      this.$refs.formRef.validate(async(valid) => {
        if (!valid) return
        const p = this.profile
        const name = String(p.name || '').trim()
        if (!name) {
          this.$message.error('姓名为空，无法保存，请联系管理员维护用户资料')
          return
        }
        const roleIds = Array.isArray(p.roleIds) && p.roleIds.length ? [...p.roleIds] : []
        if (!roleIds.length) {
          this.$message.error('角色信息缺失，无法保存')
          return
        }
        this.submitting = true
        try {
          const payload = {
            id: p.id,
            account: String(p.account || '').trim(),
            name,
            roleIds,
            ...this.buildBasicPayload()
          }
          const res = await update(payload)
          this.throwIfManageApiFailed(res, '保存失败')
          this.$message.success('保存成功')
          this.$emit('saved', {
            phone: this.form.phone,
            email: this.form.email,
            wechat: this.form.wechat,
            avatar: this.form.avatar
          })
        } catch (e) {
          if (e && e.message !== 'blocked') {
            // 错误已在 throwIfManageApiFailed 中提示
          }
        } finally {
          this.submitting = false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.profile-account {
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

@media (min-width: 900px) {
  .profile-account {
    max-width: 560px;
  }
}

.mb-16 {
  margin-bottom: 16px;
}

.account-form {
  padding-top: 4px;

  ::v-deep .el-form-item__label {
    color: #606266;
    font-weight: 500;
  }

  ::v-deep .el-input__inner {
    border-radius: 4px;
  }

  ::v-deep .el-input.is-disabled .el-input__inner {
    background: #f5f7fa;
    border-color: #e4e7ed;
    color: #909399;
  }
}

.account-form-actions {
  margin-bottom: 0 !important;
  padding-top: 8px;

  ::v-deep .el-form-item__content {
    padding-top: 16px;
    margin-top: 8px;
    border-top: 1px solid #ebeef5;
  }

  .el-button + .el-button {
    margin-left: 12px;
  }

  .btn-reset {
    background: #fff;
    border-color: #dcdfe6;
    color: #606266;

    &:hover {
      color: $blue;
      border-color: #a8c8ff;
    }
  }
}
</style>
