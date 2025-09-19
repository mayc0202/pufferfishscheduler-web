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
                  size="mini"
                  placeholder="输入分组名称"
                  clearable
                  @input="queryGroupsByName()"
                >
                  <i slot="prefix" class="el-input__icon el-icon-search" />
                </el-input>
                <div class="add">
                  <el-button
                    type="primary"
                    size="mini"
                    icon="el-icon-plus"
                    style="padding: 8px"
                    @click="openGroupDialog()"
                  />
                </div>
              </div>
              <el-button type="primary" class="queryAll" size="mini" @click="queryAll()">查看全部数据</el-button>
              <el-tree :data="group">
                <div slot-scope="{ data }" class="custom-node flex between">
                  <div class="flex node-label">
                    <img v-if="data.type === 'GROUP'" :src="icons.db_group" class="group_icon">
                    <img v-else :src="data.icon" class="group_icon">
                    {{ data.name }}
                  </div>
                  <el-tooltip v-if="data.type === 'GROUP'" effect="light" placement="right" popper-class="custom-tooltip">
                    <i class="el-icon-more node-icon" />
                    <template #content>
                      <div class="custom-menu">
                        <div class="menu-item" @click="editGroup(data)">编辑分组</div>
                        <div class="menu-item" @click="deleteGroup(data)">删除分组</div>
                      </div>
                    </template>
                  </el-tooltip>
                </div>
              </el-tree>
            </div>
          </div>
        </el-aside>
        <el-container v-if="componentType == null">
          <el-main>
            <div class="list">
              <div class="flex between search">
                <div class="search_input">
                  <input
                    v-model="dbName"
                    placeholder="请输入数据源名称"
                    class="input"
                  >
                </div>
                <div>
                  <el-button type="primary" icon="el-icon-search" size="mini" @click="searchDbByName()">查询</el-button>
                  <el-button type="primary" size="mini" @click="openDatabaseDialog()">数据源接入</el-button>
                </div>
              </div>
              <template>
                <el-table
                  :data="dbList"
                  style="width: 100%"
                  max-height="640"
                >
                  <el-table-column
                    fixed
                    type="index"
                    label="#"
                  />
                  <el-table-column prop="name" label="数据源名称" width="240" />
                  <el-table-column prop="groupName" label="分组" width="220" />
                  <el-table-column prop="labelName" label="数据源分层" width="220" />
                  <el-table-column
                    prop="type"
                    label="数据库类型"
                    width="240"
                  />
                  <el-table-column
                    prop="createdTime"
                    label="创建日期"
                    width="220"
                  />
                  <el-table-column fixed="right" label="操作" width="140">
                    <template slot-scope="scope">
                      <div class="wrap">
                        <div>
                          <el-button
                            type="text"
                            size="mini"
                            @click.native.prevent="
                              handleDetail(scope.row.id)
                            "
                          >
                            查看
                          </el-button>
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
        <mysql-component
          v-if="componentType == 'MySQL'"
          ref="mysqlComponent"
          @save-to-list="handleSaveToList"
          @back-to-list="handleBackToList"
        />
        <doris-component
          v-if="componentType == 'Doris'"
          ref="dorisComponent"
          @save-to-list="handleSaveToList"
          @back-to-list="handleBackToList"
        />

        <ftp-component
          v-if="componentType == 'FTP'"
          ref="ftpComponent"
          @save-to-list="handleSaveToList"
          @back-to-list="handleBackToList"
        />
      </el-container>
    </div>

    <database-select-dialog
      :visible="databaseDialog.visible"
      :title="databaseDialog.title"
      :width="databaseDialog.width"
      :database-type="databaseType"
      :database-list="cacheDatabaseList"
      :loading="loading"
      @select-type="handleSelectType"
      @select-database="handleSelectDatabase"
      @close="handleDialogClose"
      @confirm="handleDialogConfirm"
    />

    <add-group-dialog
      :title="addGroupDialog.title"
      :visible="addGroupDialog.visible"
      :width="addGroupDialog.width"
      :height="addGroupDialog.height"
      :show-bth="false"
      @onClose="cancelGroup"
      @onConfirm="submitAddGroup"
    >
      <div slot="content">
        <el-form ref="groupForm" :model="groupForm" :label-position="labelPosition" :rules="groupRules" label-width="80px">
          <el-form-item label="分组名称:" prop="name">
            <el-input
              ref="name"
              v-model="groupForm.name"
              size="mini"
              placeholder="请输入分组名称"
              prefix-icon="el-icon-edit-outline"
              clearable
            />
          </el-form-item>
          <el-form-item label="分组排序:" prop="orderBy">
            <el-input
              ref="orderBy"
              v-model.number="groupForm.orderBy"
              size="mini"
              type="number"
              placeholder="请输入分组排序"
              prefix-icon="el-icon-sort"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" @click="submitAddGroup()">添加</el-button>
            <el-button size="mini" @click="cancelGroup()">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </add-group-dialog>
    <edit-group-dialog
      :title="editGroupDialog.title"
      :visible="editGroupDialog.visible"
      :width="editGroupDialog.width"
      :height="editGroupDialog.height"
      :show-bth="false"
      @onClose="cancelGroup"
      @onConfirm="submitEditGroup"
    >
      <div slot="content">
        <el-form ref="groupForm" :model="groupForm" :label-position="labelPosition" :rules="groupRules" label-width="80px">
          <el-form-item label="分组名称:" prop="name">
            <el-input
              ref="name"
              v-model="groupForm.name"
              size="mini"
              placeholder="请输入分组名称"
              prefix-icon="el-icon-edit-outline"
              clearable
            />
          </el-form-item>
          <el-form-item label="分组排序:" prop="orderBy">
            <el-input
              ref="orderBy"
              v-model.number="groupForm.orderBy"
              size="mini"
              type="number"
              placeholder="请输入分组排序"
              prefix-icon="el-icon-sort"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" @click="submitEditGroup()">编辑</el-button>
            <el-button size="mini" @click="cancelGroup()">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </edit-group-dialog>
    <dynamic-detail-dialog
      title="数据源详情"
      :visible="detailVisible"
      :width="560"
      :data="databaseInfo"
      :exclude-fields="excludeFields"
      :label-map="customLabelMap"
      :border="true"
      @onClose="detailVisible = false"
    />
  </div>
