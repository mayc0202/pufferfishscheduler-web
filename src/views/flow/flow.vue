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
                  v-model="search"
                  placeholder="请输入分组名称"
                  clearable
                >
                  <i slot="prefix" class="el-input__icon el-icon-search" />
                </el-input>
                <div class="add">
                  <el-button
                    type="primary"
                    icon="el-icon-plus"
                    style="padding: 10px"
                  />
                </div>
              </div>
              <el-button type="primary" class="queryAll">查看全部数据</el-button>
              <el-tree :data="group" :props="defaultProps">
                <div slot-scope="{ node }" class="custom-node">
                  <span class="node-label">{{ node.label }}</span>
                  <el-tooltip effect="dark" placement="right" :popper-class="menu-tooltip">
                    <i class="el-icon-more node-icon" />
                    <template #content>
                      <div class="custom-menu">
                        <div class="menu-item" @click="handleMenuClick(&quot;option1&quot;)">新增分组</div>
                        <div class="menu-item" @click="handleMenuClick(&quot;option2&quot;)">编辑分组</div>
                        <div class="menu-item" @click="handleMenuClick(&quot;option3&quot;)">删除分组</div>
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
                  <el-button type="primary" icon="el-icon-search">查询</el-button>
                  <el-button type="primary" @click="openFlowDialog()">新增清洗流程</el-button>
                </div>
              </div>
              <template>
                <el-table
                  :data="tableData"
                  style="width: 100%"
                  max-height="640"
                >
                  <el-table-column
                    fixed
                    type="index"
                    label="#"
                  />
                  <el-table-column prop="flowName" label="流程名称" width="300" />
                  <el-table-column prop="group" label="流程分组" width="280" />
                  <el-table-column
                    prop="description"
                    label="流程描述"
                    width="300"
                  />
                  <el-table-column
                    prop="createdTime"
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
                            @click.native.prevent="
                              deleteRow(scope.$index, tableData)
                            "
                          >
                            流程设计
                          </el-button>
                          <el-button
                            type="text"
                            size="small"
                            @click.native.prevent="
                              deleteRow(scope.$index, tableData)
                            "
                          >
                            编辑
                          </el-button>
                        </div>
                        <div>
                          <el-button
                            type="text"
                            size="small"
                            @click.native.prevent="
                              deleteRow(scope.$index, tableData)
                            "
                          >
                            复制流程
                          </el-button>
                          <el-button
                            type="text"
                            size="small"
                            @click.native.prevent="
                              deleteRow(scope.$index, tableData)
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
                  :current-page="currentPage4"
                  :page-sizes="[10, 20, 30, 40, 50, 100]"
                  :page-size="10"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="100"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </div>
          </el-main>
        </el-container>
      </el-container>
    </div>
    <flow-dialog
      :title="flowDialog.title"
      :visible="flowDialog.visible"
      :width="flowDialog.width"
      :height="flowDialog.height"
      @onClose="onClose"
      @onConfirm="onConfirm"
    >
      <div slot="content">
        <el-form
          ref="form"
          :model="flowForm"
          label-width="80px"
          size="mini"
          label-position="top"
        >
          <el-form-item label="流程名称">
            <el-input
              v-model="flowForm.name"
              placeholder="请输入流程名称"
              clearable
            />
          </el-form-item>
          <el-form-item label="流程分组">
            <el-cascader
              v-model="flowForm.group"
              style="width: 100%"
              :options="group"
              :props="{ expandTrigger: hover }"
              placeholder="请选择流程分组"
              :show-all-levels="true"
              clearable
              @change="handleChange"
            />
          </el-form-item>
          <el-form-item label="流程描述">
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
  </div>
</template>
<script>
import DynamicDialog from '@/components/common/dynamic-dialog.vue' // 导入组件

