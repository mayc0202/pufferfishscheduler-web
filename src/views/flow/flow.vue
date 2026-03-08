<template>
  <div class="container">
    <div class="wrap">
      <div class="flex header">
        <i class="el-icon-s-unfold icon" />
        <div class="font">清洗流程开发</div>
      </div>
    </div>
    <div class="body">
      <el-container>
        <el-aside width="260px">
          <div class="group">
            <div class="wrap">
              <div class="flex search">
                <el-input
                  v-model="searchGroup"
                  placeholder="请输入分组名称"
                  clearable
                  @input="queryGroupsByName()"
                >
                  <i slot="prefix" class="el-input__icon el-icon-search" />
                </el-input>
                <div class="add">
                  <el-button
                    type="primary"
                    icon="el-icon-plus"
                    style="padding: 10px"
                    @click="openGroupDialog()"
                  />
                </div>
              </div>
              <el-button type="primary" class="queryAll" @click="queryGroupList()">查看全部数据</el-button>
              <el-tree :data="group" @node-click="handleGroupNodeClick">
                <div slot-scope="{ data }" class="custom-node flex between">
                  <img :src="icons.db_group" class="group_icon">
                  <div class="flex node-label">
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
        <el-container>
          <el-main>
            <div class="list">
              <div class="flex between search">
                <div class="search_input">
                  <input
                    v-model="flowName"
                    placeholder="请输入流程名称"
                    class="input"
                  >
                </div>
                <div>
                  <el-button type="primary" icon="el-icon-search" @click="queryFlowList()">查询</el-button>
                  <el-button type="primary" @click="openFlowDialog()">新增清洗流程</el-button>
                </div>
              </div>
              <template>
                <el-table
                  v-loading="tableLoading"
                  :data="tableData"
                  style="width: 100%"
                  max-height="640"
                  element-loading-text="正在加载数据..."
                  element-loading-spinner="el-icon-loading"
                  element-loading-background="rgba(255, 255, 255, 0.8)"
                >
                  <el-table-column
                    fixed
                    type="index"
                    label="#"
                  />
                  <el-table-column prop="name" label="流程名称" width="300" />
                  <el-table-column prop="groupName" label="流程分组" width="280" />
                  <el-table-column
                    prop="description"
                    label="流程描述"
                    width="300"
                  />
                  <el-table-column
                    prop="createdTimeTxt"
                    label="创建日期"
                    width="180"
                  />
                  <el-table-column fixed="right" label="操作" width="140">
                    <template slot-scope="scope">
                      <div class="wrap">
                        <div>
                          <el-button
                            type="text"
                            size="small"
                            @click.native.prevent="flowDesign(scope.row)"
                          >
                            流程设计
                          </el-button>
                          <el-button
                            type="text"
                            size="small"
                            @click.native.prevent="openFlowDialog(scope.row)"
                          >
                            编辑
                          </el-button>
                        </div>
                        <div>
                          <el-button
                            type="text"
                            size="small"
                            @click.native.prevent="copyFlow(scope.row)"
                          >
                            复制流程
                          </el-button>
                          <el-button
                            type="text"
                            size="small"
                            @click.native.prevent="deleteFlow(scope.row)"
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
                  :current-page="currentPage"
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
    <!-- 新增/编辑流程弹窗补充表单验证 -->
    <flow-dialog
      :title="flowDialog.title"
      :visible="flowDialog.visible"
      :width="flowDialog.width"
      :height="flowDialog.height"
      @onClose="onClose"
      @onConfirm="submitFlowForm"
    >
      <div slot="content">
        <el-form
          ref="flowFormRef"
          :model="flowForm"
          label-width="80px"
          size="mini"
          label-position="top"
          :rules="flowRules"
        >
          <el-form-item label="流程名称" prop="name">
            <el-input
              v-model="flowForm.name"
              placeholder="请输入流程名称"
              clearable
            />
          </el-form-item>
          <el-form-item label="流程分组" prop="groupId">
            <el-cascader
              v-model="flowForm.groupId"
              style="width: 100%;"
              :options="options"
              :props="{
                expandTrigger: 'hover',
                checkStrictly: true,
                emitPath: false
              }"
              placeholder="请选择流程分组"
              :show-all-levels="true"
              clearable
            />
          </el-form-item>
          <el-form-item label="流程描述" prop="description">
            <el-input
              v-model="flowForm.description"
              type="textarea"
              :rows="2"
              placeholder="请输入流程描述"
            />
          </el-form-item>
        </el-form>
      </div>
    </flow-dialog>

    <!-- 新增分组弹窗 -->
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
        <el-form ref="groupForm" :model="groupForm" :label-position="labelPosition" :rules="groupRules" label-width="100px">
          <el-form-item label="父级分组:" prop="parentId">
            <el-cascader
              v-model="groupParentId"
              :options="options"
              :props="{
                expandTrigger: 'hover',
                checkStrictly: true,
                emitPath: true
              }"
              placeholder="请选择父级分组"
              :show-all-levels="true"
              clearable
              @change="handleParentChange"
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

    <!-- 编辑分组弹窗 -->
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
        <el-form ref="groupForm" :model="groupForm" :label-position="labelPosition" :rules="groupRules" label-width="100px">
          <el-form-item label="父级分组:" prop="parentId">
            <el-cascader
              v-model="groupParentId"
              :options="options"
              :props="{
                expandTrigger: 'hover',
                checkStrictly: true,
                emitPath: true
              }"
              placeholder="请选择父级分组（不能选择自己）"
              :show-all-levels="true"
              clearable
              @change="handleParentChange"
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
  </div>
