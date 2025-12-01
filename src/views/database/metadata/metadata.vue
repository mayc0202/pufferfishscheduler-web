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
          <el-main v-loading="loading">
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
                          :key="item.code"
                          :label="item.code"
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
                      <el-select v-model="queryData.status" clearable placeholder="请选择同步任务状态">
                        <el-option
                          v-for="item in taskStatusOption"
                          :key="item.code"
                          :label="item.code"
                          :value="item.value"
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
                    prop="executeTimeTxt"
                    label="最近执行时间"
                    width="220"
                  />
                  <el-table-column prop="statusTxt" label="执行状态" width="100" />
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
                            {{ scope.row.enable ? '禁用' : '启用' }}
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
  deleted,
  toggleEnableStatus
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
      // 展示定时任务组件
      scheduleDialogVisible: false,
      isEditMode: false, // 是否为编辑模式
      editingTaskId: null // 当前编辑的任务ID
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
  },

  methods: {

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

    handleChange(val) {
      console.log(`分组 ${val}`)
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
    async selectTaskList() {
      try {
        this.loading = true // 加载中

        const res = await list(this.queryData)

        // 成功处理
        const result = res.data
        this.pageNo = result.current
        this.pageSize = result.size
        this.total = result.total
        this.taskList = result.records
      } catch (error) {
        this.$message.error('获取元数据同步任务列表失败!')
        this.loading = false // 加载完成
        console.error(error)
      } finally {
        this.loading = false // 加载完成
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
        enable: row.enable ? '0' : '1', // 转换enable状态
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
  height: 92.5vh;
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
</style>

