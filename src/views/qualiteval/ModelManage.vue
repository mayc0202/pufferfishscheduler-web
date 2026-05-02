<template>
  <div class="model-page">
    <div class="body">
      <el-container class="manage-layout">
        <el-aside width="268px" class="theme-aside">
          <div class="aside-head">
            <el-input
              v-model="treeFilter"
              size="small"
              clearable
              placeholder="请输入关键字查询"
              prefix-icon="el-icon-search"
              @input="onTreeFilter"
            />
          </div>
          <el-tree
            ref="themeTree"
            class="theme-tree"
            :data="themeTreeData"
            :props="treeProps"
            node-key="id"
            highlight-current
            default-expand-all
            :filter-node-method="filterThemeNode"
            @node-click="onThemeNodeClick"
          >
            <span slot-scope="{ node }" class="tree-node">
              <i class="el-icon-menu tree-node-icon" />
              <span class="tree-node-label">{{ node.label }}</span>
            </span>
          </el-tree>
        </el-aside>
        <el-main class="main-panel">
          <div class="list">
            <div class="toolbar-search">
              <div class="search-left">
                <span class="label">模型名称：</span>
                <el-input
                  v-model="query.name"
                  placeholder="请输入关键字"
                  size="small"
                  clearable
                  class="search-input"
                  @keyup.enter.native="loadList(true)"
                />
              </div>
              <div class="search-right">
                <el-button type="primary" size="small" icon="el-icon-search" @click="loadList(true)">查询</el-button>
                <el-button type="primary" size="small" icon="el-icon-plus" @click="openCreate">新增模型</el-button>
                <el-button type="primary" size="small" plain icon="el-icon-download" :loading="exporting" @click="exportAll">导出所有观测</el-button>
              </div>
            </div>

            <el-table
              v-loading="loading"
              :data="list"
              style="width: 100%"
              height="100%"
              element-loading-text="正在加载数据..."
              element-loading-spinner="el-icon-loading"
              element-loading-background="rgba(255, 255, 255, 0.8)"
            >
              <el-table-column type="index" label="#" width="56" />
              <el-table-column label="主题分类" min-width="140" show-overflow-tooltip>
                <template slot-scope="scope">{{ rowThemeName(scope.row) }}</template>
              </el-table-column>
              <el-table-column prop="name" label="评测模型名称" min-width="160" show-overflow-tooltip />
              <el-table-column label="评测对象数量" width="120" align="center">
                <template slot-scope="scope">{{ rowObjectCount(scope.row) }}</template>
              </el-table-column>
              <el-table-column label="评测规则数量" width="120" align="center">
                <template slot-scope="scope">{{ rowRuleCount(scope.row) }}</template>
              </el-table-column>
              <el-table-column label="执行策略" min-width="120" show-overflow-tooltip>
                <template slot-scope="scope">{{ rowExecStrategy(scope.row) }}</template>
              </el-table-column>
              <el-table-column label="执行时间" min-width="160" show-overflow-tooltip>
                <template slot-scope="scope">{{ rowExecTime(scope.row) }}</template>
              </el-table-column>
              <el-table-column fixed="right" label="操作" width="300" class-name="op-column">
                <template slot-scope="scope">
                  <div class="op-actions">
                    <el-button type="text" size="small" @click="goDetail(scope.row)">查看</el-button>
                    <el-button type="text" size="small" @click="openEdit(scope.row)">编辑</el-button>
                    <el-button type="text" size="small" @click="goRule(scope.row)">规则</el-button>
                    <el-button type="text" size="small" @click="goTask(scope.row)">任务</el-button>
                    <el-button type="text" size="small" @click="goReport(scope.row)">报告</el-button>
                    <el-button type="text" size="small" @click="remove(scope.row)">删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
              <el-pagination
                :current-page="query.pageNo"
                :page-sizes="[10, 20, 30, 50, 100]"
                :page-size="query.pageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="total"
                @size-change="handleSizeChange"
                @current-change="onPageChange"
              />
            </div>
          </div>
        </el-main>
      </el-container>
    </div>

    <model-form-dialog
      :visible.sync="formVisible"
      :saving="submitLoading"
      :value="formRow"
      @save="onSaveModel"
      @close="formRow = null"
    />
  </div>
