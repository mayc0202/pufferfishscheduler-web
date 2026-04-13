<template>
  <div class="table-input-config">
    <div class="config-content">
      <FlowConfigHero
        badge="输入"
        title="关系库表输入"
        description="从关系型数据库按表或自定义 SQL 读取数据，作为下游步骤的数据源。"
        tone="azure"
        icon="el-icon-coin"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <div v-show="activeTab === 'basic'" class="basic-form">
      <div class="form-field">
        <label class="field-label required">步骤名称</label>
        <input
          v-model="formData.name"
          type="text"
          class="form-control"
          placeholder="关系库表输入"
        >
      </div>

      <div class="form-field">
        <label class="field-label">说明</label>
        <textarea
          v-model="formData.description"
          class="form-control form-textarea"
          placeholder="请输入说明"
          rows="3"
        />
      </div>

      <div class="form-field">
        <label class="field-label required">数据源</label>
        <el-cascader
          v-model="formData.dataSourceId"
          class="relation-db-cascader"
          :options="dbCascaderOptions"
          :props="dbCascaderProps"
          filterable
          clearable
          placeholder="请选择数据源"
          separator=" / "
          popper-class="relation-db-cascader-popper"
          @visible-change="onDbCascaderVisible"
        >
          <template slot-scope="{ data }">
            <span class="mq-node">
              <i :class="data.type === 'GROUP' ? 'el-icon-folder' : 'el-icon-link'" class="mq-node-icon" />
              <span class="mq-node-label">{{ data.label }}</span>
            </span>
          </template>
        </el-cascader>
      </div>

      <div class="form-field">
        <label class="field-label required">配置方式</label>
        <el-select
          v-model="formData.configMode"
          class="config-mode-select"
          placeholder="请选择配置方式"
          :clearable="false"
        >
          <el-option label="自定义SQL" value="custom" />
        </el-select>
      </div>

      <!-- 参考稿：自定义 SQL 与两个复选框为表单末尾一组 -->
      <div class="form-field sql-field">
        <div class="sql-field-head">
          <label class="field-label required sql-field-label">自定义sql</label>
          <button type="button" class="sql-fullscreen-btn" @click="sqlFullscreenVisible = true">
            <i class="el-icon-full-screen" />
            <span>全屏</span>
          </button>
        </div>
        <div class="sql-block">
          <div class="sql-editor-panel">
            <div class="sql-editor-body">
              <div ref="sqlGutter" class="sql-gutter" @scroll.prevent>
                <div
                  v-for="n in sqlLineCount"
                  :key="'ln-' + n"
                  class="sql-gutter-line"
                >{{ n }}</div>
              </div>
              <textarea
                ref="sqlTextarea"
                v-model="formData.sql"
                class="sql-editor"
                placeholder="请输入 SQL，例如：select * from user limit 10"
                rows="10"
                spellcheck="false"
                @scroll="syncSqlScroll"
              />
            </div>
            <div class="sql-options-bar">
              <div class="sql-options-row">
                <div class="sql-option">
                  <el-checkbox v-model="formData.replaceVariables">替换SQL语句里的变量</el-checkbox>
                  <el-tooltip
                    content="开启后，将按流程变量替换 SQL 中的占位符（如 ${name}）。"
                    placement="top"
                    effect="dark"
                  >
                    <span class="help-icon" tabindex="0" role="button" aria-label="变量替换说明">?</span>
                  </el-tooltip>
                </div>
                <div class="sql-option">
                  <el-checkbox v-model="formData.isIncrement">是否增量</el-checkbox>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template v-if="formData.isIncrement">
        <div class="form-field">
          <label class="field-label required">增量方式</label>
          <el-select
            v-model="formData.incrementType"
            class="config-mode-select"
            placeholder="请选择增量方式"
            clearable
          >
            <el-option
              v-for="opt in incrementTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>

        <div class="form-field">
          <label class="field-label required">增量字段</label>
          <el-select
            v-model="formData.incrementField"
            class="config-mode-select"
            placeholder="请选择增量字段"
            filterable
            clearable
            :disabled="!incrementColumnOptions.length"
          >
            <el-option
              v-for="name in incrementColumnOptions"
              :key="name"
              :label="name"
              :value="name"
            />
          </el-select>
        </div>

        <div class="form-field">
          <label class="field-label required">目标库</label>
          <el-cascader
            v-model="formData.incrementTargetDataSourceId"
            class="relation-db-cascader"
            :options="dbCascaderOptions"
            :props="dbCascaderProps"
            filterable
            clearable
            placeholder="请选择目标库"
            separator=" / "
            popper-class="relation-db-cascader-popper"
            @change="onIncrementTargetDbChange"
          >
            <template slot-scope="{ data }">
              <span class="mq-node">
                <i :class="data.type === 'GROUP' ? 'el-icon-folder' : 'el-icon-link'" class="mq-node-icon" />
                <span class="mq-node-label">{{ data.label }}</span>
              </span>
            </template>
          </el-cascader>
        </div>

        <div class="form-field">
          <label class="field-label required">目标表</label>
          <el-select
            v-model="formData.incrementTargetTable"
            class="config-mode-select"
            placeholder="请选择目标表"
            filterable
            clearable
            :disabled="!formData.incrementTargetDataSourceId || !incrementTargetTableList.length"
            @change="onIncrementTargetTableChange"
          >
            <el-option
              v-for="t in incrementTargetTableList"
              :key="tableRowKey(t)"
              :label="t.name || t"
              :value="t.name || t"
            />
          </el-select>
        </div>

        <div class="form-field">
          <label class="field-label required">目标表字段</label>
          <el-select
            v-model="formData.incrementTargetTableField"
            class="config-mode-select"
            placeholder="请选择目标表字段"
            filterable
            clearable
            :disabled="!incrementColumnOptions.length"
          >
            <el-option
              v-for="name in incrementColumnOptions"
              :key="'tf-' + name"
              :label="name"
              :value="name"
            />
          </el-select>
        </div>
      </template>
      </div>

      <div v-show="activeTab === 'advanced'" class="advanced-layout">
        <div class="section-header" @click="sectionOpen.distribution = !sectionOpen.distribution">
          <h4>数据分发</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.distribution ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.distribution" class="section-content">
          <div class="advanced-row">
            <span class="advanced-label">数据分发模式：</span>
            <el-radio-group v-model="distributionMode">
              <el-radio :label="'copy'">复制</el-radio>
              <el-radio :label="'distribute'">分发</el-radio>
            </el-radio-group>
          </div>
        </div>

        <div class="section-header" @click="sectionOpen.parallel = !sectionOpen.parallel">
          <h4>并发配置</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.parallel ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.parallel" class="section-content">
          <div class="form-field">
            <label class="field-label">并发数量</label>
            <input v-model.number="formData.copiesCache" type="number" min="1" class="form-control" placeholder="1">
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn preview-btn" @click="previewData">预览数据</button>
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <el-dialog
      :visible.sync="previewVisible"
      title="预览数据"
      width="90%"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      custom-class="table-input-preview-dialog"
    >
      <div class="preview-body">
        <el-table
          v-loading="previewLoading"
          :data="previewTableData"
          border
          style="width: 100%"
          max-height="500"
        >
          <el-table-column
            type="index"
            label="#"
            width="60"
          />
          <el-table-column
            v-for="(column, index) in previewColumns"
            :key="index"
            :prop="column"
            :label="column"
            show-overflow-tooltip
            min-width="150"
          />
        </el-table>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="previewVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="sqlFullscreenVisible"
      title="自定义 SQL"
      width="85%"
      top="5vh"
      append-to-body
      :close-on-click-modal="false"
      custom-class="table-input-sql-fullscreen-dialog"
      @opened="onSqlFullscreenOpened"
    >
      <div class="sql-fullscreen-editor-wrap">
        <textarea
          ref="sqlFullscreenTextarea"
          v-model="formData.sql"
          class="sql-editor-fullscreen"
          rows="22"
          spellcheck="false"
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="sqlFullscreenVisible = false">完成</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { relationalDbTree } from '@/api/database/database/dbGroup'
import { dbTableList, fieldList } from '@/api/database/database/database'
import { previewData as previewDataApi } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

