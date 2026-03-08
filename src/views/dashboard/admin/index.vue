<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>系统监控面板</h1>
      <p>实时监控系统运行状态和任务执行情况</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="card">
        <div class="card-icon task-icon">
          <i class="el-icon-document" />
        </div>
        <div class="card-content">
          <div class="card-title">总任务数</div>
          <div class="card-value">{{ stats.totalTasks }}</div>
          <div class="card-desc"><span class="trend up">+12%</span> 较上周</div>
        </div>
      </div>
      <div class="card">
        <div class="card-icon success-icon">
          <i class="el-icon-check" />
        </div>
        <div class="card-content">
          <div class="card-title">成功任务</div>
          <div class="card-value">{{ stats.successTasks }}</div>
          <div class="card-desc"><span class="trend up">+8%</span> 较上周</div>
        </div>
      </div>
      <div class="card">
        <div class="card-icon error-icon">
          <i class="el-icon-warning" />
        </div>
        <div class="card-content">
          <div class="card-title">失败任务</div>
          <div class="card-value">{{ stats.failedTasks }}</div>
          <div class="card-desc"><span class="trend down">-5%</span> 较上周</div>
        </div>
      </div>
      <div class="card">
        <div class="card-icon system-icon">
          <i class="el-icon-cpu" />
        </div>
        <div class="card-content">
          <div class="card-title">系统负载</div>
          <div class="card-value">{{ stats.systemLoad }}%</div>
          <div class="card-desc"><span class="trend up">+2%</span> 较昨日</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-card">
        <div class="chart-header">
          <h3>任务执行趋势</h3>
          <div class="chart-actions">
            <el-button size="small" @click="changeChartPeriod('day')">日</el-button>
            <el-button size="small" type="primary" @click="changeChartPeriod('week')">周</el-button>
            <el-button size="small" @click="changeChartPeriod('month')">月</el-button>
          </div>
        </div>
        <div class="chart-content">
          <div ref="taskTrendChart" class="chart" />
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <h3>任务类型分布</h3>
        </div>
        <div class="chart-content">
          <div ref="taskTypeChart" class="chart" />
        </div>
      </div>
    </div>

    <!-- 最近任务列表 -->
    <div class="recent-tasks">
      <div class="section-header">
        <h3>最近执行任务</h3>
        <el-button type="primary" size="small">查看全部</el-button>
      </div>
      <el-table :data="recentTasks" style="width: 100%">
        <el-table-column prop="name" label="任务名称" width="200" />
        <el-table-column prop="type" label="任务类型" />
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : scope.row.status === 'running' ? 'warning' : 'danger'">
              {{ scope.row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="duration" label="执行时长" width="100" />
        <el-table-column label="操作" width="120">
          <template slot-scope="scope">
            <el-button size="small" @click="viewTask(scope.row.id)">查看</el-button>
            <el-button size="small" type="danger" @click="stopTask(scope.row.id)">停止</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 系统状态 -->
    <div class="system-status">
      <div class="section-header">
        <h3>系统状态</h3>
      </div>
      <div class="status-grid">
        <div class="status-item">
          <div class="status-label">CPU使用率</div>
          <div class="status-value">{{ systemStatus.cpuUsage }}%</div>
          <div class="status-bar">
            <div class="status-progress" :style="{ width: systemStatus.cpuUsage + '%' }" />
          </div>
        </div>
        <div class="status-item">
          <div class="status-label">内存使用率</div>
          <div class="status-value">{{ systemStatus.memoryUsage }}%</div>
          <div class="status-bar">
            <div class="status-progress" :style="{ width: systemStatus.memoryUsage + '%' }" />
          </div>
        </div>
        <div class="status-item">
          <div class="status-label">磁盘使用率</div>
          <div class="status-value">{{ systemStatus.diskUsage }}%</div>
          <div class="status-bar">
            <div class="status-progress" :style="{ width: systemStatus.diskUsage + '%' }" />
          </div>
        </div>
        <div class="status-item">
          <div class="status-label">网络流量</div>
          <div class="status-value">{{ systemStatus.networkTraffic }}</div>
          <div class="status-bar">
            <div class="status-progress" :style="{ width: systemStatus.networkUsage + '%' }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import echarts from 'echarts'

export default {
  name: 'DashboardAdmin',
  components: {
  },
  data() {
    return {
      stats: {
        totalTasks: 128,
        successTasks: 112,
        failedTasks: 16,
        systemLoad: 45
      },
      systemStatus: {
        cpuUsage: 45,
        memoryUsage: 68,
        diskUsage: 32,
        networkTraffic: '1.2 MB/s',
        networkUsage: 25
      },
      recentTasks: [
        {
          id: 1,
          name: '数据同步任务',
          type: 'ETL',
          status: 'success',
          statusText: '成功',
          startTime: '2023-06-15 14:30:00',
          duration: '2m 30s'
        },
        {
          id: 2,
          name: '报表生成',
          type: 'Report',
          status: 'running',
          statusText: '运行中',
          startTime: '2023-06-15 14:15:00',
          duration: '1m 45s'
        },
        {
          id: 3,
          name: '数据清洗',
          type: 'ETL',
          status: 'failed',
          statusText: '失败',
          startTime: '2023-06-15 13:45:00',
          duration: '3m 15s'
        },
        {
          id: 4,
          name: '系统备份',
          type: 'System',
          status: 'success',
          statusText: '成功',
          startTime: '2023-06-15 12:00:00',
          duration: '5m 20s'
        },
        {
          id: 5,
          name: '数据导出',
          type: 'ETL',
          status: 'success',
          statusText: '成功',
          startTime: '2023-06-15 11:30:00',
          duration: '1m 50s'
        }
      ],
      chartPeriod: 'week',
      taskTrendChart: null,
      taskTypeChart: null
    }
  },
  mounted() {
    this.initCharts()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.taskTrendChart && this.taskTrendChart.dispose()
    this.taskTypeChart && this.taskTypeChart.dispose()
  },
  methods: {
    initCharts() {
      // 任务执行趋势图表
      this.taskTrendChart = echarts.init(this.$refs.taskTrendChart)
      this.updateTaskTrendChart()

      // 任务类型分布图表
      this.taskTypeChart = echarts.init(this.$refs.taskTypeChart)
      this.updateTaskTypeChart()

      // 监听窗口大小变化
      window.addEventListener('resize', this.handleResize)
    },
    updateTaskTrendChart() {
      const data = {
        day: {
          xAxis: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
          success: [5, 3, 12, 18, 15, 8],
          failed: [1, 0, 2, 3, 1, 0]
        },
        week: {
          xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
          success: [15, 18, 20, 16, 22, 10, 8],
          failed: [2, 3, 2, 4, 1, 0, 1]
        },
        month: {
          xAxis: ['第1周', '第2周', '第3周', '第4周'],
          success: [85, 92, 105, 112],
          failed: [12, 10, 8, 6]
        }
      }

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },
        legend: {
          data: ['成功', '失败'],
          top: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: data[this.chartPeriod].xAxis
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '成功',
            type: 'line',
            stack: '总量',
            areaStyle: {
              color: 'rgba(104, 163, 255, 0.3)'
            },
            lineStyle: {
              color: '#5F95FF'
            },
            emphasis: {
              focus: 'series'
            },
            data: data[this.chartPeriod].success
          },
          {
            name: '失败',
            type: 'line',
            stack: '总量',
            areaStyle: {
              color: 'rgba(255, 107, 107, 0.3)'
            },
            lineStyle: {
              color: '#FF6B6B'
            },
            emphasis: {
              focus: 'series'
            },
            data: data[this.chartPeriod].failed
          }
        ]
      }

      this.taskTrendChart.setOption(option)
    },
    updateTaskTypeChart() {
      const option = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '5%',
          left: 'center'
        },
        series: [
          {
            name: '任务类型',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: 45, name: 'ETL' },
              { value: 25, name: '报表' },
              { value: 15, name: '系统' },
              { value: 10, name: 'API' },
              { value: 5, name: '其他' }
            ]
          }
        ]
      }

      this.taskTypeChart.setOption(option)
    },
    changeChartPeriod(period) {
      this.chartPeriod = period
      this.updateTaskTrendChart()
    },
    handleResize() {
      this.taskTrendChart && this.taskTrendChart.resize()
      this.taskTypeChart && this.taskTypeChart.resize()
    },
    viewTask(id) {
      // 查看任务详情
      console.log('查看任务:', id)
    },
    stopTask(id) {
      // 停止任务
      console.log('停止任务:', id)
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 30px;
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
  p {
    font-size: 14px;
    color: #666;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  .card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
    }
    .card-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      font-size: 24px;
      color: #fff;
      &.task-icon {
        background: linear-gradient(135deg, #5F95FF, #40a9ff);
      }
      &.success-icon {
        background: linear-gradient(135deg, #52c41a, #73d13d);
      }
      &.error-icon {
        background: linear-gradient(135deg, #ff4d4f, #ff7875);
      }
      &.system-icon {
        background: linear-gradient(135deg, #faad14, #ffc53d);
      }
    }
    .card-content {
      flex: 1;
      .card-title {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
      }
      .card-value {
        font-size: 24px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }
      .card-desc {
        font-size: 12px;
        color: #999;
        .trend {
          margin-left: 8px;
          &.up {
            color: #52c41a;
          }
          &.down {
            color: #ff4d4f;
          }
        }
      }
    }
  }
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(48%, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  .chart-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
      .chart-actions {
        el-button {
          margin-left: 8px;
        }
      }
    }
    .chart-content {
      .chart {
        height: 300px;
      }
    }
  }
}

.recent-tasks {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 30px;
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }
}

.system-status {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  .section-header {
    margin-bottom: 20px;
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    .status-item {
      .status-label {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
      }
      .status-value {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
      }
      .status-bar {
        width: 100%;
        height: 8px;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
        .status-progress {
          height: 100%;
          background: linear-gradient(90deg, #5F95FF, #40a9ff);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  .charts-section {
    grid-template-columns: 1fr;
  }
  .system-status .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
