<template>
  <el-dialog
    :visible.sync="dialogVisible"
    :fullscreen="fullscreen"
    width="1120px"
    top="4vh"
    custom-class="rt-monitor-dialog"
    append-to-body
    :close-on-click-modal="false"
    @closed="onClosed"
  >
    <div slot="title" class="rt-monitor-title">
      <span class="rt-monitor-title-text">实时任务监控</span>
      <span class="rt-monitor-title-actions">
        <el-button type="text" size="small" @click="fullscreen = !fullscreen">{{ fullscreen ? '退出全屏' : '全屏' }}</el-button>
        <el-button type="text" size="small" @click="dialogVisible = false">返回</el-button>
      </span>
    </div>

    <div v-loading="loading" class="rt-monitor-body">
      <template v-if="!loading && loadError">
        <el-alert type="error" :title="loadError" show-icon :closable="false" />
      </template>

      <template v-else-if="!loading && tableMapperOptions.length === 0">
        <el-empty description="该任务暂无表映射，无法展示监控数据" />
      </template>

      <template v-else>
        <!-- 任务级概览 -->
        <div class="rt-monitor-card">
          <div class="rt-monitor-card-head">
            <div class="rt-monitor-meta">
              <span class="rt-monitor-task-name">{{ taskTitle }}</span>
              <el-tag :type="statusTagType" size="small" class="rt-monitor-status">{{ statusLabel }}</el-tag>
              <span class="rt-monitor-time">任务启动时间：{{ startTimeDisplay }}</span>
            </div>
          </div>
          <div class="rt-monitor-card-body">
            <div class="rt-monitor-chart-wrap">
              <div class="rt-monitor-chart-toolbar">
                <div class="rt-legend">
                  <span class="rt-legend-item insert"><i class="rt-dot" />插入</span>
                  <span class="rt-legend-item update"><i class="rt-dot" />更新</span>
                  <span class="rt-legend-item delete"><i class="rt-dot" />删除</span>
                </div>
                <el-radio-group v-model="taskRange" size="mini" @change="refreshTaskChart">
                  <el-radio-button label="1">近1小时</el-radio-button>
                  <el-radio-button label="12">近12小时</el-radio-button>
                </el-radio-group>
              </div>
              <div ref="taskChartRef" class="rt-echart" />
            </div>
            <div class="rt-monitor-side">
              <div class="rt-stat-card insert">
                <div class="rt-stat-label">总插入数</div>
                <div class="rt-stat-value">{{ taskCumulative.today_idv }}</div>
              </div>
              <div class="rt-stat-card update">
                <div class="rt-stat-label">总更新数</div>
                <div class="rt-stat-value">{{ taskCumulative.today_udv }}</div>
              </div>
              <div class="rt-stat-card delete">
                <div class="rt-stat-label">总删除数</div>
                <div class="rt-stat-value">{{ taskCumulative.today_ddv }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="rt-monitor-section">
          <div class="rt-monitor-section-title">表数据统计</div>
          <div class="rt-monitor-card rt-monitor-card-sub">
            <div class="rt-monitor-card-head rt-monitor-table-head">
              <el-select
                v-model="selectedMapperId"
                size="small"
                class="rt-table-select"
                placeholder="选择表映射"
                @change="refreshTablePanel"
              >
                <el-option
                  v-for="opt in tableMapperOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <span v-if="selectedMapperLabel" class="rt-table-link-hint">{{ selectedMapperLabel }}</span>
            </div>
            <div class="rt-monitor-card-body">
              <div class="rt-monitor-chart-wrap">
                <div class="rt-monitor-chart-toolbar">
                  <div class="rt-legend">
                    <span class="rt-legend-item insert"><i class="rt-dot" />插入</span>
                    <span class="rt-legend-item update"><i class="rt-dot" />更新</span>
                    <span class="rt-legend-item delete"><i class="rt-dot" />删除</span>
                  </div>
                  <el-radio-group v-model="tableRange" size="mini" @change="refreshTableChart">
                    <el-radio-button label="1">近1小时</el-radio-button>
                    <el-radio-button label="12">近12小时</el-radio-button>
                  </el-radio-group>
                </div>
                <div ref="tableChartRef" class="rt-echart" />
              </div>
              <div class="rt-monitor-side">
                <div class="rt-stat-card insert">
                  <div class="rt-stat-label">总插入数</div>
                  <div class="rt-stat-value">{{ tableCumulative.today_idv }}</div>
                </div>
                <div class="rt-stat-card update">
                  <div class="rt-stat-label">总更新数</div>
                  <div class="rt-stat-value">{{ tableCumulative.today_udv }}</div>
                </div>
                <div class="rt-stat-card delete">
                  <div class="rt-stat-label">总删除数</div>
                  <div class="rt-stat-value">{{ tableCumulative.today_ddv }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </el-dialog>
</template>

<script>
import echarts from 'echarts'
import { detail as detailRealtimeTask, getCumulativeStats, getHourlyStats } from '@/api/collect/realtime/realtime'

const COLORS = {
  insert: '#2d8cf0',
  update: '#e6a23c',
  delete: '#f56c6c'
}

function toSyncDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return Number(y + m + day)
}

function formatAxisLabel(d) {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/** 从当前时刻向前取 count 个小时的时间槽（含当前小时） */
function buildHourSlots(count) {
  const slots = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600000)
    slots.push({
      syncDate: toSyncDate(d),
      syncHour: d.getHours(),
      label: formatAxisLabel(d),
      at: d.getTime()
    })
  }
  return slots
}