export default {
  name: 'TableInputConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
    },
    flowId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        distribution: false,
        parallel: false
      },
      dbList: [],
      processedOptions: [],
      sqlFullscreenVisible: false,
      previewVisible: false,
      previewLoading: false,
      previewTableData: [],
      previewColumns: [],
      incrementTargetTableList: [],
      incrementTargetRawFields: [],
      /** 与后端 DatabaseEditor#spellIncrementSql 的 incrementType 取值需一致，可按库类型扩展 */
      incrementTypeOptions: [
        { label: '时间戳', value: 'TIMESTAMP' },
        { label: '日期时间', value: 'DATETIME' },
        { label: '数值/主键', value: 'NUMBER' }
      ]
    }
  },
  computed: {
    distributionMode: {
      get() {
        return this.formData.distributeType ? 'copy' : 'distribute'
      },
      set(v) {
        this.$set(this.formData, 'distributeType', v === 'copy')
      }
    },
    dbCascaderOptions() {
      return (this.processedOptions || []).map((g) => ({
        value: g.value,
        label: g.label,
        type: 'GROUP',
        children: (g.children || []).map((c) => ({
          value: c.value,
          label: c.label,
          type: 'DATABASE'
        }))
      }))
    },
    dbCascaderProps() {
      return {
        expandTrigger: 'hover',
        value: 'value',
        label: 'label',
        children: 'children',
        emitPath: false
      }
    },
    sqlLineCount() {
      const s = this.formData.sql || ''
      const n = s.split('\n').length
      return Math.max(1, n)
    },
    incrementColumnOptions() {
      return (this.incrementTargetRawFields || [])
        .map((f) => (f && (f.name || f.fieldName)) || '')
        .filter(Boolean)
    }
  },
  watch: {
    'formData.dataSourceId': {
      handler(val) {
        const id = val == null || val === '' ? '' : String(val)
        this.$set(this.formData, 'dbConnection', id)
      },
      immediate: true
    },
    'formData.isIncrement'(v) {
      if (v) {
        this.$nextTick(() => this.hydrateIncrementUiFromForm())
      }
    }
  },
  mounted() {
    this.initAdvancedDefaults()
    this.initIncrementFields()
    this.loadDbData().then(() => {
      this.$nextTick(() => this.hydrateIncrementUiFromForm())
    })
  },
  methods: {
    initAdvancedDefaults() {
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined) {
        this.$set(this.formData, 'distributeType', false)
      }
      if (!this.formData.configMode) {
        this.$set(this.formData, 'configMode', 'custom')
      }
    },
    initIncrementFields() {
      const keys = [
        'incrementType',
        'incrementField',
        'incrementTargetDataSourceId',
        'incrementTargetTableId',
        'incrementTargetTable',
        'incrementTargetTableField'
      ]
      keys.forEach((k) => {
        if (this.formData[k] === undefined) {
          this.$set(this.formData, k, '')
        }
      })
    },
    tableRowKey(t) {
      if (t == null) return ''
      return t.id != null ? String(t.id) : String(t.name || t)
    },
    onIncrementTargetDbChange() {
      this.$set(this.formData, 'incrementTargetTable', '')
      this.$set(this.formData, 'incrementTargetTableId', '')
      this.$set(this.formData, 'incrementField', '')
      this.$set(this.formData, 'incrementTargetTableField', '')
      this.incrementTargetTableList = []
      this.incrementTargetRawFields = []
      const id = this.formData.incrementTargetDataSourceId
      if (id != null && id !== '') {
        this.loadIncrementTargetTables(String(id))
      }
    },
    async loadIncrementTargetTables(dbId) {
      if (!dbId) {
        this.incrementTargetTableList = []
        return
      }
      try {
        const res = await dbTableList(dbId)
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          this.incrementTargetTableList = res.data
        } else {
          this.incrementTargetTableList = []
        }
      } catch (e) {
        console.error('加载目标表列表失败:', e)
        this.incrementTargetTableList = []
      }
    },
    onIncrementTargetTableChange(tableName) {
      this.$set(this.formData, 'incrementField', '')
      this.$set(this.formData, 'incrementTargetTableField', '')
      this.incrementTargetRawFields = []
      if (!tableName) {
        this.$set(this.formData, 'incrementTargetTableId', '')
        return
      }
      const row = (this.incrementTargetTableList || []).find(
        (t) => (t && (t.name || t)) === tableName
      )
      const tid = row && row.id != null ? row.id : ''
      this.$set(this.formData, 'incrementTargetTableId', tid)
      if (tid !== '' && tid != null) {
        this.loadIncrementTargetFields(tid)
      }
    },
    async loadIncrementTargetFields(tableId) {
      if (tableId === '' || tableId == null) {
        this.incrementTargetRawFields = []
        return
      }
      try {
        const res = await fieldList(tableId)
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          this.incrementTargetRawFields = res.data
        } else {
          this.incrementTargetRawFields = []
        }
      } catch (e) {
        console.error('加载目标表字段失败:', e)
        this.incrementTargetRawFields = []
      }
    },
    async hydrateIncrementUiFromForm() {
      if (!this.formData.isIncrement) return
      const ds = this.formData.incrementTargetDataSourceId
      if (ds != null && ds !== '') {
        await this.loadIncrementTargetTables(String(ds))
        const tname = this.formData.incrementTargetTable
        let tid = this.formData.incrementTargetTableId
        if ((!tid || tid === '') && tname) {
          const row = (this.incrementTargetTableList || []).find(
            (x) => (x && (x.name || x)) === tname
          )
          if (row && row.id != null) {
            tid = row.id
            this.$set(this.formData, 'incrementTargetTableId', tid)
          }
        }
        if (tid !== '' && tid != null) {
          await this.loadIncrementTargetFields(tid)
        }
      }
    },
    validateIncrementBlock() {
      if (!this.formData.isIncrement) return true
      if (!this.formData.incrementType) {
        this.$message.warning('请选择增量方式')
        return false
      }
      if (!this.formData.incrementField) {
        this.$message.warning('请选择增量字段')
        return false
      }
      if (!this.formData.incrementTargetDataSourceId) {
        this.$message.warning('请选择目标库')
        return false
      }
      if (!this.formData.incrementTargetTable) {
        this.$message.warning('请选择目标表')
        return false
      }
      if (!this.formData.incrementTargetTableField) {
        this.$message.warning('请选择目标表字段')
        return false
      }
      return true
    },
    buildTableInputDataPayload() {
      const payload = {
        name: this.formData.name,
        description: this.formData.description,
        dataSourceId: this.formData.dataSourceId,
        dbConnection: this.formData.dbConnection,
        sql: this.formData.sql,
        replaceVariable: this.formData.replaceVariables,
        increment: !!this.formData.isIncrement,
        rowLimit: this.formData.rowLimit || '0',
        configMode: this.formData.configMode || 'custom'
      }
      if (this.formData.isIncrement) {
        payload.incrementType = this.formData.incrementType
        payload.incrementField = this.formData.incrementField
        payload.incrementTargetDataSourceId = this.formData.incrementTargetDataSourceId
        payload.incrementTargetTableId = this.formData.incrementTargetTableId
        payload.incrementTargetTable = this.formData.incrementTargetTable
        payload.incrementTargetTableField = this.formData.incrementTargetTableField
      }
      return payload
    },
    syncSqlScroll() {
      const ed = this.$refs.sqlTextarea
      const gut = this.$refs.sqlGutter
      if (ed && gut) {
        gut.scrollTop = ed.scrollTop
      }
    },
    onSqlFullscreenOpened() {
      this.$nextTick(() => {
        const el = this.$refs.sqlFullscreenTextarea
        if (el && typeof el.focus === 'function') el.focus()
      })
    },
    async onDbCascaderVisible(visible) {
      if (!visible) return
      if (!this.dbList.length) {
        await this.loadDbData()
      }
    },
    async loadDbData() {
      try {
        const res = await relationalDbTree()
        if (res && res.code === '000000' && res.data) {
          this.$set(this, 'dbList', res.data)
          this.processData()
        } else {
          console.error('接口返回数据格式错误：', res)
          this.$message.error('获取数据源列表失败')
          this.$set(this, 'processedOptions', [])
        }
      } catch (error) {
        console.error('获取数据失败:', error)
        this.$message.error('获取数据源列表失败')
        this.$set(this, 'processedOptions', [])
      }
    },
    /**
     * 处理数据源数据，转换为树状结构
     */
    processData() {
      if (!this.dbList || this.dbList.length === 0) {
        this.processedOptions = []
        return
      }

      const result = []
      for (const group of this.dbList) {
        if (!group || group.type !== 'GROUP') continue
        if (!group.children || !Array.isArray(group.children)) continue

        const children = []
        for (const child of group.children) {
          if (child && child.type === 'DATABASE') {
            children.push({
              value: String(child.id),
              label: child.name
            })
          }
        }

        if (children.length > 0) {
          result.push({
            value: String(group.id),
            label: group.name || '未知分组',
            children: children
          })
        }
      }

      this.$set(this, 'processedOptions', result)
      if (this.formData.dataSourceId != null && this.formData.dataSourceId !== '') {
        this.$set(this.formData, 'dataSourceId', String(this.formData.dataSourceId))
      }
    },
    /**
     * 预览数据
     */
    async previewData() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在')
        return
      }
      if (!this.formData.name) {
        this.$message.warning('请先输入步骤名称')
        return
      }
      if (!this.formData.dataSourceId) {
        this.$message.warning('请先选择数据源')
        return
      }
      if (!this.formData.sql) {
        this.$message.warning('请先输入自定义SQL')
        return
      }
      if (!this.validateIncrementBlock()) {
        return
      }

      this.previewVisible = true
      this.previewLoading = true
      this.previewTableData = []
      this.previewColumns = []

      try {
        const config = {
          name: this.formData.name,
          code: 'TableInput',
          data: this.buildTableInputDataPayload()
        }

        var data = {
          id: this.flowId,
          config: JSON.stringify(config)
        }
        const res = await previewDataApi(data)
        if (res.code === '000000' && res.data) {
          // 适配新的接口返回格式：fieldList（字段列表）和 dataList（数据列表）
          if (res.data.fieldList && res.data.fieldList.length > 0) {
            this.previewColumns = res.data.fieldList
            // 将数组的数组转换为对象数组，方便 el-table 展示
            if (res.data.dataList && res.data.dataList.length > 0) {
              this.previewTableData = res.data.dataList.map(row => {
                const obj = {}
                res.data.fieldList.forEach((field, index) => {
                  obj[field] = row[index]
                })
                return obj
              })
            } else {
              this.previewTableData = []
            }
          } else {
            this.previewColumns = []
            this.previewTableData = []
          }
        } else {
          this.$message.error(res.message || '获取预览数据失败')
        }
      } catch (error) {
        console.error('预览数据失败:', error)
        this.$message.error('预览数据失败')
      } finally {
        this.previewLoading = false
      }
    },
    handleSubmit() {
      if (!this.formData.name) {
        this.$message.warning('请输入步骤名称')
        return
      }
      if (!this.formData.dataSourceId) {
        this.$message.warning('请选择数据源')
        return
      }
      if (!this.formData.sql) {
        this.$message.warning('请输入自定义SQL')
        return
      }
      if (!this.validateIncrementBlock()) {
        return
      }

      this.formData.replaceVariable = this.formData.replaceVariables
      this.formData.increment = this.formData.isIncrement
      this.formData.rowLimit = this.formData.rowLimit || '0'
      if (!this.formData.configMode) {
        this.$set(this.formData, 'configMode', 'custom')
      }

      this.$emit('save')
    }
  }
}
</script>

