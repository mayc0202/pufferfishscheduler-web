input<template>
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
                  <el-button type="primary" size="mini" @click="openDatabaseDialog()">新增同步任务</el-button>
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
                    prop="createdTimeTxt"
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
      </el-container>
    </div>
    <detail-dialog
      :title="detailDialog.title"
      :visible="detailDialog.visible"
      :width="detailDialog.width"
      :height="detailDialog.height"
      :show-bth="false"
      @onClose="handleDetailClose"
    >
      <div slot="content">
        <el-descriptions title="垂直带边框列表" direction="vertical" :column="4" border>
          <el-descriptions-item label="用户名">kooriookami</el-descriptions-item>
          <el-descriptions-item label="手机号">18100000000</el-descriptions-item>
          <el-descriptions-item label="居住地" :span="2">苏州市</el-descriptions-item>
          <el-descriptions-item label="备注">
            <el-tag size="mini">学校</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="联系地址">江苏省苏州市吴中区吴中大道 1188 号</el-descriptions-item>
        </el-descriptions>
      </div>
    </detail-dialog>
  </div>
</template>

<script>
import icons from '@/assets/icon/icons.js'

import DynamicDialog from '@/components/common/dynamic-dialog.vue'

import {
  tree
} from '@/api/database/database/dbGroup'

import {
  getDbList
} from '@/api/database/database/database'

export default {
  name: 'PagePermission',
  components: {
    'detail-dialog': DynamicDialog
  },
  data() {
    return {
      icons,
      groupForm: {
        id: null,
        name: '',
        orderBy: 0
      },
      detailDialog: {
        title: '数据源详情',
        visible: false,
        width: 640,
        height: 460
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
      componentType: 0
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
     * 获取分组数
     */
    queryAll() {
      tree('').then((res) => {
        this.group = res.data.result
      })
    },

    /**
     * 获取数据源集合
     */
    selectDbList() {
      getDbList(this.queryData).then((res) => {
        var result = res.data.result
        this.pageNo = result.current
        this.pageSize = result.size
        this.total = result.total
        this.dbList = result.records
      })
    },

    // 查看数据源信息
    handleDetail(dbId) {
      console.log(dbId, '数据源id')
      this.detailDialog.visible = true
    },

    handleDetailClose() {
      this.detailDialog.visible = false
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
  background-color: rgb(255, 255, 255);
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

/* 弹窗内的 el-aside */
::v-deep .dialog-aside {
  height: auto;
  min-height: 390px;
  overflow-y: auto;
}

// 表格区域样式调整
::v-deep .el-main {
  flex: 1;
  padding: 0 !important;
  // margin-left: 10px;
  overflow-y: auto; // 改为垂直滚动
  display: flex;
  flex-direction: column;
  .list {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 10px 20px 20px 20px;
    background: #fff;
    box-shadow: $shadow;
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
  margin: 10px 0 0 0;
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

.item {
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
}

.item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item .item-name {
  margin-left: 10px;
}

.database-icon {
  margin-right: 8px;
  margin-top: 8px;
}

.database-block {
  width: 100%;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #eee;
  border-radius: 6px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
  transition: box-shadow 0.3s;
}

.database-block:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.database-block img {
  max-width: 80px;
  max-height: 60px;
  object-fit: contain;
  user-select: none;
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

