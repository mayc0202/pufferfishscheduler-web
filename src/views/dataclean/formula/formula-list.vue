<template>
  <div class="formula-container">
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
                    class="group-add-btn"
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
                查看全部公式
              </el-button>
              <div class="tree-scroll">
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
          </div>
        </el-aside>

        <!-- 右侧公式列表（结构与清洗任务页一致，避免侧栏底部留白） -->
        <el-main>
          <div class="list">
            <div class="formula-search">
              <div class="search-left">
                <div class="label">公式名称：</div>
                <el-input
                  v-model="searchForm.name"
                  placeholder="请输入公式名称"
                  size="small"
                  clearable
                  class="search-input"
                />
              </div>
              <div class="search-right">
                <el-button type="primary" icon="el-icon-search" size="small" @click="queryFormulaList">
                  查询
                </el-button>
                <el-button type="primary" size="small" @click="handleAddFormula">
                  新增公式
                </el-button>
              </div>
            </div>

            <el-table
              v-loading="tableLoading"
              :data="formulaList"
              style="width: 100%"
              height="100%"
              element-loading-text="正在加载数据..."
              element-loading-spinner="el-icon-loading"
              element-loading-background="rgba(255, 255, 255, 0.8)"
            >
              <el-table-column type="index" label="#" width="60" />
              <el-table-column prop="name" label="公式名称" min-width="120" show-overflow-tooltip />
              <el-table-column prop="groupName" label="公式分组" min-width="160" show-overflow-tooltip />
              <el-table-column prop="description" label="公式描述" min-width="200" show-overflow-tooltip />
              <el-table-column prop="statusLabel" label="状态" min-width="80" />
              <el-table-column prop="updatedTime" label="更新时间" min-width="160" show-overflow-tooltip />
              <el-table-column fixed="right" label="操作" width="180" min-width="180" class-name="op-column">
                <template slot-scope="scope">
                  <div class="op-actions">
                    <el-button type="text" size="small" @click="handleViewFormula(scope.row)">查看</el-button>
                    <el-button v-if="!isGeneralFormula(scope.row)" type="text" size="small" @click="handleEditFormula(scope.row)">编辑</el-button>
                    <el-button type="text" size="small" @click="handleToggleFormulaStatus(scope.row)">{{ scope.row.enabledBool ? '禁用' : '启用' }}</el-button>
                    <el-button v-if="!isGeneralFormula(scope.row)" type="text" size="small" @click="handleDeleteFormula(scope.row)">删除</el-button>
                  </div>
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
import { tree, addGroup, updateGroup, deleteGroup } from '@/api/collect/formula/formulaGroup'
import { list as formulaListApi, deleteFormula as deleteFormulaApi, releaseFormula as releaseFormulaApi } from '@/api/collect/formula/formula'

