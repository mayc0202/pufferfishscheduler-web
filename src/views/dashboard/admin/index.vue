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
          <div class="label">关联关系</div>
          <div class="value">{{ knowledgeBaseStats.relations }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import echarts from 'echarts'
import { getDashboardSummary } from '@/api/dashboard/dashboard'

/** 任务状态码 -> 中文（与字典常见枚举对齐，避免额外请求字典接口） */
const TASK_STATUS_LABELS = {
  INIT: '初始化',
  PENDING: '待处理',
  RUNNING: '运行中',
  STARTING: '启动中',
  STOPPING: '停止中',
  STOPPED: '已停止',
  SUCCESS: '成功',
  FAILED: '失败',
  ERROR: '错误',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  PAUSED: '已暂停',
  RESUMING: '恢复中',
  SCHEDULED: '已调度',
  QUEUED: '排队中',
  PROCESSING: '处理中',
  EXECUTING: '执行中'
}

export default {
  name: 'DashboardAdmin',
  data() {
    return {
      loading: false,
      lastUpdate: null,
      /** 后端 /dashboard/summary.do 返回的 data */
      dashboard: null,
      statusStackChart: null
    }
  },
  computed: {
    lastUpdateText() {
      if (!this.lastUpdate) return '--'
      return this.lastUpdate
    },
    moduleCards() {
      const tc = (this.dashboard && this.dashboard.taskCards) || {}
      const sd = (this.dashboard && this.dashboard.statusDistributions) || {}
      const statusFor = key => this.takeTopStatuses(this.countsToStatuses(sd[key] && sd[key].counts))
      return [
        {
          key: 'metadata',
          title: '元数据同步任务',
          total: Number(tc.metadataTasks || 0),
          desc: '元数据采集执行状态',
          icon: 'el-icon-s-operation',
          iconClass: 'icon-metadata',
          topStatuses: statusFor('metadata')
        },
        {
          key: 'cleanTask',
          title: '清洗任务',
          total: Number(tc.cleanTasks || 0),
          desc: '离线清洗任务运行概览',
          icon: 'el-icon-magic-stick',
          iconClass: 'icon-clean',
          topStatuses: statusFor('clean')
        },
        {
          key: 'realtimeTask',
          title: '实时归集任务',
          total: Number(tc.realtimeTasks || 0),
          desc: 'CDC 归集链路健康度',
          icon: 'el-icon-connection',
          iconClass: 'icon-realtime',
          topStatuses: statusFor('realtime')
        },
        {
          key: 'transTask',
          title: '传输任务',
          total: Number(tc.transTasks || 0),
          desc: '离线传输任务运行概览',
          icon: 'el-icon-sort',
          iconClass: 'icon-trans',
          topStatuses: statusFor('trans')
        }
      ]
    },
    globalMetrics() {
      const tc = (this.dashboard && this.dashboard.taskCards) || {}
      const totalTasks = Number(tc.totalTasks || 0)
      const prog = (this.dashboard && this.dashboard.progress) || {}
      const failedTasks = ['metadata', 'trans', 'realtime', 'clean'].reduce(
        (sum, k) => sum + Number((prog[k] && prog[k].failureCount) || 0),
        0
      )
      const runningTasks = this.sumRunningAcrossDistributions()
      const failureRate = totalTasks ? ((failedTasks / totalTasks) * 100).toFixed(1) : '0.0'
      return {
        totalTasks,
        runningTasks,
        failedTasks,
        failureRate,
        moduleCount: 4
      }
    },
    healthRows() {
      const p = (this.dashboard && this.dashboard.progress) || {}
      const sd = (this.dashboard && this.dashboard.statusDistributions) || {}
      const defs = [
        { name: '元数据同步', progKey: 'metadata', distKey: 'metadata', color: '#2F54EB' },
        { name: '清洗任务', progKey: 'clean', distKey: 'clean', color: '#13C2C2' },
        { name: '实时归集', progKey: 'realtime', distKey: 'realtime', color: '#722ED1' },
        { name: '传输任务', progKey: 'trans', distKey: 'trans', color: '#EB2F96' }
      ]
      return defs.map(d => {
        const prog = p[d.progKey] || {}
        const counts = (sd[d.distKey] && sd[d.distKey].counts) || {}
        return {
          name: d.name,
          score: Math.max(0, Math.min(100, Number(prog.percent || 0))),
          running: this.sumRunningCount(counts),
          failed: Number(prog.failureCount || 0),
          total: Number(prog.totalCount || 0),
          color: d.color
        }
      })
    },
    knowledgeBaseStats() {
      const k = (this.dashboard && this.dashboard.knowledgeOverview) || {}
      return {
        total: Number(k.knowledgeCount || 0),
        categories: Number(k.categoryCount || 0),
        tags: Number(k.tagCount || 0),
        relations: Number(k.relationCount || 0)
      }
    }
  },
  mounted() {
    this.initCharts()
    this.refreshDashboard()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.statusStackChart && this.statusStackChart.dispose()
  },
  methods: {
    initCharts() {
      this.statusStackChart = echarts.init(this.$refs.statusStackChart)
      window.addEventListener('resize', this.handleResize)
    },
    handleResize() {
      this.statusStackChart && this.statusStackChart.resize()
    },
    isApiSuccess(res) {
      if (!res || typeof res !== 'object') return false
      const code = res.code != null ? String(res.code) : ''
      if (!code) return true
      return code !== '999999'
    },
    takeTopStatuses(statuses) {
      const list = Array.isArray(statuses) ? statuses.filter(item => Number(item.count) > 0) : []
      return (list.length ? list : [{ label: '暂无状态数据', count: 0 }]).slice(0, 3)
    },
    taskStatusLabel(code) {
      const c = String(code || '').toUpperCase()
      return TASK_STATUS_LABELS[c] || String(code || '')
    },
    countsToStatuses(counts) {
      const obj = counts && typeof counts === 'object' ? counts : {}
      return Object.keys(obj)
        .map(code => ({
          label: this.taskStatusLabel(code),
          count: Number(obj[code] || 0)
        }))
        .sort((a, b) => b.count - a.count)
    },
    isRunningStatusCode(code) {
      return /^(RUNNING|STARTING|EXECUTING|RUN|PROCESSING|RESUMING)$/i.test(String(code || ''))
    },
    sumRunningCount(counts) {
      const obj = counts && typeof counts === 'object' ? counts : {}
      return Object.keys(obj).reduce((sum, code) => {
        if (!this.isRunningStatusCode(code)) return sum
        return sum + Number(obj[code] || 0)
      }, 0)
    },
    sumRunningAcrossDistributions() {
      const sd = (this.dashboard && this.dashboard.statusDistributions) || {}
      return ['metadata', 'trans', 'realtime', 'clean'].reduce(
        (sum, k) => sum + this.sumRunningCount(sd[k] && sd[k].counts),
        0
      )
    },
    async refreshDashboard() {
      this.loading = true
      try {
        const res = await getDashboardSummary()
        if (!this.isApiSuccess(res) || res.data == null) {
          this.$message.error('首页统计数据加载失败，请稍后重试')
          return
        }
        this.dashboard = res.data
        this.lastUpdate = this.$moment ? this.$moment().format('YYYY-MM-DD HH:mm:ss') : new Date().toLocaleString()
        this.updateCharts()
      } catch (e) {
        this.$message.error('首页统计数据加载失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    buildStackSeriesData() {
      const sd = (this.dashboard && this.dashboard.statusDistributions) || {}
      const moduleDefs = [
        { name: '元数据同步', statuses: this.countsToStatuses(sd.metadata && sd.metadata.counts) },
        { name: '清洗任务', statuses: this.countsToStatuses(sd.clean && sd.clean.counts) },
        { name: '实时归集', statuses: this.countsToStatuses(sd.realtime && sd.realtime.counts) },
        { name: '传输任务', statuses: this.countsToStatuses(sd.trans && sd.trans.counts) }
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

  .icon-metadata { background: linear-gradient(135deg, #3d8cff, #69b1ff); }
  .icon-clean { background: linear-gradient(135deg, #fa8c16, #ffc069); }
  .icon-realtime { background: linear-gradient(135deg, #722ed1, #b37feb); }
  .icon-trans { background: linear-gradient(135deg, #eb2f96, #ff85c0); }

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
