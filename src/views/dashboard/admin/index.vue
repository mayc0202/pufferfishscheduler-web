<template>
  <div class="dashboard-container">
    <div class="hero">
      <div>
        <h1>数据集成总览</h1>
      </div>
      <div class="hero-actions">
        <span class="update-time">更新时间：{{ lastUpdateText }}</span>
        <el-button size="mini" type="primary" icon="el-icon-refresh" :loading="loading" @click="refreshDashboard">
          刷新数据
        </el-button>
      </div>
    </div>

    <div class="stats-cards">
      <div v-for="item in moduleCards" :key="item.key" class="card">
        <div class="card-icon" :class="item.iconClass">
          <i :class="item.icon" />
        </div>
        <div class="card-content">
          <div class="card-title">{{ item.title }}</div>
          <div class="card-value">{{ item.total }}</div>
          <div class="card-desc">{{ item.desc }}</div>
          <div class="status-lines">
            <div v-for="status in item.topStatuses" :key="status.label" class="status-line">
              <span class="status-label">{{ status.label }}</span>
              <span class="status-value">{{ status.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="kpi-strip">
      <div class="kpi-item">
        <div class="kpi-label">任务总量</div>
        <div class="kpi-value">{{ globalMetrics.totalTasks }}</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-label">运行中任务</div>
        <div class="kpi-value accent-running">{{ globalMetrics.runningTasks }}</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-label">失败任务</div>
        <div class="kpi-value accent-failed">{{ globalMetrics.failedTasks }}</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-label">失败率</div>
        <div class="kpi-value">{{ globalMetrics.failureRate }}%</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-label">模块覆盖数</div>
        <div class="kpi-value">{{ globalMetrics.moduleCount }}</div>
      </div>
    </div>

    <div class="charts-section">
      <div class="chart-card">
        <div class="chart-header">
          <h3>状态分布对比</h3>
        </div>
        <div ref="statusStackChart" class="chart" />
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <h3>全局状态占比</h3>
        </div>
        <div ref="statusDonutChart" class="chart" />
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <h3>模块健康度</h3>
        </div>
        <div class="health-list">
          <div v-for="item in healthRows" :key="item.name" class="health-row">
            <div class="health-title">
              <span>{{ item.name }}</span>
              <span class="health-score">{{ item.score }}%</span>
            </div>
            <el-progress :percentage="item.score" :show-text="false" :stroke-width="10" :color="item.color" />
            <div class="health-meta">
              <span>运行中 {{ item.running }}</span>
              <span>失败 {{ item.failed }}</span>
              <span>总数 {{ item.total }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="knowledge-section">
      <div class="section-title">知识库概览</div>
      <div class="knowledge-kpis">
        <div class="knowledge-kpi">
          <div class="label">知识条目总数</div>
          <div class="value">{{ knowledgeBaseStats.total }}</div>
        </div>
        <div class="knowledge-kpi">
          <div class="label">分类数量</div>
          <div class="value">{{ knowledgeBaseStats.categories }}</div>
        </div>
        <div class="knowledge-kpi">
          <div class="label">标签数量</div>
          <div class="value">{{ knowledgeBaseStats.tags }}</div>
        </div>
        <div class="knowledge-kpi">
          <div class="label">今日更新</div>
          <div class="value">{{ knowledgeBaseStats.updatedToday }}</div>
        </div>
      </div>
      <el-table :data="knowledgeBaseMockList" stripe class="knowledge-table">
        <el-table-column prop="title" label="标题" min-width="260" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="tag" label="标签" width="160" />
        <el-table-column prop="uploader" label="上传人" width="110" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
      </el-table>
    </div>
  </div>
</template>

<script>
import echarts from 'echarts'
import dictCode from '@/api/dict/dictCode'
import { getDict } from '@/api/dict/dict'
import { getDbList } from '@/api/database/database/database'
import { list as metadataList } from '@/api/database/metadata/metadata'
import { list as cleanTaskList } from '@/api/collect/task/transtask'
import { list as realtimeTaskList } from '@/api/collect/realtime/realtime'

export default {
  name: 'DashboardAdmin',
  data() {
    return {
      loading: false,
      lastUpdate: null,
      taskStatusOptions: [],
      summaries: {
        dataSource: { total: 0, statuses: [] },
        metadata: { total: 0, statuses: [] },
        cleanTask: { total: 0, statuses: [] },
        realtimeTask: { total: 0, statuses: [] },
        knowledgeBase: { total: 0, statuses: [] }
      },
      statusStackChart: null,
      statusDonutChart: null
    }
  },
  computed: {
    lastUpdateText() {
      if (!this.lastUpdate) return '--'
      return this.lastUpdate
    },
    moduleCards() {
      return [
        {
          key: 'dataSource',
          title: '数据源接入',
          total: this.summaries.dataSource.total,
          desc: '数据资产入口规模',
          icon: 'el-icon-coin',
          iconClass: 'icon-datasource',
          topStatuses: this.takeTopStatuses(this.summaries.dataSource.statuses)
        },
        {
          key: 'metadata',
          title: '元数据同步任务',
          total: this.summaries.metadata.total,
          desc: '元数据采集执行状态',
          icon: 'el-icon-s-operation',
          iconClass: 'icon-metadata',
          topStatuses: this.takeTopStatuses(this.summaries.metadata.statuses)
        },
        {
          key: 'cleanTask',
          title: '清洗任务',
          total: this.summaries.cleanTask.total,
          desc: '离线清洗任务运行概览',
          icon: 'el-icon-magic-stick',
          iconClass: 'icon-clean',
          topStatuses: this.takeTopStatuses(this.summaries.cleanTask.statuses)
        },
        {
          key: 'realtimeTask',
          title: '实时归集任务',
          total: this.summaries.realtimeTask.total,
          desc: 'CDC 归集链路健康度',
          icon: 'el-icon-connection',
          iconClass: 'icon-realtime',
          topStatuses: this.takeTopStatuses(this.summaries.realtimeTask.statuses)
        }
      ]
    },
    globalMetrics() {
      const statusPool = [
        ...(this.summaries.metadata.statuses || []),
        ...(this.summaries.cleanTask.statuses || []),
        ...(this.summaries.realtimeTask.statuses || [])
      ]
      const totalTasks = this.summaries.metadata.total + this.summaries.cleanTask.total + this.summaries.realtimeTask.total
      const runningTasks = statusPool
        .filter(item => /运行|执行中|启动|处理中/i.test(item.label))
        .reduce((sum, cur) => sum + Number(cur.count || 0), 0)
      const failedTasks = statusPool
        .filter(item => /失败|异常|错误|终止/i.test(item.label))
        .reduce((sum, cur) => sum + Number(cur.count || 0), 0)
      const failureRate = totalTasks ? ((failedTasks / totalTasks) * 100).toFixed(1) : '0.0'
      return {
        totalTasks,
        runningTasks,
        failedTasks,
        failureRate,
        moduleCount: 5
      }
    },
    healthRows() {
      const rows = [
        { name: '元数据同步', summary: this.summaries.metadata, color: '#2F54EB' },
        { name: '清洗任务', summary: this.summaries.cleanTask, color: '#13C2C2' },
        { name: '实时归集', summary: this.summaries.realtimeTask, color: '#722ED1' }
      ]
      return rows.map(row => {
        const statuses = row.summary.statuses || []
        const total = Number(row.summary.total || 0)
        const running = statuses
          .filter(s => /运行|执行中|启动|处理中/i.test(s.label))
          .reduce((sum, cur) => sum + Number(cur.count || 0), 0)
        const failed = statuses
          .filter(s => /失败|异常|错误|终止/i.test(s.label))
          .reduce((sum, cur) => sum + Number(cur.count || 0), 0)
        const score = total > 0 ? Math.max(0, Math.min(100, Math.round(((total - failed) / total) * 100))) : 0
        return { name: row.name, score, running, failed, total, color: row.color }
      })
    },
    knowledgeBaseStats() {
      return {
        total: this.summaries.knowledgeBase.total || 0,
        categories: 2,
        tags: 3,
        updatedToday: 3
      }
    },
    knowledgeBaseMockList() {
      return [
        {
          title: 'Kafka输入输出组件使用技巧',
          category: '技术文档',
          tag: 'Kafka',
          uploader: '当前用户',
          updateTime: '2026/03/27 01:15:04'
        },
        {
          title: '清洗规则预览生成案例',
          category: '技术文档',
          tag: '清洗规则',
          uploader: '当前用户',
          updateTime: '2026/03/27 01:14:26'
        },
        {
          title: 'PufferfishScheduler产品使用手册1.0',
          category: '操作指南',
          tag: 'PufferfishScheduler',
          uploader: '当前用户',
          updateTime: '2026/03/27 01:13:34'
        }
      ]
    }
  },
  mounted() {
    this.initCharts()
    this.refreshDashboard()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.statusStackChart && this.statusStackChart.dispose()
    this.statusDonutChart && this.statusDonutChart.dispose()
  },
  methods: {
    initCharts() {
      this.statusStackChart = echarts.init(this.$refs.statusStackChart)
      this.statusDonutChart = echarts.init(this.$refs.statusDonutChart)
      window.addEventListener('resize', this.handleResize)
    },
    handleResize() {
      this.statusStackChart && this.statusStackChart.resize()
      this.statusDonutChart && this.statusDonutChart.resize()
    },
    toDictOption(item) {
      const labelRaw = item && (item.value != null ? item.value : (item.label != null ? item.label : (item.name != null ? item.name : item.code)))
      const valueRaw = item && (item.code != null ? item.code : (item.id != null ? item.id : item.value))
      return {
        label: labelRaw != null ? String(labelRaw) : '',
        value: valueRaw != null ? String(valueRaw) : ''
      }
    },
    isApiSuccess(res) {
      if (!res || typeof res !== 'object') return false
      const code = res.code != null ? String(res.code) : ''
      if (!code) return true
      return code !== '999999'
    },
    getPageData(res) {
      const data = (res && res.data) || {}
      return {
        total: Number(data.total || 0),
        records: Array.isArray(data.records) ? data.records : []
      }
    },
    takeTopStatuses(statuses) {
      const list = Array.isArray(statuses) ? statuses.filter(item => Number(item.count) > 0) : []
      return (list.length ? list : [{ label: '暂无状态数据', count: 0 }]).slice(0, 3)
    },
    getLabelByCode(code) {
      const text = String(code)
      const hit = (this.taskStatusOptions || []).find(item => item.value === text)
      return hit ? hit.label : text
    },
    async loadTaskStatusDict() {
      try {
        const res = await getDict(dictCode.TASK_STATUS)
        if (!this.isApiSuccess(res) || !Array.isArray(res.data)) return
        this.taskStatusOptions = res.data.map(this.toDictOption)
      } catch (e) {
        this.taskStatusOptions = []
      }
    },
    async buildTaskSummary(fetcher, statusKey, baseParams) {
      const queryBase = Object.assign({}, baseParams || {})
      const totalRes = await fetcher(Object.assign({}, queryBase, { pageNo: 1, pageSize: 1 }))
      if (!this.isApiSuccess(totalRes)) return { total: 0, statuses: [] }
      const total = this.getPageData(totalRes).total

      if (!this.taskStatusOptions.length) {
        return { total, statuses: [{ label: '总量', count: total }] }
      }

      const statusReq = this.taskStatusOptions.map(async opt => {
        try {
          const params = Object.assign({}, queryBase, { pageNo: 1, pageSize: 1 })
          params[statusKey] = opt.value
          const res = await fetcher(params)
          if (!this.isApiSuccess(res)) return null
          const count = this.getPageData(res).total
          return { label: opt.label, count }
        } catch (e) {
          return null
        }
      })
      const statuses = (await Promise.all(statusReq)).filter(Boolean)
      return { total, statuses }
    },
    async refreshDashboard() {
      this.loading = true
      try {
        await this.loadTaskStatusDict()
        const [dbRes, metadataSummary, cleanSummary, realtimeSummary] = await Promise.all([
          getDbList({ groupId: '', dbId: '', name: '', pageNo: 1, pageSize: 1 }),
          this.buildTaskSummary(metadataList, 'status', { groupId: '', dbId: '', dbName: '', enable: '', status: '' }),
          this.buildTaskSummary(cleanTaskList, 'status', { groupId: '', name: '', enable: '' }),
          this.buildTaskSummary(realtimeTaskList, 'taskStatus', { taskName: '', sourceDbId: '', targetDbId: '', taskStatus: '' })
        ])

        const dbTotal = this.isApiSuccess(dbRes) ? this.getPageData(dbRes).total : 0
        this.summaries.dataSource = {
          total: dbTotal,
          statuses: [{ label: '已接入', count: dbTotal }]
        }
        this.summaries.metadata = metadataSummary
        this.summaries.cleanTask = cleanSummary
        this.summaries.realtimeTask = realtimeSummary
        // 知识库模块先使用演示数据，后续可替换为真实接口
        this.summaries.knowledgeBase = {
          total: 168,
          statuses: [
            { label: '已发布', count: 132 },
            { label: '审核中', count: 24 },
            { label: '草稿', count: 12 }
          ]
        }
        this.lastUpdate = this.$moment ? this.$moment().format('YYYY-MM-DD HH:mm:ss') : new Date().toLocaleString()
        this.updateCharts()
      } catch (e) {
        this.$message.error('首页统计数据加载失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    buildStackSeriesData() {
      const moduleDefs = [
        { name: '元数据同步', statuses: this.summaries.metadata.statuses || [] },
        { name: '清洗任务', statuses: this.summaries.cleanTask.statuses || [] },
        { name: '实时归集', statuses: this.summaries.realtimeTask.statuses || [] }
      ]
      const counter = {}
      moduleDefs.forEach(m => {
        m.statuses.forEach(s => {
          const key = s.label
          counter[key] = (counter[key] || 0) + Number(s.count || 0)
        })
      })
      const topStatus = Object.keys(counter).sort((a, b) => counter[b] - counter[a]).slice(0, 5)
      const colors = ['#5B8FF9', '#36CFC9', '#9254DE', '#FA8C16', '#F5222D']
      const series = topStatus.map((statusName, idx) => ({
        name: statusName,
        type: 'bar',
        stack: 'status',
        barMaxWidth: 44,
        itemStyle: { color: colors[idx % colors.length], borderRadius: [4, 4, 0, 0] },
        data: moduleDefs.map(m => {
          const hit = m.statuses.find(s => s.label === statusName)
          return hit ? Number(hit.count || 0) : 0
        })
      }))
      return { categories: moduleDefs.map(m => m.name), series }
    },
    updateCharts() {
      const stackData = this.buildStackSeriesData()
      this.statusStackChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }},
        legend: { top: 0 },
        grid: { left: 36, right: 20, top: 44, bottom: 30, containLabel: true },
        xAxis: { type: 'category', data: stackData.categories },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#E7EDF6' }}},
        series: stackData.series
      })

      const statusPool = [
        ...(this.summaries.metadata.statuses || []),
        ...(this.summaries.cleanTask.statuses || []),
        ...(this.summaries.realtimeTask.statuses || [])
      ]
      const statusMap = {}
      statusPool.forEach(item => {
        const k = item.label || '未知'
        statusMap[k] = (statusMap[k] || 0) + Number(item.count || 0)
      })
      const donutData = Object.keys(statusMap)
        .map(key => ({ name: key, value: statusMap[key] }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

      this.statusDonutChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { type: 'scroll', bottom: 0, icon: 'circle' },
        series: [{
          name: '状态占比',
          type: 'pie',
          radius: ['36%', '68%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}\n{d}%', fontSize: 12 },
          labelLine: { length: 12, length2: 10 },
          data: donutData
        }]
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  min-height: calc(100vh - 84px);
  padding: 20px;
  background: radial-gradient(circle at 15% 20%, #eef4ff 0%, #f6f9ff 55%, #f7f8fb 100%);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding: 20px;
  border-radius: 14px;
  background: linear-gradient(120deg, #1f3f85 0%, #4b6bde 45%, #6d55e6 100%);
  box-shadow: 0 10px 30px rgba(44, 76, 163, 0.22);
  color: #fff;

  h1 {
    margin: 0 0 8px;
    font-size: 24px;
    letter-spacing: 0.3px;
  }

  p {
    margin: 0;
    opacity: 0.9;
  }
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;

  .update-time {
    font-size: 12px;
    opacity: 0.9;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 14px;
}

.card {
  border-radius: 14px;
  padding: 16px;
  display: flex;
  gap: 12px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
  border: 1px solid #e9eef8;

  .card-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .icon-datasource { background: linear-gradient(135deg, #36cfc9, #13c2c2); }
  .icon-metadata { background: linear-gradient(135deg, #3d8cff, #69b1ff); }
  .icon-clean { background: linear-gradient(135deg, #fa8c16, #ffc069); }
  .icon-realtime { background: linear-gradient(135deg, #722ed1, #b37feb); }

  .card-content {
    flex: 1;
    min-width: 0;
  }

  .card-title {
    color: #6a7486;
    font-size: 13px;
  }

  .card-value {
    margin: 4px 0;
    font-size: 26px;
    font-weight: 700;
    color: #1d2f50;
  }

  .card-desc {
    font-size: 12px;
    color: #8b95a8;
    margin-bottom: 8px;
  }

  .status-lines {
    border-top: 1px solid #edf2fb;
    padding-top: 8px;
  }

  .status-line {
    display: flex;
    justify-content: space-between;
    line-height: 1.7;
    font-size: 12px;
    color: #4b566a;
  }
}

.kpi-strip {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(5, minmax(150px, 1fr));
  gap: 12px;
}

.kpi-item {
  background: linear-gradient(140deg, #1d2b5f 0%, #243e8a 100%);
  border-radius: 12px;
  border: 1px solid rgba(99, 127, 255, 0.35);
  box-shadow: 0 8px 20px rgba(27, 43, 90, 0.24);
  padding: 12px 14px;
  color: #e8eeff;

  .kpi-label {
    font-size: 12px;
    opacity: 0.85;
  }

  .kpi-value {
    margin-top: 4px;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.4px;
  }

  .accent-running { color: #73d13d; }
  .accent-failed { color: #ff7875; }
}

.charts-section {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.chart-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9eef8;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
  padding: 14px 16px;

  .chart-header h3 {
    margin: 0 0 8px;
    font-size: 15px;
    color: #1f3358;
  }

  .chart {
    height: 320px;
  }
}

.health-list {
  padding: 6px 2px 0;
}

.health-row + .health-row {
  margin-top: 18px;
}

.health-title,
.health-meta {
  display: flex;
  justify-content: space-between;
}

.health-title {
  margin-bottom: 8px;
  font-size: 13px;
  color: #31415f;
}

.health-score {
  font-weight: 700;
  color: #2f54eb;
}

.health-meta {
  margin-top: 6px;
  font-size: 12px;
  color: #7a859b;
}

.knowledge-section {
  margin-top: 14px;
  background: #fff;
  border: 1px solid #e9eef8;
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
  padding: 14px 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f3358;
  margin-bottom: 12px;
}

.knowledge-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.knowledge-kpi {
  background: linear-gradient(140deg, #f4f7ff 0%, #eef3ff 100%);
  border: 1px solid #dfe8ff;
  border-radius: 10px;
  padding: 10px 12px;

  .label {
    color: #6c7890;
    font-size: 12px;
  }

  .value {
    margin-top: 4px;
    color: #2f54eb;
    font-size: 22px;
    font-weight: 700;
  }
}

@media (max-width: 1280px) {
  .stats-cards {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }

  .kpi-strip {
    grid-template-columns: repeat(3, minmax(150px, 1fr));
  }

  .knowledge-kpis {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .stats-cards,
  .charts-section,
  .kpi-strip,
  .knowledge-kpis {
    grid-template-columns: 1fr;
  }
}
</style>
