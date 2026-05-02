<template>
  <div class="app-container profile-page">
    <div v-loading="loading" class="profile-inner">
      <el-row v-if="profile" :gutter="20" class="profile-row">
        <el-col :span="8" :xs="24" class="profile-col profile-col--aside">
          <user-card :user="profile" />
        </el-col>

        <el-col :span="16" :xs="24" class="profile-col profile-col--main">
          <el-card shadow="never" class="profile-tabs-card profile-surface">
            <el-tabs v-model="activeTab">
              <el-tab-pane label="基本信息" name="info">
                <profile-info :user="profile" />
              </el-tab-pane>
              <el-tab-pane label="资料维护" name="account">
                <account
                  :profile="profile"
                  :can-save="canSaveProfile"
                  @saved="handleProfileSaved"
                />
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-else-if="!loading" description="未能加载个人信息，请稍后重试" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getUserInfo } from '@/api/upms/auth'
import { detail, list } from '@/api/upms/userManage'
import UserCard from './components/UserCard'
import Account from './components/Account'
import ProfileInfo from './components/ProfileInfo'

function normalizeRoleNames(d) {
  if (!d || typeof d !== 'object') return []
  const raw = d.roleNames
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean)
  if (raw != null && raw !== '') return [String(raw).trim()].filter(Boolean)
  return []
}

function normalizeRoleIds(d) {
  if (!d || typeof d !== 'object') return []
  const raw = d.roleIds
  if (Array.isArray(raw)) return raw.filter((x) => x != null)
  if (raw != null) return [raw]
  return []
}

