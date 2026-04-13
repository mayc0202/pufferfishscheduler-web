<template>
  <div class="doris-output-config">
    <div class="config-content">
      <FlowConfigHero
        badge="输出"
        title="Doris 输出"
        description="通过 Stream Load 等方式将数据批量导入 Apache Doris，适合分析型写入。"
        tone="jade"
        icon="el-icon-s-grid"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <div v-show="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="Doris输出">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">数据源：</label>
          <div v-click-outside="closeDbDropdown" class="custom-select">
            <div class="select-input" @click="dbDropdownOpen = !dbDropdownOpen">
              <span v-if="selectedLabel">{{ selectedLabel }}</span>
              <span v-else class="placeholder">请选择数据源</span>
              <i class="el-icon-arrow-down arrow" :class="{ open: dbDropdownOpen }" />
            </div>
            <div v-show="dbDropdownOpen" class="select-dropdown">
              <div v-for="group in processedDbOptions" :key="group.label" class="select-group">
                <div class="select-group-title">{{ group.label }}</div>
                <div
                  v-for="item in group.children"
                  :key="item.value"
                  class="select-option"
                  :class="{ selected: selectedValue === item.value }"
                  @click="selectDbItem(item)"
                >
                  {{ item.label }}
                </div>
              </div>
              <div v-if="processedDbOptions.length === 0" class="select-empty">暂无数据</div>
            </div>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label required">表名称：</label>
          <div v-click-outside="closeTableDropdown" class="custom-select">
            <div class="select-input" @click="tableDropdownOpen = !tableDropdownOpen">
              <span v-if="formData.tableName">{{ formData.tableName }}</span>
              <span v-else class="placeholder">请选择表名称</span>
              <i class="el-icon-arrow-down arrow" :class="{ open: tableDropdownOpen }" />
            </div>
            <div v-show="tableDropdownOpen" class="select-dropdown">
              <div
                v-for="table in tableList"
                :key="table.id || table"
                class="select-option"
                :class="{ selected: formData.tableName === (table.name || table) }"
                @click="selectTableItem(table)"
              >
                {{ table.name || table }}
              </div>
              <div v-if="tableList.length === 0" class="select-empty">{{ selectedValue ? '暂无数据' : '请先选择数据源' }}</div>
            </div>
          </div>
        </div>

        <div class="section-header">
          <h4>要加载的字段</h4>
          <div class="section-toggle" @click="sectionOpen.fields = !sectionOpen.fields">
            <i :class="sectionOpen.fields ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.fields" class="section-content">
          <div class="field-mapping aligned-block">
            <div class="field-table-wrap">
              <el-table :data="formData.fieldList" border style="width: 100%" max-height="260">
                <el-table-column type="index" label="#" width="60" />
                <el-table-column label="流字段" min-width="180">
                  <template slot-scope="scope">
                    <div class="wrap-cell">{{ scope.row.fieldStream }}</div>
                  </template>
                </el-table-column>
                <el-table-column label="表字段" min-width="180">
                  <template slot-scope="scope">
                    <div class="wrap-cell">{{ scope.row.fieldDatabase }}</div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div class="field-actions">
              <button type="button" class="dash-btn" @click="editFields">
                <i class="el-icon-edit" /> 编辑字段
              </button>
            </div>
          </div>

          <div class="aligned-block compact-options">
            <el-checkbox v-model="formData.truncateTable">写入之前清空表</el-checkbox>
            <el-checkbox v-model="supportUpsertDeleteEnabled">是否支持更新和删除</el-checkbox>
            <el-checkbox v-model="partialUpdateEnabled">部分列更新</el-checkbox>
          </div>

          <div v-if="supportUpsertDeleteEnabled" class="form-item">
            <label class="form-label required">更新删除类型</label>
            <el-select v-model="formData.upsertOrDelete" class="form-select-el" placeholder="请选择更新删除类型" clearable>
              <el-option label="APPEND" value="APPEND" />
              <el-option label="DELETE" value="DELETE" />
              <el-option label="MERGE" value="MERGE" />
            </el-select>
          </div>

          <div v-if="partialUpdateEnabled" class="form-item">
            <label class="form-label">部分列更新字段</label>
            <input v-model="formData.partialUpdate" type="text" class="form-input" placeholder="请输入需要部分更新的列（英文逗号分隔）">
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'advanced'" class="advanced-layout">
        <div class="section-header" @click="sectionOpen.generalAdvanced = !sectionOpen.generalAdvanced">
          <h4>通用配置</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.generalAdvanced ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.generalAdvanced" class="section-content">
          <div class="form-item">
            <label class="form-label">最大批次记录数（条）：</label>
            <input v-model.number="formData.maxBatchRows" type="number" class="form-input" min="1" placeholder="500000">
          </div>
          <div class="form-item">
            <label class="form-label">一次导入最大量（MB）：</label>
            <input v-model.number="formData.maxBytes" type="number" class="form-input" min="1" placeholder="90">
          </div>
          <div class="form-item">
            <label class="form-label">刷新频率（毫秒）：</label>
            <input v-model.number="formData.scanningFrequency" type="number" class="form-input" min="1" placeholder="3000">
          </div>
          <div class="form-item">
            <label class="form-label">连接超时时间（秒）：</label>
            <input v-model.number="formData.connectTimeout" type="number" class="form-input" min="1" placeholder="10">
          </div>
          <div class="form-item">
            <label class="form-label">重试次数（次）：</label>
            <input v-model.number="formData.retries" type="number" class="form-input" min="0" placeholder="3">
          </div>
          <div class="form-item">
            <label class="form-label">Stream Load载入数据超时时间（秒）：</label>
            <input v-model.number="formData.timeout" type="number" class="form-input" min="1" placeholder="600">
          </div>
        </div>

        <div class="section-header" @click="sectionOpen.streamLoad = !sectionOpen.streamLoad">
          <h4>Stream Load属性</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.streamLoad ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.streamLoad" class="section-content">
          <div class="field-table-wrap aligned-block">
            <el-table :data="formData.headerProperties" border style="width: 100%" max-height="220">
              <el-table-column type="index" label="#" width="60" />
              <el-table-column prop="key" label="属性名" min-width="220" />
              <el-table-column prop="value" label="属性值" min-width="220" />
            </el-table>
          </div>
          <div class="field-actions aligned-block">
            <button type="button" class="dash-btn" @click="editHeaderProps">
              <i class="el-icon-edit" /> 编辑字段
            </button>
          </div>
        </div>

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
            <label class="form-label">并发数量：</label>
            <input v-model.number="formData.copiesCache" type="number" class="form-input" min="1" placeholder="1">
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <!-- 编辑字段对话框 -->
    <div v-if="editFieldsVisible" class="dialog-mask">
      <div class="dialog" :style="editDialogStyle" @click.stop>
        <div class="dialog-header dialog-draggable-handle" @mousedown="onEditDialogMouseDown">
          <h3>编辑要加载的字段</h3>
          <button class="close-btn" @click="editFieldsVisible = false">×</button>
        </div>
        <div class="dialog-body">
          <table class="field-edit-table">
            <thead>
              <tr>
                <th>#</th>
                <th class="required">流字段</th>
                <th class="required">表字段</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(field, index) in editFieldList" :key="index">
                <td>{{ index + 1 }}</td>
                <td>
                  <el-select v-model="field.fieldStream" class="field-select" filterable clearable placeholder="请选择流字段">
                    <el-option v-for="opt in streamFieldOptions" :key="opt" :label="opt" :value="opt" />
                  </el-select>
                </td>
                <td>
                  <el-select v-model="field.fieldDatabase" class="field-select" filterable clearable placeholder="请选择表字段">
                    <el-option v-for="opt in dbFieldOptions" :key="opt" :label="opt" :value="opt" />
                  </el-select>
                </td>
                <td>
                  <button type="button" class="btn remove-btn" @click="removeField(index)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
          <button type="button" class="btn add-btn" @click="addField">+ 添加行</button>
        </div>
        <div class="dialog-footer">
          <button
            type="button"
            class="btn secondary-btn"
            :class="{ 'is-loading': getFieldsLoading }"
            :disabled="getFieldsLoading"
            @click="getFields"
          >
            <span v-if="getFieldsLoading" class="btn-spinner" />
            {{ getFieldsLoading ? '获取中...' : '获取字段' }}
          </button>
          <button type="button" class="btn primary-btn" @click="saveFields">确定</button>
          <button type="button" class="btn secondary-btn" @click="editFieldsVisible = false">取消</button>
        </div>
      </div>
    </div>

    <!-- 编辑 Stream Load 属性对话框 -->
    <div v-if="editHeaderVisible" class="dialog-mask">
      <div class="dialog" :style="headerDialogStyle" @click.stop>
        <div class="dialog-header dialog-draggable-handle" @mousedown="onHeaderDialogMouseDown">
          <h3>编辑Stream Load属性</h3>
          <button class="close-btn" @click="editHeaderVisible = false">×</button>
        </div>
        <div class="dialog-body">
          <table class="field-edit-table">
            <thead>
              <tr>
                <th>#</th>
                <th class="required">属性名</th>
                <th class="required">属性值</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in editHeaderProperties" :key="index">
                <td>{{ index + 1 }}</td>
                <td><input v-model="row.key" type="text" class="mini-input" placeholder="请输入属性名"></td>
                <td><input v-model="row.value" type="text" class="mini-input" placeholder="请输入属性值"></td>
                <td>
                  <button type="button" class="btn remove-btn" @click="removeHeaderProp(index)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
          <button type="button" class="btn add-btn" @click="addHeaderProp">+ 添加行</button>
        </div>
        <div class="dialog-footer">
          <button type="button" class="btn primary-btn" @click="saveHeaderProps">确定</button>
          <button type="button" class="btn secondary-btn" @click="editHeaderVisible = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { relationalDbTree } from '@/api/database/database/dbGroup'
