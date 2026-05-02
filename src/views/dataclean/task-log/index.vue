<template>
  <div class="container task-log-page">
    <div class="body">
      <el-container>
        <el-main>
          <div class="list">
            <div class="search">
              <el-row class="search-row search-row-uniform">
                <el-col class="search-col search-col-equal">
                  <div class="col">
                    <div class="label">任务名称：</div>
                    <el-input
                      v-model.trim="searchForm.taskName"
                      class="search-input"
                      placeholder="请输入任务名称"
                      clearable
                    />
                  </div>
                </el-col>
                <el-col class="search-col search-col-equal">
                  <div class="col">
                    <div class="label">执行日期：</div>
                    <el-date-picker
                      v-model="searchForm.dateRange"
                      class="search-date"
                      type="daterange"
                      range-separator="-"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      value-format="yyyy-MM-dd"
                      clearable
                    />
                  </div>
                </el-col>
                <el-col class="search-col search-col-equal">
                  <div class="col">
                    <div class="label">执行状态：</div>
                    <el-select
                      v-model="searchForm.executeStatus"
                      class="search-select"
                      placeholder="全部"
                      clearable
                    >
                      <el-option
                        v-for="opt in taskStatusSelectOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </el-select>
                  </div>
                </el-col>
                <el-col class="search-col search-col-equal search-col-btns">
                  <div class="flex search-btns">
                    <el-button
                      type="primary"
                      icon="el-icon-search"
                      size="mini"
                      @click="handleSearch"
                    >查询</el-button>
                  </div>
                </el-col>
              </el-row>
            </div>

            <el-table
              v-loading="tableLoading"
              :data="tableData"
              style="width: 100%"
              height="100%"
              element-loading-text="正在加载日志..."
            >
              <el-table-column type="index" label="#" width="50" />
              <el-table-column
                prop="taskName"
                label="任务名称"
                min-width="180"
              />
              <el-table-column
                prop="flowName"
                label="流程名称"
                min-width="180"
              />
              <el-table-column
                prop="dataVolume"
                label="数据量"
                min-width="80"
              />
              <el-table-column
                prop="durationText"
                label="执行耗时"
                min-width="90"
              />
              <el-table-column
                prop="executeTime"
                label="执行时间"
                min-width="170"
              />
              <el-table-column label="执行状态" width="90">
                <template slot-scope="scope">
                  <span :class="statusClass(scope.row.executeStatus)">
                    {{ statusText(scope.row.executeStatus) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column fixed="right" label="操作" width="70">
                <template slot-scope="scope">
                  <el-button
                    type="text"
                    size="small"
                    @click="openDetail(scope.row)"
                  >详情</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
              <el-pagination
                :current-page="pagination.currentPage"
                :page-size="pagination.pageSize"
                :page-sizes="[10, 20, 30, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="pagination.total"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </div>
        </el-main>
      </el-container>
    </div>

    <el-dialog
      v-el-drag-dialog
      :visible.sync="detailVisible"
      title="清洗任务日志详情"
      width="860px"
      top="4vh"
      class="log-detail-dialog"
      :close-on-click-modal="false"
      :append-to-body="true"
      :modal-append-to-body="true"
    >
      <div class="detail-section">
        <div class="section-title">基础信息</div>
        <table class="detail-table">
          <tr>
            <th>任务名称</th>
            <td colspan="3">{{ detailData.taskName || '-' }}</td>
          </tr>
          <tr>
            <th>流程名称</th>
            <td colspan="3">{{ detailData.flowName || '-' }}</td>
          </tr>
          <tr>
            <th>执行状态</th>
            <td>
              <span :class="statusClass(detailData.status || detailData.executeStatus)">
                {{ statusText(detailData.status || detailData.executeStatus) }}
              </span>
            </td>
            <th>执行耗时</th>
            <td>{{ detailData.durationText || (detailData.durationSeconds != null ? detailData.durationSeconds + '秒' : '-') }}</td>
          </tr>
          <tr>
            <th>开始时间</th>
            <td>{{ detailData.startTimeTxt || '-' }}</td>
            <th>结束时间</th>
            <td>{{ detailData.endTimeTxt || '-' }}</td>
          </tr>
          <tr>
            <th>日志ID</th>
            <td colspan="3" style="font-size:13px;word-break:break-all;">{{ detailData.id || '-' }}</td>
          </tr>
          <tr>
            <th>处理记录</th>
            <td>{{ detailData.dataVolume || 0 }}</td>
            <th>读取</th>
            <td>{{ detailData.linesRead || 0 }}</td>
          </tr>
          <tr>
            <th>写入</th>
            <td>{{ detailData.linesWritten || 0 }}</td>
            <th>更新</th>
            <td>{{ detailData.linesUpdated || 0 }}</td>
          </tr>
          <tr>
            <th>输入</th>
            <td>{{ detailData.linesInput || 0 }}</td>
            <th>输出</th>
            <td>{{ detailData.linesOutput || 0 }}</td>
          </tr>
          <tr>
            <th>拒绝</th>
            <td>{{ detailData.linesRejected || 0 }}</td>
            <th>异常</th>
            <td style="color:#f56c6c;">{{ detailData.linesErrors || 0 }}</td>
          </tr>
        </table>
      </div>

      <div class="detail-section detail-section-flow">
        <div class="section-title flow-preview-heading">
          <span>流程图预览</span>
          <span class="flow-preview-hint">按住左键拖拽画布可平移查看</span>
        </div>
        <div ref="flowPreviewRef" class="flow-preview" />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Graph } from '@antv/x6'
import {
  list as transTaskLogList,
  detail as transTaskLogDetail
} from '@/api/collect/task/transTaskLog'
import dictCode from '@/api/dict/dictCode.js'
import { getDict } from '@/api/dict/dict'

import { ElDescriptions, ElDescriptionsItem } from 'element-ui'

export default {
  name: 'DataCleanTaskLog',
  components: {
    ElDescriptions,
    ElDescriptionsItem
  },
  data() {
    return {
      tableLoading: false,
      detailVisible: false,
      previewGraph: null,
      searchForm: {
        taskName: '',
        dateRange: [],
        executeStatus: ''
      },
      taskStatusOption: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      tableData: [],
      detailData: {}
    }
  },
  computed: {
    taskStatusSelectOptions() {
      return (this.taskStatusOption || []).map((item) => this.toDictOption(item))
    }
  },
  mounted() {
    this.initTaskDicts()
      .then(() => this.queryList())
      .catch(() => this.queryList())
  },
  beforeDestroy() {
    this.destroyPreviewGraph()
  },
  methods: {
    pickFlowConfigSource(payload) {
      if (!payload || typeof payload !== 'object') return null
      const candidates = [
        payload.flowConfig,
        payload.config,
        payload.flowJson,
        payload.flowData,
        payload.transConfig
      ]
      for (const item of candidates) {
        if (item != null && item !== '') return item
      }
      return null
    },
    parseFlowConfig(raw) {
      if (raw == null || raw === '') return null
      let value = raw
      let round = 0
      // 日志详情里 flowConfig 可能被多次序列化，最多递归解析 3 层
      while (round < 3) {
        if (typeof value !== 'string') break
        const text = value.trim()
        if (!text) return null
        try {
          value = JSON.parse(text)
        } catch (err) {
          // 兼容后端返回 "\"{...}\"" 这类转义字符串
          const normalized = text
            .replace(/^"(.*)"$/s, '$1')
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '')
          try {
            value = JSON.parse(normalized)
          } catch (err2) {
            return null
          }
        }
        round += 1
      }
      if (!value || typeof value !== 'object') return null
      if (Array.isArray(value.cells)) return value
      if (value.data && Array.isArray(value.data.cells)) return value.data
      if (value.flowConfig && Array.isArray(value.flowConfig.cells)) return value.flowConfig
      return null
    },
    normalizePreviewRuntimeStyles(flowConfig) {
      if (!flowConfig || !Array.isArray(flowConfig.cells)) return flowConfig
      const normalized = {
        ...flowConfig,
        cells: flowConfig.cells.map((cell) => {
          if (!cell || typeof cell !== 'object') return cell
          if (cell.shape === 'edge') {
            const attrs = cell.attrs || {}
            const line = attrs.line || {}
            return {
              ...cell,
              attrs: {
                ...attrs,
                line: {
                  ...line,
                  stroke: '#7f8ea3',
                  strokeWidth: 2.2,
                  strokeDasharray: '',
                  strokeDashoffset: 0
                }
              }
            }
          }
          const attrs = cell.attrs || {}
          const body = attrs.body || {}
          const label = attrs.label || {}
          return {
            ...cell,
            attrs: {
              ...attrs,
              body: {
                ...body,
                stroke: '#d7dfeb',
                strokeWidth: 1.5,
                fill: '#fff'
              },
              label: {
                ...label,
                fill: '#555'
              }
            }
          }
        })
      }
      return normalized
    },
    toDictOption(item) {
      const labelRaw = item && (item.value ?? item.label ?? item.name ?? item.code)
      const valueRaw = item && (item.code ?? item.id ?? item.value)
      return {
        label: labelRaw != null ? String(labelRaw) : '',
        value: valueRaw != null ? String(valueRaw) : ''
      }
    },
    async initTaskDicts() {
      try {
        const res = await getDict(dictCode.EXECUTE_STATUS)
        this.taskStatusOption = res && res.data ? res.data : []
      } catch (e) {
        this.taskStatusOption = []
      }
    },
    statusClass(status) {
      const s = String(status || '').toUpperCase()
      if (s === 'S' || s === 'SUCCESS') return 'status-success'
      if (s === 'F' || s === 'FAILURE' || s === 'FAIL') return 'status-failure'
      if (s === 'R' || s === 'RUNNING' || s === 'STARTING' || s === 'STOPPING') { return 'status-running' }
      return 'status-default'
    },
    statusText(status) {
      const s = String(status || '').toUpperCase()
      const item = this.taskStatusOption.find(
        (i) => String(i.code).toUpperCase() === s
      )
      return item ? item.value : s || '-'
    },
    isApiSuccess(res) {
      if (!res || typeof res !== 'object') return false
      const code = res.code != null ? String(res.code) : ''
      if (code === '999999') return false
      return code === '000000' || code === '200' || res.success === true
    },
    toDurationText(sec) {
      const value = Number(sec || 0)
      if (!Number.isFinite(value) || value <= 0) return '0秒'
      if (value < 60) return value + '秒'
      const m = Math.floor(value / 60)
      const s = value % 60
      return s ? `${m}分${s}秒` : `${m}分`
    },
    handleSearch() {
      this.pagination.currentPage = 1
      this.queryList()
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
      this.queryList()
    },
    handleCurrentChange(page) {
      this.pagination.currentPage = page
      this.queryList()
    },
    async queryList() {
      this.tableLoading = true
      try {
        const startTime =
          Array.isArray(this.searchForm.dateRange) &&
          this.searchForm.dateRange.length
            ? this.searchForm.dateRange[0]
            : undefined
        const endTime =
          Array.isArray(this.searchForm.dateRange) &&
          this.searchForm.dateRange.length
            ? this.searchForm.dateRange[1]
            : undefined

        const res = await transTaskLogList({
          taskName: this.searchForm.taskName,
          startTime,
          endTime,
          status: this.searchForm.executeStatus,
          pageNo: this.pagination.currentPage,
          pageSize: this.pagination.pageSize
        })

        if (!this.isApiSuccess(res)) {
          this.tableData = []
          this.pagination.total = 0
          return
        }

        const data = res.data || {}
        const records = Array.isArray(data.records) ? data.records : []

        this.tableData = records.map((item) => ({
          id: item.id,
          logId: item.id,
          taskName: item.taskName || '-',
          groupName: item.groupName || '-',
          flowName: item.flowName || '-',
          executeStatus: item.status || 'INIT',
          executeTime: item.startTimeTxt || item.startTime || '-',
          dataVolume: item.dataVolume != null ? item.dataVolume : 0,
          durationText: this.toDurationText(item.durationSeconds || 0),
          executeType: item.executingTypeTxt || item.executingTypeTxt || '',
          flowId: item.flowId,
          linesErrors: item.linesErrors != null ? item.linesErrors : 0,
          reason: item.reason || '',
          logDetail: item.logDetail || '',
          statusTxt: item.statusTxt,
          flowConfig: this.pickFlowConfigSource(item)
        }))

        this.pagination.total = data.total || this.tableData.length
        this.pagination.currentPage =
          data.current || this.pagination.currentPage
        this.pagination.pageSize = data.size || this.pagination.pageSize
      } catch (e) {
        console.error(e)
        this.$message.error('获取任务日志列表失败')
      } finally {
        this.tableLoading = false
      }
    },
    async openDetail(row) {
      this.detailVisible = true
      this.detailData = { ...row }

      const logId = row && (row.id || row.logId)

      if (logId) {
        try {
          const res = await transTaskLogDetail(logId)
          if (this.isApiSuccess(res) && res.data) {
            const d = res.data
            this.detailData = {
              ...this.detailData,
              ...d,
              // 关键字段映射
              taskName: d.taskName || this.detailData.taskName,
              flowName: d.flowName || this.detailData.flowName,
              executeStatus: d.status || this.detailData.executeStatus,
              executeTime:
                d.startTimeTxt || d.startTime || this.detailData.executeTime,
              durationText: this.toDurationText(d.durationSeconds),
              dataVolume: d.dataVolume || 0,
              linesErrors: d.linesErrors || 0,
              logDetail: d.logDetail || d.reason || '暂无日志',
              flowConfig: this.pickFlowConfigSource(d) || this.detailData.flowConfig
            }
          }
        } catch (e) {
          console.error('详情接口错误', e)
          this.$message.warning('获取详情失败，使用列表数据')
        }
      }

      this.$nextTick(() => {
        this.renderFlowPreview(this.detailData.flowConfig)
      })
    },
    destroyPreviewGraph() {
      if (this.previewGraph) {
        this.previewGraph.dispose()
        this.previewGraph = null
      }
    },
    async renderFlowPreview(flowConfigRaw) {
      const container = this.$refs.flowPreviewRef
      if (!container) return

      this.destroyPreviewGraph()
      container.innerHTML = ''

      const w = Math.max(320, Math.floor(container.clientWidth || 0) || 800)
      const h = 280

      this.previewGraph = new Graph({
        container,
        width: w,
        height: h,
        background: { color: '#ffffff' },
        grid: false,
        interacting: false,
        selecting: false,
        connecting: false,
        panning: true,
        mousewheel: false,
        keyboard: false
      })

      let flowConfig = this.parseFlowConfig(flowConfigRaw)

      if (
        !flowConfig ||
        !Array.isArray(flowConfig.cells) ||
        flowConfig.cells.length === 0
      ) {
        console.warn('没有有效的流程配置，使用空画布')
        flowConfig = { cells: [] }
      }
      flowConfig = this.normalizePreviewRuntimeStyles(flowConfig)

      // 确保边有anchor
      if (Array.isArray(flowConfig.cells)) {
        flowConfig.cells.forEach((cell) => {
          if (cell.shape === 'edge') {
            if (
              cell.source &&
              typeof cell.source === 'object' &&
              !cell.source.anchor
            ) {
              cell.source.anchor = 'center'
            }
            if (
              cell.target &&
              typeof cell.target === 'object' &&
              !cell.target.anchor
            ) {
              cell.target.anchor = 'center'
            }
          }
        })
      }

      this.previewGraph.fromJSON(flowConfig)
      this.previewGraph.centerContent({ padding: 20 })
    }
  }
}
</script>

