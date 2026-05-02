<template>
  <div class="app-container uc-container contact-manage-page">
    <div class="uc-body">
      <div class="uc-list">
        <div class="uc-page-head">
          <h1 class="uc-page-head__title">联系人管理</h1>
          <p class="uc-page-head__desc">维护常用联系人信息，支持按姓名检索与增删改</p>
        </div>

        <div class="uc-search">
          <div class="uc-search__left">
            <div class="uc-search__label">姓名：</div>
            <el-input
              v-model="query.name"
              placeholder="请输入关键词"
              clearable
              size="small"
              prefix-icon="el-icon-user"
              class="uc-search__input"
              @keyup.enter.native="handleSearch"
            />
          </div>
          <div class="uc-search__right">
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleSearch">查询</el-button>
            <el-button icon="el-icon-refresh-left" size="small" @click="resetQuery">重置</el-button>
            <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog('add')">新增联系人</el-button>
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
            empty-text="暂无联系人数据"
          >
            <el-table-column type="index" label="#" width="56" align="center" />
            <el-table-column prop="name" label="姓名" min-width="120" show-overflow-tooltip>
              <template slot-scope="scope">
                <span class="cell-strong">{{ scope.row.name || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="手机号" min-width="128" show-overflow-tooltip />
            <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
            <el-table-column label="预警方式" min-width="160" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ formatAlertMethodsDisplay(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="148" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="mini"
                  class="btn-link-action"
                  @click.native.prevent="openDialog('edit', scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="text"
                  size="mini"
                  class="btn-danger-text"
                  @click.native.prevent="handleDelete(scope.row)"
                >
                  删除
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
      :title="dialogMode === 'edit' ? '编辑联系人' : '新增联系人'"
      width="800px"
      :close-on-click-modal="false"
      custom-class="uc-manage-dialog contact-dialog"
      append-to-body
    >
      <el-form
        ref="contactFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="contact-dialog-form"
      >
        <!-- 与姓名/手机/邮箱同一 el-row，避免单独一行被弹窗滚动/边距裁切 -->
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" maxlength="64" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="128" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="预警方式" prop="alertMethods" class="contact-alert-method-item">
              <el-select
                v-model="form.alertMethods"
                multiple
                filterable
                collapse-tags
                placeholder="请选择预警方式（可多选，必填）"
                class="contact-alert-select full-width"
                popper-class="contact-alert-select-dropdown"
              >
                <!-- 与 task.vue 失败策略一致：value 用字典项 code，label 用展示文案 -->
                <el-option
                  v-for="(opt, idx) in alertMethodOptions"
                  :key="String(opt.value) + '_' + idx"
                  :label="opt.label"
                  :value="String(opt.value)"
                  :disabled="isAlertMethodSelected(opt.value)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入备注"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <div slot="footer" class="contact-dialog-footer dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { list, add, update, remove, detail } from '@/api/upms/contactManage'
import dictCode from '@/api/dict/dictCode.js'
import { getDict } from '@/api/dict/dict'
import ucListTableHeight from '@/views/usercenter/mixins/ucListTableHeight'

/**
 * 与 task.vue / FTP 等页一致：拦截器返回 body 后，字典列表可能在 data、data.data、list 等字段
 */
function normalizeDictList(dictRes) {
  if (Array.isArray(dictRes)) return dictRes
  const raw = dictRes && dictRes.data
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.data)) return raw.data
  if (raw && Array.isArray(raw.list)) return raw.list
  if (raw && Array.isArray(raw.records)) return raw.records
  if (raw && Array.isArray(raw.rows)) return raw.rows
  if (raw && Array.isArray(raw.dictList)) return raw.dictList
  return []
}

/**
 * 与 task.vue 失败策略一致：提交值为字典 code（或 itemValue/key 等），展示为 dictLabel/itemText/value 等。
 * 须兼容后端多种字段名，省略 itemValue/key 会导致整表无选项或选中对不上。
 */
function mapDictToAlertOptions(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (item == null) return null
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        const v = String(item).trim()
        return v ? { label: v, value: v } : null
      }
      if (typeof item !== 'object') return null

      const code =
        item.code != null && String(item.code) !== ''
          ? String(item.code)
          : item.dictCode != null && String(item.dictCode) !== ''
            ? String(item.dictCode)
            : item.itemValue != null && String(item.itemValue) !== ''
              ? String(item.itemValue)
              : item.key != null && String(item.key) !== ''
                ? String(item.key)
                : ''

      const valueFallback =
        item.value != null && String(item.value) !== '' ? String(item.value) : ''
      const optionValue = code || valueFallback
      if (!optionValue) return null

      const label =
        item.dictLabel != null && String(item.dictLabel) !== ''
          ? String(item.dictLabel)
          : item.itemText != null && String(item.itemText) !== ''
            ? String(item.itemText)
            : item.label != null && String(item.label) !== ''
              ? String(item.label)
              : item.name != null && String(item.name) !== ''
                ? String(item.name)
                : valueFallback && valueFallback !== optionValue
                  ? valueFallback
                  : item.value != null && String(item.value) !== ''
                    ? String(item.value)
                    : optionValue

      return { label: label || optionValue, value: optionValue }
    })
    .filter(Boolean)
}

