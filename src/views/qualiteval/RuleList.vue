<template>
  <div class="rule-page">
    <div class="body">
      <el-container>
        <el-main>
          <div class="list">
            <div class="rule-search">
              <div class="search-left">
                <div class="label">所属模型：</div>
                <el-select
                  v-model="query.modelId"
                  clearable
                  filterable
                  placeholder="全部模型"
                  size="small"
                  class="search-select"
                >
                  <el-option v-for="m in modelOptions" :key="m.id" :label="m.name" :value="m.id" />
                </el-select>
                <div class="label ml">规则名称：</div>
                <el-input
                  v-model="query.ruleName"
                  placeholder="请输入规则名称"
                  size="small"
                  clearable
                  class="search-input"
                />
              </div>
              <div class="search-right">
                <el-button type="primary" icon="el-icon-search" size="small" @click="loadList(true)">查询</el-button>
                <el-button type="primary" size="small" icon="el-icon-plus" @click="openCreate">新增规则</el-button>
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
              <el-table-column prop="ruleName" label="规则名称" min-width="160" show-overflow-tooltip />
              <el-table-column label="所属模型" min-width="130" show-overflow-tooltip>
                <template slot-scope="scope">
                  {{ scope.row.modelName || modelLabel(scope.row.modelId) }}
                </template>
              </el-table-column>
              <el-table-column prop="tableName" label="目标表" min-width="130" show-overflow-tooltip>
                <template slot-scope="scope">
                  {{ scope.row.tableName || scope.row.table_name || '—' }}
                </template>
              </el-table-column>
              <el-table-column prop="fieldName" label="目标字段" min-width="110" show-overflow-tooltip>
                <template slot-scope="scope">
                  {{ scope.row.fieldName || scope.row.field_name || '—' }}
                </template>
              </el-table-column>
              <el-table-column label="规则类型" min-width="120" show-overflow-tooltip>
                <template slot-scope="scope">
                  {{ typeLabel(scope.row.ruleType) }}
                </template>
              </el-table-column>
              <el-table-column label="严重程度" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.severity === 'WARN' ? 'warning' : 'danger'" size="mini" effect="plain">
                    {{ scope.row.severity === 'WARN' ? '警告' : '错误' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="88" show-overflow-tooltip>
                <template slot-scope="scope">
                  {{ scope.row.statusTxt || scope.row.statusLabel || '—' }}
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" min-width="168" show-overflow-tooltip />
              <el-table-column fixed="right" label="操作" width="160" class-name="op-column">
                <template slot-scope="scope">
                  <div class="op-actions">
                    <el-button type="text" size="small" @click="openEdit(scope.row)">编辑</el-button>
                    <el-button type="text" size="small" @click="onDelete(scope.row)">删除</el-button>
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

    <rule-form
      :visible.sync="formVisible"
      :value="currentForm"
      :model-options="modelOptions"
      :rule-type-options="ruleTypeOptions"
      @submit="onSubmit"
    />
  </div>
</template>

<script>
import RuleForm from './RuleForm.vue'
import { list as modelList } from '@/api/qualiteval/model'
import { list, create, update, remove, types } from '@/api/qualiteval/rule'
import { RULE_TYPE_LABEL_MAP } from './ruleConstants'

export default {
  name: 'QualitevalRuleList',
  components: { RuleForm },
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      query: { modelId: '', ruleName: '', pageNo: 1, pageSize: 10 },
      formVisible: false,
      currentForm: {},
      modelOptions: [],
      ruleTypeOptions: []
    }
  },
  watch: {
    '$route.query.modelId'(v) {
      this.query.modelId = v || ''
      this.loadList(true)
    },
    '$route.query.ruleId'() {
      this.loadList(true).then(() => this.tryOpenRuleFromQuery())
    }
  },
  async created() {
    this.query.modelId = this.$route.query.modelId || ''
    await this.loadOptions()
    await this.loadList()
    this.tryOpenRuleFromQuery()
  },
  methods: {
    tryOpenRuleFromQuery() {
      const rid = this.$route.query.ruleId
      if (!rid) return
      const row = this.list.find((r) => String(r.id) === String(rid))
      if (row) this.openEdit(row)
    },
    async loadOptions() {
      const [mRes, tRes] = await Promise.all([modelList({ pageNo: 1, pageSize: 500 }), types()])
      this.modelOptions = (mRes && mRes.data && mRes.data.records) || []
      const raw = (tRes && tRes.data) || {}
      const codes = Array.isArray(raw.types) ? raw.types : (Array.isArray(raw) ? raw : [])
      this.ruleTypeOptions = codes.map((code) => ({
        label: RULE_TYPE_LABEL_MAP[code] || code,
        value: code
      }))
    },
    modelLabel(modelId) {
      if (modelId == null || modelId === '') return '—'
      const m = this.modelOptions.find((x) => String(x.id) === String(modelId))
      return m ? m.name : '—'
    },
    typeLabel(code) {
      if (!code) return '—'
      return RULE_TYPE_LABEL_MAP[code] || code
    },
    async loadList(reset = false) {
      if (reset) this.query.pageNo = 1
      this.loading = true
      try {
        const res = await list(this.query)
        const data = (res && res.data) || {}
        this.list = data.records || []
        this.total = data.total || 0
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
      this.currentForm = { modelId: this.query.modelId || '' }
      this.formVisible = true
    },
    openEdit(row) {
      this.currentForm = { ...row }
      this.formVisible = true
    },
    async onSubmit(payload) {
      let ruleConfig = payload.ruleConfig
      if (ruleConfig != null && typeof ruleConfig === 'object') {
        ruleConfig = JSON.stringify(ruleConfig)
      } else if (payload.expression != null && String(payload.expression).trim() !== '') {
        ruleConfig = JSON.stringify({ expression: String(payload.expression).trim() })
      } else if (ruleConfig == null || ruleConfig === '') {
        ruleConfig = '{}'
      } else if (typeof ruleConfig !== 'string') {
        ruleConfig = JSON.stringify(ruleConfig)
      }
      const body = {
        id: payload.id,
        ruleName: payload.ruleName,
        ruleType: payload.ruleType,
        modelId: payload.modelId,
        tableName: payload.tableName != null && payload.tableName !== '' ? String(payload.tableName) : '',
        fieldName: payload.fieldName != null && payload.fieldName !== '' ? String(payload.fieldName) : '',
        ruleConfig,
        severity: payload.severity || 'ERROR',
        status: payload.status != null && payload.status !== '' ? String(payload.status) : 'ACTIVE'
      }
      if (payload.id) await update(body)
      else await create(body)
      this.$message.success('保存成功')
      this.formVisible = false
      this.loadList()
    },
    onDelete(row) {
      this.$confirm('确认删除该规则？删除后不可恢复。', '提示', { type: 'warning' })
        .then(async() => {
          await remove(row.id)
          this.$message.success('删除成功')
          this.loadList()
        })
        .catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.rule-page {
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

.rule-search {
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
    flex-wrap: wrap;
    gap: 8px;

    .label {
      margin: 0;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 500;
      color: #6a7486;
    }
    .label.ml {
      margin-left: 8px;
    }
    .search-input {
      width: 200px;
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

  ::v-deep .el-pagination {
    .el-pagination__total,
    .el-pagination__jump {
      color: #6a7486;
    }
  }
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
