<template>
  <div class="api-output-config">
    <div class="config-content">
      <FlowConfigHero
        badge="集成"
        title="API 输出"
        description="将数据流通过 HTTP 请求推送到外部系统，可配置方法、头与正文映射。"
        tone="indigo"
        icon="el-icon-position"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="API输出">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="form-item">
          <label class="form-label required">URL：</label>
          <input v-model="formData.url" type="text" class="form-input" placeholder="请输入URL">
        </div>

        <div class="form-item">
          <label class="form-label required">请求方式：</label>
          <el-select
            v-model="formData.requestMethod"
            class="form-select"
            clearable
            filterable
            placeholder="请选择请求方式"
            @change="onRequestMethodChange"
          >
            <el-option
              v-for="opt in requestMethodOptions"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>

        <div v-show="supportsRequestBody" class="form-item">
          <label class="form-label required">请求类型：</label>
          <el-select
            v-model="formData.requestType"
            class="form-select"
            clearable
            filterable
            placeholder="请选择请求类型"
          >
            <el-option
              v-for="opt in requestTypeOptions"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>

        <div class="section-header" @click="sectionOpen.headers = !sectionOpen.headers">
          <h4>请求头</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.headers ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.headers" class="section-content">
          <div class="field-table-wrap field-table-wrap--compact">
            <el-table
              class="api-param-table api-param-table--fill"
              :data="formData.headerList"
              border
              style="width: 100%"
              max-height="150"
              empty-text="暂无数据"
            >
              <el-table-column type="index" label="#" width="44" align="center" header-align="center" />
              <el-table-column prop="name" label="名称" min-width="120" show-overflow-tooltip align="center" header-align="center" />
              <el-table-column prop="value" label="值" min-width="120" show-overflow-tooltip align="center" header-align="center" />
              <el-table-column prop="description" label="说明" min-width="120" show-overflow-tooltip align="center" header-align="center" />
            </el-table>
          </div>
          <div class="field-actions">
            <button type="button" class="dash-btn" @click.stop="openHeaderEditor">
              <i class="el-icon-edit" /> 编辑请求头
            </button>
          </div>
        </div>

        <template v-if="supportsRequestBody">
          <div class="section-header" @click="sectionOpen.body = !sectionOpen.body">
            <h4>请求体</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.body ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.body" class="section-content">
            <div class="body-radio-toolbar">
              <el-radio-group v-model="bodyMode" @change="onBodyModeChange">
                <el-radio label="form">x-www-form-urlencoded</el-radio>
                <el-radio label="raw">raw</el-radio>
              </el-radio-group>
            </div>
            <div v-if="bodyMode === 'raw'" class="form-item raw-block">
              <label class="form-label form-label--spacer" />
              <textarea
                v-model="formData.raw"
                class="form-textarea raw-textarea"
                rows="8"
                placeholder="请输入请求体（raw）"
              />
            </div>
            <template v-else>
              <div class="field-table-wrap field-table-wrap--compact">
                <el-table
                  class="api-param-table api-param-table--fill"
                  :data="formData.xFormList"
                  border
                  style="width: 100%"
                  max-height="150"
                  empty-text="暂无数据"
                >
                  <el-table-column type="index" label="#" width="44" align="center" header-align="center" />
                  <el-table-column prop="key" label="键" min-width="120" show-overflow-tooltip align="center" header-align="center" />
                  <el-table-column prop="value" label="值" min-width="120" show-overflow-tooltip align="center" header-align="center" />
                  <el-table-column prop="description" label="说明" min-width="120" show-overflow-tooltip align="center" header-align="center" />
                </el-table>
              </div>
              <div class="field-actions">
                <button type="button" class="dash-btn" @click.stop="openBodyEditor">
                  <i class="el-icon-edit" /> 编辑请求体
                </button>
              </div>
            </template>
          </div>
        </template>

        <div class="section-header" @click="sectionOpen.response = !sectionOpen.response">
          <h4>响应报文字段名配置<span class="help-icon" title="将 HTTP 响应映射到下游字段名">?</span></h4>
          <div class="section-toggle">
            <i :class="sectionOpen.response ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.response" class="section-content">
          <div class="form-item">
            <label class="form-label required">响应状态码字段名：</label>
            <input v-model="formData.responseStatus" type="text" class="form-input" placeholder="out_response_status_">
          </div>
          <div class="form-item">
            <label class="form-label required">响应头字段名：</label>
            <input v-model="formData.responseHeader" type="text" class="form-input" placeholder="out_response_header_">
          </div>
          <div class="form-item">
            <label class="form-label required">响应体字段名：</label>
            <input v-model="formData.responseBody" type="text" class="form-input" placeholder="out_response_body_">
          </div>
        </div>
      </template>

      <template v-else>
        <div class="advanced-layout">
          <div class="form-item">
            <label class="form-label">请求报文编码：</label>
            <el-select v-model="formData.requestCode" class="form-select" clearable filterable placeholder="请选择编码">
              <el-option
                v-for="opt in requestCodeOptions"
                :key="String(opt.value)"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>
          <div class="form-item">
            <label class="form-label">响应报文编码：</label>
            <el-select v-model="formData.responseCode" class="form-select" clearable filterable placeholder="请选择编码">
              <el-option
                v-for="opt in responseCodeOptions"
                :key="String(opt.value)"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>
          <div class="form-item">
            <label class="form-label">连接超时时间（毫秒）：</label>
            <input v-model.number="formData.connectOutTime" type="number" min="1" class="form-input" placeholder="5000">
          </div>
          <div class="form-item">
            <label class="form-label">读取超时时间（毫秒）：</label>
            <input v-model.number="formData.readOutTime" type="number" min="1" class="form-input" placeholder="5000">
          </div>
          <div class="form-item">
            <label class="form-label">失败重试次数<span class="help-icon" title="失败后的重试次数">?</span>：</label>
            <input v-model.number="formData.retryNum" type="number" min="0" class="form-input" placeholder="0">
          </div>
          <div class="form-item">
            <label class="form-label">重试时间间隔（毫秒）：</label>
            <input v-model.number="formData.retryTime" type="number" min="0" class="form-input" placeholder="10000">
          </div>

          <div class="section-header" @click="sectionOpen.distribution = !sectionOpen.distribution">
            <h4>数据分发</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.distribution ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.distribution" class="section-content">
            <div class="form-item form-item--radios">
              <label class="form-label">数据分发模式：</label>
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
      </template>

      <div class="form-actions">
        <button type="button" class="btn preview-btn" @click="previewData">预览数据</button>
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <el-dialog
      :visible.sync="headerEditor.visible"
      title="编辑请求头"
      width="720px"
      custom-class="api-output-param-dialog"
      append-to-body
      :close-on-click-modal="false"
      @close="closeHeaderEditor"
    >
      <div class="dlg-body">
        <div class="dlg-table dlg-table--compact dlg-table--param-editor">
          <el-table
            class="api-param-table api-param-table--fill api-param-table--dialog"
            :data="headerEditor.list"
            border
            style="width: 100%"
            :max-height="paramEditorBodyMaxHeight(headerEditor.list)"
            empty-text="暂无数据"
          >
            <el-table-column type="index" label="#" width="44" align="center" header-align="center" />
            <el-table-column label="名称" min-width="120" align="center" header-align="center">
              <template slot-scope="scope">
                <el-input v-model="scope.row.name" size="small" clearable placeholder="请输入名称" />
              </template>
            </el-table-column>
            <el-table-column label="值" min-width="120" align="center" header-align="center">
              <template slot-scope="scope">
                <el-input v-model="scope.row.value" size="small" clearable placeholder="请输入值" />
              </template>
            </el-table-column>
            <el-table-column label="说明" min-width="120" align="center" header-align="center">
              <template slot-scope="scope">
                <el-input v-model="scope.row.description" size="small" clearable placeholder="请输入说明" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="72" fixed="right" align="center" header-align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="removeHeaderRow(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <button type="button" class="dash-btn dlg-add-row-btn" @click="addHeaderRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>
      <span slot="footer" class="dialog-footer dlg-footer">
        <el-button type="primary" @click="confirmHeaderEditor">确定</el-button>
        <el-button @click="headerEditor.visible = false">取消</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="bodyEditor.visible"
      title="编辑请求体"
      width="720px"
      custom-class="api-output-param-dialog"
      append-to-body
      :close-on-click-modal="false"
      @close="closeBodyEditor"
    >
      <div class="dlg-body">
        <div class="dlg-table dlg-table--compact dlg-table--param-editor">
          <el-table
            class="api-param-table api-param-table--fill api-param-table--dialog"
            :data="bodyEditor.list"
            border
            style="width: 100%"
            :max-height="paramEditorBodyMaxHeight(bodyEditor.list)"
            empty-text="暂无数据"
          >
            <el-table-column type="index" label="#" width="44" align="center" header-align="center" />
            <el-table-column label="键" min-width="120" align="center" header-align="center">
              <template slot-scope="scope">
                <el-input v-model="scope.row.key" size="small" clearable placeholder="请输入键" />
              </template>
            </el-table-column>
            <el-table-column label="值" min-width="120" align="center" header-align="center">
              <template slot-scope="scope">
                <el-input v-model="scope.row.value" size="small" clearable placeholder="请输入值" />
              </template>
            </el-table-column>
            <el-table-column label="说明" min-width="120" align="center" header-align="center">
              <template slot-scope="scope">
                <el-input v-model="scope.row.description" size="small" clearable placeholder="请输入说明" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="72" fixed="right" align="center" header-align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="removeBodyRow(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <button type="button" class="dash-btn dlg-add-row-btn" @click="addBodyRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>
      <span slot="footer" class="dialog-footer dlg-footer">
        <el-button type="primary" @click="confirmBodyEditor">确定</el-button>
        <el-button @click="bodyEditor.visible = false">取消</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="previewVisible"
      title="预览数据"
      width="90%"
      append-to-body
      :close-on-click-modal="false"
      custom-class="api-output-preview-dialog"
    >
      <div class="preview-body">
        <el-table
          v-loading="previewLoading"
          :data="previewTableData"
          border
          style="width: 100%"
          max-height="500"
        >
          <el-table-column type="index" label="#" width="60" />
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
  </div>