import { dbTableList, fieldList as dbFieldList } from '@/api/database/database/database'
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

export default {
  name: 'DorisOutputConfig',
  components: { FlowConfigHero },
  directives: {
    'click-outside': {
      bind(el, binding) {
        el._clickOutside = function(event) {
          if (!(el === event.target || el.contains(event.target))) {
            binding.value()
          }
        }
        document.addEventListener('click', el._clickOutside)
      },
      unbind(el) {
        document.removeEventListener('click', el._clickOutside)
      }
    }
  },
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
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        fields: true,
        generalAdvanced: true,
        streamLoad: true,
        distribution: false,
        parallel: false
      },
      dbList: [],
      tableList: [],
      dbDropdownOpen: false,
      tableDropdownOpen: false,
      processedDbOptions: [],
      selectedValue: '',
      selectedLabel: '',
      editFieldsVisible: false,
      editFieldList: [],
      getFieldsLoading: false,
      streamFieldOptions: [],
      dbFieldOptions: [],
      editHeaderVisible: false,
      editHeaderProperties: [],
      editDialogDrag: {
        dragging: false,
        moved: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        left: 0,
        top: 0
      },
      headerDialogDrag: {
        dragging: false,
        moved: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        left: 0,
        top: 0
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
    },
    supportUpsertDeleteEnabled: {
      get() {
        return this.formData.upsertOrDelete != null && String(this.formData.upsertOrDelete).trim() !== ''
      },
      set(v) {
        if (!v) {
          this.$set(this.formData, 'upsertOrDelete', '')
          return
        }
        // 勾选即给一个默认值，避免出现“已勾选但下拉为空”的割裂状态
        if (this.formData.upsertOrDelete == null || String(this.formData.upsertOrDelete).trim() === '') {
          this.$set(this.formData, 'upsertOrDelete', 'APPEND')
        }
      }
    },
    partialUpdateEnabled: {
      get() {
        return this.formData.partialUpdate != null && String(this.formData.partialUpdate).trim() !== ''
      },
      set(v) {
        if (!v) {
          this.$set(this.formData, 'partialUpdate', '')
          return
        }
        // 勾选后默认留空，让用户输入；但保证字段存在
        if (this.formData.partialUpdate == null) {
          this.$set(this.formData, 'partialUpdate', '')
        }
      }
    },
    editDialogStyle() {
      if (!this.editDialogDrag.moved) return {}
      return { left: `${this.editDialogDrag.left}px`, top: `${this.editDialogDrag.top}px`, transform: 'none' }
    },
    headerDialogStyle() {
      if (!this.headerDialogDrag.moved) return {}
      return { left: `${this.headerDialogDrag.left}px`, top: `${this.headerDialogDrag.top}px`, transform: 'none' }
    }
  },
  watch: {
    'formData.dataSourceId': {
      handler(val) {
        if (val) {
          this.selectedValue = String(val)
          this.updateSelectedLabel(val)
          this.loadTableList(val)
        }
      },
      immediate: true
    },
    'formData.tableId': {
      handler(val) {
        if (val) this.loadDbFieldOptions(val)
      },
      immediate: true
    },
    formData: {
      handler(val) {
        if (val && val.dataSourceId) {
          this.selectedValue = String(val.dataSourceId)
          this.updateSelectedLabel(val.dataSourceId)
        }
        if (val && !Array.isArray(val.fieldList)) this.$set(this.formData, 'fieldList', [])
        if (val && !Array.isArray(val.headerProperties)) this.$set(this.formData, 'headerProperties', [])
      },
      deep: true,
      immediate: true
    }
  },
  created() {
    this.loadDbList()
  },
  mounted() {
    this.initFormData()
  },
  methods: {
    initFormData() {
      if (!Array.isArray(this.formData.fieldList)) this.$set(this.formData, 'fieldList', [])
      if (this.formData.truncateTable === undefined) this.$set(this.formData, 'truncateTable', false)
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)

      if (this.formData.maxBatchRows === undefined || this.formData.maxBatchRows === '') this.$set(this.formData, 'maxBatchRows', 500000)
      if (this.formData.maxBytes === undefined || this.formData.maxBytes === '') this.$set(this.formData, 'maxBytes', 90)
      if (this.formData.scanningFrequency === undefined || this.formData.scanningFrequency === '') this.$set(this.formData, 'scanningFrequency', 3000)
      if (this.formData.connectTimeout === undefined || this.formData.connectTimeout === '') this.$set(this.formData, 'connectTimeout', 10)
      if (this.formData.retries === undefined || this.formData.retries === '') this.$set(this.formData, 'retries', 3)
      if (this.formData.timeout === undefined || this.formData.timeout === '') this.$set(this.formData, 'timeout', 600)

      if (!Array.isArray(this.formData.headerProperties) || this.formData.headerProperties.length === 0) {
        this.$set(this.formData, 'headerProperties', [
          { key: 'line_delimiter', value: '\\x02' },
          { key: 'column_separator', value: '\\x01' }
        ])
      }
    },
    async loadDbList() {
      try {
        const res = await relationalDbTree()
        if (res && res.code === '000000' && res.data) {
          this.$set(this, 'dbList', res.data)
          this.processDbOptions()
        } else {
          this.$set(this, 'dbList', [])
          this.$set(this, 'processedDbOptions', [])
        }
      } catch (e) {
        this.$set(this, 'dbList', [])
        this.$set(this, 'processedDbOptions', [])
      }
    },
    processDbOptions() {
      if (!this.dbList || !this.dbList.length) {
        this.processedDbOptions = []
        return
      }
      const result = []
      for (const group of this.dbList) {
        if (!group || group.type !== 'GROUP') continue
        if (!group.children || !Array.isArray(group.children)) continue
        const children = []
        for (const child of group.children) {
          if (child && child.type === 'DATABASE') {
            children.push({ value: String(child.id), label: child.name })
          }
        }
        if (children.length) result.push({ label: group.name || '未知分组', children })
      }
      this.processedDbOptions = result
      if (this.selectedValue) this.updateSelectedLabel(this.selectedValue)
    },
    updateSelectedLabel(dataSourceId) {
      if (!dataSourceId || !this.processedDbOptions || !this.processedDbOptions.length) {
        this.selectedLabel = ''
        return
      }
      const target = String(dataSourceId)
      for (const group of this.processedDbOptions) {
        if (!group.children) continue
        const item = group.children.find(opt => opt.value === target)
        if (item) {
          this.selectedLabel = `${group.label} / ${item.label}`
          return
        }
      }
      this.selectedLabel = ''
    },
    selectDbItem(item) {
      this.selectedValue = item.value
      this.selectedLabel = item.label
      this.formData.dataSourceId = item.value
      this.formData.tableName = ''
      this.formData.tableId = null
      this.tableList = []
      this.dbDropdownOpen = false
      this.loadTableList(item.value)
    },
    closeDbDropdown() {
      this.dbDropdownOpen = false
    },
    async loadTableList(dataSourceId) {
      try {
        const res = await dbTableList(dataSourceId)
        if (res && res.code === '000000' && res.data) {
          this.$set(this, 'tableList', res.data)
        } else {
          this.$set(this, 'tableList', [])
        }
      } catch (e) {
        this.$set(this, 'tableList', [])
      }
    },
    selectTableItem(table) {
      this.formData.tableName = table.name || table
      this.formData.tableId = table.id
      this.tableDropdownOpen = false
    },
    closeTableDropdown() {
      this.tableDropdownOpen = false
    },
    editFields() {
      this.editFieldList = JSON.parse(JSON.stringify(this.formData.fieldList || []))
      this.editFieldsVisible = true
      this.resetEditDialogDrag()
      if (this.formData.tableId) this.loadDbFieldOptions(this.formData.tableId)
      this.loadStreamFieldOptions()
    },
    addField() {
      this.editFieldList.push({ fieldStream: '', fieldDatabase: '' })
    },
    removeField(index) {
      this.editFieldList.splice(index, 1)
    },
    saveFields() {
      this.$set(this.formData, 'fieldList', this.editFieldList)
      this.editFieldsVisible = false
    },
    async loadDbFieldOptions(tableId) {
      try {
        const res = await dbFieldList(tableId)
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          const names = res.data
            .map(it => (typeof it === 'string' ? it : it && (it.name || it.fieldName || it.code)))
            .filter(Boolean)
          this.dbFieldOptions = Array.from(new Set(names))
        } else {
          this.dbFieldOptions = []
        }
      } catch (e) {
        this.dbFieldOptions = []
      }
    },
    async loadStreamFieldOptions() {
      if (!this.flowId) return
      try {
        let flowData = this.flowConfig
        if (!flowData) {
          flowData = {
            cells: [{
              id: 'temp-doris-output',
              shape: 'rect',
              data: {
                name: this.formData.name,
                code: 'DorisOutput',
                data: { ...this.formData, fieldList: this.editFieldList }
              }
            }]
          }
        }

        const res = await getFlowFieldStream({
          flowId: Number(this.flowId),
          config: JSON.stringify(flowData),
          stepName: this.formData.name || 'Doris输出',
          code: 'DorisOutput',
          dbId: this.formData.dataSourceId ? Number(this.formData.dataSourceId) : undefined,
          tableId: this.formData.tableId ? Number(this.formData.tableId) : undefined
        })

        if (res && res.code === '000000' && Array.isArray(res.data)) {
          this.streamFieldOptions = res.data
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
        } else if (res && res.code === '000000' && res.data && Array.isArray(res.data.fieldList)) {
          this.streamFieldOptions = res.data.fieldList.filter(Boolean)
        } else {
          this.streamFieldOptions = []
        }
      } catch (e) {
        this.streamFieldOptions = []
      }
    },
    async getFields() {
      if (this.getFieldsLoading) return
      if (!this.flowId) {
        this.$message.warning('流程ID不存在')
        return
      }
      if (!this.formData.name) {
        this.$message.warning('步骤名称不能为空')
        return
      }
      if (!this.formData.dataSourceId) {
        this.$message.warning('请选择数据源')
        return
      }
      if (!this.formData.tableName) {
        this.$message.warning('请选择表名称')
        return
      }

      this.getFieldsLoading = true
      try {
        // DorisOutput 暂无专用“自动映射”接口，这里先仅刷新下拉选项，便于用户快速选
        await this.loadDbFieldOptions(this.formData.tableId)
        await this.loadStreamFieldOptions()
        if (!this.editFieldList || this.editFieldList.length === 0) {
          // 若用户还未配置任何行，给一行空行便于编辑
          this.editFieldList = [{ fieldStream: '', fieldDatabase: '' }]
        }
        this.$message.success('字段列表已刷新')
      } catch (e) {
        this.$message.error('获取字段失败')
      } finally {
        this.getFieldsLoading = false
      }
    },
    editHeaderProps() {
      this.editHeaderProperties = JSON.parse(JSON.stringify(this.formData.headerProperties || []))
      this.editHeaderVisible = true
      this.resetHeaderDialogDrag()
    },
    addHeaderProp() {
      this.editHeaderProperties.push({ key: '', value: '' })
    },
    removeHeaderProp(index) {
      this.editHeaderProperties.splice(index, 1)
    },
    saveHeaderProps() {
      const cleaned = (this.editHeaderProperties || [])
        .filter(r => r && String(r.key || '').trim() && String(r.value || '').trim())
        .map(r => ({ key: String(r.key).trim(), value: String(r.value).trim() }))
      this.$set(this.formData, 'headerProperties', cleaned)
      this.editHeaderVisible = false
    },
    resetEditDialogDrag() {
      Object.assign(this.editDialogDrag, {
        dragging: false,
        moved: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        left: 0,
        top: 0
      })
    },
    resetHeaderDialogDrag() {
      Object.assign(this.headerDialogDrag, {
        dragging: false,
        moved: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        left: 0,
        top: 0
      })
    },
    onEditDialogMouseDown(e) {
      if (e.button !== 0) return
      const dialogEl = this.$el && this.$el.querySelectorAll('.dialog')[0]
      if (!dialogEl) return
      const rect = dialogEl.getBoundingClientRect()
      this.editDialogDrag.dragging = true
      this.editDialogDrag.startX = e.clientX
      this.editDialogDrag.startY = e.clientY
      this.editDialogDrag.offsetX = e.clientX - rect.left
      this.editDialogDrag.offsetY = e.clientY - rect.top

      const onMove = (ev) => {
        if (!this.editDialogDrag.dragging) return
        const dx = ev.clientX - this.editDialogDrag.startX
        const dy = ev.clientY - this.editDialogDrag.startY
        if (!this.editDialogDrag.moved && Math.abs(dx) + Math.abs(dy) < 3) return
        if (!this.editDialogDrag.moved) this.editDialogDrag.moved = true

        let left = ev.clientX - this.editDialogDrag.offsetX
        let top = ev.clientY - this.editDialogDrag.offsetY
        const maxLeft = window.innerWidth - 120
        const maxTop = window.innerHeight - 80
        left = Math.max(12, Math.min(left, maxLeft))
        top = Math.max(12, Math.min(top, maxTop))
        this.editDialogDrag.left = left
        this.editDialogDrag.top = top
      }
      const onUp = () => {
        this.editDialogDrag.dragging = false
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    onHeaderDialogMouseDown(e) {
      if (e.button !== 0) return
      const dialogEls = this.$el && this.$el.querySelectorAll('.dialog')
      const dialogEl = dialogEls && dialogEls.length > 1 ? dialogEls[1] : null
      if (!dialogEl) return
      const rect = dialogEl.getBoundingClientRect()
      this.headerDialogDrag.dragging = true
      this.headerDialogDrag.startX = e.clientX
      this.headerDialogDrag.startY = e.clientY
      this.headerDialogDrag.offsetX = e.clientX - rect.left
      this.headerDialogDrag.offsetY = e.clientY - rect.top

      const onMove = (ev) => {
        if (!this.headerDialogDrag.dragging) return
        const dx = ev.clientX - this.headerDialogDrag.startX
        const dy = ev.clientY - this.headerDialogDrag.startY
        if (!this.headerDialogDrag.moved && Math.abs(dx) + Math.abs(dy) < 3) return
        if (!this.headerDialogDrag.moved) this.headerDialogDrag.moved = true

        let left = ev.clientX - this.headerDialogDrag.offsetX
        let top = ev.clientY - this.headerDialogDrag.offsetY
        const maxLeft = window.innerWidth - 120
        const maxTop = window.innerHeight - 80
        left = Math.max(12, Math.min(left, maxLeft))
        top = Math.max(12, Math.min(top, maxTop))
        this.headerDialogDrag.left = left
        this.headerDialogDrag.top = top
      }
      const onUp = () => {
        this.headerDialogDrag.dragging = false
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
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
      if (!this.formData.tableName) {
        this.$message.warning('请选择表名称')
        return
      }
      // 提交时确保 DorisOutput 后端读取的字段存在且命名一致
      if (!Array.isArray(this.formData.fieldList)) this.$set(this.formData, 'fieldList', [])
      if (!Array.isArray(this.formData.headerProperties)) this.$set(this.formData, 'headerProperties', [])
      this.$emit('save')
    }
  }
}
</script>

<style scoped>
.doris-output-config {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.config-tabs {
  margin: 0 0 8px;
}

.form-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
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
  cursor: pointer;
  color: #909399;
  font-size: 12px;
}

.section-content {
  padding-top: 8px;
  margin-bottom: 8px;
}

.form-item {
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
}

.form-item.checkbox-item {
  align-items: center;
  margin-left: 112px;
}

.form-label {
  width: 120px;
  font-weight: 400;
  color: #606266;
  margin-right: 12px;
  text-align: right;
  flex-shrink: 0;
  font-size: 14px;
  padding-top: 8px;
}

.form-label.required::before {
  content: '*';
  color: #F56C6C;
  margin-right: 4px;
}

.form-input,
.form-textarea {
  flex: 1;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  color: #606266;
  background: #FFF;
  transition: border-color 0.2s;
}

.form-input {
  padding: 0 15px;
  height: 40px;
}

.form-textarea {
  padding: 8px 15px;
  resize: none;
}

.form-select-el {
  flex: 1;
}

.aligned-block {
  margin-left: calc(var(--label-width, 140px) + var(--label-gap, 8px));
}

.compact-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 6px 0 14px;
}

