<template>
  <div class="rabbitmq-producer-output-config">
    <div class="config-content">
      <FlowConfigHero
        badge="输出"
        title="RabbitMQ 输出"
        description="将流中的消息发布到 RabbitMQ（Exchange / RoutingKey，支持 Publisher Confirm 与扩展参数）。"
        tone="amber"
        icon="el-icon-upload2"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="RabbitMQ输出">
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
          <label class="form-label">Exchange</label>
          <el-input
            v-model="formData.exchange"
            class="form-el-input"
            clearable
            placeholder="留空则使用后端默认"
          />
        </div>

        <div class="form-item">
          <label class="form-label">Routing Key</label>
          <el-input
            v-model="formData.routingKey"
            class="form-el-input"
            clearable
            placeholder="可与下方队列名或候选路由键配合使用"
          />
        </div>

        <div class="form-item">
          <label class="form-label">队列名 (queue)</label>
          <el-input
            v-model="formData.queue"
            class="form-el-input"
            clearable
            placeholder="未填 Routing Key 时，后端可用队列名作为路由键"
          />
        </div>

        <div class="form-item">
          <label class="form-label">路由键候选 (topics)</label>
          <el-select
            v-model="topicsModel"
            class="form-select"
            multiple
            filterable
            allow-create
            default-first-option
            collapse-tags
            placeholder="可选；未填 Routing Key 时取首项作为路由键"
          />
        </div>

        <div class="form-item">
          <label class="form-label">Message 字段名</label>
          <el-select
            v-model="formData.messageField"
            class="form-select"
            filterable
            clearable
            allow-create
            default-first-option
            placeholder="可选；指定流中作为消息体的字段"
          >
            <el-option
              v-for="n in streamFieldOptions"
              :key="'m-' + n"
              :label="n"
              :value="n"
            />
          </el-select>
        </div>

        <div class="form-item">
          <label class="form-label">Routing Key 字段名</label>
          <el-select
            v-model="formData.routingKeyField"
            class="form-select"
            filterable
            clearable
            allow-create
            default-first-option
            placeholder="可选；从流字段动态取路由键"
          >
            <el-option
              v-for="n in streamFieldOptions"
              :key="'rk-' + n"
              :label="n"
              :value="n"
            />
          </el-select>
        </div>

        <div class="form-item">
          <label class="form-label">Publisher Confirm</label>
          <el-radio-group v-model="formData.publisherConfirmType" class="rmq-radio-group">
            <el-radio label="correlated">关联确认 (correlated)</el-radio>
            <el-radio label="simple">简单确认 (simple)</el-radio>
            <el-radio label="none">关闭 (none)</el-radio>
          </el-radio-group>
        </div>

        <div class="form-item form-item--inline">
          <label class="form-label">Publisher Returns</label>
          <el-switch v-model="formData.publisherReturns" active-text="开启" inactive-text="关闭" />
        </div>

        <div class="form-item form-item--inline">
          <label class="form-label">Mandatory（无法路由时退回）</label>
          <el-switch v-model="formData.templateMandatory" active-text="是" inactive-text="否" />
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
          <div class="field-table-wrap">
            <el-table :data="propertiesList" border style="width: 100%" max-height="240">
              <el-table-column type="index" label="#" width="56" />
              <el-table-column prop="name" label="名称" min-width="220" show-overflow-tooltip />
              <el-table-column prop="value" label="值" min-width="260" show-overflow-tooltip />
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
      :visible.sync="propertiesEditor.visible"
      title="RabbitMQ 扩展参数"
      width="720px"
      top="6vh"
      custom-class="rabbitmq-producer-properties-dialog"
      append-to-body
      :close-on-click-modal="false"
      @close="closePropertiesEditor"
    >
      <div class="dlg-body rmq-props-dlg-body">
        <div class="dlg-label"><span class="req-dot">*</span>字段：</div>
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
import { mqDbTree } from '@/api/collect/plugin/kafka'
import FlowConfigHero from '../common/FlowConfigHero.vue'

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
  name: 'RabbitMqProducerOutputConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
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
        properties: true,
        distribution: false,
        parallel: false
      },
      mqDbCascaderOptions: [],
      mqDbNodeTypeByValue: {},
      streamFieldOptions: [],
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
    /** 后端 create 使用 data.getJSONArray("topics")，画布上应为数组而非 JSON 字符串 */
    topicsListNormalized() {
      const t = this.formData.topics
      if (Array.isArray(t)) return t.map(x => String(x)).filter(Boolean)
      return safeParseArrayJson(t)
    },
    propertiesEditorTableMaxHeight() {
      const n = Array.isArray(this.propertiesEditor.list) ? this.propertiesEditor.list.length : 0
      const natural = RMQ_PROPS_TABLE_HEADER + n * RMQ_PROPS_TABLE_ROW + 6
      return Math.min(RMQ_PROPS_TABLE_CAP, Math.max(natural, 120))
    },
    topicsModel: {
      get() {
        return this.topicsListNormalized
      },
      set(arr) {
        const clean = (arr || []).map(x => String(x).trim()).filter(Boolean)
        this.$set(this.formData, 'topics', clean)
      }
    }
  },
  watch: {
    flowConfig: {
      handler() {
        this.refreshStreamFieldOptionsFromGraph()
      },
      deep: true
    },
    currentNodeId() {
      this.refreshStreamFieldOptionsFromGraph()
    }
  },
  mounted() {
    this.initDefaults()
    this.loadDataSourceTree()
    this.bootstrapPropertiesFromForm()
    this.refreshStreamFieldOptionsFromGraph()
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', 'RabbitMQ输出')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.dataSourceId === undefined || this.formData.dataSourceId === null) {
        this.$set(this.formData, 'dataSourceId', '')
      } else {
        this.$set(this.formData, 'dataSourceId', normalizeId(this.formData.dataSourceId))
      }
      if (this.formData.virtualHost === undefined || this.formData.virtualHost === null || this.formData.virtualHost === '') {
        this.$set(this.formData, 'virtualHost', '/')
      }
      if (this.formData.exchange === undefined) this.$set(this.formData, 'exchange', '')
      if (this.formData.routingKey === undefined) this.$set(this.formData, 'routingKey', '')
      if (this.formData.queue === undefined) this.$set(this.formData, 'queue', '')
      if (this.formData.topics === undefined || this.formData.topics === null) {
        this.$set(this.formData, 'topics', [])
      } else if (typeof this.formData.topics === 'string') {
        this.$set(this.formData, 'topics', safeParseArrayJson(this.formData.topics))
      } else if (!Array.isArray(this.formData.topics)) {
        this.$set(this.formData, 'topics', [])
      }
      if (this.formData.messageField === undefined) this.$set(this.formData, 'messageField', '')
      if (this.formData.routingKeyField === undefined) this.$set(this.formData, 'routingKeyField', '')
      if (this.formData.publisherConfirmType === undefined || this.formData.publisherConfirmType === null || this.formData.publisherConfirmType === '') {
        this.$set(this.formData, 'publisherConfirmType', 'correlated')
      } else {
        this.$set(this.formData, 'publisherConfirmType', String(this.formData.publisherConfirmType).toLowerCase())
      }
      if (this.formData.publisherReturns === undefined) this.$set(this.formData, 'publisherReturns', true)
      if (this.formData.templateMandatory === undefined) {
        if (this.formData.mandatory !== undefined) {
          this.$set(this.formData, 'templateMandatory', !!this.formData.mandatory)
        } else {
          this.$set(this.formData, 'templateMandatory', true)
        }
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
    async onDataSourceVisible(visible) {
      if (!visible) return
      if (!this.mqDbCascaderOptions.length) {
        await this.loadDataSourceTree()
      }
    },

    refreshStreamFieldOptionsFromGraph() {
      const cfg = this.flowConfig && Array.isArray(this.flowConfig.cells) ? this.flowConfig : { cells: [] }
      const nodeId = String(this.currentNodeId || '')
      if (!nodeId) {
        this.streamFieldOptions = []
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
          const n = x && (x.name || x.fieldName || x.fieldStream || x.outputName || x.kafkaName)
          if (n) names.push(String(n))
        }

        if (Array.isArray(data.fieldList)) data.fieldList.forEach(pushName)
        if (Array.isArray(data.filedList)) data.filedList.forEach(pushName)
      })

      this.streamFieldOptions = Array.from(new Set(names.filter(Boolean)))
    },

    bootstrapPropertiesFromForm() {
      const list = safeParseArrayJson(this.formData.properties)
      this.propertiesEditor.list = (list || [])
        .filter(x => x && (x.name != null || x.value != null))
        .map(x => ({ name: x.name != null ? String(x.name) : '', value: x.value != null ? String(x.value) : '' }))
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
      raw.exchange = raw.exchange != null ? String(raw.exchange).trim() : ''
      raw.routingKey = raw.routingKey != null ? String(raw.routingKey).trim() : ''
      raw.queue = raw.queue != null ? String(raw.queue).trim() : ''

      const topicList = Array.isArray(raw.topics) ? raw.topics : safeParseArrayJson(raw.topics)
      raw.topics = (Array.isArray(topicList) ? topicList : []).map(x => String(x).trim()).filter(Boolean)

      raw.messageField = raw.messageField != null ? String(raw.messageField).trim() : ''
      raw.routingKeyField = raw.routingKeyField != null ? String(raw.routingKeyField).trim() : ''

      let pct = raw.publisherConfirmType != null ? String(raw.publisherConfirmType).trim().toLowerCase() : 'correlated'
      if (!['correlated', 'simple', 'none'].includes(pct)) pct = 'correlated'
      raw.publisherConfirmType = pct

      raw.publisherReturns = !!raw.publisherReturns
      raw.templateMandatory = !!raw.templateMandatory

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
      this.$emit('save', payload)
    }
  }
}
</script>

