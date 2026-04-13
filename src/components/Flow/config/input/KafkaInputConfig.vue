<template>
  <div class="kafka-input-config">
    <div class="config-content">
      <FlowConfigHero
        badge="消息"
        title="Kafka 输入"
        description="订阅 Kafka Topic，将消息解析为字段并交由本流程或子流程处理。"
        tone="indigo"
        icon="el-icon-message"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="Kafka输入">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">数据源：</label>
          <el-cascader
            v-model="formData.dataSource"
            class="form-select"
            :options="mqDbCascaderOptions"
            :props="mqDbCascaderProps"
            filterable
            clearable
            placeholder="请选择数据源"
            @visible-change="onDataSourceVisible"
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
          <label class="form-label required">Kafka Topics：</label>
          <el-select
            v-model="formData.topics"
            class="form-select"
            multiple
            filterable
            clearable
            allow-create
            default-first-option
            placeholder="请选择Kafka Topics（支持输入自定义 Topic）"
            :loading="topicLoading"
          >
            <el-option
              v-for="t in topicOptions"
              :key="t"
              :label="t"
              :value="t"
            />
          </el-select>
        </div>

        <div class="form-item">
          <label class="form-label">分区：</label>
          <input v-model="formData.partition" type="text" class="form-input" placeholder="请输入分区">
        </div>

        <div class="form-item">
          <label class="form-label required">Consumer Group：</label>
          <el-input
            v-model="formData.consumerGroup"
            class="form-el-input"
            clearable
            placeholder="请输入Consumer Group"
          />
        </div>

        <div class="form-item">
          <label class="form-label required">消息处理流程：</label>
          <el-cascader
            v-model="formData.transId"
            class="form-select"
            :options="flowCascaderOptions"
            :props="flowCascaderProps"
            :show-all-levels="false"
            placeholder="请选择消息处理流程"
            clearable
            filterable
            @visible-change="onProcessFlowVisible"
          />
        </div>

        <div class="section-header" @click="sectionOpen.fetch = !sectionOpen.fetch">
          <h4>获取消息批次配置</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.fetch ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.fetch" class="section-content">
          <div class="form-item">
            <label class="form-label required">每次获取消息持续时长（毫秒）：</label>
            <input v-model="formData.batchDuration" type="number" min="1" class="form-input" placeholder="1000">
          </div>
          <div class="form-item">
            <label class="form-label required">每次最大获取消息数量：</label>
            <input v-model="formData.batchSize" type="number" min="1" class="form-input" placeholder="1000">
          </div>
          <div class="form-item">
            <label class="form-label required">最大预取记录数：</label>
            <input v-model="formData.prefetchCount" type="number" min="1" class="form-input" placeholder="100000">
          </div>
          <div class="form-item">
            <label class="form-label required">偏移量提交方式：</label>
            <el-select v-model="formData.commitType" class="form-select" placeholder="请选择偏移量提交方式" clearable>
              <el-option
                v-for="opt in commitTypeOptions"
                :key="String(opt.value)"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>
        </div>

        <div
          class="section-header section-header--emphasis"
          @click="sectionOpen.fields = !sectionOpen.fields"
        >
          <h4>字段配置</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.fields ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.fields" class="section-content">
          <div class="field-table-wrap kafka-fields-preview-wrap">
            <el-table
              :data="formData.fieldList"
              border
              style="width: 100%"
              max-height="280"
            >
              <el-table-column type="index" label="#" width="48" align="center" />
              <el-table-column
                prop="kafkaName"
                label="输入字段名称"
                class-name="kfk-field-preview-col"
                label-class-name="kfk-field-preview-col"
                show-overflow-tooltip
              />
              <el-table-column
                label="输出字段名称"
                class-name="kfk-field-preview-col kfk-output-name-cell"
                label-class-name="kfk-field-preview-col"
                show-overflow-tooltip
              >
                <template slot-scope="scope">
                  <div class="kfk-output-name-row">
                    <span class="kfk-output-name-row__text">{{ scope.row.outputName }}</span>
                    <i class="el-icon-edit-outline kfk-output-name-row__icon" aria-hidden="true" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                prop="outputType"
                label="字段类型"
                class-name="kfk-field-preview-col"
                label-class-name="kfk-field-preview-col"
                show-overflow-tooltip
              />
            </el-table>
          </div>
          <div class="field-actions">
            <button type="button" class="dash-btn" @click="openFieldEditor">
              <i class="el-icon-edit" /> 编辑配置
            </button>
          </div>
        </div>

        <div
          class="section-header section-header--emphasis"
          @click="sectionOpen.properties = !sectionOpen.properties"
        >
          <h4>Kafka选项配置</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.properties ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.properties" class="section-content">
          <div class="field-table-wrap kafka-props-preview-wrap">
            <el-table
              :data="propertiesList"
              border
              style="width: 100%"
              max-height="240"
            >
              <el-table-column type="index" label="#" width="48" align="center" />
              <el-table-column
                prop="name"
                label="名称"
                class-name="kfk-prop-preview-col"
                label-class-name="kfk-prop-preview-col"
                show-overflow-tooltip
              />
              <el-table-column
                prop="value"
                label="值"
                class-name="kfk-prop-preview-col"
                label-class-name="kfk-prop-preview-col"
                show-overflow-tooltip
              />
            </el-table>
          </div>
          <div class="field-actions">
            <button type="button" class="dash-btn" @click="openPropertiesEditor">
              <i class="el-icon-edit" /> 编辑配置
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
          <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
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
              <label class="form-label">并发数量：</label>
              <input v-model.number="formData.copiesCache" type="number" min="1" class="form-input" placeholder="1">
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
          <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
        </div>
      </template>
    </div>

    <el-dialog
      :visible.sync="fieldEditor.visible"
      title="字段配置"
      width="860px"
      top="6vh"
      custom-class="kafka-fields-dialog"
      append-to-body
      :close-on-click-modal="false"
      @close="closeFieldEditor"
    >
      <div class="dlg-body kafka-field-dlg-body">
        <div class="dlg-table">
          <el-table :data="fieldEditor.list" border style="width: 100%">
            <el-table-column type="index" label="#" width="56" />
            <el-table-column prop="kafkaName" label="输入字段名称" min-width="180" />
            <el-table-column label="输出字段名称" min-width="220">
              <template slot-scope="scope">
                <el-input v-model="scope.row.outputName" size="small" placeholder="请输入输出字段名称" />
              </template>
            </el-table-column>
            <el-table-column label="字段类型" min-width="140">
              <template slot-scope="scope">
                <span class="field-type-readonly">{{ scope.row.outputType }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <span slot="footer" class="dlg-footer">
        <el-button @click="fieldEditor.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmFieldEditor">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="propertiesEditor.visible"
      title="Kafka选项配置"
      width="720px"
      top="6vh"
      custom-class="kafka-properties-dialog"
      append-to-body
      :close-on-click-modal="false"
      @close="closePropertiesEditor"
    >
      <div class="dlg-body kafka-props-dlg-body">
        <div class="dlg-label"><span class="req-dot">*</span>字段：</div>
        <div class="dlg-table kafka-props-dlg-table">
          <!-- 空表不用 el-table：Element 会给 empty-block height:100% 在 flex 下撑出大块留白 -->
          <div
            v-if="!(propertiesEditor.list && propertiesEditor.list.length)"
            class="kafka-props-empty-shell"
          >
            <div class="kafka-props-empty-shell__head">
              <div class="col-idx">#</div>
              <div class="col-name">名称</div>
              <div class="col-val">值</div>
              <div class="col-op">操作</div>
            </div>
            <div class="kafka-props-empty-shell__body">暂无数据</div>
          </div>
          <el-table
            v-else
            :data="propertiesEditor.list"
            border
            style="width: 100%"
            :max-height="propertiesEditorTableMaxHeight"
          >
            <el-table-column type="index" label="#" width="56" />
            <el-table-column label="名称" min-width="220">
              <template slot-scope="scope">
                <el-input v-model="scope.row.name" size="small" placeholder="请输入名称" />
              </template>
            </el-table-column>
            <el-table-column label="值" min-width="260">
              <template slot-scope="scope">
                <el-input v-model="scope.row.value" size="small" placeholder="请输入值" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="removePropertyRow(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <button type="button" class="dash-btn dlg-add-row-btn" @click="addPropertyRow">
            <i class="el-icon-plus" /> 添加行
          </button>
        </div>
      </div>

      <span slot="footer" class="dlg-footer">
        <el-button @click="propertiesEditor.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmPropertiesEditor">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { tree as flowTree } from '@/api/collect/trans/transFlow'
import { mqDbTree, topics as kafkaTopics } from '@/api/collect/plugin/kafka'
import FlowConfigHero from '../common/FlowConfigHero.vue'

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

function buildDefaultFieldList() {
  return [
    { kafkaName: 'key', outputName: 'key', outputType: 'String' },
    { kafkaName: 'message', outputName: 'message', outputType: 'String' },
    { kafkaName: 'topic', outputName: 'topic', outputType: 'String' },
    { kafkaName: 'partition', outputName: 'partition', outputType: 'Integer' },
    { kafkaName: 'offset', outputName: 'offset', outputType: 'Integer' },
    { kafkaName: 'timestamp', outputName: 'timestamp', outputType: 'Integer' }
  ]
}

function safeParseArrayJson(str) {
  if (!str) return []
  try {
    const v = JSON.parse(String(str))
    return Array.isArray(v) ? v : []
  } catch (e) {
    return []
  }
}

function normalizeId(v) {
  if (v == null) return ''
  const s = String(v).trim()
  return s === '' ? '' : s
}

function normalizeNumberOrNull(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Kafka 选项弹窗表格：有数据时随行数增高，超过上限后表体内滚动；空表不传 max-height，避免表体占位 */
const KAFKA_PROPS_TABLE_CAP = 300
const KAFKA_PROPS_TABLE_HEADER = 44
const KAFKA_PROPS_TABLE_ROW = 50

export default {
  name: 'KafkaInputConfig',
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
    componentTreeConfig: {
      type: [Object, String, Array],
      default: null
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        fetch: true,
        fields: true,
        properties: true,
        distribution: false,
        parallel: false
      },
      dataSourceOptions: [],
      mqDbCascaderOptions: [],
      mqDbNodeTypeByValue: {},
      flowCascaderOptions: [],
      topicOptions: [],
      topicLoading: false,
      fieldEditor: {
        visible: false,
        list: []
      },
      propertiesEditor: {
        visible: false,
        list: []
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
    flowCascaderProps() {
      return {
        expandTrigger: 'hover',
        value: 'value',
        label: 'label',
        children: 'children',
        emitPath: false
      }
    },
    mqDbCascaderProps() {
      return {
        expandTrigger: 'hover',
        value: 'value',
        label: 'label',
        children: 'children',
        // 允许选择任意层级（包含 GROUP 分组节点），但后续会根据 type=GROUP 控制不调 topics 且提交时校验
        checkStrictly: true,
        emitPath: false
      }
    },
    /** 仅展示已写入 formData 的配置；弹窗内编辑用 propertiesEditor.list，避免未点确定时侧栏跟动 */
    propertiesList() {
      const list = safeParseArrayJson(this.formData.properties)
      if (!Array.isArray(list)) return []
      return list.map(x => ({
        name: x && x.name != null ? String(x.name) : '',
        value: x && x.value != null ? String(x.value) : ''
      }))
    },
    /** 仅在有行时用于 el-table；空表用占位 DOM，不走此值 */
    propertiesEditorTableMaxHeight() {
      const n = Array.isArray(this.propertiesEditor.list) ? this.propertiesEditor.list.length : 0
      const natural = KAFKA_PROPS_TABLE_HEADER + n * KAFKA_PROPS_TABLE_ROW + 6
      return Math.min(KAFKA_PROPS_TABLE_CAP, Math.max(natural, 120))
    },
    commitTypeOptions() {
      const dicts = this.parseComponentDicts(this.componentTreeConfig)
      const hit = dicts.find(d => String(d.dictCode || '').trim() === 'commitType')
      const list = Array.isArray(hit && hit.list) ? hit.list : []
      const options = list
        .map((x) => ({
          value: x && x.code != null ? String(x.code) : '',
          label: x && x.value != null ? String(x.value) : ''
        }))
        .filter(x => x.value && x.label)

      // 兜底：避免无配置时页面不可用
      if (!options.length) {
        return [
          { value: '1', label: '批次执行成功后提交' },
          { value: '2', label: '读取消息后提交' }
        ]
      }
      return options
    }
  },
  mounted() {
    this.initDefaults()
    this.loadDataSourceTree()
    this.bootstrapPropertiesFromForm()
    // 若已有选中值，提前加载级联 options 以便回显 label
    if (this.formData.transId != null && this.formData.transId !== '') {
      this.loadFlowCascaderOptions()
    }
    if (
      this.formData.dataSource != null &&
      String(this.formData.dataSource) !== '' &&
      this.getMqDbNodeType(this.formData.dataSource) !== 'GROUP'
    ) {
      this.loadTopicOptions(this.formData.dataSource)
    }
  },
  watch: {
    'formData.dataSource': {
      handler(v, oldV) {
        if (v === oldV) return
        // 切换数据源时，清空 topics（避免误用旧数据源的 topic）
        this.$set(this.formData, 'topics', [])
        this.topicOptions = []

        // type=GROUP：不调 topics 接口（只用于分组展示）
        if (v != null && String(v) !== '' && this.getMqDbNodeType(v) === 'GROUP') {
          return
        }

        if (v != null && String(v) !== '') {
          this.loadTopicOptions(v)
        }
      }
    }
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', 'Kafka输入')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      // dataSource：统一用 string（与 Cascader option.value 对齐）
      if (this.formData.dataSource === undefined || this.formData.dataSource === null) {
        this.$set(this.formData, 'dataSource', '')
      } else {
        this.$set(this.formData, 'dataSource', normalizeId(this.formData.dataSource))
      }
      // topics 兼容：后端可能存成 JSON 字符串（如 ["a","b"]）或单个字符串
      if (!Array.isArray(this.formData.topics)) {
        const raw = this.formData.topics
        let parsed = []
        if (typeof raw === 'string') {
          parsed = safeParseArrayJson(raw)
          if (!parsed.length && String(raw).trim()) parsed = [String(raw).trim()]
        }
        this.$set(this.formData, 'topics', parsed)
      }
      this.topicOptions = Array.isArray(this.formData.topics) ? [...this.formData.topics] : []
      if (this.formData.partition === undefined) this.$set(this.formData, 'partition', '')
      if (this.formData.consumerGroup === undefined) this.$set(this.formData, 'consumerGroup', '')

      // 消息处理流程：默认绑定当前流程（若存在）
      if (this.formData.transId === undefined || this.formData.transId === null || this.formData.transId === '') {
        this.$set(this.formData, 'transId', this.flowId != null && this.flowId !== '' ? Number(this.flowId) : null)
      } else {
        // 兼容后端保存为 string 的情况，统一为 number，避免 cascader 回显失败
        this.$set(this.formData, 'transId', normalizeNumberOrNull(this.formData.transId))
      }

      if (this.formData.batchDuration === undefined || this.formData.batchDuration === '') this.$set(this.formData, 'batchDuration', 1000)
      if (this.formData.batchSize === undefined || this.formData.batchSize === '') this.$set(this.formData, 'batchSize', 1000)
      if (this.formData.prefetchCount === undefined || this.formData.prefetchCount === '') this.$set(this.formData, 'prefetchCount', 100000)

      const commitValues = this.commitTypeOptions.map(x => String(x.value))
      const firstCommit = commitValues.length ? commitValues[0] : '1'
      const rawCommit = this.formData.commitType != null ? String(this.formData.commitType) : ''
      // 兼容历史值
      if (rawCommit === 'AUTO_COMMIT' && commitValues.includes('1')) {
        this.$set(this.formData, 'commitType', '1')
      } else if (rawCommit === 'READ_COMMIT' && commitValues.includes('2')) {
        this.$set(this.formData, 'commitType', '2')
      } else if (!rawCommit || !commitValues.includes(rawCommit)) {
        this.$set(this.formData, 'commitType', firstCommit)
      }

      // 字段配置固定默认值（不提供编辑）
      const defaults = buildDefaultFieldList()
      const curr = Array.isArray(this.formData.fieldList) ? clone(this.formData.fieldList) : []
      if (!curr.length) {
        this.$set(this.formData, 'fieldList', defaults)
      } else {
        // 保留既有（若后端/历史配置带回），但缺项补齐
        const map = new Map(curr.map(x => [String(x.kafkaName || ''), x]))
        const merged = defaults.map((d) => {
          const hit = map.get(String(d.kafkaName))
          return {
            kafkaName: d.kafkaName,
            outputName: hit && hit.outputName != null ? String(hit.outputName) : d.outputName,
            outputType: hit && hit.outputType != null ? String(hit.outputType) : d.outputType
          }
        })
        this.$set(this.formData, 'fieldList', merged)
      }

      // 高级配置默认（与其他组件一致，保留字段方便后续扩展）
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)

      // properties：后端期望 string(JSON array)
      if (this.formData.properties === undefined) this.$set(this.formData, 'properties', '[]')
    },

    async loadDataSourceTree() {
      try {
        const res = await mqDbTree()
        const nodes = Array.isArray(res?.data) ? res.data : (res?.data ? [res.data] : [])
        this.dataSourceOptions = this.flattenMqDbNodes(nodes)
        const { options, nodeTypeByValue } = this.buildMqDbCascaderOptions(nodes)
        this.mqDbCascaderOptions = options
        this.mqDbNodeTypeByValue = nodeTypeByValue
      } catch (e) {
        this.dataSourceOptions = []
        this.mqDbCascaderOptions = []
        this.mqDbNodeTypeByValue = {}
      }
    },
    flattenMqDbNodes(nodes) {
      const out = []
      const walk = (arr) => {
        ;(arr || []).forEach((n) => {
          if (!n) return
          // kafkaService.mqDbTree() 的节点结构在不同环境可能略有差异，尽量兼容：
          // - 叶子节点：id/name 或 dbId/dbName
          // - 可能不带 type 字段
          const id = n.id != null ? n.id : n.dbId
          const name = n.name != null ? n.name : n.dbName
          if (id != null && name != null) {
            out.push({ id, name })
          }
          if (Array.isArray(n.children) && n.children.length) {
            walk(n.children)
          }
        })
      }
      walk(nodes)
      // 去重（可能存在分组/叶子重复）
      const uniq = new Map()
      out.forEach((x) => {
        const key = String(x.id)
        if (!uniq.has(key)) uniq.set(key, { id: x.id, name: x.name })
      })
      return Array.from(uniq.values())
    },
    getMqDbNodeType(value) {
      if (value == null || value === '') return ''
      const hit = this.mqDbNodeTypeByValue[String(value)]
      return hit ? String(hit).toUpperCase() : ''
    },
    buildMqDbCascaderOptions(nodes) {
      const safeText = (v) => (v == null ? '' : String(v))
      const nodeTypeByValue = {}
      const build = (arr, parentPath) => {
        return (arr || [])
          .filter(Boolean)
          .map((n, idx) => {
            const rawId = n.id != null ? n.id : n.dbId
            const rawName = n.name != null ? n.name : n.dbName
            const label = safeText(rawName) || '未命名'
            const children = Array.isArray(n.children) ? n.children : []
            const nodeType = safeText(n.type).toUpperCase()
            const isGroupType = nodeType === 'GROUP'

            // 注意：Cascader 每个节点都需要 value。对分组节点用稳定的“路径值”兜底。
            const pathValue = parentPath ? `${parentPath}/${idx}-${label}` : `${idx}-${label}`
            // 重要：value 统一用 string，避免 "1" vs 1 导致回显失败
            const value = rawId != null ? String(rawId) : `group:${pathValue}`

            const normalizedType = nodeType || (children.length ? 'GROUP' : 'DATASOURCE')
            nodeTypeByValue[String(value)] = normalizedType

            const option = {
              value,
              label,
              type: normalizedType
            }
            if (children.length) {
              option.children = build(children, pathValue)
            }
            return option
          })
      }
      return { options: build(nodes, ''), nodeTypeByValue }
    },
    parseComponentDicts(raw) {
      if (raw == null) return []
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          return Array.isArray(parsed) ? parsed : []
        } catch (e) {
          return []
        }
      }
      if (typeof raw === 'object') {
        if (Array.isArray(raw.dicts)) return raw.dicts
        if (Array.isArray(raw.list)) return raw.list
        return [raw]
      }
      return []
    },
    async onDataSourceVisible(visible) {
      if (!visible) return
      if (!this.dataSourceOptions.length) {
        await this.loadDataSourceTree()
      }
    },

    async loadTopicOptions(dbId) {
      if (dbId == null || String(dbId) === '') {
        this.topicOptions = []
        return
      }
      this.topicLoading = true
      try {
        const res = await kafkaTopics(dbId)
        const list = Array.isArray(res?.data) ? res.data : []
        const topics = list.map(x => String(x)).filter(Boolean)
        // 保留用户已输入的自定义 topic（allow-create），并合并后端返回列表
        const selected = Array.isArray(this.formData.topics) ? this.formData.topics.map(t => String(t)).filter(Boolean) : []
        const merged = Array.from(new Set([...topics, ...selected]))
        this.topicOptions = merged
      } catch (e) {
        this.topicOptions = Array.isArray(this.formData.topics) ? [...this.formData.topics] : []
      } finally {
        this.topicLoading = false
      }
    },

    async onProcessFlowVisible(visible) {
      if (!visible) return
      if (this.flowCascaderOptions.length) return
      await this.loadFlowCascaderOptions()
    },
    async loadFlowCascaderOptions() {
      try {
        const flowRes = await flowTree()
        const flowTreeData = (flowRes && flowRes.data) || []
        this.flowCascaderOptions = flowTreeData
          .filter((n) => n && n.type === 'GROUP')
          .map((g) => this.buildGroupOption(g))
          .filter((opt) => opt && opt.children && opt.children.length)
      } catch (e) {
        this.flowCascaderOptions = []
      }
    },
    buildGroupOption(groupNode) {
      if (!groupNode || groupNode.type !== 'GROUP') return null
      const children = Array.isArray(groupNode.children) ? groupNode.children : []
      const childOptions = []
      children.forEach((child) => {
        if (!child) return
        if (child.type === 'TRANS_FLOW') {
          childOptions.push({
            value: child.id,
            label: child.name,
            leaf: true
          })
          return
        }
        if (child.type === 'GROUP') {
          const subOpt = this.buildGroupOption(child)
          if (subOpt && subOpt.children && subOpt.children.length) {
            childOptions.push(subOpt)
          }
        }
      })
      if (!childOptions.length) return null
      return {
        value: groupNode.id,
        label: groupNode.name,
        children: childOptions
      }
    },

    bootstrapPropertiesFromForm() {
      const list = safeParseArrayJson(this.formData.properties)
      this.propertiesEditor.list = (list || [])
        .filter(x => x && (x.name != null || x.value != null))
        .map(x => ({ name: x.name != null ? String(x.name) : '', value: x.value != null ? String(x.value) : '' }))
    },
    openFieldEditor() {
      const defaults = buildDefaultFieldList()
      const curr = Array.isArray(this.formData.fieldList) ? this.formData.fieldList : []
      const map = new Map(curr.map(x => [String(x.kafkaName || ''), x]))
      this.fieldEditor.list = defaults.map((d) => {
        const hit = map.get(String(d.kafkaName))
        return {
          kafkaName: d.kafkaName,
          outputName: hit && hit.outputName != null ? String(hit.outputName) : d.outputName,
          outputType: hit && hit.outputType != null ? String(hit.outputType) : d.outputType
        }
      })
      this.fieldEditor.visible = true
    },
    closeFieldEditor() {
      // 仅点击确定时回填
    },
    confirmFieldEditor() {
      const list = Array.isArray(this.fieldEditor.list) ? this.fieldEditor.list : []
      const invalid = list.some(x => !x || !String(x.outputName || '').trim())
      if (invalid) {
        this.$message.warning('请填写完整的输出字段名称')
        return
      }
      this.$set(this.formData, 'fieldList', list.map(x => ({
        kafkaName: String(x.kafkaName || ''),
        outputName: String(x.outputName || '').trim(),
        outputType: String(x.outputType || 'String').trim()
      })))
      this.fieldEditor.visible = false
    },
    openPropertiesEditor() {
      this.bootstrapPropertiesFromForm()
      this.propertiesEditor.visible = true
    },
    closePropertiesEditor() {
      // 不做同步，避免误写入；只有点击“确定”才回填
    },
    addPropertyRow() {
      if (!Array.isArray(this.propertiesEditor.list)) this.propertiesEditor.list = []
      this.propertiesEditor.list.push({ name: '', value: '' })
    },
    removePropertyRow(idx) {
      if (!Array.isArray(this.propertiesEditor.list)) return
      this.propertiesEditor.list.splice(idx, 1)
    },
    confirmPropertiesEditor() {
      const cleaned = (this.propertiesEditor.list || [])
        .map(x => ({
          name: x && x.name != null ? String(x.name).trim() : '',
          value: x && x.value != null ? String(x.value).trim() : ''
        }))
        .filter(x => x.name && x.value)
      this.propertiesEditor.list = cleaned.length ? cleaned : []
      this.$set(this.formData, 'properties', JSON.stringify(this.propertiesEditor.list))
      this.propertiesEditor.visible = false
    },

    buildPayloadForSave() {
      const raw = { ...this.formData }
      raw.name = String(raw.name || '').trim()
      raw.description = raw.description != null ? String(raw.description) : ''
      raw.dataSource = raw.dataSource != null && raw.dataSource !== '' ? String(raw.dataSource) : null
      raw.topics = Array.isArray(raw.topics) ? raw.topics.filter(Boolean).map(t => String(t).trim()).filter(Boolean) : []
      raw.partition = raw.partition != null ? String(raw.partition).trim() : ''
      raw.consumerGroup = raw.consumerGroup != null ? String(raw.consumerGroup).trim() : ''
      raw.transId = raw.transId != null && raw.transId !== '' ? Number(raw.transId) : null

      raw.batchDuration = raw.batchDuration != null && raw.batchDuration !== '' ? String(Math.max(1, Math.trunc(Number(raw.batchDuration)))) : '1000'
      raw.batchSize = raw.batchSize != null && raw.batchSize !== '' ? String(Math.max(1, Math.trunc(Number(raw.batchSize)))) : '1000'
      raw.prefetchCount = raw.prefetchCount != null && raw.prefetchCount !== '' ? String(Math.max(1, Math.trunc(Number(raw.prefetchCount)))) : '100000'
      const commitValues = this.commitTypeOptions.map(x => String(x.value))
      const firstCommit = commitValues.length ? commitValues[0] : '1'
      raw.commitType = raw.commitType != null && raw.commitType !== '' ? String(raw.commitType) : firstCommit

      // 字段配置：按用户编辑结果保存（保留默认顺序与键）
      const defaults = buildDefaultFieldList()
      const curr = Array.isArray(raw.fieldList) ? raw.fieldList : []
      const map = new Map(curr.map(x => [String(x.kafkaName || ''), x]))
      raw.fieldList = defaults.map((d) => {
        const hit = map.get(String(d.kafkaName))
        return {
          kafkaName: d.kafkaName,
          outputName: hit && hit.outputName != null ? String(hit.outputName).trim() : d.outputName,
          outputType: hit && hit.outputType != null ? String(hit.outputType).trim() : d.outputType
        }
      })

      // properties：仅以 formData 为准（弹窗草稿未点确定不参与保存）
      const list = safeParseArrayJson(raw.properties)
      raw.properties = JSON.stringify((Array.isArray(list) ? list : []).map(x => ({
        name: x && x.name != null ? String(x.name).trim() : '',
        value: x && x.value != null ? String(x.value).trim() : ''
      })).filter(x => x.name && x.value))

      // KafkaInput 后端目前不消费分发/并发，仍保持与画布字段一致
      raw.distributeType = !!raw.distributeType
      raw.copiesCache = raw.copiesCache != null && raw.copiesCache !== '' ? Math.max(1, Math.trunc(Number(raw.copiesCache))) : 1
      return raw
    },

    handleSubmit() {
      const payload = this.buildPayloadForSave()
      if (!payload.name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      if (!payload.dataSource) {
        this.$message.warning('请选择数据源')
        return
      }
      if (this.getMqDbNodeType(payload.dataSource) === 'GROUP') {
        this.$message.warning('请选择具体的数据源（分组不可作为数据源）')
        return
      }
      if (!payload.topics || payload.topics.length === 0) {
        this.$message.warning('请选择Kafka Topics')
        return
      }
      if (!payload.consumerGroup) {
        this.$message.warning('请输入Consumer Group')
        return
      }
      if (!payload.transId) {
        this.$message.warning('请选择消息处理流程')
        return
      }
      this.$emit('save', payload)
    }
  }
}
</script>