function parseAlertMethodsFromRow(row) {
  if (!row || typeof row !== 'object') return []
  const raw =
    row.alertMethods != null
      ? row.alertMethods
      : row.alert_methods != null
        ? row.alert_methods
        : row.warningMethods != null
          ? row.warningMethods
          : row.warning_methods
  if (Array.isArray(raw)) {
    return raw
      .map((x) => {
        if (x == null) return ''
        if (typeof x === 'object') {
          return x.code != null ? String(x.code).trim() : x.value != null ? String(x.value).trim() : ''
        }
        return String(x).trim()
      })
      .filter(Boolean)
  }
  if (typeof raw === 'string' && raw.trim()) {
    const s = raw.trim()
    // 兼容后端返回 JSON 字符串，如 "[\"0\",\"1\"]"
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
      try {
        const parsed = JSON.parse(s)
        if (Array.isArray(parsed)) {
          return parsed.map((x) => String(x).trim()).filter(Boolean)
        }
      } catch (e) {
        // 非 JSON 时继续按逗号分隔
      }
    }
    return raw
      .split(/[,，;；]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

const defaultForm = () => ({
  id: null,
  name: '',
  phone: '',
  email: '',
  alertMethods: [],
  remark: ''
})

export default {
  name: 'ContactManage',
  mixins: [ucListTableHeight],
  data() {
    const validatePhone = (rule, value, callback) => {
      if (value == null || String(value).trim() === '') {
        return callback()
      }
      const s = String(value).trim()
      if (!/^1\d{10}$/.test(s)) {
        return callback(new Error('请输入 11 位有效手机号'))
      }
      return callback()
    }

    const validateEmail = (rule, value, callback) => {
      if (value == null || String(value).trim() === '') {
        return callback()
      }
      const s = String(value).trim()
      if (s.length > 128) return callback(new Error('邮箱最长 128 位'))
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
      if (!ok) return callback(new Error('邮箱格式不正确'))
      return callback()
    }

    return {
      alertMethodOptions: [],

      loading: false,
      query: { name: '' },
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,

      dialogVisible: false,
      dialogMode: 'add',
      form: defaultForm(),

      rules: {
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        phone: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { validator: validatePhone, trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { validator: validateEmail, trigger: 'blur' }
        ],
        alertMethods: [
          { type: 'array', required: true, message: '请选择预警方式', trigger: 'change' },
          { type: 'array', min: 1, message: '请至少选择一种预警方式', trigger: 'change' }
        ]
      }
    }
  },

  created() {
    this.fetchList()
    this.initAlertMethodDict()
  },

  methods: {
    /**
     * 拉取 alert_method 字典（与 task.vue getDict(dictCode.xxx) 用法一致）
     */
    async initAlertMethodDict() {
      const dictCodeStr =
        dictCode && dictCode.ALERT_METHOD != null && String(dictCode.ALERT_METHOD) !== ''
          ? String(dictCode.ALERT_METHOD)
          : 'alert_method'
      try {
        const dictRes = await getDict(dictCodeStr)
        const items = normalizeDictList(dictRes)
        this.alertMethodOptions = mapDictToAlertOptions(items)
        this.syncFormAlertMethodsByOptions()
      } catch (e) {
        this.alertMethodOptions = []
        this.$message.error('获取预警方式字典失败')
      }
    },

    formatAlertMethodsDisplay(row) {
      const codes = parseAlertMethodsFromRow(row)
      if (!codes.length) return '—'
      const labelMap = {}
      this.alertMethodOptions.forEach((o) => {
        labelMap[o.value] = o.label
      })
      return codes.map((c) => labelMap[c] || c).join('、')
    },
    normalizeAlertMethods(values) {
      if (!Array.isArray(values)) return []
      const set = new Set()
      values.forEach((x) => {
        const v = x == null ? '' : String(x).trim()
        if (v) set.add(v)
      })
      return Array.from(set)
    },
    syncFormAlertMethodsByOptions() {
      const selected = this.normalizeAlertMethods(this.form && this.form.alertMethods)
      const optionValues = (this.alertMethodOptions || []).map((o) => String(o.value))
      if (!optionValues.length) {
        this.form.alertMethods = selected
        return
      }
      const allowSet = new Set(optionValues)
      this.form.alertMethods = selected.filter((x) => allowSet.has(x))
    },
    isAlertMethodSelected(optionValue) {
      const selected = this.normalizeAlertMethods(this.form.alertMethods)
      const current = optionValue == null ? '' : String(optionValue).trim()
      return current ? selected.includes(current) : false
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

    async fetchList() {
      try {
        this.loading = true
        const params = {
          name: this.query.name,
          pageNo: this.pageNo,
          pageSize: this.pageSize
        }
        const res = await list(params)
        const result = (res && res.data) || {}
        this.pageNo = result.current != null ? result.current : this.pageNo
        this.pageSize = result.size != null ? result.size : this.pageSize
        this.total = result.total != null ? result.total : 0
        this.list = result.records || result.list || []
      } catch (e) {
        this.$message.error('获取联系人列表失败')
      } finally {
        this.loading = false
        this.ucSyncTableMaxHeight()
      }
    },

    handleSearch() {
      this.pageNo = 1
      this.fetchList()
    },

    resetQuery() {
      this.query.name = ''
      this.pageNo = 1
      this.fetchList()
    },

    handleSizeChange(val) {
      this.pageSize = val
      this.fetchList()
    },

    handleCurrentChange(val) {
      this.pageNo = val
      this.fetchList()
    },

    tableHeaderStyle() {
      return {
        background: '#f8fafc',
        color: '#606266',
        fontWeight: '600',
        fontSize: '13px'
      }
    },

    openDialog(mode, row = null) {
      if (!this.alertMethodOptions.length) {
        this.initAlertMethodDict()
      }

      this.dialogMode = mode
      this.form = defaultForm()

      if (mode === 'add') {
        this.dialogVisible = true
        this.$nextTick(() => {
          if (this.$refs.contactFormRef) this.$refs.contactFormRef.clearValidate()
        })
        return
      }

      const id = row && row.id != null ? row.id : null
      if (!id) return

      this.dialogVisible = true

      this.$nextTick(async() => {
        try {
          const res = await detail(id)
          if (!this.isManageApiSuccess(res)) {
            this.throwIfManageApiFailed(res, '获取联系人详情失败')
          }
          const d = (res && res.data) || {}
          this.form = {
            id: d.id != null ? d.id : id,
            name: d.name != null ? String(d.name) : '',
            phone: d.phone != null ? String(d.phone) : '',
            email: d.email != null ? String(d.email) : '',
            alertMethods: this.normalizeAlertMethods(parseAlertMethodsFromRow(d)),
            remark: d.remark != null ? String(d.remark) : ''
          }
          this.syncFormAlertMethodsByOptions()
          this.$nextTick(() => {
            if (this.$refs.contactFormRef) this.$refs.contactFormRef.clearValidate()
          })
        } catch (e) {
          this.dialogVisible = false
        }
      })
    },

    handleSubmit() {
      this.$refs.contactFormRef.validate(async(valid) => {
        if (!valid) return
        this.syncFormAlertMethodsByOptions()

        const payload = {
          name: String(this.form.name || '').trim(),
          phone: String(this.form.phone || '').trim(),
          email: String(this.form.email || '').trim(),
          alertMethods: this.normalizeAlertMethods(this.form.alertMethods),
          remark: String(this.form.remark || '').trim()
        }

        try {
          if (this.dialogMode === 'edit') {
            const res = await update({ id: this.form.id, ...payload })
            this.throwIfManageApiFailed(res, '保存联系人失败')
            this.$message.success('保存成功')
          } else {
            const res = await add(payload)
            this.throwIfManageApiFailed(res, '新增联系人失败')
            this.$message.success('新增成功')
          }
          this.dialogVisible = false
          this.fetchList()
        } catch (e) {
          // 错误已在 throwIfManageApiFailed 中提示
        }
      })
    },

    async handleDelete(row) {
      if (!row || row.id == null) return
      try {
        await this.$confirm('确定要删除该联系人吗？', '提示', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const res = await remove(row.id)
        this.throwIfManageApiFailed(res, '删除失败')
        this.$message.success('删除成功')
        this.fetchList()
      } catch (e) {
        if (e !== 'cancel') {
          // 非用户取消：错误已提示或由接口抛出
        }
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import './uc-shared.scss';

.dialog-footer {
  text-align: right;
}

.full-width {
  width: 100%;
}
</style>

<style lang="scss">
@import './uc-dialog.scss';
</style>
