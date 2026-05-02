<template>
  <el-card shadow="never" class="user-card profile-surface">
    <div slot="header" class="clearfix">
      <span>个人概览</span>
    </div>

    <div class="user-profile">
      <div class="avatar-wrap">
        <pan-thumb
          :image="displayAvatar"
          :height="'100px'"
          :width="'100px'"
          :hoverable="false"
        >
          <div>您好</div>
          <div class="thumb-role">{{ user.rolesDisplay || '—' }}</div>
        </pan-thumb>
      </div>
      <div class="name-block">
        <div class="user-name text-center">{{ user.name || '—' }}</div>
        <div class="user-account text-center">{{ user.account || '—' }}</div>
      </div>
    </div>

    <div class="user-bio">
      <div class="user-bio-section">
        <div class="user-bio-section-header">
          <svg-icon icon-class="user" class="section-icon" />
          <span>联系方式</span>
        </div>
        <div class="user-bio-section-body">
          <div class="info-row">
            <span class="label">手机</span>
            <span class="value text-muted">{{ user.phone || '未填写' }}</span>
          </div>
          <div class="info-row">
            <span class="label">邮箱</span>
            <span class="value text-muted">{{ user.email || '未填写' }}</span>
          </div>
        </div>
      </div>

      <div class="user-bio-section">
        <div class="user-bio-section-header">
          <svg-icon icon-class="peoples" class="section-icon" />
          <span>角色</span>
        </div>
        <div class="user-bio-section-body">
          <el-tag
            v-for="(tag, idx) in roleTags"
            :key="idx"
            size="small"
            class="role-tag"
          >
            {{ tag }}
          </el-tag>
          <span v-if="!roleTags.length" class="text-muted">—</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
import PanThumb from '@/components/PanThumb'

const PLACEHOLDER_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">' +
      '<rect fill="#e4e7ed" width="120" height="120"/>' +
      '<circle cx="60" cy="44" r="18" fill="#909399"/>' +
      '<ellipse cx="60" cy="108" rx="36" ry="28" fill="#909399"/>' +
      '</svg>'
  )

export default {
  name: 'ProfileUserCard',
  components: { PanThumb },
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  computed: {
    displayAvatar() {
      const a = this.user && this.user.avatar
      if (a != null && String(a).trim() !== '') return String(a)
      return PLACEHOLDER_AVATAR
    },
    roleTags() {
      const u = this.user
      if (!u) return []
      if (Array.isArray(u.roleNames) && u.roleNames.length) {
        return u.roleNames.map((x) => String(x).trim()).filter(Boolean)
      }
      const text = u.rolesDisplay
      if (!text || text === '—') return []
      return String(text)
        .split(/[、,|]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.user-card {
  margin-bottom: 0;
  height: 100%;
}

.text-muted {
  color: #909399;
}

.thumb-role {
  font-size: 12px;
  line-height: 1.3;
  max-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-profile {
  .avatar-wrap {
    display: flex;
    justify-content: center;
    padding: 8px 0 4px;
  }

  .avatar-wrap ::v-deep .pan-item {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 3px solid #fff;
  }

  .name-block {
    padding-top: 12px;
  }

  .user-name {
    font-weight: 600;
    font-size: 17px;
    color: #333639;
    letter-spacing: 0.02em;
  }

  .user-account {
    margin-top: 6px;
    font-size: 13px;
    color: #909399;
    word-break: break-all;
  }
}

.user-bio {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #ebeef5;
  color: #606266;

  .user-bio-section {
    font-size: 14px;
    padding: 0 0 16px;
    margin: 0;

    &:last-child {
      padding-bottom: 0;
    }

    + .user-bio-section {
      padding-top: 16px;
      border-top: 1px solid #ebeef5;
    }

    .user-bio-section-header {
      padding: 0 0 10px;
      margin: 0;
      border: none;
      font-weight: 600;
      font-size: 13px;
      color: #333639;
      display: flex;
      align-items: center;
      gap: 8px;

      .section-icon {
        font-size: 16px;
        color: $blue;
      }
    }

    .user-bio-section-body {
      font-size: 13px;
    }
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 13px;
  padding: 6px 0;
  gap: 12px;

  .label {
    color: #909399;
    flex-shrink: 0;
  }

  .value {
    text-align: right;
    word-break: break-all;
    color: #606266;
  }
}

.role-tag {
  margin-right: 8px;
  margin-bottom: 6px;
  background: #fff !important;
  border-color: #dcdfe6 !important;
  color: #606266 !important;
}
</style>