<style lang="scss" scoped>
.kafka-input-config {
  height: 100%;
}

.config-content {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.config-tabs {
  margin: 0 0 8px;
}

.kafka-input-config ::v-deep .flow-config-hero__title {
  font-weight: 400;
}

.kafka-input-config ::v-deep .flow-config-hero__badge {
  font-weight: 400;
}

.kafka-input-config ::v-deep .config-tabs .el-tabs__item {
  font-weight: 400;
}

.kafka-input-config ::v-deep .config-tabs .el-tabs__item.is-active {
  font-weight: 400;
}

.form-title {
  font-size: 14px;
  font-weight: 400;
  color: #303133;
  margin-bottom: 12px;
}

.form-item {
  margin-bottom: 16px;
  display: block;
}

.form-label {
  display: block;
  width: 100%;
  text-align: left;
  line-height: 20px;
  color: #606266;
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 8px;
}

.form-label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #409eff;
}

.form-select {
  width: 100%;
}

/* ElementUI el-input：与 form-input 视觉对齐，但不污染 el-input 外层容器 */
.form-el-input {
  width: 100%;
}

.kafka-input-config ::v-deep .form-el-input .el-input__inner {
  height: 40px;
  line-height: 40px;
  padding: 0 12px;
  border-radius: 4px;
  font-weight: 400;
}

