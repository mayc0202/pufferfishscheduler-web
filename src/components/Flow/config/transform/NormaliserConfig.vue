<template>
  <div class="normaliser-config">
    <div class="config-content">
      <FlowConfigHero
        badge="转换"
        title="列转行"
        description="将键值对或多列结构展开为多行，与行转列互为逆操作。"
        tone="violet"
        icon="el-icon-s-fold"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="列转行">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">
            输出关键字字段名称：
            <el-tooltip placement="top" max-width="440" popper-class="normaliser-transform-hint-popper">
              <div slot="content" class="transform-hint-body">
                <p class="hint-intro">需要将如下学生信息表进行列转行操作。</p>
                <div class="hint-block-label">转换前：</div>
                <table class="hint-example-table" aria-hidden="true">
                  <thead>
                    <tr><th>学生姓名</th><th>语文</th><th>数学</th><th>英语</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>张三</td><td>99</td><td>98</td><td>98</td></tr>
                    <tr><td>李四</td><td>97</td><td>100</td><td>98</td></tr>
                  </tbody>
                </table>
                <div class="hint-block-label">转换后：</div>
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
                <p class="hint-outro">
                  那么，「输出关键字字段名称」填写为「学科」，「输出值字段名称」填写为「分数」。
                </p>
              </div>
              <i class="el-icon-question help-i" />
            </el-tooltip>
          </label>
          <input v-model="formData.keyField" type="text" class="form-input" placeholder="请输入输出关键字字段名称">
        </div>

        <div class="form-item">
          <label class="form-label required">输出值字段名称：</label>
          <input v-model="formData.valueField" type="text" class="form-input" placeholder="请输入输出值字段名称">
        </div>

        <div class="form-item">
          <label class="form-label required">转换配置：</label>
          <div class="field-mapping">
            <div class="field-table-wrap">
              <el-table
                :data="formData.normaliserFields"
                border
                style="width: 100%"
                max-height="260"
                empty-text="暂无数据"
              >
                <el-table-column type="index" label="#" width="50" />
                <el-table-column label="转换字段名称" min-width="120" prop="name" show-overflow-tooltip />
                <el-table-column label="输出关键字字段值" min-width="140" prop="value" show-overflow-tooltip />
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
        <el-tooltip placement="right" max-width="440" popper-class="normaliser-transform-hint-popper">
          <div slot="content" class="transform-hint-body">
            <p class="hint-intro">与上方示例对应：宽表中的科目列（语文、数学、英语）在「转换配置」里逐行配置。</p>
            <div class="hint-block-label">转换前（宽表列）：</div>
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
              「转换字段名称」填上游列名（如 chinese、math、english，须与输入流一致）；「输出关键字字段值」填写入关键字列的显示值（如 语文、数学、英语）。若列名与显示名相同，两列可填相同文字。
            </p>
          </div>
          <span class="hint-link"><i class="el-icon-info" /> 说明</span>
        </el-tooltip>
      </div>
      <el-table :data="editDialog.rows" border max-height="360" empty-text="暂无数据">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="转换字段名称" min-width="160">
          <template slot="header">
            <span class="req-before">转换字段名称</span>
            <el-tooltip placement="top" max-width="440" popper-class="normaliser-transform-hint-popper">
              <div slot="content" class="transform-hint-body">
                <p class="hint-intro">待拆成多行的源列字段名，须与输入流中的列名一致。</p>
                <div class="hint-block-label">转换前（宽表列）：</div>
                <table class="hint-example-table" aria-hidden="true">
                  <thead>
                    <tr><th>学生姓名</th><th>语文</th><th>数学</th><th>英语</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>张三</td><td>99</td><td>98</td><td>98</td></tr>
                    <tr><td>李四</td><td>97</td><td>100</td><td>98</td></tr>
                  </tbody>
                </table>
                <p class="hint-outro">通常「转换字段名称」对应语文、数学、英语等源列的字段名。</p>
              </div>
              <i class="el-icon-question help-i" />
            </el-tooltip>
          </template>
          <template slot-scope="scope">
            <el-input v-model="scope.row.name" size="small" placeholder="请输入转换字段名称" />
          </template>
        </el-table-column>
        <el-table-column label="输出关键字字段值" min-width="180">
          <template slot="header">
            <span class="req-before">输出关键字字段值</span>
          </template>
          <template slot-scope="scope">
            <el-input v-model="scope.row.value" size="small" placeholder="请输入输出关键字字段值" />
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
import FlowConfigHero from '../common/FlowConfigHero.vue'

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

function emptyRow() {
  return { name: '', value: '' }
}