</template>

<script>
import { previewData as previewDataApi } from '@/api/collect/trans/transFlow'
import FlowConfigHero from '../common/FlowConfigHero.vue'

function emptyParamRow() {
  return { key: '', value: '', description: '' }
}

function emptyHeaderRow() {
  return { name: '', value: '', description: '' }
}

function normalizeHeaderRow(r) {
  if (!r || typeof r !== 'object') return emptyHeaderRow()
  const name =
    r.name != null && String(r.name) !== ''
      ? String(r.name)
      : r.key != null && String(r.key) !== ''
        ? String(r.key)
        : r.paramKey != null
          ? String(r.paramKey)
          : ''
  return {
    name,
    value: r.value != null ? String(r.value) : '',
    description:
      r.description != null
        ? String(r.description)
        : r.desc != null
          ? String(r.desc)
          : r.remark != null
            ? String(r.remark)
            : ''
  }
}

function normalizeParamRow(r) {
  if (!r || typeof r !== 'object') return emptyParamRow()
  return {
    key: r.key != null ? String(r.key) : '',
    value: r.value != null ? String(r.value) : '',
    description:
      r.description != null
        ? String(r.description)
        : r.desc != null
          ? String(r.desc)
          : ''
  }
}

export default {
  name: 'ApiOutputConfig',
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
    },
    componentTreeConfig: {
      type: [Object, String, Array],
      default: null
    }
  },
  data() {
    return {
      activeTab: 'basic',
      bodyMode: 'form',
      sectionOpen: {
        headers: true,
        body: true,
        response: true,
        distribution: false,
        parallel: false
      },
      headerEditor: {
        visible: false,
        list: []
      },
      bodyEditor: {
        visible: false,
        list: []
      },
      previewVisible: false,
      previewLoading: false,
      previewTableData: [],
      previewColumns: []
    }
  },
  computed: {
    supportsRequestBody() {
      const m = String(this.formData.requestMethod || '').trim().toUpperCase()
      return ['POST', 'PUT', 'PATCH'].includes(m)
    },
    distributionMode: {
      get() {
        return this.formData.distributeType ? 'copy' : 'distribute'
      },
      set(v) {
        this.$set(this.formData, 'distributeType', v === 'copy')
      }
    },
    requestMethodOptions() {
      return this.dictOptionsByCode('requestMethod', [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' }
      ])
    },
    requestTypeOptions() {
      return this.dictOptionsByCode('requestType', [
        { value: 'application/json', label: 'application/json' },
        { value: 'application/x-www-form-urlencoded', label: 'application/x-www-form-urlencoded' },
        { value: 'multipart/form-data', label: 'multipart/form-data' },
        { value: 'text/plain', label: 'text/plain' }
      ])
    },
    requestCodeOptions() {
      return this.dictOptionsByCode('requestCode', [
        { value: 'UTF-8', label: 'UTF-8' },
        { value: 'GBK', label: 'GBK' },
        { value: 'ISO-8859-1', label: 'ISO-8859-1' }
      ])
    },
    responseCodeOptions() {
      return this.dictOptionsByCode('responseCode', [
        { value: 'UTF-8', label: 'UTF-8' },
        { value: 'GBK', label: 'GBK' },
        { value: 'ISO-8859-1', label: 'ISO-8859-1' }
      ])
    }
  },
  watch: {
    'formData.useRaw'(v) {
      this.syncBodyModeFromForm()
    },
    'formData.useXForm'(v) {
      this.syncBodyModeFromForm()
    },
    /** 组件树 config 晚于抽屉挂载到达时，补全字典驱动下的下拉默认值 */
    componentTreeConfig: {
      handler() {
        this.initDefaults()
      },
      deep: true
    }
  },
  mounted() {
    this.initDefaults()
    this.syncBodyModeFromForm()
  },
  methods: {
    paramEditorBodyMaxHeight(list) {
      return Array.isArray(list) && list.length > 0 ? 280 : undefined
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
    dictOptionsByCode(dictCode, fallback) {
      const dicts = this.parseComponentDicts(this.componentTreeConfig)
      const hit = dicts.find(d => String(d.dictCode || '').trim() === String(dictCode || '').trim())
      const list = Array.isArray(hit && hit.list) ? hit.list : []
      const options = list
        .map((x) => ({
          value: x && x.code != null ? String(x.code) : '',
          label: x && x.value != null ? String(x.value) : ''
        }))
        .filter(x => x.value && x.label)
      return options.length ? options : fallback
    },
    syncBodyModeFromForm() {
      this.bodyMode = this.formData.useRaw === true ? 'raw' : 'form'
    },
    onBodyModeChange(mode) {
      if (mode === 'raw') {
        this.$set(this.formData, 'useRaw', true)
        this.$set(this.formData, 'useXForm', false)
      } else {
        this.$set(this.formData, 'useRaw', false)
        this.$set(this.formData, 'useXForm', true)
      }
    },
    onRequestMethodChange() {
      if (!this.supportsRequestBody) {
        this.$set(this.formData, 'requestType', '')
        if (this.bodyEditor.visible) {
          this.bodyEditor.visible = false
          this.bodyEditor.list = []
        }
      }
      this.syncBodyModeFromForm()
    },
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', 'API输出')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.url === undefined) this.$set(this.formData, 'url', '')

      const methods = this.requestMethodOptions.map(o => String(o.value))
      const rmUpper =
        this.formData.requestMethod != null ? String(this.formData.requestMethod).trim().toUpperCase() : ''
      const methodMatch = methods.find(m => String(m).trim().toUpperCase() === rmUpper)
      if (!methodMatch) {
        this.$set(this.formData, 'requestMethod', methods[0] || 'GET')
      } else {
        this.$set(this.formData, 'requestMethod', methodMatch)
      }

      if (!this.supportsRequestBody) {
        this.$set(this.formData, 'requestType', '')
      } else {
        const types = this.requestTypeOptions.map(o => String(o.value))
        const rt = this.formData.requestType != null ? String(this.formData.requestType) : ''
        if (!rt || !types.includes(rt)) {
          this.$set(this.formData, 'requestType', types[0] || 'application/json')
        }
      }

      if (!this.formData.responseStatus) this.$set(this.formData, 'responseStatus', 'out_response_status_')
      if (!this.formData.responseHeader) this.$set(this.formData, 'responseHeader', 'out_response_header_')
      if (!this.formData.responseBody) this.$set(this.formData, 'responseBody', 'out_response_body_')

      const encReq = this.requestCodeOptions.map(o => String(o.value))
      const rcq = this.formData.requestCode != null ? String(this.formData.requestCode) : ''
      if (!rcq || !encReq.includes(rcq)) this.$set(this.formData, 'requestCode', encReq[0] || 'UTF-8')

      const encRes = this.responseCodeOptions.map(o => String(o.value))
      const rcs = this.formData.responseCode != null ? String(this.formData.responseCode) : ''
      if (!rcs || !encRes.includes(rcs)) this.$set(this.formData, 'responseCode', encRes[0] || 'UTF-8')

      if (this.formData.connectOutTime === undefined || this.formData.connectOutTime === '') {
        this.$set(this.formData, 'connectOutTime', 5000)
      }
      if (this.formData.readOutTime === undefined || this.formData.readOutTime === '') {
        this.$set(this.formData, 'readOutTime', 5000)
      }
      if (this.formData.retryNum === undefined || this.formData.retryNum === '') {
        this.$set(this.formData, 'retryNum', 0)
      }
      if (this.formData.retryTime === undefined || this.formData.retryTime === '') {
        this.$set(this.formData, 'retryTime', 10000)
      }

      if (!Array.isArray(this.formData.headerList)) {
        this.$set(this.formData, 'headerList', [])
      } else {
        this.$set(
          this.formData,
          'headerList',
          this.formData.headerList.map(normalizeHeaderRow).filter(r => r.name || r.value || r.description)
        )
      }

      if (this.formData.useXForm === undefined || this.formData.useXForm === null) {
        this.$set(this.formData, 'useXForm', true)
      }
      if (this.formData.useRaw === undefined || this.formData.useRaw === null) {
        this.$set(this.formData, 'useRaw', false)
      }
      if (this.formData.raw === undefined) this.$set(this.formData, 'raw', '')

      if (!Array.isArray(this.formData.xFormList)) {
        this.$set(this.formData, 'xFormList', [])
      } else {
        this.$set(
          this.formData,
          'xFormList',
          this.formData.xFormList.map(normalizeParamRow).filter(r => r.key || r.value || r.description)
        )
      }

      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined || this.formData.distributeType === null) {
        this.$set(this.formData, 'distributeType', false)
      }
    },
    openHeaderEditor() {
      this.headerEditor.list = (this.formData.headerList || []).map(r => normalizeHeaderRow(r))
      this.headerEditor.visible = true
    },
    closeHeaderEditor() {
      this.headerEditor.list = []
    },
    addHeaderRow() {
      this.headerEditor.list.push(emptyHeaderRow())
    },
    removeHeaderRow(index) {
      this.headerEditor.list.splice(index, 1)
    },
    confirmHeaderEditor() {
      const rows = this.headerEditor.list.map(normalizeHeaderRow).filter(r => r.name || r.value || r.description)
      this.$set(this.formData, 'headerList', rows)
      this.headerEditor.visible = false
    },
    openBodyEditor() {
      if (!this.supportsRequestBody) return
      this.bodyEditor.list = (this.formData.xFormList || []).map(r => normalizeParamRow(r))
      this.bodyEditor.visible = true
    },
    closeBodyEditor() {
      this.bodyEditor.list = []
    },
    addBodyRow() {
      this.bodyEditor.list.push(emptyParamRow())
    },
    removeBodyRow(index) {
      this.bodyEditor.list.splice(index, 1)
    },
    confirmBodyEditor() {
      const rows = this.bodyEditor.list.map(normalizeParamRow).filter(r => r.key || r.value || r.description)
      this.$set(this.formData, 'xFormList', rows)
      this.bodyEditor.visible = false
    },
    buildStepData() {
      const connectOutTime = Number(this.formData.connectOutTime)
      const readOutTime = Number(this.formData.readOutTime)
      const retryNum = Number(this.formData.retryNum)
      const retryTime = Number(this.formData.retryTime)
      const copiesCache = Number(this.formData.copiesCache)

      const method = (this.formData.requestMethod != null ? String(this.formData.requestMethod) : '').trim().toUpperCase()
      const withBody = ['POST', 'PUT', 'PATCH'].includes(method)

      let useRaw = false
      let useXForm = false
      let raw = ''
      let xFormList = []
      let requestType = ''
      if (withBody) {
        requestType = this.formData.requestType != null ? String(this.formData.requestType) : ''
        useRaw = !!this.formData.useRaw
        useXForm = useRaw ? false : this.formData.useXForm !== false
        raw = useRaw ? (this.formData.raw != null ? String(this.formData.raw) : '') : ''
        xFormList = useXForm
          ? (this.formData.xFormList || []).map(normalizeParamRow).filter(r => r.key || r.value || r.description)
          : []
      }

      const headerList = (this.formData.headerList || []).map(normalizeHeaderRow).filter(r => r.name || r.value || r.description)

      return {
        name: this.formData.name,
        description: this.formData.description || '',
        url: (this.formData.url || '').trim(),
        requestMethod: method,
        requestType,
        responseStatus: (this.formData.responseStatus || '').trim(),
        responseHeader: (this.formData.responseHeader || '').trim(),
        responseBody: (this.formData.responseBody || '').trim(),
        requestCode: this.formData.requestCode != null ? String(this.formData.requestCode) : '',
        responseCode: this.formData.responseCode != null ? String(this.formData.responseCode) : '',
        connectOutTime: Number.isFinite(connectOutTime) ? connectOutTime : 5000,
        readOutTime: Number.isFinite(readOutTime) ? readOutTime : 5000,
        retryNum: Number.isFinite(retryNum) ? retryNum : 0,
        retryTime: Number.isFinite(retryTime) ? retryTime : 10000,
        headerList,
        useXForm,
        xFormList,
        useRaw,
        raw,
        copiesCache: Number.isFinite(copiesCache) && copiesCache > 0 ? copiesCache : 1,
        distributeType: !!this.formData.distributeType
      }
    },
    validateForSubmit() {
      if (!this.formData.name || !String(this.formData.name).trim()) {
        this.$message.warning('请输入步骤名称')
        return false
      }
      const d = this.buildStepData()
      if (!d.url) {
        this.$message.warning('请输入 URL')
        return false
      }
      if (!d.requestMethod) {
        this.$message.warning('请选择请求方式')
        return false
      }
      const m = String(d.requestMethod || '').toUpperCase()
      if (['POST', 'PUT', 'PATCH'].includes(m) && !d.requestType) {
        this.$message.warning('当前请求方式请选择请求类型')
        return false
      }
      if (!d.responseStatus) {
        this.$message.warning('请输入响应状态码字段名')
        return false
      }
      if (!d.responseHeader) {
        this.$message.warning('请输入响应头字段名')
        return false
      }
      if (!d.responseBody) {
        this.$message.warning('请输入响应体字段名')
        return false
      }
      return true
    },
    handleSubmit() {
      if (!this.validateForSubmit()) return
      const d = this.buildStepData()
      Object.keys(d).forEach((k) => {
        this.$set(this.formData, k, d[k])
      })
      this.$emit('save')
    },
    async previewData() {
      if (!this.validateForSubmit()) return
      if (!this.flowId) {
        this.$message.warning('流程ID不存在')
        return
      }

      this.previewVisible = true
      this.previewLoading = true
      this.previewTableData = []
      this.previewColumns = []

      const stepData = this.buildStepData()
      const config = {
        name: this.formData.name,
        code: 'ApiOutput',
        data: {
          ...stepData
        }
      }

      try {
        const res = await previewDataApi({
          id: this.flowId,
          config: JSON.stringify(config)
        })
        if (res.code === '000000' && res.data) {
          if (res.data.fieldList && res.data.fieldList.length > 0) {
            this.previewColumns = res.data.fieldList
            if (res.data.dataList && res.data.dataList.length > 0) {
              this.previewTableData = res.data.dataList.map(row => {
                const obj = {}
                res.data.fieldList.forEach((field, index) => {
                  obj[field] = row[index]
                })
                return obj
              })
            }
          } else {
            this.previewColumns = []
            this.previewTableData = []
          }
        } else {
          this.$message.error((res && res.message) || '获取预览数据失败')
        }
      } catch (e) {
        console.error(e)
        this.$message.error('预览数据失败')
      } finally {
        this.previewLoading = false
      }
    }
  }
}
</script>