<style scoped>
.container {
  background: radial-gradient(circle at 15% 20%, #eef4ff 0%, #f6f9ff 55%, #f7f8fb 100%);
  flex: 1;
  padding: 14px;
  box-sizing: border-box;
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
}
.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

::v-deep .el-container {
  height: 100%;
}

::v-deep .el-main {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.list {
  padding: 20px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9eef8;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
  height: 100%;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}
.search {
  padding: 0;
  margin-bottom: 20px;
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
}
.search-row-uniform {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 16px;
  margin-left: 0 !important;
  margin-right: 0 !important;
}
.search-row-uniform .el-col {
  flex: 1 !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: none !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.col {
  display: flex;
  align-items: center;
  line-height: 32px;
  width: 100%;
}
.label {
  font-size: 13px;
  font-weight: 500;
  color: #6a7486;
  white-space: nowrap;
  min-width: 4.5em;
  text-align: right;
  margin-right: 8px;
}
.search-btns {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  white-space: normal;
  flex-wrap: nowrap;
}

.search-col-btns {
  margin-left: auto;
}

::v-deep .search .el-input__inner {
  height: 32px;
  line-height: 32px;
  font-size: 13px;
  border-radius: 8px;
}

/* 日期范围控件：缩小内置文字，保证占位完整展示 */
::v-deep .search-date .el-range-input {
  font-size: 12px;
}

::v-deep .search-date .el-range-separator {
  font-size: 12px;
  padding: 0 4px;
}

::v-deep .search-date.el-date-editor {
  height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
}

::v-deep .search-date .el-range__icon,
::v-deep .search-date .el-range__close-icon {
  line-height: 24px;
}

::v-deep .search-date .el-range-input {
  height: 24px;
  line-height: 24px;
  vertical-align: middle;
  border: none !important;
  box-shadow: none !important;
  background: transparent;
}

::v-deep .search .el-button--mini {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
}

::v-deep .el-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #edf2fb;
}

::v-deep .el-table__body-wrapper {
  flex: 1;
  overflow-y: auto;
}

::v-deep .el-table th {
  background-color: #f8faff !important;
  color: #31415f;
  font-weight: 600;
  height: 44px;
}

::v-deep .el-table td {
  padding: 10px 0;
  color: #4b566a;
}

::v-deep .el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #fafcff;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
  flex-shrink: 0;
}
.status-success {
  color: #67c23a;
}
.status-failure {
  color: #f56c6c;
}
.status-running {
  color: #409eff;
}
.status-default {
  color: #909399;
}
.detail-section {
  margin-bottom: 16px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f3358;
  margin-bottom: 12px;
}
.log-box {
  min-height: 110px;
  max-height: 200px;
  overflow: auto;
  border: 1px solid #e9eef8;
  background: #fafcff;
  color: #4b566a;
  font-size: 13px;
  line-height: 1.6;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: 6px;
}
.detail-section-flow .flow-preview-heading {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 12px;
}

.flow-preview-hint {
  font-size: 12px;
  font-weight: normal;
  color: #8b95a8;
}

.flow-preview {
  height: 280px;
  border: 1px solid #e9eef8;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
}

.flow-preview:active {
  cursor: grabbing;
}

/* X6 平移时由库切换 class，同步抓手光标 */
.flow-preview ::v-deep .x6-graph-pannable {
  cursor: grab;
}

.flow-preview ::v-deep .x6-graph-panning {
  cursor: grabbing !important;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e9eef8;
  background: #fff;
  margin-bottom: 16px;
  font-size: 14px;
}

.info-table td {
  padding: 12px 16px;
  border: 1px solid #e9eef8;
  vertical-align: middle;
}

.info-label {
  background-color: #f8faff;
  color: #6a7486;
  font-weight: 500;
  width: 110px;
  text-align: right;
  white-space: nowrap;
}

.info-value {
  color: #31415f;
  word-break: break-all;
  line-height: 1.5;
}

.status-success {
  color: #67c23a;
  font-weight: 500;
}
.status-failure {
  color: #f56c6c;
  font-weight: 500;
}
.status-running {
  color: #409eff;
  font-weight: 500;
}
.detail-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e9eef8;
  background: #fff;
  font-size: 14px;
  margin-bottom: 20px;
  table-layout: fixed;
  border-radius: 8px;
  overflow: hidden;
}

