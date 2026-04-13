<template>
  <div class="denormalized-config">
    <div class="config-content">
      <FlowConfigHero
        badge="转换"
        title="行转列"
        description="将同一分组下的多行记录折叠为单行，并按键值展开为多列，适合宽表构建。"
        tone="violet"
        icon="el-icon-s-operation"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="行转列">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">分组字段名称：</label>
          <el-select
            v-model="formData.groupField"
            filterable
            clearable
            placeholder="请选择分组字段"
            class="full-select"
            @visible-change="(open) => open && refreshFieldOptions()"
          >
            <el-option
              v-for="fd in availableFieldOptions"
              :key="fd.value"
              :label="fd.label"
              :value="fd.value"
            />
          </el-select>
        </div>

        <div class="form-item">
          <label class="form-label required">
            转换字段名称：
            <el-tooltip placement="top" max-width="440" popper-class="denormalized-transform-hint-popper">
              <div slot="content" class="transform-hint-body">
                <p class="hint-intro">例如：需要将如下学生成绩长表进行行转列，还原为宽表。</p>
                <div class="hint-block-label">转换前（输入流）</div>
                <table class="hint-example-table" aria-hidden="true">
                  <thead>
                    <tr><th>学生姓名</th><th>学科</th><th>分数</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>张三</td><td>语文</td><td>99</td></tr>
                    <tr><td>张三</td><td>数学</td><td>98</td></tr>
                    <tr><td>张三</td><td>英语</td><td>98</td></tr>
                    <tr><td>李四</td><td>语文</td><td>97</td></tr>
                    <tr><td>李四</td><td>数学</td><td>100</td></tr>
                    <tr><td>李四</td><td>英语</td><td>98</td></tr>
                  </tbody>
                </table>
                <div class="hint-block-label">转换后（输出）</div>
                <table class="hint-example-table" aria-hidden="true">
                  <thead>
                    <tr><th>学生姓名</th><th>语文</th><th>数学</th><th>英语</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>张三</td><td>99</td><td>98</td><td>98</td></tr>
                    <tr><td>李四</td><td>97</td><td>100</td><td>98</td></tr>
                  </tbody>
                </table>
                <p class="hint-outro">
                  当输入流中「转换字段名称」的值等于下方「转换字段值」时，将「取值字段名称」列的值写入对应「输出字段名称」列。
                  对应本例：「分组字段名称」填「学生姓名」，「转换字段名称」选「学科」；转换配置中输出列 chinese、math、english 分别对应转换字段值 语文、数学、英语，「取值字段名称」均选「分数」。
                </p>
              </div>
              <i class="el-icon-question help-i" />
            </el-tooltip>
          </label>
          <el-select
            v-model="formData.keyField"
            filterable
            clearable
            placeholder="请选择转换字段名称"
            class="full-select"
            @visible-change="(open) => open && refreshFieldOptions()"
          >
            <el-option
              v-for="fd in availableFieldOptions"
              :key="'k-' + fd.value"
              :label="fd.label"
              :value="fd.value"
            />
          </el-select>
        </div>

        <div class="form-item">
          <label class="form-label required">转换配置：</label>
          <div class="field-mapping">
            <div class="field-table-wrap">
              <el-table
                :data="formData.denormaliserTargetField"
                border
                style="width: 100%"
                max-height="260"
                empty-text="暂无数据"
              >
                <el-table-column type="index" label="#" width="50" />
                <el-table-column label="输出字段名称" min-width="110" prop="targetName" />
                <el-table-column label="转换字段值" min-width="100" prop="keyValue" />
                <el-table-column label="取值字段名称" min-width="110" prop="fieldName" />
              </el-table>
            </div>
            <div class="field-actions">
              <button type="button" class="dash-btn" @click="openEditDialog">
                <i class="el-icon-edit" /> 编辑转换配置
              </button>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="advanced-layout">
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
            <div class="form-item">
              <label class="form-label">
                并发数量：
                <el-tooltip content="步骤多副本并行时的副本数量。" placement="top">
                  <i class="el-icon-question help-i" />
                </el-tooltip>
              </label>
              <input v-model.number="formData.copiesCache" type="number" min="1" class="form-input" placeholder="1">
            </div>
          </div>
        </div>
      </template>

      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <el-dialog
      :visible.sync="editDialog.visible"
      title="编辑转换配置信息"
      width="720px"
      append-to-body
      :close-on-click-modal="false"
      @open="onEditDialogOpen"
    >
      <div class="dialog-hint">
        <el-tooltip placement="right" max-width="440" popper-class="denormalized-transform-hint-popper">
          <div slot="content" class="transform-hint-body">
            <p class="hint-intro">与列转行示例同一套数据：长表行转列为宽表。</p>
            <div class="hint-block-label">转换前（输入流）</div>
            <table class="hint-example-table" aria-hidden="true">
              <thead>
                <tr><th>学生姓名</th><th>学科</th><th>分数</th></tr>
              </thead>
              <tbody>
                <tr><td>张三</td><td>语文</td><td>99</td></tr>
                <tr><td>张三</td><td>数学</td><td>98</td></tr>
                <tr><td>张三</td><td>英语</td><td>98</td></tr>
                <tr><td>李四</td><td>语文</td><td>97</td></tr>
                <tr><td>李四</td><td>数学</td><td>100</td></tr>
                <tr><td>李四</td><td>英语</td><td>98</td></tr>
              </tbody>
            </table>
            <div class="hint-block-label">转换后（输出）</div>
            <table class="hint-example-table" aria-hidden="true">
              <thead>
                <tr><th>学生姓名</th><th>语文</th><th>数学</th><th>英语</th></tr>
              </thead>
              <tbody>
                <tr><td>张三</td><td>99</td><td>98</td><td>98</td></tr>
                <tr><td>李四</td><td>97</td><td>100</td><td>98</td></tr>
              </tbody>
            </table>
            <p class="hint-outro">
              当「转换字段名称」与某行的「转换字段值」相等时，将该行「取值字段名称」的值写入「输出字段名称」列。
            </p>
          </div>
          <span class="hint-link"><i class="el-icon-info" /> 说明</span>
        </el-tooltip>
      </div>
      <el-table :data="editDialog.rows" border max-height="360" empty-text="暂无数据">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="输出字段名称" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.targetName" size="small" placeholder="输出列名" />
          </template>
        </el-table-column>
        <el-table-column label="转换字段值" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.keyValue" size="small" placeholder="请输入转换字段值" />
          </template>
        </el-table-column>
        <el-table-column label="取值字段名称" min-width="140">
          <template slot-scope="scope">
            <el-select v-model="scope.row.fieldName" filterable clearable size="small" placeholder="请选择" style="width:100%">
              <el-option
                v-for="fd in availableFieldOptions"
                :key="'d-' + fd.value + '-' + scope.$index"
                :label="fd.label"
                :value="fd.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="72" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="removeEditRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="add-row-wrap">
        <button type="button" class="dash-btn" @click="addEditRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="applyEditDialog">确定</el-button>
        <el-button @click="editDialog.visible = false">取消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

