<template>
  <div class="rabbitmq-consumer-input-config">
    <div class="config-content">
      <FlowConfigHero
        badge="消息"
        title="RabbitMQ 输入"
        description="从 RabbitMQ 队列消费消息，映射消息属性到输出字段，并交由后续步骤处理。"
        tone="teal"
        icon="el-icon-download"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="RabbitMQ输入">
        </div>

        <div class="form-item">
          <label class="form-label">说明</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">数据源</label>
          <el-cascader
            v-model="formData.dataSourceId"
            class="form-select"
            :options="mqDbCascaderOptions"
            :props="mqDbCascaderProps"
            filterable
            clearable
            placeholder="请选择 RabbitMQ 数据源"
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
          <label class="form-label">虚拟主机 (virtualHost)</label>
          <el-input
            v-model="formData.virtualHost"
            class="form-el-input"
            clearable
            placeholder="/"
          />
        </div>

        <div class="form-item">
          <label class="form-label required">队列名 (queue)</label>
          <el-input
            v-model="formData.queue"
            class="form-el-input"
            clearable
            placeholder="与下方候选队列二选一：均可填，后端优先 queue，否则取 topics 首项"
          />
        </div>

        <div class="form-item">
          <label class="form-label">候选队列 / 别名 (topics)</label>
          <el-select
            v-model="topicsModel"
            class="form-select"
            multiple
            filterable
            allow-create
            default-first-option
            collapse-tags
            placeholder="可选；未填 queue 时取首项作为队列名"
          />
        </div>

        <div
          class="section-header"
          @click="sectionOpen.listener = !sectionOpen.listener"
        >
          <h4>监听器与拉取</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.listener ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.listener" class="section-content">
          <div class="form-item">
            <label class="form-label">确认模式 (listenerAcknowledgeMode)</label>
            <el-select v-model="formData.listenerAcknowledgeMode" class="form-select" placeholder="请选择" clearable>
              <el-option label="手动确认（对应 Spring MANUAL）" value="manual" />
              <el-option label="自动确认（AUTO / 其他非 manual）" value="auto" />
            </el-select>
            <p class="field-hint">与后端一致：manual、空、或 MANUAL_COMMIT 类值为手动确认；其余为自动确认。</p>
          </div>
          <div class="form-item">
            <label class="form-label">Prefetch (listenerPrefetch)</label>
            <input v-model.number="formData.listenerPrefetch" type="number" min="1" class="form-input" placeholder="1">
          </div>
          <div class="form-item">
            <label class="form-label">并发 (listenerConcurrency)</label>
            <input v-model.number="formData.listenerConcurrency" type="number" min="1" class="form-input" placeholder="1">
          </div>
          <div class="form-item">
            <label class="form-label">最大并发 (listenerMaxConcurrency)</label>
            <input v-model.number="formData.listenerMaxConcurrency" type="number" min="1" class="form-input" placeholder="1">
          </div>
          <div class="form-item form-item--inline">
            <label class="form-label">拒绝重回队列 (listenerDefaultRequeueRejected)</label>
            <el-switch v-model="formData.listenerDefaultRequeueRejected" active-text="是" inactive-text="否" />
          </div>
          <div class="form-item form-item--inline">
            <label class="form-label">重试开启 (listenerRetryEnabled)</label>
            <el-switch v-model="formData.listenerRetryEnabled" active-text="开启" inactive-text="关闭" />
          </div>
          <div class="form-item">
            <label class="form-label">重试初始间隔 ms (listenerRetryInitialInterval)</label>
            <input v-model.number="formData.listenerRetryInitialInterval" type="number" min="1" class="form-input" placeholder="1000">
          </div>
          <div class="form-item">
            <label class="form-label">重试最大次数 (listenerRetryMaxAttempts)</label>
            <input v-model.number="formData.listenerRetryMaxAttempts" type="number" min="1" class="form-input" placeholder="3">
          </div>
          <div class="form-item">
            <label class="form-label">重试最大间隔 ms (listenerRetryMaxInterval)</label>
            <input v-model.number="formData.listenerRetryMaxInterval" type="number" min="1" class="form-input" placeholder="10000">
          </div>
          <div class="form-item">
            <label class="form-label">重试倍数 (listenerRetryMultiplier)</label>
            <el-input-number
              v-model="formData.listenerRetryMultiplier"
              class="form-el-input-number"
              :min="0.1"
              :step="0.1"
              :precision="2"
              controls-position="right"
            />
          </div>
          <div class="form-item">
            <label class="form-label">最大消息数 (maxMessages，0 表示不限制)</label>
            <input v-model.number="formData.maxMessages" type="number" min="0" class="form-input" placeholder="0">
          </div>
        </div>

        <div
          class="section-header section-header--emphasis"
          @click="sectionOpen.fields = !sectionOpen.fields"
        >
          <h4>字段映射</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.fields ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.fields" class="section-content">
          <p class="field-hint">rabbitName 须与后端 Constants.RABBITMQ_FIELD 取值一致（默认使用 message、routingKey 等）。</p>
          <div class="field-table-wrap rmq-fields-preview-wrap">
            <el-table
              :data="formData.fieldList"
              border
              style="width: 100%"
              max-height="280"
            >
              <el-table-column type="index" label="#" width="48" align="center" />
              <el-table-column label="Rabbit 属性" min-width="160" show-overflow-tooltip>
                <template slot-scope="scope">
                  {{ rabbitFieldLabel(scope.row.rabbitName) }}
                </template>
              </el-table-column>
              <el-table-column
                prop="rabbitName"
                label="rabbitName"
                min-width="120"
                show-overflow-tooltip
              />
              <el-table-column label="输出字段名" min-width="140" show-overflow-tooltip>
                <template slot-scope="scope">
                  <div class="rmq-output-name-row">
                    <span class="rmq-output-name-row__text">{{ scope.row.outputName }}</span>
                    <i class="el-icon-edit-outline rmq-output-name-row__icon" aria-hidden="true" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="outputType" label="类型" width="100" show-overflow-tooltip />
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
          <h4>连接扩展参数</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.properties ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.properties" class="section-content">
          <div class="field-table-wrap rmq-props-preview-wrap">
            <el-table :data="propertiesList" border style="width: 100%" max-height="240">
              <el-table-column type="index" label="#" width="48" align="center" />
              <el-table-column prop="name" label="名称" show-overflow-tooltip />
              <el-table-column prop="value" label="值" show-overflow-tooltip />
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
              <label class="form-label">并发数量</label>
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
      title="字段映射"
      width="900px"
      top="6vh"
      custom-class="rmq-consumer-fields-dialog"
      append-to-body
      :close-on-click-modal="false"
      @close="closeFieldEditor"
    >
      <div class="dlg-body">
        <div class="dlg-table">
          <el-table :data="fieldEditor.list" border style="width: 100%">
            <el-table-column type="index" label="#" width="56" />
            <el-table-column label="Rabbit 属性" min-width="160">
              <template slot-scope="scope">
                {{ rabbitFieldLabel(scope.row.rabbitName) }}
              </template>
            </el-table-column>
            <el-table-column prop="rabbitName" label="rabbitName" min-width="120" />
            <el-table-column label="输出字段名称" min-width="180">
              <template slot-scope="scope">
                <el-input v-model="scope.row.outputName" size="small" placeholder="输出列名" />
              </template>
            </el-table-column>
            <el-table-column label="类型" min-width="130">
              <template slot-scope="scope">
                <el-select v-model="scope.row.outputType" size="small" placeholder="类型">
                  <el-option v-for="t in outputTypeOptions" :key="t" :label="t" :value="t" />
                </el-select>
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
      title="连接扩展参数"
      width="720px"
      top="6vh"
      custom-class="rmq-consumer-properties-dialog"
      append-to-body
      :close-on-click-modal="false"
      @close="closePropertiesEditor"
    >
      <div class="dlg-body rmq-props-dlg-body">
        <div class="dlg-label"><span class="req-dot">*</span>键值对</div>
        <div class="dlg-table rmq-props-dlg-table">
          <div
            v-if="!(propertiesEditor.list && propertiesEditor.list.length)"
            class="rmq-props-empty-shell"
          >
            <div class="rmq-props-empty-shell__head">
              <div class="col-idx">#</div>
              <div class="col-name">名称</div>
              <div class="col-val">值</div>
              <div class="col-op">操作</div>
            </div>
            <div class="rmq-props-empty-shell__body">暂无数据</div>
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
                <el-input v-model="scope.row.name" size="small" placeholder="名称" />
              </template>
            </el-table-column>
            <el-table-column label="值" min-width="260">
              <template slot-scope="scope">
                <el-input v-model="scope.row.value" size="small" placeholder="值" />
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
import { mqDbTree } from '@/api/collect/plugin/kafka'
import FlowConfigHero from '../common/FlowConfigHero.vue'

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