export default {
  components: {
    'flow-dialog': DynamicDialog
  },

  data() {
    return {
      search: '',
      title: '',
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      tableData: [
        {
          createdTime: '2025-05-06 10:04:04',
          flowName: '测试doris清空表数据',
          group: '清洗流程分组/分组1',
          description: 'xxx'
        },
        {
          createdTime: '2025-05-06 10:04:04',
          flowName: '清洗转换规则测试',
          group: '共享流程分组/分组1',
          description: 'xxxx'
        },
        {
          createdTime: '2025-05-06 10:04:04',
          flowName: '测试doris清空表数据',
          group: '清洗流程分组/分组1',
          description: 'xxx'
        },
        {
          createdTime: '2025-05-06 10:04:04',
          flowName: '清洗转换规则测试',
          group: '共享流程分组/分组1',
          description: 'xxxx'
        },
        {
          createdTime: '2025-05-06 10:04:04',
          flowName: '测试doris清空表数据',
          group: '清洗流程分组/分组1',
          description: 'xxx'
        },
        {
          createdTime: '2025-05-06 10:04:04',
          flowName: '清洗转换规则测试',
          group: '共享流程分组/分组1',
          description: 'xxxx'
        },
        {
          createdTime: '2025-05-06 10:04:04',
          flowName: '测试doris清空表数据',
          group: '清洗流程分组/分组1',
          description: 'xxx'
        },
        {
          createdTime: '2025-05-06 10:04:04',
          flowName: '清洗转换规则测试',
          group: '共享流程分组/分组1',
          description: 'xxxx'
        },
        {
          createdTime: '2025-05-06 10:04:04',
          flowName: '测试doris清空表数据',
          group: '清洗流程分组/分组1',
          description: 'xxx'
        },
        {
          createdTime: '2025-05-06 10:04:04',
          flowName: '清洗转换规则测试',
          group: '共享流程分组/分组1',
          description: 'xxxx'
        }
      ],
      flowName: '',

      // 弹框属性
      flowDialog: {
        title: '新增清洗流程',
        visible: false,
        width: 640,
        height: 260
      },

      // 表单
      flowForm: {
        name: '',
        group: '',
        description: ''
      },
      group: [
        {
          value: '1',
          label: '清洗流程分组',
          children: [
            {
              value: '4',
              label: '分组1',
              children: [
                {
                  value: '32',
                  label: '测试'
                }
              ]
            },
            {
              value: 'daohang',
              label: '分组2',
              children: []
            }
          ]
        },
        {
          value: '2',
          label: '共享流程分组',
          children: [
            {
              value: '21',
              label: '分组1',
              children: [
                {
                  value: '221',
                  label: '三级1'
                }
              ]
            },
            {
              value: '22',
              label: '分组2',
              children: [
                {
                  value: '331',
                  label: '三级2'
                }
              ]
            }
          ]
        }
      ],
      currentPage4: 10
    }
  },

  mounted() {},

  methods: {
    handleNodeClick(data) {
      console.log(data)
    },

    deleteRow(index, rows) {
      rows.splice(index, 1)
    },

    handleChange(val) {
      console.log(`分组 ${val}`)
    },

    handleSizeChange(val) {
      console.log(`每页 ${val} 条`)
    },
    handleCurrentChange(val) {
      console.log(`当前页: ${val}`)
    },

    /**
     * 打开新增流程弹窗
     */
    openFlowDialog() {
      this.flowDialog.visible = true
    },

    /**
     * 配置弹窗确认
     */
    onConfirm() {
      this.flowDialog.visible = false

      // 对象形式带参数
      this.$router.push({
        path: '/etl/flowChart',
        query: { id: 123 }
      })
    },

    /**
     * 配置弹窗取消
     */
    onClose() {
      this.flowDialog.visible = false
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
}

::v-deep .el-main {
  padding: 0;
  margin-left: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

::v-deep .el-table {
  border: 1px solid #ebeef5;
  border-bottom: 0;
  min-height: 640px;
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
}

.body .group {
  padding: 10px;
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
  min-width: 220px; /* 设置最小输入宽度 */
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
  flex-shrink: 0; /* 禁止宽度收缩 */
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
  flex: 1; /* 允许文本区域自动扩展 */
  margin-right: 12px; /* 与图标保持间距 */
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

.node-icon:hover {
  color: #409eff;
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

.pagination-wrapper {
  display: flex;
  justify-content: center; /* 水平居中 */
  width: 100%; /* 确保容器占满父级宽度 */
  margin-top: 20px;
}
</style>