export default {
  name: 'Profile',
  components: { UserCard, Account, ProfileInfo },
  data() {
    return {
      profile: null,
      loading: false,
      activeTab: 'info'
    }
  },
  computed: {
    ...mapGetters(['name', 'avatar', 'roles']),
    canSaveProfile() {
      const p = this.profile
      if (!p || p.id == null) return false
      return Array.isArray(p.roleIds) && p.roleIds.length > 0
    }
  },
  created() {
    this.loadProfile()
  },
  methods: {
    pickAuthAccount(data) {
      if (!data || typeof data !== 'object') return ''
      return (
        data.account ||
        data.username ||
        data.userAccount ||
        data.userId ||
        data.name ||
        ''
      )
    },

    async resolveManageUserId(auth) {
      if (!auth || typeof auth !== 'object') return null
      const direct = auth.id != null ? auth.id : auth.userId
      if (direct != null && String(direct).trim() !== '') {
        const n = Number(direct)
        return Number.isFinite(n) ? n : direct
      }
      const account = this.pickAuthAccount(auth)
      if (!account || String(account).trim() === '') return null
      try {
        const res = await list({
          account: String(account).trim(),
          pageNo: 1,
          pageSize: 1
        })
        const body = (res && res.data) || {}
        const records = body.records || []
        const first = records[0]
        if (first && first.id != null) return first.id
      } catch (e) {
        // 列表兜底失败时仅依赖 auth
      }
      return null
    },

    mergeProfile(auth, detailData) {
      const a = auth || {}
      const d = detailData || {}
      const roleNamesFromDetail = normalizeRoleNames(d)
      const roleIdsFromDetail = normalizeRoleIds(d)
      const rolesFromAuth = Array.isArray(a.roles) ? a.roles : a.roles != null ? [a.roles] : []

      const rolesDisplay =
        roleNamesFromDetail.length > 0
          ? roleNamesFromDetail.join('、')
          : rolesFromAuth.length > 0
            ? rolesFromAuth.join('、')
            : ''

      const id = d.id != null ? d.id : a.id != null ? a.id : a.userId

      const accountRaw =
        d.account != null && String(d.account).trim() !== ''
          ? String(d.account).trim()
          : String(this.pickAuthAccount(a) || '').trim()

      const nameRaw =
        (d.name != null && String(d.name).trim() !== '' && String(d.name).trim()) ||
        (d.realName != null && String(d.realName).trim() !== '' && String(d.realName).trim()) ||
        (a.name != null ? String(a.name).trim() : '')

      return {
        id: id != null ? id : null,
        account: accountRaw,
        name: nameRaw,
        avatar:
          d.avatar != null && String(d.avatar).trim() !== ''
            ? d.avatar
            : a.avatar || this.avatar || '',
        phone: d.phone != null ? String(d.phone) : '',
        email: d.email != null ? String(d.email) : '',
        wechat: d.wechat != null ? String(d.wechat) : '',
        expireDate: d.expireDate != null ? d.expireDate : d.expire_date != null ? d.expire_date : null,
        roleIds: roleIdsFromDetail,
        roleNames: roleNamesFromDetail,
        rolesDisplay,
        detailLoaded: Object.keys(d).length > 0
      }
    },

    async loadProfile() {
      this.loading = true
      try {
        const res = await getUserInfo()
        const auth = (res && res.data) || {}

        const userId = await this.resolveManageUserId(auth)
        let detailData = {}
        if (userId != null) {
          try {
            const dr = await detail(userId)
            detailData = (dr && dr.data) || {}
          } catch (e) {
            this.$message.warning('用户详情暂不可用，已展示登录态下的基础信息')
          }
        }

        this.profile = this.mergeProfile(auth, detailData)
      } catch (e) {
        this.profile = null
        this.$message.error('获取个人信息失败')
      } finally {
        this.loading = false
      }
    },

    handleProfileSaved(updated) {
      if (updated && typeof updated === 'object') {
        this.profile = { ...this.profile, ...updated }
      } else {
        this.loadProfile()
      }
      if (this.profile && this.profile.name) {
        this.$store.commit('user/SET_NAME', this.profile.name)
      }
      if (this.profile && this.profile.avatar !== undefined) {
        this.$store.commit('user/SET_AVATAR', this.profile.avatar || '')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.profile-page {
  box-sizing: border-box;

  .profile-inner {
    min-height: 200px;
    max-width: 1120px;
    margin: 0 auto;
    padding: 20px 16px 28px;
    background: #f5f7fa;
    border-radius: 10px;
  }

  .profile-row {
    align-items: flex-start;
  }

  .profile-col--aside {
    margin-bottom: 0;
  }

  .profile-col--main {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    .profile-inner {
      padding: 16px 0 24px;
      border-radius: 0;
    }

    .profile-col--aside {
      margin-bottom: 16px;
    }
  }

  /* 左右栏卡片统一：白底、细边框、圆角 */
  ::v-deep .profile-surface.el-card {
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    box-shadow: none;

    .el-card__header {
      padding: 14px 20px;
      font-size: 15px;
      font-weight: 600;
      color: #333639;
      border-bottom: 1px solid #ebeef5;
    }

    .el-card__body {
      padding: 20px;
    }
  }

  .profile-tabs-card.profile-surface {
    ::v-deep .el-card__body {
      padding: 0 20px 20px !important;
    }

    ::v-deep .el-tabs__header {
      margin: 0;
      padding: 0 2px;
    }

    ::v-deep .el-tabs__nav-wrap::after {
      height: 1px;
      background-color: #ebeef5;
    }

    ::v-deep .el-tabs__item {
      font-size: 14px;
      height: 46px;
      line-height: 46px;
      color: #606266;
      padding: 0 22px;
    }

    ::v-deep .el-tabs__item:hover {
      color: $blue;
    }

    ::v-deep .el-tabs__item.is-active {
      color: $blue;
      font-weight: 600;
    }

    ::v-deep .el-tabs__active-bar {
      background-color: $blue;
      height: 2px;
    }

    ::v-deep .el-tabs__content {
      padding-top: 4px;
    }

    ::v-deep .el-tab-pane {
      padding-top: 4px;
    }
  }
}
</style>
