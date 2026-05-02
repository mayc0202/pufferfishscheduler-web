<!-- eslint-disable vue/valid-template-root -->
<template>
  <div class="container metadata-page">
    <div class="body">
      <el-container>
        <el-aside width="260px" class="page-aside">
          <div class="group">
            <div class="wrap">
              <div class="flex search">
                <el-input
                  v-model="searchGroup"
                  placeholder="输入分组名称"
                  clearable
                  size="mini"
                  @input="queryGroupsByName()"
                >
                  <i slot="prefix" class="el-input__icon el-icon-search" />
                </el-input>
              </div>
              <el-button type="primary" class="queryAll" size="mini" @click="queryAll()">查看全部数据</el-button>
              <el-tree :data="group">
                <div slot-scope="{ data }" class="custom-node flex between">
                  <div class="flex node-label">
                    <img v-if="data.type === 'GROUP'" :src="icons.db_group" class="group_icon">
                    <img v-else :src="data.icon" class="group_icon">
                    {{ data.name }}
                  </div>
                </div>
              </el-tree>
            </div>
          </div>
        </el-aside>
        <el-container>
          <el-main>
            <div class="list">
              <div class="search">
                <el-row class="search-row search-row-uniform" :gutter="12">
                  <el-col :span="5">
                    <div class="col">
                      <div class="label">名称：</div>
                      <el-input
                        v-model="queryData.dbName"
                        class="search_input"
                        placeholder="请输入数据源名称"
                        clearable
                      />
                    </div>
                  </el-col>
                  <el-col :span="5">
                    <div class="col">
                      <div class="label">
                        分组：
                      </div>
                      <el-select v-model="queryData.groupId" class="search-select" clearable placeholder="请选择数据源分组">
                        <el-option
                          v-for="item in groupSelectOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </div>
                  </el-col>
                  <el-col :span="5">
                    <div class="col">
                      <div class="label">
                        同步状态：
                      </div>
                      <el-select v-model="queryData.status" class="search-select" clearable placeholder="请选择同步任务状态">
                        <el-option
                          v-for="opt in taskStatusSelectOptions"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value"
                        />
                      </el-select>
                    </div>
                  </el-col>
                  <el-col :span="4">
                    <div class="col">
                      <div class="label">
                        只显示启用：
                      </div>
                      <el-switch
                        v-model="queryData.enable"
                        active-color="#13ce66"
                      />
                    </div>
                  </el-col>
                  <el-col :span="5" class="search-col-btns">
                    <div class="search-btns">
                      <el-button type="primary" icon="el-icon-search" size="mini" @click="selectTaskList()">查询</el-button>
                      <el-button type="primary" size="mini" @click="handleAddSchedule">新增同步任务</el-button>
                    </div>
                  </el-col>
                </el-row>
              </div>
              <template>
                <el-table
                  v-loading="loading"
                  element-loading-text="正在加载数据..."
                  element-loading-spinner="el-icon-loading"
                  element-loading-background="rgba(255, 255, 255, 0.8)"
                  :data="taskList"
                  style="width: 100%"
                  max-height="640"
                >
                  <el-table-column
                    fixed
                    type="index"
                    label="#"
                  />
                  <el-table-column prop="dbName" label="数据源名称" min-width="180" />
                  <el-table-column prop="dbGroupName" label="数据源分组" min-width="150" />
                  <el-table-column
                    prop="cron"
                    label="同步策略"
                    min-width="170"
                  />
                  <el-table-column
                    label="执行状态"
                    min-width="140"
                  >
                    <template slot-scope="scope">
                      <span
                        class="rt-status"
                        :class="rtStatusClass(scope.row)"
                        @click="isFailureStatus(scope.row) && openReason(scope.row)"
                      >
                        <i v-if="rtStatusShowDot(scope.row)" class="rt-status-dot" />
                        <span class="rt-status-text">
                          <template v-if="getTaskStatusDisplay(scope.row).plain">
                            {{ getTaskStatusDisplay(scope.row).text }}
                          </template>
                          <template v-else>
                            {{ getTaskStatusDisplay(scope.row).before }}<span class="rt-status-fail-underline">失败</span>{{ getTaskStatusDisplay(scope.row).after }}
                          </template>
                        </span>
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="executeTimeTxt" label="最近执行时间" min-width="170" />
                  <el-table-column fixed="right" label="操作" width="220">
                    <template slot-scope="scope">
                      <div class="wrap">
                        <div style="display: flex; gap: 8px; justify-content: flex-start; flex-wrap: nowrap;">
                          <el-button
                            type="text"
                            size="mini"
                            style="margin-left: 0; padding: 0;"
                            @click.native.prevent="
                              handleEdit(scope.row)
                            "
                          >
                            编辑
                          </el-button>
                          <el-button
                            type="text"
                            size="mini"
                            style="margin-left: 0; padding: 0;"
                            @click.native.prevent="
                              handleImmediatelySync(scope.row)
                            "
                          >
                            立即执行
                          </el-button>
                          <el-button
                            type="text"
                            size="mini"
                            style="margin-left: 0; padding: 0;"
                            @click.native.prevent="
                              toggleEnableStatus(scope.row.id)
                            "
                          >
                            {{ isEnabled(scope.row.enable) ? '禁用' : '启用' }}
                          </el-button>
                          <el-button
                            type="text"
                            size="mini"
                            style="margin-left: 0; padding: 0;"
                            @click.native.prevent="
                              handleDelete(scope.row.id)
                            "
                          >
                            删除
                          </el-button>
                        </div>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </template>
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
          </el-main>
        </el-container>
      </el-container>
    </div>

    <!-- 使用定时任务组件 -->
    <QuartzJob
      v-if="scheduleDialogVisible"
      ref="quartzJob"
      :visible="scheduleDialogVisible"
      :width="460"
      :title="isEditMode ? '编辑同步任务' : '新增同步任务'"
      :edit-data="isEditMode ? { id: editingTaskId } : null"
      @submit="handleScheduleSubmit"
      @cancel="handleScheduleCancel"
    />

    <!-- 任务失败原因 -->
    <el-dialog
      v-el-drag-dialog
      :visible.sync="reasonDialogVisible"
      title="任务失败原因"
      width="700px"
      class="reason-dialog"
      :show-close="true"
      :close-on-click-modal="false"
      :modal-append-to-body="true"
      :append-to-body="true"
    >
      <div class="reason-body">
        <pre class="reason-pre">{{ reasonText || '暂无失败原因' }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import icons from '@/assets/icon/icons.js'
import QuartzJob from '@/components/common/quartz-job.vue'

import dictCode from '@/api/dict/dictCode.js'
import { getDict } from '@/api/dict/dict'

import {
  tree,
  list,
  add,
  update,
  detail,
  deleted,
  toggleEnableStatus,
  immediatelySync
} from '@/api/database/metadata/metadata'

export default {
  name: 'PagePermission',
  components: {
    QuartzJob
  },
  data() {
    return {
      icons,
      // 分组
      group: [],
      // 分组下拉列表
      groupOption: [],
      // 任务状态下拉列表
      taskStatusOption: [],
      searchGroup: '', // 查询分组
      // 查询数据
      queryData: {
        groupId: '',
        dbId: '',
        dbName: '',
        status: '',
        enable: true,
        pageNo: 1,
        pageSize: 10
      },
      pageNo: 1,
      pageSize: 10,
      total: 0,
      taskList: [], // 任务列表
      loading: false,
      // 页面定时刷新
      listTimer: null,
      // 任务失败原因弹窗
      reasonDialogVisible: false,
      reasonText: '',
      // 展示定时任务组件
      scheduleDialogVisible: false,
      isEditMode: false, // 是否为编辑模式
      editingTaskId: null // 当前编辑的任务ID
    }
  },

  computed: {
    toDictOption() {
      return (item) => {
        const labelRaw = item && (item.value ?? item.label ?? item.name ?? item.code)
        const valueRaw = item && (item.code ?? item.id ?? item.value)
        return {
          label: labelRaw != null ? String(labelRaw) : '',
          value: valueRaw != null ? String(valueRaw) : ''
        }
      }
    },
    groupSelectOptions() {
      return (this.groupOption || []).map(this.toDictOption)
    },
    taskStatusSelectOptions() {
      return (this.taskStatusOption || []).map(this.toDictOption)
    },
    taskStatusMap() {
      const map = {}
      ;(this.taskStatusOption || []).forEach(item => {
        const code = item.code != null ? String(item.code) : ''
        if (!code) return
        const label = item.value || code
        let type = 'info'
        if (code === 'R' || code === 'RUNNING' || code === 'S' || code === 'SUCCESS') type = 'success'
        else if (code === 'F' || code === 'FAILURE') type = 'danger'
        map[code] = { label, type }
      })
      return map
    }
  },

  created() {
    this.pageNo = 1
    this.pageSize = 10
  },

  mounted() {
    this.initDict()
    this.queryAll()
    this.selectTaskList()
    this.startListTimer()
  },

  beforeDestroy() {
    this.stopListTimer()
  },

  methods: {
    startListTimer() {
      this.stopListTimer()
      // 与 CDC 页面一致：10s 刷新一次
      this.listTimer = setInterval(() => {
        this.selectTaskList(false)
      }, 10000)
    },
    stopListTimer() {
      if (this.listTimer) {
        clearInterval(this.listTimer)
        this.listTimer = null
      }
    },

    // 后端 enable 字段可能是 boolean / 0|1 / '0'|'1' 等多种类型
    // 统一归一化：返回 true 表示“启用”
    isEnabled(val) {
      if (val === true) return true
      if (val === false) return false
      if (val === 1 || val === '1') return true
      if (val === 0 || val === '0') return false
      if (val === 'true' || val === 'TRUE') return true
      if (val === 'false' || val === 'FALSE') return false
      return Boolean(val)
    },

    // 加载字典数据
    initDict() {
      getDict(dictCode.TASK_STATUS).then((res) => {
        this.taskStatusOption = res.data
      })
      getDict(dictCode.DB_GROUP).then((res) => {
        this.groupOption = res.data
      })
    },

    /**
     * 添加同步任务
     * @param form
     */
    async saveSchedule(form) {
      // 调用后端API
      const res = await add(form)
      this.$message.success(res.data)
    },

    /**
     * 每页多少条记录
     * @param val
     */
    handleSizeChange(val) {
      this.pageSize = val
      this.queryData.pageSize = this.pageSize
      this.queryData.pageNo = this.pageNo
      this.selectTaskList()
    },

    /**
     * 查询第几页
     * @param val
     */
    handleCurrentChange(val) {
      this.pageNo = val
      this.queryData.pageSize = this.pageSize
      this.queryData.pageNo = this.pageNo
      this.selectTaskList()
    },

    /**
     * 根据名称查询数据源列表
     */
    searchTaskByName() {
      this.queryData.pageNo = this.pageNo
      this.queryData.pageSize = this.pageSize
      this.selectTaskList()
    },

    /**
     * 获取分组数
     */
    queryAll() {
      tree('').then((res) => {
        this.group = res.data
      })
    },

    /**
     * 依据分组名称查询
     */
    queryGroupsByName() {
      tree(this.searchGroup).then((res) => {
        this.group = res.data
      })
    },

    /**
     * 获取数据源集合
     */
    async selectTaskList(showLoading = true) {
      try {
        if (showLoading) {
          this.loading = true // 加载中
        }

        const res = await list(this.queryData)

        // 成功处理
        const result = res.data
        this.pageNo = result.current
        this.pageSize = result.size
        this.total = result.total
        this.taskList = result.records
      } catch (error) {
        this.$message.error('获取元数据同步任务列表失败!')
        console.error(error)
      } finally {
        if (showLoading) {
          this.loading = false // 加载完成
        }
      }
    },

    /**
     * 处理编辑操作
     * @param row
     */
    handleEdit(row) {
      this.isEditMode = true
      this.editingTaskId = row.id
      this.scheduleDialogVisible = true

      const editData = {
        dbId: row.dbId || row.metadataId, // 根据实际字段名调整
        cron: row.cron,
        failurePolicy: row.failurePolicy || '0',
        notifyPolicy: row.notifyPolicy || '0',
        workerId: row.workerId,
        enable: this.isEnabled(row.enable) ? '0' : '1', // 转换 enable 状态
        id: row.id, // 添加ID用于更新
        // 列表行若已带联系人 id，先回填多选；详情接口返回后再与 options 映射名称
        contactIdList:
          row.contactIdList != null ? row.contactIdList : row.contactIds
      }

      // 这里需要将数据传递给QuartzJob组件
      // 我们可以通过ref来调用子组件的方法
      this.$nextTick(() => {
        if (this.$refs.quartzJob) {
          this.$refs.quartzJob.setFormData(editData)
        }
      })
    },

    /**
     * 处理新增/编辑提交
     * @param formData
     */
    async handleScheduleSubmit(formData) {
      if (this.isEditMode) {
      // 编辑模式，调用更新API
        await this.updateSchedule(formData)
      } else {
      // 新增模式，调用添加API
        await this.saveSchedule(formData)
      }
      this.resetDialogState()
    },

    /**
     * 更新同步任务
     * @param formData
     */
    async updateSchedule(formData) {
      try {
      // 这里调用你的更新API，假设是 update 方法
        const res = await update(formData)
        this.$message.success(res.data || '更新成功')
        this.selectTaskList() // 刷新列表
      } catch (error) {
        this.$message.error('更新失败')
        console.error(error)
      }
    },

    /**
     * 删除同步任务
     * @param form
     */
    async handleDelete(id) {
      try {
        // 调用后端API
        const res = await deleted(id)
        this.$message.success(res.data || '删除成功')
        this.selectTaskList() // 刷新列表
      } catch (error) {
        this.$message.error('删除失败')
        console.error(error)
      }
    },

    /**
     * 切换启用状态
     * @param form
     */
    async toggleEnableStatus(id) {
      try {
        // 调用后端API
        const res = await toggleEnableStatus(id)
        this.$message.success(res.data || '切换启用状态成功')
        this.selectTaskList() // 刷新列表
      } catch (error) {
        this.$message.error('切换启用状态失败')
        console.error(error)
      }
    },

    /**
     * 立即执行同步任务（对接后端：immediatelySync.do）
     * @param row
     */
    async handleImmediatelySync(row) {
      try {
        const dbId = row && (row.dbId || row.metadataId)
        if (!dbId) {
          this.$message.error('无法立即同步：缺少 dbId')
          return
        }

        const res = await immediatelySync(dbId)
        this.$message.success(res.data || '开始同步!')
        this.selectTaskList() // 刷新列表，让状态尽快可见
      } catch (error) {
        this.$message.error('立即同步失败')
        console.error(error)
      }
    },

    /**
     * 处理取消操作
     */
    handleScheduleCancel() {
      this.resetDialogState()
    },

    /**
     * 重置弹窗状态
     */
    resetDialogState() {
      this.scheduleDialogVisible = false
      this.isEditMode = false
      this.editingTaskId = null
      // 重置QuartzJob组件的表单数据
      if (this.$refs.quartzJob) {
        this.$refs.quartzJob.resetForm()
      }

      this.selectTaskList()
    },

    // 修改添加按钮点击事件
    handleAddSchedule() {
      this.isEditMode = false
      this.scheduleDialogVisible = true
    },
    // ===== 执行状态展示（对齐 CDC 实时归集）=====
    getTaskStatusCode(row) {
      const raw = row && (row.status != null ? row.status : (row.taskStatus != null ? row.taskStatus : undefined))
      let code = raw != null ? String(raw).toUpperCase() : ''
      // 兜底：后端如果只返回中文 statusTxt（不含 code），用字典反查 code
      if (!code && row && row.statusTxt) {
        const match = (this.taskStatusOption || []).find(item => String(item.value || '') === String(row.statusTxt || ''))
        code = match && match.code != null ? String(match.code).toUpperCase() : ''
      }
      return code
    },
    isFailureStatus(row) {
      const code = this.getTaskStatusCode(row)
      return code === 'FAILURE' || code === 'F'
    },
    rtStatusClass(row) {
      const code = this.getTaskStatusCode(row)
      if (code === 'RUNNING' || code === 'R' || code === 'S' || code === 'SUCCESS') return 'is-running'
      if (code === 'FAILURE' || code === 'F') return 'is-failure is-clickable'
      if (code === 'STARTING') return 'is-starting'
      if (code === 'STOPPING') return 'is-stopping'
      if (code === 'STOP' || code === 'T') return 'is-stopped'
      if (code === 'INIT') return 'is-init'
      return 'is-init'
    },
    rtStatusShowDot(row) {
      const code = this.getTaskStatusCode(row)
      return code === 'RUNNING' || code === 'R' || code === 'FAILURE' || code === 'F'
    },
    taskStatusLabel(row) {
      const code = this.getTaskStatusCode(row)
      const meta = this.taskStatusMap[code]
      if (meta && meta.label) return meta.label
      // 后端若直接返回中文展示文本，兜底使用 statusTxt
      return row && row.statusTxt ? row.statusTxt : '未知'
    },
    getTaskStatusDisplay(row) {
      const text = this.taskStatusLabel(row)
      if (!this.isFailureStatus(row)) {
        return { plain: true, text }
      }
      const idx = text.indexOf('失败')
      if (idx === -1) {
        return { plain: true, text }
      }
      return {
        plain: false,
        before: text.slice(0, idx),
        after: text.slice(idx + 2)
      }
    },
    async openReason(row) {
      // 优先使用列表里的 reason 字段
      const localReason = row && (row.reason || row.taskReason)
      if (localReason) {
        this.reasonText = String(localReason)
        this.reasonDialogVisible = true
        return
      }

      // 兜底读取详情（兼容 id / taskId）
      const id = row && (row.id || row.taskId)
      if (!id) {
        this.reasonText = ''
        this.reasonDialogVisible = true
        return
      }

      try {
        const res = await detail(id)
        const data = res && res.data
        this.reasonText = (data && (data.reason || data.taskReason)) ? String(data.reason || data.taskReason) : ''
      } catch (error) {
        console.error(error)
        this.reasonText = error?.message || ''
      } finally {
        this.reasonDialogVisible = true
      }
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.custom-tooltip {
  border: none !important;
  border-radius: 4px !important;
  box-shadow: $shadow;
}

.custom-tooltip .popper__arrow {
  border: none !important;
  box-shadow: $shadow;
}
</style>

<style lang="scss">
@media (max-width: 1500px) {
  .app-wrapper.openSidebar .metadata-page .search-row-uniform {
    flex-wrap: wrap;
  }

  .app-wrapper.openSidebar .metadata-page .search-row-uniform .search-col:not(.search-col-btns),
  .app-wrapper.openSidebar .metadata-page .search-row-uniform .el-col-5:not(.search-col-btns) {
    flex: 1 1 260px;
    min-width: 260px;
  }

  .app-wrapper.openSidebar .metadata-page .search-col-btns,
  .app-wrapper.openSidebar .metadata-page .search-row-uniform .el-col-4.search-col-btns {
    flex: 1 1 100%;
    min-width: 100%;
  }

  .app-wrapper.openSidebar .metadata-page .search-col-btns .search-btns {
    justify-content: flex-end;
  }
}

.app-wrapper.hideSidebar .metadata-page .search-row-uniform {
  display: grid !important;
  grid-template-columns: minmax(180px, 220px) minmax(210px, 230px) minmax(210px, 230px) 150px auto;
  align-items: center !important;
  column-gap: 16px !important;
  row-gap: 0 !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.app-wrapper.hideSidebar .metadata-page .search-row-uniform > [class*='el-col-'] {
  float: none !important;
  width: 100% !important;
  min-width: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* 折叠态固定轨道顺序：输入/分组/状态/启用/按钮 */
.app-wrapper.hideSidebar .metadata-page .search-row-uniform > [class*='el-col-']:nth-child(1) { grid-column: 1; }
.app-wrapper.hideSidebar .metadata-page .search-row-uniform > [class*='el-col-']:nth-child(2) { grid-column: 2; }
.app-wrapper.hideSidebar .metadata-page .search-row-uniform > [class*='el-col-']:nth-child(3) { grid-column: 3; }
.app-wrapper.hideSidebar .metadata-page .search-row-uniform > [class*='el-col-']:nth-child(4) { grid-column: 4; }
.app-wrapper.hideSidebar .metadata-page .search-row-uniform > [class*='el-col-']:nth-child(5) { grid-column: 5; }

.app-wrapper.hideSidebar .metadata-page .search-col-btns,
.app-wrapper.hideSidebar .metadata-page .search-row-uniform .el-col-4.search-col-btns {
  width: auto !important;
  justify-self: end !important;
}

.app-wrapper.hideSidebar .metadata-page .search-col-btns .search-btns {
  justify-content: flex-end !important;
  flex-wrap: nowrap !important;
}

.app-wrapper.hideSidebar .metadata-page .search-row-uniform .el-col-5:nth-child(4) .label {
  min-width: 84px;
}
</style>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.custom-tooltip .custom-menu {
  border: none;
}

.custom-tooltip .menu-item {
  color: $label;
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
}

.custom-tooltip .menu-item:last-child {
  border-bottom: none;
}

.custom-tooltip .menu-item:hover {
  background-color: #fff;
  color: #409eff;
}

.container {
  height: calc(100vh - 84px);
  background: radial-gradient(circle at 15% 20%, #eef4ff 0%, #f6f9ff 55%, #f7f8fb 100%);
  padding: 14px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.body {
  margin: 0;
  padding: 0;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
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

::v-deep .page-aside {
  height: 100%;
  margin: 0 14px 0 0;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 14px;
  border: 1px solid #e9eef8;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
  user-select: none;
  min-width: 240px;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

.body .group {
  border-radius: 4px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.body .group .wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.body .group .search {
  margin-bottom: 14px;
  flex-shrink: 0;
}

.body .group .search .add {
  margin-left: 10px;
}

.body .group .queryAll {
  width: 100%;
  margin-bottom: 14px;
  flex-shrink: 0;
  border-radius: 8px;
}

.body .group .group_icon {
  width: 18px;
  height: 18px;
  margin-top: 8px;
  margin-right: 8px;
}

::v-deep .el-tree {
  flex: 1;
  overflow-y: auto;
}

.body .list {
  margin: 0;
  padding: 20px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9eef8;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.body .list .search {
  padding: 0;
  margin-bottom: 20px;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.body .list .search .search_input {
  flex: 1 !important;
  width: 100% !important;
  min-width: 0 !important;
  height: 32px;
}

.body .list .search .search-select {
  flex: 1 !important;
  width: 100% !important;
  min-width: 0 !important;
}

.body .list .search .search_input .input {
  height: 32px;
  width: 100%;
  background-color: white;
  box-shadow: none;
  border-radius: 8px;
  outline: none;
  border: 1px solid #dcdfe6;
  padding: 0 10px;
  box-sizing: border-box;
}

.body .list .search .col {
  display: flex;
  align-items: center;
  width: 100%;
}

.body .list .search .label {
  font-size: 13px;
  font-weight: 500;
  color: #6a7486;
  white-space: nowrap;
  min-width: 4.5em;
  text-align: right;
  margin-right: 8px;
}

.body .list .search .search-row-uniform {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 16px;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.body .list .search .search-row-uniform .el-col {
  display: flex;
  align-items: center;
  flex: 1 !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: none !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.body .list .search .search-col-btns {
  margin-left: auto;
}

.body .list .search .search-btns {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  white-space: normal;
  flex-wrap: nowrap;
}

.body .list .search > div:last-child {
  flex-shrink: 0;
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

::v-deep .el-input--mini .el-input__inner {
  height: 32px;
  line-height: 32px;
  font-size: 13px;
  border-radius: 8px;
}

::v-deep .el-button--mini {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
}

::v-deep .el-textarea__inner {
  display: block;
  resize: vertical;
  padding: 5px 15px;
  line-height: 1.5;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  width: 100%;
  font-size: 14px;
  color: #606266;
  background-color: #ffffff;
  background-image: none;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  -webkit-transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

::v-deep .el-pagination__sizes {
  margin-top: -5px;
}

::v-deep .el-form-item__label {
  font-size: 13px;
}

.custom-node {
  display: flex;
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  width: 100%;
  padding: 0 8px;
  font-size: 14px;
}

.node-label {
  flex: 1;
  font-weight: 400;
  color: #31415f;
}

.node-label:hover {
  color: #409eff;
}

.node-icon {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
  transition: color 0.3s;
  -webkit-transform: rotate(90deg); /* Chrome/Safari */
  -moz-transform: rotate(90deg); /* Firefox */
  -ms-transform: rotate(90deg); /* IE9+ */
  -o-transform: rotate(90deg); /* Opera */
  transform: rotate(90deg);
}

.custom-menu {
  user-select: none;
  padding: 0 !important;
}

.db-type-item {
  line-height: 24px;
}

.menu-item {
  padding: 2px 10px;
}

.menu-item:hover {
  background-color: #606266;
}

/** 列表头部标签 */
.list .label {
  font-size: 13px;
  font-weight: 500;
  color: #6a7486;
  margin-right: 8px;
}

.list .col {
  display: flex;
  line-height: 32px;
}

/** 开关 */
::v-deep .el-switch {
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    position: relative;
    font-size: 14px;
    line-height: 32px;
    height: 32px;
    vertical-align: middle;
}

/** 分组 */
::v-deep .group .search .el-input__inner {
  width: 240px;
  height: 32px
}

/** 列表头部：名称输入框固定宽度；el-select 内层必须 100% 宽，否则后缀箭头按外层定位会落在边框外 */
::v-deep .body .list .search .search_input .el-input__inner {
  width: 180px;
  max-width: 100%;
  height: 32px;
}

::v-deep .body .list .search .el-select .el-input__inner {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
  height: 32px;
  line-height: 32px;
  padding-right: 26px;
}

::v-deep .body .list .search .el-select .el-input__suffix {
  right: 8px;
  display: flex;
  align-items: center;
}

::v-deep .body .list .search .el-select .el-select__caret {
  line-height: 32px;
}

.body .list .search .search-row-uniform {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: 14px;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.body .list .search .search-row-uniform > [class*='el-col-'] {
  float: none !important;
  width: auto !important;
  flex: 1 1 220px;
  min-width: 220px;
}

.body .list .search .search-btns {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.body .list .col {
  align-items: center;
}

.body .list .col .label {
  min-width: 4.5em;
  text-align: right;
  white-space: nowrap;
}

// Responsive: 避免按钮/标签/输入框在小屏下“挤在一起”
// 方案：允许 el-row 在宽度不足时折行（第二层），必要时可横向滚动。
@media (max-width: 1440px) {
  .body .list .search > .el-row {
    display: flex !important;
    flex-wrap: wrap;
    gap: 12px 18px;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  // ElementUI 的列类名通常会带 el-col-{span}，这里按 span 给最小宽度，保证控件不会互相挤压
  .body .list .search .el-row .el-col-5,
  .body .list .search .el-row .el-col-4 {
    float: none !important;
    margin: 0 !important;
    width: auto !important;
    flex: 1 1 220px;
    min-width: 220px;
  }

  .body .list .search .el-row .el-col-4 {
    flex-basis: 240px;
  }

  // 搜索区输入/选择器内部输入不要固定像素宽度，改为铺满父容器
  ::v-deep .search .el-input__inner {
    width: 100% !important;
    max-width: 100% !important;
    height: 32px;
    line-height: 32px;
    font-size: 13px;
  }

  .body .list .label {
    font-size: 13px;
    margin-right: 8px;
  }

  ::v-deep .search .el-button--mini {
    padding: 8px 14px;
  }
}

.item {
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
}

.item:hover {
  box-shadow: $shadow;
}

.item .item-name {
  margin-left: 10px;
}

  .rt-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 12px;
    border-radius: 14px;
    font-size: 12px;
    line-height: 28px;
    border: 1px solid transparent;
    user-select: none;
  }

  .rt-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
  }

  .rt-status.is-running {
    color: #19be6b;
    background: rgba(25, 190, 107, 0.08);
    border-color: rgba(25, 190, 107, 0.25);
  }
  .rt-status.is-running .rt-status-dot {
    background: #19be6b;
  }

  .rt-status.is-failure {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.08);
    border-color: rgba(245, 108, 108, 0.25);
  }
  .rt-status.is-failure .rt-status-dot {
    background: #f56c6c;
  }

  .rt-status.is-init,
  .rt-status.is-stopped,
  .rt-status.is-starting,
  .rt-status.is-stopping {
    color: #606266;
    background: #f5f7fa;
    border-color: #e4e7ed;
  }

  .rt-status.is-clickable {
    cursor: pointer;
  }
  .rt-status.is-clickable:hover {
    border-color: rgba(245, 108, 108, 0.6);
    background: rgba(245, 108, 108, 0.12);
  }

  .rt-status-fail-underline {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .reason-dialog {
    ::v-deep .el-dialog {
      width: 700px !important;
      max-width: calc(100vw - 32px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-sizing: border-box;
      margin-top: 8vh !important;
      margin-bottom: 5vh;
      border-radius: 8px;
      border: 1px solid #ebeef5;
      box-shadow: 0 8px 36px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    ::v-deep .el-dialog__header {
      position: relative;
      flex-shrink: 0;
      padding: 14px 48px 14px 16px;
      margin: 0;
      border-bottom: 1px solid #ebeef5;
      background: #fff;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      cursor: move;
    }
    ::v-deep .el-dialog__title {
      color: #303133;
      font-size: 15px;
      font-weight: 600;
      line-height: 1.4;
      letter-spacing: 0.02em;
    }
    ::v-deep .el-dialog__headerbtn {
      top: 50%;
      right: 14px;
      transform: translateY(-50%);
      padding: 0;
    }
    ::v-deep .el-dialog__headerbtn .el-dialog__close {
      width: 30px;
      height: 30px;
      line-height: 30px;
      text-align: center;
      border-radius: 50%;
      background: #eef0f3;
      color: #606266;
      font-size: 15px;
      transition: background-color 0.2s, color 0.2s;
    }
    ::v-deep .el-dialog__headerbtn .el-dialog__close:hover {
      background: #e4e7ed;
      color: #303133;
    }
    ::v-deep .el-dialog__body {
      flex-shrink: 0;
      padding: 14px 16px 16px;
      box-sizing: border-box;
      overflow: hidden;
      background: #fafafa;
    }
  }

  .reason-body {
    height: 270px;
    width: 100%;
    overflow-y: auto;
    overflow-x: auto;
    padding: 12px 14px;
    background: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    box-sizing: border-box;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02);
    scrollbar-width: thin;
    scrollbar-color: #c0c4cc #eff1f5;
  }

  .reason-body::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .reason-body::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 4px;
  }

  .reason-body::-webkit-scrollbar-track {
    background: #eff1f5;
    border-radius: 4px;
  }

  .reason-pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: #606266;
    font-size: 13px;
    line-height: 1.65;
    font-family: Consolas, Menlo, Monaco, 'Courier New', monospace;
  }

</style>

