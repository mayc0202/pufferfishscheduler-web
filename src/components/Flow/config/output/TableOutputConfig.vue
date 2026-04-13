<template>
  <div class="table-output-config">
    <!-- 配置内容 -->
    <div class="config-content">
      <FlowConfigHero
        badge="输出"
        title="关系库表输出"
        description="将当前数据流写入关系型数据库目标表，支持字段映射与写入策略。"
        tone="jade"
        icon="el-icon-upload2"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>
      <!-- 基础配置 -->

      <div v-show="activeTab === 'basic'">
      <div class="form-item">
        <label class="form-label required">节点名称：</label>
        <input v-model="formData.name" type="text" class="form-input" placeholder="输出到治理库">
      </div>

      <div class="form-item">
        <label class="form-label">节点说明：</label>
        <textarea v-model="formData.description" type="text" class="form-textarea" placeholder="请输入说明" />
      </div>

      <div class="section-header">
        <h4>通用配置</h4>
        <div class="section-toggle" @click="toggleSection('general')">
          <i :class="sectionOpen.general ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        </div>
      </div>
      <div v-show="sectionOpen.general" class="section-content">
        <div class="form-item">
          <label class="form-label required">数据源连接：</label>
          <el-cascader
            v-model="formData.dataSourceId"
            class="relation-db-cascader"
            :options="cascaderDbOptions"
            :props="dbCascaderProps"
            filterable
            clearable
            placeholder="请选择数据源"
            separator=" / "
            popper-class="relation-db-cascader-popper"
            @visible-change="onRelationalDbTreeVisible"
          >
            <template slot-scope="{ data }">
              <span class="mq-node">
                <i :class="data.type === 'GROUP' ? 'el-icon-folder' : 'el-icon-link'" class="mq-node-icon" />
                <span class="mq-node-label">{{ data.label }}</span>
              </span>
            </template>
          </el-cascader>
        </div>

        <div class="form-item">
          <label class="form-label">目标模式：</label>
          <input v-model="formData.schemaName" type="text" class="form-input" placeholder="请输入模式名称 (schema)">
        </div>

        <div class="form-item">
          <label class="form-label required">目标表：</label>
          <div v-click-outside="closeTableDropdown" class="custom-select table-name-select">
            <div
              class="select-input"
              :class="{ 'is-open': tableDropdownOpen }"
              role="button"
              tabindex="0"
              @click="tableDropdownOpen = !tableDropdownOpen"
              @keydown.enter.prevent="tableDropdownOpen = !tableDropdownOpen"
              @keydown.space.prevent="tableDropdownOpen = !tableDropdownOpen"
            >
              <span v-if="formData.tableName" class="select-value-text">{{ formData.tableName }}</span>
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
              <div v-if="tableList.length === 0" class="select-empty">{{ formData.dataSourceId ? '暂无数据' : '请先选择数据源' }}</div>
            </div>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">提交记录数量：</label>
          <input v-model="formData.commitSize" type="number" class="form-input" placeholder="1000" min="1">
        </div>

        <div class="form-item form-item-checkbox">
          <span class="form-label-spacer" aria-hidden="true" />
          <div class="form-control-block">
            <el-checkbox v-model="formData.truncateTable" class="to-checkbox">写入之前清空表</el-checkbox>
          </div>
        </div>
      </div>

      <div class="section-header">
        <h4>数据库字段</h4>
        <div class="section-toggle" @click="toggleSection('fields')">
          <i :class="sectionOpen.fields ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        </div>
      </div>
      <div v-show="sectionOpen.fields" class="section-content">
        <div class="form-item form-item-checkbox">
          <span class="form-label-spacer" aria-hidden="true" />
          <div class="form-control-block">
            <el-checkbox v-model="formData.specifyFields" class="to-checkbox">指定数据库字段</el-checkbox>
          </div>
        </div>

        <div v-if="formData.specifyFields" class="field-mapping aligned-block">
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
      </div>
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
          <div class="form-item">
            <label class="form-label">并发数量：</label>
            <input v-model.number="formData.copiesCache" type="number" class="form-input" min="1" placeholder="1">
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <!-- 编辑字段对话框 -->
    <div v-if="editFieldsVisible" class="dialog-mask">
      <div class="dialog" :style="editDialogStyle" @click.stop>
        <div class="dialog-header dialog-draggable-handle" @mousedown="onEditDialogMouseDown">
          <h3>编辑数据库字段</h3>
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
                  <el-select
                    v-model="field.fieldStream"
                    class="field-select"
                    filterable
                    clearable
                    placeholder="请选择流字段"
                  >
                    <el-option
                      v-for="opt in streamFieldOptions"
                      :key="opt"
                      :label="opt"
                      :value="opt"
                    />
                  </el-select>
                </td>
                <td>
                  <el-select
                    v-model="field.fieldDatabase"
                    class="field-select"
                    filterable
                    clearable
                    placeholder="请选择表字段"
                  >
                    <el-option
                      v-for="opt in dbFieldOptions"
                      :key="opt"
                      :label="opt"
                      :value="opt"
                    />
                  </el-select>
                </td>
                <td>
                  <button type="button" class="btn remove-btn" @click="removeField(index)">
                    删除
                  </button>
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
  </div>