.custom-select {
  flex: 1;
  position: relative;
  font-size: 14px;
}

.select-input {
  padding: 0 30px 0 15px;
  height: 40px;
  line-height: 40px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #FFF;
  color: #606266;
}

.placeholder {
  color: #C0C4CC;
}

.arrow {
  position: absolute;
  right: 10px;
  font-size: 12px;
  color: #C0C4CC;
  transition: transform 0.3s;
}

.arrow.open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: #FFF;
  border: 1px solid #E4E7ED;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 9999;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.select-group-title {
  padding: 0 15px;
  height: 30px;
  line-height: 30px;
  font-size: 12px;
  color: #909399;
  background: #F5F7FA;
  font-weight: 500;
}

.select-option {
  padding: 0 15px;
  height: 34px;
  line-height: 34px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

.select-option:hover {
  background-color: #F5F7FA;
}

.select-option.selected {
  color: #409EFF;
  font-weight: 500;
}

.select-empty {
  padding: 10px 0;
  color: #909399;
  text-align: center;
  font-size: 14px;
}

.field-mapping {
  margin-top: 8px;
}

.field-table-wrap {
  margin-bottom: 10px;
}

.wrap-cell {
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
}

.field-actions {
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dash-btn {
  width: 100%;
  height: 40px;
  border: 1px dashed #409eff;
  background: #fff;
  color: #409eff;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.dash-btn:hover {
  background: #ecf5ff;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #EBEEF5;
}

.btn {
  padding: 0 20px;
  height: 36px;
  line-height: 36px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: #FFF;
  color: #606266;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.btn.is-loading {
  pointer-events: none;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  border-radius: 50%;
  border: 2px solid rgba(64, 158, 255, 0.25);
  border-top-color: #409eff;
  animation: btn-spin 0.8s linear infinite;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}

.primary-btn {
  background: #409EFF;
  color: #FFF;
  border-color: #409EFF;
}

.primary-btn:hover {
  background: #66B1FF;
  border-color: #66B1FF;
}

.secondary-btn:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.dialog {
  background: #FFF;
  border-radius: 4px;
  font-size: 14px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.dialog-header {
  padding: 16px 20px;
  border-bottom: 1px solid #EBEEF5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-draggable-handle {
  cursor: move;
  user-select: none;
}

.dialog-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #909399;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.field-edit-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.field-edit-table th,
.field-edit-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #EBEEF5;
}

.field-edit-table th {
  background: #F5F7FA;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.field-edit-table th.required::after {
  content: '*';
  color: #F56C6C;
  margin-left: 4px;
}

.field-select {
  width: 100%;
}

.add-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #ECF5FF;
  color: #409EFF;
  border-color: #D9ECFF;
}

.remove-btn {
  padding: 4px 8px;
  background: #FEF0F0;
  color: #F56C6C;
  border-color: #FBC4C4;
  font-size: 12px;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid #EBEEF5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.mini-input {
  width: 100%;
  height: 34px;
  line-height: 34px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  padding: 0 10px;
  box-sizing: border-box;
  color: #606266;
}
</style>