/** 与后端 RabbitMqConsumerInputMeta 解析中的 rabbitName 分支对应（Constants.RABBITMQ_FIELD） */
function buildDefaultFieldList() {
  return [
    { rabbitName: 'message', outputName: 'message', outputType: 'String' },
    { rabbitName: 'routingKey', outputName: 'routingKey', outputType: 'String' },
    { rabbitName: 'messageId', outputName: 'messageId', outputType: 'String' },
    { rabbitName: 'deliveryTag', outputName: 'deliveryTag', outputType: 'Long' },
    { rabbitName: 'exchange', outputName: 'exchange', outputType: 'String' },
    { rabbitName: 'timestamp', outputName: 'timestamp', outputType: 'Long' }
  ]
}

const RABBIT_FIELD_LABEL = {
  message: '消息体',
  routingKey: 'Routing Key',
  messageId: 'Message Id',
  deliveryTag: 'Delivery Tag',
  exchange: 'Exchange',
  timestamp: 'Timestamp'
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

const RMQ_PROPS_TABLE_CAP = 300
const RMQ_PROPS_TABLE_HEADER = 44
const RMQ_PROPS_TABLE_ROW = 50

export default {
  name: 'RabbitMqConsumerInputConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        listener: true,
        fields: true,
        properties: true,
        distribution: false,
        parallel: false
      },
      mqDbCascaderOptions: [],
      mqDbNodeTypeByValue: {},
      fieldEditor: {
        visible: false,
        list: []
      },
      propertiesEditor: {
        visible: false,
        list: []
      },
      outputTypeOptions: ['String', 'Integer', 'Long', 'Double', 'Boolean']
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
    mqDbCascaderProps() {
      return {
        expandTrigger: 'hover',
        value: 'value',
        label: 'label',
        children: 'children',
        checkStrictly: true,
        emitPath: false
      }
    },
    propertiesList() {
      const list = safeParseArrayJson(this.formData.properties)
      if (!Array.isArray(list)) return []
      return list.map(x => ({
        name: x && x.name != null ? String(x.name) : '',
        value: x && x.value != null ? String(x.value) : ''
      }))
    },
    topicsListNormalized() {
      const t = this.formData.topics
      if (Array.isArray(t)) return t.map(x => String(x)).filter(Boolean)
      return safeParseArrayJson(t)
    },
    topicsModel: {
      get() {
        return this.topicsListNormalized
      },
      set(arr) {
        const clean = (arr || []).map(x => String(x).trim()).filter(Boolean)
        this.$set(this.formData, 'topics', clean)
      }
    },
    propertiesEditorTableMaxHeight() {
      const n = Array.isArray(this.propertiesEditor.list) ? this.propertiesEditor.list.length : 0
      const natural = RMQ_PROPS_TABLE_HEADER + n * RMQ_PROPS_TABLE_ROW + 6
      return Math.min(RMQ_PROPS_TABLE_CAP, Math.max(natural, 120))
    }
  },
  mounted() {
    this.initDefaults()
    this.loadDataSourceTree()
    this.bootstrapPropertiesFromForm()
  },
  methods: {
    rabbitFieldLabel(key) {
      const k = key != null ? String(key) : ''
      return RABBIT_FIELD_LABEL[k] || k || '—'
    },
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', 'RabbitMQ输入')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.dataSourceId === undefined || this.formData.dataSourceId === null) {
        this.$set(this.formData, 'dataSourceId', '')
      } else {
        this.$set(this.formData, 'dataSourceId', normalizeId(this.formData.dataSourceId))
      }
      if (this.formData.virtualHost === undefined || this.formData.virtualHost === null || this.formData.virtualHost === '') {
        this.$set(this.formData, 'virtualHost', '/')
      }
      if (this.formData.queue === undefined) this.$set(this.formData, 'queue', '')
      if (this.formData.topics === undefined || this.formData.topics === null) {
        this.$set(this.formData, 'topics', [])
      } else if (typeof this.formData.topics === 'string') {
        this.$set(this.formData, 'topics', safeParseArrayJson(this.formData.topics))
      } else if (!Array.isArray(this.formData.topics)) {
        this.$set(this.formData, 'topics', [])
      }

      if (this.formData.listenerAcknowledgeMode === undefined || this.formData.listenerAcknowledgeMode === null) {
        this.$set(this.formData, 'listenerAcknowledgeMode', 'manual')
      } else {
        const a = String(this.formData.listenerAcknowledgeMode).trim().toLowerCase()
        if (a === 'auto') {
          this.$set(this.formData, 'listenerAcknowledgeMode', 'auto')
        } else if (!a || a === 'manual' || a.includes('manual')) {
          this.$set(this.formData, 'listenerAcknowledgeMode', 'manual')
        } else {
          this.$set(this.formData, 'listenerAcknowledgeMode', 'auto')
        }
      }

      if (this.formData.listenerPrefetch === undefined || this.formData.listenerPrefetch === '') {
        this.$set(this.formData, 'listenerPrefetch', 1)
      }
      if (this.formData.listenerConcurrency === undefined || this.formData.listenerConcurrency === '') {
        this.$set(this.formData, 'listenerConcurrency', 1)
      }
      if (this.formData.listenerMaxConcurrency === undefined || this.formData.listenerMaxConcurrency === '') {
        this.$set(this.formData, 'listenerMaxConcurrency', 1)
      }
      if (this.formData.listenerDefaultRequeueRejected === undefined) {
        this.$set(this.formData, 'listenerDefaultRequeueRejected', true)
      }
      if (this.formData.listenerRetryEnabled === undefined) {
        this.$set(this.formData, 'listenerRetryEnabled', true)
      }
      if (this.formData.listenerRetryInitialInterval === undefined || this.formData.listenerRetryInitialInterval === '') {
        this.$set(this.formData, 'listenerRetryInitialInterval', 1000)
      }
      if (this.formData.listenerRetryMaxAttempts === undefined || this.formData.listenerRetryMaxAttempts === '') {
        this.$set(this.formData, 'listenerRetryMaxAttempts', 3)
      }
      if (this.formData.listenerRetryMaxInterval === undefined || this.formData.listenerRetryMaxInterval === '') {
        this.$set(this.formData, 'listenerRetryMaxInterval', 10000)
      }
      if (this.formData.listenerRetryMultiplier === undefined || this.formData.listenerRetryMultiplier === null || this.formData.listenerRetryMultiplier === '') {
        this.$set(this.formData, 'listenerRetryMultiplier', 1.0)
      }
      if (this.formData.maxMessages === undefined || this.formData.maxMessages === '') {
        this.$set(this.formData, 'maxMessages', 0)
      }

      const defaults = buildDefaultFieldList()
      const curr = Array.isArray(this.formData.fieldList) ? clone(this.formData.fieldList) : []
      if (!curr.length) {
        this.$set(this.formData, 'fieldList', defaults)
      } else {
        const map = new Map(curr.map(x => [String(x.rabbitName || ''), x]))
        const merged = defaults.map((d) => {
          const hit = map.get(String(d.rabbitName))
          return {
            rabbitName: d.rabbitName,
            outputName: hit && hit.outputName != null ? String(hit.outputName) : d.outputName,
            outputType: hit && hit.outputType != null ? String(hit.outputType) : d.outputType
          }
        })
        const defaultKeys = new Set(defaults.map(d => String(d.rabbitName)))
        const extras = curr.filter(x => x && x.rabbitName != null && !defaultKeys.has(String(x.rabbitName)))
        this.$set(this.formData, 'fieldList', merged.concat(extras))
      }

      if (this.formData.properties === undefined) this.$set(this.formData, 'properties', '[]')
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
    },

    async loadDataSourceTree() {
      try {
        const res = await mqDbTree()
        const nodes = Array.isArray(res?.data) ? res.data : (res?.data ? [res.data] : [])
        const { options, nodeTypeByValue } = this.buildMqDbCascaderOptions(nodes)
        this.mqDbCascaderOptions = options
        this.mqDbNodeTypeByValue = nodeTypeByValue
      } catch (e) {
        this.mqDbCascaderOptions = []
        this.mqDbNodeTypeByValue = {}
      }
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
            const pathValue = parentPath ? `${parentPath}/${idx}-${label}` : `${idx}-${label}`
            const value = rawId != null ? String(rawId) : `group:${pathValue}`
            const normalizedType = nodeType || (children.length ? 'GROUP' : 'DATASOURCE')
            nodeTypeByValue[String(value)] = normalizedType
            const option = { value, label, type: normalizedType }
            if (children.length) {
              option.children = build(children, pathValue)
            }
            return option
          })
      }
      return { options: build(nodes, ''), nodeTypeByValue }
    },
    async onDataSourceVisible(visible) {
      if (!visible) return
      if (!this.mqDbCascaderOptions.length) {
        await this.loadDataSourceTree()
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
      const map = new Map(curr.map(x => [String(x.rabbitName || ''), x]))
      this.fieldEditor.list = defaults.map((d) => {
        const hit = map.get(String(d.rabbitName))
        return {
          rabbitName: d.rabbitName,
          outputName: hit && hit.outputName != null ? String(hit.outputName) : d.outputName,
          outputType: hit && hit.outputType != null ? String(hit.outputType) : d.outputType
        }
      })
      this.fieldEditor.visible = true
    },
    closeFieldEditor() {},
    confirmFieldEditor() {
      const list = Array.isArray(this.fieldEditor.list) ? this.fieldEditor.list : []
      const invalid = list.some(x => !x || !String(x.outputName || '').trim())
      if (invalid) {
        this.$message.warning('请填写完整的输出字段名称')
        return
      }
      const badType = list.some(x => !this.outputTypeOptions.includes(String(x.outputType || '')))
      if (badType) {
        this.$message.warning('字段类型无效，请从下拉列表中选择')
        return
      }
      this.$set(this.formData, 'fieldList', list.map(x => ({
        rabbitName: String(x.rabbitName || ''),
        outputName: String(x.outputName || '').trim(),
        outputType: String(x.outputType || 'String').trim()
      })))
      this.fieldEditor.visible = false
    },
    openPropertiesEditor() {
      this.bootstrapPropertiesFromForm()
      this.propertiesEditor.visible = true
    },
    closePropertiesEditor() {},
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
      raw.dataSourceId = raw.dataSourceId != null && raw.dataSourceId !== '' ? String(raw.dataSourceId) : null
      raw.virtualHost = raw.virtualHost != null && String(raw.virtualHost).trim() !== ''
        ? String(raw.virtualHost).trim()
        : '/'
      raw.queue = raw.queue != null ? String(raw.queue).trim() : ''
      const topicList = Array.isArray(raw.topics) ? raw.topics : safeParseArrayJson(raw.topics)
      raw.topics = (Array.isArray(topicList) ? topicList : []).map(x => String(x).trim()).filter(Boolean)

      const ack = raw.listenerAcknowledgeMode != null ? String(raw.listenerAcknowledgeMode).trim().toLowerCase() : ''
      raw.listenerAcknowledgeMode = ack === 'auto' ? 'auto' : 'manual'

      raw.listenerPrefetch = Math.max(1, Math.trunc(Number(raw.listenerPrefetch)) || 1)
      raw.listenerConcurrency = Math.max(1, Math.trunc(Number(raw.listenerConcurrency)) || 1)
      raw.listenerMaxConcurrency = Math.max(1, Math.trunc(Number(raw.listenerMaxConcurrency)) || 1)
      raw.listenerDefaultRequeueRejected = !!raw.listenerDefaultRequeueRejected
      raw.listenerRetryEnabled = !!raw.listenerRetryEnabled
      raw.listenerRetryInitialInterval = Math.max(1, Math.trunc(Number(raw.listenerRetryInitialInterval)) || 1000)
      raw.listenerRetryMaxAttempts = Math.max(1, Math.trunc(Number(raw.listenerRetryMaxAttempts)) || 3)
      raw.listenerRetryMaxInterval = Math.max(1, Math.trunc(Number(raw.listenerRetryMaxInterval)) || 10000)
      const mul = Number(raw.listenerRetryMultiplier)
      raw.listenerRetryMultiplier = Number.isFinite(mul) && mul > 0 ? mul : 1.0
      raw.maxMessages = Math.max(0, Math.trunc(Number(raw.maxMessages)) || 0)

      const defaults = buildDefaultFieldList()
      const curr = Array.isArray(raw.fieldList) ? raw.fieldList : []
      const map = new Map(curr.map(x => [String(x.rabbitName || ''), x]))
      raw.fieldList = defaults.map((d) => {
        const hit = map.get(String(d.rabbitName))
        return {
          rabbitName: d.rabbitName,
          outputName: hit && hit.outputName != null ? String(hit.outputName).trim() : d.outputName,
          outputType: hit && hit.outputType != null ? String(hit.outputType).trim() : d.outputType
        }
      })

      const list = safeParseArrayJson(raw.properties)
      raw.properties = JSON.stringify((Array.isArray(list) ? list : []).map(x => ({
        name: x && x.name != null ? String(x.name).trim() : '',
        value: x && x.value != null ? String(x.value).trim() : ''
      })).filter(x => x.name && x.value))

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
      if (!payload.dataSourceId) {
        this.$message.warning('请选择数据源')
        return
      }
      if (this.getMqDbNodeType(payload.dataSourceId) === 'GROUP') {
        this.$message.warning('请选择具体的数据源（分组不可作为数据源）')
        return
      }
      if (!payload.queue && (!payload.topics || !payload.topics.length)) {
        this.$message.warning('请填写队列名，或在候选队列中至少填写一项')
        return
      }
      this.$emit('save', payload)
    }
  }
}
</script>