</template>
<script>
import icons from '@/assets/icon/icons.js'
import DynamicDialog from '@/components/common/dynamic-dialog.vue' // 导入组件

// 导入分组和流程相关接口
import { tree, addGroup, updateGroup, deleteGroup } from '@/api/collect/trans/transGroup'
// 新增：导入流程相关API
import { list, addFlow, updateFlow, deleteFlow as deleteFlowApi } from '@/api/collect/trans/transFlow'

export default {
  components: {
    'flow-dialog': DynamicDialog,
    'add-group-dialog': DynamicDialog,
    'edit-group-dialog': DynamicDialog
  },

  data() {
    return {
      icons,
      searchGroup: '',
      title: '',
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      // 表格数据
      tableData: [],
      flowName: '',
      // 分页参数
      currentPage: 1,
      pageSize: 10,
      total: 0,
      // 弹框属性
      flowDialog: {
        title: '新增清洗流程',
        visible: false,
        width: 460,
        height: 260,
        isEdit: false // 标记是否为编辑状态
      },
      // 流程表单验证规则
      flowRules: {
        name: [
          { required: true, message: '请输入流程名称', trigger: 'blur' },
          { max: 100, message: '流程名称不能超过100字', trigger: 'blur' }
        ],
        groupId: [
          { required: true, message: '请选择流程分组', trigger: 'change' }
        ],
        description: [
          { max: 500, message: '流程描述不能超过500字', trigger: 'blur' }
        ]
      },
      // 流程表单数据（对应后端TransFlowForm）
      flowForm: {
        id: null,
        name: '',
        groupId: null,
        description: '',
        flowType: '',
        path: '',
        sceneType: '1',
        rowSize: 2000
      },
      // 表格加载状态
      tableLoading: false,
      // 原有分组相关数据
      labelPosition: 'left',
      addGroupDialog: {
        title: '新增分组',
        visible: false,
        width: 360,
        height: 220
      },
      editGroupDialog: {
        title: '编辑分组',
        visible: false,
        width: 360,
        height: 260
      },
      options: [],
      // 记录选中的分组ID
      selectedGroupId: null,
      groupParentId: [],
      currentEditGroupId: null,
      groupForm: {
        id: null,
        parentId: null,
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
      // 分组
      group: []
    }
  },

  mounted() {
    this.queryGroupList()
    this.queryFlowList()
  },

  methods: {
    handleNodeClick(data) {
      console.log(data)
    },

    // ****************************  流程处理逻辑 ****************************

    /**
     * 查询流程列表（对接list接口）
     */
    queryFlowList() {
      // 开启加载动画
      this.tableLoading = true

      // 构造基础参数
      const queryParams = {
        flowName: this.flowName || '',
        pageNo: this.currentPage,
        pageSize: this.pageSize
      }

      // groupId为null时不传该参数，避免后端Integer转null报错
      if (this.selectedGroupId !== null && this.selectedGroupId !== undefined) {
        queryParams.groupId = this.selectedGroupId
      }

      // 调用list接口：注意参数顺序（flowName, groupId, pageNo, pageSize）
      list(
        queryParams.flowName,
        queryParams.groupId || undefined, // null时传undefined
        queryParams.pageNo,
        queryParams.pageSize
      )
        .then(res => {
          this.tableData = res.data.records || []
          this.total = res.data.total
          this.currentPage = res.data.current
          this.pageSize = res.data.size
        })
        .catch(error => {
          console.error('查询流程列表失败:', error)
          this.$message.error('查询流程列表失败，请重试')
        }).finally(() => {
          // 无论成功/失败，都关闭加载动画
          this.tableLoading = false
        })
    },

    /**
     * 打开新增/编辑流程弹窗
     * @param {Object} row 编辑时传入行数据，新增时不传
     */
    openFlowDialog(row = null) {
      // 重置表单和验证
      this.$nextTick(() => {
        if (this.$refs.flowFormRef) {
          this.$refs.flowFormRef.resetFields()
        }
      })

      if (row) {
        // 编辑状态
        this.flowDialog.title = '编辑清洗流程'
        this.flowDialog.isEdit = true
        // 赋值表单数据（映射后端返回字段）
        this.flowForm = {
          id: row.id,
          name: row.name,
          groupId: row.groupId,
          description: row.description || '',
          flowType: row.flowType || '',
          path: row.path || '',
          sceneType: row.sceneType || '1',
          rowSize: row.rowSize || 2000
        }
      } else {
        // 新增状态
        this.flowDialog.title = '新增清洗流程'
        this.flowDialog.isEdit = false
        // 重置表单
        this.flowForm = {
          id: null,
          name: '',
          groupId: null,
          description: '',
          flowType: '',
          path: '',
          sceneType: '1',
          rowSize: 2000
        }
      }
      this.flowDialog.visible = true
    },

    /**
     * 提交流程表单（新增/编辑）
     */
    submitFlowForm() {
      this.$refs.flowFormRef.validate((valid) => {
        if (valid) {
          // 构造提交数据（匹配后端TransFlowForm）
          const submitData = {
            ...this.flowForm,
            groupId: Number(this.flowForm.groupId) // 确保是数字类型
          }

          // 区分新增/编辑
          const request = this.flowDialog.isEdit
            ? updateFlow(submitData)
            : addFlow(submitData)

          request.then(res => {
            this.$message.success(this.flowDialog.isEdit ? '流程编辑成功' : '流程新增成功')
            this.flowDialog.visible = false
            // 重新查询列表
            this.queryFlowList()
            // TODO 进入流程设计页面（可根据需求决定是否自动跳转）
          }).catch(error => {
            console.error('流程提交失败:', error)
            this.$message.error(this.flowDialog.isEdit ? '流程编辑失败' : '流程新增失败')
          })
        } else {
          this.$message.warning('请完善表单必填项')
          return false
        }
      })
    },

    /**
     * 删除流程
     * @param {Object} row 行数据
     */
    deleteFlow(row) {
      this.$confirm('此操作将永久删除该流程, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用删除接口
        deleteFlowApi(row.id)
          .then(res => {
            this.$message.success('流程删除成功')
            // 重新查询列表
            this.queryFlowList()
          })
          .catch(error => {
            console.error('删除流程失败:', error)
            this.$message.error('流程删除失败，请重试')
          })
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },

    /**
     * 流程设计（跳转）
     * @param {Object} row 行数据
     */
    flowDesign(row) {
      this.$router.push({
        path: '/etl/flowChart',
        query: { id: row.id, name: row.name }
      })
    },

    /**
     * 复制流程（可根据需要扩展）
     * @param {Object} row 行数据
     */
    copyFlow(row) {
      this.$message.info('复制流程功能待实现')
      // 可扩展：复制row数据，打开新增弹窗并填充
    },

    /**
     * 分页大小改变
     * @param {Number} val 每页条数
     */
    handleSizeChange(val) {
      this.pageSize = val
      this.queryFlowList()
    },

    /**
     * 当前页改变
     * @param {Number} val 当前页
     */
    handleCurrentChange(val) {
      this.currentPage = val
      this.queryFlowList()
    },

    /**
     * 流程名称查询
     */
    queryFlowByName() {
      this.currentPage = 1 // 重置页码
      this.queryFlowList()
    },

    /**
     * 配置弹窗确认
     */
    onConfirm() {
      this.submitFlowForm()
    },

    /**
     * 配置弹窗取消
     */
    onClose() {
      this.flowDialog.visible = false
      // 重置表单
      if (this.$refs.flowFormRef) {
        this.$refs.flowFormRef.resetFields()
      }
    },

    // ****************************  分组处理逻辑 ****************************
    // 分组节点点击事件
    handleGroupNodeClick(data) {
    // 只记录类型为GROUP的分组ID（过滤非分组节点）
      if (data.type === 'GROUP') {
        this.selectedGroupId = data.id // 记录选中的分组ID
        this.currentPage = 1 // 重置页码为第一页
        this.queryFlowList() // 重新查询流程列表
      }
    },

    // 重置分组选中（比如点击"查看全部数据"时）
    resetSelectedGroup() {
      this.selectedGroupId = null
      this.currentPage = 1
      this.queryFlowList()
    },

    /**
     * 打开分组弹窗
     */
    openGroupDialog() {
      this.groupForm = {
        parentId: null,
        name: '',
        orderBy: 0
      }
      this.groupParentId = []
      this.currentEditGroupId = null // 新增时没有禁用选项
      this.addGroupDialog.visible = true

      // 重新加载options，确保新增时没有禁用选项
      this.queryGroupList()
    },

    /**
     * 提交分组
     */
    submitAddGroup() {
      this.$refs.groupForm.validate((valid) => {
        if (valid) {
          // 获取正确的父级ID（级联选择器返回数组，取最后一个元素）
          const parentId = this.groupParentId.length > 0
            ? this.groupParentId[this.groupParentId.length - 1]
            : null

          // 创建副本避免引用问题
          const formData = {
            ...this.groupForm,
            parentId: parentId,
            orderBy: Number(this.groupForm.orderBy)
          }

          addGroup(formData).then((res) => {
            this.$message.success(res.data)
            // 执行一次查询操作
            this.queryGroupList()
            // 重置表单
            this.groupForm.name = ''
            this.groupForm.orderBy = 0
            this.groupParentId = [] // 重置父级ID
            this.addGroupDialog.visible = false
          })
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
      // 模拟接口调用
      tree(this.searchGroup).then((res) => {
        this.group = res.data
      })
    },

    /**
     * 获取分组数
     */
    queryGroupList() {
      // 模拟接口调用
      tree('').then((res) => {
        this.group = res.data

        // 如果有当前编辑的分组ID，则禁用该选项
        const disabledIds = this.currentEditGroupId ? [this.currentEditGroupId] : []
        this.options = this.formatToCascader(this.group, disabledIds)
      })

      this.resetSelectedGroup()
    },

    /**
     * 转换函数，支持禁用选项
     * @param data 原始数据
     * @param disabledIds 需要禁用的ID数组
     * @returns {Array} 转换后的级联数据
     */
    formatToCascader(data, disabledIds = []) {
      return data.map(item => {
        const formattedItem = {
          value: item.id,
          label: item.name,
          disabled: disabledIds.includes(item.id) // 判断是否禁用
        }

        // 如果有子节点，递归处理children
        if (item.children && item.children.length > 0) {
          formattedItem.children = this.formatToCascader(item.children, disabledIds)
        }

        return formattedItem
      })
    },

    /**
     * 编辑分组
     * @param group
     */
    editGroup(group) {
      this.groupForm = {
        id: group.id,
        name: group.name,
        orderBy: group.orderBy || 0,
        parentId: group.parentId || null
      }

      // 如果有父级ID，需要设置级联选择器的值
      if (group.parentId) {
        this.groupParentId = this.findParentPath(this.options, group.parentId)
      } else {
        this.groupParentId = []
      }

      // 设置当前编辑的分组ID，用于禁用选项
      this.currentEditGroupId = group.id

      this.editGroupDialog.visible = true
    },

    /**
     * 查找父级路径
     * @param options 级联选择器选项
     * @param targetId 目标ID
     * @returns {Array} 返回从根到目标的路径数组
     */
    findParentPath(options, targetId) {
      for (const option of options) {
        if (option.value === targetId) {
          return [option.value]
        }
        if (option.children && option.children.length > 0) {
          const path = this.findParentPath(option.children, targetId)
          if (path.length > 0) {
            return [option.value, ...path]
          }
        }
      }
      return []
    },

    /**
     * 提交编辑分组
     */
    submitEditGroup() {
      this.$refs.groupForm.validate((valid) => {
        if (valid) {
          // 获取正确的父级ID（级联选择器返回数组，取最后一个元素）
          const parentId = this.groupParentId.length > 0
            ? this.groupParentId[this.groupParentId.length - 1]
            : null

          // 验证：不能选择自己或后代作为父级
          if (!this.validateParentChild(parentId, this.groupForm.id)) {
            return false // 验证失败，直接返回，不继续执行
          }

          // 创建副本避免引用问题
          const formData = {
            ...this.groupForm,
            parentId: parentId,
            orderBy: Number(this.groupForm.orderBy)
          }

          // 模拟接口调用
          updateGroup(formData).then((res) => {
            this.$message.success('编辑分组成功')
            this.queryGroupList()

            // 重置表单
            this.groupForm = {
              id: null,
              parentId: null,
              name: '',
              orderBy: 0
            }
            this.groupParentId = [] // 重置父级ID
            this.currentEditGroupId = null // 重置当前编辑ID
            this.editGroupDialog.visible = false
          }).catch((error) => {
            console.error('编辑分组失败:', error)
            this.$message.error('编辑失败，请重试')
          })
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
      }).then(async() => {
        try {
          // 模拟接口调用
          const res = await deleteGroup(group.id)
          this.$message.success(res.data || '删除成功!')

          // 模拟成功提示
          this.$message.success('删除分组成功')
        } catch (error) {
          console.error('删除分组失败:', error)
          this.$message.error('删除失败，请重试')
        } finally {
          this.queryGroupList()
        }
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
      this.groupForm = {
        id: null,
        parentId: null,
        name: '',
        orderBy: 0
      }
      this.groupParentId = [] // 重置父级ID
      this.currentEditGroupId = null // 重置当前编辑ID
      this.addGroupDialog.visible = false
      this.editGroupDialog.visible = false

      // 重新加载options，移除禁用状态
      this.queryGroupList()
    },

    /**
     * 监听父级分组变化
     */
    handleParentChange(value) {
      // value 是一个数组，包含从根到选中的完整路径
      this.groupParentId = value
    },

    /**
     * 验证父子关系
     * @param parentId 父级ID
     * @param childId 子级ID
     * @returns {boolean} 是否有效
     */
    validateParentChild(parentId, childId) {
      if (!parentId) return true // 没有父级，有效

      // 不能选择自己
      if (parentId === childId) {
        this.$message.error('不能选择自己作为父级分组')
        return false
      }

      // 检查是否选择了自己的后代（避免循环依赖）
      if (this.isDescendant(parentId, childId)) {
        this.$message.error('不能选择自己的后代作为父级分组')
        return false
      }

      return true
    },

    /**
    * 检查是否是后代
    * @param ancestorId 可能的祖先ID
    * @param descendantId 后代ID
    * @returns {boolean}
    */
    isDescendant(ancestorId, descendantId) {
      const findDescendant = (items, targetId) => {
        for (const item of items) {
          if (item.id === targetId) return true
          if (item.children && item.children.length > 0) {
            if (findDescendant(item.children, targetId)) return true
          }
        }
        return false
      }

      // 找到祖先节点
      const findAncestor = (items, id) => {
        for (const item of items) {
          if (item.id === id) return item
          if (item.children && item.children.length > 0) {
            const found = findAncestor(item.children, id)
            if (found) return found
          }
        }
        return null
      }

      const ancestor = findAncestor(this.group, ancestorId)
      if (ancestor && ancestor.children) {
        return findDescendant(ancestor.children, descendantId)
      }
      return false
    }
  }
}
</script>

<style scoped>
.container {
  margin: 0;
  padding: 0;
  background-color: rgb(247, 247, 247);
}

.header {
  background: #fff;
  padding: 10px;
  margin: 10px;
  position: relative;
  user-select: none;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header .icon {
  margin-right: 10px;
}

.header .font {
  padding-left: 5px;
  font-weight: 700;
  font-size: 14px;
  color: #606266;
}

::v-deep .el-aside {
  background-color: rgb(255, 255, 255);
  padding: 0;
  color: #333;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
  height: 92.5vh;
  margin-top: 10px;
  margin-left: 10px;
  display: flex;
  flex-direction: column;
}

::v-deep .el-main {
  padding: 0;
  margin-left: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

::v-deep .el-table {
  border: 1px solid #ebeef5;
  border-bottom: 0;
  min-height: 640px;
  flex: 1;
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

.body {
  margin: 0 10px;
  padding: 0;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: calc(100vh - 80px);
}

.body .group {
  padding: 10px;
  background: #fff fixed;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.body .group_icon {
  width: 18px;
  height: 18px;
  margin-right: 6px;
}

.body .group .search {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.body .group .search .add {
  margin-left: 10px;
}

.body .group .queryAll {
  width: 100%;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.body .list {
  padding: 10px 20px 20px 20px;
  background: #fff fixed;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  height: 100%;
  min-width: 504px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.body .list .search {
  padding: 10px;
  margin-bottom: 20px;
  flex-shrink: 0;
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
  justify-content: space-between;
  align-items: center;
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
  -webkit-transform: rotate(90deg);
  -moz-transform: rotate(90deg);
  -ms-transform: rotate(90deg);
  -o-transform: rotate(90deg);
  transform: rotate(90deg);
}

.node-icon:hover {
  color: #409eff;
}

.custom-menu {
  user-select: none;
  padding: 0 !important;
}

.menu-item {
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  color: #606266;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #fff;
  color: #409EFF;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 20px;
  flex-shrink: 0;
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

.body .group .wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

::v-deep .custom-tooltip {
  border: none !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

::v-deep .custom-tooltip .popper__arrow {
  border: none !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
