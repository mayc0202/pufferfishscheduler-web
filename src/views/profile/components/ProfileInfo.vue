<template>
  <div class="profile-info">
    <el-descriptions v-if="user && user.id" :column="1" border size="medium">
      <el-descriptions-item label="账号">
        {{ displayAccount }}
      </el-descriptions-item>
      <el-descriptions-item label="姓名">
        {{ displayName }}
      </el-descriptions-item>
      <el-descriptions-item label="角色">
        {{ user.rolesDisplay || '—' }}
      </el-descriptions-item>
      <el-descriptions-item label="手机">
        {{ user.phone || '—' }}
      </el-descriptions-item>
      <el-descriptions-item label="邮箱">
        {{ user.email || '—' }}
      </el-descriptions-item>
      <el-descriptions-item label="微信">
        {{ user.wechat || '—' }}
      </el-descriptions-item>
      <el-descriptions-item label="账号有效期">
        {{ formatExpire(user.expireDate) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-empty v-else description="正在加载或未获取到用户标识，无法展示详情" :image-size="80" />
  </div>
</template>

<script>
export default {
  name: 'ProfileInfo',
  props: {
    user: {
      type: Object,
      default: null
    }
  },
  computed: {
    displayAccount() {
      const u = this.user
      if (!u) return '—'
      return u.account || '—'
    },
    displayName() {
      const u = this.user
      if (!u) return '—'
      return u.name || '—'
    }
  },
  methods: {
    formatExpire(val) {
      if (val == null || val === '') return '—'
      const s = String(val).replace('T', ' ').trim()
      return s.length > 10 ? s.slice(0, 10) : s
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.profile-info {
  min-height: 120px;
  max-width: 100%;
  overflow-x: auto;

  ::v-deep .el-descriptions {
    border-radius: 4px;
    overflow: hidden;
  }

  ::v-deep .el-descriptions-item__label {
    width: 120px;
    max-width: 40%;
    background: #fafbfc !important;
    color: $label;
    font-weight: 500;
    font-size: 13px;
  }

  ::v-deep .el-descriptions-item__content {
    font-size: 13px;
    color: #333639;
    background: #fff !important;
  }

  ::v-deep .el-descriptions-item__cell {
    border-color: #ebeef5 !important;
  }
}
</style>