.kafka-input-config ::v-deep .form-select .el-input__inner,
.kafka-input-config ::v-deep .el-cascader .el-input__inner {
  font-weight: 400;
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
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: #409eff;
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
  font-weight: 400;
  color: #303133;
}

.section-header--emphasis h4 {
  font-weight: 600;
}

.section-toggle {
  color: #909399;
}

.section-content {
  padding-top: 8px;
  margin-bottom: 8px;
}

.field-table-wrap {
  width: 100%;
  max-width: 100%;
  margin-bottom: 10px;
}

/* 预览表：不出现横向滚动条；字段配置三列（除序号）均分宽度 */
.kafka-fields-preview-wrap ::v-deep .el-table__body-wrapper,
.kafka-fields-preview-wrap ::v-deep .el-table__header-wrapper,
.kafka-props-preview-wrap ::v-deep .el-table__body-wrapper,
.kafka-props-preview-wrap ::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
}

.kafka-fields-preview-wrap ::v-deep .el-table__header table,
.kafka-fields-preview-wrap ::v-deep .el-table__body table,
.kafka-props-preview-wrap ::v-deep .el-table__header table,
.kafka-props-preview-wrap ::v-deep .el-table__body table {
  table-layout: fixed;
  width: 100% !important;
}

/* 用列 class 均分，避免纵向滚动条插入 gutter 列时 colgroup nth-child 错位 */
.kafka-fields-preview-wrap ::v-deep th.kfk-field-preview-col,
.kafka-fields-preview-wrap ::v-deep td.kfk-field-preview-col {
  width: calc((100% - 48px) / 3) !important;
  min-width: 0 !important;
}

