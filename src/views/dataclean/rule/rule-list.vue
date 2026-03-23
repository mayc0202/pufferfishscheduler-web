<template>
  <div class="rule-container">
    <div class="body">
      <el-container>
        <!-- 左侧分组树，参考元数据同步样式 -->
        <el-aside width="260px" class="page-aside">
          <div class="group">
            <div class="wrap">
              <div class="flex search">
                <el-input
                  v-model="groupFilter"
                  placeholder="输入分组名称"
                  clearable
                  size="mini"
                  @input="handleGroupFilter"
                >
                  <i slot="prefix" class="el-input__icon el-icon-search" />
                </el-input>
                <div class="add">
                  <el-button
                    type="primary"
                    size="mini"
                    icon="el-icon-plus"
                    style="padding: 8px"
                    @click="openAddGroupDialog"
                  />
                </div>
              </div>
              <el-button
                type="primary"
                class="queryAll"
                size="mini"
                @click="handleViewAll"
              >
                查看全部规则
              </el-button>
              <el-tree
                :data="groupTree"
                node-key="id"
                highlight-current
                :default-expand-all="true"
                :props="{ children: 'children', label: 'name' }"
                @node-click="handleGroupClick"
              >
                <div slot-scope="{ data }" class="custom-node flex between">
                  <img :src="icons.db_group" class="group_icon">
                  <div class="flex node-label">
                    {{ data.name }}
                  </div>
                  <el-tooltip v-if="data.type === 'GROUP'" effect="light" placement="right" popper-class="custom-tooltip">
                    <i class="el-icon-more node-icon" />
                    <template slot="content">
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

        <!-- 右侧规则列表 -->
        <el-main class="rule-main">
          <div class="rule-search">
            <div class="search-left">
              <div class="label">规则名称：</div>
              <el-input
                v-model="searchForm.name"
                placeholder="请输入规则名称"
                size="small"
                clearable
                class="search-input"
              />
              <div class="label">规则类型：</div>
              <el-select
                v-model="searchForm.type"
                placeholder="请选择规则类型"
                size="small"
                clearable
                class="search-select"
              >
                <el-option
                  v-for="item in ruleTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>
            <div class="search-right">
              <el-button type="primary" icon="el-icon-search" size="small" @click="queryRuleList">
                查询
              </el-button>
              <el-button type="primary" size="small" @click="handleAddRule">
                新增规则
              </el-button>
            </div>
          </div>

          <el-table
            v-loading="tableLoading"
            :data="ruleList"
            style="width: 100%"
            max-height="574"
            element-loading-text="正在加载数据..."
            element-loading-spinner="el-icon-loading"
            element-loading-background="rgba(255, 255, 255, 0.8)"
          >
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" label="规则名称" width="260" />
            <el-table-column prop="groupName" label="规则分组" width="220" />
            <el-table-column prop="typeLabel" label="规则类型" width="140" />
            <el-table-column prop="statusLabel" label="状态" width="100" />
            <el-table-column prop="updatedTime" label="更新时间" width="200" />
            <el-table-column fixed="right" label="操作" width="200">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleViewRule(scope.row)">查看</el-button>
                <el-button type="text" size="small" @click="handleEditRule(scope.row)">编辑</el-button>
                <el-button type="text" size="small" @click="handleDeleteRule(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              :current-page="pagination.currentPage"
              :page-sizes="[10, 20, 30, 40, 50, 100]"
              :page-size="pagination.pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-main>
      </el-container>
    </div>

    <!-- 新增分组弹窗（对齐清洗流程开发） -->
    <add-group-dialog
      :title="addGroupDialog.title"
      :visible="addGroupDialog.visible"
      :width="addGroupDialog.width"
      :height="addGroupDialog.height"
      :show-bth="false"
      @onClose="cancelGroup"
      @onConfirm="submitAddGroup"
    >
      <div slot="content" class="group-dialog-content">
        <el-form ref="groupForm" :model="groupForm" :label-position="labelPosition" :rules="groupRules" label-width="100px">
          <el-form-item label="父级分组:" prop="parentId">
            <el-cascader
              v-model="groupParentId"
              :options="groupOptions"
              :props="{
                expandTrigger: 'hover',
                checkStrictly: true,
                emitPath: true,
                value: 'id',
                label: 'name',
                children: 'children'
              }"
              placeholder="请选择父级分组"
              :show-all-levels="true"
              clearable
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="分组名称:" prop="name">
            <el-input
              ref="name"
              v-model="groupForm.name"
              size="mini"
              placeholder="请输入分组名称"
              prefix-icon="el-icon-edit-outline"
              clearable
              style="width: 100%;"
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
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" @click="submitAddGroup()">添加</el-button>
            <el-button size="mini" @click="cancelGroup()">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </add-group-dialog>

    <!-- 编辑分组弹窗（对齐清洗流程开发） -->
    <edit-group-dialog
      :title="editGroupDialog.title"
      :visible="editGroupDialog.visible"
      :width="editGroupDialog.width"
      :height="editGroupDialog.height"
      :show-bth="false"
      @onClose="cancelGroup"
      @onConfirm="submitEditGroup"
    >
      <div slot="content" class="group-dialog-content">
        <el-form ref="groupForm" :model="groupForm" :label-position="labelPosition" :rules="groupRules" label-width="100px">
          <el-form-item label="父级分组:" prop="parentId">
            <el-cascader
              v-model="groupParentId"
              :options="groupOptions"
              :props="{
                expandTrigger: 'hover',
                checkStrictly: true,
                emitPath: true,
                value: 'id',
                label: 'name',
                children: 'children'
              }"
              placeholder="请选择父级分组（不能选择自己）"
              :show-all-levels="true"
              clearable
              style="width: 100%;"
            />
            <div v-if="currentEditGroupId" class="tip-text" style="color: #999; font-size: 12px; margin-top: 5px;">
              提示：不能选择自己作为父级分组
            </div>
          </el-form-item>
          <el-form-item label="分组名称:" prop="name">
            <el-input
              ref="name"
              v-model="groupForm.name"
              size="mini"
              placeholder="请输入分组名称"
              prefix-icon="el-icon-edit-outline"
              clearable
              style="width: 100%;"
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
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" @click="submitEditGroup()">编辑</el-button>
            <el-button size="mini" @click="cancelGroup()">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </edit-group-dialog>
  </div>
