<template>
  <div class="app-container uc-container user-manage-page">
    <div class="uc-body">
      <div class="uc-list">
        <div class="uc-page-head">
          <h1 class="uc-page-head__title">用户管理</h1>
          <p class="uc-page-head__desc">维护系统账号、角色分配与账号注销（仅管理员）</p>
        </div>

        <div class="uc-stat-row">
          <div class="uc-stat-item">
            <div class="uc-stat-item__icon uc-stat-item__icon--primary">
              <i class="el-icon-user-solid" />
            </div>
            <div>
              <div class="uc-stat-item__value">{{ total }}</div>
              <div class="uc-stat-item__label">用户总数</div>
            </div>
          </div>
          <div class="uc-stat-item">
            <div class="uc-stat-item__icon uc-stat-item__icon--success">
              <i class="el-icon-s-grid" />
            </div>
            <div>
              <div class="uc-stat-item__value">{{ list.length }}</div>
              <div class="uc-stat-item__label">当前页条数</div>
            </div>
          </div>
          <div class="uc-stat-item">
            <div class="uc-stat-item__icon uc-stat-item__icon--info">
              <i class="el-icon-key" />
            </div>
            <div>
              <div class="uc-stat-item__value">{{ roleOptions.length || 2 }}</div>
              <div class="uc-stat-item__label">可分配角色</div>
            </div>
          </div>
        </div>

        <div class="uc-search">
          <div class="uc-search__left">
            <div class="uc-search__label">账号：</div>
            <el-input
              v-model="query.account"
              placeholder="支持模糊查询"
              clearable
              size="small"
              prefix-icon="el-icon-user"
              class="uc-search__input"
              @keyup.enter.native="fetchList"
            />
            <div class="uc-search__label">姓名：</div>
            <el-input
              v-model="query.name"
              placeholder="支持模糊查询"
              clearable
              size="small"
              prefix-icon="el-icon-postcard"
              class="uc-search__input"
              @keyup.enter.native="fetchList"
            />
          </div>
          <div class="uc-search__right">
            <el-button type="primary" icon="el-icon-search" size="small" @click="fetchList">
              查询
            </el-button>
            <el-button icon="el-icon-refresh-left" size="small" @click="resetQuery">
              重置
            </el-button>
            <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog('add')">
              新增用户
            </el-button>
          </div>
        </div>

        <div class="uc-table-wrap">
          <el-table
            v-loading="loading"
            stripe
            size="small"
            element-loading-text="正在加载数据..."
            element-loading-spinner="el-icon-loading"
            element-loading-background="rgba(255, 255, 255, 0.8)"
            :data="list"
            style="width: 100%"
            :max-height="ucTableMaxHeight"
            :header-cell-style="tableHeaderStyle"
            empty-text="暂无数据"
          >
            <el-table-column type="index" label="#" width="56" align="center" />
            <el-table-column prop="account" label="账号" min-width="140" show-overflow-tooltip>
              <template slot-scope="scope">
                <span class="cell-strong">{{ scope.row.account }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" min-width="100" show-overflow-tooltip />
            <el-table-column label="手机" min-width="118" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ rowPhone(scope.row) || '—' }}
              </template>
            </el-table-column>
            <el-table-column label="邮箱" min-width="168" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ rowEmail(scope.row) || '—' }}
              </template>
            </el-table-column>
            <el-table-column label="微信" min-width="110" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ rowWechat(scope.row) || '—' }}
              </template>
            </el-table-column>
            <el-table-column label="过期日期" width="118" align="center">
              <template slot-scope="scope">
                {{ formatExpireDate(rowExpire(scope.row)) }}
              </template>
            </el-table-column>
            <el-table-column label="角色" min-width="140">
              <template slot-scope="scope">
                <el-tag
                  v-if="roleTagType(scope.row)"
                  :type="roleTagType(scope.row)"
                  class="role-pill"
                  size="small"
                  effect="plain"
                >
                  {{ roleDisplayText(scope.row) }}
                </el-tag>
                <span v-else class="text-muted">{{ roleDisplayText(scope.row) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="statusTxt" label="状态" width="120" align="center">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.statusTxt" type="info" size="mini" effect="plain">
                  {{ scope.row.statusTxt }}
                </el-tag>
                <span v-else class="text-muted">—</span>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="158" align="center" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ formatDateTime(rowCreatedAt(scope.row)) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" size="mini" icon="el-icon-edit" @click.native.prevent="openDialog('edit', scope.row)">
                  编辑
                </el-button>
                <el-button
                  type="text"
                  size="mini"
                  class="btn-danger-text"
                  icon="el-icon-circle-close"
                  @click.native.prevent="handleDeactivate(scope.row)"
                >
                  注销
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            :current-page="pageNo"
            :page-sizes="[10, 20, 30, 40, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <el-dialog
      :visible.sync="dialogVisible"
      :title="dialogMode === 'edit' ? '编辑用户' : '新增用户'"
      width="720px"
      :close-on-click-modal="false"
      custom-class="uc-manage-dialog"
      append-to-body
    >
      <el-form
        ref="userFormRef"
        :model="form"
        :rules="rules"
        label-width="96px"
        class="dialog-form"
      >
        <div class="form-section-title">账号与安全</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="账号" prop="account">
              <el-input
                v-model="form.account"
                :disabled="dialogMode === 'edit'"
                placeholder="登录账号"
                prefix-icon="el-icon-user"
                maxlength="32"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="form.name"
                placeholder="姓名"
                prefix-icon="el-icon-postcard"
                maxlength="64"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                :placeholder="dialogMode === 'edit' ? '不修改请留空' : '请输入登录密码'"
                type="password"
                show-password
                autocomplete="new-password"
                prefix-icon="el-icon-lock"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="roleCode">
              <el-select v-model="form.roleCode" placeholder="请选择角色" clearable class="full-width">
                <el-option
                  v-for="opt in roleOptions"
                  :key="opt.code"
                  :label="opt.value"
                  :value="opt.code"
                  :disabled="!!opt.disabled"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="手机" prop="phone">
              <el-input v-model="form.phone" placeholder="选填" maxlength="11" clearable prefix-icon="el-icon-mobile-phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="选填" maxlength="64" clearable prefix-icon="el-icon-message" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信" prop="wechat">
              <el-input v-model="form.wechat" placeholder="选填" maxlength="64" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期日期" prop="expireDate">
              <el-date-picker
                v-model="form.expireDate"
                type="date"
                placeholder="选填"
                value-format="yyyy-MM-dd"
                class="full-width"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="头像" prop="avatar">
              <avatar-base64-upload v-model="form.avatar" :max-size-mb="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { encrypt } from '@/utils/encrypt/RsaUtil'
import { getUserInfo } from '@/api/upms/auth'
import { list, detail, roles, add, update, deactivate } from '@/api/upms/userManage'
import AvatarBase64Upload from '@/components/Upload/AvatarBase64Upload.vue'
import ucListTableHeight from '@/views/usercenter/mixins/ucListTableHeight'

const defaultForm = () => ({
  id: null,
  account: '',
  name: '',
  password: '',
  roleCode: '',
  phone: '',
  email: '',
  wechat: '',
  avatar: '',
  expireDate: null
})

export default {
  name: 'UserManage',
  components: {
    AvatarBase64Upload
  },
  mixins: [ucListTableHeight],
  data() {
    const validatePassword = (rule, value, callback) => {
      if (this.dialogMode === 'add') {
        if (!value) return callback(new Error('请输入密码'))
      }
      return callback()
    }

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
      loading: false,
      query: {
        account: '',
        name: ''
      },
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,

      dialogVisible: false,
      dialogMode: 'add', // add | edit
      form: defaultForm(),

      // 当前登录用户（用于限制“注销自己/改成管理员”）
      currentUser: {
        account: ''
      },

      // 当前登录角色（用于限制“当前不是管理员的人不能改成管理员”）
      currentUserRoles: [],

      currentUserLoaded: false,
      currentUserPromise: null,

      roleOptions: [],

      rules: {
        account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        password: [{ validator: validatePassword, trigger: 'blur' }],
        roleCode: [{ required: true, message: '请选择角色', trigger: 'change' }],
        phone: [{ validator: validatePhone, trigger: 'blur' }],
        email: [{ validator: validateEmail, trigger: 'blur' }],
        wechat: [{ max: 64, message: '微信最长 64 位', trigger: 'blur' }]
      }
    }
  },

  created() {
    this.fetchRoleOptions()
    this.fetchCurrentUser()
    this.fetchList()
  },

  methods: {
    async fetchCurrentUser() {
      try {
        const res = await getUserInfo()
        const data = (res && res.data) || {}
        const account =
          data.account ||
          data.username ||
          data.userAccount ||
          data.userId ||
          data.name ||
          ''

        this.currentUser.account = String(account)
        this.currentUserRoles = this.$store.getters.roles || []
      } catch (e) {
        // 如果取不到 account，则退化为仅依赖后端约束
        this.currentUser.account = ''
        this.currentUserRoles = this.$store.getters.roles || []
      } finally {
        this.currentUserLoaded = true
      }
    },

    async ensureCurrentUser() {
      if (this.currentUserLoaded) return
      if (this.currentUserPromise) return this.currentUserPromise
      this.currentUserPromise = this.fetchCurrentUser().finally(() => {
        this.currentUserPromise = null
      })
      return this.currentUserPromise
    },

    /**
     * 接口里的 disabled 表示「该条角色选项是否禁止被选择」。
     * disabled === false → 选项可选；disabled === true → 选项灰色不可选。
     * 不要用 Boolean(字符串)：Boolean('false') 在 JS 里为 true，会误判。
     */
    mapRoleOptionDisabled(raw) {
      if (raw === undefined || raw === null) return false
      if (typeof raw === 'boolean') return raw
      if (typeof raw === 'number') return raw === 1
      if (typeof raw === 'string') {
        const s = raw.trim().toLowerCase()
        return s === '1' || s === 'true' || s === 'yes'
      }
      return false
    },

    /** 兼容后端不同命名：disabled / isDisabled / disable / is_disabled */
    readItemDisabledFlag(it) {
      if (!it || typeof it !== 'object') return undefined
      if (it.disabled !== undefined && it.disabled !== null) return it.disabled
      if (it.isDisabled !== undefined && it.isDisabled !== null) return it.isDisabled
      if (it.disable !== undefined && it.disable !== null) return it.disable
      if (it.is_disabled !== undefined && it.is_disabled !== null) return it.is_disabled
      return undefined
    },

    async fetchRoleOptions() {
      try {
        const res = await roles()
        const body = (res && res.data) || {}
        // 兼容：后端可能返回 data 数组（res.data 就是数组）或包裹结构 { data: [] }
        const items = Array.isArray(body) ? body : (body.data || [])

        // 后端只给 admin/editor 两种角色；但这里仍做兜底过滤
        const mapped = items
          .map((it) => {
            const roleName = it.roleName || it.role_name || it.name || it.key || ''
            const code = roleName
            const value = it.roleName != null ? String(it.roleName) : String(roleName)
            const id = it.roleId != null ? it.roleId : (it.id != null ? it.id : it.role_id)
            return {
              code: String(code),
              value: String(value),
              id: id != null ? id : null,
              disabled: this.mapRoleOptionDisabled(this.readItemDisabledFlag(it))
            }
          })
          .filter((x) => x.code === 'admin' || x.code === 'editor')

        // 如果后端返回结构不是 code/value，尽量兜底把 key/value 用起来
        if (!mapped.length && items.length) {
          const fallback = items
            .map((it) => ({
              code: String(it.roleName || it.role_name || it.name || it.key || ''),
              value: String(it.roleName != null ? it.roleName : (it.name || it.key || it.role)),
              id: it.roleId != null ? it.roleId : (it.id != null ? it.id : it.role_id || null),
              disabled: this.mapRoleOptionDisabled(this.readItemDisabledFlag(it))
            }))
            .filter((x) => x.code === 'admin' || x.code === 'editor')
          this.roleOptions = fallback
        } else {
          this.roleOptions = mapped
        }
      } catch (e) {
        this.roleOptions = [
          { code: 'admin', value: 'admin', id: null, disabled: false },
          { code: 'editor', value: 'editor', id: null, disabled: false }
        ]
      }
    },

    async fetchList() {
      try {
        this.loading = true
        const params = {
          account: this.query.account,
          name: this.query.name,
          pageNo: this.pageNo,
          pageSize: this.pageSize
        }
        const res = await list(params)
        const result = (res && res.data) || {}
        this.pageNo = result.current || 1
        this.pageSize = result.size || this.pageSize
        this.total = result.total || 0
        this.list = result.records || []
      } catch (e) {
        this.$message.error('获取用户列表失败')
      } finally {
        this.loading = false
        this.ucSyncTableMaxHeight()
      }
    },

    handleSizeChange(val) {
      this.pageSize = val
      this.fetchList()
    },

    handleCurrentChange(val) {
      this.pageNo = val
      this.fetchList()
    },

    resetQuery() {
      this.query.account = ''
      this.query.name = ''
      this.pageNo = 1
      this.fetchList()
    },

    tableHeaderStyle() {
      return {
        background: '#f5f7fa',
        color: '#606266',
        fontWeight: '600',
        fontSize: '13px'
      }
    },

    roleTagType(row) {
      const text = String(row.roleNames || row.roleName || row.roleCode || '').toLowerCase()
      if (!text) return ''
      if (text.includes('管理员') || text.includes('admin')) return 'primary'
      return 'info'
    },

    roleDisplayText(row) {
      if (!row) return '—'
      const raw = row.roleNames != null ? row.roleNames : (row.roleName != null ? row.roleName : row.roleCode)
      if (raw == null || raw === '') return '—'
      if (Array.isArray(raw)) {
        const list = raw.map((x) => String(x).trim()).filter(Boolean)
        return list.length ? list.join('、') : '—'
      }

      const text = String(raw).trim()
      if (!text) return '—'

      try {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) {
          const list = parsed.map((x) => String(x).trim()).filter(Boolean)
          return list.length ? list.join('、') : '—'
        }
      } catch (e) {
        // noop: keep original text when it's not json array
      }

      return text.replace(/^\[|\]$/g, '').replace(/['"]/g, '').trim() || '—'
    },

    rowPhone(row) {
      if (!row) return ''
      return row.phone != null && row.phone !== '' ? row.phone : ''
    },

    rowEmail(row) {
      if (!row) return ''
      return row.email != null && row.email !== '' ? row.email : ''
    },

    rowWechat(row) {
      if (!row) return ''
      return row.wechat != null && row.wechat !== '' ? row.wechat : ''
    },

    rowExpire(row) {
      if (!row) return null
      return row.expireDate != null ? row.expireDate : row.expire_date
    },

    rowCreatedAt(row) {
      if (!row) return null
      return row.createdTime != null ? row.createdTime : row.created_time
    },

    formatExpireDate(val) {
      if (val == null || val === '') return '—'
      const s = String(val)
      return s.split('T')[0].split(' ')[0]
    },

    formatDateTime(val) {
      if (val == null || val === '') return '—'
      return String(val).replace('T', ' ').slice(0, 19)
    },

    normalizeExpireForPicker(val) {
      if (val == null || val === '') return null
      const s = String(val).split('T')[0].split(' ')[0]
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
    },

    buildBasicPayloadForSave() {
      const phone = String(this.form.phone || '').trim() || null
      const email = String(this.form.email || '').trim() || null
      const wechat = String(this.form.wechat || '').trim() || null
      const avatar = String(this.form.avatar || '').trim() || null
      const expireDate = this.form.expireDate ? String(this.form.expireDate) : null
      return {
        phone,
        email,
        wechat,
        avatar,
        expireDate
      }
    },

    openDialog(mode, row = null) {
      this.dialogMode = mode
      this.form = defaultForm()

      if (mode === 'add') {
        this.dialogVisible = true
        this.$nextTick(() => {
          if (this.$refs.userFormRef) this.$refs.userFormRef.clearValidate()
        })
        return
      }

      // edit
      const id = row && row.id != null ? row.id : null
      if (!id) return

      this.dialogVisible = true

      this.$nextTick(async() => {
        try {
          const res = await detail(id)
          const d = (res && res.data) || {}

          const formRoleCode = this.resolveRoleCodeFromDetail(d)
          this.form = {
            id: d.id != null ? d.id : id,
            account: d.account != null ? d.account : row.account || '',
            name: d.name || d.realName || row.name || '',
            password: '',
            roleCode: formRoleCode,
            phone: d.phone != null ? d.phone : this.rowPhone(row),
            email: d.email != null ? d.email : this.rowEmail(row),
            wechat: d.wechat != null ? d.wechat : this.rowWechat(row),
            avatar: d.avatar != null ? d.avatar : (row.avatar || ''),
            expireDate: this.normalizeExpireForPicker(
              d.expireDate != null ? d.expireDate : d.expire_date != null ? d.expire_date : this.rowExpire(row)
            )
          }

          this.$nextTick(() => {
            if (this.$refs.userFormRef) this.$refs.userFormRef.clearValidate()
          })
        } catch (e) {
          this.$message.error('获取用户详情失败')
        }
      })
    },

    resolveRoleCodeFromDetail(detailData) {
      // detailData: { roleIds, roleNames }（以及可能的 code/key）
      const roleNames = Array.isArray(detailData.roleNames)
        ? detailData.roleNames
        : detailData.roleNames != null
          ? [detailData.roleNames]
          : []
      const roleIds = Array.isArray(detailData.roleIds)
        ? detailData.roleIds
        : detailData.roleIds != null
          ? [detailData.roleIds]
          : []

      // 优先通过 roleNames 反查（通常 admin/editor 会映射成中文）
      if (roleNames.length) {
        const match = this.roleOptions.find((o) => o.value === roleNames[0] || o.code === roleNames[0])
        if (match) return match.code
      }

      // 再通过 roleIds 匹配 roleOptions 里的 id
      if (roleIds.length) {
        const match = this.roleOptions.find((o) => o.id != null && String(o.id) === String(roleIds[0]))
        if (match) return match.code
      }

      // 最后：如果 detailData 自己带 roleCode
      const directCode = detailData.roleCode || detailData.role || detailData.code || ''
      if (directCode) return String(directCode)

      // 兜底：为空则取 editor
      return 'editor'
    },

    async handleSubmit() {
      this.$refs.userFormRef.validate(async(valid) => {
        if (!valid) return

        try {
          if (this.dialogMode === 'edit') {
            await this.handleUpdate()
          } else {
            await this.handleAdd()
          }
          this.dialogVisible = false
          this.fetchList()
        } catch (e) {
          // handleAdd/handleUpdate 内部已做提示
        }
      })
    },

    getSelectedRoleIdByCode(roleCode) {
      const opt = this.roleOptions.find((o) => o.code === roleCode)
      return opt && opt.id != null ? opt.id : roleCode
    },

    /** 与项目内其它页面一致：成功 code 000000 / 200 或 success，且排除 999999、status ERROR */
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

    /**
     * 后端业务失败时 axios 仍 resolve（如 999999），必须在这里拦截，避免误提示「成功」
     */
    throwIfManageApiFailed(res, defaultMsg = '操作失败') {
      if (this.isManageApiSuccess(res)) return
      const msg = (res && res.message) || defaultMsg
      // 999999 在 request 拦截器里已 Message.warning，避免重复弹窗
      if (String(res && res.code) !== '999999') {
        this.$message.error(msg)
      }
      throw new Error(msg)
    },

    async handleAdd() {
      const encryptedPassword = await encrypt(String(this.form.password))
      const roleId = this.getSelectedRoleIdByCode(this.form.roleCode)

      const payload = {
        account: this.form.account,
        name: this.form.name,
        password: encryptedPassword,
        roleIds: [roleId],
        ...this.buildBasicPayloadForSave()
      }
      const res = await add(payload)
      this.throwIfManageApiFailed(res, '新增用户失败')
      this.$message.success('新增用户成功')
    },

    async handleUpdate() {
      await this.ensureCurrentUser()
      // 校验：当前用户不可把自己修改为管理员
      const isSelf = this.currentUser.account && this.form.account && String(this.form.account) === String(this.currentUser.account)
      const targetIsAdmin = String(this.form.roleCode) === 'admin'
      const currentIsAdmin = (this.currentUserRoles || []).includes('admin')

      if (isSelf && targetIsAdmin && !currentIsAdmin) {
        this.$message.warning('当前登录用户不可将自己修改为管理员')
        throw new Error('blocked')
      }

      const roleId = this.getSelectedRoleIdByCode(this.form.roleCode)
      const payload = {
        id: this.form.id,
        account: String(this.form.account || '').trim(),
        name: this.form.name,
        roleIds: [roleId],
        ...this.buildBasicPayloadForSave()
      }

      const pwd = String(this.form.password || '').trim()
      if (pwd) {
        payload.password = await encrypt(pwd)
      }

      const res = await update(payload)
      this.throwIfManageApiFailed(res, '编辑用户失败')
      this.$message.success('编辑用户成功')
    },

    async handleDeactivate(row) {
      await this.ensureCurrentUser()
      const rowAccount = row && row.account != null ? String(row.account) : ''
      const isSelf = this.currentUser.account && rowAccount && rowAccount === String(this.currentUser.account)
      if (isSelf) {
        this.$message.warning('当前登录用户不可注销自己')
        return
      }

      try {
        await this.$confirm('确定要注销该用户吗？', '警告', {
          confirmButtonText: '注销',
          cancelButtonText: '取消',
          type: 'warning'
        })

        await this.$confirm('该操作将立即使用户无法登录，是否继续？', '二次确认', {
          confirmButtonText: '继续注销',
          cancelButtonText: '再想想',
          type: 'warning'
        })

        const res = await deactivate(row.id)
        this.throwIfManageApiFailed(res, '注销用户失败')
        this.$message.success('注销用户成功')
        this.fetchList()
      } catch (e) {
        // 取消确认会走这里，不提示
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import './uc-shared.scss';

.text-muted {
  color: #c0c4cc;
}

.cell-strong {
  font-weight: 500;
  color: #303133;
}

.role-pill {
  border-radius: 999px;
  padding: 0 10px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.btn-danger-text {
  color: #f56c6c !important;

  &:hover {
    color: #f78989 !important;
  }
}

.dialog-form {
  padding: 4px 4px 0;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.full-width {
  width: 100%;
}

.dialog-footer {
  text-align: right;
}
</style>

<style lang="scss">
@import './uc-dialog.scss';
</style>

