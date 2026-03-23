<!-- eslint-disable vue/valid-template-root -->
<template>
  <div class="container">
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
                <el-row>
                  <el-col :span="5">
                    <div class="search_input">
                      <input
                        v-model="queryData.dbName"
                        placeholder="请输入数据源名称"
                        class="input"
                      >
                    </div></el-col>
                  <el-col :span="5">
                    <div class="col">
                      <div class="label">
                        分组：
                      </div>
                      <el-select v-model="queryData.groupId" clearable placeholder="请选择数据源分组">
                        <el-option
                          v-for="item in groupOption"
                          :key="String(item.code)"
                          :label="item.value"
                          :value="String(item.code)"
                        />
                      </el-select>
                    </div>
                  </el-col>
                  <el-col :span="5">
                    <div class="col">
                      <div class="label">
                        同步状态：
                      </div>
                      <el-select v-model="queryData.status" clearable placeholder="请选择同步任务状态">
                        <el-option
                          v-for="opt in taskStatusSelectOptions"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value"
                        />
                      </el-select>
                    </div>
                  </el-col>
                  <el-col :span="5">
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
                  <el-col :span="4">
                    <div>
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
                  <el-table-column prop="dbName" label="数据源名称" width="220" />
                  <el-table-column prop="dbGroupName" label="数据源分组" width="200" />
                  <el-table-column
                    prop="cron"
                    label="同步策略"
                    width="200"
                  />
                  <el-table-column
                    label="执行状态"
                    width="180"
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
                  <el-table-column prop="executeTimeTxt" label="最近执行时间" width="220" />
                  <el-table-column fixed="right" label="操作" width="220">
                    <template slot-scope="scope">
                      <div class="wrap">
                        <div>
                          <el-button
                            type="text"
                            size="mini"
                            @click.native.prevent="
                              handleEdit(scope.row)
                            "
                          >
                            编辑
                          </el-button>
                          <el-button
                            type="text"
                            size="mini"
                            @click.native.prevent="
                              handleImmediatelySync(scope.row)
                            "
                          >
                            立即执行
                          </el-button>
                          <el-button
                            type="text"
                            size="mini"
                            @click.native.prevent="
                              toggleEnableStatus(scope.row.id)
                            "
                          >
                            {{ isEnabled(scope.row.enable) ? '禁用' : '启用' }}
                          </el-button>
                          <el-button
                            type="text"
                            size="mini"
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
      :height="520"
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
    taskStatusSelectOptions() {
      return (this.taskStatusOption || []).map(item => ({
        label: item.value != null ? String(item.value) : String(item.code || ''),
        value: item.code != null ? String(item.code) : String(item.value || '')
      }))
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
        id: row.id // 添加ID用于更新
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
      this.$message.info('已取消操作')
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

<style lang="scss" scoped>
@import '@/styles/variables.scss';

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
  color: #409EFF;
}

// 修改el-container的样式
.container {
  flex: 1;
  background-color: #f8f8fc;
}

// 主内容区域样式调整
::v-deep .el-container > .el-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

::v-deep .el-aside {
  font-size: 16px;
  font-weight: 600;
  padding: 10px;
  margin-left: 10px;
  user-select: none;
  min-width: 200px;
  box-shadow: $shadow;
  background-color: #fff;
}

// 侧边栏样式调整
::v-deep .page-aside {
  height: 90.5vh;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

/* 弹窗内的 el-aside */
::v-deep .dialog-aside {
  height: auto;
  min-height: 390px;
  overflow-y: auto;
}

// 表格区域样式调整
::v-deep .el-main {
  flex: 1;
  overflow-y: auto; // 改为垂直滚动
  display: flex;
  flex-direction: column;
  padding: 10px;
  margin-left: 0 !important;
  margin-top: -10px !important;
  .list {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 4px;
    .search {
      flex-shrink: 0;
    }
    .el-table {
      flex: 1;
    }
    .pagination-wrapper {
      flex-shrink: 0;
      margin-top: 20px;
    }
  }
}

/* 页面主区域 */
::v-deep .page-aside + .el-container > .el-main {
  margin-left: 10px;
  box-shadow: $shadow;
}

/* 弹窗区域 */
::v-deep .dialog-aside + .el-main {
  margin-left: 0;
  box-shadow: none;
}

::v-deep .el-table {
  border: 1px solid #ebeef5;
  border-bottom: 0;
  max-height: 630px;
}

::v-deep .el-input--mini .el-input__inner {
  height: 36px;
  line-height: 28px;
  font-size: 14px;
}

::v-deep .el-pagination__sizes {
  margin-top: -5px;
}

::v-deep .el-form-item__label {
  font-size: 13px;
}

::v-deep .el-tree {
  height: 100% !important;
  overflow-y: auto;
  max-height: 800px;
  flex: 1 !important;
  min-height: 0 !important;
  display: flex;
  flex-direction: column;
}

/** 列表头部标签 */
.list .label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
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

/** 列表头部下拉框 */
::v-deep .search .el-input__inner {
  width: 180px;
  height: 32px
}

.body {
  flex: 1; // 占据剩余空间
  display: flex;
  flex-direction: column;
  margin: 10px 0 0 0;
  padding: 0;
  overflow: hidden; // 隐藏溢出内容
}

/* 确保内部容器高度正确 */
.body >>> .el-container {
  height: 100%;
  min-height: 100%;
}

.body .group {
  border-radius: 4px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.body .group .search {
  margin-bottom: 10px;
}

.body .group .search .add {
  margin-left: 10px;
}

.body .group .queryAll {
  width: 100%;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.body .group .group_icon {
  width: 18px;
  height: 18px;
  margin-top: 8px;
  margin-right: 6px;
}

.body .list {
  padding: 10px 20px 20px 20px;
  background: #fff fixed;
  box-shadow: $shadow;
  border-radius: 4px;
  height: 100%;
  min-width: 1267px;
}

.body .list .search {
  padding: 10px;
  margin-bottom: 20px;
}

.body .list .search .search_input {
  width: 220px;
  min-width: 220px;
  height: 30px;
  margin-right: 10px;
  border-bottom: 1px rgb(167, 167, 167) inset;
}

.body .list .search .search_input .input {
  height: 24px;
  background-color: white;
  box-shadow: none;
  border-radius: 4px;
  outline: none;
  border: none;
}

.body .list .search > div:last-child {
  flex-shrink: 0;
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
  padding: 0;
}

.menu-item {
  padding: 2px 10px;
}

.menu-item:hover {
  background-color: #606266;
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