<style scoped>
.api-output-config {
  width: 100%;
}

.config-content {
  padding: 20px;
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
  border-bottom: 1px solid #ebeef5;
}

.form-item {
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
}

.form-item.checkbox-item {
  align-items: center;
}

.form-item.checkbox-item .el-checkbox {
  line-height: 36px;
}

.body-radio-toolbar {
  margin-bottom: 14px;
}

.body-radio-toolbar .el-radio {
  margin-right: 20px;
}

.body-radio-toolbar .el-radio:last-child {
  margin-right: 0;
}

.form-label--spacer {
  visibility: hidden;
  padding-top: 0;
}

.form-item--radios {
  align-items: center;
}

.form-item--radios .el-radio-group {
  flex: 1;
  line-height: 36px;
}

.body-mode-row {
  align-items: center;
}

.raw-block .form-textarea {
  flex: 1;
}

.raw-textarea {
  font-family: monospace;
  font-size: 13px;
}

.form-label {
  width: 140px;
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
  color: #f56c6c;
  margin-right: 4px;
}

.form-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
}

.form-textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  resize: vertical;
}

.form-select {
  flex: 1;
  width: 100% !important;
}

.help-icon {
  display: inline-block;
  margin-left: 6px;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 50%;
  border: 1px solid #c0c4cc;
  color: #909399;
  font-size: 12px;
  cursor: default;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
}

