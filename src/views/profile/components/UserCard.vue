<template>
  <el-card shadow="never" class="user-card">
    <div slot="header" class="clearfix">
      <span>个人概览</span>
    </div>

    <div class="user-profile">
      <div class="box-center">
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
      <div class="box-center">
        <div class="user-name text-center">{{ user.name || '—' }}</div>
        <div class="user-role text-center text-muted">{{ user.account || '—' }}</div>
      </div>
    </div>

    <div class="user-bio">
      <div class="user-bio-section">
        <div class="user-bio-section-header">
          <svg-icon icon-class="user" />
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
          <svg-icon icon-class="peoples" />
          <span>角色</span>
        </div>
        <div class="user-bio-section-body">
          <el-tag
            v-for="(tag, idx) in roleTags"
            :key="idx"
            size="small"
            type="info"
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
.user-card {
  margin-bottom: 20px;
}

.box-center {
  margin: 0 auto;
  display: table;
}

.text-muted {
  color: #777;
}

.thumb-role {
  font-size: 12px;
  line-height: 1.3;
  max-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-profile {
  .user-name {
    font-weight: bold;
    font-size: 16px;
  }

  .box-center {
    padding-top: 10px;
  }

  .user-role {
    padding-top: 6px;
    font-weight: 400;
    font-size: 13px;
    word-break: break-all;
  }
}

.user-bio {
  margin-top: 16px;
  color: #606266;

  span {
    padding-left: 4px;
  }

  .user-bio-section {
    font-size: 14px;
    padding: 12px 0;

    .user-bio-section-header {
      border-bottom: 1px solid #ebeef5;
      padding-bottom: 8px;
      margin-bottom: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
    }
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 13px;
  padding: 4px 0;
  gap: 12px;

  .label {
    color: #909399;
    flex-shrink: 0;
  }

  .value {
    text-align: right;
    word-break: break-all;
  }
}

.role-tag {
  margin-right: 6px;
  margin-bottom: 6px;
}
</style>
