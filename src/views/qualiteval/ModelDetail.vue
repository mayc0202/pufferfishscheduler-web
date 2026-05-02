<template>
  <div v-loading="loading" class="detail-page">
    <div class="detail-card">
      <div class="detail-head">
        <div class="title-line">
          <el-button type="text" icon="el-icon-back" @click="goBack">返回</el-button>
          <span class="model-title">{{ info.name || '评测模型' }}</span>
        </div>
        <div class="head-actions">
          <el-button type="primary" size="small" @click="onCopyModel">复制模型</el-button>
          <el-button type="primary" size="small" @click="openEdit">编辑</el-button>
          <el-button type="danger" size="small" plain @click="onClearIssues">清除所有问题</el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="基础信息" name="basic">
          <div class="desc-panel">
            <el-descriptions :column="2" border size="medium" class="info-desc">
              <el-descriptions-item label="评测模型名称">{{ info.name || '—' }}</el-descriptions-item>
              <el-descriptions-item label="状态">{{ info.status || '—' }}</el-descriptions-item>
              <el-descriptions-item label="表匹配规则">{{ info.tablePattern || '—' }}</el-descriptions-item>
              <el-descriptions-item label="主题分类">{{ info.themeName || themeNameById(info.themeId) || '—' }}</el-descriptions-item>
              <el-descriptions-item label="评测对象数量">{{ numOrDash(info.objectCount) }}</el-descriptions-item>
              <el-descriptions-item label="评测规则数量">{{ numOrDash(info.ruleCount) }}</el-descriptions-item>
              <el-descriptions-item label="数据库分类">{{ info.dbCategory || info.db_category || '—' }}</el-descriptions-item>
              <el-descriptions-item label="数据库名称">{{ info.dbName || info.datasourceName || '—' }}</el-descriptions-item>
              <el-descriptions-item label="模型描述" :span="2">{{ info.description || '—' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="评测对象信息" name="objects">
          <div class="tab-toolbar">
            <span class="label">评测对象名称：</span>
            <el-input v-model="objQuery.keyword" size="small" clearable placeholder="请输入关键字" class="tool-input" @keyup.enter.native="filterObjects" />
            <el-button type="primary" size="small" @click="filterObjects">查询</el-button>
            <el-button type="primary" size="small" plain class="tool-right" @click="stubAdd('评测对象')">新增评测对象</el-button>
          </div>
          <el-table :data="pagedObjects" border stripe size="small" class="sub-table">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="dbName" label="数据库名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="objectName" label="评测对象名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="syncMethod" label="同步方式" width="100" />
            <el-table-column prop="incrField" label="增量标识字段" min-width="120" show-overflow-tooltip />
            <el-table-column prop="fieldCount" label="评测字段数量" width="110" align="center" />
            <el-table-column prop="ruleCount" label="评测规则数量" width="110" align="center" />
            <el-table-column label="操作" width="200" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="stubView('评测对象', scope.row)">查看</el-button>
                <el-button type="text" size="small" @click="stubEdit('评测对象', scope.row)">编辑</el-button>
                <el-button type="text" size="small" @click="stubDelete('评测对象', scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              small
              layout="total, prev, pager, next, jumper"
              :total="filteredObjects.length"
              :page-size="objPageSize"
              :current-page.sync="objPage"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="关联关系" name="relations">
          <div class="tab-toolbar">
            <span class="label">规则名称：</span>
            <el-input v-model="relQuery.keyword" size="small" clearable placeholder="请输入关键字" class="tool-input" @keyup.enter.native="noop" />
            <el-button type="primary" size="small" @click="noop">查询</el-button>
            <el-button type="primary" size="small" class="tool-right" @click="stubAdd('关联关系')">新增关联关系</el-button>
          </div>
          <el-table :data="filteredRelations" border stripe size="small" class="sub-table">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="ruleName" label="规则名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="assocTable" label="关联表" min-width="140" show-overflow-tooltip />
            <el-table-column prop="relationType" label="关联关系" width="90" align="center" />
            <el-table-column prop="weight" label="规则权重" width="100" />
            <el-table-column label="状态" width="90" align="center">
              <template slot-scope="scope">
                <span :class="{ 'text-danger': scope.row.enabled === false || scope.row.status === 0 }">{{ relStatusText(scope.row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="stubView('关联关系', scope.row)">查看</el-button>
                <el-button type="text" size="small" @click="stubEdit('关联关系', scope.row)">编辑</el-button>
                <el-button type="text" size="small" @click="stubDelete('关联关系', scope.row)">删除</el-button>
                <el-button type="text" size="small" @click="toggleRel(scope.row)">{{ relToggleLabel(scope.row) }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="评测规则" name="rules">
          <div class="tab-toolbar">
            <span class="label">规则名称：</span>
            <el-input v-model="ruleQuery.name" size="small" clearable placeholder="请输入关键字" class="tool-input" />
            <span class="label pad-left">评测规则：</span>
            <el-select v-model="ruleQuery.type" size="small" placeholder="全部规则" clearable class="tool-select">
              <el-option label="全部规则" value="" />
              <el-option label="内置" value="builtin" />
              <el-option label="SQL" value="sql" />
              <el-option label="MVEL" value="mvel" />
              <el-option label="Java" value="java" />
            </el-select>
            <span class="label pad-left">状态：</span>
            <el-select v-model="ruleQuery.status" size="small" placeholder="请选择" clearable class="tool-select-sm">
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
            <el-button type="primary" size="small" @click="noop">查询</el-button>
            <div class="tool-right-group">
              <el-button type="primary" size="small" @click="goAddRule">新增评测规则</el-button>
              <el-button type="primary" size="small" plain @click="stubAdd('复制规则')">复制规则</el-button>
              <el-button type="primary" size="small" plain icon="el-icon-notebook-2" @click="goRuleLib">规则库</el-button>
            </div>
          </div>
          <el-table :data="filteredRules" border stripe size="small" class="sub-table">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column label="规则名称" min-width="180" show-overflow-tooltip>
              <template slot-scope="scope">
                <i class="el-icon-time name-icon" />
                {{ scope.row.ruleName || scope.row.name }}
              </template>
            </el-table-column>
            <el-table-column prop="objectName" label="评测对象名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="description" label="规则描述" min-width="220" show-overflow-tooltip />
            <el-table-column prop="weight" label="规则权重" width="100" />
            <el-table-column label="状态" width="90" align="center">
              <template slot-scope="scope">
                <span :class="{ 'text-danger': ruleDisabled(scope.row) }">{{ ruleStatusText(scope.row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="stubView('评测规则', scope.row)">查看</el-button>
                <el-button type="text" size="small" @click="goEditRule(scope.row)">编辑</el-button>
                <el-button type="text" size="small" @click="stubDelete('评测规则', scope.row)">删除</el-button>
                <el-button type="text" size="small" @click="toggleRule(scope.row)">{{ ruleToggleLabel(scope.row) }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <model-form-dialog
      :visible.sync="formVisible"
      :saving="submitLoading"
      :value="editPayload"
      @save="onSaveModel"
      @close="editPayload = null"
    />
  </div>
</template>

<script>
import { detail, update, create, copyModel, clearIssues, themeTree } from '@/api/qualiteval/model'
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
  name: 'QualitevalModelDetail',
  components: { ModelFormDialog },
  data() {
    return {
      loading: false,
      activeTab: 'basic',
      info: {},
      themeTreeData: [],
      formVisible: false,
      submitLoading: false,
      editPayload: null,
      objQuery: { keyword: '' },
      objPage: 1,
      objPageSize: 10,
      relQuery: { keyword: '' },
      ruleQuery: { name: '', type: '', status: undefined }
    }
  },
  computed: {
    themeFlat() {
      return flattenThemeTree(this.themeTreeData)
    },
    objectRows() {
      const raw = this.info.objects || this.info.objectList || this.info.evalObjects || []
      if (!Array.isArray(raw) || !raw.length) return this.demoObjects()
      return raw.map((r) => ({
        dbName: r.dbName || r.databaseName || r.datasourceName || '—',
        objectName: r.objectName || r.name || r.tableName || '—',
        syncMethod: r.syncMethod || r.sync_method || (r.incremental ? '增量' : '全量'),
        incrField: r.incrField || r.incrementalField || r.incr_field || '',
        fieldCount: r.fieldCount ?? r.field_count ?? 0,
        ruleCount: r.ruleCount ?? r.rule_count ?? 0
      }))
    },
    filteredObjects() {
      const k = (this.objQuery.keyword || '').trim().toLowerCase()
      let rows = this.objectRows
      if (k) rows = rows.filter((r) => String(r.objectName).toLowerCase().includes(k))
      return rows
    },
    pagedObjects() {
      const start = (this.objPage - 1) * this.objPageSize
      return this.filteredObjects.slice(start, start + this.objPageSize)
    },
    relationRows() {
      const raw = this.info.relations || this.info.relationList || []
      if (!Array.isArray(raw) || !raw.length) return this.demoRelations()
      return raw.map((r) => ({
        id: r.id,
        ruleName: r.ruleName || r.name,
        assocTable: r.assocTable || r.associatedTable || '',
        relationType: r.relationType || r.relation_type || r.mappingType || '',
        weight: this.weightLabel(r.weight ?? r.ruleWeight),
        enabled: r.enabled !== false && r.status !== 0,
        status: r.status
      }))
    },
    filteredRelations() {
      const k = (this.relQuery.keyword || '').trim().toLowerCase()
      let rows = this.relationRows
      if (k) rows = rows.filter((r) => String(r.ruleName).toLowerCase().includes(k))
      return rows
    },
    ruleRows() {
      const raw = this.info.rules || this.info.ruleList || []
      if (!Array.isArray(raw) || !raw.length) return this.demoRules()
      return raw.map((r) => ({
        id: r.id,
        ruleName: r.ruleName || r.name,
        name: r.name,
        objectName: r.objectName || r.evalObjectName || '',
        description: r.description || r.ruleDescription || '',
        weight: this.weightLabel(r.weight ?? r.ruleWeight),
        ruleType: r.ruleType || r.type,
        status: r.status,
        enabled: r.enabled
      }))
    },
    filteredRules() {
      let rows = this.ruleRows
      const nk = (this.ruleQuery.name || '').trim().toLowerCase()
      if (nk) rows = rows.filter((r) => String(r.ruleName || r.name || '').toLowerCase().includes(nk))
      if (this.ruleQuery.type) rows = rows.filter((r) => String(r.ruleType || '').toLowerCase() === String(this.ruleQuery.type).toLowerCase())
      if (this.ruleQuery.status !== undefined && this.ruleQuery.status !== null && this.ruleQuery.status !== '') {
        const want = Number(this.ruleQuery.status)
        rows = rows.filter((r) => (this.ruleDisabled(r) ? 0 : 1) === want)
      }
      return rows
    }
  },
  watch: {
    '$route.params.id'() {
      this.loadDetail()
    }
  },
  created() {
    this.initThemes()
    this.loadDetail()
  },
  methods: {
    noop() {},
    goBack() {
      this.$router.push({ path: '/qualiteval/model' })
    },
    async initThemes() {
      try {
        const res = await themeTree()
        const raw = (res && res.data) != null ? res.data : res
        const arr = Array.isArray(raw) ? raw : (raw && raw.records) || []
        this.themeTreeData = arr.length ? arr : defaultThemeTree()
      } catch (e) {
        this.themeTreeData = defaultThemeTree()
      }
    },
    themeNameById(tid) {
      const hit = this.themeFlat.find((x) => String(x.id) === String(tid))
      return hit ? hit.name : ''
    },
    numOrDash(v) {
      if (v == null || v === '') return '—'
      const n = Number(v)
      return Number.isFinite(n) ? n : v
    },
    normalizeDetail(data) {
      const d = data && typeof data === 'object' ? data : {}
      return {
        id: d.id,
        name: d.name,
        themeId: d.themeId != null ? d.themeId : d.theme_id,
        themeName: d.themeName || d.theme_name,
        description: d.description,
        orderBy: d.orderBy != null ? d.orderBy : d.order_by,
        datasourceId: d.datasourceId != null ? d.datasourceId : d.datasource_id,
        tablePattern: d.tablePattern != null ? d.tablePattern : d.table_pattern,
        status: d.status,
        objectCount: d.objectCount ?? d.object_count ?? d.evaluateObjectCount,
        ruleCount: d.ruleCount ?? d.rule_count,
        dbCategory: d.dbCategory || d.db_category,
        dbName: d.dbName || d.databaseName || d.datasourceName,
        datasourceName: d.datasourceName || d.datasource_name,
        objects: d.objects || d.objectList,
        relations: d.relations || d.relationList,
        rules: d.rules || d.ruleList
      }
    },
    async loadDetail() {
      const id = this.$route.params.id
      if (!id) return
      this.loading = true
      try {
        const res = await detail(id)
        const payload = (res && res.data != null) ? res.data : res
        this.info = this.normalizeDetail(payload)
        if (!this.info.id) this.info.id = id
      } catch (e) {
        this.$message.warning('加载模型详情失败，展示占位数据')
        this.info = {
          id,
          name: `模型 ${id}`,
          themeName: '—',
          objectCount: 0,
          ruleCount: 0,
          dbCategory: '关系型数据库',
          dbName: '—',
          description: ''
        }
      } finally {
        this.loading = false
        this.objPage = 1
      }
    },
    demoObjects() {
      return [
        {
          dbName: this.info.dbName || 'CRM系统(部署测试库)',
          objectName: '员工基本信息 / employee_info',
          syncMethod: '全量',
          incrField: '',
          fieldCount: 0,
          ruleCount: 3
        }
      ]
    },
    demoRelations() {
      return [
        { ruleName: '合同与客户关联检查', assocTable: '', relationType: '1:1', weight: '一般', enabled: false },
        { ruleName: '开票信息与合同关联检查', assocTable: '', relationType: '1:1', weight: '一般', enabled: false },
        { ruleName: '收款信息与发票信息关联检查', assocTable: '', relationType: '1:1', weight: '一般', enabled: false }
      ]
    },
    demoRules() {
      return [
        {
          id: 'demo-1',
          ruleName: '合同金额值域检查',
          objectName: '员工基本信息 employee_info',
          description: '合同金额应不小于10万且不大于1000万',
          weight: '一般',
          ruleType: 'builtin',
          status: 0
        }
      ]
    },
    weightLabel(w) {
      if (w === 1 || w === '1' || w === '轻微') return '轻微'
      if (w === 3 || w === '3' || w === '严重') return '严重'
      if (w === 2 || w === '2' || w === '一般') return '一般'
      return w || '一般'
    },
    relStatusText(row) {
      return row.enabled === false || row.status === 0 ? '禁用' : '启用'
    },
    relToggleLabel(row) {
      return row.enabled === false || row.status === 0 ? '启用' : '禁用'
    },
    toggleRel(row) {
      row.enabled = !(row.enabled !== false && row.status !== 0)
      row.status = row.enabled ? 1 : 0
      this.$message.success('已切换状态（本地，待对接接口）')
    },
    ruleDisabled(row) {
      return row.status === 0 || row.enabled === false
    },
    ruleStatusText(row) {
      return this.ruleDisabled(row) ? '禁用' : '启用'
    },
    ruleToggleLabel(row) {
      return this.ruleDisabled(row) ? '启用' : '禁用'
    },
    toggleRule(row) {
      if (this.ruleDisabled(row)) {
        row.status = 1
        row.enabled = true
      } else {
        row.status = 0
        row.enabled = false
      }
      this.$message.success('已切换状态（本地，待对接接口）')
    },
    filterObjects() {
      this.objPage = 1
    },
    stubAdd(kind) {
      this.$message.info(`${kind}表单待对接后端后完善`)
    },
    stubView(kind, row) {
      this.$message.info(`查看${kind}：${row.ruleName || row.objectName || row.name || ''}`)
    },
    stubEdit(kind, row) {
      this.$message.info(`编辑${kind}：${row.ruleName || row.objectName || row.name || ''}`)
    },
    stubDelete(kind, row) {
      this.$confirm(`确认删除该${kind}？`, '提示', { type: 'warning' })
        .then(() => this.$message.info('删除接口待对接，未执行实际操作'))
        .catch(() => {})
    },
    goRuleLib() {
      this.$router.push({ path: '/qualiteval/rule' })
    },
    goAddRule() {
      this.$router.push({ path: '/qualiteval/rule', query: { modelId: this.info.id, action: 'add' }})
    },
    goEditRule(row) {
      this.$router.push({ path: '/qualiteval/rule', query: { modelId: this.info.id, ruleId: row.id }})
    },
    openEdit() {
      this.editPayload = { ...this.info }
      this.formVisible = true
    },
    async onSaveModel(payload) {
      this.submitLoading = true
      try {
        const body = {
          ...payload,
          relationMappings: Array.isArray(payload.relationMappings) ? payload.relationMappings : []
        }
        body.associationMappings = body.relationMappings
        body.relationMappingsJson = JSON.stringify(body.relationMappings)
        if (payload.id) await update(body)
        else await create(body)
        this.$message.success('保存成功')
        this.formVisible = false
        this.editPayload = null
        await this.loadDetail()
      } catch (e) {
        console.error(e)
      } finally {
        this.submitLoading = false
      }
    },
    async onCopyModel() {
      try {
        const res = await copyModel(this.info.id)
        const newId = (res && res.data && (res.data.id || res.data.newId)) || null
        if (newId) {
          this.$message.success('复制成功')
          this.$router.replace({ name: 'QualitevalModelDetail', params: { id: String(newId) }})
        } else {
          this.$message.info('复制接口未返回新模型 ID，请在后端联调后重试')
        }
      } catch (e) {
        this.$message.warning('复制接口未就绪或调用失败')
      }
    },
    async onClearIssues() {
      try {
        await this.$confirm('确认清除该模型下所有问题数据？', '提示', { type: 'warning' })
        await clearIssues(this.info.id)
        this.$message.success('已清除')
      } catch (e) {
        if (e !== 'cancel') this.$message.warning('清除接口未就绪或调用失败')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: calc(100vh - 84px);
  padding: 14px;
  box-sizing: border-box;
  background: radial-gradient(circle at 15% 20%, #eef4ff 0%, #f6f9ff 55%, #f7f8fb 100%);
}

.detail-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9eef8;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
  padding: 16px 20px 24px;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.title-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-tabs ::v-deep .el-tabs__header {
  margin-bottom: 16px;
}

.desc-panel {
  padding: 4px 0 8px;
}

.info-desc ::v-deep .el-descriptions-item__label {
  width: 140px;
  background: #f5f7fa;
  color: #606266;
}

.tab-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  .label {
    font-size: 13px;
    color: #606266;
    white-space: nowrap;
  }
  .pad-left {
    margin-left: 8px;
  }
  .tool-input {
    width: 200px;
  }
  .tool-select {
    width: 140px;
  }
  .tool-select-sm {
    width: 110px;
  }
  .tool-right {
    margin-left: auto;
  }
  .tool-right-group {
    margin-left: auto;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.sub-table {
  width: 100%;
}

.text-danger {
  color: #f56c6c;
}

.name-icon {
  color: #409eff;
  margin-right: 4px;
}

.pager {
  margin-top: 12px;
  text-align: right;
}
</style>