function emptyCumulative() {
  return { today_idv: 0, today_udv: 0, today_ddv: 0, last_idv: 0, last_udv: 0, last_ddv: 0, updated_at: null }
}

function parseCumulativePayload(data) {
  const o = emptyCumulative()
  if (!data || typeof data !== 'object') return o
  o.today_idv = Number(data.today_idv != null ? data.today_idv : 0)
  o.today_udv = Number(data.today_udv != null ? data.today_udv : 0)
  o.today_ddv = Number(data.today_ddv != null ? data.today_ddv : 0)
  o.last_idv = Number(data.last_idv != null ? data.last_idv : 0)
  o.last_udv = Number(data.last_udv != null ? data.last_udv : 0)
  o.last_ddv = Number(data.last_ddv != null ? data.last_ddv : 0)
  o.updated_at = data.updated_at != null ? data.updated_at : null
  return o
}

export default {
  name: 'RealtimeMonitorDialog',
  props: {
    visible: { type: Boolean, default: false },
    /** 列表行：至少含 taskId、taskName、taskStatus、taskStatusTxt 等 */
    taskRow: { type: Object, default: null }
  },
  data() {
    return {
      dialogVisible: false,
      fullscreen: false,
      loading: false,
      loadError: '',
      taskId: null,
      taskDetail: null,
      tableMapperOptions: [],
      selectedMapperId: null,
      taskRange: '12',
      tableRange: '12',
      taskCumulative: emptyCumulative(),
      tableCumulative: emptyCumulative(),
      taskChart: null,
      tableChart: null,
      pollTimer: null,
      taskSeriesData: null,
      tableSeriesData: null
    }
  },
  computed: {
    taskTitle() {
      const r = this.taskRow
      if (r && r.taskName) return r.taskName
      const d = this.taskDetail
      if (d && d.taskName) return d.taskName
      return '—'
    },
    statusLabel() {
      const r = this.taskRow
      if (r && r.taskStatusTxt) return r.taskStatusTxt
      const s = r && r.taskStatus != null ? String(r.taskStatus) : ''
      if (s === 'RUNNING' || s === 'R') return '运行中'
      if (s === 'STOP' || s === 'T') return '已停止'
      if (s === 'FAILURE' || s === 'F') return '失败'
      if (s === 'INIT') return '未启动'
      if (s === 'STARTING') return '启动中'
      if (s === 'STOPPING') return '停止中'
      return s || '—'
    },
    statusTagType() {
      const r = this.taskRow
      const s = r && r.taskStatus != null ? String(r.taskStatus) : ''
      if (s === 'RUNNING' || s === 'R') return 'success'
      if (s === 'FAILURE' || s === 'F') return 'danger'
      if (s === 'STOP' || s === 'T' || s === 'INIT') return 'info'
      return 'warning'
    },
    startTimeDisplay() {
      const d = this.taskDetail
      const t = d && (d.startTime || d.taskStartTime || d.lastStartTime || d.startedTime || d.createdTimeTxt || d.createdTime)
      if (t) return String(t)
      const r = this.taskRow
      if (r && (r.startTimeTxt || r.createdTimeTxt)) return String(r.startTimeTxt || r.createdTimeTxt)
      return '—'
    },
    selectedMapperLabel() {
      const opt = this.tableMapperOptions.find(o => o.value === this.selectedMapperId)
      return opt ? opt.sublabel : ''
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(val) {
        this.dialogVisible = val
        if (val) {
          this.openAndLoad()
        }
      }
    },
    dialogVisible(val) {
      this.$emit('update:visible', val)
    }
  },
  beforeDestroy() {
    this.clearPoll()
    this.unbindResize()
    this.disposeCharts()
  },
  methods: {
    onClosed() {
      this.clearPoll()
      this.unbindResize()
      this.disposeCharts()
      this.fullscreen = false
      this.loadError = ''
      this.taskDetail = null
      this.tableMapperOptions = []
      this.selectedMapperId = null
      this.taskRange = '12'
      this.tableRange = '12'
    },
    clearPoll() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    },
    disposeCharts() {
      if (this.taskChart) {
        this.taskChart.dispose()
        this.taskChart = null
      }
      if (this.tableChart) {
        this.tableChart.dispose()
        this.tableChart = null
      }
    },
    async openAndLoad() {
      const row = this.taskRow
      if (!row || row.taskId == null) {
        this.loadError = '缺少任务 ID'
        return
      }
      this.taskId = Number(row.taskId)
      this.loading = true
      this.loadError = ''
      try {
        const res = await detailRealtimeTask(this.taskId)
        const data = res && res.data
        if (!data) {
          this.loadError = res && res.message ? res.message : '获取任务详情失败'
          return
        }
        this.taskDetail = data
        const mappers = Array.isArray(data.tableMappers) ? data.tableMappers : []
        this.tableMapperOptions = mappers
          .map((tm, idx) => {
            const mid = tm.id != null ? tm.id : tm.tableMapperId
            if (mid == null) return null
            const src = tm.sourceTableName || '来源表'
            const tgt = tm.targetTableName || '目标表'
            return {
              value: Number(mid),
              label: `${src} → ${tgt}`,
              sublabel: `来源表：${src}  目标表：${tgt}`,
              raw: tm
            }
          })
          .filter(Boolean)
        if (this.tableMapperOptions.length) {
          this.selectedMapperId = this.tableMapperOptions[0].value
        }
        await this.refreshAllData()
        this.$nextTick(() => {
          this.initOrResizeCharts()
          this.bindResize()
        })
        this.startPoll()
      } catch (e) {
        console.error(e)
        this.loadError = (e && e.response && e.response.data && e.response.data.message) || e.message || '加载失败'
      } finally {
        this.loading = false
      }
    },
    startPoll() {
      this.clearPoll()
      this.pollTimer = setInterval(() => {
        if (!this.dialogVisible) return
        this.refreshAllData().then(() => {
          this.$nextTick(() => this.updateCharts())
        })
      }, 10000)
    },
    bindResize() {
      this._onResize = () => {
        if (this.taskChart) this.taskChart.resize()
        if (this.tableChart) this.tableChart.resize()
      }
      window.addEventListener('resize', this._onResize)
    },
    unbindResize() {
      if (this._onResize) {
        window.removeEventListener('resize', this._onResize)
        this._onResize = null
      }
    },
    initOrResizeCharts() {
      this.ensureChart('task', this.$refs.taskChartRef, this.buildTaskSeriesOption())
      this.ensureChart('table', this.$refs.tableChartRef, this.buildTableSeriesOption())
    },
    ensureChart(which, dom, option) {
      if (!dom) return
      const chart = which === 'task' ? this.taskChart : this.tableChart
      if (!chart) {
        const c = echarts.init(dom)
        if (which === 'task') this.taskChart = c
        else this.tableChart = c
        c.setOption(option, true)
      } else {
        chart.setOption(option, true)
        chart.resize()
      }
    },
    updateCharts() {
      if (this.taskChart) {
        this.taskChart.setOption(this.buildTaskSeriesOption(), true)
      }
      if (this.tableChart) {
        this.tableChart.setOption(this.buildTableSeriesOption(), true)
      }
    },
    buildLineOption(categories, insertArr, updateArr, deleteArr) {
      return {
        color: [COLORS.insert, COLORS.update, COLORS.delete],
        tooltip: {
          trigger: 'axis'
        },
        grid: { left: 48, right: 24, top: 32, bottom: 28 },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: categories
        },
        yAxis: {
          type: 'value',
          minInterval: 1
        },
        series: [
          { name: '插入', type: 'line', smooth: true, data: insertArr },
          { name: '更新', type: 'line', smooth: true, data: updateArr },
          { name: '删除', type: 'line', smooth: true, data: deleteArr }
        ]
      }
    },
    buildTaskSeriesOption() {
      const d = this.taskSeriesData || { categories: [], insert: [], update: [], delete: [] }
      return this.buildLineOption(d.categories, d.insert, d.update, d.delete)
    },
    buildTableSeriesOption() {
      const d = this.tableSeriesData || { categories: [], insert: [], update: [], delete: [] }
      return this.buildLineOption(d.categories, d.insert, d.update, d.delete)
    },
    async refreshTaskChart() {
      await this.loadTaskHourly()
      this.$nextTick(() => this.initOrResizeCharts())
    },
    async refreshTableChart() {
      await this.loadTableHourly()
      this.$nextTick(() => this.initOrResizeCharts())
    },
    async refreshTablePanel() {
      await this.loadTableCumulative()
      await this.loadTableHourly()
      this.$nextTick(() => this.initOrResizeCharts())
    },
    async refreshAllData() {
      await Promise.all([this.loadTaskCumulative(), this.loadTaskHourly(), this.loadTableCumulative(), this.loadTableHourly()])
    },
    mapperIds() {
      return this.tableMapperOptions.map(o => o.value)
    },
    async loadTaskCumulative() {
      const ids = this.mapperIds()
      if (!ids.length || this.taskId == null) {
        this.taskCumulative = emptyCumulative()
        return
      }
      const parts = await Promise.all(ids.map(id => getCumulativeStats(this.taskId, id)))
      const acc = emptyCumulative()
      parts.forEach(res => {
        const p = parseCumulativePayload(res && res.data)
        acc.today_idv += p.today_idv
        acc.today_udv += p.today_udv
        acc.today_ddv += p.today_ddv
      })
      this.taskCumulative = acc
    },
    async loadTableCumulative() {
      if (this.taskId == null || this.selectedMapperId == null) {
        this.tableCumulative = emptyCumulative()
        return
      }
      const res = await getCumulativeStats(this.taskId, this.selectedMapperId)
      this.tableCumulative = parseCumulativePayload(res && res.data)
    },
    async sumHourlyForSlot(slot, mapperIds) {
      const rows = await Promise.all(
        mapperIds.map(id => getHourlyStats(this.taskId, id, slot.syncDate, slot.syncHour))
      )
      let insert = 0
      let update = 0
      let del = 0
      rows.forEach(res => {
        const d = res && res.data
        if (!d) return
        insert += Number(d.insert_data_volume != null ? d.insert_data_volume : 0)
        update += Number(d.update_data_volume != null ? d.update_data_volume : 0)
        del += Number(d.delete_data_volume != null ? d.delete_data_volume : 0)
      })
      return { insert, update, delete: del }
    },
    async loadTaskHourly() {
      const ids = this.mapperIds()
      const n = this.taskRange === '1' ? 1 : 12
      const slots = buildHourSlots(n)
      if (!ids.length || this.taskId == null) {
        this.taskSeriesData = { categories: [], insert: [], update: [], delete: [] }
        return
      }
      const categories = []
      const insert = []
      const update = []
      const del = []
      for (const slot of slots) {
        const s = await this.sumHourlyForSlot(slot, ids)
        categories.push(slot.label)
        insert.push(s.insert)
        update.push(s.update)
        del.push(s.delete)
      }
      this.taskSeriesData = { categories, insert, update, delete: del }
    },
    async loadTableHourly() {
      if (this.taskId == null || this.selectedMapperId == null) {
        this.tableSeriesData = { categories: [], insert: [], update: [], delete: [] }
        return
      }
      const n = this.tableRange === '1' ? 1 : 12
      const slots = buildHourSlots(n)
      const categories = []
      const insert = []
      const update = []
      const del = []
      for (const slot of slots) {
        const res = await getHourlyStats(this.taskId, this.selectedMapperId, slot.syncDate, slot.syncHour)
        const d = res && res.data
        categories.push(slot.label)
        insert.push(Number(d && d.insert_data_volume != null ? d.insert_data_volume : 0))
        update.push(Number(d && d.update_data_volume != null ? d.update_data_volume : 0))
        del.push(Number(d && d.delete_data_volume != null ? d.delete_data_volume : 0))
      }
      this.tableSeriesData = { categories, insert, update, delete: del }
    }
  }
}
</script>