</template>

<script>
import { relationalDbTree } from '@/api/database/database/dbGroup'
import { dbTableList, fieldList as dbFieldList } from '@/api/database/database/database'
import { getFieldStream } from '@/api/collect/plugin/tableoutput'
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

export default {
  name: 'TableOutputConfig',
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
    },
    /** 画布节点 id，用于把当前表单合并进 flowConfig 中对应节点（避免仅用打开抽屉时的旧快照） */
    currentNodeId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        general: true,
        fields: true,
        distribution: false,
        parallel: false
      },
      dbList: [],
      tableList: [],
      tableDropdownOpen: false,
      editFieldsVisible: false,
      editFieldList: [],
      getFieldsLoading: false,
      streamFieldOptions: [],
      dbFieldOptions: [],
      editDialogDrag: {
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
    editDialogStyle() {
      if (!this.editDialogDrag.moved) return {}
      return {
        left: `${this.editDialogDrag.left}px`,
        top: `${this.editDialogDrag.top}px`,
        transform: 'none'
      }
    },
    cascaderDbOptions() {
      return this.transformToCascader(this.dbList)
    },
    dbCascaderProps() {
      return {
        value: 'value',
        label: 'label',
        children: 'children',
        expandTrigger: 'hover',
        emitPath: false
      }
    }
  },
  watch: {
    'formData.dataSourceId': {
      handler(val, oldVal) {
        const id = val != null && val !== '' ? String(val) : ''
        const prev =
          oldVal !== undefined && oldVal !== null && oldVal !== ''
            ? String(oldVal)
            : null
        if (prev !== null && id !== prev) {
          this.$set(this.formData, 'tableName', '')
          this.$set(this.formData, 'tableId', null)
          this.tableList = []
        }
        if (id) {
          this.loadTableList(id)
        } else if (prev !== null) {
          this.tableList = []
          this.$set(this.formData, 'tableName', '')
          this.$set(this.formData, 'tableId', null)
        }
      },
      immediate: true
    },
    formData: {
      handler(val) {
        // 确保 fieldList 是数组
        if (val && !Array.isArray(val.fieldList)) {
          this.$set(this.formData, 'fieldList', [])
        }
      },
      deep: true,
      immediate: true
    },
    'formData.tableId': {
      handler(val) {
        if (val) this.loadDbFieldOptions(val)
      },
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
    /**
     * 初始化表单数据
     */
    initFormData() {
      // 初始化默认值，但不覆盖已有值
      if (this.formData.commitSize === undefined || this.formData.commitSize === '') {
        this.formData.commitSize = '1000'
      }
      if (!this.formData.fieldList) {
        this.formData.fieldList = []
      }
      // 确保 truncateTable 有默认值
      if (this.formData.truncateTable === undefined) {
        this.formData.truncateTable = false
      }
      // 确保 specifyFields 有默认值
      if (this.formData.specifyFields === undefined) {
        this.formData.specifyFields = false
      }
      // 确保 ignoreErrors 有默认值
      if (this.formData.ignoreErrors === undefined) {
        this.formData.ignoreErrors = false
      }
      // 确保 useBatchUpdate 有默认值
      if (this.formData.useBatchUpdate === undefined) {
        this.formData.useBatchUpdate = false
      }
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.formData.copiesCache = 1
      }
      if (this.formData.distributeType === undefined) {
        this.formData.distributeType = false
      }
    },
    /**
     * 切换段落展开状态
     * @param section 段落名称
     */
    toggleSection(section) {
      this.sectionOpen[section] = !this.sectionOpen[section]
    },
    /**
     * 加载数据库列表
     */
    async loadDbList() {
      try {
        const res = await relationalDbTree()
        if (res && res.code === '000000' && res.data) {
          this.$set(this, 'dbList', res.data)
          this.normalizeDataSourceIdForCascader()
        } else {
          console.error('加载数据库列表失败，返回数据异常：', res)
          this.$set(this, 'dbList', [])
        }
      } catch (error) {
        console.error('加载数据库列表失败:', error)
        this.$set(this, 'dbList', [])
      }
    },
    transformToCascader(dbList) {
      if (!dbList || !dbList.length) return []
      const result = []
      for (const group of dbList) {
        if (!group || group.type !== 'GROUP') continue
        if (!group.children || !Array.isArray(group.children)) continue
        const children = []
        for (const child of group.children) {
          if (child && child.type === 'DATABASE') {
            children.push({
              value: String(child.id),
              label: child.name || '未命名',
              type: 'DATABASE'
            })
          }
        }
        if (children.length) {
          const gid = group.id != null ? String(group.id) : `group:${group.name || ''}`
          result.push({
            value: gid,
            label: group.name || '未知分组',
            type: 'GROUP',
            children
          })
        }
      }
      return result
    },
    normalizeDataSourceIdForCascader() {
      const raw = this.formData.dataSourceId
      if (raw != null && raw !== '') {
        this.$set(this.formData, 'dataSourceId', String(raw))
      }
    },
    /**
     * 从节点 data 上取出插件参数字典（兼容 data.data 嵌套与历史扁平结构）
     */
    extractTableOutputPayloadFromCellData(cellData) {
      if (!cellData || typeof cellData !== 'object') return {}
      const nested = cellData.data
      if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
        return { ...nested }
      }
      const { name, code, ...rest } = cellData
      return { ...rest }
    },
    /**
     * 当前步骤写入后端的插件参数（与画布 replaceData 的 data 子对象对齐）
     * @param {Array} fieldListOverride 编辑弹窗内映射列表，默认用 formData.fieldList
     */
    buildTableOutputInnerPayload(fieldListOverride) {
      const ds =
        this.formData.dataSourceId != null && this.formData.dataSourceId !== ''
          ? String(this.formData.dataSourceId).trim()
          : ''
      const list = Array.isArray(fieldListOverride)
        ? fieldListOverride
        : Array.isArray(this.formData.fieldList)
          ? this.formData.fieldList
          : []
      return {
        name: this.formData.name,
        description: this.formData.description != null ? String(this.formData.description) : '',
        dataSourceId: ds,
        dbConnection: ds,
        dataSource: ds,
        schemaName:
          this.formData.schemaName != null && this.formData.schemaName !== ''
            ? String(this.formData.schemaName)
            : '',
        tableId: this.formData.tableId,
        tableName: this.formData.tableName != null ? String(this.formData.tableName) : '',
        commitSize: this.formData.commitSize != null && this.formData.commitSize !== '' ? String(this.formData.commitSize) : '1000',
        truncateTable: !!this.formData.truncateTable,
        specifyFields: !!this.formData.specifyFields,
        preSql: this.formData.preSql,
        postSql: this.formData.postSql,
        fieldList: list,
        updateField: this.formData.updateField,
        updatePolicy: this.formData.updatePolicy,
        skipHeader: this.formData.skipHeader,
        ignoreError: this.formData.ignoreError,
        retryTimes: this.formData.retryTimes,
        retryInterval: this.formData.retryInterval,
        distributeType: !!this.formData.distributeType,
        copiesCache:
          this.formData.copiesCache != null && this.formData.copiesCache !== ''
            ? this.formData.copiesCache
            : 1
      }
    },
    buildTempFlowPayloadForFieldApi(fieldListOverride) {
      const inner = this.buildTableOutputInnerPayload(fieldListOverride)
      return {
        cells: [
          {
            id: this.currentNodeId || 'temp-table-output-step',
            shape: 'rect',
            data: {
              name: this.formData.name,
              code: 'TableOutput',
              data: inner
            }
          }
        ]
      }
    },
    /**
     * 供「获取字段 / 流字段」接口使用：在完整流程 JSON 中合并当前表单，避免仍用打开抽屉时的旧 dataSourceId。
     */
    resolveFlowConfigForFieldApi(fieldListOverride) {
      const inner = this.buildTableOutputInnerPayload(fieldListOverride)
      const base = this.flowConfig
      if (!base || typeof base !== 'object') {
        return this.buildTempFlowPayloadForFieldApi(fieldListOverride)
      }
      let cfg
      try {
        cfg = JSON.parse(JSON.stringify(base))
      } catch (e) {
        return this.buildTempFlowPayloadForFieldApi(fieldListOverride)
      }
      const cells = Array.isArray(cfg.cells) ? cfg.cells : []
      if (!cells.length) {
        return this.buildTempFlowPayloadForFieldApi(fieldListOverride)
      }
      const nid = this.currentNodeId ? String(this.currentNodeId) : ''
      let idx = nid ? cells.findIndex((c) => c && c.id === nid) : -1
      if (idx < 0) {
        idx = cells.findIndex(
          (c) =>
            c &&
            c.data &&
            c.data.code === 'TableOutput' &&
            c.data.name === this.formData.name
        )
      }
      if (idx < 0) {
        return this.buildTempFlowPayloadForFieldApi(fieldListOverride)
      }
      const cell = cells[idx]
      if (!cell.data || typeof cell.data !== 'object') {
        cell.data = {}
      }
      const prev = this.extractTableOutputPayloadFromCellData(cell.data)
      cell.data = {
        ...cell.data,
        name: this.formData.name,
        code: 'TableOutput',
        data: { ...prev, ...inner }
      }
      return cfg
    },
    parseDbIdForApi() {
      const ds =
        this.formData.dataSourceId != null && this.formData.dataSourceId !== ''
          ? String(this.formData.dataSourceId).trim()
          : ''
      if (!ds) return { ok: false, dbId: null }
      const n = Number(ds)
      if (!Number.isFinite(n)) return { ok: false, dbId: null }
      return { ok: true, dbId: n }
    },
    onRelationalDbTreeVisible(visible) {
      if (!visible) return
      if (!this.dbList.length) {
        this.loadDbList()
      }
    },
    /**
     * 选择表项
     * @param table 表项
     */
    selectTableItem(table) {
      this.formData.tableName = table.name || table
      this.formData.tableId = table.id
      this.tableDropdownOpen = false
    },

    closeTableDropdown() {
      this.tableDropdownOpen = false
    },
    /**
     * 加载表列表
     * @param {*} dataSourceId 数据源ID
     */
    async loadTableList(dataSourceId) {
      try {
        const res = await dbTableList(dataSourceId)
        if (res && res.code === '000000' && res.data) {
          this.$set(this, 'tableList', res.data)
        } else {
          this.$set(this, 'tableList', [])
        }
      } catch (error) {
        console.error('加载表列表失败:', error)
        this.$set(this, 'tableList', [])
      }
    },
    /**
     * 编辑字段
     */
    editFields() {
      // 复制当前字段列表用于编辑
      this.editFieldList = JSON.parse(JSON.stringify(this.formData.fieldList))
      this.editFieldsVisible = true
      this.resetEditDialogDrag()
      // 尝试提前加载表字段列表（如果已选表）
      if (this.formData.tableId) {
        this.loadDbFieldOptions(this.formData.tableId)
      }
      // 通用：获取流字段下拉选项（/trans/flow/getFieldStream.do）
      this.loadStreamFieldOptions()
    },
    /**
     * 添加字段
     */
    addField() {
      this.editFieldList.push({
        fieldStream: '',
        fieldDatabase: '',
        spatialType: false,
        coordinateSystem: ''
      })
    },
    /**
     * 删除字段
     * @param {*} index 字段索引
     */
    removeField(index) {
      this.editFieldList.splice(index, 1)
    },
    /**
     * 获取字段列表
     */
    async getFields() {
      if (this.getFieldsLoading) return
      // 验证必填字段
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
      const { ok: dbOk, dbId } = this.parseDbIdForApi()
      if (!dbOk) {
        this.$message.warning('数据源 ID 无效，请重新选择数据源')
        return
      }
      if (!this.formData.tableName) {
        this.$message.warning('请选择表名称')
        return
      }

      this.getFieldsLoading = true
      try {
        const flowData = this.resolveFlowConfigForFieldApi(this.editFieldList)

        var data = {
          flowId: Number(this.flowId),
          stepName: this.formData.name,
          config: JSON.stringify(flowData),
          type: 1,
          code: 'TableOutput',
          dbId,
          tableId: this.formData.tableId ? Number(this.formData.tableId) : null
        }

        const res = await getFieldStream(data)

        if (res.code === '000000' && res.data) {
          this.editFieldList = res.data.map(field => ({
            fieldStream: field.fieldStream,
            fieldDatabase: field.fieldDatabase
          }))
          // 流字段下拉选项走通用接口，避免仅依赖映射接口的返回
          this.loadStreamFieldOptions()
          this.$message.success('获取字段成功')
        } else {
          this.$message.error(res.message || '获取字段失败')
        }
      } catch (error) {
        console.error('获取字段失败:', error)
        this.$message.error('获取字段失败')
      } finally {
        this.getFieldsLoading = false
      }
    },
    /**
     * 保存字段
     */
    saveFields() {
      this.formData.fieldList = this.editFieldList
      this.editFieldsVisible = false
    },
    async loadDbFieldOptions(tableId) {
      try {
        const res = await dbFieldList(tableId)
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          // 兼容后端可能返回 string[] 或 {name: string}[]
          const names = res.data
            .map(it => (typeof it === 'string' ? it : it && (it.name || it.fieldName || it.code)))
            .filter(Boolean)
          this.dbFieldOptions = Array.from(new Set(names))
        } else {
          this.dbFieldOptions = []
        }
      } catch (e) {
        console.error('加载表字段失败:', e)
        this.dbFieldOptions = []
      }
    },
    async loadStreamFieldOptions() {
      if (!this.flowId) return
      try {
        const flowData = this.resolveFlowConfigForFieldApi(this.editFieldList)
        const dsParsed = this.parseDbIdForApi()

        const res = await getFlowFieldStream({
          flowId: Number(this.flowId),
          config: JSON.stringify(flowData),
          stepName: this.formData.name || '关系库表输出',
          code: 'TableOutput',
          dbId: dsParsed.ok ? dsParsed.dbId : undefined,
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
    resetEditDialogDrag() {
      this.editDialogDrag.dragging = false
      this.editDialogDrag.moved = false
      this.editDialogDrag.startX = 0
      this.editDialogDrag.startY = 0
      this.editDialogDrag.offsetX = 0
      this.editDialogDrag.offsetY = 0
      this.editDialogDrag.left = 0
      this.editDialogDrag.top = 0
    },
    onEditDialogMouseDown(e) {
      if (e.button !== 0) return
      const dialogEl = this.$el && this.$el.querySelector('.dialog')
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

        if (!this.editDialogDrag.moved) {
          this.editDialogDrag.moved = true
        }

        let left = ev.clientX - this.editDialogDrag.offsetX
        let top = ev.clientY - this.editDialogDrag.offsetY

        // 简单边界，避免拖出窗口太多
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
    /**
     * 提交配置
     */
    handleSubmit() {
      // 验证必填字段
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

      // 确保提交记录数量有默认值
      if (!this.formData.commitSize) {
        this.formData.commitSize = '1000'
      }

      this.$emit('save')
    }
  }
}
</script>

<style scoped>
.table-output-config {
  --to-label-width: 112px;
  --to-label-gap: 12px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 标签页样式 */
.config-tabs {
  display: flex;
  border-bottom: 1px solid #EBEEF5;
  background: #FFF;
}

.tab-item {
  padding: 12px 20px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.tab-item:hover {
  color: #409EFF;
}

.tab-item.active {
  color: #409EFF;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #409EFF;
}

/* 配置内容（内边距由 ConfigDrawer .drawer-body 统一提供，避免双重留白） */
.config-content {
  flex: 1;
  padding: 0;
  overflow-y: auto;
}

.config-tabs {
  margin: 0 0 8px;
}

.aligned-block {
  margin-left: calc(var(--to-label-width) + var(--to-label-gap));
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

.tab-content {
  background: #FFF;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #EBEEF5;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #EBEEF5;
  margin-top: 12px;
  margin-bottom: 8px;
}

.section-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.section-toggle {
  cursor: pointer;
  color: #909399;
  font-size: 12px;
}

.section-content {
  padding: 4px 0 8px;
}

/* 表单样式 */
.form-item {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
}

.form-item-checkbox {
  align-items: center;
  min-height: 28px;
  margin-bottom: 8px;
}

.form-label-spacer {
  width: var(--to-label-width);
  margin-right: var(--to-label-gap);
  flex-shrink: 0;
}

.form-control-block {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.form-label {
  width: var(--to-label-width);
  font-weight: 400;
  color: #303133;
  margin-right: var(--to-label-gap);
  text-align: right;
  flex-shrink: 0;
  font-size: 14px;
  line-height: 22px;
  padding-top: 9px;
}

.form-label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
  vertical-align: middle;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #c0c4cc;
}

.form-input,
.form-select {
  flex: 1;
  padding: 0 12px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  color: #303133;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:hover,
.form-select:hover {
  border-color: #C0C4CC;
}

.form-input:focus,
.form-select:focus {
  border-color: #409eff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
}

.form-textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  color: #303133;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: none;
}

.form-textarea:hover {
  border-color: #C0C4CC;
}

.form-textarea:focus {
  border-color: #409eff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
}

.table-output-config ::v-deep .to-checkbox.el-checkbox {
  line-height: 1;
}

.table-output-config ::v-deep .to-checkbox .el-checkbox__label {
  font-size: 14px;
  color: #303133;
  padding-left: 8px;
  line-height: 22px;
}

.table-output-config ::v-deep .to-checkbox .el-checkbox__input {
  line-height: 1;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #F0F2F5;
  border-radius: 50%;
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
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
  text-align: center;
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
  to {
    transform: rotate(360deg);
  }
}

.preview-btn {
  background: #ECF5FF;
  color: #409EFF;
  border-color: #B3D8FF;
}

.preview-btn:hover {
  background: #D9ECFF;
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

.secondary-btn {
  background: white;
  color: #606266;
  border-color: #DCDFE6;
}

.secondary-btn:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.relation-db-cascader {
  flex: 1;
  width: 100%;
  min-width: 0;
}

.table-output-config ::v-deep .relation-db-cascader .el-input {
  width: 100%;
}

.table-output-config ::v-deep .relation-db-cascader .el-input__inner {
  height: 40px;
  line-height: 40px;
  border-radius: 4px;
  padding: 0 12px;
  color: #303133;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.table-output-config ::v-deep .relation-db-cascader .el-input__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
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

/* 自定义下拉框 */
.custom-select {
  flex: 1;
  position: relative;
  font-size: 14px;
}

.select-input {
  position: relative;
  padding: 0 32px 0 12px;
  height: 40px;
  line-height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background: #fff;
  color: #303133;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.select-input:hover {
  border-color: #c0c4cc;
}

.select-input.is-open {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
}

.select-input:focus-visible {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
}

.select-value-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #303133;
}

.placeholder {
  color: #C0C4CC;
}

.arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  margin-top: -6px;
  font-size: 12px;
  color: #c0c4cc;
  transition: transform 0.2s, color 0.2s;
  line-height: 1;
}

.select-input.is-open .arrow {
  color: #409eff;
}

.arrow.open {
  transform: rotate(180deg);
}

.table-name-select .select-dropdown {
  margin-top: 6px;
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  max-height: 280px;
  overflow-y: auto;
  z-index: 9999;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.select-option {
  padding: 0 12px;
  min-height: 36px;
  line-height: 36px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: background-color 0.15s, color 0.15s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.select-option:hover {
  background-color: #f5f7fa;
  color: #303133;
}

.select-option.selected {
  color: #409eff;
  font-weight: 500;
  background-color: #ecf5ff;
}

.select-empty {
  padding: 10px 0;
  color: #909399;
  text-align: center;
  font-size: 14px;
}

.select-group {
  margin: 0;
  padding: 0;
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

.select-group .select-option {
  padding-left: 25px;
}

.table-desc {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

/* 字段映射 */
.field-mapping {
  margin-top: 8px;
}

.field-mapping.aligned-block {
  width: calc(100% - (var(--to-label-width) + var(--to-label-gap)));
  max-width: 640px;
  box-sizing: border-box;
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
  margin-top: 0;
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
  transition: background 0.2s, border-color 0.2s;
}

.dash-btn:hover {
  background: #ecf5ff;
}

/* 编辑字段对话框 */
.edit-fields-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-fields-dialog-content {
  background: #FFF;
  border-radius: 4px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.edit-fields-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
}

.edit-fields-dialog-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0;
}

.close-dialog {
  background: none;
  border: none;
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-dialog:hover {
  color: #606266;
  background: #E4E7ED;
}

.edit-fields-dialog-body {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.edit-fields-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding: 16px 20px;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .form-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-label {
    width: 100%;
    text-align: left;
    margin-bottom: 8px;
    padding-top: 0;
  }

  .form-label-spacer {
    display: none;
  }

  .form-item-checkbox .form-control-block {
    width: 100%;
  }

  .custom-select {
    width: 100%;
  }
}

.secondary-btn {
  background: white;
  color: #333;
}

.secondary-btn:hover {
  border-color: #409EFF;
  color: #409EFF;
}

/* 对话框样式 */
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

.close-btn:hover {
  color: #606266;
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

.add-btn:hover {
  background: #D9ECFF;
  border-color: #409EFF;
}

.remove-btn {
  padding: 4px 8px;
  background: #FEF0F0;
  color: #F56C6C;
  border-color: #FBC4C4;
  font-size: 12px;
}

.remove-btn:hover {
  background: #FBC4C4;
  border-color: #F56C6C;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid #EBEEF5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

<style>
/* 配置抽屉内覆盖 ConfigDrawer 的 !important 间距，压缩大块竖向留白 */
.config-drawer .drawer-body .table-output-config .form-item {
  margin-bottom: 10px !important;
}

.config-drawer .drawer-body .table-output-config .form-item-checkbox {
  margin-bottom: 6px !important;
}

.config-drawer .drawer-body .table-output-config .section-header {
  margin-top: 10px !important;
  margin-bottom: 6px !important;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}

.config-drawer .drawer-body .table-output-config .section-content {
  padding-top: 2px !important;
  padding-bottom: 6px !important;
}

.config-drawer .drawer-body .table-output-config .form-actions {
  margin-top: 12px !important;
  padding-top: 10px !important;
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
</style>