<style lang="scss" scoped>
.rabbitmq-producer-output-config {
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

.rabbitmq-producer-output-config ::v-deep .flow-config-hero__title {
  font-weight: 400;
}

.rabbitmq-producer-output-config ::v-deep .flow-config-hero__badge {
  font-weight: 400;
}

.rabbitmq-producer-output-config ::v-deep .config-tabs .el-tabs__item {
  font-weight: 400;
}

.rabbitmq-producer-output-config ::v-deep .config-tabs .el-tabs__item.is-active {
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

.rabbitmq-producer-output-config ::v-deep .form-el-input .el-input__inner {
  height: 40px;
  line-height: 40px;
  padding: 0 12px;
  border-radius: 4px;
  font-weight: 400;
}

.rabbitmq-producer-output-config ::v-deep .form-select .el-input__inner,
.rabbitmq-producer-output-config ::v-deep .el-cascader .el-input__inner {
  font-weight: 400;
}

.rmq-radio-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
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
  max-width: 760px;
  margin-bottom: 10px;
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

.rmq-props-dlg-body {
  gap: 8px;
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
.el-dialog.rabbitmq-producer-properties-dialog:not(.is-fullscreen) {
  max-width: calc(100vw - 48px);
  height: fit-content !important;
  max-height: calc(100vh - 32px);
}

.el-dialog.rabbitmq-producer-properties-dialog:not(.is-fullscreen) .el-dialog__body {
  flex: 0 0 auto !important;
  flex-grow: 0 !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow-x: hidden;
  overflow-y: visible !important;
  padding: 10px 16px 6px;
}

.el-dialog.rabbitmq-producer-properties-dialog:not(.is-fullscreen) .el-dialog__footer {
  flex: 0 0 auto !important;
  padding: 8px 16px 12px;
}

.rabbitmq-producer-properties-dialog .el-table__empty-block {
  min-height: 40px !important;
  height: auto !important;
}

.rabbitmq-producer-properties-dialog .el-table {
  flex: 0 0 auto !important;
}

.rabbitmq-producer-properties-dialog .el-table__body-wrapper {
  min-height: 0 !important;
}
</style>