.detail-table th,
.detail-table td {
  padding: 12px 14px;
  border: 1px solid #e9eef8;
  text-align: left;
  vertical-align: middle;
}

.detail-table th {
  background-color: #f8faff;
  color: #6a7486;
  font-weight: 500;
  width: 90px;
  white-space: nowrap;
}

.detail-table td {
  color: #31415f;
}

.detail-table td[colspan="3"] {
  color: #31415f;
}

::v-deep .log-detail-dialog .el-dialog {
  border-radius: 12px;
  overflow: hidden;
}

::v-deep .log-detail-dialog .el-dialog__header {
  background: #f8faff;
  border-bottom: 1px solid #e9eef8;
  padding: 16px 20px;
}

::v-deep .log-detail-dialog .el-dialog__title {
  color: #1f3358;
  font-weight: 600;
  font-size: 16px;
}

::v-deep .log-detail-dialog .el-dialog__body {
  padding: 24px 24px 20px;
}
</style>

<style lang="scss">
@media (max-width: 1500px) {
  .app-wrapper.openSidebar .task-log-page .search-row-uniform {
    flex-wrap: wrap;
  }

  .app-wrapper.openSidebar .task-log-page .search-row-uniform .search-col:not(.search-col-btns) {
    flex: 1 1 260px;
    min-width: 260px;
  }

  .app-wrapper.openSidebar .task-log-page .search-col-btns {
    flex: 1 1 100%;
    min-width: 100%;
  }

  .app-wrapper.openSidebar .task-log-page .search-col-btns .search-btns {
    justify-content: flex-end;
  }
}
</style>