function normalizeRow(r) {
  if (!r || typeof r !== 'object') return emptyRow()
  return {
    name: r.name != null ? String(r.name).trim() : '',
    value: r.value != null ? String(r.value).trim() : ''
  }
}

export default {
  name: 'NormaliserConfig',
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
  mounted() {
    this.initDefaults()
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', '列转行')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.keyField === undefined) this.$set(this.formData, 'keyField', '')
      if (this.formData.valueField === undefined) this.$set(this.formData, 'valueField', '')
      if (!Array.isArray(this.formData.normaliserFields)) {
        this.$set(this.formData, 'normaliserFields', [])
      } else {
        this.$set(this.formData, 'normaliserFields', this.formData.normaliserFields.map(normalizeRow))
      }
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
    },
    openEditDialog() {
      this.editDialog.visible = true
    },
    onEditDialogOpen() {
      const src = Array.isArray(this.formData.normaliserFields) ? this.formData.normaliserFields : []
      this.editDialog.rows = src.length ? clone(src.map(normalizeRow)) : [emptyRow()]
    },
    addEditRow() {
      this.editDialog.rows.push(emptyRow())
    },
    removeEditRow(index) {
      this.editDialog.rows.splice(index, 1)
      if (!this.editDialog.rows.length) this.editDialog.rows.push(emptyRow())
    },
    applyEditDialog() {
      const cleaned = this.editDialog.rows
        .map(normalizeRow)
        .filter(r => r.name || r.value)
      this.$set(this.formData, 'normaliserFields', cleaned)
      this.editDialog.visible = false
    },
    handleSubmit() {
      const name = String(this.formData.name || '').trim()
      if (!name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      if (!String(this.formData.keyField || '').trim()) {
        this.$message.warning('请填写输出关键字字段名称')
        return
      }
      if (!String(this.formData.valueField || '').trim()) {
        this.$message.warning('请填写输出值字段名称')
        return
      }
      const rows = Array.isArray(this.formData.normaliserFields)
        ? this.formData.normaliserFields.map(normalizeRow)
        : []
      const complete = rows.filter(r => r.name && r.value)
      if (!complete.length) {
        this.$message.warning('请至少配置一行完整的转换配置（转换字段名称与输出关键字字段值）')
        return
      }
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        if (!r.name && !r.value) continue
        if (!r.name || !r.value) {
          this.$message.warning(`转换配置第 ${i + 1} 行未填写完整，请补全或删除该行`)
          return
        }
      }
      this.$set(this.formData, 'normaliserFields', complete)

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
.normaliser-config { height: 100%; }
.config-content { display: flex; flex-direction: column; padding: 20px; }
.config-tabs { margin: 0 0 8px; }
.form-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 12px; }
.form-item { margin-bottom: 16px; display: block; }
.form-label { display: block; width: 100%; text-align: left; line-height: 20px; color: #606266; font-size: 14px; margin-bottom: 8px; }
.form-label.required::before { content: '*'; color: #f56c6c; margin-right: 4px; }
.form-input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; outline: none; box-sizing: border-box; }
.form-textarea { width: 100%; padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; resize: vertical; outline: none; box-sizing: border-box; }
.help-i { color: #909399; margin-left: 4px; cursor: default; }
.req-before::before { content: '*'; color: #f56c6c; margin-right: 2px; }

.field-mapping { width: 100%; }
.field-table-wrap { width: 100%; }
.field-actions { margin-top: 10px; }
/* 与 RowGenerator / PrintLog 弹窗内「添加行」一致的虚线整行按钮 */
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
.normaliser-transform-hint-popper {
  max-width: 440px !important;
}
.normaliser-transform-hint-popper .transform-hint-body {
  line-height: 1.5;
  font-size: 12px;
  text-align: left;
}
.normaliser-transform-hint-popper .hint-intro,
.normaliser-transform-hint-popper .hint-outro {
  margin: 0;
}
.normaliser-transform-hint-popper .hint-intro {
  margin-bottom: 8px;
}
.normaliser-transform-hint-popper .hint-block-label {
  margin: 8px 0 4px;
  font-size: 12px;
  font-weight: 600;
}
.normaliser-transform-hint-popper .hint-example-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}
.normaliser-transform-hint-popper .hint-example-table th,
.normaliser-transform-hint-popper .hint-example-table td {
  border: 1px solid rgba(255, 255, 255, 0.7);
  padding: 4px 6px;
  text-align: center;
  word-break: break-all;
}
.normaliser-transform-hint-popper .hint-outro {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.55;
}
</style>