function emptyTargetRow() {
  return { targetName: '', keyValue: '', fieldName: '' }
}

function normalizeTargetRow(r) {
  if (!r || typeof r !== 'object') return emptyTargetRow()
  const tn = r.targetName != null && String(r.targetName).trim() !== '' ? String(r.targetName).trim() : String(r.targetFieldName || '').trim()
  return {
    targetName: tn,
    keyValue: r.keyValue != null ? String(r.keyValue) : '',
    fieldName: r.fieldName != null ? String(r.fieldName) : ''
  }
}

export default {
  name: 'DenormalizedConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
    },
    flowId: {
      type: [Number, String],
      default: null
    },
    flowConfig: {
      type: Object,
      default: null
    },
    currentNodeId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        distribution: false,
        parallel: false
      },
      availableFieldOptions: [],
      editDialog: {
        visible: false,
        rows: []
      }
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
    }
  },
  watch: {
    flowConfig: {
      handler() {
        this.refreshFieldOptions()
      },
      deep: true
    },
    currentNodeId() {
      this.refreshFieldOptions()
    },
    flowId() {
      this.refreshFieldOptions()
    }
  },
  mounted() {
    this.initDefaults()
    this.refreshFieldOptions()
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', '行转列')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.groupField === undefined) this.$set(this.formData, 'groupField', '')
      if (this.formData.keyField === undefined) this.$set(this.formData, 'keyField', '')
      if (!Array.isArray(this.formData.denormaliserTargetField)) {
        this.$set(this.formData, 'denormaliserTargetField', [])
      } else {
        const normalized = this.formData.denormaliserTargetField.map(normalizeTargetRow)
        this.$set(this.formData, 'denormaliserTargetField', normalized)
      }
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
    },
    buildFlowConfigWithCurrentNode() {
      const base = this.flowConfig ? clone(this.flowConfig) : { cells: [] }
      if (!base.cells || !Array.isArray(base.cells)) base.cells = []
      if (!this.currentNodeId) return base

      const idx = base.cells.findIndex(c => String(c.id) === String(this.currentNodeId))
      if (idx < 0) return base

      const cell = base.cells[idx] || {}
      const cellData = cell.data && typeof cell.data === 'object' ? cell.data : {}
      base.cells[idx] = {
        ...cell,
        data: {
          ...cellData,
          name: this.formData.name,
          code: this.formData.code,
          data: {
            name: this.formData.name,
            code: this.formData.code,
            data: {
              ...this.formData
            }
          }
        }
      }
      return base
    },
    async loadFieldOptionsFromApi() {
      try {
        const mergedFlowConfig = this.buildFlowConfigWithCurrentNode()
        const res = await getFlowFieldStream({
          flowId: this.flowId,
          config: JSON.stringify(mergedFlowConfig),
          stepName: this.formData.name || '行转列',
          code: this.formData.code || 'Denormalized',
          dbId: this.formData.dbId,
          tableId: this.formData.tableId
        })
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          const names = res.data
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
          this.availableFieldOptions = Array.from(new Set(names)).map(n => ({ label: n, value: n }))
          return
        }
        if (res && res.code === '000000' && res.data && Array.isArray(res.data.fieldList)) {
          const names = res.data.fieldList
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
          this.availableFieldOptions = Array.from(new Set(names)).map(n => ({ label: n, value: n }))
          return
        }
        this.availableFieldOptions = []
      } catch (e) {
        this.availableFieldOptions = []
      }
    },
    fillFieldOptionsFromGraph() {
      const cfg = this.flowConfig && Array.isArray(this.flowConfig.cells) ? this.flowConfig : { cells: [] }
      const nodeId = String(this.currentNodeId || '')
      if (!nodeId) {
        this.availableFieldOptions = []
        return
      }

      const nodeMap = new Map()
      const incomingFromIds = []
      cfg.cells.forEach((c) => {
        if (!c) return
        if (c.shape === 'edge') {
          const targetId = String(c?.target?.cell || '')
          if (targetId === nodeId) {
            incomingFromIds.push(String(c?.source?.cell || ''))
          }
        } else {
          nodeMap.set(String(c.id), c)
        }
      })

      const names = []
      incomingFromIds.forEach((sid) => {
        const node = nodeMap.get(sid)
        if (!node) return
        const dataWrap = node.data || {}
        const data = dataWrap.data && typeof dataWrap.data === 'object' ? dataWrap.data : dataWrap

        const pushName = (x) => {
          const n = x && (x.name || x.fieldName || x.fieldStream)
          if (n) names.push(String(n))
        }

        if (Array.isArray(data.fieldList)) data.fieldList.forEach(pushName)
        if (Array.isArray(data.filedList)) data.filedList.forEach(pushName)
      })

      const uniq = Array.from(new Set(names.filter(Boolean)))
      this.availableFieldOptions = uniq.map(n => ({ label: n, value: n }))
    },
    async refreshFieldOptions() {
      const nodeId = String(this.currentNodeId || '')
      if (!nodeId) {
        this.availableFieldOptions = []
        return
      }
      if (this.flowId) {
        await this.loadFieldOptionsFromApi()
        if (this.availableFieldOptions.length) return
      }
      this.fillFieldOptionsFromGraph()
    },
    async openEditDialog() {
      await this.refreshFieldOptions()
      this.editDialog.visible = true
    },
    onEditDialogOpen() {
      const src = Array.isArray(this.formData.denormaliserTargetField) ? this.formData.denormaliserTargetField : []
      this.editDialog.rows = src.length ? clone(src.map(normalizeTargetRow)) : [emptyTargetRow()]
    },
    addEditRow() {
      this.editDialog.rows.push(emptyTargetRow())
    },
    removeEditRow(index) {
      this.editDialog.rows.splice(index, 1)
      if (!this.editDialog.rows.length) this.editDialog.rows.push(emptyTargetRow())
    },
    applyEditDialog() {
      const cleaned = this.editDialog.rows
        .map(normalizeTargetRow)
        .filter(r => r.targetName || r.keyValue || r.fieldName)
      this.$set(this.formData, 'denormaliserTargetField', cleaned)
      this.editDialog.visible = false
    },
    handleSubmit() {
      const name = String(this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      if (!String(this.formData.groupField || '').trim()) {
        this.$message.warning('请选择分组字段名称')
        return
      }
      if (!String(this.formData.keyField || '').trim()) {
        this.$message.warning('请选择转换字段名称')
        return
      }
      const rows = Array.isArray(this.formData.denormaliserTargetField)
        ? this.formData.denormaliserTargetField.map(normalizeTargetRow)
        : []
      const complete = rows.filter(r => r.targetName && r.keyValue !== '' && r.fieldName)
      if (!complete.length) {
        this.$message.warning('请至少配置一行完整的转换配置（输出字段名称、转换字段值、取值字段名称）')
        return
      }
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        const any = r.targetName || r.keyValue !== '' || r.fieldName
        if (!any) continue
        if (!r.targetName || r.keyValue === '' || !r.fieldName) {
          this.$message.warning(`转换配置第 ${i + 1} 行未填写完整，请补全或删除该行`)
          return
        }
      }
      this.$set(this.formData, 'denormaliserTargetField', rows.filter(r => r.targetName && r.keyValue !== '' && r.fieldName))

      const copies = this.formData.copiesCache != null && this.formData.copiesCache !== ''
        ? Math.max(1, Math.trunc(Number(this.formData.copiesCache)))
        : 1
      this.$set(this.formData, 'copiesCache', copies)

      this.$emit('save', this.formData)
    }
  }
}
</script>