</template>

<script>
import { list, create, update, remove, themeTree, exportObservations } from '@/api/qualiteval/model'
import { exportFileFromResponse } from '@/utils/download-util'
import { defaultThemeTree } from '@/views/qualiteval/components/modelThemeMock'
import ModelFormDialog from '@/views/qualiteval/components/ModelFormDialog.vue'

function flattenThemeTree(nodes, acc = []) {
  for (const n of nodes || []) {
    if (n == null) continue
    acc.push({ id: n.id, name: n.name })
    if (n.children && n.children.length) flattenThemeTree(n.children, acc)
  }
  return acc
}

export default {
  name: 'QualitevalModelManage',
  components: { ModelFormDialog },
  data() {
    return {
      loading: false,
      exporting: false,
      submitLoading: false,
      list: [],
      total: 0,
      query: { name: '', themeId: undefined, pageNo: 1, pageSize: 10 },
      themeTreeData: [],
      treeFilter: '',
      treeProps: { label: 'name', children: 'children' },
      selectedThemeId: undefined,
      formVisible: false,
      formRow: null
    }
  },
  computed: {
    themeFlat() {
      return flattenThemeTree(this.themeTreeData)
    }
  },
  created() {
    this.initThemes()
    this.loadList()
  },
  methods: {
    async initThemes() {
      try {
        const res = await themeTree()
        const raw = (res && res.data) != null ? res.data : res
        const arr = Array.isArray(raw) ? raw : (raw && raw.records) || []
        this.themeTreeData = arr.length ? arr : defaultThemeTree()
      } catch (e) {
        this.themeTreeData = defaultThemeTree()
      }
      this.$nextTick(() => this.applyTreeFilter())
    },
    onTreeFilter() {
      this.applyTreeFilter()
    },
    applyTreeFilter() {
      if (this.$refs.themeTree) this.$refs.themeTree.filter(this.treeFilter)
    },
    filterThemeNode(value, data) {
      if (!value) return true
      return String(data.name || '').toLowerCase().includes(String(value).toLowerCase())
    },
    onThemeNodeClick(data) {
      if (!data || data.id == null) {
        this.selectedThemeId = undefined
        this.query.themeId = undefined
      } else {
        this.selectedThemeId = data.id
        this.query.themeId = data.id
      }
      this.loadList(true)
    },
    rowThemeName(row) {
      if (row.themeName) return row.themeName
      if (row.theme_name) return row.theme_name
      const tid = row.themeId != null ? row.themeId : row.theme_id
      const hit = this.themeFlat.find((x) => String(x.id) === String(tid))
      return hit ? hit.name : '—'
    },
    rowObjectCount(row) {
      const v = row.objectCount ?? row.evaluateObjectCount ?? row.object_count ?? row.evalObjectCount
      return v != null ? v : '—'
    },
    rowRuleCount(row) {
      const v = row.ruleCount ?? row.rule_count ?? row.evalRuleCount
      return v != null ? v : '—'
    },
    rowExecStrategy(row) {
      return row.execStrategy || row.exec_strategy || row.scheduleLabel || row.cronDesc || '—'
    },
    rowExecTime(row) {
      return row.lastExecTime || row.execTime || row.last_exec_time || row.executeTime || '—'
    },
    async loadList(reset = false) {
      if (reset) this.query.pageNo = 1
      this.loading = true
      try {
        const res = await list(this.query)
        const data = (res && res.data) || {}
        this.list = data.records || data.list || []
        this.total = data.total != null ? data.total : 0
      } finally {
        this.loading = false
      }
    },
    handleSizeChange(size) {
      this.query.pageSize = size
      this.query.pageNo = 1
      this.loadList()
    },
    onPageChange(page) {
      this.query.pageNo = page
      this.loadList()
    },
    openCreate() {
      this.formRow = null
      this.formVisible = true
    },
    openEdit(row) {
      this.formRow = { ...row }
      this.formVisible = true
    },
    async onSaveModel(payload) {
      this.submitLoading = true
      try {
        const body = {
          name: (payload.name || '').trim(),
          description: payload.description || '',
          datasourceId: payload.datasourceId,
          tablePattern: (payload.tablePattern != null && String(payload.tablePattern).trim() !== '')
            ? String(payload.tablePattern).trim()
            : '%',
          status: payload.status != null && payload.status !== '' ? String(payload.status) : 'ACTIVE',
          relationMappings: Array.isArray(payload.relationMappings) ? payload.relationMappings : []
        }
        body.associationMappings = body.relationMappings
        body.relationMappingsJson = JSON.stringify(body.relationMappings)
        if (payload.id) body.id = payload.id
        if (payload.id) await update(body)
        else await create(body)
        this.$message.success('保存成功')
        this.formVisible = false
        this.formRow = null
        this.loadList()
      } catch (e) {
        console.error(e)
      } finally {
        this.submitLoading = false
      }
    },
    remove(row) {
      this.$confirm('确认删除该模型？关联规则与任务可能受影响。', '提示', { type: 'warning' })
        .then(async() => {
          await remove(row.id)
          this.$message.success('删除成功')
          this.loadList()
        })
        .catch(() => {})
    },
    goDetail(row) {
      this.$router.push({ name: 'QualitevalModelDetail', params: { id: String(row.id) }})
    },
    goRule(row) {
      this.$router.push({ path: '/qualiteval/rule', query: { modelId: row.id }})
    },
    goTask(row) {
      this.$router.push({ path: '/qualiteval/task', query: { modelId: row.id }})
    },
    goReport(row) {
      this.$router.push({ path: `/qualiteval/report/${row.id}` })
    },
    async exportAll() {
      this.exporting = true
      try {
        const params = {}
        if (this.query.themeId != null && this.query.themeId !== '') params.themeId = this.query.themeId
        const resp = await exportObservations(params)
        exportFileFromResponse(resp, `qualiteval-observations-${Date.now()}.xlsx`)
        this.$message.success('导出成功')
      } catch (e) {
        if (e && e.response && e.response.status === 404) {
          this.$message.warning('导出接口未就绪，请稍后重试')
        }
      } finally {
        this.exporting = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.model-page {
  height: calc(100vh - 84px);
  background: radial-gradient(circle at 15% 20%, #eef4ff 0%, #f6f9ff 55%, #f7f8fb 100%);
  padding: 14px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.body {
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.manage-layout {
  flex: 1;
  min-height: 0;
  height: 100%;
  background: transparent;
}

.theme-aside {
  margin-right: 12px;
  padding: 14px 12px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9eef8;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.06);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.aside-head {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.theme-tree {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.tree-node-icon {
  color: #409eff;
}
.tree-node-label {
  color: #31415f;
}

.main-panel {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
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
  overflow: hidden;
}

.toolbar-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 10px;

  .search-left {
    display: flex;
    align-items: center;
    gap: 8px;
    .label {
      font-size: 13px;
      font-weight: 500;
      color: #6a7486;
      white-space: nowrap;
    }
    .search-input {
      width: 220px;
    }
  }
  .search-right {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
}

.list ::v-deep .el-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #edf2fb;
  border-radius: 8px;
  overflow: hidden;

  th {
    background-color: #f8faff !important;
    color: #31415f;
    font-weight: 600;
    border-bottom: 1px solid #edf2fb;
    height: 44px;
  }
  td {
    padding: 10px 0;
    border-bottom: 1px solid #edf2fb;
    color: #4b566a;
  }
  .el-table__body-wrapper {
    flex: 1;
    overflow-y: auto;
  }
}

.pagination-wrapper {
  margin-top: 16px;
  text-align: right;
  flex-shrink: 0;
}

.op-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 4px;
}

.list ::v-deep td.op-column .cell {
  white-space: normal !important;
  line-height: 22px;
}
</style>