export default {
  name: 'DataCleanFormulaList',
  components: {
    'add-group-dialog': DynamicDialog,
    'edit-group-dialog': DynamicDialog
  },
  data() {
    return {
      icons,
      groupFilter: '',
      groupTree: [],
      currentGroupId: 0,
      searchForm: {
        name: ''
      },
      tableLoading: false,
      formulaList: [],
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
        parentId: null,
        name: '',
        orderBy: 0
      },
      groupRules: {
        name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
        orderBy: [{ required: true, message: '请输入分组排序', trigger: 'blur' }]
      }
    }
  },
  computed: {
    isAdmin() {
      const roles = (this.$store && this.$store.getters && this.$store.getters.roles) || []
      return Array.isArray(roles) && roles.some(r => String(r).toLowerCase() === 'admin')
    }
  },
  created() {
    this.queryGroupList()
    this.queryFormulaList()
  },
  methods: {

    formatToCascader(data, disabledIds = []) {
      return (data || [])
        .filter(item => item && item.type === 'GROUP')
        .map(item => {
          const formattedItem = {
            id: item.id,
            name: item.name,
            disabled: disabledIds.includes(item.id)
          }
          if (Array.isArray(item.children) && item.children.length > 0) {
            const children = this.formatToCascader(item.children, disabledIds)
            if (children.length) {
              formattedItem.children = children
            }
          }
          return formattedItem
        })
    },
    findParentPath(options, targetId) {
      for (const option of options || []) {
        if (option.id === targetId) {
          return [option.id]
        }
        if (Array.isArray(option.children) && option.children.length > 0) {
          const path = this.findParentPath(option.children, targetId)
          if (path.length > 0) {
            return [option.id, ...path]
          }
        }
      }
      return []
    },
    findNodeById(nodes, id) {
      for (const node of nodes || []) {
        if (!node) continue
        if (node.id === id) return node
        if (Array.isArray(node.children) && node.children.length > 0) {
          const found = this.findNodeById(node.children, id)
          if (found) return found
        }
      }
      return null
    },

    isDescendant(parentNode, targetId) {
      if (!parentNode || !Array.isArray(parentNode.children)) return false
      for (const child of parentNode.children) {
        if (!child) continue
        if (child.id === targetId) return true
        if (this.isDescendant(child, targetId)) return true
      }
      return false
    },
    validateParentRelation(parentId, currentId) {
      if (!parentId || !currentId) return true
      if (parentId === currentId) return false
      const currentNode = this.findNodeById(this.groupTree, currentId)
      return !this.isDescendant(currentNode, parentId)
    },
    queryGroupList(name = '') {
      tree(name)
        .then((res) => {
          this.groupTree = (res && res.data) || []
          const disabledIds = this.currentEditGroupId ? [this.currentEditGroupId] : []
          this.groupOptions = this.formatToCascader(this.groupTree, disabledIds)
        })
        .catch(() => {
          this.groupTree = []
          this.groupOptions = []
        })
    },
    handleGroupFilter() {
      this.queryGroupList(this.groupFilter || '')
    },
    handleGroupClick(node) {
      if (!node || node.type !== 'GROUP') return
      this.currentGroupId = node.id
      this.pagination.currentPage = 1
      this.queryFormulaList()
    },
    /** 列表行是否启用：优先 enabled，其次兼容 status */
    parseListItemEnabled(item) {
      if (!item || typeof item !== 'object') return true
      if (item.enabled != null) {
        if (typeof item.enabled === 'boolean') return item.enabled
        const e = String(item.enabled)
        return e === '1' || e.toLowerCase() === 'true'
      }
      if (item.status != null) {
        const s = String(item.status)
        return s === '1' || s.toLowerCase() === 'true'
      }
      return true
    },
    async queryFormulaList() {
      this.tableLoading = true
      try {
        const groupId = this.currentGroupId === 0 ? undefined : this.currentGroupId
        const res = await formulaListApi(
          groupId,
          this.searchForm.name || undefined,
          this.pagination.currentPage,
          this.pagination.pageSize
        )
        const data = (res && res.data) || {}
        const records = Array.isArray(data.records) ? data.records : []
        this.formulaList = records.map((item) => {
          const enabledBool = this.parseListItemEnabled(item)
          const statusLabel = item.statusTxt || item.statusLabel || (enabledBool ? '启用' : '禁用')
          const updatedTime = item.updatedTimeTxt || item.createdTimeTxt || item.updatedTime || item.updateTime || '-'
          return {
            ...item,
            id: item.id || item.formulaId,
            name: item.name || item.formulaName || '',
            groupName: item.groupName || '-',
            returnType: item.returnType || '-',
            description: item.description || '-',
            enabledBool,
            statusLabel,
            updatedTime
          }
        })
        this.pagination.total = data.total != null ? data.total : this.formulaList.length
        this.pagination.currentPage = data.current != null ? data.current : this.pagination.currentPage
        this.pagination.pageSize = data.size != null ? data.size : this.pagination.pageSize
      } catch (e) {
        this.formulaList = []
        this.pagination.total = 0
        this.$message.error('获取公式列表失败')
      } finally {
        this.tableLoading = false
      }
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
      this.queryFormulaList()
    },
    handleCurrentChange(page) {
      this.pagination.currentPage = page
      this.queryFormulaList()
    },
    openAddGroupDialog() {
      this.currentEditGroupId = null
      this.queryGroupList(this.groupFilter || '')
      this.addGroupDialog.visible = true
      this.groupForm = { id: null, parentId: null, name: '', orderBy: 0 }
      this.groupParentId = []
      this.$nextTick(() => {
        if (this.$refs.groupForm) this.$refs.groupForm.clearValidate()
      })
    },
    editGroup(node) {
      if (this.regularGroupId != null && Number(node.id) === this.regularGroupId) {
        this.$message.warning('固定分类不允许编辑')
        return
      }
      this.editGroupDialog.visible = true
      this.currentEditGroupId = node.id
      this.groupForm = { id: node.id, parentId: node.parentId || null, name: node.name, orderBy: node.orderBy || 0 }
      this.queryGroupList(this.groupFilter || '')
      this.groupParentId = node.parentId ? this.findParentPath(this.groupOptions, node.parentId) : []
      this.$nextTick(() => {
        if (this.$refs.groupForm) this.$refs.groupForm.clearValidate()
      })
    },
    cancelGroup() {
      this.addGroupDialog.visible = false
      this.editGroupDialog.visible = false
      if (this.$refs.groupForm) this.$refs.groupForm.resetFields()
      this.groupForm = { id: null, parentId: null, name: '', orderBy: 0 }
      this.groupParentId = []
      this.currentEditGroupId = null
      this.queryGroupList(this.groupFilter || '')
    },
    submitAddGroup() {
      this.$refs.groupForm.validate((valid) => {
        if (!valid) return
        const parentId = this.groupParentId.length ? this.groupParentId[this.groupParentId.length - 1] : null

        const formData = {
          groupName: this.groupForm.name,
          parentId,
          orderBy: Number(this.groupForm.orderBy)
        }
        addGroup(formData).then((res) => {
          this.$message.success((res && res.data) || '新增分组成功')
          this.queryGroupList(this.groupFilter || '')
          this.cancelGroup()
        })
      })
    },
    submitEditGroup() {
      this.$refs.groupForm.validate((valid) => {
        if (!valid) return
        const parentId = this.groupParentId.length ? this.groupParentId[this.groupParentId.length - 1] : null
        if (!this.validateParentRelation(parentId, this.groupForm.id)) {
          this.$message.warning('父级分组不能选择自己或自己的子分组')
          return
        }
        const formData = {
          id: this.groupForm.id,
          groupName: this.groupForm.name,
          parentId,
          orderBy: Number(this.groupForm.orderBy)
        }
        updateGroup(formData).then((res) => {
          this.$message.success((res && res.data) || '编辑分组成功')
          this.queryGroupList(this.groupFilter || '')
          this.cancelGroup()
        })
      })
    },
    handleViewAll() {
      this.currentGroupId = 0
      this.queryFormulaList()
    },
    deleteGroup(node) {
      if (!node || node.id == null || node.id === 0) {
        this.$message.warning('该分组不可删除')
        return
      }
      if (this.regularGroupId != null && Number(node.id) === this.regularGroupId) {
        this.$message.warning('固定分类不允许删除')
        return
      }
      this.$confirm('确定要删除该分组吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          deleteGroup(node.id).then((res) => {
            this.$message.success((res && res.data) || '删除分组成功')
            this.queryGroupList(this.groupFilter || '')
            if (this.currentGroupId === node.id) {
              this.currentGroupId = 0
            }
            this.queryFormulaList()
          })
        })
        .catch(() => {})
    },
    handleAddFormula() {
      // 先跳转到公式编辑页面（后续实现具体表单）
      this.$router.push({ path: '/basic-config/formula/edit' })
    },
    handleViewFormula(row) {
      this.$router.push({
        path: '/basic-config/formula/edit',
        query: { id: row.id, readonly: 'true' }
      })
    },
    handleEditFormula(row) {
      if (this.isGeneralFormula(row)) {
        this.$message.warning('通用公式不允许编辑')
        return
      }
      this.$router.push({
        path: '/basic-config/formula/edit',
        query: { id: row.id }
      })
    },
    handleDeleteFormula(row) {
      if (this.isGeneralFormula(row)) {
        this.$message.warning('通用公式不允许删除')
        return
      }
      this.$confirm('确定要删除该公式吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteFormulaApi(row.id).then((res) => {
          this.$message.success((res && res.data) || '删除成功')
          this.queryFormulaList()
        })
      }).catch(() => {})
    },
    isGeneralFormula(row) {
      if (!row) return false
      const groupName = String(row.groupName || '')
      return groupName.includes('通用')
    },
    handleToggleFormulaStatus(row) {
      if (!row || row.id == null) return
      const nextStatus = !(row && row.enabledBool)
      const text = nextStatus ? '启用' : '禁用'
      this.$confirm(`确定要${text}该公式吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return releaseFormulaApi(row.id, nextStatus).then((res) => {
          this.$message.success((res && res.data) || `公式${text}成功`)
          this.queryFormulaList()
        })
      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.formula-container {
  height: calc(100vh - 84px);
  background: radial-gradient(circle at 15% 20%, #eef4ff 0%, #f6f9ff 55%, #f7f8fb 100%);
  padding: 14px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.body {
  margin: 0;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 0;
}

/* 与清洗任务页一致：占满高度，避免侧栏与主区纵向错位留白 */
::v-deep .el-container {
  flex: 1;
  min-height: 0;
  height: 100%;
}

::v-deep .el-main {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.page-aside {
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
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

.group {
  border-radius: 4px;
  min-width: 200px;
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

/* 树区域单独占满剩余高度，避免 el-tree 作 flex 子项时高度塌陷 */
.tree-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.tree-scroll ::v-deep .el-tree {
  max-height: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

.group .search {
  margin-bottom: 14px;
  flex-shrink: 0;
  align-items: center;
}

.queryAll {
  width: 100%;
  margin-bottom: 14px;
  flex-shrink: 0;
  border-radius: 8px;
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
  color: #31415f;

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
  margin-right: 8px;
}

.list {
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

.search .add {
  margin-left: 10px;
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
  color: #6a7486;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.custom-tooltip .menu-item:hover {
  background-color: #fff;
  color: #409eff;
}

.formula-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;

  .search-left {
    display: flex;
    align-items: center;

    .label {
      margin: 0 8px 0 0;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 500;
      color: #6a7486;
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
  margin-top: 20px;
  text-align: right;
  flex-shrink: 0;
}

.list ::v-deep .el-table .cell {
  cursor: default;
}

.list ::v-deep td.op-column .el-button--text {
  cursor: pointer;
}

.list ::v-deep td.op-column .cell {
  white-space: normal !important;
  line-height: 22px;
  padding-left: 8px;
  padding-right: 8px;
}

.op-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 4px;
  margin: -2px 0;
}

.op-actions .el-button--text {
  padding-left: 4px;
  padding-right: 4px;
  margin-left: 0;
  margin-right: 0;
}

.group-dialog ::v-deep .el-dialog__body {
  padding: 16px 20px 10px;
}

/* 表格样式优化 */
.list {
  ::v-deep .el-table {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #edf2fb; /* 统一表格边框 */
    border-radius: 8px; /* 增加圆角 */
    overflow: hidden;

    th {
      background-color: #f8faff !important; /* 表头背景色 */
      color: #31415f; /* 表头文字颜色 */
      font-weight: 600; /* 表头字体加粗 */
      border-bottom: 1px solid #edf2fb;
      height: 44px;
    }

    td {
      padding: 10px 0; /* 调整行高 */
      border-bottom: 1px solid #edf2fb; /* 统一单元格底部边框 */
      color: #4b566a; /* 单元格文字颜色 */
    }

    .el-table__body-wrapper {
      flex: 1;
      overflow-y: auto;
    }

    .el-table__fixed-right::before,
    .el-table__fixed::before {
      background-color: transparent; /* 移除固定列的额外边框阴影 */
    }

    .el-table__empty-block {
      min-height: 80px; /* 调整空数据提示的最小高度 */
    }

    .el-button--text {
      color: #409eff; /* 操作列按钮颜色 */
      &:hover {
        color: #66b1ff; /* 悬浮时颜色变亮 */
      }
    }
  }
}

/* 分页器样式优化 */
.pagination-wrapper {
  ::v-deep .el-pagination {
    padding: 10px 0; /* 调整分页器内边距 */

    .btn-prev,
    .btn-next {
      background-color: #fff;
      color: #6a7486;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      margin: 0 5px;
      &:hover {
        border-color: #409eff;
        color: #409eff;
      }
    }

    .el-pager li {
      background-color: #fff;
      color: #6a7486;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      margin: 0 5px;
      min-width: 30px;
      &:hover {
        border-color: #409eff;
        color: #409eff;
      }
      &.active {
        background-color: #409eff;
        border-color: #409eff;
        color: #fff;
      }
    }

    .el-pagination__total,
    .el-pagination__jump,
    .el-pagination__sizes {
      color: #6a7486; /* 统一文字颜色 */
    }

    .el-input__inner {
      border-color: #dcdfe6; /* 输入框边框颜色 */
    }
  }
}

::v-deep .el-input--mini .el-input__inner,
::v-deep .el-input--small .el-input__inner {
  border-radius: 8px;
}

::v-deep .el-button--mini,
::v-deep .el-button--small {
  border-radius: 6px;
}
</style>

