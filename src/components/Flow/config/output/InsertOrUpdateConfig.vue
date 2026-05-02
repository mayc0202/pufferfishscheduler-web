<template>
  <div class="insert-update-config">
    <div class="config-content">
      <FlowConfigHero
        badge="输出"
        title="关系库插入/更新"
        description="按主键或业务键执行插入或更新，适合幂等写入与缓慢变化维。"
        tone="jade"
        icon="el-icon-refresh"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <div v-show="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="关系库插入/更新">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">数据源：</label>
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
              <div v-if="tableList.length === 0" class="select-empty">{{ formData.dataSourceId ? '暂无数据' : '请先选择数据源' }}</div>
            </div>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label required">提交记录数量：</label>
          <input v-model="formData.commitSize" type="number" class="form-input form-input--fixed-num" placeholder="1000" min="1">
        </div>

        <div class="form-item form-item-checkbox">
          <span class="form-label-spacer" aria-hidden="true" />
          <div class="form-control-block">
            <el-checkbox v-model="formData.updateBypassed" class="iu-checkbox">
              只执行插入操作
            </el-checkbox>
          </div>
        </div>

        <div class="section-header">
          <h4>用来查询的关键字</h4>
          <div class="section-toggle" @click="toggleSection('keys')">
            <i :class="sectionOpen.keys ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.keys" class="section-content">
          <div class="field-mapping aligned-block">
            <div class="field-table-wrap">
              <el-table
                :data="formData.selectField"
                border
                style="width: 100%"
                max-height="260"
                empty-text="暂无数据"
              >
                <el-table-column type="index" label="#" width="50" />
                <el-table-column label="表字段" min-width="100" prop="keyLookup" />
                <el-table-column label="比较符号" width="90" prop="keyCondition" />
                <el-table-column label="流字段1" min-width="100" prop="keyStream" />
                <el-table-column label="流字段2" min-width="100" prop="keyStream2" />
              </el-table>
            </div>
            <div class="field-actions">
              <button type="button" class="dash-btn" @click="openSelectFieldDialog">
                <i class="el-icon-edit" /> 编辑字段
              </button>
            </div>
          </div>
        </div>

        <div class="section-header">
          <h4>更新字段</h4>
          <div class="section-toggle" @click="toggleSection('updates')">
            <i :class="sectionOpen.updates ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.updates" class="section-content">
          <div class="field-mapping aligned-block">
            <div class="field-table-wrap">
              <el-table
                :data="formData.updateField"
                border
                style="width: 100%"
                max-height="260"
                empty-text="暂无数据"
              >
                <el-table-column type="index" label="#" width="50" />
                <el-table-column label="流字段" min-width="90" prop="updateStream" />
                <el-table-column label="表字段" min-width="90" prop="updateLookup" />
                <el-table-column label="是否更新" width="88">
                  <template slot-scope="scope">
                    {{ scope.row.update ? '是' : '否' }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div class="field-actions">
              <button type="button" class="dash-btn" @click="openUpdateFieldDialog">
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
              <el-radio label="copy">复制</el-radio>
              <el-radio label="distribute">分发</el-radio>
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
            <div class="inline-with-help inline-with-help--numeric">
              <input v-model.number="formData.copiesCache" type="number" class="form-input" min="1" placeholder="1">
              <el-tooltip content="步骤多副本并发执行数量。" placement="top">
                <span class="help-icon">?</span>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <!-- 用来查询的关键字 -->
    <div v-if="selectDialogVisible" class="dialog-mask" @click.self="selectDialogVisible = false">
      <div class="dialog dialog-wide" @click.stop>
        <div class="dialog-header">
          <h3>用来查询的关键字</h3>
          <button class="close-btn" @click="selectDialogVisible = false">×</button>
        </div>
        <div class="dialog-body">
          <p class="dialog-field-label required">字段：</p>
          <table class="field-edit-table field-edit-table-compact">
            <thead>
              <tr>
                <th>#</th>
                <th class="required">表字段</th>
                <th class="required">比较符号</th>
                <th class="required">流字段1</th>
                <th>流字段2</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in editSelectFieldList" :key="'k' + index">
                <td>{{ index + 1 }}</td>
                <td>
                  <el-select
                    v-model="row.keyLookup"
                    class="field-select"
                    filterable
                    allow-create
                    default-first-option
                    clearable
                    placeholder="下拉选择或者手动输入"
                  >
                    <el-option v-for="opt in dbFieldOptions" :key="'kl-' + opt" :label="opt" :value="opt" />
                  </el-select>
                </td>
                <td>
                  <el-select
                    v-model="row.keyCondition"
                    class="field-select"
                    clearable
                    placeholder="请选择比较符号"
                    @change="onSelectKeyConditionChange(row, $event)"
                  >
                    <el-option v-for="op in keyConditionOptions" :key="op" :label="op" :value="op" />
                  </el-select>
                </td>
                <td>
                  <el-select
                    v-model="row.keyStream"
                    class="field-select"
                    filterable
                    allow-create
                    default-first-option
                    clearable
                    placeholder="下拉选择或者手动输入"
                  >
                    <el-option v-for="opt in streamFieldOptions" :key="'ks-' + opt" :label="opt" :value="opt" />
                  </el-select>
                </td>
                <td>
                  <el-select
                    v-model="row.keyStream2"
                    class="field-select"
                    filterable
                    allow-create
                    default-first-option
                    clearable
                    placeholder="仅 BETWEEN 时可填"
                    :disabled="!isBetweenKeyCondition(row.keyCondition)"
                  >
                    <el-option v-for="opt in streamFieldOptions" :key="'ks2-' + opt" :label="opt" :value="opt" />
                  </el-select>
                </td>
                <td>
                  <button type="button" class="btn link-btn" @click="removeSelectRow(index)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
          <button type="button" class="btn dash-inline-btn" @click="addSelectRow">+ 添加行</button>
        </div>
        <div class="dialog-footer">
          <button
            type="button"
            class="btn secondary-btn"
            :class="{ 'is-loading': getFieldsLoading }"
            :disabled="getFieldsLoading"
            @click="getFieldsForKeys"
          >
            <span v-if="getFieldsLoading" class="btn-spinner" />
            {{ getFieldsLoading ? '获取中...' : '获取字段' }}
          </button>
          <button type="button" class="btn primary-btn" @click="saveSelectFieldDialog">确定</button>
          <button type="button" class="btn secondary-btn" @click="selectDialogVisible = false">取消</button>
        </div>
      </div>
    </div>

    <!-- 更新字段 -->
    <div v-if="updateDialogVisible" class="dialog-mask" @click.self="updateDialogVisible = false">
      <div class="dialog dialog-wide" @click.stop>
        <div class="dialog-header">
          <h3>更新字段</h3>
          <button class="close-btn" @click="updateDialogVisible = false">×</button>
        </div>
        <div class="dialog-body">
          <table class="field-edit-table field-edit-table-compact">
            <thead>
              <tr>
                <th>#</th>
                <th class="required">
                  流字段
                  <el-tooltip content="数据流中的字段" placement="top">
                    <i class="el-icon-info field-info-icon" />
                  </el-tooltip>
                </th>
                <th class="required">
                  表字段
                  <el-tooltip content="目标库表中的列名" placement="top">
                    <i class="el-icon-info field-info-icon" />
                  </el-tooltip>
                </th>
                <th class="required">
                  是否更新
                  <el-tooltip content="匹配到记录时是否对该列执行 UPDATE" placement="top">
                    <i class="el-icon-info field-info-icon" />
                  </el-tooltip>
                </th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in editUpdateFieldList" :key="'u' + index">
                <td>{{ index + 1 }}</td>
                <td>
                  <el-select
                    v-model="row.updateStream"
                    class="field-select"
                    filterable
                    allow-create
                    default-first-option
                    clearable
                    placeholder="下拉选择或者手动输入"
                  >
                    <el-option v-for="opt in streamFieldOptions" :key="'us-' + opt" :label="opt" :value="opt" />
                  </el-select>
                </td>
                <td>
                  <el-select
                    v-model="row.updateLookup"
                    class="field-select"
                    filterable
                    allow-create
                    default-first-option
                    clearable
                    placeholder="下拉选择或者手动输入"
                  >
                    <el-option v-for="opt in dbFieldOptions" :key="'ul-' + opt" :label="opt" :value="opt" />
                  </el-select>
                </td>
                <td>
                  <el-select v-model="row.update" class="field-select" placeholder="请选择">
                    <el-option label="是" :value="true" />
                    <el-option label="否" :value="false" />
                  </el-select>
                </td>
                <td>
                  <button type="button" class="btn link-btn" @click="removeUpdateRow(index)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
          <button type="button" class="btn dash-inline-btn" @click="addUpdateRow">+ 添加行</button>
        </div>
        <div class="dialog-footer">
          <button
            type="button"
            class="btn secondary-btn"
            :class="{ 'is-loading': getUpdateFieldsLoading }"
            :disabled="getUpdateFieldsLoading"
            @click="getFieldsForUpdates"
          >
            <span v-if="getUpdateFieldsLoading" class="btn-spinner" />
            {{ getUpdateFieldsLoading ? '获取中...' : '获取字段' }}
          </button>
          <button type="button" class="btn primary-btn" @click="saveUpdateFieldDialog">确定</button>
          <button type="button" class="btn secondary-btn" @click="updateDialogVisible = false">取消</button>
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
  name: 'InsertOrUpdateConfig',
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
    /** 与表输出一致：合并「获取字段」请求用的流程 JSON 时定位当前节点 */
    currentNodeId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        keys: true,
        updates: true,
        distribution: true,
        parallel: true
      },
      dbList: [],
      tableList: [],
      tableDropdownOpen: false,
      selectDialogVisible: false,
      updateDialogVisible: false,
      editSelectFieldList: [],
      editUpdateFieldList: [],
      getFieldsLoading: false,
      getUpdateFieldsLoading: false,
      streamFieldOptions: [],
      dbFieldOptions: [],
      keyConditionOptions: ['=', '= ~NULL', '<>', '<', '<=', '>', '>=', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL']
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
        const id = val != null && val !== '' ? String(val).trim() : ''
        this.syncInsertUpdateDbFieldsFromDataSourceId(id)
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
        if (val && !Array.isArray(val.selectField)) {
          this.$set(this.formData, 'selectField', [])
        }
        if (val && !Array.isArray(val.updateField)) {
          this.$set(this.formData, 'updateField', [])
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
    /** 与表输出一致：dataSourceId / dbId / dbConnection 同步为同一字符串，便于流字段等接口读取 */
    syncInsertUpdateDbFieldsFromDataSourceId(idStr) {
      const s = idStr != null && idStr !== '' ? String(idStr).trim() : ''
      this.$set(this.formData, 'dataSourceId', s)
      this.$set(this.formData, 'dbId', s)
      this.$set(this.formData, 'dbConnection', s)
      if (Object.prototype.hasOwnProperty.call(this.formData, 'dataSource')) {
        this.$delete(this.formData, 'dataSource')
      }
    },
    initFormData() {
      const legacyDs = this.formData.dataSource
      if (
        (this.formData.dataSourceId === undefined ||
          this.formData.dataSourceId === '' ||
          this.formData.dataSourceId === null) &&
        legacyDs != null &&
        legacyDs !== ''
      ) {
        this.$set(this.formData, 'dataSourceId', String(legacyDs))
      }
      if (Object.prototype.hasOwnProperty.call(this.formData, 'dataSource')) {
        this.$delete(this.formData, 'dataSource')
      }
      if (this.formData.dataSourceId === undefined) {
        this.$set(this.formData, 'dataSourceId', '')
      }
      this.syncInsertUpdateDbFieldsFromDataSourceId(this.formData.dataSourceId)
      if (this.formData.commitSize === undefined || this.formData.commitSize === '') {
        this.$set(this.formData, 'commitSize', '1000')
      }
      if (!Array.isArray(this.formData.selectField)) {
        this.$set(this.formData, 'selectField', [])
      }
      if (!Array.isArray(this.formData.updateField)) {
        this.$set(this.formData, 'updateField', [])
      }
      if (this.formData.updateBypassed === undefined) {
        this.$set(this.formData, 'updateBypassed', false)
      }
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined) {
        this.$set(this.formData, 'distributeType', false)
      }
    },
    toggleSection(section) {
      this.sectionOpen[section] = !this.sectionOpen[section]
    },
    /**
     * 与画布落库 normalizeInsertOrUpdatePluginData、后端 InsertOrUpdateConstructor 字段一致：
     * selectField[]: keyLookup, keyCondition, keyStream, keyStream2
     */
    serializeSelectFieldForPlugin(rows) {
      const arr = Array.isArray(rows) ? rows : []
      return arr.map((r) => ({
        keyLookup: r && r.keyLookup != null ? String(r.keyLookup) : '',
        keyCondition:
          r && r.keyCondition != null && String(r.keyCondition).trim() !== ''
            ? String(r.keyCondition)
            : '=',
        keyStream: r && r.keyStream != null ? String(r.keyStream) : '',
        keyStream2:
          r &&
          this.isBetweenKeyCondition(r.keyCondition) &&
          r.keyStream2 != null &&
          r.keyStream2 !== ''
            ? String(r.keyStream2)
            : ''
      }))
    },
    /**
     * updateField[]: updateLookup、updateStream、update（与 InsertOrUpdateConstructor 一致）
     */
    serializeUpdateFieldForPlugin(rows) {
      const arr = Array.isArray(rows) ? rows : []
      return arr.map((r) => {
        const up = r && r.update
        const updateBool = up === true || up === 'true' || up === 1 || up === '1'
        return {
          updateLookup: r && r.updateLookup != null ? String(r.updateLookup) : '',
          updateStream: r && r.updateStream != null ? String(r.updateStream) : '',
          update: updateBool
        }
      })
    },
    buildInsertOrUpdateInnerPayload() {
      const ds =
        this.formData.dataSourceId != null && this.formData.dataSourceId !== ''
          ? String(this.formData.dataSourceId).trim()
          : ''
      return {
        name: this.formData.name,
        description: this.formData.description != null ? String(this.formData.description) : '',
        dataSourceId: ds,
        dbId: ds,
        dbConnection: ds,
        // 与表输出一致：部分后端从 dataSource 读取库 id
        dataSource: ds,
        tableId: this.formData.tableId,
        tableName: this.formData.tableName != null ? String(this.formData.tableName) : '',
        commitSize:
          this.formData.commitSize != null && this.formData.commitSize !== ''
            ? String(this.formData.commitSize)
            : '1000',
        updateBypassed: !!this.formData.updateBypassed,
        // 必须用 formData 中已保存的映射，勿用弹窗编辑中的临时列表（否则未打开弹窗时提交为空）
        selectField: this.serializeSelectFieldForPlugin(this.formData.selectField),
        updateField: this.serializeUpdateFieldForPlugin(this.formData.updateField),
        distributeType: !!this.formData.distributeType,
        copiesCache:
          this.formData.copiesCache != null && this.formData.copiesCache !== ''
            ? this.formData.copiesCache
            : 1
      }
    },
    /** 从节点 data 取出插件参数字典（兼容 cell.data.data 与历史扁平） */
    extractInsertOrUpdatePayloadFromCellData(cellData) {
      if (!cellData || typeof cellData !== 'object') return {}
      const nested = cellData.data
      if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
        return { ...nested }
      }
      const { name, code, description, ...rest } = cellData
      return { ...rest }
    },
    buildTempFlowPayload() {
      const inner = this.buildInsertOrUpdateInnerPayload()
      return {
        cells: [
          {
            id: this.currentNodeId || 'temp-insert-update-step',
            shape: 'rect',
            data: {
              name: this.formData.name,
              code: 'InsertOrUpdate',
              data: inner
            }
          }
        ]
      }
    },
    /**
     * 供「获取字段 / 流字段」使用：在完整流程 JSON 中合并当前表单，避免仍用打开抽屉时的旧 dataSourceId（与表输出 resolveFlowConfigForFieldApi 对齐）
     */
    resolveFlowConfigForFieldApi() {
      const inner = this.buildInsertOrUpdateInnerPayload()
      const base = this.flowConfig
      if (!base || typeof base !== 'object') {
        return this.buildTempFlowPayload()
      }
      let cfg
      try {
        cfg = JSON.parse(JSON.stringify(base))
      } catch (e) {
        return this.buildTempFlowPayload()
      }
      const cells = Array.isArray(cfg.cells) ? cfg.cells : []
      if (!cells.length) {
        return this.buildTempFlowPayload()
      }
      const nid = this.currentNodeId ? String(this.currentNodeId) : ''
      let idx = nid ? cells.findIndex((c) => c && c.id === nid) : -1
      if (idx < 0) {
        idx = cells.findIndex(
          (c) =>
            c &&
            c.data &&
            c.data.code === 'InsertOrUpdate' &&
            c.data.name === this.formData.name
        )
      }
      if (idx < 0) {
        return this.buildTempFlowPayload()
      }
      const cell = cells[idx]
      if (!cell.data || typeof cell.data !== 'object') {
        cell.data = {}
      }
      const prev = this.extractInsertOrUpdatePayloadFromCellData(cell.data)
      cell.data = {
        ...cell.data,
        name: this.formData.name,
        code: 'InsertOrUpdate',
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
    async loadDbList() {
      try {
        const res = await relationalDbTree()
        if (res && res.code === '000000' && res.data) {
          this.$set(this, 'dbList', res.data)
          this.normalizeDataSourceForCascader()
        } else {
          this.$set(this, 'dbList', [])
        }
      } catch (e) {
        console.error('加载数据库列表失败:', e)
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
    normalizeDataSourceForCascader() {
      const raw = this.formData.dataSourceId
      if (raw != null && raw !== '') {
        this.$set(this.formData, 'dataSourceId', String(raw))
      }
    },
    onRelationalDbTreeVisible(visible) {
      if (!visible) return
      if (!this.dbList.length) {
        this.loadDbList()
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
    async loadTableList(dataSource) {
      try {
        const res = await dbTableList(dataSource)
        if (res && res.code === '000000' && res.data) {
          this.$set(this, 'tableList', res.data)
        } else {
          this.$set(this, 'tableList', [])
        }
      } catch (e) {
        console.error('加载表列表失败:', e)
        this.$set(this, 'tableList', [])
      }
    },
    /** 流字段2 仅在比较符号为 BETWEEN 时可用（与 Pentaho 插入/更新关键字语义一致） */
    isBetweenKeyCondition(val) {
      return val === 'BETWEEN'
    },
    onSelectKeyConditionChange(row, val) {
      if (!this.isBetweenKeyCondition(val)) {
        this.$set(row, 'keyStream2', '')
      }
    },
    openSelectFieldDialog() {
      this.editSelectFieldList = JSON.parse(JSON.stringify(this.formData.selectField || []))
      this.editSelectFieldList.forEach((row) => {
        if (!this.isBetweenKeyCondition(row.keyCondition) && row.keyStream2) {
          this.$set(row, 'keyStream2', '')
        }
      })
      if (this.formData.tableId) {
        this.loadDbFieldOptions(this.formData.tableId)
      }
      this.loadStreamFieldOptions()
      this.selectDialogVisible = true
    },
    openUpdateFieldDialog() {
      this.editUpdateFieldList = (this.formData.updateField || []).map(r => this.normalizeUpdateRow(r))
      if (this.formData.tableId) {
        this.loadDbFieldOptions(this.formData.tableId)
      }
      this.loadStreamFieldOptions()
      this.updateDialogVisible = true
    },
    normalizeUpdateRow(r) {
      const row = { ...r }
      delete row.spatialConversion
      delete row.coordinateSystem
      if (row.update === undefined) row.update = true
      return row
    },
    addSelectRow() {
      this.editSelectFieldList.push({
        keyLookup: '',
        keyCondition: '=',
        keyStream: '',
        keyStream2: ''
      })
    },
    removeSelectRow(index) {
      this.editSelectFieldList.splice(index, 1)
    },
    addUpdateRow() {
      this.editUpdateFieldList.push({
        updateStream: '',
        updateLookup: '',
        update: true
      })
    },
    removeUpdateRow(index) {
      this.editUpdateFieldList.splice(index, 1)
    },
    validateSelectRows() {
      for (let i = 0; i < this.editSelectFieldList.length; i++) {
        const r = this.editSelectFieldList[i]
        if (!r.keyLookup || !r.keyCondition || !r.keyStream) {
          this.$message.warning(`第 ${i + 1} 行：表字段、比较符号、流字段1 为必填`)
          return false
        }
        if (
          this.isBetweenKeyCondition(r.keyCondition) &&
          (r.keyStream2 === undefined || r.keyStream2 === null || String(r.keyStream2).trim() === '')
        ) {
          this.$message.warning(`第 ${i + 1} 行：比较符号为 BETWEEN 时，流字段2 为必填`)
          return false
        }
      }
      return true
    },
    validateUpdateRows() {
      for (let i = 0; i < this.editUpdateFieldList.length; i++) {
        const r = this.editUpdateFieldList[i]
        if (!r.updateStream || !r.updateLookup) {
          this.$message.warning(`第 ${i + 1} 行：流字段、表字段为必填`)
          return false
        }
        if (r.update === undefined || r.update === null) {
          this.$message.warning(`第 ${i + 1} 行：请选择是否更新`)
          return false
        }
      }
      return true
    },
    saveSelectFieldDialog() {
      if (!this.validateSelectRows()) return
      this.$set(
        this.formData,
        'selectField',
        this.editSelectFieldList.map((r) => ({
          keyLookup: r.keyLookup,
          keyCondition: r.keyCondition,
          keyStream: r.keyStream,
          keyStream2:
            this.isBetweenKeyCondition(r.keyCondition) && r.keyStream2 != null && r.keyStream2 !== ''
              ? r.keyStream2
              : ''
        }))
      )
      this.selectDialogVisible = false
    },
    saveUpdateFieldDialog() {
      if (!this.validateUpdateRows()) return
      this.$set(
        this.formData,
        'updateField',
        this.editUpdateFieldList.map((r) => ({
          updateStream: r.updateStream,
          updateLookup: r.updateLookup,
          update: !!r.update
        }))
      )
      this.updateDialogVisible = false
    },
    async getFieldsForKeys() {
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
      const { ok: dbOk, dbId } = this.parseDbIdForApi()
      if (!dbOk) {
        this.$message.warning('数据源 ID 无效，请重新选择数据源')
        return
      }
      this.getFieldsLoading = true
      try {
        const flowData = this.resolveFlowConfigForFieldApi()
        const data = {
          flowId: Number(this.flowId),
          stepName: this.formData.name,
          config: JSON.stringify(flowData),
          type: 1,
          code: 'InsertOrUpdate',
          dbId,
          tableId: this.formData.tableId ? Number(this.formData.tableId) : null
        }
        const res = await getFieldStream(data)
        if (res.code === '000000' && res.data) {
          this.editSelectFieldList = res.data.map(field => ({
            keyLookup: field.fieldDatabase || '',
            keyCondition: '=',
            keyStream: field.fieldStream || '',
            keyStream2: ''
          }))
          this.loadStreamFieldOptions()
          this.$message.success('获取字段成功')
        } else {
          this.$message.error(res.message || '获取字段失败')
        }
      } catch (e) {
        console.error(e)
        this.$message.error('获取字段失败')
      } finally {
        this.getFieldsLoading = false
      }
    },
    async getFieldsForUpdates() {
      if (this.getUpdateFieldsLoading) return
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
      const { ok: dbOk, dbId } = this.parseDbIdForApi()
      if (!dbOk) {
        this.$message.warning('数据源 ID 无效，请重新选择数据源')
        return
      }
      this.getUpdateFieldsLoading = true
      try {
        const flowData = this.resolveFlowConfigForFieldApi()
        const data = {
          flowId: Number(this.flowId),
          stepName: this.formData.name,
          config: JSON.stringify(flowData),
          type: 1,
          code: 'InsertOrUpdate',
          dbId,
          tableId: this.formData.tableId ? Number(this.formData.tableId) : null
        }
        const res = await getFieldStream(data)
        if (res.code === '000000' && res.data) {
          this.editUpdateFieldList = res.data.map((field) => ({
            updateStream: field.fieldStream || '',
            updateLookup: field.fieldDatabase || '',
            update: true
          }))
          this.loadStreamFieldOptions()
          this.$message.success('获取字段成功')
        } else {
          this.$message.error(res.message || '获取字段失败')
        }
      } catch (e) {
        console.error(e)
        this.$message.error('获取字段失败')
      } finally {
        this.getUpdateFieldsLoading = false
      }
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
        console.error(e)
        this.dbFieldOptions = []
      }
    },
    async loadStreamFieldOptions() {
      if (!this.flowId) return
      try {
        const flowData = this.resolveFlowConfigForFieldApi()
        const dsParsed = this.parseDbIdForApi()
        const res = await getFlowFieldStream({
          flowId: Number(this.flowId),
          config: JSON.stringify(flowData),
          stepName: this.formData.name || '关系库插入/更新',
          code: 'InsertOrUpdate',
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
      if (!this.formData.commitSize) {
        this.$set(this.formData, 'commitSize', '1000')
      }
      if (!this.formData.updateBypassed) {
        if (!this.formData.selectField || this.formData.selectField.length === 0) {
          this.$message.warning('请配置「用来查询的关键字」')
          return
        }
        if (!this.formData.updateField || this.formData.updateField.length === 0) {
          this.$message.warning('请配置「更新字段」')
          return
        }
      }
      this.$emit('save')
    }
  }
}
</script>

<style scoped>
.insert-update-config {
  --iu-label-width: 100px;
  --iu-label-gap: 12px;
  --iu-row-indent: calc(var(--iu-label-width) + var(--iu-label-gap));
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-content {
  flex: 1;
  padding: 16px 20px 20px;
  overflow-y: auto;
}

.config-tabs {
  margin: 0 0 12px;
}

.form-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  letter-spacing: 0.02em;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  margin-top: 8px;
  margin-bottom: 0;
}

.section-header:first-of-type {
  margin-top: 4px;
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
  font-size: 14px;
}

.section-content {
  padding: 12px 0 8px;
}

.form-item {
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
}

.form-item-checkbox {
  align-items: center;
  min-height: 32px;
  margin-bottom: 20px;
}

.form-label-spacer {
  width: var(--iu-label-width);
  margin-right: var(--iu-label-gap);
  flex-shrink: 0;
}

.form-control-block {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.form-label {
  width: var(--iu-label-width);
  font-weight: 400;
  color: #303133;
  margin-right: var(--iu-label-gap);
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

.form-input,
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
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #c0c4cc;
}

.form-input {
  height: 40px;
  padding-top: 0;
  padding-bottom: 0;
}

.form-input--fixed-num {
  flex: 0 0 auto;
  width: 160px;
  max-width: 100%;
}

.form-textarea {
  min-height: 72px;
  line-height: 1.5;
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #409eff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
}

.inline-with-help {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.inline-with-help .form-input {
  flex: 0 1 auto;
}

.inline-with-help--numeric .form-input {
  width: 160px;
  max-width: 100%;
  flex: 0 0 auto;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #f0f2f5;
  border-radius: 50%;
  font-size: 12px;
  color: #909399;
  cursor: pointer;
  flex-shrink: 0;
}

.aligned-block {
  margin-left: var(--iu-row-indent);
}

.field-mapping.aligned-block {
  width: calc(100% - var(--iu-row-indent));
  max-width: 100%;
  box-sizing: border-box;
}

.field-table-wrap {
  margin-bottom: 12px;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}

.field-actions {
  margin-bottom: 0;
}

.dash-btn {
  width: 100%;
  height: 40px;
  border: 1px dashed #409eff;
  background: #fafcff;
  color: #409eff;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.dash-btn:hover {
  background: #ecf5ff;
  border-color: #66b1ff;
  color: #66b1ff;
}

.dash-btn .el-icon-edit {
  font-size: 15px;
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
  border-top: 1px solid #ebeef5;
}

.btn {
  padding: 0 20px;
  height: 36px;
  line-height: 36px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: #fff;
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
  to {
    transform: rotate(360deg);
  }
}

.primary-btn {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.primary-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.secondary-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.relation-db-cascader {
  flex: 1;
  width: 100%;
  min-width: 0;
}

.insert-update-config ::v-deep .relation-db-cascader .el-input {
  width: 100%;
}

.insert-update-config ::v-deep .relation-db-cascader .el-input__inner {
  height: 40px;
  line-height: 40px;
  border-radius: 4px;
  padding: 0 12px;
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

.custom-select {
  flex: 1;
  position: relative;
  font-size: 14px;
}

.select-input {
  padding: 0 30px 0 15px;
  height: 40px;
  line-height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  color: #303133;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.select-input:hover {
  border-color: #c0c4cc;
}

.placeholder {
  color: #c0c4cc;
}

.arrow {
  position: absolute;
  right: 10px;
  font-size: 12px;
  color: #c0c4cc;
  transition: transform 0.3s;
  line-height: 40px;
}

.arrow.open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 9999;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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
  background-color: #f5f7fa;
}

.select-option.selected {
  color: #409eff;
  font-weight: 500;
}

.select-empty {
  padding: 10px 0;
  color: #909399;
  text-align: center;
  font-size: 14px;
}

.select-group-title {
  padding: 0 15px;
  height: 30px;
  line-height: 30px;
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  font-weight: 500;
}

.select-group .select-option {
  padding-left: 25px;
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
  background: #fff;
  border-radius: 4px;
  font-size: 14px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-wide {
  max-width: 1120px;
}

.dialog-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.dialog-field-label {
  margin: 0 0 10px;
  font-size: 14px;
  color: #606266;
}

.dialog-field-label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.field-edit-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}

.field-edit-table th,
.field-edit-table td {
  padding: 8px 6px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
  vertical-align: middle;
}

.field-edit-table-compact th,
.field-edit-table-compact td {
  padding: 6px 4px;
}

.field-edit-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.field-edit-table th.required::after {
  content: '*';
  color: #f56c6c;
  margin-left: 2px;
}

.field-select {
  width: 100%;
}

.field-info-icon {
  color: #909399;
  cursor: default;
  margin-left: 2px;
  font-size: 13px;
}

.dash-inline-btn {
  width: 100%;
  margin-top: 4px;
  height: 38px;
  border: 1px dashed #409eff;
  background: #fff;
  color: #409eff;
  border-radius: 6px;
  justify-content: center;
}

.link-btn {
  padding: 0 8px;
  height: auto;
  line-height: 1.4;
  border: none;
  background: none;
  color: #409eff;
}

.link-btn:hover {
  color: #66b1ff;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.wrap-cell {
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
}

/* 摘要表、标签页、复选框（Element UI） */
.insert-update-config ::v-deep .field-table-wrap .el-table {
  font-size: 13px;
  color: #606266;
}

.insert-update-config ::v-deep .field-table-wrap .el-table th.el-table__cell {
  background-color: #fafafa !important;
  color: #303133;
  font-weight: 600;
}

.insert-update-config ::v-deep .field-table-wrap .el-table .cell {
  line-height: 20px;
}

.insert-update-config ::v-deep .field-table-wrap .el-table__empty-text {
  color: #909399;
  font-size: 13px;
}

.insert-update-config ::v-deep .iu-checkbox .el-checkbox__label {
  color: #303133;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  vertical-align: middle;
  padding-left: 8px;
}

.insert-update-config ::v-deep .iu-checkbox .el-checkbox__input {
  vertical-align: middle;
}

.insert-update-config ::v-deep .config-tabs > .el-tabs__header {
  margin-bottom: 4px;
}

.insert-update-config ::v-deep .config-tabs .el-tabs__nav-wrap::after {
  height: 1px;
  background-color: #ebeef5;
}

.insert-update-config ::v-deep .config-tabs .el-tabs__item {
  font-size: 14px;
  color: #606266;
  height: 44px;
  line-height: 44px;
}

.insert-update-config ::v-deep .config-tabs .el-tabs__item.is-active {
  color: #409eff;
  font-weight: 500;
}

.insert-update-config ::v-deep .config-tabs .el-tabs__active-bar {
  height: 2px;
  background-color: #409eff;
}

.insert-update-config ::v-deep .advanced-layout .el-radio__label {
  font-size: 14px;
  color: #606266;
}

.insert-update-config ::v-deep .advanced-layout .el-radio__input.is-checked + .el-radio__label {
  color: #303133;
}
</style>

<style>
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

