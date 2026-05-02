<template>
  <div class="page">
    <el-alert
      v-if="hubHint"
      :title="hubHint"
      type="info"
      :closable="false"
      show-icon
      class="hub-alert"
    />
    <div class="toolbar">
      <el-select v-if="isHubRoute" v-model="hubModelId" clearable filterable placeholder="按模型筛选" class="w220" @change="onHubModelChange">
        <el-option v-for="m in modelOptions" :key="m.id" :label="m.name" :value="m.id" />
      </el-select>
      <el-select v-model="query.status" clearable placeholder="问题状态" class="w180">
        <el-option label="待修复" value="PENDING" />
        <el-option label="已修复" value="FIXED" />
      </el-select>
      <el-button type="primary" icon="el-icon-search" @click="loadList(true)">查询</el-button>
      <el-button type="primary" :disabled="exportDisabled" @click="exportVisible = true">导出</el-button>
    </div>
    <el-table v-loading="loading" :data="list">
      <el-table-column type="index" width="56" label="#" />
      <el-table-column prop="tableName" label="表名" min-width="120" />
      <el-table-column prop="fieldName" label="字段名" min-width="120" />
      <el-table-column prop="dataType" label="数据类型" width="110" />
      <el-table-column prop="fieldValue" label="字段值" min-width="180" />
      <el-table-column prop="issueReason" label="不合格原因" min-width="160" />
      <el-table-column prop="fixSuggestion" label="修复建议" min-width="160" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column label="操作" fixed="right" width="120">
        <template slot-scope="scope">
          <el-button v-if="scope.row.status !== 'FIXED'" type="text" @click="markFixed(scope.row)">标记修复</el-button>
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
    <export-dialog :visible.sync="exportVisible" @submit="doExport" />
  </div>
</template>

<script>
import { exportReport } from '@/api/qualiteval/report'
import { list as issueList, fix } from '@/api/qualiteval/issue'
import { list as modelList } from '@/api/qualiteval/model'
import ExportDialog from './components/ExportDialog.vue'

export default {
  name: 'QualitevalIssueList',
  components: { ExportDialog },
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      query: { status: '', pageNo: 1, pageSize: 10 },
      exportVisible: false,
      modelOptions: [],
      hubModelId: ''
    }
  },
  computed: {
    isHubRoute() {
      return this.$route.name === 'QualitevalIssueHub'
    },
    effectiveResultId() {
      return this.$route.params.resultId || this.$route.query.resultId || ''
    },
    effectiveModelId() {
      if (this.hubModelId) return this.hubModelId
      return this.$route.query.modelId || ''
    },
    hubHint() {
      if (!this.isHubRoute) return ''
      if (!this.effectiveResultId && !this.effectiveModelId) {
        return '可从「质检报告」点击「查看问题」进入指定结果，或在此选择模型后查询。'
      }
      return ''
    },
    exportDisabled() {
      return !this.effectiveResultId && !this.effectiveModelId
    }
  },
  watch: {
    '$route.params.resultId'() {
      this.loadList(true)
    },
    '$route.query.modelId'(v) {
      if (this.isHubRoute) this.hubModelId = v || ''
      this.loadList(true)
    },
    '$route.query.resultId'() {
      this.loadList(true)
    }
  },
  created() {
    this.hubModelId = this.$route.query.modelId || ''
    if (this.isHubRoute) this.loadModelOptions()
    this.loadList()
  },
  methods: {
    async loadModelOptions() {
      try {
        const mRes = await modelList({ pageNo: 1, pageSize: 500 })
        this.modelOptions = (mRes && mRes.data && mRes.data.records) || []
      } catch (e) {
        this.modelOptions = []
      }
    },
    onHubModelChange() {
      this.loadList(true)
    },
    async loadList(reset = false) {
      if (reset) this.query.pageNo = 1
      this.loading = true
      try {
        const q = {
          ...this.query,
          resultId: this.effectiveResultId || undefined,
          modelId: this.effectiveModelId || undefined
        }
        const res = await issueList(q)
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
    async markFixed(row) {
      await fix(row.id)
      this.$message.success('已标记修复')
      this.loadList()
    },
    async doExport(form) {
      const resultId = this.effectiveResultId || undefined
      const modelId = this.effectiveModelId || undefined
      const resp = await exportReport({ ...form, resultId, modelId })
      const blob = resp && resp.data ? resp.data : resp
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'qualiteval-issues.xlsx')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      this.exportVisible = false
    }
  }
}
</script>

<style scoped>
.page { padding: 14px; background: #fff; border-radius: 10px; min-height: calc(100vh - 96px); }
.hub-alert { margin-bottom: 12px; }
.toolbar { margin-bottom: 14px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.w180 { width: 180px; }
.w220 { width: 220px; }
.pager { margin-top: 12px; text-align: right; }
</style>