<style scoped>
.table-input-config {
  width: 100%;
}

/* 抽屉 body 已有 24px 内边距，此处不再叠加，避免过窄与参考稿不符 */
.config-content {
  padding: 0;
}

.config-tabs {
  margin: 0 0 4px;
}

/* Tabs：参考稿 — 激活项底部约 2px 主题条，未选中为灰字 */
.config-tabs ::v-deep .el-tabs__header {
  margin: 0 0 12px;
}

.config-tabs ::v-deep .el-tabs__nav-wrap::after {
  height: 1px;
  background-color: #ebeef5;
}

.config-tabs ::v-deep .el-tabs__item {
  height: 42px;
  line-height: 42px;
  padding: 0 4px;
  margin-right: 28px;
  font-size: 14px;
  color: #909399;
}

.config-tabs ::v-deep .el-tabs__item.is-active {
  color: #303133;
  font-weight: 500;
}

.config-tabs ::v-deep .el-tabs__active-bar {
  height: 2px;
  border-radius: 1px;
  background-color: #409eff;
}

.config-tabs ::v-deep .el-tabs__nav-wrap {
  padding-bottom: 0;
}

.basic-form {
  padding-top: 0;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #ebeef5;
  line-height: 1.5;
}

.form-field {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.sql-field {
  margin-bottom: 8px;
}

.sql-field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 22px;
}

