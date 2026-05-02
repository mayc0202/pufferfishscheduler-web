<template>
  <div class="page">
    <div class="toolbar">
      <el-select v-model="query.modelId" clearable placeholder="模型" class="w180">
        <el-option v-for="m in modelOptions" :key="m.id" :label="m.name" :value="m.id" />
      </el-select>
      <el-input v-model="query.taskName" placeholder="任务名称" clearable class="w220" />
      <el-button type="primary" icon="el-icon-search" @click="loadList(true)">查询</el-button>
      <el-button type="primary" @click="openCreate">新增任务</el-button>
    </div>
    <el-table v-loading="loading" :data="list">
      <el-table-column type="index" width="56" label="#" />
      <el-table-column prop="taskName" label="任务名称" min-width="180" />
      <el-table-column prop="scheduleCron" label="调度配置" min-width="180" />
      <el-table-column prop="statusTxt" label="状态" width="120" />
      <el-table-column prop="lastExecuteTime" label="最近执行时间" min-width="170" />
      <el-table-column label="操作" width="280" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" @click="openEdit(scope.row)">编辑</el-button>
          <el-button type="text" @click="onToggle(scope.row)">{{ isTaskEnabled(scope.row) ? '停用' : '启用' }}</el-button>
          <el-button type="text" @click="onExecute(scope.row)">立即执行</el-button>
          <el-button type="text" @click="onDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pager">
      <el-pagination
        :current-page="query.pageNo"
        :page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next, jumper"
        @current-change="onPageChange"
      />
    </div>

    <task-form
      :visible.sync="formVisible"
      :value="currentForm"
      :model-options="modelOptions"
      :rule-options="ruleOptions"
      @submit="onSubmit"
    />
  </div>
</template>

<script>
import TaskForm from './TaskForm.vue'
import { list as modelList } from '@/api/qualiteval/model'
import { list as ruleList } from '@/api/qualiteval/rule'
import { list, create, update, execute, remove } from '@/api/qualiteval/task'

function normalizeTaskRuleIds(raw) {
  if (raw == null || raw === '') return []
  if (Array.isArray(raw)) {
    return raw.map((x) => Number(x)).filter((n) => !Number.isNaN(n))
  }
  if (typeof raw === 'string') {
    const s = raw.trim()
    if (!s) return []
    try {
      const j = JSON.parse(s)
      return Array.isArray(j) ? j.map((x) => Number(x)).filter((n) => !Number.isNaN(n)) : []
    } catch {
      return s.split(/[,;]/).map((t) => Number(t.trim())).filter((n) => !Number.isNaN(n))
    }
  }
  return []
}

export default {
  name: 'QualitevalTaskList',
  components: { TaskForm },
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      query: { modelId: '', taskName: '', pageNo: 1, pageSize: 10 },
      formVisible: false,
      currentForm: {},
      modelOptions: [],
      ruleOptions: []
    }
  },
  created() {
    this.query.modelId = this.$route.query.modelId || ''
    this.loadOptions()
    this.loadList()
  },
  methods: {
    async loadOptions() {
      const [mRes, rRes] = await Promise.all([modelList({ pageNo: 1, pageSize: 200 }), ruleList({ pageNo: 1, pageSize: 1000 })])
      this.modelOptions = (mRes && mRes.data && mRes.data.records) || []
      this.ruleOptions = (rRes && rRes.data && rRes.data.records) || []
    },
    async loadList(reset = false) {
      if (reset) this.query.pageNo = 1
      this.loading = true
      try {
        const res = await list(this.query)
        const data = (res && res.data) || {}
        this.list = data.records || []
        this.total = data.total || 0
      } finally {
        this.loading = false
      }
    },
    onPageChange(page) {
      this.query.pageNo = page
      this.loadList()
    },
    openCreate() {
      this.currentForm = { modelId: this.query.modelId || '' }
      this.formVisible = true
    },
    openEdit(row) {
      this.currentForm = { ...row }
      this.formVisible = true
    },
    async onSubmit(payload) {
      const ruleIds = normalizeTaskRuleIds(payload.ruleIds)
      const formStatus = payload.status != null ? String(payload.status) : ''
      const enableUi = formStatus !== 'DISABLE'
      const statusForApi = formStatus && formStatus !== 'ENABLE' && formStatus !== 'DISABLE' ? formStatus : 'INIT'
      const submitPayload = {
        ...payload,
        ruleIds,
        flinkJobId: payload.flinkJobId != null ? String(payload.flinkJobId) : '',
        enable: payload.enable !== undefined ? !!payload.enable : enableUi,
        status: statusForApi
      }
      if (submitPayload.id) await update(submitPayload)
      else await create(submitPayload)
      this.$message.success('保存成功')
      this.formVisible = false
      this.loadList()
    },
    isTaskEnabled(row) {
      if (row.enable === false || row.enable === 0 || row.enable === '0') return false
      if (row.enable === true || row.enable === 1 || row.enable === '1') return true
      const s = row.status != null ? row.status : row.enabled
      if (s === false || s === 0 || s === '0' || s === 'DISABLE' || s === 'DISABLED' || s === 'STOP') return false
      if (s === true || s === 1 || s === '1' || s === 'ENABLE' || s === 'ENABLED' || s === 'RUNNING') return true
      const txt = String(row.statusTxt || row.statusLabel || '').toLowerCase()
      if (txt.includes('停') || txt.includes('禁')) return false
      return true
    },
    async onToggle(row) {
      const next = !this.isTaskEnabled(row)
      const ruleIds = normalizeTaskRuleIds(row.ruleIds)
      try {
        await update({
          id: row.id,
          taskName: row.taskName,
          modelId: row.modelId,
          ruleIds,
          scheduleCron: row.scheduleCron || '',
          flinkJobId: row.flinkJobId != null ? String(row.flinkJobId) : '',
          status: row.status != null && row.status !== '' ? String(row.status) : 'INIT',
          enable: next
        })
        this.$message.success(next ? '已启用' : '已停用')
        this.loadList()
      } catch (e) {
        this.$message.warning('更新任务失败或服务不可用')
      }
    },
    async onExecute(row) {
      try {
        await execute(row.id)
        this.$message.success('执行请求已提交')
      } catch (e) {
        this.$message.warning('执行请求失败或服务不可用')
      }
    },
    onDelete(row) {
      this.$confirm('确认删除该任务？', '提示', { type: 'warning' }).then(async() => {
        await remove(row.id)
        this.$message.success('删除成功')
        this.loadList()
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.page { padding: 14px; background: #fff; border-radius: 10px; min-height: calc(100vh - 96px); }
.toolbar { margin-bottom: 14px; display: flex; gap: 10px; align-items: center; }
.w180 { width: 180px; }
.w220 { width: 220px; }
.pager { margin-top: 12px; text-align: right; }
</style>
