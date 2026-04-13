<template>
  <div class="api-input-config">
    <div class="config-content">
      <FlowConfigHero
        badge="集成"
        title="API 输入"
        description="通过 HTTP 请求拉取数据，将响应头、状态或正文映射为流程字段。"
        tone="indigo"
        icon="el-icon-link"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="API输入">
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

        <template v-if="isPost">
          <div class="section-header" @click="sectionOpen.body = !sectionOpen.body">
            <h4>请求体</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.body ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.body" class="section-content">
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
          </div>
        </template>

        <div class="section-header" @click="sectionOpen.pagination = !sectionOpen.pagination">
          <h4>分页查询设置</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.pagination ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.pagination" class="section-content section-content--pagination">
          <div class="form-item form-item--stacked">
            <label class="form-label required">是否为分页查询：</label>
            <el-radio-group v-model="formData.usePage" class="pagination-radio-group">
              <el-radio :label="true">是</el-radio>
              <el-radio :label="false">否</el-radio>
            </el-radio-group>
          </div>
          <template v-if="formData.usePage">
            <div class="form-item form-item--stacked">
              <label class="form-label required">
                分页查询完成条件
                <el-tooltip placement="top" max-width="460" popper-class="pagination-condition-help-tooltip">
                  <div slot="content" class="pagination-condition-help">
                    <p class="pagination-condition-help__lead">
                      每次分页请求完成后，可根据本次请求的 HTTP 响应编写判断表达式，用于决定是否继续下一页。变量使用
                      <code>${变量名}</code> 或 <code>#{}</code> 形式；支持链式调用如
                      <code>.contains()</code>、<code>.length()</code> 等；表达式结果为布尔值，表示是否<strong>结束</strong>分页。
                    </p>
                    <p class="pagination-condition-help__subtitle">常用的分页查询判断表达式：</p>
                    <ul class="pagination-condition-help__examples">
                      <li>
                        <span class="pagination-condition-help__case">1. 按页码截止</span>
                        <code class="pagination-condition-help__code">${page_no}>=100</code>
                        <span class="pagination-condition-help__hint">页码达到 100 时结束。</span>
                      </li>
                      <li>
                        <span class="pagination-condition-help__case">2. 按响应体是否包含关键字</span>
                        <code class="pagination-condition-help__code">${in_response_body}.contains("name")!=true</code>
                        <span class="pagination-condition-help__hint">响应体中不包含 <code class="pagination-condition-help__inline-code">name</code> 时结束（请将 <code class="pagination-condition-help__inline-code">in_response_body</code> 换为你配置的响应体字段名）。</span>
                      </li>
                      <li>
                        <span class="pagination-condition-help__case">3. 按返回内容长度</span>
                        <code class="pagination-condition-help__code">${in_response_body}.length()&lt;100</code>
                        <span class="pagination-condition-help__hint">返回报文长度小于 100 时结束。</span>
                      </li>
                    </ul>
                    <p class="pagination-condition-help__footer">
                      状态码、响应头可同样用 <code>${响应状态码字段名}</code>、<code>${响应头字段名}</code> 引用，名称以「响应报文字段名配置」为准。
                    </p>
                  </div>
                  <i class="el-icon-question help-i" aria-hidden="true" />
                </el-tooltip>
              </label>
              <div class="code-editor-wrap">
                <div class="code-editor-gutter" aria-hidden="true">{{ paginationLineNumbers }}</div>
                <textarea
                  v-model="formData.pageCondition"
                  class="code-editor-input"
                  rows="6"
                  spellcheck="false"
                  placeholder="例如：${page_no}>=100 或 ${in_response_body}.length()&lt;100（字段名与下方「响应报文字段名」一致）"
                  @scroll="onPageConditionScroll"
                />
              </div>
            </div>
            <div class="form-item form-item--stacked">
              <label class="form-label required">
                设置分页查询延迟时间间隔
                <el-tooltip
                  content="相邻两次分页请求之间的随机延迟区间（毫秒），实际延迟在最小值与最大值之间随机。"
                  placement="top"
                >
                  <i class="el-icon-question help-i" aria-hidden="true" />
                </el-tooltip>
              </label>
              <div class="delay-range-row">
                <input
                  v-model.number="formData.pageDelayMin"
                  type="number"
                  min="0"
                  class="form-input form-input--delay"
                  placeholder="1"
                >
                <span class="delay-range-sep">毫秒 ~</span>
                <input
                  v-model.number="formData.pageDelayMax"
                  type="number"
                  min="0"
                  class="form-input form-input--delay"
                  placeholder="100"
                >
                <span class="delay-range-unit">毫秒</span>
              </div>
            </div>
          </template>
        </div>

        <div class="section-header" @click="sectionOpen.response = !sectionOpen.response">
          <h4>响应报文字段名配置<span class="help-icon" title="将 HTTP 响应映射到下游字段名">?</span></h4>
          <div class="section-toggle">
            <i :class="sectionOpen.response ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.response" class="section-content">
          <div class="form-item">
            <label class="form-label required">响应状态码字段名：</label>
            <input v-model="formData.responseStatus" type="text" class="form-input" placeholder="in_response_status_">
          </div>
          <div class="form-item">
            <label class="form-label required">响应头字段名：</label>
            <input v-model="formData.responseHeader" type="text" class="form-input" placeholder="in_response_header_">
          </div>
          <div class="form-item">
            <label class="form-label required">响应体字段名：</label>
            <input v-model="formData.responseBody" type="text" class="form-input" placeholder="in_response_body_">
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
          <div class="form-item">
            <label class="form-label">起始页码：</label>
            <input v-model.number="formData.startPageNo" type="number" min="1" class="form-input" placeholder="1">
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
        </div>
      </template>

      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <el-dialog
      :visible.sync="headerEditor.visible"
      title="编辑请求头"
      width="720px"
      custom-class="api-input-param-dialog"
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
      custom-class="api-input-param-dialog"
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
  </div>