.sql-field-label {
  margin: 0 !important;
  flex: 1;
  min-width: 0;
}

.field-label {
  font-size: 14px;
  font-weight: 400;
  color: #606266;
  line-height: 1.4;
}

.field-label.required::before {
  content: '*';
  color: #F56C6C;
  margin-right: 4px;
}

.form-control {
  width: 100%;
  padding: 0 12px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  font-size: 14px;
  box-sizing: border-box;
  color: #303133;
  background: #fff;
  transition: border-color 0.2s;
}

.form-control:hover {
  border-color: #C0C4CC;
}

.form-control:focus {
  border-color: #409EFF;
  outline: none;
}

.form-textarea {
  height: auto;
  min-height: 80px;
  padding: 8px 12px;
  resize: vertical;
  line-height: 1.5;
}

.config-mode-select {
  width: 100%;
}

.config-mode-select ::v-deep .el-input__inner {
  height: 40px;
  line-height: 40px;
  border-radius: 4px;
}

/* 与参考稿一致：白底、单层细边框，避免多层灰底叠加 */
.sql-block {
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #DCDFE6;
  background: #FFF;
  box-shadow: none;
}

.sql-editor-panel {
  background: #FFF;
}

.sql-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
  padding: 0 12px;
  background: #FFF;
  border-bottom: 1px solid #EBEEF5;
}