</template>

<script>
import icons from '@/assets/icon/icons.js'

import DynamicDialog from '@/components/common/dynamic-dialog.vue'
import DetailDialog from '@/components/common/dynamic-detail.vue'
import DatabaseSelectDialog from './component/database-select.vue'
import MysqlComponent from './component/Mysql/index'
import DorisComponent from './component/Doris/index'
import FTPComponent from './component/FTP/index'

import {
  tree,
  addGroup,
  updateGroup
} from '@/api/database/database/dbGroup'

import {
  getDbCategoryList,
  getDbBasicList
} from '@/api/database/database/dbBasic'

import {
  getDbList,
  deleteDb,
  detailDb
} from '@/api/database/database/database'

export default {
  name: 'PagePermission',
  components: {
    'add-group-dialog': DynamicDialog,
    'edit-group-dialog': DynamicDialog,
    'dynamic-detail-dialog': DetailDialog,
    'database-select-dialog': DatabaseSelectDialog,

    'mysql-component': MysqlComponent,
    'doris-component': DorisComponent,
    'ftp-component': FTPComponent
  },
  data() {
    return {
      icons,
      // 分组弹窗
      labelPosition: 'left',
      addGroupDialog: {
        title: '新增分组',
        visible: false,
        width: 360,
        height: 160
      },
      editGroupDialog: {
        title: '编辑分组',
        visible: false,
        width: 360,
        height: 160
      },
      groupForm: {
        id: null,
        name: '',
        orderBy: 0
      },
      groupRules: {
        name: [
          { required: true, trigger: 'blur', message: '请输入分组名称!' }
        ],
        orderBy: [
          { required: true, message: '请输入分组排序!', trigger: 'blur' }
        ]
      },
      detailDialog: {
        title: '数据源详情',
        visible: false,
        width: 640,
        height: 460
      },
      // 新增数据源弹框属性
      databaseDialog: {
        title: '数据源接入',
        visible: false,
        width: 680,
        height: 440
      },
      searchGroup: '', // 查询分组
      group: [],
      queryData: {
        groupId: '',
        dbId: '',
        name: '',
        pageNo: '',
        pageSize: ''
      },
      pageNo: 0,
      pageSize: 0,
      total: 0,
      dbName: '', // 数据源名称
      databaseType: [], // 数据库类型
      cacheDatabaseList: [], // 缓存所有的数据库基础信息
      databaseList: [], // 数据库列表
      dbList: [], // 数据源列表
      loading: false,
      componentType: 0,

      detailVisible: false,
      databaseInfo: {},
      // 自定义标签映射
      customLabelMap: {
        name: '数据源名称',
        groupName: '所属分组',
        labelName: '数据源分层',
        category: '数据库类别',
        type: '数据库类型',
        dbHost: '连接地址',
        dbPort: '端口号',
        dbSchema: '模式/Schema',
        dbName: '数据库名称',
        createdTime: '创建时间',
        remark: '备注说明'
      },
      // 排除字段
      excludeFields: [
        'id',
        'groupId',
        'label',
        'username',
        'password',
        'beAddress',
        'feAddress',
        'properties',
        'extConfig'
      ]
    }
  },

  created() {
    this.componentType = null
    this.pageNo = 1
    this.pageSize = 10
    this.databaseList = []
    this.cacheDatabaseList = []
  },

  mounted() {
    this.queryAll()
    this.selectDbList()
  },

  methods: {

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
      this.selectDbList()
    },

    /**
     * 查询第几页
     * @param val
     */
    handleCurrentChange(val) {
      this.pageNo = val
      this.queryData.pageSize = this.pageSize
      this.queryData.pageNo = this.pageNo
      this.selectDbList()
    },

    /**
     * 根据名称查询数据源列表
     */
    searchDbByName() {
      this.queryData.name = this.dbName
      this.queryData.pageNo = this.pageNo
      this.queryData.pageSize = this.pageSize
      this.selectDbList()
    },

    /**
     * 打开分组弹窗
     */
    openGroupDialog() {
      this.groupForm = {}
      this.addGroupDialog.visible = true
    },

    /**
     * 提交分组
     */
    submitAddGroup() {
      this.$refs.groupForm.validate((valid) => {
        if (valid) {
          // 创建副本避免引用问题
          const formData = {
            ...this.groupForm,
            orderBy: Number(this.groupForm.orderBy)
          }
          addGroup(formData).then((res) => {
            var data = res.data
            if (data.code === '999999') {
              this.$message.warning(data.message)
            } else {
              this.$message.success(data.message)
            }
          })

          // 执行一次查询操作
          this.queryAll()

          this.groupForm.name = ''
          this.groupForm.orderBy = 0
          this.addGroupDialog.visible = false
        } else {
          this.$message({
            type: 'warning',
            message: '请校验分组表单数据!'
          })
          return false
        }
      })
    },

    /**
     * 依据分组名称查询
     */
    queryGroupsByName() {
      tree(this.searchGroup).then((res) => {
        this.group = res.data.result
      })
    },

    /**
     * 获取分组数
     */
    queryAll() {
      tree('').then((res) => {
        this.group = res.data.result
        this.group.forEach(g => {
          g.icon = ''
        })
      })
    },

    /**
     * 编辑分组
     * @param group
     */
    editGroup(group) {
      this.groupForm = group
      this.editGroupDialog.visible = true
    },

    /**
     * 提交编辑分组
     */
    submitEditGroup() {
      this.$refs.groupForm.validate((valid) => {
        if (valid) {
          // 创建副本避免引用问题
          const formData = {
            ...this.groupForm,
            orderBy: Number(this.groupForm.orderBy)
          }
          updateGroup(formData).then((res) => {
            var data = res.data
            if (data.code === '999999') {
              this.$message.warning(data.message)
            }
            this.queryAll()
            this.selectDbList()
          })

          this.groupForm.id = null
          this.groupForm.name = ''
          this.groupForm.orderBy = 0
          this.editGroupDialog.visible = false
        } else {
          this.$message({
            type: 'warning',
            message: '请校验分组表单数据!'
          })
          return false
        }
      })
    },

    /**
     * 删除分组
     * @param group
     */
    deleteGroup(group) {
      this.$confirm('此操作将永久删除该分组, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message({
          type: 'success',
          message: '删除成功!'
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },

    /**
     * 取消分组
     */
    cancelGroup() {
      this.$refs.groupForm.resetFields()
      this.addGroupDialog.visible = false
      this.editGroupDialog.visible = false
    },

    /** ********************************** 选择数据源弹窗 开始 ******************************************* */
    /**
     * 打开新增数据源接入弹窗
     */
    async openDatabaseDialog() {
      this.databaseDialog.visible = true

      try {
        // 先获取数据库类型列表
        await this.getDbCategoryList()
        // 等待数据库基础信息加载完成
        await new Promise((resolve) => {
          this.$nextTick(() => {
            if (this.databaseType.length > 0 && this.cacheDatabaseList.length > 0) {
              resolve()
            } else {
              // 设置超时，避免无限等待
              setTimeout(resolve, 1000)
            }
          })
        })
      } catch (error) {
        console.error('打开数据源弹窗失败:', error)
        this.databaseDialog.visible = false
      } finally {
        this.loading = false
      }
    },

    /**
     * 配置弹窗确认
     */
    handleDialogConfirm() {
      this.databaseDialog.visible = false
      this.databaseList = []
      this.cacheDatabaseList = []
    },

    /**
     * 关闭数据源选择弹窗
     */
    handleDialogClose() {
      this.databaseDialog.visible = false
      this.databaseList = []
      this.cacheDatabaseList = []
    },

    /**
     * 选择数据源类型
     * @param item
     */
    handleSelectType(item) {
      this.databaseList = this.cacheDatabaseList.filter(db => db.categoryId === item.id)
    },

    /**
     * 选择数据源
     * @param item
     */
    handleSelectDatabase(item) {
      this.componentType = item.name
      this.databaseDialog.visible = false
      this.databaseList = []
      this.cacheDatabaseList = []
    },

    /** ********************************** 选择数据源弹窗 结束 ******************************************* */

    /**
     * 获取数据源集合
     */
    selectDbList() {
      getDbList(this.queryData).then((res) => {
        var data = res.data
        if (data.code === '999999') {
          this.$message.warning(data.message)
          return
        }
        var result = data.result
        this.pageNo = result.current
        this.pageSize = result.size
        this.total = result.total
        this.dbList = result.records
      }).catch(err => {
        this.$message.error(err.message)
      })
    },

    /**
     * 编辑数据源
     */
    handleEdit(data) {
      this.componentType = data.type // 切换到组件视图
      this.databaseDialog.visible = false
      this.databaseList = []
      this.cacheDatabaseList = []

      this.$nextTick(() => {
        switch (data.type) {
          case 'MySQL':
            // 通过ref调用子组件方法加载数据
            this.$refs.mysqlComponent.loadDetail(data.id)
            break
          case 'Doris':
            this.$refs.dorisComponent.loadDetail(data.id)
            break
          case 'FTP':
            this.$refs.ftpComponent.loadDetail(data.id)
            break
          default:
            this.$message.error('暂不支持该数据源类型')
            break
        }
      })
    },

    /**
     * 删除数据源
     */
    async handleDelete(dbId) {
      this.loading = true
      try {
        await deleteDb(dbId).then((res) => {
          const data = res.data
          if (data.code === '999999') {
            this.$message.warning(data.message)
          } else {
            this.$message.success(data.result)
            this.selectDbList()
          }
        })
      } finally {
        this.loading = false
      }
    },

    // 查看数据源信息
    handleDetail(dbId) {
      this.detailVisible = true
      detailDb(dbId).then((res) => {
        var data = res.data
        if (data.code === '999999') {
          this.$message.warning(data.message)
          return
        }
        this.databaseInfo = data.result
        console.log(this.databaseInfo)
      })
    },

    handleDetailClose() {
      this.detailVisible = false
    },

    /**
     * 获取数据库类型集合
     */
    getDbCategoryList() {
      this.loading = true
      try {
        getDbCategoryList().then((res) => {
          this.databaseType = res.data.result
          this.databaseType.forEach(d => {
            if (d.imgConfig != null && d.imgConfig !== '') {
              var config = JSON.parse(d.imgConfig)
              d.width = config.width
              d.height = config.height
            }
          })
          this.getDbBasicList()
        })
      } finally {
        this.loading = false
      }
    },

    /**
     * 获取数据库基础信息集合
     */
    getDbBasicList() {
      getDbBasicList().then((res) => {
        this.cacheDatabaseList = res.data.result
        this.cacheDatabaseList.forEach(d => {
          if (d.imgConfig != null && d.imgConfig !== '') {
            var config = JSON.parse(d.imgConfig)
            d.width = config.width
            d.height = config.height
          }
        })
        this.databaseList = this.cacheDatabaseList.filter(db => db.categoryId === 1)
      })
    },

    /**
     * 添加MySQL组件保存处理方法
     */
    async handleSaveToList() {
      this.pageNo = 1 // 返回第一页
      this.componentType = null // 切换回列表视图
      this.loading = true
      try {
        await this.queryAll().catch(err => {
          this.$message.error('分组刷新失败: ' + err.message)
        })
      } finally {
        this.selectDbList()
        this.loading = true
      }
    },

    /**
     * 添加MySQL组件返回处理方法
     */
    handleBackToList() {
      this.componentType = null // 切换回列表视图
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

/* 全局样式或使用深度选择器 */
.custom-detail-dialog {
  .custom-descriptions {
    margin: 20px;

    .el-descriptions__title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .el-descriptions-item__label {
      font-weight: bold;
      background-color: #f5f7fa;
    }

    .el-descriptions-item__content {
      padding: 12px 16px;
    }
  }
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
::v-deep .el-container {
  flex: 1;
  overflow: hidden;
  background-color: #f8f8fc;
}

// 主内容区域样式调整
::v-deep .el-container > .el-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

::v-deep .el-aside {
  background-color: #fff;
  padding: 10px;
  color: #696969;
  box-shadow: $shadow;
  margin-bottom: 0;
  font-size: 16px;
  font-weight: 600;
  user-select: none;
  min-width: 200px;
}

// 侧边栏样式调整
::v-deep .page-aside {
  height: 100%;
  overflow-y: auto; // 允许侧边栏单独滚动
  background-color: rgb(255, 255, 255);
  box-shadow: $shadow;
}

// 表格区域样式调整
::v-deep .el-main {
  flex: 1;
  overflow-y: auto; // 改为垂直滚动
  display: flex;
  flex-direction: column;
  .list {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;
    // box-shadow: $shadow;
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
  box-shadow: $shadow;
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
  border-radius: 4px;
  -webkit-transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

::v-deep .el-pagination__sizes {
  margin-top: -5px;
}

::v-deep .el-form-item__label {
  font-size: 13px;
}

.body {
  flex: 1; // 占据剩余空间
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden; // 隐藏溢出内容
}

/* 确保内部容器高度正确 */
.body >>> .el-container {
  height: 100%;
}

.body .group {
  background: #fff fixed;
  box-shadow: 0 2px px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  min-width: 220px; /* 设置最小输入宽度 */
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
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  height: 100%;
  min-width: 504px;
}

.body .list .search {
  padding: 10px;
  margin-bottom: 20px;
}

.body .list .search .search_input {
  border-bottom: 1px rgb(167, 167, 167) inset;
  width: 220px;
  min-width: 220px;
  height: 30px;
  margin-right: 10px;
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
</style>

