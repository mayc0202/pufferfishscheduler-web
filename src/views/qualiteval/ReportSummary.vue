<template>
  <div class="page">
    <div class="head">
      <div class="title">评测报告总览</div>
      <el-button type="primary" size="small" @click="loadData">刷新</el-button>
    </div>
    <el-row :gutter="12" class="cards">
      <el-col :span="6"><div class="card">总评测数：{{ summaryData.totalRecords || 0 }}</div></el-col>
      <el-col :span="6"><div class="card">问题总数：{{ summaryData.problemCount || 0 }}</div></el-col>
      <el-col :span="6"><div class="card">待修复：{{ summaryData.pendingCount || 0 }}</div></el-col>
      <el-col :span="6"><div class="card">已修复：{{ summaryData.fixedCount || 0 }}</div></el-col>
    </el-row>

    <el-table v-loading="loading" :data="records">
      <el-table-column type="index" width="56" label="#" />
      <el-table-column prop="ruleName" label="规则" min-width="160" />
      <el-table-column prop="totalRecords" label="评测数据量" width="120" />
      <el-table-column prop="problemCount" label="问题数" width="120" />
      <el-table-column prop="fixedCount" label="已修复" width="120" />
      <el-table-column prop="statusTxt" label="状态" width="120" />
      <el-table-column label="操作" width="120" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" @click="viewIssues(scope.row)">查看问题</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { summary } from '@/api/qualiteval/report'

export default {
  name: 'QualitevalReportSummary',
  data() {
    return {
      loading: false,
      summaryData: {},
      records: []
    }
  },
  watch: {
    '$route.params.modelId'() {
      this.loadData()
    },
    '$route.query.modelId'() {
      this.loadData()
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const modelId = this.$route.params.modelId || this.$route.query.modelId
        const res = await summary({ modelId })
        const data = (res && res.data) || {}
        this.summaryData = data
        this.records = data.records || data.ruleStats || []
      } finally {
        this.loading = false
      }
    },
    viewIssues(row) {
      const resultId = row.resultId || row.id
      this.$router.push({ path: `/qualiteval/issues/${resultId}`, query: { modelId: this.$route.params.modelId || this.$route.query.modelId }})
    }
  }
}
</script>

<style scoped>
.page { padding: 14px; background: #fff; border-radius: 10px; min-height: calc(100vh - 96px); }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.title { font-size: 16px; font-weight: 600; color: #1f3358; }
.cards { margin-bottom: 12px; }
.card { background: #f7f9ff; border: 1px solid #e8eefc; border-radius: 8px; padding: 12px; }
</style>