.kafka-props-preview-wrap ::v-deep th.kfk-prop-preview-col,
.kafka-props-preview-wrap ::v-deep td.kfk-prop-preview-col {
  width: calc((100% - 48px) / 2) !important;
  min-width: 0 !important;
}

.tips {
  color: #909399;
  font-size: 12px;
  margin-top: -4px;
}

/* 输出字段名称：文案左对齐省略，编辑图标统一贴单元格右侧 */
.kafka-fields-preview-wrap ::v-deep td.kfk-output-name-cell .cell {
  display: block;
}

.kfk-output-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.kfk-output-name-row__text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kfk-output-name-row__icon {
  flex-shrink: 0;
  color: #409eff;
  font-size: 14px;
  line-height: 1;
}

.advanced-layout {
  padding-top: 2px;
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
  font-weight: 400;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  height: 36px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
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

.secondary-btn {
  background: #fff;
  color: #606266;
  border-color: #dcdfe6;
}

.secondary-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.dash-btn {
  width: 100%;
  max-width: 520px;
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
  transition: all 0.2s;
}

.dash-btn:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.field-actions {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.dlg-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kafka-field-dlg-body {
  gap: 0;
}

.kafka-props-dlg-body {
  gap: 8px;
}

.dlg-table {
  width: 100%;
}

.field-type-readonly {
  display: inline-block;
  padding: 0 2px;
  font-size: 13px;
  line-height: 32px;
  color: #606266;
}

.dlg-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.req-dot {
  color: #f56c6c;
  margin-right: 4px;
}

.dlg-add-row-btn {
  margin-top: 8px;
  max-width: 100%;
}

/* Kafka 选项弹窗：无数据时替代 el-table，避免 Element 空表占位 */
.kafka-props-empty-shell {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 2px;
  overflow: hidden;
  font-size: 14px;
  color: #606266;
  background: #fff;
}

.kafka-props-empty-shell__head {
  display: flex;
  align-items: stretch;
  min-height: 40px;
  color: #909399;
  font-weight: 500;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.kafka-props-empty-shell__head .col-idx {
  width: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #ebeef5;
}

.kafka-props-empty-shell__head .col-name,
.kafka-props-empty-shell__head .col-val {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 10px 10px 10px 12px;
  border-right: 1px solid #ebeef5;
}

.kafka-props-empty-shell__head .col-op {
  width: 90px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding-left: 10px;
}

.kafka-props-empty-shell__body {
  text-align: center;
  color: #909399;
  padding: 14px 12px;
  line-height: 1.5;
  background: #fff;
}

.dlg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

<style>
/* 字段配置弹窗：收紧内边距，避免表格下方大块留白 */
.kafka-fields-dialog {
  max-width: calc(100vw - 48px);
}

.kafka-fields-dialog .el-dialog__body {
  padding: 10px 16px 6px;
}

.kafka-fields-dialog .el-dialog__footer {
  padding: 8px 16px 12px;
}

/* Kafka 选项配置弹窗（提高选择器权重，压过全局 .el-dialog 相关规则） */
.el-dialog.kafka-properties-dialog:not(.is-fullscreen) {
  max-width: calc(100vw - 48px);
  height: fit-content !important;
  max-height: calc(100vh - 32px);
}

.el-dialog.kafka-properties-dialog:not(.is-fullscreen) .el-dialog__body {
  flex: 0 0 auto !important;
  flex-grow: 0 !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow-x: hidden;
  overflow-y: visible !important;
  padding: 10px 16px 6px;
}

.el-dialog.kafka-properties-dialog:not(.is-fullscreen) .el-dialog__footer {
  flex: 0 0 auto !important;
  padding: 8px 16px 12px;
}

/* 有行时表格内仍可能触发空样式，兜底压缩 */
.kafka-properties-dialog .el-table__empty-block {
  min-height: 40px !important;
  height: auto !important;
}

.kafka-properties-dialog .el-table {
  flex: 0 0 auto !important;
}

.kafka-properties-dialog .el-table__body-wrapper {
  min-height: 0 !important;
}
</style>