</template>

<script>
import FlowConfigHero from '../common/FlowConfigHero.vue'

function emptyParamRow() {
  return { key: '', value: '', description: '' }
}

function emptyHeaderRow() {
  return { name: '', value: '', description: '' }
}

/** 请求头与后端 name/value/description 对齐；兼容历史数据中的 key */
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
  name: 'ApiInputConfig',
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
      sectionOpen: {
        headers: true,
        body: true,
        pagination: true,
        response: true,
        distribution: false
      },
      headerEditor: {
        visible: false,
        list: []
      },
      bodyEditor: {
        visible: false,
        list: []
      }
    }
  },
  computed: {
    isPost() {
      return String(this.formData.requestMethod || '').trim().toUpperCase() === 'POST'
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
      const fallback = [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' }
      ]
      return this.dictOptionsByCode('requestMethod', fallback)
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
    },
    paginationLineNumbers() {
      const t = this.formData.pageCondition != null ? String(this.formData.pageCondition) : ''
      const n = Math.max(1, t.split('\n').length)
      return Array.from({ length: n }, (_, i) => i + 1).join('\n')
    }
  },
  watch: {
    componentTreeConfig: {
      handler() {
        this.initDefaults()
      },
      deep: true
    }
  },
  mounted() {
    this.initDefaults()
  },
  methods: {
    /** 无行时不设 max-height，避免表格体占满固定高度产生大块空白；有行时限制高度超出滚动 */
    paramEditorBodyMaxHeight(list) {
      return Array.isArray(list) && list.length > 0 ? 280 : undefined
    },
    onPageConditionScroll(e) {
      const gutter = e.target && e.target.previousElementSibling
      if (gutter && gutter.classList && gutter.classList.contains('code-editor-gutter')) {
        gutter.scrollTop = e.target.scrollTop
      }
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
      let options = list
        .map((x) => ({
          value: x && x.code != null ? String(x.code) : '',
          label: x && x.value != null ? String(x.value) : ''
        }))
        .filter(x => x.value && x.label)
      if (String(dictCode) === 'requestMethod' && options.length) {
        const allow = new Set(['GET', 'POST'])
        options = options.filter((o) => allow.has(String(o.value).toUpperCase()))
      }
      return options.length ? options : fallback
    },
    onRequestMethodChange() {
      if (!this.isPost) {
        this.$set(this.formData, 'requestType', '')
        if (this.bodyEditor.visible) {
          this.bodyEditor.visible = false
          this.bodyEditor.list = []
        }
        return
      }
      this.$set(this.formData, 'useRaw', false)
      this.$set(this.formData, 'useXForm', true)
      this.$set(this.formData, 'raw', '')
    },
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', 'API输入')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.url === undefined) this.$set(this.formData, 'url', '')

      const methods = this.requestMethodOptions.map(o => String(o.value))
      const rmUpper =
        this.formData.requestMethod != null ? String(this.formData.requestMethod).trim().toUpperCase() : ''
      const methodMatch = methods.find(m => String(m).toUpperCase() === rmUpper)
      if (!methodMatch) {
        this.$set(this.formData, 'requestMethod', methods[0] || 'GET')
      } else {
        this.$set(this.formData, 'requestMethod', methodMatch)
      }

      if (!this.isPost) {
        this.$set(this.formData, 'requestType', '')
      }

      if (!this.formData.responseStatus) this.$set(this.formData, 'responseStatus', 'in_response_status_')
      if (!this.formData.responseHeader) this.$set(this.formData, 'responseHeader', 'in_response_header_')
      if (!this.formData.responseBody) this.$set(this.formData, 'responseBody', 'in_response_body_')

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

      if (this.formData.usePage === undefined || this.formData.usePage === null) {
        this.$set(this.formData, 'usePage', false)
      } else {
        const up = this.formData.usePage
        const asBool =
          up === true ||
          up === 'true' ||
          up === 1 ||
          up === '1'
        this.$set(this.formData, 'usePage', asBool)
      }
      if (this.formData.pageCondition === undefined) this.$set(this.formData, 'pageCondition', '')
      if (this.formData.pageDelayMin === undefined || this.formData.pageDelayMin === '') {
        this.$set(this.formData, 'pageDelayMin', 1)
      } else {
        this.$set(this.formData, 'pageDelayMin', Math.max(0, Math.trunc(Number(this.formData.pageDelayMin)) || 0))
      }
      if (this.formData.pageDelayMax === undefined || this.formData.pageDelayMax === '') {
        this.$set(this.formData, 'pageDelayMax', 100)
      } else {
        this.$set(this.formData, 'pageDelayMax', Math.max(0, Math.trunc(Number(this.formData.pageDelayMax)) || 0))
      }
      if (this.formData.startPageNo === undefined || this.formData.startPageNo === '') {
        this.$set(this.formData, 'startPageNo', 1)
      } else {
        const p = Math.max(1, Math.trunc(Number(this.formData.startPageNo)) || 1)
        this.$set(this.formData, 'startPageNo', p)
      }

      if (this.formData.distributeType === undefined || this.formData.distributeType === null) {
        this.$set(this.formData, 'distributeType', false)
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

      if (this.isPost) {
        this.$set(this.formData, 'useRaw', false)
        this.$set(this.formData, 'useXForm', true)
        this.$set(this.formData, 'raw', '')
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
      if (!this.isPost) return
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

      const method = (this.formData.requestMethod != null ? String(this.formData.requestMethod) : '').trim().toUpperCase()
      const isPost = method === 'POST'

      const useRaw = false
      const useXForm = isPost
      const raw = ''
      let xFormList = []
      if (isPost) {
        xFormList = (this.formData.xFormList || []).map(normalizeParamRow).filter(r => r.key || r.value || r.description)
      }

      const headerList = (this.formData.headerList || []).map(normalizeHeaderRow).filter(r => r.name || r.value || r.description)

      const rs = (this.formData.responseStatus || '').trim() || 'in_response_status_'
      const rh = (this.formData.responseHeader || '').trim() || 'in_response_header_'
      const rb = (this.formData.responseBody || '').trim() || 'in_response_body_'

      let pageDelayMin = Math.max(0, Math.trunc(Number(this.formData.pageDelayMin)) || 1)
      let pageDelayMax = Math.max(0, Math.trunc(Number(this.formData.pageDelayMax)) || 100)
      if (pageDelayMin > pageDelayMax) {
        const t = pageDelayMin
        pageDelayMin = pageDelayMax
        pageDelayMax = t
      }

      return {
        name: this.formData.name,
        description: this.formData.description || '',
        url: (this.formData.url || '').trim(),
        requestMethod: method,
        requestType: isPost ? 'application/x-www-form-urlencoded' : '',
        responseStatus: rs,
        responseHeader: rh,
        responseBody: rb,
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
        copiesCache: 1,
        distributeType: !!this.formData.distributeType,
        usePage: !!this.formData.usePage,
        pageCondition:
          this.formData.usePage && this.formData.pageCondition != null
            ? String(this.formData.pageCondition)
            : '',
        pageDelayMin,
        pageDelayMax,
        startPageNo: Math.max(1, Math.trunc(Number(this.formData.startPageNo)) || 1)
      }
    },
    xFormValuesContainPageNo(list) {
      const marker = '${page_no}'
      if (!Array.isArray(list)) return false
      return list.some((r) => String((r && r.value) || '').includes(marker))
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
      if (d.usePage) {
        if (!String(d.pageCondition || '').trim()) {
          this.$message.warning('请填写分页查询完成条件')
          return false
        }
        const marker = '${page_no}'
        const inUrl = d.url.includes(marker)
        const inForm = this.xFormValuesContainPageNo(d.xFormList)
        if (!inUrl && !inForm) {
          this.$message.warning('分页查询需在 URL 或请求体表单值中包含 ${page_no}')
          return false
        }
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
    }
  }
}
</script>

<style scoped>
.api-input-config {
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

.form-item--checkbox {
  align-items: center;
}

.form-item--checkbox .el-checkbox {
  line-height: 36px;
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

.help-i {
  margin-left: 4px;
  color: #909399;
  font-size: 14px;
  cursor: default;
  vertical-align: middle;
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

.section-content--pagination {
  padding-top: 4px;
}

.form-item--stacked {
  flex-direction: column;
  align-items: stretch;
}

.form-item--stacked .form-label {
  width: auto;
  max-width: 100%;
  text-align: left;
  padding-top: 0;
  margin-right: 0;
  margin-bottom: 8px;
  line-height: 1.5;
}

.pagination-radio-group {
  line-height: 32px;
}

.api-input-config ::v-deep .pagination-radio-group .el-radio {
  margin-right: 24px;
}

.code-editor-wrap {
  display: flex;
  width: 100%;
  min-height: 140px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
}

.code-editor-gutter {
  flex: 0 0 40px;
  padding: 8px 6px 8px 8px;
  background: #f5f7fa;
  color: #909399;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 12px;
  line-height: 20px;
  text-align: right;
  white-space: pre;
  overflow: hidden;
  border-right: 1px solid #ebeef5;
  user-select: none;
}

.code-editor-input {
  flex: 1;
  min-height: 140px;
  margin: 0;
  padding: 8px 12px;
  border: none;
  border-radius: 0;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 20px;
  color: #303133;
  resize: vertical;
  box-sizing: border-box;
}

.code-editor-input:focus {
  outline: none;
}

.delay-range-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.form-input--delay {
  flex: 0 0 100px;
  width: 100px;
  max-width: 120px;
}

.delay-range-sep,
.delay-range-unit {
  font-size: 14px;
  color: #606266;
}

.field-table-wrap {
  width: 100%;
}

.field-table-wrap--compact {
  width: 100%;
  min-width: 0;
}

/* 键/值/说明三列等分铺满容器，避免右侧大块留白 */
.api-input-config ::v-deep .api-param-table--fill.el-table {
  width: 100% !important;
}

.api-input-config ::v-deep .api-param-table--fill .el-table__header-wrapper table,
.api-input-config ::v-deep .api-param-table--fill .el-table__body-wrapper table {
  width: 100% !important;
  table-layout: fixed;
}

/* 请求头/请求体表：表头、单元格、空状态、输入框文案水平居中 */
.api-input-config ::v-deep .api-param-table .cell {
  text-align: center;
}

.api-input-config ::v-deep .api-param-table .el-table__empty-text {
  display: block;
  width: 100%;
  text-align: center;
}

.api-input-config ::v-deep .api-param-table .el-input__inner {
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

</style>

<style>
/* 编辑请求头/请求体弹窗使用 append-to-body，需全局类名命中 */
.api-input-param-dialog .el-dialog__body {
  min-height: 0;
  padding-top: 12px;
  padding-bottom: 8px;
}

.api-input-param-dialog .api-param-table .cell {
  text-align: center;
}

.api-input-param-dialog .api-param-table .el-input__inner {
  text-align: center;
}

.api-input-param-dialog .api-param-table .el-table__empty-text {
  display: block;
  width: 100%;
  text-align: center;
}

/* 弹窗内表格与侧栏一致：铺满宽度，键/值/说明等分 */
.api-input-param-dialog .api-param-table--fill.el-table {
  width: 100% !important;
}

.api-input-param-dialog .api-param-table--fill .el-table__header-wrapper table,
.api-input-param-dialog .api-param-table--fill .el-table__body-wrapper table {
  width: 100% !important;
  table-layout: fixed;
}

/* 分页完成条件：悬停提示（挂载在 body，与 FieldSplitter / Normaliser 等一致用 el-tooltip） */
.pagination-condition-help-tooltip {
  max-width: 460px !important;
}

.pagination-condition-help-tooltip .pagination-condition-help {
  max-height: min(70vh, 480px);
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.6;
  text-align: left;
}

.pagination-condition-help-tooltip .pagination-condition-help__lead {
  margin: 0 0 10px;
}

.pagination-condition-help-tooltip .pagination-condition-help__subtitle {
  margin: 0 0 6px;
  font-weight: 600;
}

.pagination-condition-help-tooltip .pagination-condition-help__examples {
  margin: 0;
  padding-left: 18px;
}

.pagination-condition-help-tooltip .pagination-condition-help__examples li {
  margin-bottom: 12px;
}

.pagination-condition-help-tooltip .pagination-condition-help__examples li:last-child {
  margin-bottom: 0;
}

.pagination-condition-help-tooltip .pagination-condition-help__case {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  opacity: 0.92;
}

.pagination-condition-help-tooltip .pagination-condition-help__code {
  display: block;
  margin: 4px 0 6px;
  padding: 6px 8px;
  font-family: Monaco, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.pagination-condition-help-tooltip .pagination-condition-help__hint {
  display: block;
  font-size: 12px;
  line-height: 1.55;
  opacity: 0.88;
}

.pagination-condition-help-tooltip .pagination-condition-help__inline-code {
  padding: 0 3px;
  font-family: Monaco, Menlo, Consolas, monospace;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 2px;
}

.pagination-condition-help-tooltip .pagination-condition-help__lead code {
  padding: 1px 4px;
  font-family: Monaco, Menlo, Consolas, monospace;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 2px;
}

.pagination-condition-help-tooltip .pagination-condition-help__footer {
  margin: 12px 0 0;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 12px;
  line-height: 1.55;
  opacity: 0.88;
}

.pagination-condition-help-tooltip .pagination-condition-help__footer code {
  padding: 1px 4px;
  font-family: Monaco, Menlo, Consolas, monospace;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 2px;
}
</style>