.sql-toolbar-placeholder {
  flex: 1;
}

.sql-fullscreen-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 13px;
  color: #606266;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
}

.sql-fullscreen-btn:hover {
  color: #409EFF;
  background: rgba(64, 158, 255, 0.08);
}

.sql-fullscreen-btn i {
  font-size: 14px;
}

.sql-editor-body {
  display: flex;
  min-height: 220px;
  max-height: 400px;
  background: #FFF;
}

/* 仅行号槽略灰，主编辑区保持白底（参考图） */
.sql-gutter {
  flex-shrink: 0;
  width: 42px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 8px 10px 10px;
  text-align: right;
  background: #F5F7FA;
  border-right: 1px solid #EBEEF5;
  scrollbar-width: none;
}

.sql-gutter::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.sql-gutter-line {
  font-size: 12px;
  line-height: 20px;
  height: 20px;
  color: #C0C4CC;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'Courier New', monospace;
  user-select: none;
}

.sql-editor {
  flex: 1;
  min-width: 0;
  min-height: 220px;
  max-height: 400px;
  padding: 10px 14px;
  border: none;
  font-size: 13px;
  line-height: 20px;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  color: #303133;
  background: #FFF;
  resize: vertical;
  box-sizing: border-box;
  tab-size: 2;
  overflow-y: auto;
}