<style lang="scss" scoped>
.rabbitmq-consumer-input-config {
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

.rabbitmq-consumer-input-config ::v-deep .flow-config-hero__title,
.rabbitmq-consumer-input-config ::v-deep .flow-config-hero__badge,
.rabbitmq-consumer-input-config ::v-deep .config-tabs .el-tabs__item,
.rabbitmq-consumer-input-config ::v-deep .config-tabs .el-tabs__item.is-active {
  font-weight: 400;
}

.form-item {
  margin-bottom: 16px;
  display: block;
}

.form-item--inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.form-item--inline .form-label {
  margin-bottom: 0;
  flex: 1;
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

.form-el-input {
  width: 100%;
}

.form-el-input-number {
  width: 100%;
}

.rabbitmq-consumer-input-config ::v-deep .form-el-input .el-input__inner,
.rabbitmq-consumer-input-config ::v-deep .form-select .el-input__inner,
.rabbitmq-consumer-input-config ::v-deep .el-cascader .el-input__inner {
  height: 40px;
  line-height: 40px;
  padding: 0 12px;
  border-radius: 4px;
  font-weight: 400;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
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

.rmq-fields-preview-wrap ::v-deep .el-table__body-wrapper,
.rmq-fields-preview-wrap ::v-deep .el-table__header-wrapper,
.rmq-props-preview-wrap ::v-deep .el-table__body-wrapper,
.rmq-props-preview-wrap ::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
}

.rmq-fields-preview-wrap ::v-deep .el-table__header table,
.rmq-fields-preview-wrap ::v-deep .el-table__body table,
.rmq-props-preview-wrap ::v-deep .el-table__header table,
.rmq-props-preview-wrap ::v-deep .el-table__body table {
  table-layout: fixed;
  width: 100% !important;
}

.rmq-output-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.rmq-output-name-row__text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rmq-output-name-row__icon {
  flex-shrink: 0;
  color: #409eff;
  font-size: 14px;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
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

.dlg-table {
  width: 100%;
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

.rmq-props-empty-shell {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 2px;
  overflow: hidden;
  font-size: 14px;
  color: #606266;
  background: #fff;
}

.rmq-props-empty-shell__head {
  display: flex;
  align-items: stretch;
  min-height: 40px;
  color: #909399;
  font-weight: 500;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.rmq-props-empty-shell__head .col-idx {
  width: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #ebeef5;
}

.rmq-props-empty-shell__head .col-name,
.rmq-props-empty-shell__head .col-val {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 10px 10px 10px 12px;
  border-right: 1px solid #ebeef5;
}

.rmq-props-empty-shell__head .col-op {
  width: 90px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding-left: 10px;
}

.rmq-props-empty-shell__body {
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
.rmq-consumer-fields-dialog {
  max-width: calc(100vw - 48px);
}

.rmq-consumer-fields-dialog .el-dialog__body {
  padding: 10px 16px 6px;
}

.rmq-consumer-fields-dialog .el-dialog__footer {
  padding: 8px 16px 12px;
}

.el-dialog.rmq-consumer-properties-dialog:not(.is-fullscreen) {
  max-width: calc(100vw - 48px);
  height: fit-content !important;
  max-height: calc(100vh - 32px);
}

.el-dialog.rmq-consumer-properties-dialog:not(.is-fullscreen) .el-dialog__body {
  flex: 0 0 auto !important;
  flex-grow: 0 !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow-x: hidden;
  overflow-y: visible !important;
  padding: 10px 16px 6px;
}

.el-dialog.rmq-consumer-properties-dialog:not(.is-fullscreen) .el-dialog__footer {
  flex: 0 0 auto !important;
  padding: 8px 16px 12px;
}

.rmq-consumer-properties-dialog .el-table__empty-block {
  min-height: 40px !important;
  height: auto !important;
}

.rmq-consumer-properties-dialog .el-table {
  flex: 0 0 auto !important;
}

.rmq-consumer-properties-dialog .el-table__body-wrapper {
  min-height: 0 !important;
}
</style>