<style scoped>
.denormalized-config { height: 100%; }
.config-content { display: flex; flex-direction: column; padding: 20px; }
.config-tabs { margin: 0 0 8px; }
.form-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 12px; }
.form-item { margin-bottom: 16px; display: block; }
.form-label { display: block; width: 100%; text-align: left; line-height: 20px; color: #606266; font-size: 14px; margin-bottom: 8px; }
.form-label.required::before { content: '*'; color: #f56c6c; margin-right: 4px; }
.form-input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; outline: none; box-sizing: border-box; }
.form-textarea { width: 100%; padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; resize: vertical; outline: none; box-sizing: border-box; }
.full-select { width: 100%; }
.help-i { color: #909399; margin-left: 4px; cursor: default; }

.field-mapping { width: 100%; }
.field-table-wrap { width: 100%; }
.field-actions { margin-top: 10px; }
/* 与 RowGenerator 弹窗内「添加行」及主界面「编辑转换配置」一致的虚线按钮 */
.dash-btn {
  width: 100%;
  height: 40px;
  border: 1px dashed #409eff;
  border-radius: 6px;
  background: #fff;
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
}

.dash-btn:hover {
  background: #ecf5ff;
}

.add-row-wrap {
  margin-top: 12px;
}

.advanced-layout { padding-top: 4px; }
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-top: 1px solid #ebeef5; cursor: pointer; user-select: none; }
.section-header h4 { margin: 0; font-size: 14px; font-weight: 600; color: #303133; }
.section-toggle { color: #909399; }
.section-content { padding-top: 8px; margin-bottom: 8px; }
.advanced-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
.advanced-label { font-size: 14px; color: #606266; }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #ebeef5; }
.btn { padding: 0 20px; height: 36px; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; font-size: 14px; background: #fff; color: #606266; }
.primary-btn { background: #409eff; color: #fff; border-color: #409eff; }

.dialog-hint { margin-bottom: 10px; }
.hint-link { font-size: 13px; color: #409eff; cursor: default; }
</style>

<!-- Tooltip 挂载在 body，需非 scoped 样式才能作用于 popper -->
<style>
.denormalized-transform-hint-popper {
  max-width: 440px !important;
}
.denormalized-transform-hint-popper .transform-hint-body {
  line-height: 1.5;
  font-size: 12px;
  text-align: left;
}
.denormalized-transform-hint-popper .hint-intro,
.denormalized-transform-hint-popper .hint-outro {
  margin: 0;
}
.denormalized-transform-hint-popper .hint-intro {
  margin-bottom: 8px;
}
.denormalized-transform-hint-popper .hint-block-label {
  margin: 8px 0 4px;
  font-size: 12px;
  font-weight: 600;
}
.denormalized-transform-hint-popper .hint-example-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}
.denormalized-transform-hint-popper .hint-example-table th,
.denormalized-transform-hint-popper .hint-example-table td {
  border: 1px solid rgba(255, 255, 255, 0.7);
  padding: 4px 6px;
  text-align: center;
  word-break: break-all;
}
.denormalized-transform-hint-popper .hint-outro {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.55;
}
</style>