.sql-editor:focus {
  outline: none;
}

.sql-editor::placeholder {
  color: #C0C4CC;
}

.sql-options-bar {
  padding: 14px 14px 12px;
  background: #FFF;
  border-top: 1px solid #EBEEF5;
}

.sql-options-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 32px;
}

.sql-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sql-option ::v-deep .el-checkbox {
  margin-right: 0;
}

.sql-option ::v-deep .el-checkbox__label {
  font-size: 14px;
  color: #606266;
  padding-left: 8px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  background: #F0F2F5;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 500;
  color: #909399;
  cursor: default;
  transition: background 0.2s, color 0.2s;
}

.help-icon:hover,
.help-icon:focus {
  background: #E4E7ED;
  color: #606266;
  outline: none;
}

/* 底部操作区：右对齐 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid #EBEEF5;
  background: transparent;
}

.btn {
  padding: 0 22px;
  height: 36px;
  line-height: 34px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.preview-btn {
  background: #ECF5FF;
  color: #409EFF;
  border: 1px solid #B3D8FF;
}

.preview-btn:hover {
  background: #D9ECFF;
  border-color: #409EFF;
}

.primary-btn {
  background: #409EFF;
  color: #FFF;
  border: 1px solid #409EFF;
}

.primary-btn:hover {
  background: #66B1FF;
  border-color: #66B1FF;
}

.secondary-btn {
  background: #FFF;
  color: #606266;
  border: 1px solid #DCDFE6;
}

.secondary-btn:hover {
  border-color: #C0C4CC;
  color: #303133;
}

.relation-db-cascader {
  width: 100%;
}

.table-input-config ::v-deep .relation-db-cascader .el-input {
  width: 100%;
}

.table-input-config ::v-deep .relation-db-cascader .el-input__inner {
  height: 40px;
  line-height: 40px;
  border-radius: 4px;
}

.mq-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.mq-node-icon {
  color: #909399;
  font-size: 14px;
}

.mq-node-label {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-desc {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.advanced-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.advanced-label {
  color: #606266;
  font-size: 14px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  margin-top: 4px;
  border-top: 1px solid #ebeef5;
  cursor: pointer;
  user-select: none;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.section-toggle {
  color: #909399;
}

.section-content {
  padding-top: 8px;
  margin-bottom: 8px;
}

</style>

<style>
.table-input-preview-dialog .el-dialog__body {
  padding: 10px 20px 6px;
}

.table-input-preview-dialog .preview-body {
  max-height: 60vh;
  overflow: auto;
}

.table-input-preview-dialog .preview-body .el-table {
  max-width: none;
}

.relation-db-cascader-popper.el-popper[x-placement^='bottom'] {
  margin-top: 6px;
}

.relation-db-cascader-popper {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.relation-db-cascader-popper .el-cascader-menu {
  min-width: 200px;
}

.table-input-sql-fullscreen-dialog .el-dialog__body {
  padding: 12px 20px 8px;
}

.sql-fullscreen-editor-wrap {
  min-height: 50vh;
}

.table-input-sql-fullscreen-dialog .sql-editor-fullscreen {
  width: 100%;
  min-height: 50vh;
  max-height: 70vh;
  padding: 12px 14px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  font-size: 13px;
  line-height: 20px;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  box-sizing: border-box;
  resize: vertical;
  tab-size: 2;
}

.table-input-sql-fullscreen-dialog .sql-editor-fullscreen:focus {
  outline: none;
  border-color: #409EFF;
}
</style>