<style lang="scss" scoped>
.rt-monitor-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 40px;
}
.rt-monitor-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.rt-monitor-title-actions .el-button {
  margin-left: 4px;
}
.rt-monitor-body {
  min-height: 200px;
}
.rt-monitor-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}
.rt-monitor-card-sub {
  margin-bottom: 0;
}
.rt-monitor-card-head {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.rt-monitor-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.rt-monitor-task-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.rt-monitor-time {
  font-size: 13px;
  color: #909399;
}
.rt-monitor-card-body {
  display: flex;
  gap: 16px;
  padding: 12px 16px 16px;
  align-items: stretch;
}
.rt-monitor-chart-wrap {
  flex: 1;
  min-width: 0;
}
.rt-monitor-chart-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.rt-legend {
  font-size: 12px;
  color: #606266;
}
.rt-legend-item {
  margin-right: 14px;
}
.rt-legend-item.insert .rt-dot {
  background: #2d8cf0;
}
.rt-legend-item.update .rt-dot {
  background: #e6a23c;
}
.rt-legend-item.delete .rt-dot {
  background: #f56c6c;
}
.rt-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: -1px;
}
.rt-echart {
  width: 100%;
  height: 280px;
}
.rt-monitor-side {
  width: 160px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rt-stat-card {
  flex: 1;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #ebeef5;
  &.insert {
    border-left: 4px solid #2d8cf0;
  }
  &.update {
    border-left: 4px solid #e6a23c;
  }
  &.delete {
    border-left: 4px solid #f56c6c;
  }
}
.rt-stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}
.rt-stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}
.rt-monitor-section {
  margin-top: 8px;
}
.rt-monitor-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}
.rt-monitor-table-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.rt-table-select {
  min-width: 260px;
}
.rt-table-link-hint {
  font-size: 13px;
  color: #606266;
}

@media (max-width: 1440px) {
  .rt-monitor-card-body {
    flex-direction: column;
  }

  .rt-monitor-side {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .rt-stat-card {
    min-width: 180px;
  }

  .rt-echart {
    height: 240px;
  }
}
</style>

<style lang="scss">
.rt-monitor-dialog .el-dialog__body {
  padding: 12px 20px 20px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}
.rt-monitor-dialog.el-dialog.is-fullscreen .el-dialog__body {
  max-height: calc(100vh - 100px);
}
</style>
