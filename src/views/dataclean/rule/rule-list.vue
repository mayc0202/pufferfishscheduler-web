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
            <el-table-column prop="name" label="规则名称" width="280" />
            <el-table-column prop="groupName" label="规则分组" width="160" />
            <el-table-column prop="typeLabel" label="规则类型" width="140" />
            <el-table-column prop="statusLabel" label="状态" width="100" />
            <el-table-column prop="updatedTime" label="更新时间" width="200" />
            <el-table-column fixed="right" label="操作" width="200" class-name="op-column">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleViewRule(scope.row)">查看</el-button>
                <el-button v-if="!isGeneralRule(scope.row)" type="text" size="small" @click="handleEditRule(scope.row)">编辑</el-button>
                <el-button v-if="!isGeneralRule(scope.row)" type="text" size="small" @click="handleDeleteRule(scope.row)">删除</el-button>
                <el-button v-if="isGeneralRule(scope.row)" type="text" size="small" @click="handleToggleRuleStatus(scope.row)">{{ scope.row.statusBool ? '禁用' : '启用' }}</el-button>
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
              :options="addGroupParentOptions"
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
import { tree, addGroup, updateGroup, deleteGroup, regularGroupId } from '@/api/collect/rule/ruleGroup'
import { list as ruleListApi, deleteRule as deleteRuleApi, releaseRule as releaseRuleApi } from '@/api/collect/rule/rule'

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
      groupTree: [],
      currentGroupId: 0,
      regularGroupId: null,
      searchForm: {
        name: ''
      },
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
    },
    addGroupParentOptions() {
      return this.filterGroupTreeByPermission(this.groupOptions || [], 'ADD_GROUP_PARENT')
    }
  },
  created() {
    this.queryGroupList()
    this.queryRegularGroupId()
    this.queryRuleList()
  },
  methods: {
    classifyRootTypeByName(name) {
      const n = String(name || '')
      if (n.includes('通用')) return 'GENERAL'
      if (n.includes('公共')) return 'PUBLIC'
      if (n.includes('自定义')) return 'CUSTOM'
      return 'OTHER'
    },
    filterGroupTreeByPermission(options, scene) {
      const allowRootTypes = this.isAdmin
        ? ['PUBLIC', 'CUSTOM']
        : ['CUSTOM']
      const walk = (nodes, rootType = null) => {
        const out = []
        ;(nodes || []).forEach((node) => {
          if (!node) return
          const currentRootType = rootType || this.classifyRootTypeByName(node.name)
          const cloned = { ...node }
          if (Array.isArray(node.children) && node.children.length > 0) {
            cloned.children = walk(node.children, currentRootType)
          }
          if (scene === 'ADD_GROUP_PARENT') {
            if (currentRootType === 'GENERAL') return
            if (rootType == null && !allowRootTypes.includes(currentRootType)) return
          }
          out.push(cloned)
        })
        return out
      }
      return walk(options, null)
    },
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
    findRootTypeById(nodes, id, rootType = null) {
      for (const node of nodes || []) {
        if (!node) continue
        const currentRootType = rootType || this.classifyRootTypeByName(node.name)
        if (node.id === id) return currentRootType
        if (Array.isArray(node.children) && node.children.length > 0) {
          const hit = this.findRootTypeById(node.children, id, currentRootType)
          if (hit) return hit
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
    async queryRegularGroupId() {
      try {
        const res = await regularGroupId()
        this.regularGroupId = res && res.data != null ? Number(res.data) : null
      } catch (e) {
        this.regularGroupId = null
      }
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
      this.queryRuleList()
    },
    async queryRuleList() {
      this.tableLoading = true
      try {
        const groupId = this.currentGroupId === 0 ? undefined : this.currentGroupId
        const res = await ruleListApi(
          groupId,
          this.searchForm.name || undefined,
          this.pagination.currentPage,
          this.pagination.pageSize
        )
        const data = (res && res.data) || {}
        const records = Array.isArray(data.records) ? data.records : []
        this.ruleList = records.map((item) => {
          const statusRaw = item.status != null ? String(item.status) : ''
          const statusBool = statusRaw === '1' || statusRaw === 'true'
          const statusLabel = item.statusTxt || item.statusLabel || (statusRaw === '1' || statusRaw === 'true' ? '启用' : '禁用')
          const updatedTime = item.updatedTimeTxt || item.createdTimeTxt || item.updatedTime || item.updateTime || '-'
          return {
            ...item,
            id: item.id || item.ruleId,
            name: item.name || item.ruleName || '',
            groupName: item.groupName || '-',
            typeLabel: item.processorName || item.typeLabel || '-',
            statusBool,
            statusLabel,
            updatedTime
          }
        })
        this.pagination.total = data.total != null ? data.total : this.ruleList.length
        this.pagination.currentPage = data.current != null ? data.current : this.pagination.currentPage
        this.pagination.pageSize = data.size != null ? data.size : this.pagination.pageSize
      } catch (e) {
        this.ruleList = []
        this.pagination.total = 0
        this.$message.error('获取规则列表失败')
      } finally {
        this.tableLoading = false
      }
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
        if (parentId != null) {
          const rootType = this.findRootTypeById(this.groupTree, parentId)
          if (rootType === 'GENERAL') {
            this.$message.warning('新增分组时父级不能选择通用目录')
            return
          }
          if (!this.isAdmin && rootType === 'PUBLIC') {
            this.$message.warning('当前角色仅允许在自定义目录下新增分组')
            return
          }
        }
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
      this.queryRuleList()
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
            this.queryRuleList()
          })
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
      if (this.isGeneralRule(row)) {
        this.$message.warning('通用规则不允许编辑')
        return
      }
      this.$router.push({
        path: '/basic-config/dataclean/edit',
        query: { id: row.id }
      })
    },
    handleDeleteRule(row) {
      if (this.isGeneralRule(row)) {
        this.$message.warning('通用规则不允许删除')
        return
      }
      this.$confirm('确定要删除该规则吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteRuleApi(row.id).then((res) => {
          this.$message.success((res && res.data) || '删除成功')
          this.queryRuleList()
        })
      }).catch(() => {})
    },
    isGeneralRule(row) {
      if (!row) return false
      const groupName = String(row.groupName || '')
      if (groupName.includes('通用')) return true
      if (this.regularGroupId != null) {
        if (row.firstGroupId != null && Number(row.firstGroupId) === Number(this.regularGroupId)) return true
        if (row.groupId != null && Number(row.groupId) === Number(this.regularGroupId)) return true
      }
      const gid = row.groupId != null ? Number(row.groupId) : null
      if (gid != null) {
        const rootType = this.findRootTypeById(this.groupTree, gid)
        if (rootType === 'GENERAL') return true
      }
      return false
    },
    handleToggleRuleStatus(row) {
      if (!this.isGeneralRule(row)) return
      const nextStatus = !(row && row.statusBool)
      const text = nextStatus ? '启用' : '禁用'
      this.$confirm(`确定要${text}该规则吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return releaseRuleApi(row.id, nextStatus).then((res) => {
          this.$message.success((res && res.data) || `规则${text}成功`)
          this.queryRuleList()
        })
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
  margin: 10px 10px 10px 10px; /* 调整右侧外边距 */
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
  margin: 10px 10px 10px 0; /* 调整左侧外边距 */
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

.rule-main ::v-deep .el-table .cell {
  cursor: default;
}

.rule-main ::v-deep td.op-column .el-button--text {
  cursor: pointer;
}

.group-dialog ::v-deep .el-dialog__body {
  padding: 16px 20px 10px;
}

/* 表格样式优化 */
.rule-main {
  ::v-deep .el-table {
    border: 1px solid #ebeef5; /* 统一表格边框 */
    border-radius: 4px; /* 增加圆角 */

    th {
      background-color: #f5f7fa; /* 表头背景色 */
      color: #333639; /* 表头文字颜色 */
      font-weight: 600; /* 表头字体加粗 */
      border-bottom: 1px solid #ebeef5;
    }

    td {
      padding: 8px 0; /* 调整行高 */
      border-bottom: 1px solid #ebeef5; /* 统一单元格底部边框 */
      color: #606266; /* 单元格文字颜色 */
    }

    .el-table__fixed-right::before,
    .el-table__fixed::before {
      background-color: transparent; /* 移除固定列的额外边框阴影 */
    }

    .el-table__empty-block {
      min-height: 80px; /* 调整空数据提示的最小高度 */
    }

    .el-button--text {
      color: #2A87FF; /* 操作列按钮颜色 */
      &:hover {
        color: #549DFF; /* 悬浮时颜色变亮 */
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
      color: #606266;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      margin: 0 5px;
      &:hover {
        border-color: #2A87FF;
        color: #2A87FF;
      }
    }

    .el-pager li {
      background-color: #fff;
      color: #606266;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      margin: 0 5px;
      min-width: 30px;
      &:hover {
        border-color: #2A87FF;
        color: #2A87FF;
      }
      &.active {
        background-color: #2A87FF;
        border-color: #2A87FF;
        color: #fff;
      }
    }

    .el-pagination__total,
    .el-pagination__jump,
    .el-pagination__sizes {
      color: #606266; /* 统一文字颜色 */
    }

    .el-input__inner {
      border-color: #dcdfe6; /* 输入框边框颜色 */
    }
  }
}
</style>