.section-toggle {
  color: #909399;
}

.section-content {
  margin-bottom: 16px;
}

.field-table-wrap {
  width: 100%;
}

.field-table-wrap--compact {
  width: 100%;
  min-width: 0;
}

.api-output-config ::v-deep .api-param-table--fill.el-table {
  width: 100% !important;
}

.api-output-config ::v-deep .api-param-table--fill .el-table__header-wrapper table,
.api-output-config ::v-deep .api-param-table--fill .el-table__body-wrapper table {
  width: 100% !important;
  table-layout: fixed;
}

.api-output-config ::v-deep .api-param-table .cell {
  text-align: center;
}

.api-output-config ::v-deep .api-param-table .el-table__empty-text {
  display: block;
  width: 100%;
  text-align: center;
}

.api-output-config ::v-deep .api-param-table .el-input__inner {
  text-align: center;
}

.field-actions {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.advanced-layout {
  padding-bottom: 8px;
}

.advanced-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.advanced-label {
  font-size: 14px;
  color: #606266;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
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
}

.preview-btn {
  background: #ecf5ff;
  color: #409eff;
  border-color: #b3d8ff;
}

.preview-btn:hover {
  background: #d9ecff;
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
  border: 1px solid #dcdfe6;
}

.secondary-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.dash-btn {
  width: 100%;
  max-width: 100%;
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

.dlg-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.dlg-table {
  width: 100%;
}

.dlg-table--param-editor {
  flex: 0 0 auto;
}

.dlg-add-row-btn {
  margin-top: 8px;
  width: 100%;
}

.dlg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.preview-body {
  min-height: 120px;
}
</style>

<style>
/* 编辑请求头/请求体弹窗使用 append-to-body，需全局类名命中 */
.api-output-param-dialog .el-dialog__body {
  min-height: 0;
  padding-top: 12px;
  padding-bottom: 8px;
}

.api-output-param-dialog .api-param-table .cell {
  text-align: center;
}

.api-output-param-dialog .api-param-table .el-input__inner {
  text-align: center;
}

.api-output-param-dialog .api-param-table .el-table__empty-text {
  display: block;
  width: 100%;
  text-align: center;
}

.api-output-param-dialog .api-param-table--fill.el-table {
  width: 100% !important;
}

.api-output-param-dialog .api-param-table--fill .el-table__header-wrapper table,
.api-output-param-dialog .api-param-table--fill .el-table__body-wrapper table {
  width: 100% !important;
  table-layout: fixed;
}
</style>
