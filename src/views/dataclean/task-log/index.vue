<template>
  <div class="container">
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
              max-height="640"
              element-loading-text="正在加载日志..."
            >
              <el-table-column type="index" label="#" width="55" />
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
              <el-table-column label="执行状态" width="100">
                <template slot-scope="scope">
                  <span :class="statusClass(scope.row.executeStatus)">
                    {{ statusText(scope.row.executeStatus) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column fixed="right" label="操作" width="80">
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
      title="清洗详情"
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

      <div class="detail-section">
        <div class="section-title">流程图预览</div>
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
      return (this.taskStatusOption || []).map((item) => ({
        label:
          item && item.value != null
            ? String(item.value)
            : String(item.code || ''),
        value:
          item && item.code != null
            ? String(item.code)
            : String(item.value || '')
      }))
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
          flowConfig: item.flowConfig
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
              flowConfig: d.flowConfig
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
    async renderFlowPreview(flowConfigStr) {
      const container = this.$refs.flowPreviewRef
      if (!container) return

      this.destroyPreviewGraph()
      container.innerHTML = ''

      this.previewGraph = new Graph({
        container,
        width: 760,
        height: 280,
        background: { color: '#ffffff' },
        grid: false,
        interacting: false,
        selecting: false,
        connecting: false,
        panning: false,
        mousewheel: false,
        keyboard: false
      })

      let flowConfig = null
      if (flowConfigStr) {
        try {
          // 关键：正确解析后端返回的带转义的JSON字符串
          let jsonStr = flowConfigStr
          if (typeof jsonStr === 'string') {
            jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\n/g, '')
            flowConfig = JSON.parse(jsonStr)
          } else {
            flowConfig = jsonStr
          }
        } catch (e) {
          console.warn('解析flowConfig失败，使用mock', e)
        }
      }

      if (
        !flowConfig ||
        !Array.isArray(flowConfig.cells) ||
        flowConfig.cells.length === 0
      ) {
        console.warn('没有有效的流程配置，使用空画布')
        flowConfig = { cells: [] }
      }

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
      container.style.pointerEvents = 'none'
    },
    buildMockFlowConfig() {
      return {
        cells: [
          {
            shape: 'rect',
            position: { x: 160, y: 90 },
            size: { width: 180, height: 40 },
            attrs: {
              body: { stroke: '#dcdfe6', fill: '#fff', rx: 6, ry: 6 },
              label: { text: '关系表输入', fill: '#555', fontSize: 14 }
            },
            id: 'preview-input'
          },
          {
            shape: 'rect',
            position: { x: 430, y: 180 },
            size: { width: 180, height: 40 },
            attrs: {
              body: { stroke: '#dcdfe6', fill: '#fff', rx: 6, ry: 6 },
              label: { text: '关系表输出', fill: '#555', fontSize: 14 }
            },
            id: 'preview-output'
          },
          {
            shape: 'edge',
            source: { cell: 'preview-input' },
            target: { cell: 'preview-output' },
            attrs: {
              line: {
                stroke: '#8f8f8f',
                strokeWidth: 1.5,
                targetMarker: { name: 'block', size: 6 }
              }
            },
            connector: { name: 'smooth', args: { type: 'cubic' }},
            router: { name: 'manhattan' }
          }
        ]
      }
    }
  }
}
</script>

<style scoped>
.container {
  background: #f5f7fa;
  flex: 1;
}
.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 10px 0 0 0;
  padding: 0;
  overflow: hidden;
}
.list {
  padding: 10px 20px 20px 20px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  height: calc(100vh - 90px);
  min-width: 1280px;
  display: flex;
  flex-direction: column;
}
.search {
  padding: 10px 0 0;
  margin-bottom: 20px;
}
.search-row-uniform {
  display: flex;
}
.search-row-uniform .el-col {
  flex: 1;
  min-width: 0;
}
.col {
  display: flex;
  align-items: center;
  line-height: 32px;
}
.label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
  min-width: 5em;
  text-align: right;
  margin-right: 8px;
}
.search-input,
.search-select,
.search-date {
  max-width: 200px;
  width: 100%;
}
.search-btns {
  display: flex;
  gap: 10px;
  white-space: nowrap;
}
.pagination-wrapper {
  margin-top: 15px;
  text-align: right;
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
  color: #303133;
  margin-bottom: 8px;
}
.log-box {
  min-height: 110px;
  max-height: 200px;
  overflow: auto;
  border: 1px solid #ebeef5;
  background: #fafafa;
  color: #303133;
  font-size: 13px;
  line-height: 1.6;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
.flow-preview {
  height: 260px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ebeef5;
  background: #fff;
  margin-bottom: 16px;
  font-size: 14px;
}

.info-table td {
  padding: 12px 16px;
  border: 1px solid #ebeef5;
  vertical-align: middle;
}

.info-label {
  background-color: #f8f9fa;
  color: #606266;
  font-weight: 500;
  width: 110px;
  text-align: right;
  white-space: nowrap;
}

.info-value {
  color: #303133;
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
  border: 1px solid #ebeef5;
  background: #fff;
  font-size: 14px;
  margin-bottom: 20px;
  table-layout: fixed;
}

.detail-table th,
.detail-table td {
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  text-align: left;
  vertical-align: middle;
}

.detail-table th {
  background-color: #f8f9fa;
  color: #606266;
  font-weight: 500;
  width: 90px;
  white-space: nowrap;
}

.detail-table td {
  color: #303133;
}

.detail-table td[colspan="3"] {
  color: #303133;
}
</style>