</template>

<script>
import icons from '@/assets/icon/icons.js'
import DynamicDialog from '@/components/common/dynamic-dialog.vue'

// 这里先使用本地测试数据，后续再对接后端接口
export default {
  name: 'DataCleanRuleList',
  components: {
    'add-group-dialog': DynamicDialog,
    'edit-group-dialog': DynamicDialog
  },
  data() {
    return {
      icons,
      groupFilter: '',
      groupTree: [
        { id: 0, name: '全部规则', type: 'GROUP', children: [] },
        { id: 1, name: '字符串处理', type: 'GROUP', children: [] },
        { id: 2, name: '数字处理', type: 'GROUP', children: [] },
        { id: 3, name: '日期处理', type: 'GROUP', children: [] }
      ],
      currentGroupId: 0,
      searchForm: {
        name: '',
        type: ''
      },
      ruleTypeOptions: [
        { label: '字符串处理', value: 'string' },
        { label: '数字处理', value: 'number' },
        { label: '日期处理', value: 'date' }
      ],
      tableLoading: false,
      ruleList: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      // 分组弹窗（对齐清洗流程开发）
      labelPosition: 'right',
      addGroupDialog: { visible: false, title: '新增分组', width: 400, height: 260 },
      editGroupDialog: { visible: false, title: '编辑分组', width: 400, height: 260 },
      currentEditGroupId: null,
      groupParentId: [],
      groupOptions: [],
      groupForm: {
        id: null,
        name: '',
        orderBy: 0
      },
      groupRules: {
        name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
        orderBy: [{ required: true, message: '请输入分组排序', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.groupOptions = this.toCascaderOptions(this.groupTree)
    this.loadMockRuleList()
  },
  methods: {
    toCascaderOptions(list) {
      return (list || [])
        .filter(g => g && g.id !== 0)
        .map(g => ({ id: g.id, name: g.name, children: [] }))
    },
    // 测试数据：模拟规则列表
    loadMockRuleList() {
      const mock = []
      for (let i = 1; i <= 23; i++) {
        mock.push({
          id: i,
          name: i === 1 ? '字符串截取示例' : `规则示例 ${i}`,
          groupId: i % 3,
          groupName: i % 3 === 1 ? '字符串处理' : i % 3 === 2 ? '数字处理' : '日期处理',
          type: i % 3 === 1 ? 'string' : i % 3 === 2 ? 'number' : 'date',
          typeLabel: i % 3 === 1 ? '字符串处理' : i % 3 === 2 ? '数字处理' : '日期处理',
          status: i % 2 === 0 ? 1 : 0,
          statusLabel: i % 2 === 0 ? '启用' : '停用',
          updatedTime: '2026-03-15 10:57:32'
        })
      }
      this.ruleList = mock
      this.pagination.total = mock.length
    },
    handleGroupFilter() {
      // 此处可接后端分组名称查询，目前仅保留输入框样式
    },
    handleGroupClick(node) {
      this.currentGroupId = node.id
      this.queryRuleList()
    },
    queryRuleList() {
      // 当前版本先基于本地 mock 做简单筛选
      const { name, type } = this.searchForm
      const groupId = this.currentGroupId
      let list = this.ruleList.slice()
      if (name) {
        list = list.filter(item => item.name.includes(name))
      }
      if (type) {
        list = list.filter(item => item.type === type)
      }
      if (groupId && groupId !== 0) {
        list = list.filter(item => item.groupId === groupId)
      }
      this.pagination.total = list.length
      // 简单分页展示
      const start = (this.pagination.currentPage - 1) * this.pagination.pageSize
      const end = start + this.pagination.pageSize
      this.ruleList = list.slice(start, end)
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
      this.queryRuleList()
    },
    handleCurrentChange(page) {
      this.pagination.currentPage = page
      this.queryRuleList()
    },
    openAddGroupDialog() {
      this.addGroupDialog.visible = true
      this.groupForm = { id: null, name: '', orderBy: 0 }
      this.groupParentId = []
      this.$nextTick(() => {
        if (this.$refs.groupForm) this.$refs.groupForm.clearValidate()
      })
    },
    editGroup(node) {
      this.editGroupDialog.visible = true
      this.currentEditGroupId = node.id
      this.groupForm = { id: node.id, name: node.name, orderBy: node.orderBy || 0 }
      this.groupParentId = []
      this.$nextTick(() => {
        if (this.$refs.groupForm) this.$refs.groupForm.clearValidate()
      })
    },
    cancelGroup() {
      this.addGroupDialog.visible = false
      this.editGroupDialog.visible = false
      if (this.$refs.groupForm) this.$refs.groupForm.resetFields()
      this.groupForm = { id: null, name: '', orderBy: 0 }
      this.groupParentId = []
      this.currentEditGroupId = null
    },
    submitAddGroup() {
      this.$refs.groupForm.validate((valid) => {
        if (!valid) return
        const newId = Date.now()
        this.groupTree.push({ id: newId, name: this.groupForm.name, type: 'GROUP', orderBy: Number(this.groupForm.orderBy), children: [] })
        this.groupOptions = this.toCascaderOptions(this.groupTree)
        this.$message.success('新增分组成功（测试）')
        this.cancelGroup()
      })
    },
    submitEditGroup() {
      this.$refs.groupForm.validate((valid) => {
        if (!valid) return
        const node = this.groupTree.find(g => g.id === this.groupForm.id)
        if (node) {
          node.name = this.groupForm.name
          node.orderBy = Number(this.groupForm.orderBy)
        }
        this.groupOptions = this.toCascaderOptions(this.groupTree)
        this.$message.success('编辑分组成功（测试）')
        this.cancelGroup()
      })
    },
    handleViewAll() {
      this.currentGroupId = 0
      this.queryRuleList()
    },
    deleteGroup(node) {
      if (!node || node.id == null || node.id === 0) {
        this.$message.warning('该分组不可删除')
        return
      }
      this.$confirm('确定要删除该分组吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.groupTree = this.groupTree.filter(g => g.id !== node.id)
          this.groupOptions = this.toCascaderOptions(this.groupTree)
          if (this.currentGroupId === node.id) {
            this.currentGroupId = 0
            this.queryRuleList()
          }
          this.$message.success('删除分组成功（测试）')
        })
        .catch(() => {})
    },
    handleAddRule() {
      // 先跳转到规则编辑页面（后续实现具体表单）
      this.$router.push({ path: '/basic-config/dataclean/edit' })
    },
    handleViewRule(row) {
      this.$router.push({
        path: '/basic-config/dataclean/edit',
        query: { id: row.id, readonly: 'true' }
      })
    },
    handleEditRule(row) {
      this.$router.push({
        path: '/basic-config/dataclean/edit',
        query: { id: row.id }
      })
    },
    handleDeleteRule() {
      this.$confirm('确定要删除该规则吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('删除成功（测试）')
      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.rule-container {
  height: 100%;
  background-color: #f5f7fa;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  height: calc(100vh - 60px);
  box-sizing: border-box;
}

/* 确保内部容器高度正确（对齐数据源接入页） */
.body >>> .el-container {
  height: 100%;
  min-height: 100%;
}

.page-aside {
  height: 90.5vh;
  margin: 10px 0 10px 10px;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  user-select: none;
  min-width: 200px;
  padding: 10px;
}

.group {
  border-radius: 4px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.group .wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.group .search {
  margin-bottom: 10px;
  flex-shrink: 0;
  align-items: center;
}

.queryAll {
  width: 100%;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.custom-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 8px;
  font-size: 14px;
}

.node-label {
  display: flex;
  align-items: center;
  flex: 1;
  font-weight: 400;

  span {
    margin-left: 4px;
  }
}

.node-label:hover {
  color: #409eff;
}

.group_icon {
  width: 18px;
  height: 18px;
  margin-right: 6px;
}

.rule-main {
  height: 90.5vh;
  margin: 10px 10px 10px 10px;
  padding: 10px 20px 20px 20px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.search .add {
  margin-left: 10px;
}

::v-deep .el-tree {
  height: 100% !important;
  overflow-y: auto;
  flex: 1 !important;
  min-height: 0 !important;
  display: flex;
  flex-direction: column;
}

/* 弹窗里 cascader / input 等宽（对齐清洗流程开发的分组弹窗） */
.group-dialog-content {
  width: 100%;
}

.group-dialog-content ::v-deep .el-cascader,
.group-dialog-content ::v-deep .el-input {
  width: 100% !important;
}

.group-dialog-content ::v-deep .el-input__inner {
  width: 100%;
}

.node-icon {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
  transition: color 0.3s;
  transform: rotate(90deg);
}

.node-icon:hover {
  color: #409eff;
}

/* tooltip 菜单样式（对齐数据源接入页） */
.custom-tooltip {
  border: none !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.custom-tooltip .popper__arrow {
  border: none !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.custom-tooltip .custom-menu {
  user-select: none;
  padding: 0 !important;
}

.custom-tooltip .menu-item {
  color: #606266;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.custom-tooltip .menu-item:hover {
  background-color: #fff;
  color: #409eff;
}

.rule-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .search-left {
    display: flex;
    align-items: center;

    .label {
      margin: 0 8px 0 0;
      white-space: nowrap;
      font-size: 13px;
      color: #606266;
    }

    .search-input {
      width: 220px;
      margin-right: 16px;
    }

    .search-select {
      width: 200px;
    }
  }

  .search-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.pagination-wrapper {
  margin-top: 15px;
  text-align: right;
}

.group-dialog ::v-deep .el-dialog__body {
  padding: 16px 20px 10px;
}
</style>

