<template>
  <div class="flow-editor">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div>清洗流程设计</div>
      </div>
      <div class="toolbar-right">
        <div class="toolbar-btn" @click="saveFlow">
          <i class="el-icon-finished" />
          <div class="toolbar-btn-txt">保存</div>
        </div>
        <div
          class="toolbar-btn"
          :class="{ 'is-disabled': isRunning }"
          @click="handleRunClick"
        >
          <i class="el-icon-video-play" />
          <div class="toolbar-btn-txt">{{ isRunning ? '运行中' : '运行' }}</div>
        </div>
        <div
          class="toolbar-btn"
          :class="{ 'is-disabled': isStopping }"
          @click="!isStopping && stopFlowHandler()"
        >
          <i class="el-icon-video-pause" />
          <div class="toolbar-btn-txt">{{ isStopping ? '停止中' : '停止' }}</div>
        </div>
        <div class="toolbar-btn" @click="toggleLogDialog">
          <i class="el-icon-view" />
          <div class="toolbar-btn-txt">查看日志</div>
        </div>
      </div>
    </div>

    <!-- 左侧组件面板 -->
    <div class="sidebar">
      <div v-for="menu in menuConfig" :key="menu.id" class="menu-section">
        <div class="menu-title" @click="toggleMenu(menu.id)">
          <span
            v-if="!menu.icon || !menu.icon.startsWith('data:image')"
            class="menu-icon"
          >{{ menu.icon }}</span>
          <img v-else class="menu-icon-img" :src="menu.icon" alt="">
          <span>{{ menu.label }}</span>
          <i
            class="el-icon-arrow-down toggle-icon"
            :class="{ rotate: menuState[menu.id] }"
          />
        </div>
        <div v-show="menuState[menu.id]" class="menu-items">
          <div
            v-for="item in menu.children"
            :key="item.id"
            class="menu-item-wrap"
          >
            <el-tooltip
              content="暂未开放"
              placement="right"
              effect="dark"
              :disabled="!isComponentDisabled(item)"
            >
              <div
                class="component-item"
                :class="{ 'is-disabled': isComponentDisabled(item) }"
                :draggable="!isComponentDisabled(item)"
                @dragstart="onDragStart($event, item)"
              >
                <div class="component-item-content">
                  <span
                    v-if="!item.icon || !item.icon.startsWith('data:image')"
                    class="icon"
                  >{{ item.icon }}</span>
                  <img v-else class="icon-img" :src="item.icon" alt="">
                  <span class="label">{{ item.label }}</span>
                </div>
              </div>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- 中间画布 -->
    <div ref="graphContainer" class="graph-container" />

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div class="menu-item" @click="deleteSelectedItem">删除</div>
    </div>

    <!-- 数据分发模式选择对话框 -->
    <div v-if="distributionDialog.visible" class="distribution-dialog">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>数据分发模式选择</h3>
          <button class="close-btn" @click="distributionDialog.visible = false">
            ×
          </button>
        </div>
        <div class="dialog-body">
          <p>请选择数据分发模式：</p>
          <div class="button-group">
            <button
              class="btn distribute-btn"
              @click="selectDistributionMode('分发')"
            >
              分发
            </button>
            <button
              class="btn copy-btn"
              @click="selectDistributionMode('复制')"
            >
              复制
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 替换原配置抽屉为通用组件 -->
    <ConfigDrawer
      :visible="configDrawer.visible"
      :component-type="configDrawer.componentType"
      :initial-form="configDrawer.form"
      :flow-id="flowId"
      :flow-config="configDrawer.flowConfig"
      :current-node-id="configDrawer.currentNodeId"
      :component-tree-config="configDrawer.componentTreeConfig"
      @close="handleConfigDrawerClose"
      @save="handleConfigDrawerSave"
    />

    <!-- 日志弹窗 -->
    <div v-if="logVisible" class="log-dialog-mask">
      <div
        class="log-dialog"
        :class="{ 'is-movable': logDialogPosition.top !== null }"
        :style="logDialogPosition.top !== null ? { top: logDialogPosition.top + 'px', left: logDialogPosition.left + 'px' } : {}"
        @click.stop
      >
        <div
          class="log-header"
          :class="{ dragging: logDragging }"
          @mousedown.stop.prevent="onLogMouseDown"
        >
          <span class="log-title">流程运行日志</span>
          <button class="close-log" @click="closeLogDialog">×</button>
        </div>
        <div class="log-body">
          <div v-if="logItems.length" class="log-content">
            <div
              v-for="(item, idx) in logItems"
              :key="idx"
              class="log-line"
              :class="{ 'log-line--fail': item.status === 'F' }"
            >
              {{ item.text }}
            </div>
          </div>
          <pre v-else class="log-content">{{ logContent }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Graph } from '@antv/x6'
import { getTransComponentTree } from '@/api/collect/trans/transComponent'
import { setConfig, getFlowDetail, executeFlow, stopFlow, checkTransStatus, getProcessLog } from '@/api/collect/trans/transFlow'
import ConfigDrawer from './ConfigDrawer.vue'

export default {
  name: 'FlowEditor',
  components: {
    ConfigDrawer
  },
  props: {
    flowId: {
      type: [Number, String],
      default: null
    },
    flowName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      graph: null,
      hasChange: false,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        selectedCell: null
      },
      menuState: {
        '1': false,
        '2': false,
        '3': false,
        '4': false,
        '5': false,
        '6': false,
        '7': false
      },
      distributionDialog: {
        visible: false,
        currentEdge: null
      },
      menuConfig: [],
      configDrawer: {
        visible: false,
        currentNode: null,
        currentNodeId: '',
        componentType: '',
        form: {
          name: '',
          type: '',
          dbConnection: '',
          tableName: '',
          targetTable: '',
          updateField: '',
          outputPath: '',
          fileFormat: ''
        },
        flowConfig: null,
        componentTreeConfig: null
      },
      // 运行状态相关
      isRunning: false,
      statusCheckTimer: null,
      // 日志相关
      logVisible: false,
      logContent: '',
      logItems: [],
      logTimer: null,
      // 日志弹窗拖拽相关
      logDragging: false,
      logDragOffset: { x: 0, y: 0 },
      logDialogPosition: { top: null, left: null },
      // 停止按钮状态
      isStopping: false,
      // 步骤执行状态（key: 步骤名，value: R/S/F）
      stepStatusMap: {},
      // 连线流动动画
      edgeFlowTimer: null,
      edgeFlowDashOffset: 0
    }
  },
  mounted() {
    // 进入页面时置空日志
    this.logContent = ''
    this.logItems = []

    this.loadComponentTree()
    this.$nextTick(() => {
      this.initGraph()
      if (this.flowId) {
        this.loadFlowConfig()
      }
    })
    document.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },
  beforeDestroy() {
    this.stopEdgeFlowAnimation()
    if (this.graph) {
      this.graph.dispose()
    }
    document.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },
  methods: {
    /** /trans/component/tree.do 叶子节点 enabled === false 表示未开放，不可拖入画布 */
    isComponentDisabled(item) {
      return item && item.enabled === false
    },

    isCleanTransformType(code) {
      return ['DataCleanTransform', 'DataCleanConvert', 'DataCleanConversion', 'CleanTransform', 'DataClean'].includes(code)
    },

    /** 与后端 WRITE_TO_LOG / WriteToLogConstructor 的 code 一致 */
    isPrintLogType(code) {
      return code === 'WriteToLog' || code === 'PrintLog'
    },

    /**
     * 历史/接口数据可能在 data.data 下再挂一层。
     * 合并时必须让「画布顶层扁平字段」最后覆盖内层，否则编辑后的 fieldList 会被嵌套里的旧列表盖回。
     */
    flattenPrintLogStepData(raw) {
      if (!raw || typeof raw !== 'object') return {}
      const top = { ...raw }
      const nest = top.data
      delete top.data
      let innerMerged = {}
      if (nest && typeof nest === 'object' && !Array.isArray(nest)) {
        const level1 = { ...nest }
        const nest2 = level1.data
        delete level1.data
        innerMerged = { ...level1 }
        if (nest2 && typeof nest2 === 'object' && !Array.isArray(nest2)) {
          const level2 = { ...nest2 }
          delete level2.data
          innerMerged = { ...level2, ...level1 }
        }
      }
      return { ...innerMerged, ...top }
    },

    /** 与后端 SQL_SCRIPT（统一标识）一致；兼容旧标识 executeSQL */
    isExecSqlType(code) {
      return code === 'SQLScript' || code === 'executeSQL'
    },

    isConditionJudgeType(code) {
      return ['ConditionJudge', 'ConditionJudgeJava', 'JavaCondition', 'JavaFilter', 'FilterRows'].includes(code)
    },

    isDataFilterType(code) {
      return code === 'DataFilter'
    },

    isProcessBranchType(code) {
      return code === 'ProcessBranch'
    },

    /** 行转列（Kettle Row Denormaliser），与后端 Step 标识 Denormalized / Denormaliser 一致 */
    isDenormalizedType(code) {
      return code === 'Denormalized' || code === 'Denormaliser'
    },

    /** 列转行（Kettle Row Normaliser） */
    isNormaliserType(code) {
      return code === 'Normaliser' || code === 'Normalizer' || code === 'RowNormaliser' || code === 'NormaliserMeta'
    },

    /** 字段选择（Kettle Select Values / SelectValuesMeta） */
    isFieldSelectType(code) {
      return code === 'FieldSelect' || code === 'SelectValues'
    },

    /** 排序记录（Kettle Sort Rows / SortRowsMeta） */
    isSortRowsType(code) {
      return code === 'SortRows'
    },

    /** 字段拆分多行（SplitFieldToRows） */
    isSplitFieldToRowsType(code) {
      return code === 'SplitFieldToRows'
    },

    /** 字段拆分为多列（FieldSplitter） */
    isFieldSplitterType(code) {
      return code === 'FieldSplitter'
    },

    /** 公式（Kettle Formula / FormulaMeta） */
    isFormulaType(code) {
      return code === 'Formula'
    },

    /** 分组统计（Kettle GroupBy），与后端标识 GroupBy 一致 */
    isGroupByType(code) {
      return code === 'GroupBy'
    },

    isFtpUploadType(code) {
      return code === 'FtpUpload' || code === 'FTPUpload'
    },

    isFtpDownloadType(code) {
      return code === 'FtpDownload' || code === 'FTPDownload'
    },

    /** 阿里云 OSS 上传（后端标识 AliYunOSSUpload；兼容历史 code） */
    isAliYunOssUploadType(code) {
      return (
        code === 'AliYunOSSUpload' ||
        code === 'AlibabaOSSUpload' ||
        code === 'AlibabaOssUpload' ||
        code === 'OSSUpload' ||
        code === 'OssUpload'
      )
    },

    /** 阿里云 OSS 下载（后端标识 AliYunOSSDownload；兼容历史 code） */
    isAliYunOssDownloadType(code) {
      return (
        code === 'AliYunOSSDownload' ||
        code === 'AlibabaOSSDownload' ||
        code === 'AlibabaOssDownload' ||
        code === 'OSSDownload' ||
        code === 'OssDownload'
      )
    },

    isRowGeneratorType(code) {
      return code === 'RowGenerator'
    },

    isRecordsFromStreamType(code) {
      return code === 'RecordsFromStream'
    },

    isSystemDateType(code) {
      return code === 'SystemDate'
    },

    isKafkaInputType(code) {
      return code === 'KafkaInput' || code === 'KafkaConsumerInput'
    },

    isRedisInputType(code) {
      return code === 'RedisInput'
    },

    isRedisOutputType(code) {
      return code === 'RedisOutput'
    },

    isKafkaProducerOutputType(code) {
      return code === 'KafkaProducerOutput'
    },

    isRabbitMqProducerOutputType(code) {
      return code === 'RabbitMqProducerOutput'
    },

    isRabbitMqConsumerInputType(code) {
      return code === 'RabbitMqConsumerInput'
    },

    isApiInputType(code) {
      return code === 'ApiInput'
    },

    isApiOutputType(code) {
      return code === 'ApiOutput'
    },

    /** 通过 HTTP 拉取附件/文件（完整表单：分页、响应字段映射、分发等） */
    isApiAttachmentDownloadType(code) {
      return code === 'ApiAttachmentDownload' || code === 'ApiFileDownload'
    },

    isExcelInputType(code) {
      return code === 'ExcelInput'
    },

    isExcelOutputType(code) {
      return code === 'ExcelOutput'
    },

    /**
     * 展开历史上误保存的链式嵌套：data → data → …（每层为普通对象）。
     * 内层字段先展开，再由外层同名字段覆盖，与多数步骤「单层插件参数」一致。
     */
    unwrapChainedPluginData(raw, maxDepth = 8) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
      let o = { ...raw }
      let depth = 0
      while (
        depth < maxDepth &&
        o.data != null &&
        typeof o.data === 'object' &&
        !Array.isArray(o.data)
      ) {
        const inner = { ...o.data }
        const { data: _nested, ...rest } = o
        o = { ...inner, ...rest }
        depth += 1
      }
      return o
    },

    /**
     * 将「插入/更新」步骤参数整理为与 InsertOrUpdateConstructor 一致的结构（就地修改）。
     * 与表输出一致：dataSourceId 为主键，并同步 dbId、dbConnection 便于接口/旧逻辑读取；去掉多余嵌套 data。
     */
    normalizeInsertOrUpdatePluginData(flatData) {
      if (!flatData || typeof flatData !== 'object') return
      if (flatData.data != null && typeof flatData.data === 'object' && !Array.isArray(flatData.data)) {
        delete flatData.data
      }
      let ds =
        flatData.dataSourceId != null && flatData.dataSourceId !== ''
          ? String(flatData.dataSourceId).trim()
          : ''
      if (!ds && flatData.dataSource != null && flatData.dataSource !== '') {
        const raw = flatData.dataSource
        ds = Array.isArray(raw) ? String(raw[raw.length - 1] || '').trim() : String(raw).trim()
      }
      if (!ds && flatData.dbId != null && flatData.dbId !== '') {
        ds = String(flatData.dbId).trim()
      }
      if (!ds && flatData.dbConnection != null && flatData.dbConnection !== '') {
        ds = String(flatData.dbConnection).trim()
      }
      flatData.dataSourceId = ds
      flatData.dbId = ds
      flatData.dbConnection = ds
      delete flatData.dataSource

      flatData.tableName = String(flatData.tableName || '').trim()
      flatData.commitSize =
        flatData.commitSize != null && flatData.commitSize !== ''
          ? String(flatData.commitSize)
          : '1000'

      const ub = flatData.updateBypassed
      flatData.updateBypassed = ub === true || ub === 'true' || ub === 1 || ub === '1'

      if (Array.isArray(flatData.selectField)) {
        flatData.selectField = flatData.selectField.map((r) => {
          const keyCondition = r && r.keyCondition != null ? String(r.keyCondition) : '='
          const isBetween = keyCondition === 'BETWEEN'
          return {
            keyLookup: r && r.keyLookup != null ? String(r.keyLookup) : '',
            keyCondition,
            keyStream: r && r.keyStream != null ? String(r.keyStream) : '',
            keyStream2:
              isBetween && r && r.keyStream2 != null && r.keyStream2 !== '' ? String(r.keyStream2) : ''
          }
        })
      } else {
        flatData.selectField = []
      }

      if (Array.isArray(flatData.updateField)) {
        flatData.updateField = flatData.updateField.map((r) => {
          const up = r && r.update
          const updateBool = up === true || up === 'true' || up === 1 || up === '1'
          return {
            updateLookup: r && r.updateLookup != null ? String(r.updateLookup) : '',
            updateStream: r && r.updateStream != null ? String(r.updateStream) : '',
            update: updateBool
          }
        })
      } else {
        flatData.updateField = []
      }

      if (flatData.copiesCache === undefined || flatData.copiesCache === '') flatData.copiesCache = 1
      if (flatData.distributeType === undefined) flatData.distributeType = false
    },

    /**
     * 流程落库前：规范化画布 JSON 中的插入/更新节点（与 saveFlow 提交内容一致）。
     */
    applyInsertOrUpdatePersistNormalization(flowPayload) {
      if (!flowPayload || !Array.isArray(flowPayload.cells)) return
      flowPayload.cells.forEach((cell) => {
        if (!cell || cell.shape === 'edge') return
        const d = cell.data
        if (!d || d.code !== 'InsertOrUpdate') return
        const merged = this.resolveNodePluginFormData(d)
        const flat = this.unwrapChainedPluginData({ ...merged })
        this.normalizeInsertOrUpdatePluginData(flat)
        // 与表输出 TableOutput 一致：插件参数放在 cell.data.data，便于后端按「name + data」解析
        cell.data = {
          name: flat.name != null ? String(flat.name) : (d.name || ''),
          code: flat.code != null ? String(flat.code) : 'InsertOrUpdate',
          description:
            flat.description != null
              ? String(flat.description)
              : (d.description != null ? String(d.description) : ''),
          data: flat
        }
      })
    },

    /**
     * 解析节点上的「插件表单」数据。
     * - 保存配置后：参数在 cell.data.data 内，根上可能残留同名字段（旧值）。
     * - 新拖入节点：参数扁平在 cell.data 根上，无内层 data。
     */
    resolveNodePluginFormData(nodeData) {
      const root = nodeData && typeof nodeData === 'object' ? nodeData : {}
      const inner = root.data != null && typeof root.data === 'object' && !Array.isArray(root.data)
        ? root.data
        : null
      const flatLayer = { ...root }
      delete flatLayer.data
      if (!inner) {
        return flatLayer
      }
      const merged = { ...flatLayer, ...inner }
      const fillFromRootIfEmpty = [
        'dataSourceId',
        'ftpDataSourceId',
        'dataSource',
        'databaseId',
        'dbId',
        'dbConnection',
        'resourceDbId',
        'outputPath',
        'ftpDirectory',
        'remoteDirectory',
        'fileName',
        'fileSourceType',
        'extension',
        'ifFileExists',
        'fieldList',
        'tableName',
        'tableId',
        'commitSize',
        'updateBypassed',
        'headerList',
        'xFormList',
        'url',
        'raw',
        'requestMethod',
        'requestType',
        'splitField',
        'delimiter',
        'newFieldname',
        'key',
        'fieldDelimiter'
      ]
      fillFromRootIfEmpty.forEach((k) => {
        const cur = merged[k]
        if (cur === undefined || cur === null || cur === '') {
          const fv = flatLayer[k]
          if (fv !== undefined && fv !== null && fv !== '') {
            merged[k] = fv
          }
        }
      })
      if (Array.isArray(merged.fieldList) && merged.fieldList.length === 0 && Array.isArray(flatLayer.fieldList) && flatLayer.fieldList.length) {
        merged.fieldList = flatLayer.fieldList
      }
      // 插入/更新：内层 data 与根上历史残留不一致时，从根补齐关键字/更新字段映射（对齐 TableOutput fieldList 处理）
      ['selectField', 'updateField'].forEach((k) => {
        if (!Array.isArray(merged[k]) || merged[k].length === 0) {
          const fv = flatLayer[k]
          if (Array.isArray(fv) && fv.length) merged[k] = fv
        }
      })
      return this.unwrapChainedPluginData(merged)
    },

    /**
     * Excel 输出：后端/旧版可能把 FTP 与目录存在 data 子对象，或使用 databaseId、ftpDirectory 等字段名。
     */
    mergeExcelOutputFormLayer(raw) {
      const o = { ...(raw || {}) }
      const sub = o.data
      if (sub != null && typeof sub === 'object' && !Array.isArray(sub)) {
        const keys = [
          'dataSourceId',
          'ftpDataSourceId',
          'dataSource',
          'databaseId',
          'dbId',
          'resourceDbId',
          'outputPath',
          'ftpDirectory',
          'remoteDirectory',
          'targetDirectory',
          'directory',
          'outputDir',
          'ftpPath',
          'fileName',
          'extension',
          'ifFileExists',
          'fieldList',
          'sheetname',
          'startingCell',
          'splitEvery',
          'streamingData',
          'dateInFilename',
          'dateTimeFormat',
          'appendLines',
          'appendOmitHeader',
          'copiesCache',
          'distributeType'
        ]
        keys.forEach((k) => {
          if (o[k] === undefined || o[k] === null || o[k] === '') {
            const v = sub[k]
            if (v !== undefined && v !== null && v !== '') o[k] = v
          }
        })
      }
      return o
    },

    /** 从 /trans/component/tree.do 拉平的菜单树中，按组件 code 取节点上的 config（字典 JSON） */
    findTransComponentConfigByCode(code) {
      if (!code || !Array.isArray(this.menuConfig)) return null
      const walk = (nodes) => {
        if (!Array.isArray(nodes)) return null
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]
          if (!n) continue
          if (n.code === code && n.config != null) return n.config
          const hit = walk(n.children)
          if (hit != null) return hit
        }
        return null
      }
      return walk(this.menuConfig)
    },

    // 该方法已不再用于构建 node.data，新节点直接使用 buildFrontendNodeData 构建扁平结构
    // 保留此方法仅为兼容旧代码或特定场景，但其返回值不再嵌套 data
    buildBackendConfigForNewNode(item) {
      const name = item?.label || ''
      const rawCode = item?.code || ''
      const code = this.isConditionJudgeType(rawCode) ? 'JavaCondition' : rawCode

      let initialFormData = {
        name,
        code,
        description: ''
      }

      if (this.isCleanTransformType(code)) {
        initialFormData = {
          ...initialFormData,
          distributeType: false,
          copiesCache: 1,
          fieldList: [],
          requestCode: 'UTF-8',
          responseCode: 'UTF-8',
          connectOutTime: '5000',
          readOutTime: '5000',
          supportCopy: true,
          supportError: true,
          supportInput: true,
          errorStepName: name
        }
      } else if (this.isPrintLogType(code)) {
        initialFormData = {
          ...initialFormData,
          limitRows: true,
          limitRowsNumber: 1000,
          fieldList: []
        }
      } else if (this.isExecSqlType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          sql: '',
          executeEachRow: false,
          bindVariable: false,
          variableReplace: false,
          filedList: []
        }
      } else if (this.isConditionJudgeType(code)) {
        initialFormData = {
          ...initialFormData,
          trueStepName: '',
          errorStepName: '',
          condition: 'true',
          copiesCache: 1,
          // 条件判断不支持复制/分发
          distributeType: false
        }
      } else if (this.isDataFilterType(code)) {
        initialFormData = {
          ...initialFormData,
          filterType: '0',
          condition: {
            conditionGroups: [],
            condition: 'ALL'
          },
          javaCode: '',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isProcessBranchType(code)) {
        initialFormData = {
          ...initialFormData,
          conditionFiled: '',
          ProcessBranchSetup: [],
          defaultTargetStep: '',
          copiesCache: 1,
          distributeType: true
        }
      } else if (this.isDenormalizedType(code)) {
        initialFormData = {
          ...initialFormData,
          groupField: '',
          keyField: '',
          denormaliserTargetField: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isNormaliserType(code)) {
        initialFormData = {
          ...initialFormData,
          keyField: '',
          valueField: '',
          normaliserFields: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isFieldSelectType(code)) {
        initialFormData = {
          ...initialFormData,
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isSortRowsType(code)) {
        initialFormData = {
          ...initialFormData,
          sortSize: '1000',
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isSplitFieldToRowsType(code)) {
        initialFormData = {
          ...initialFormData,
          splitField: '',
          delimiter: ',',
          newFieldname: '',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isFieldSplitterType(code)) {
        initialFormData = {
          ...initialFormData,
          splitField: '',
          delimiter: ',',
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isFormulaType(code)) {
        initialFormData = {
          ...initialFormData,
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isGroupByType(code)) {
        initialFormData = {
          ...initialFormData,
          groupField: [],
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isFtpUploadType(code)) {
        initialFormData = {
          ...initialFormData,
          localDirectory: '',
          wildCard: '',
          dataSource: '',
          remoteDirectory: '',
          outFiledList: [
            { name: '源文件目录', fieldName: 'upload_src_dir' },
            { name: '目标文件目录', fieldName: 'upload_target_dir' },
            { name: '文件名', fieldName: 'upload_file_name' },
            { name: '文件类型', fieldName: 'upload_file_type' }
          ],
          binaryMode: true,
          removeLocalFile: true,
          overwriteFile: true,
          timeOut: 60000,
          distributeType: false,
          copiesCache: 1
        }
      } else if (this.isAliYunOssUploadType(code)) {
        initialFormData = {
          ...initialFormData,
          localDirectory: '',
          wildCard: '',
          dataSource: '',
          bucketName: '',
          outFiledList: [
            { name: '源文件目录', fieldName: 'upload_src_dir' },
            { name: '目标文件目录', fieldName: 'upload_target_dir' },
            { name: '文件名', fieldName: 'upload_file_name' },
            { name: '文件类型', fieldName: 'upload_file_type' }
          ],
          binaryMode: true,
          removeLocalFile: true,
          overwriteFile: true,
          timeOut: 60000,
          distributeType: false,
          copiesCache: 1
        }
      } else if (this.isFtpDownloadType(code)) {
        initialFormData = {
          ...initialFormData,
          localDirectory: '',
          wildCard: '',
          dataSource: '',
          remoteDirectory: '',
          outFiledList: [
            { name: '源文件目录', fieldName: 'download_src_dir' },
            { name: '目标文件目录', fieldName: 'download_target_dir' },
            { name: '文件名', fieldName: 'download_file_name' },
            { name: '文件类型', fieldName: 'download_file_type' },
            { name: '文件大小', fieldName: 'download_file_size' }
          ],
          binaryMode: true,
          timeOut: 60000,
          removeAfterDownload: true,
          moveAfterDownload: false,
          moveToFolder: '',
          createMoveFolderIfNotExist: false,
          fileNameContainsDate: false,
          dateTimeFormat: '',
          distributeType: false,
          copiesCache: 1
        }
      } else if (this.isAliYunOssDownloadType(code)) {
        initialFormData = {
          ...initialFormData,
          localDirectory: '',
          wildCard: '',
          dataSource: '',
          bucketName: '',
          outFiledList: [
            { name: '源文件目录', fieldName: 'download_src_dir' },
            { name: '目标文件目录', fieldName: 'download_target_dir' },
            { name: '文件名', fieldName: 'download_file_name' },
            { name: '文件类型', fieldName: 'download_file_type' },
            { name: '文件大小', fieldName: 'download_file_size' }
          ],
          binaryMode: true,
          timeOut: 60000,
          removeAfterDownload: true,
          moveAfterDownload: false,
          moveToFolder: '',
          createMoveFolderIfNotExist: false,
          fileNameContainsDate: false,
          dateTimeFormat: '',
          distributeType: false,
          copiesCache: 1
        }
      } else if (this.isRowGeneratorType(code)) {
        initialFormData = {
          ...initialFormData,
          recordGenerationType: 1,
          rowLimit: '10',
          timeInterval: '100',
          timeFieldName: 'currentTime',
          lastTimeFieldName: 'lastTime',
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isRecordsFromStreamType(code)) {
        initialFormData = {
          ...initialFormData,
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isSystemDateType(code)) {
        initialFormData = {
          ...initialFormData,
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isKafkaInputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSource: '',
          topics: [],
          partition: '',
          consumerGroup: '',
          transId: this.flowId != null ? Number(this.flowId) : null,
          batchDuration: 1000,
          batchSize: 1000,
          prefetchCount: 100000,
          commitType: 'AUTO_COMMIT',
          fieldList: [
            { kafkaName: 'key', outputName: 'key', outputType: 'String' },
            { kafkaName: 'message', outputName: 'message', outputType: 'String' },
            { kafkaName: 'topic', outputName: 'topic', outputType: 'String' },
            { kafkaName: 'partition', outputName: 'partition', outputType: 'Integer' },
            { kafkaName: 'offset', outputName: 'offset', outputType: 'Integer' },
            { kafkaName: 'timestamp', outputName: 'timestamp', outputType: 'Integer' }
          ],
          properties: '[]',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isRabbitMqConsumerInputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          virtualHost: '/',
          queue: '',
          topics: [],
          listenerAcknowledgeMode: 'manual',
          listenerPrefetch: 1,
          listenerConcurrency: 1,
          listenerMaxConcurrency: 1,
          listenerDefaultRequeueRejected: true,
          listenerRetryEnabled: true,
          listenerRetryInitialInterval: 1000,
          listenerRetryMaxAttempts: 3,
          listenerRetryMaxInterval: 10000,
          listenerRetryMultiplier: 1.0,
          maxMessages: 0,
          fieldList: [
            { rabbitName: 'message', outputName: 'message', outputType: 'String' },
            { rabbitName: 'routingKey', outputName: 'routingKey', outputType: 'String' },
            { rabbitName: 'messageId', outputName: 'messageId', outputType: 'String' },
            { rabbitName: 'deliveryTag', outputName: 'deliveryTag', outputType: 'Long' },
            { rabbitName: 'exchange', outputName: 'exchange', outputType: 'String' },
            { rabbitName: 'timestamp', outputName: 'timestamp', outputType: 'Long' }
          ],
          properties: '[]',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isRedisInputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          key: '',
          fieldDelimiter: '',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isRedisOutputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          dbName: '',
          key: '',
          value: '',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isKafkaProducerOutputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          topic: '',
          clientId: '',
          keyField: '',
          messageField: '',
          properties: '[]',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isRabbitMqProducerOutputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          virtualHost: '/',
          exchange: '',
          routingKey: '',
          queue: '',
          topics: [],
          messageField: '',
          routingKeyField: '',
          publisherConfirmType: 'correlated',
          publisherReturns: true,
          templateMandatory: true,
          properties: '[]',
          copiesCache: 1,
          distributeType: false
        }
      } else if (code === 'DebeziumJson') {
        initialFormData = {
          ...initialFormData,
          sourceField: '',
          sample: '',
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (code === 'ApiInput') {
        initialFormData = {
          ...initialFormData,
          url: '',
          requestMethod: 'GET',
          requestType: '',
          responseStatus: 'in_response_status_',
          responseHeader: 'in_response_header_',
          responseBody: 'in_response_body_',
          headerList: [],
          xFormList: [],
          raw: '',
          useXForm: true,
          useRaw: false,
          usePage: false,
          pageCondition: '',
          pageDelayMin: 1,
          pageDelayMax: 100,
          startPageNo: 1,
          requestCode: 'UTF-8',
          responseCode: 'UTF-8',
          connectOutTime: 5000,
          readOutTime: 5000,
          retryNum: 0,
          retryTime: 10000,
          distributeType: false
        }
      } else if (code === 'ApiOutput') {
        initialFormData = {
          ...initialFormData,
          url: '',
          requestMethod: 'GET',
          requestType: 'application/json',
          responseStatus: 'out_response_status_',
          responseHeader: 'out_response_header_',
          responseBody: 'out_response_body_',
          headerList: [],
          xFormList: [],
          raw: '',
          useXForm: true,
          useRaw: false,
          requestCode: 'UTF-8',
          responseCode: 'UTF-8',
          connectOutTime: 5000,
          readOutTime: 5000,
          retryNum: 0,
          retryTime: 10000,
          copiesCache: 1,
          distributeType: false
        }
      } else if (code === 'ApiAttachmentDownload' || code === 'ApiFileDownload') {
        initialFormData = {
          ...initialFormData,
          url: '',
          requestMethod: 'GET',
          requestType: 'application/json',
          responseStatus: 'out_response_status_',
          responseHeader: 'out_response_header_',
          responseBody: 'out_response_body_',
          headerList: [],
          xFormList: [],
          raw: '',
          useXForm: true,
          useRaw: false,
          usePage: false,
          pageCondition: '',
          startPageNo: 1,
          requestCode: 'UTF-8',
          responseCode: 'UTF-8',
          connectOutTime: 5000,
          readOutTime: 5000,
          retryNum: 0,
          retryTime: 10000,
          copiesCache: 1,
          distributeType: false
        }
      } else if (code === 'InsertOrUpdate') {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          dbId: '',
          dbConnection: '',
          tableId: null,
          tableName: '',
          commitSize: '1000',
          updateBypassed: false,
          selectField: [],
          updateField: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (code === 'DorisOutput') {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          tableId: null,
          tableName: '',
          truncateTable: false,
          fieldList: [],
          maxBatchRows: 500000,
          maxBytes: 90,
          scanningFrequency: 3000,
          connectTimeout: 10,
          retries: 3,
          timeout: 600,
          headerProperties: [
            { key: 'line_delimiter', value: '\\x02' },
            { key: 'column_separator', value: '\\x01' }
          ],
          upsertOrDelete: '',
          partialUpdate: '',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isExcelInputType(code)) {
        initialFormData = {
          ...initialFormData,
          fileList: [],
          sheetList: [],
          fieldList: [],
          fileSourceType: 'FTP_FILE',
          dataSourceId: '',
          ftpDataSourceId: '',
          dataSource: '',
          engine: '',
          password: '',
          readLine: 0,
          assCode: 'UTF-8',
          ignoreEmptyRows: true,
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isExcelOutputType(code)) {
        initialFormData = {
          ...initialFormData,
          outputPath: '',
          fileName: '',
          fileSourceType: 'FTP_FILE',
          extension: 'xls',
          ifFileExists: 'new',
          splitEvery: 0,
          streamingData: false,
          dateInFilename: false,
          dateTimeFormat: '',
          sheetname: 'Sheet1',
          startingCell: 'A1',
          appendLines: false,
          appendOmitHeader: false,
          fieldList: [],
          dataSourceId: '',
          ftpDataSourceId: '',
          dataSource: '',
          copiesCache: 1,
          distributeType: false
        }
      }

      return initialFormData // 直接返回扁平化的 formData
    },

    async loadComponentTree() {
      try {
        const res = await getTransComponentTree()
        if (!res?.data) {
          throw new Error('请求成功，但返回数据异常')
        }
        const { code, message, data } = res
        if (code === '999999') {
          this.$message.warning(message || '操作失败，请重试')
          return null
        }
        this.menuConfig = data
        return data
      } catch (error) {
        if (error.message.includes('timeout')) {
          this.$message.warning('网络请求超时...')
        } else {
          this.$message.error(error.message || '获取组件列表失败')
        }
      }
    },

    handleOperationResponse(res, successMessage) {
      if (res.code === '999999') {
        this.$message.warning(res.message)
      } else {
        this.$message.success(successMessage)
      }
    },

    toggleMenu(menuId) {
      this.$set(this.menuState, menuId, !this.menuState[menuId])
    },

    setEdgeMode(edge, mode) {
      const sourceCell = edge.getSourceCell()
      if (sourceCell) {
        const outgoingEdges = this.graph.getOutgoingEdges(sourceCell)
        if (outgoingEdges && outgoingEdges.length) {
          outgoingEdges.forEach(outgoingEdge => {
            outgoingEdge.setLabels([{
              position: 0.5,
              attrs: {
                text: {
                  text: mode,
                  fill: '#333',
                  fontSize: 12
                }
              }
            }])
            const data = outgoingEdge.getData() || {}
            outgoingEdge.setData({ ...data, mode })
          })
        }
      }
    },

    applyQuadraticEdge(edge) {
      if (!edge) return
      // 统一使用二次贝塞尔曲线（平滑且可读性高）
      edge.setConnector({ name: 'smooth', args: { type: 'quad' }})
      // 覆盖历史配置中的 manhattan 路由，避免出现折线效果
      edge.setRouter('normal')
    },

    getNodeDisplayName(node) {
      if (!node) return ''
      const data = node.getData ? (node.getData() || {}) : {}
      return String(node.attr('label/text') || data.name || '')
    },

    getConditionJudgeEdgeRole(edge) {
      if (!edge) return ''
      const sourceCell = edge.getSourceCell ? edge.getSourceCell() : null
      const targetCell = edge.getTargetCell ? edge.getTargetCell() : null
      if (!sourceCell || !targetCell) return ''

      const sourceData = sourceCell.getData ? (sourceCell.getData() || {}) : {}
      const sourceCode = sourceData.code || ''
      if (!this.isConditionJudgeType(sourceCode)) return ''

      const sourceCfg = sourceData.data || sourceData
      const matchName = String(sourceCfg.trueStepName || sourceCfg.matchStepName || '').trim()
      const unmatchName = String(sourceCfg.errorStepName || sourceCfg.unmatchStepName || '').trim()
      const targetName = this.getNodeDisplayName(targetCell).trim()
      if (!targetName) return ''
      if (matchName && targetName === matchName) return 'match'
      if (unmatchName && targetName === unmatchName) return 'unmatch'
      return ''
    },

    applyConditionEdgeBadge(edge, edgeRole = '') {
      if (!edge) return
      if (edgeRole === 'match') {
        edge.setLabels([{
          position: 0.18,
          attrs: {
            text: {
              text: '✓',
              fill: '#52c41a',
              fontSize: 14,
              fontWeight: 700
            }
          }
        }])
        return
      }
      if (edgeRole === 'unmatch') {
        edge.setLabels([{
          position: 0.18,
          attrs: {
            text: {
              text: '✕',
              fill: '#f56c6c',
              fontSize: 14,
              fontWeight: 700
            }
          }
        }])
        return
      }
      // 非条件判断或未配置匹配关系时，不展示标记
      edge.setLabels([])
    },

    showDistributionDialog(edge) {
      this.distributionDialog.currentEdge = edge
      this.distributionDialog.visible = true
    },

    selectDistributionMode(mode) {
      if (this.distributionDialog.currentEdge) {
        this.setEdgeMode(this.distributionDialog.currentEdge, mode)
      }
      this.distributionDialog.visible = false
      this.distributionDialog.currentEdge = null
    },

    // 保存流程配置，返回是否保存成功
    async saveFlow() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在，无法保存')
        return false
      }
      try {
        const flowData = this.graph.toJSON()
        const persistPayload = JSON.parse(JSON.stringify(flowData))
        this.applyInsertOrUpdatePersistNormalization(persistPayload)
        // 检查画布上是否有组件
        const hasComponents = persistPayload.cells && persistPayload.cells.length > 0
        const configData = {
          id: this.flowId,
          config: hasComponents ? JSON.stringify(persistPayload) : null
        }
        const res = await setConfig(configData)
        if (res.code === '000000') {
          // 与落库 payload 一致：更新画布节点上的插入/更新数据（去掉 dataSource 等）
          if (this.graph && persistPayload.cells) {
            const byId = new Map(persistPayload.cells.map((c) => [c.id, c]))
            this.graph.getNodes().forEach((node) => {
              const cell = byId.get(node.id)
              const next = cell && cell.data
              if (next && next.code === 'InsertOrUpdate') {
                node.replaceData(next)
              }
            })
          }
          this.$message.success('流程保存成功')
          this.hasChange = false
          return true
        } else {
          this.$message.error(res.message || '保存失败')
          return false
        }
      } catch (error) {
        console.error('保存流程失败:', error)
        this.$message.error('保存流程失败')
        return false
      }
    },

    async loadFlowConfig() {
      if (!this.flowId) return
      try {
        const res = await getFlowDetail(this.flowId)
        if (res.code === '000000' && res.data && res.data.config) {
          const flowData = JSON.parse(res.data.config)
          console.log('flowData', flowData)
          this.graph.clearCells()
          this.graph.fromJSON(flowData)
          this.graph.getEdges().forEach((edge) => this.applyQuadraticEdge(edge))
          this.resetRuntimeStyles()
          this.$message.success('流程加载成功')
          this.hasChange = false
        }
      } catch (error) {
        console.error('加载流程失败:', error)
      }
    },

    // 运行按钮点击：如有未保存改动，先保存再执行
    async handleRunClick() {
      if (this.isRunning) {
        return
      }
      if (this.hasChange) {
        const ok = await this.saveFlow()
        if (!ok) {
          // 保存失败则不继续运行
          return
        }
      }
      this.executeFlowHandler()
    },

    async executeFlowHandler() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在，无法运行')
        return
      }
      // 防止“停止中”状态残留
      this.isStopping = false
      // 启动前重置运行态样式
      this.resetRuntimeStyles()
      try {
        const res = await executeFlow(this.flowId)
        if (res.code === '000000') {
          this.$message.success('转换流程启动成功！')
          // 开始检查流程状态
          this.isRunning = true
          this.startStatusCheck()
          // 自动打开日志弹窗
          this.toggleLogDialog()
        } else {
          this.$message.error(res.message || '流程启动失败')
        }
      } catch (error) {
        console.error('执行流程失败:', error)
        this.$message.error('流程启动失败')
      }
    },

    // 开始检查流程状态
    startStatusCheck() {
      // 清除之前的定时器
      if (this.statusCheckTimer) {
        clearInterval(this.statusCheckTimer)
      }

      // 每3秒检查一次状态
      this.statusCheckTimer = setInterval(async() => {
        try {
          const res = await checkTransStatus(this.flowId)
          if (res.code === '000000') {
            // 只有当之前状态为true，现在变为false时，才显示执行完成的提示
            const wasRunning = this.isRunning
            this.isRunning = res.data
            this.applyRuntimeStyles(this.stepStatusMap)
            if (wasRunning && !res.data) {
              this.finalizeRuntimeStatusMap()
              // 流程执行结束，清除定时器
              clearInterval(this.statusCheckTimer)
              this.statusCheckTimer = null
              this.$message.success('流程执行完成！')
            }
          }
        } catch (error) {
          console.error('检查流程状态失败:', error)
        }
      }, 3000)
    },

    // 切换日志弹窗
    toggleLogDialog() {
      this.logVisible = !this.logVisible
      if (this.logVisible) {
        // 重置位置状态
        this.logDialogPosition = { top: null, left: null }
        this.$nextTick(() => {
          const dialog = this.$el.querySelector('.log-dialog')
          if (dialog) {
            const rect = dialog.getBoundingClientRect()
            // 初始化为当前居中的位置，防止第一次拖动时弹窗“跳动”
            this.logDialogPosition = {
              top: rect.top,
              left: rect.left
            }
          }
        })
        // 开始获取日志
        this.startLogUpdate()
      } else {
        // 停止获取日志
        this.stopLogUpdate()
      }
    },

    // 关闭日志弹窗
    closeLogDialog() {
      this.logVisible = false
      this.stopLogUpdate()
      this.logDragging = false
      this.logDialogPosition = { top: null, left: null }
    },

    // 开始更新日志
    startLogUpdate() {
      // 清除之前的定时器
      if (this.logTimer) {
        clearInterval(this.logTimer)
      }

      // 只有在流程运行中才获取日志
      if (this.isRunning) {
        // 立即获取一次日志
        this.getProcessLog()

        // 每2秒获取一次日志
        this.logTimer = setInterval(() => {
          // 再次检查流程状态，确保只有运行中才继续获取日志
          if (this.isRunning) {
            this.getProcessLog()
          } else {
            this.stopLogUpdate()
          }
        }, 2000)
      }
    },

    // 停止更新日志
    stopLogUpdate() {
      if (this.logTimer) {
        clearInterval(this.logTimer)
        this.logTimer = null
      }
    },

    // 获取流程日志
    async getProcessLog() {
      if (!this.flowId) return

      try {
        const res = await getProcessLog(this.flowId)
        if (res.code === '000000') {
          if (res.data && res.data.logList) {
            // 处理日志列表，提取每条记录并清理重复日期
            const list = res.data.logList.map(logItem => ({
              status: (logItem && logItem.status) || '',
              text: this.normalizeLogText(logItem && logItem.text)
            }))
            this.logItems = list
            this.updateStepRuntimeStatus(list)
            const logText = list.map(item => item.text).join('\n')
            this.logContent = logText || '暂无日志'

            // 检查日志中是否包含停止成功或流程结束的标志
            const stopKeywords = ['流程执行结束', '流程停止成功', '停止成功']
            const hasStopFlag = stopKeywords.some(keyword => logText.includes(keyword))

            // 如果流程已停止，停止日志定时器
            if (hasStopFlag) {
              this.stopLogUpdate()
            }
          } else {
            this.logItems = []
            this.logContent = res.data || '暂无日志'
          }
        }
      } catch (error) {
        console.error('获取日志失败:', error)
      }
    },
    normalizeLogText(text) {
      if (!text) return ''
      const parts = text.split(' ')
      let lastDateIndex = -1
      for (let i = parts.length - 2; i >= 0; i--) {
        if (parts[i].match(/^\d{4}-\d{2}-\d{2}$/) && parts[i + 1].match(/^\d{2}:\d{2}:\d{2}$/)) {
          lastDateIndex = i
          break
        }
      }
      if (lastDateIndex >= 0) {
        const lastDate = `${parts[lastDateIndex]} ${parts[lastDateIndex + 1]}`
        const content = parts.slice(lastDateIndex + 2).join(' ')
        return `${lastDate} ${content}`
      }
      return text
    },

    async stopFlowHandler() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在，无法停止')
        return
      }
      if (this.isStopping) return
      this.isStopping = true
      try {
        const res = await stopFlow(this.flowId)
        if (res.code === '000000') {
          this.$message.success('转换流程停止成功！')
          // 停止流程后更新状态
          this.isRunning = false
          this.finalizeRuntimeStatusMap()
          // 清除状态检查定时器
          if (this.statusCheckTimer) {
            clearInterval(this.statusCheckTimer)
            this.statusCheckTimer = null
          }
        } else {
          this.$message.error(res.message || '流程停止失败')
        }
      } catch (error) {
        console.error('停止流程失败:', error)
        this.$message.error('流程停止失败')
      } finally {
        this.isStopping = false
      }
    },

    centerCanvas() {
      try {
        const cells = this.graph.getCells()
        if (cells && cells.length > 0) {
          const bbox = this.graph.getCellsBBox()
          if (bbox) {
            const centerX = bbox.center().x
            const centerY = bbox.center().y
            const containerRect = this.$refs.graphContainer.getBoundingClientRect()
            const canvasCenterX = containerRect.width / 2
            const canvasCenterY = containerRect.height / 2
            const offsetX = canvasCenterX - centerX
            const offsetY = canvasCenterY - centerY
            this.graph.translate(offsetX, offsetY)
          }
        }
      } catch (error) {
        console.error('画布居中失败:', error)
      }
    },

    createNode(shape, nodeX, nodeY, nodeLabel, bodyX, bodyY, img, imgWidth, imgHeight, imgX, imgY) {
      return {
        shape: shape,
        x: nodeX,
        y: nodeY,
        width: 180,
        height: 40,
        label: nodeLabel,
        markup: this.createMarkup(),
        attrs: this.createNodeAttrs(bodyX, bodyY, img, imgWidth, imgHeight, imgX, imgY)
      }
    },

    createMarkup() {
      return [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'image', selector: 'img' },
        { tagName: 'text', selector: 'label' }
      ]
    },

    createNodeAttrs(bodyX, bodyY, img, imgWidth, imgHeight, imgX, imgY) {
      const attrs = {
        body: this.createBody(bodyX, bodyY),
        label: {
          fontSize: 13,
          fill: '#555',
          refX: 48,
          refY: '50%',
          textAnchor: 'start',
          textVerticalAnchor: 'middle',
          textWrap: {
            width: 118,
            ellipsis: true
          }
        }
      }
      if (img) {
        attrs.img = this.createImg(img, imgWidth, imgHeight, imgX, imgY)
      }
      return attrs
    },

    createBody(x, y) {
      return {
        stroke: '#d7dfeb',
        strokeWidth: 1.5,
        fill: '#fff',
        rx: x,
        ry: y,
        filter: {
          name: 'dropShadow',
          args: { dx: -1, dy: 2, blur: 4, color: 'rgba(0, 0, 0, 0.1)' }
        }
      }
    },

    createImg(img, width, height, x, y) {
      return {
        'xlink:href': img,
        width: width,
        height: height,
        x: x,
        y: y
      }
    },

    initGraph() {
      const container = this.$refs.graphContainer
      if (!container) return

      this.graph = new Graph({
        container: container,
        width: container.offsetWidth,
        height: container.offsetHeight,
        autoResize: true,
        grid: {
          visible: true,
          type: 'doubleMesh',
          args: [
            { color: '#eee', thickness: 1 },
            { color: '#ddd', thickness: 1, factor: 4 }
          ]
        },
        background: { color: '#fff' },
        panning: true,
        mousewheel: {
          enabled: true,
          modifiers: 'ctrl',
          minScale: 0.5,
          maxScale: 2
        },
        connecting: {
          // 不允许连到空白区域，防止出现“悬空”的无意义连线
          allowBlank: false,
          // 不允许同一条边自环
          allowLoop: false,
          // 不允许同一方向多条边重复连接
          allowMulti: false,
          // 只允许从节点连接到节点，禁止边接边等复杂情况
          allowEdge: false,
          snap: true,
          highlight: true,
          connectionPoint: 'anchor',
          createEdge: () => {
            const edgeStyle = this.getEdgeStyleByStatus()
            return this.graph.createEdge({
              attrs: {
                line: edgeStyle
              },
              connector: { name: 'smooth', args: { type: 'quad' }},
              router: { name: 'normal' },
              zIndex: -1
            })
          },
          validateConnection({ sourceMagnet, targetMagnet }) {
            return !!(sourceMagnet && targetMagnet)
          }
        },
        highlighting: {
          magnetAdsorbed: {
            name: 'stroke',
            args: { attrs: { fill: '#5F95FF', stroke: '#5F95FF' }}
          }
        }
      })

      container.addEventListener('dragover', this.onDragOver)
      container.addEventListener('drop', this.onDrop)
      container.addEventListener('contextmenu', (e) => e.preventDefault())

      this.graph.on('cell:contextmenu', ({ e, cell }) => {
        e.preventDefault()
        this.contextMenu = {
          visible: true,
          x: e.clientX,
          y: e.clientY,
          selectedCell: cell
        }
      })

      this.graph.on('node:dblclick', ({ node }) => {
        // 避免此前右键菜单残留的 selectedCell 抢走 Backspace/Delete，导致配置抽屉里输入框无法退格
        this.contextMenu.visible = false
        this.contextMenu.selectedCell = null

        const nodeData = node.getData() || {}
        const label = node.attr('label/text')
        const componentType = nodeData.code

        // 基础字段
        const baseForm = {
          name: nodeData.name || label || '',
          code: nodeData.code || '',
          description:
            (nodeData.data && nodeData.data.description) ||
            nodeData.description ||
            ''
        }

        const realFormData = this.resolveNodePluginFormData(nodeData)

        // 合并所有字段到 formDataToEdit
        const formDataToEdit = {
          ...baseForm,
          ...realFormData,
          // 确保 fieldList 始终是数组
          fieldList: Array.isArray(realFormData.fieldList) ? realFormData.fieldList : []
        }

        // 以下各个组件的特定字段不再需要单独提取，因为它们都已包含在 realFormData 中
        // 只需要确保初始值（如布尔值，数字）在 realFormData 中有正确默认值，这部分在 CleanTransformConfig.vue 里 initDefaults 做了
        // 表输入专用字段
        const tableInputFields = {
          dbId: realFormData.dbId || '',
          dataSourceId: realFormData.dataSourceId || '',
          dbConnection: realFormData.dbConnection || '',
          tableName: realFormData.tableName || '',
          commitSize: realFormData.commitSize || '',
          preSql: realFormData.preSql || '',
          postSql: realFormData.postSql || '',
          fieldList: realFormData.fieldList || [],
          updatePolicy: realFormData.updatePolicy || '',
          skipHeader: realFormData.skipHeader || false,
          ignoreError: realFormData.ignoreError || false,
          retryTimes: realFormData.retryTimes || '',
          retryInterval: realFormData.retryInterval || '',
          sql: realFormData.sql || '',
          replaceVariables: realFormData.replaceVariables || false,
          isIncrement: realFormData.isIncrement || false,
          incrementType: realFormData.incrementType || '',
          incrementField: realFormData.incrementField || '',
          incrementTargetDataSourceId: realFormData.incrementTargetDataSourceId || '',
          incrementTargetTableId: realFormData.incrementTargetTableId || '',
          incrementTargetTable: realFormData.incrementTargetTable || '',
          incrementTargetTableField: realFormData.incrementTargetTableField || '',
          rowLimit: realFormData.rowLimit || '',
          stepInsertVariable: realFormData.stepInsertVariable || '',
          implementEveryOne: realFormData.implementEveryOne || false,
          configMode: realFormData.configMode || 'custom'
        }

        // 表输出专用字段
        const tableOutputFields = {
          dbId: realFormData.dbId || '',
          dataSourceId: realFormData.dataSourceId || '',
          dbConnection: realFormData.dbConnection || '',
          tableId: realFormData.tableId || '',
          tableName: realFormData.tableName || '',
          targetTable: realFormData.targetTable || '',
          updateField: realFormData.updateField || '',
          outputPath: realFormData.outputPath || '',
          fileFormat: realFormData.fileFormat || '',
          commitSize: realFormData.commitSize || '',
          preSql: realFormData.preSql || '',
          postSql: realFormData.postSql || '',
          fieldList: realFormData.fieldList || [],
          updatePolicy: realFormData.updatePolicy || '',
          skipHeader: realFormData.skipHeader || false,
          ignoreError: realFormData.ignoreError || false,
          retryTimes: realFormData.retryTimes || '',
          retryInterval: realFormData.retryInterval || '',
          truncateTable: realFormData.truncateTable || false,
          specifyFields: realFormData.specifyFields || false,
          schemaName: realFormData.schemaName || '',
          ignoreErrors: realFormData.ignoreErrors || false,
          useBatchUpdate: realFormData.useBatchUpdate || false,
          partitioningType: realFormData.partitioningType || '',
          partitioningField: realFormData.partitioningField || '',
          partitioningTimeRadio: realFormData.partitioningTimeRadio || '',
          tableNameField: realFormData.tableNameField || '',
          tableNameInTable: realFormData.tableNameInTable || false,
          returningGeneratedKeys: realFormData.returningGeneratedKeys || false,
          generatedKeyField: realFormData.generatedKeyField || '',
          distributeType: realFormData.distributeType || false
        }

        const dorisOutputFields = {
          dataSourceId: realFormData.dataSourceId || '',
          tableId: realFormData.tableId || null,
          tableName: realFormData.tableName || '',
          truncateTable: realFormData.truncateTable || false,
          fieldList: Array.isArray(realFormData.fieldList) ? realFormData.fieldList : [],
          // 通用配置（与 DorisOutputConstructor 对齐）
          maxBatchRows: realFormData.maxBatchRows != null && realFormData.maxBatchRows !== '' ? Number(realFormData.maxBatchRows) : 500000,
          maxBytes: realFormData.maxBytes != null && realFormData.maxBytes !== '' ? Number(realFormData.maxBytes) : 90,
          scanningFrequency: realFormData.scanningFrequency != null && realFormData.scanningFrequency !== '' ? Number(realFormData.scanningFrequency) : 3000,
          connectTimeout: realFormData.connectTimeout != null && realFormData.connectTimeout !== '' ? Number(realFormData.connectTimeout) : 10,
          retries: realFormData.retries != null && realFormData.retries !== '' ? Number(realFormData.retries) : 3,
          timeout: realFormData.timeout != null && realFormData.timeout !== '' ? Number(realFormData.timeout) : 600,
          headerProperties: Array.isArray(realFormData.headerProperties) ? realFormData.headerProperties : [
            { key: 'line_delimiter', value: '\\x02' },
            { key: 'column_separator', value: '\\x01' }
          ],
          upsertOrDelete: realFormData.upsertOrDelete || '',
          partialUpdate: realFormData.partialUpdate || '',
          // 高级配置
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }

        const printLogLayer = this.flattenPrintLogStepData(realFormData)
        const printLogFields = {
          limitRows:
            printLogLayer.limitRows !== undefined
              ? printLogLayer.limitRows
              : printLogLayer.limitInputRows !== undefined
                ? printLogLayer.limitInputRows
                : true,
          limitRowsNumber: (() => {
            if (printLogLayer.limitRowsNumber != null && printLogLayer.limitRowsNumber !== '') {
              const n = Number(printLogLayer.limitRowsNumber)
              return Number.isFinite(n) ? n : 1000
            }
            if (printLogLayer.maxOutputLogRows != null && printLogLayer.maxOutputLogRows !== '') {
              const n = parseInt(String(printLogLayer.maxOutputLogRows), 10)
              if (Number.isFinite(n)) return n
            }
            return 1000
          })(),
          // 空数组表示用户已清空；不能再回退 logFieldList，否则删除后重开会“复活”
          fieldList: (() => {
            if (Array.isArray(printLogLayer.fieldList)) {
              return printLogLayer.fieldList
            }
            if (Array.isArray(printLogLayer.logFieldList)) {
              return printLogLayer.logFieldList
                .map(x => ({ name: x.fieldName || x.name }))
                .filter(x => x.name)
            }
            return []
          })()
        }

        const execSqlFields = {
          dataSourceId: realFormData.dataSourceId || '',
          sql: realFormData.sql || '',
          executeEachRow: !!realFormData.executeEachRow,
          bindVariable: !!realFormData.bindVariable,
          variableReplace: !!realFormData.variableReplace,
          // 注意：后端字段名为 filedList（拼写如此）
          filedList: Array.isArray(realFormData.filedList) ? realFormData.filedList : []
        }

        const conditionJudgeFields = {
          trueStepName: realFormData.trueStepName || realFormData.matchStepName || '',
          errorStepName: realFormData.errorStepName || realFormData.unmatchStepName || '',
          condition: realFormData.condition || realFormData.conditionExpression || 'true',
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          // 条件判断不支持复制/分发
          distributeType: false
        }

        const dataFilterFields = {
          filterType: realFormData.filterType != null ? String(realFormData.filterType) : '0',
          condition: (() => {
            const raw = realFormData.condition
            if (raw && typeof raw === 'object') return raw
            return { conditionGroups: [], condition: 'ALL' }
          })(),
          javaCode: realFormData.javaCode || '',
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }

        const processBranchFields = {
          conditionFiled: realFormData.conditionFiled || realFormData.conditionField || '',
          ProcessBranchSetup: Array.isArray(realFormData.ProcessBranchSetup)
            ? realFormData.ProcessBranchSetup.map((r) => ({
              caseValue: r && r.caseValue != null ? String(r.caseValue) : '',
              stepId: r && r.stepId != null ? String(r.stepId) : '',
              stepName: r && r.stepName != null ? String(r.stepName) : ''
            }))
            : [],
          defaultTargetStep: realFormData.defaultTargetStep != null ? String(realFormData.defaultTargetStep) : '',
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: realFormData.distributeType !== undefined ? !!realFormData.distributeType : true
        }

        const normalizeDenormalizedRow = (r) => {
          if (!r || typeof r !== 'object') {
            return { targetName: '', keyValue: '', fieldName: '' }
          }
          const tn = r.targetName != null && String(r.targetName).trim() !== ''
            ? String(r.targetName).trim()
            : String(r.targetFieldName || '').trim()
          return {
            targetName: tn,
            keyValue: r.keyValue != null ? String(r.keyValue) : '',
            fieldName: r.fieldName != null ? String(r.fieldName) : ''
          }
        }
        const denormalizedFields = {
          groupField: realFormData.groupField != null ? String(realFormData.groupField) : '',
          keyField: realFormData.keyField != null ? String(realFormData.keyField) : '',
          denormaliserTargetField: Array.isArray(realFormData.denormaliserTargetField)
            ? realFormData.denormaliserTargetField.map(normalizeDenormalizedRow)
            : [],
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }

        const normalizeNormaliserMappingRow = (r) => {
          if (!r || typeof r !== 'object') return { name: '', value: '' }
          return {
            name: r.name != null ? String(r.name).trim() : '',
            value: r.value != null ? String(r.value).trim() : ''
          }
        }
        const rowNormaliserFormSlice = {
          keyField: realFormData.keyField != null ? String(realFormData.keyField) : '',
          valueField: realFormData.valueField != null ? String(realFormData.valueField) : '',
          normaliserFields: Array.isArray(realFormData.normaliserFields)
            ? realFormData.normaliserFields.map(normalizeNormaliserMappingRow)
            : [],
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }
        const normalizeFieldSelectRow = (r) => {
          if (!r || typeof r !== 'object') {
            return { name: '', rename: '', length: -1, precision: -1 }
          }
          const name =
            r.name != null && String(r.name).trim() !== ''
              ? String(r.name).trim()
              : String(r.fieldName || r.fieldStream || '').trim()
          const rename = r.rename != null ? String(r.rename).trim() : ''
          const lenRaw = r.length
          const precRaw = r.precision
          const length =
            lenRaw === undefined || lenRaw === null || lenRaw === ''
              ? -1
              : Math.trunc(Number(lenRaw)) || -1
          const precision =
            precRaw === undefined || precRaw === null || precRaw === ''
              ? -1
              : Math.trunc(Number(precRaw)) || -1
          return { name, rename, length, precision }
        }
        const fieldSelectFormSlice = {
          fieldList: Array.isArray(realFormData.fieldList)
            ? realFormData.fieldList.map(normalizeFieldSelectRow).filter((x) => x.name)
            : [],
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }
        const sortRowsYn = (v, def) => {
          if (v === true || v === 'true' || v === 1 || v === '1' || v === 'Y' || v === 'y') return 'Y'
          if (v === false || v === 'false' || v === 0 || v === '0' || v === 'N' || v === 'n') return 'N'
          return def
        }
        const normalizeSortRowsFieldRow = (r) => {
          if (!r || typeof r !== 'object') return { name: '', ascending: 'Y', caseSensitive: 'N' }
          return {
            name: r.name != null ? String(r.name).trim() : '',
            ascending: sortRowsYn(r.ascending, 'Y'),
            caseSensitive: sortRowsYn(r.caseSensitive, 'N')
          }
        }
        const sortRowsFormSlice = {
          sortSize:
            realFormData.sortSize != null && String(realFormData.sortSize).trim() !== ''
              ? String(realFormData.sortSize).trim()
              : '1000',
          fieldList: Array.isArray(realFormData.fieldList)
            ? realFormData.fieldList.map(normalizeSortRowsFieldRow).filter((x) => x.name)
            : [],
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }
        const splitFieldToRowsFormSlice = {
          splitField: realFormData.splitField != null ? String(realFormData.splitField).trim() : '',
          delimiter:
            realFormData.delimiter != null && String(realFormData.delimiter) !== ''
              ? String(realFormData.delimiter)
              : ',',
          newFieldname: realFormData.newFieldname != null ? String(realFormData.newFieldname).trim() : '',
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }
        const normalizeFieldSplitterRow = (r) => {
          if (!r || typeof r !== 'object') {
            return { fieldName: '', fieldType: 2, fieldTrimType: 0 }
          }
          const ft = Math.trunc(Number(r.fieldType))
          const tr = Math.trunc(Number(r.fieldTrimType))
          return {
            fieldName: r.fieldName != null ? String(r.fieldName).trim() : '',
            fieldType: Number.isFinite(ft) ? ft : 2,
            fieldTrimType: Number.isFinite(tr) ? tr : 0
          }
        }
        const fieldSplitterFormSlice = {
          splitField: realFormData.splitField != null ? String(realFormData.splitField).trim() : '',
          delimiter:
            realFormData.delimiter != null && String(realFormData.delimiter) !== ''
              ? String(realFormData.delimiter)
              : ',',
          fieldList: Array.isArray(realFormData.fieldList)
            ? realFormData.fieldList.map(normalizeFieldSplitterRow).filter((x) => x.fieldName)
            : [],
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }
        const normalizeFormulaFieldRow = (r) => {
          if (!r || typeof r !== 'object') {
            return { fieldName: '', formula: '', valueType: 0, valueLength: 0, valuePrecision: 0 }
          }
          const vt = Math.trunc(Number(r.valueType))
          const vl = Math.trunc(Number(r.valueLength))
          const vp = Math.trunc(Number(r.valuePrecision))
          return {
            fieldName: r.fieldName != null ? String(r.fieldName).trim() : '',
            formula: r.formula != null ? String(r.formula) : '',
            valueType: Number.isFinite(vt) ? vt : 0,
            valueLength: Number.isFinite(vl) && vl >= 0 ? vl : 0,
            valuePrecision: Number.isFinite(vp) && vp >= 0 ? vp : 0
          }
        }
        const formulaFormSlice = {
          fieldList: Array.isArray(realFormData.fieldList)
            ? realFormData.fieldList.map(normalizeFormulaFieldRow)
            : [],
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }
        const normalizeGroupByFieldList = (raw) => {
          if (raw == null) return []
          if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean)
          if (typeof raw === 'string') {
            const t = raw.trim()
            if (!t) return []
            try {
              const p = JSON.parse(t)
              if (Array.isArray(p)) return p.map((x) => String(x).trim()).filter(Boolean)
            } catch (e) {
              /* 单字段 */
            }
            return [t]
          }
          return []
        }
        const normalizeGroupByAggRow = (r) => {
          if (!r || typeof r !== 'object') {
            return { aggregateField: '', subjectField: '', aggregateType: NaN, valueField: '' }
          }
          const at = Math.trunc(Number(r.aggregateType))
          return {
            aggregateField: r.aggregateField != null ? String(r.aggregateField).trim() : '',
            subjectField: r.subjectField != null ? String(r.subjectField).trim() : '',
            aggregateType: Number.isFinite(at) ? at : NaN,
            valueField: r.valueField != null ? String(r.valueField) : ''
          }
        }
        const groupByFormSlice = {
          groupField: normalizeGroupByFieldList(realFormData.groupField),
          fieldList: Array.isArray(realFormData.fieldList)
            ? realFormData.fieldList
              .map(normalizeGroupByAggRow)
              .filter((x) => x.subjectField && x.aggregateField && Number.isFinite(x.aggregateType))
            : [],
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }
        const recordsFromStreamFields = {
          fieldList: Array.isArray(realFormData.fieldList) ? realFormData.fieldList : [],
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }
        const systemDateFields = {
          fieldList: Array.isArray(realFormData.fieldList) ? realFormData.fieldList : [],
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1,
          distributeType: !!realFormData.distributeType
        }

        const redisInputFields = {
          dataSourceId: realFormData.dataSourceId != null && realFormData.dataSourceId !== ''
            ? String(realFormData.dataSourceId)
            : '',
          key: realFormData.key != null ? String(realFormData.key) : '',
          fieldDelimiter: realFormData.fieldDelimiter != null ? String(realFormData.fieldDelimiter) : '',
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== ''
            ? Math.max(1, Math.trunc(Number(realFormData.copiesCache)) || 1)
            : 1,
          distributeType: !!realFormData.distributeType
        }

        const redisOutputFields = {
          dataSourceId: realFormData.dataSourceId != null && realFormData.dataSourceId !== ''
            ? String(realFormData.dataSourceId)
            : '',
          dbName: realFormData.dbName != null ? String(realFormData.dbName) : '',
          key: realFormData.key != null ? String(realFormData.key) : '',
          value: realFormData.value != null ? String(realFormData.value) : '',
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== ''
            ? Math.max(1, Math.trunc(Number(realFormData.copiesCache)) || 1)
            : 1,
          distributeType: !!realFormData.distributeType
        }

        const kafkaProducerOutputFields = {
          dataSourceId: (() => {
            if (realFormData.dataSourceId != null && realFormData.dataSourceId !== '') {
              return String(realFormData.dataSourceId)
            }
            if (realFormData.dataSource != null && realFormData.dataSource !== '') {
              return String(realFormData.dataSource)
            }
            return ''
          })(),
          topic: realFormData.topic != null ? String(realFormData.topic).trim() : '',
          clientId: realFormData.clientId != null ? String(realFormData.clientId) : '',
          keyField: realFormData.keyField != null ? String(realFormData.keyField) : '',
          messageField: realFormData.messageField != null ? String(realFormData.messageField) : '',
          properties: (() => {
            const p = realFormData.properties
            if (p == null) return '[]'
            if (typeof p === 'string') return p
            if (Array.isArray(p)) return JSON.stringify(p)
            return '[]'
          })(),
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== ''
            ? Math.max(1, Math.trunc(Number(realFormData.copiesCache)) || 1)
            : 1,
          distributeType: !!realFormData.distributeType
        }

        const parseMqBool = (v, defaultVal) => {
          if (v === undefined || v === null || v === '') return defaultVal
          if (typeof v === 'boolean') return v
          if (typeof v === 'string') {
            const t = v.trim().toLowerCase()
            if (t === 'true') return true
            if (t === 'false') return false
          }
          return Boolean(v)
        }

        const rabbitMqProducerOutputFields = {
          dataSourceId: (() => {
            if (realFormData.dataSourceId != null && realFormData.dataSourceId !== '') {
              return String(realFormData.dataSourceId)
            }
            if (realFormData.dataSource != null && realFormData.dataSource !== '') {
              return String(realFormData.dataSource)
            }
            return ''
          })(),
          virtualHost:
            realFormData.virtualHost != null && String(realFormData.virtualHost).trim() !== ''
              ? String(realFormData.virtualHost).trim()
              : '/',
          exchange: realFormData.exchange != null ? String(realFormData.exchange).trim() : '',
          routingKey: realFormData.routingKey != null ? String(realFormData.routingKey).trim() : '',
          queue: realFormData.queue != null ? String(realFormData.queue).trim() : '',
          topics: (() => {
            const t = realFormData.topics
            if (t == null) return []
            if (Array.isArray(t)) return t.map((x) => String(x)).filter(Boolean)
            if (typeof t === 'string') {
              try {
                const parsed = JSON.parse(t)
                return Array.isArray(parsed) ? parsed.map((x) => String(x)).filter(Boolean) : []
              } catch (e) {
                return []
              }
            }
            return []
          })(),
          messageField: realFormData.messageField != null ? String(realFormData.messageField).trim() : '',
          routingKeyField: realFormData.routingKeyField != null ? String(realFormData.routingKeyField).trim() : '',
          publisherConfirmType: (() => {
            const p = realFormData.publisherConfirmType != null ? String(realFormData.publisherConfirmType).trim().toLowerCase() : ''
            if (p === 'simple' || p === 'none' || p === 'correlated') return p
            return 'correlated'
          })(),
          publisherReturns: parseMqBool(realFormData.publisherReturns, true),
          templateMandatory: (() => {
            if (realFormData.templateMandatory !== undefined && realFormData.templateMandatory !== null && realFormData.templateMandatory !== '') {
              return parseMqBool(realFormData.templateMandatory, true)
            }
            return parseMqBool(realFormData.mandatory, true)
          })(),
          properties: (() => {
            const p = realFormData.properties
            if (p == null) return '[]'
            if (typeof p === 'string') return p
            if (Array.isArray(p)) return JSON.stringify(p)
            return '[]'
          })(),
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== ''
            ? Math.max(1, Math.trunc(Number(realFormData.copiesCache)) || 1)
            : 1,
          distributeType: !!realFormData.distributeType
        }

        const rabbitMqConsumerInputFields = {
          dataSourceId: (() => {
            if (realFormData.dataSourceId != null && realFormData.dataSourceId !== '') {
              return String(realFormData.dataSourceId)
            }
            if (realFormData.dataSource != null && realFormData.dataSource !== '') {
              return String(realFormData.dataSource)
            }
            return ''
          })(),
          virtualHost:
            realFormData.virtualHost != null && String(realFormData.virtualHost).trim() !== ''
              ? String(realFormData.virtualHost).trim()
              : '/',
          queue: realFormData.queue != null ? String(realFormData.queue).trim() : '',
          topics: (() => {
            const t = realFormData.topics
            if (t == null) return []
            if (Array.isArray(t)) return t.map((x) => String(x)).filter(Boolean)
            if (typeof t === 'string') {
              try {
                const parsed = JSON.parse(t)
                return Array.isArray(parsed) ? parsed.map((x) => String(x)).filter(Boolean) : []
              } catch (e) {
                return []
              }
            }
            return []
          })(),
          listenerAcknowledgeMode: (() => {
            const a = realFormData.listenerAcknowledgeMode != null ? String(realFormData.listenerAcknowledgeMode).trim().toLowerCase() : ''
            if (a === 'auto') return 'auto'
            if (!a || a === 'manual' || a.includes('manual')) return 'manual'
            return 'auto'
          })(),
          listenerPrefetch: realFormData.listenerPrefetch != null && realFormData.listenerPrefetch !== ''
            ? Math.max(1, Math.trunc(Number(realFormData.listenerPrefetch)) || 1)
            : 1,
          listenerConcurrency: realFormData.listenerConcurrency != null && realFormData.listenerConcurrency !== ''
            ? Math.max(1, Math.trunc(Number(realFormData.listenerConcurrency)) || 1)
            : 1,
          listenerMaxConcurrency: realFormData.listenerMaxConcurrency != null && realFormData.listenerMaxConcurrency !== ''
            ? Math.max(1, Math.trunc(Number(realFormData.listenerMaxConcurrency)) || 1)
            : 1,
          listenerDefaultRequeueRejected: parseMqBool(realFormData.listenerDefaultRequeueRejected, true),
          listenerRetryEnabled: parseMqBool(realFormData.listenerRetryEnabled, true),
          listenerRetryInitialInterval: realFormData.listenerRetryInitialInterval != null && realFormData.listenerRetryInitialInterval !== ''
            ? Math.max(1, Math.trunc(Number(realFormData.listenerRetryInitialInterval)) || 1000)
            : 1000,
          listenerRetryMaxAttempts: realFormData.listenerRetryMaxAttempts != null && realFormData.listenerRetryMaxAttempts !== ''
            ? Math.max(1, Math.trunc(Number(realFormData.listenerRetryMaxAttempts)) || 3)
            : 3,
          listenerRetryMaxInterval: realFormData.listenerRetryMaxInterval != null && realFormData.listenerRetryMaxInterval !== ''
            ? Math.max(1, Math.trunc(Number(realFormData.listenerRetryMaxInterval)) || 10000)
            : 10000,
          listenerRetryMultiplier: (() => {
            const m = Number(realFormData.listenerRetryMultiplier)
            return Number.isFinite(m) && m > 0 ? m : 1.0
          })(),
          maxMessages: realFormData.maxMessages != null && realFormData.maxMessages !== ''
            ? Math.max(0, Math.trunc(Number(realFormData.maxMessages)) || 0)
            : 0,
          fieldList: (() => {
            const defaults = [
              { rabbitName: 'message', outputName: 'message', outputType: 'String' },
              { rabbitName: 'routingKey', outputName: 'routingKey', outputType: 'String' },
              { rabbitName: 'messageId', outputName: 'messageId', outputType: 'String' },
              { rabbitName: 'deliveryTag', outputName: 'deliveryTag', outputType: 'Long' },
              { rabbitName: 'exchange', outputName: 'exchange', outputType: 'String' },
              { rabbitName: 'timestamp', outputName: 'timestamp', outputType: 'Long' }
            ]
            const list = Array.isArray(realFormData.fieldList) ? realFormData.fieldList : []
            const map = new Map(list.map((x) => [String(x && x.rabbitName != null ? x.rabbitName : ''), x]))
            return defaults.map((d) => {
              const hit = map.get(String(d.rabbitName))
              return {
                rabbitName: d.rabbitName,
                outputName: hit && hit.outputName != null ? String(hit.outputName).trim() : d.outputName,
                outputType: hit && hit.outputType != null ? String(hit.outputType).trim() : d.outputType
              }
            })
          })(),
          properties: (() => {
            const p = realFormData.properties
            if (p == null) return '[]'
            if (typeof p === 'string') return p
            if (Array.isArray(p)) return JSON.stringify(p)
            return '[]'
          })(),
          copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== ''
            ? Math.max(1, Math.trunc(Number(realFormData.copiesCache)) || 1)
            : 1,
          distributeType: !!realFormData.distributeType
        }

        // FTP：保存态多为 dataSourceId / ftpDirectory / removeFile…，打开弹窗时需映射回 UI 字段；布尔可能为后端字符串 "true"/"false"
        const parseFtpBool = (v, defaultVal) => {
          if (v === undefined || v === null || v === '') return defaultVal
          if (typeof v === 'boolean') return v
          if (typeof v === 'string') {
            const t = v.trim().toLowerCase()
            if (t === 'true') return true
            if (t === 'false') return false
          }
          return Boolean(v)
        }
        const ftpResolvedDataSource = (() => {
          if (realFormData.dataSource != null && realFormData.dataSource !== '') return realFormData.dataSource
          if (realFormData.dataSourceId != null && realFormData.dataSourceId !== '') return realFormData.dataSourceId
          return ''
        })()
        const ftpResolvedRemoteDir = realFormData.remoteDirectory || realFormData.ftpDirectory || ''

        const ftpUploadFields = {
          localDirectory: realFormData.localDirectory || '',
          wildCard: realFormData.wildCard || '',
          dataSource: ftpResolvedDataSource,
          remoteDirectory: ftpResolvedRemoteDir,
          outFiledList: Array.isArray(realFormData.outFiledList) ? realFormData.outFiledList : [
            { name: '源文件目录', fieldName: 'upload_src_dir' },
            { name: '目标文件目录', fieldName: 'upload_target_dir' },
            { name: '文件名', fieldName: 'upload_file_name' },
            { name: '文件类型', fieldName: 'upload_file_type' }
          ],
          binaryMode: parseFtpBool(realFormData.binaryMode, true),
          removeLocalFile: parseFtpBool(realFormData.removeLocalFile, true),
          overwriteFile: parseFtpBool(realFormData.overwriteFile, true),
          timeOut: realFormData.timeOut != null && realFormData.timeOut !== '' ? Number(realFormData.timeOut) : 60000,
          distributeType: false,
          copiesCache: 1
        }

        const ftpDownloadFields = {
          localDirectory: realFormData.localDirectory || '',
          wildCard: realFormData.wildCard || '',
          dataSource: ftpResolvedDataSource,
          remoteDirectory: ftpResolvedRemoteDir,
          outFiledList: Array.isArray(realFormData.outFiledList) ? realFormData.outFiledList : [
            { name: '源文件目录', fieldName: 'download_src_dir' },
            { name: '目标文件目录', fieldName: 'download_target_dir' },
            { name: '文件名', fieldName: 'download_file_name' },
            { name: '文件类型', fieldName: 'download_file_type' },
            { name: '文件大小', fieldName: 'download_file_size' }
          ],
          binaryMode: parseFtpBool(realFormData.binaryMode, true),
          timeOut: realFormData.timeOut != null && realFormData.timeOut !== '' ? Number(realFormData.timeOut) : 60000,
          removeAfterDownload: realFormData.removeAfterDownload !== undefined
            ? parseFtpBool(realFormData.removeAfterDownload, true)
            : parseFtpBool(realFormData.removeFile, true),
          moveAfterDownload: realFormData.moveAfterDownload !== undefined
            ? parseFtpBool(realFormData.moveAfterDownload, false)
            : parseFtpBool(realFormData.moveFile, false),
          moveToFolder: realFormData.moveToFolder || realFormData.moveToDirectory || '',
          createMoveFolderIfNotExist: realFormData.createMoveFolderIfNotExist !== undefined
            ? parseFtpBool(realFormData.createMoveFolderIfNotExist, false)
            : parseFtpBool(realFormData.createNewFolder, false),
          fileNameContainsDate: realFormData.fileNameContainsDate !== undefined
            ? parseFtpBool(realFormData.fileNameContainsDate, false)
            : parseFtpBool(realFormData.dateInFilename, false),
          dateTimeFormat: realFormData.dateTimeFormat || '',
          distributeType: false,
          copiesCache: 1
        }

        const ossResolvedBucket =
          realFormData.bucketName ||
          realFormData.remoteDirectory ||
          realFormData.ftpDirectory ||
          ''

        const aliYunOssUploadFields = {
          localDirectory: realFormData.localDirectory || '',
          wildCard: realFormData.wildCard || '',
          dataSource: ftpResolvedDataSource,
          bucketName: ossResolvedBucket,
          outFiledList: Array.isArray(realFormData.outFiledList) ? realFormData.outFiledList : [
            { name: '源文件目录', fieldName: 'upload_src_dir' },
            { name: '目标文件目录', fieldName: 'upload_target_dir' },
            { name: '文件名', fieldName: 'upload_file_name' },
            { name: '文件类型', fieldName: 'upload_file_type' }
          ],
          binaryMode: parseFtpBool(realFormData.binaryMode, true),
          removeLocalFile: parseFtpBool(realFormData.removeLocalFile, true),
          overwriteFile: parseFtpBool(realFormData.overwriteFile, true),
          timeOut: realFormData.timeOut != null && realFormData.timeOut !== '' ? Number(realFormData.timeOut) : 60000,
          distributeType: false,
          copiesCache: 1
        }

        const aliYunOssDownloadFields = {
          localDirectory: realFormData.localDirectory || '',
          wildCard: realFormData.wildCard || '',
          dataSource: ftpResolvedDataSource,
          bucketName: ossResolvedBucket,
          outFiledList: Array.isArray(realFormData.outFiledList) ? realFormData.outFiledList : [
            { name: '源文件目录', fieldName: 'download_src_dir' },
            { name: '目标文件目录', fieldName: 'download_target_dir' },
            { name: '文件名', fieldName: 'download_file_name' },
            { name: '文件类型', fieldName: 'download_file_type' },
            { name: '文件大小', fieldName: 'download_file_size' }
          ],
          binaryMode: parseFtpBool(realFormData.binaryMode, true),
          timeOut: realFormData.timeOut != null && realFormData.timeOut !== '' ? Number(realFormData.timeOut) : 60000,
          removeAfterDownload: realFormData.removeAfterDownload !== undefined
            ? parseFtpBool(realFormData.removeAfterDownload, true)
            : parseFtpBool(realFormData.removeFile, true),
          moveAfterDownload: realFormData.moveAfterDownload !== undefined
            ? parseFtpBool(realFormData.moveAfterDownload, false)
            : parseFtpBool(realFormData.moveFile, false),
          moveToFolder: realFormData.moveToFolder || realFormData.moveToDirectory || '',
          createMoveFolderIfNotExist: realFormData.createMoveFolderIfNotExist !== undefined
            ? parseFtpBool(realFormData.createMoveFolderIfNotExist, false)
            : parseFtpBool(realFormData.createNewFolder, false),
          fileNameContainsDate: realFormData.fileNameContainsDate !== undefined
            ? parseFtpBool(realFormData.fileNameContainsDate, false)
            : parseFtpBool(realFormData.dateInFilename, false),
          dateTimeFormat: realFormData.dateTimeFormat || '',
          distributeType: false,
          copiesCache: 1
        }

        // 根据组件类型构建表单数据
        let formData
        if (componentType === 'TableInput') {
          formData = { ...formDataToEdit, ...tableInputFields }
        } else if (componentType === 'TableOutput') {
          formData = { ...formDataToEdit, ...tableOutputFields }
        } else if (componentType === 'InsertOrUpdate') {
          const dsRaw =
            realFormData.dataSourceId != null && realFormData.dataSourceId !== ''
              ? realFormData.dataSourceId
              : realFormData.dataSource
          const dsStr = dsRaw != null && dsRaw !== '' ? String(dsRaw) : ''
          const updateBypassedVal = realFormData.updateBypassed
          const updateBypassed =
            updateBypassedVal === true ||
            updateBypassedVal === 'true' ||
            updateBypassedVal === 1 ||
            updateBypassedVal === '1'
          formData = {
            ...formDataToEdit,
            dataSourceId: dsStr,
            dbId: dsStr,
            dbConnection: dsStr,
            tableId: realFormData.tableId != null ? realFormData.tableId : null,
            tableName: realFormData.tableName || '',
            commitSize:
              realFormData.commitSize != null && realFormData.commitSize !== ''
                ? String(realFormData.commitSize)
                : '1000',
            updateBypassed,
            selectField: Array.isArray(realFormData.selectField) ? realFormData.selectField : [],
            updateField: Array.isArray(realFormData.updateField) ? realFormData.updateField : [],
            distributeType: !!realFormData.distributeType,
            copiesCache:
              realFormData.copiesCache != null && realFormData.copiesCache !== ''
                ? Number(realFormData.copiesCache)
                : 1
          }
          delete formData.dataSource
        } else if (componentType === 'DorisOutput') {
          formData = { ...formDataToEdit, ...dorisOutputFields }
        } else if (this.isCleanTransformType(componentType)) {
          formData = { ...formDataToEdit } // CleanTransformFields 已经包含在 realFormData 中，直接使用 formDataToEdit
        } else if (this.isPrintLogType(componentType)) {
          formData = { ...formDataToEdit, ...printLogFields }
          delete formData.logFieldList
        } else if (this.isExecSqlType(componentType)) {
          formData = { ...formDataToEdit, ...execSqlFields }
          if (formData.distributeType === undefined) formData.distributeType = false
          if (formData.copiesCache === undefined || formData.copiesCache === '') formData.copiesCache = 1
        } else if (this.isConditionJudgeType(componentType)) {
          formData = { ...formDataToEdit, ...conditionJudgeFields }
        } else if (this.isDataFilterType(componentType)) {
          formData = { ...formDataToEdit, ...dataFilterFields }
        } else if (this.isProcessBranchType(componentType)) {
          formData = { ...formDataToEdit, ...processBranchFields }
        } else if (this.isDenormalizedType(componentType)) {
          formData = { ...formDataToEdit, ...denormalizedFields }
        } else if (this.isNormaliserType(componentType)) {
          formData = { ...formDataToEdit, ...rowNormaliserFormSlice }
        } else if (this.isFieldSelectType(componentType)) {
          formData = { ...formDataToEdit, ...fieldSelectFormSlice }
        } else if (this.isSortRowsType(componentType)) {
          formData = { ...formDataToEdit, ...sortRowsFormSlice }
        } else if (this.isSplitFieldToRowsType(componentType)) {
          formData = { ...formDataToEdit, ...splitFieldToRowsFormSlice }
        } else if (this.isFieldSplitterType(componentType)) {
          formData = { ...formDataToEdit, ...fieldSplitterFormSlice }
        } else if (this.isFormulaType(componentType)) {
          formData = { ...formDataToEdit, ...formulaFormSlice }
        } else if (this.isGroupByType(componentType)) {
          formData = { ...formDataToEdit, ...groupByFormSlice }
        } else if (this.isFtpUploadType(componentType)) {
          formData = { ...formDataToEdit, ...ftpUploadFields }
        } else if (this.isAliYunOssUploadType(componentType)) {
          formData = { ...formDataToEdit, ...aliYunOssUploadFields }
        } else if (this.isFtpDownloadType(componentType)) {
          formData = { ...formDataToEdit, ...ftpDownloadFields }
        } else if (this.isAliYunOssDownloadType(componentType)) {
          formData = { ...formDataToEdit, ...aliYunOssDownloadFields }
        } else if (this.isRowGeneratorType(componentType)) {
          formData = {
            ...formDataToEdit,
            recordGenerationType: Number(realFormData.recordGenerationType) || 1,
            rowLimit: realFormData.rowLimit != null ? String(realFormData.rowLimit) : '10',
            timeInterval: realFormData.timeInterval != null ? String(realFormData.timeInterval) : '100',
            timeFieldName: realFormData.timeFieldName || '',
            lastTimeFieldName: realFormData.lastTimeFieldName || '',
            fieldList: Array.isArray(realFormData.fieldList) ? realFormData.fieldList : [],
            distributeType: !!realFormData.distributeType,
            copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1
          }
        } else if (this.isRecordsFromStreamType(componentType)) {
          formData = { ...formDataToEdit, ...recordsFromStreamFields }
        } else if (this.isSystemDateType(componentType)) {
          formData = { ...formDataToEdit, ...systemDateFields }
        } else if (this.isRedisInputType(componentType)) {
          formData = { ...formDataToEdit, ...redisInputFields }
        } else if (this.isRedisOutputType(componentType)) {
          formData = { ...formDataToEdit, ...redisOutputFields }
        } else if (this.isKafkaProducerOutputType(componentType)) {
          formData = { ...formDataToEdit, ...kafkaProducerOutputFields }
        } else if (this.isRabbitMqProducerOutputType(componentType)) {
          formData = { ...formDataToEdit, ...rabbitMqProducerOutputFields }
        } else if (this.isRabbitMqConsumerInputType(componentType)) {
          formData = { ...formDataToEdit, ...rabbitMqConsumerInputFields }
        } else if (this.isExcelInputType(componentType)) {
          const excelDataSourceId = (() => {
            if (realFormData.dataSourceId != null && realFormData.dataSourceId !== '') {
              return realFormData.dataSourceId
            }
            if (realFormData.ftpDataSourceId != null && realFormData.ftpDataSourceId !== '') {
              return realFormData.ftpDataSourceId
            }
            if (realFormData.dataSource != null && realFormData.dataSource !== '') {
              return realFormData.dataSource
            }
            return ''
          })()
          formData = {
            ...formDataToEdit,
            fileList: Array.isArray(realFormData.fileList) ? realFormData.fileList : [],
            sheetList: Array.isArray(realFormData.sheetList) ? realFormData.sheetList : [],
            fieldList: Array.isArray(realFormData.fieldList) ? realFormData.fieldList : [],
            fileSourceType: 'FTP_FILE',
            dataSourceId: excelDataSourceId,
            ftpDataSourceId: realFormData.ftpDataSourceId != null && realFormData.ftpDataSourceId !== ''
              ? realFormData.ftpDataSourceId
              : excelDataSourceId,
            dataSource: realFormData.dataSource != null && realFormData.dataSource !== ''
              ? realFormData.dataSource
              : excelDataSourceId,
            engine: realFormData.engine || '',
            password: realFormData.password != null ? realFormData.password : '',
            readLine: realFormData.readLine != null && realFormData.readLine !== '' ? Number(realFormData.readLine) : 0,
            assCode: realFormData.assCode != null ? String(realFormData.assCode) : '',
            ignoreEmptyRows: realFormData.ignoreEmptyRows !== false,
            distributeType: !!realFormData.distributeType,
            copiesCache: realFormData.copiesCache != null && realFormData.copiesCache !== '' ? Number(realFormData.copiesCache) : 1
          }
        } else if (
          this.isApiInputType(componentType) ||
          this.isApiOutputType(componentType) ||
          this.isApiAttachmentDownloadType(componentType)
        ) {
          const normApiParam = (r) => {
            if (!r || typeof r !== 'object') return { key: '', value: '', description: '' }
            const key =
              r.key != null && String(r.key) !== ''
                ? String(r.key)
                : String(r.name || r.paramKey || '')
            return {
              key,
              value: r.value != null ? String(r.value) : '',
              description:
                r.description != null
                  ? String(r.description)
                  : r.remark != null
                    ? String(r.remark)
                    : r.desc != null
                      ? String(r.desc)
                      : ''
            }
          }
          const normApiHeaderParam = (r) => {
            if (!r || typeof r !== 'object') return { name: '', value: '', description: '' }
            const name =
              r.name != null && String(r.name) !== ''
                ? String(r.name)
                : r.key != null && String(r.key) !== ''
                  ? String(r.key)
                  : String(r.paramKey || '')
            return {
              name,
              value: r.value != null ? String(r.value) : '',
              description:
                r.description != null
                  ? String(r.description)
                  : r.remark != null
                    ? String(r.remark)
                    : r.desc != null
                      ? String(r.desc)
                      : ''
            }
          }
          const apiIn = this.isApiInputType(componentType)
          const defRespStatus = apiIn ? 'in_response_status_' : 'out_response_status_'
          const defRespHeader = apiIn ? 'in_response_header_' : 'out_response_header_'
          const defRespBody = apiIn ? 'in_response_body_' : 'out_response_body_'
          formData = {
            ...formDataToEdit,
            url: realFormData.url != null ? String(realFormData.url) : '',
            requestMethod:
              realFormData.requestMethod != null && String(realFormData.requestMethod).trim() !== ''
                ? String(realFormData.requestMethod).toUpperCase()
                : 'GET',
            requestType: realFormData.requestType != null ? String(realFormData.requestType) : '',
            responseStatus:
              realFormData.responseStatus != null && String(realFormData.responseStatus).trim() !== ''
                ? String(realFormData.responseStatus)
                : defRespStatus,
            responseHeader:
              realFormData.responseHeader != null && String(realFormData.responseHeader).trim() !== ''
                ? String(realFormData.responseHeader)
                : defRespHeader,
            responseBody:
              realFormData.responseBody != null && String(realFormData.responseBody).trim() !== ''
                ? String(realFormData.responseBody)
                : defRespBody,
            headerList: Array.isArray(realFormData.headerList)
              ? realFormData.headerList.map(normApiHeaderParam)
              : [],
            xFormList: Array.isArray(realFormData.xFormList)
              ? realFormData.xFormList.map(normApiParam)
              : [],
            raw: apiIn ? '' : realFormData.raw != null ? String(realFormData.raw) : '',
            useXForm: apiIn ? true : realFormData.useXForm !== false,
            useRaw: apiIn ? false : !!realFormData.useRaw,
            usePage: this.isApiOutputType(componentType) ? false : !!realFormData.usePage,
            pageCondition: realFormData.pageCondition != null ? String(realFormData.pageCondition) : '',
            ...(apiIn
              ? {
                pageDelayMin:
                    realFormData.pageDelayMin != null && realFormData.pageDelayMin !== ''
                      ? Math.max(0, Math.trunc(Number(realFormData.pageDelayMin)) || 0)
                      : 1,
                pageDelayMax:
                    realFormData.pageDelayMax != null && realFormData.pageDelayMax !== ''
                      ? Math.max(0, Math.trunc(Number(realFormData.pageDelayMax)) || 0)
                      : 100
              }
              : {}),
            startPageNo:
              realFormData.startPageNo != null && realFormData.startPageNo !== ''
                ? Math.max(1, Math.trunc(Number(realFormData.startPageNo)) || 1)
                : 1,
            requestCode:
              realFormData.requestCode != null && String(realFormData.requestCode).trim() !== ''
                ? String(realFormData.requestCode)
                : 'UTF-8',
            responseCode:
              realFormData.responseCode != null && String(realFormData.responseCode).trim() !== ''
                ? String(realFormData.responseCode)
                : 'UTF-8',
            connectOutTime:
              realFormData.connectOutTime != null && realFormData.connectOutTime !== ''
                ? Math.max(0, Math.trunc(Number(realFormData.connectOutTime)) || 0)
                : 5000,
            readOutTime:
              realFormData.readOutTime != null && realFormData.readOutTime !== ''
                ? Math.max(0, Math.trunc(Number(realFormData.readOutTime)) || 0)
                : 5000,
            retryNum:
              realFormData.retryNum != null && realFormData.retryNum !== ''
                ? Math.max(0, Math.trunc(Number(realFormData.retryNum)) || 0)
                : 0,
            retryTime:
              realFormData.retryTime != null && realFormData.retryTime !== ''
                ? Math.max(0, Math.trunc(Number(realFormData.retryTime)) || 0)
                : 10000,
            copiesCache: apiIn
              ? 1
              : realFormData.copiesCache != null && realFormData.copiesCache !== ''
                ? Math.max(1, Math.trunc(Number(realFormData.copiesCache)) || 1)
                : 1,
            distributeType: !!realFormData.distributeType
          }
        } else if (this.isExcelOutputType(componentType)) {
          const ex = this.mergeExcelOutputFormLayer(realFormData)
          const excelOutDs = (() => {
            if (ex.dataSourceId != null && ex.dataSourceId !== '') return ex.dataSourceId
            if (ex.ftpDataSourceId != null && ex.ftpDataSourceId !== '') return ex.ftpDataSourceId
            if (ex.dataSource != null && ex.dataSource !== '') return ex.dataSource
            if (ex.databaseId != null && ex.databaseId !== '') return ex.databaseId
            if (ex.dbId != null && ex.dbId !== '') return ex.dbId
            if (ex.resourceDbId != null && ex.resourceDbId !== '') return ex.resourceDbId
            return ''
          })()
          const outputPathResolved = (() => {
            const keys = [
              'outputPath',
              'ftpDirectory',
              'remoteDirectory',
              'targetDirectory',
              'directory',
              'outputDir',
              'ftpPath'
            ]
            for (let i = 0; i < keys.length; i++) {
              const v = ex[keys[i]]
              if (v != null && String(v).trim() !== '') return String(v).trim()
            }
            return ''
          })()
          formData = {
            ...formDataToEdit,
            outputPath: outputPathResolved,
            fileName: ex.fileName != null ? String(ex.fileName) : '',
            fileSourceType: 'FTP_FILE',
            extension: ex.extension != null && String(ex.extension).trim() !== ''
              ? String(ex.extension).trim()
              : 'xls',
            ifFileExists: ex.ifFileExists != null && String(ex.ifFileExists).trim() !== ''
              ? String(ex.ifFileExists).trim()
              : 'new',
            splitEvery: ex.splitEvery != null && ex.splitEvery !== ''
              ? Number(ex.splitEvery)
              : 0,
            streamingData: !!ex.streamingData,
            dateInFilename: !!ex.dateInFilename,
            dateTimeFormat: ex.dateTimeFormat != null ? String(ex.dateTimeFormat) : '',
            sheetname: ex.sheetname != null && String(ex.sheetname).trim() !== ''
              ? String(ex.sheetname).trim()
              : 'Sheet1',
            startingCell: ex.startingCell != null && String(ex.startingCell).trim() !== ''
              ? String(ex.startingCell).trim()
              : 'A1',
            appendLines: !!ex.appendLines,
            appendOmitHeader: !!ex.appendOmitHeader,
            fieldList: Array.isArray(ex.fieldList) ? ex.fieldList : [],
            dataSourceId: excelOutDs,
            ftpDataSourceId: ex.ftpDataSourceId != null && ex.ftpDataSourceId !== '' ? ex.ftpDataSourceId : excelOutDs,
            dataSource: ex.dataSource != null && ex.dataSource !== '' ? ex.dataSource : excelOutDs,
            distributeType: !!ex.distributeType,
            copiesCache: ex.copiesCache != null && ex.copiesCache !== '' ? Number(ex.copiesCache) : 1
          }
        } else {
          formData = formDataToEdit
        }

        // 获取完整的流程配置
        const flowConfig = this.graph ? this.graph.toJSON() : null

        this.configDrawer = {
          visible: true,
          currentNode: node,
          currentNodeId: node.id,
          componentType: componentType,
          form: formData,
          flowConfig: flowConfig,
          componentTreeConfig: this.findTransComponentConfigByCode(componentType)
        }
      })

      this.graph.on('blank:click', () => {
        this.contextMenu.visible = false
        this.contextMenu.selectedCell = null
      })

      this.graph.on('canvas:mouseleave', () => {
        this.contextMenu.visible = false
        this.contextMenu.selectedCell = null
      })

      this.graph.on('node:mouseenter', ({ node }) => {
        const ports = node.getPorts()
        ports.forEach((port) => {
          node.portProp(port.id, 'attrs/circle/visibility', 'visible')
        })
        node.attr('body/filter', {
          name: 'dropShadow',
          args: { dx: 0, dy: 2, blur: 12, color: 'rgba(0, 0, 0, 0.1)' }
        })
      })

      this.graph.on('node:mouseleave', ({ node }) => {
        const ports = node.getPorts()
        ports.forEach((port) => {
          node.portProp(port.id, 'attrs/circle/visibility', 'hidden')
        })
        node.attr('body/filter', {
          name: 'dropShadow',
          args: { dx: -1, dy: 2, blur: 4, color: 'rgba(0, 0, 0, 0.1)' }
        })
      })

      this.graph.on('edge:connected', ({ edge }) => {
        if (!edge.getSourceCell() || !edge.getTargetCell()) {
          edge.remove()
          return
        }
        this.applyQuadraticEdge(edge)
        const targetCell = edge.getTargetCell()
        if (targetCell) {
          const incomingEdges = this.graph.getIncomingEdges(targetCell)
          if (incomingEdges && incomingEdges.length > 1) {
            const edgesToRemove = incomingEdges.filter(e => e.id !== edge.id)
            this.graph.removeCells(edgesToRemove)
          }
        }
        const sourceCell = edge.getSourceCell()
        if (sourceCell) {
          const sourceData = sourceCell.getData ? (sourceCell.getData() || {}) : {}
          const sourceCode = sourceData.code || ''
          setTimeout(() => {
            const outgoingEdges = this.graph.getOutgoingEdges(sourceCell)
            if (!outgoingEdges) return

            if (this.isConditionJudgeType(sourceCode)) {
              if (outgoingEdges.length > 2) {
                edge.remove()
                this.$message.warning('条件判断组件最多连接两个下游节点')
                return
              }
              // 条件判断不支持复制/分发，清空连线标签和模式
              outgoingEdges.forEach((e) => {
                e.setLabels([])
                const d = e.getData() || {}
                if (d.mode) e.setData({ ...d, mode: '' })
              })
              return
            }

            if (this.isProcessBranchType(sourceCode)) {
              // 流程分支由组件内“分支值->目标步骤”决定，不走复制/分发连线弹窗
              return
            }

            if (outgoingEdges.length > 1) {
              this.showDistributionDialog(edge)
            }
          }, 100)
        }
        this.applyRuntimeStyles(this.stepStatusMap)
      })

      // 监听画布编辑操作，标记为已修改
      this.graph.on('cell:added', () => {
        this.hasChange = true
      })

      this.graph.on('cell:removed', ({ cell }) => {
        this.hasChange = true
        // 右键/快捷键删除节点时也要收起配置抽屉，否则右侧仍显示已删除步骤的配置
        if (
          this.configDrawer &&
          this.configDrawer.visible &&
          cell &&
          typeof cell.isNode === 'function' &&
          cell.isNode() &&
          this.configDrawer.currentNodeId != null &&
          String(cell.id) === String(this.configDrawer.currentNodeId)
        ) {
          this.configDrawer.visible = false
          this.configDrawer.currentNode = null
          this.configDrawer.currentNodeId = ''
        }
      })

      this.graph.on('cell:change:*', () => {
        this.hasChange = true
      })
    },

    normalizeStepName(name) {
      return String(name || '')
        .replace(/[“”"'‘’]/g, '')
        .trim()
    },

    extractStepStatusFromText(text) {
      const line = String(text || '')
      if (!line) return null

      // 示例：步骤 ‘Java代码’执行失败 / 步骤 '关系表输入' 执行成功
      const executeMatch = line.match(/步骤\s*[“"'‘’]?(.+?)[”"'‘’]?\s*执行(成功|失败)/)
      if (executeMatch) {
        return {
          stepName: this.normalizeStepName(executeMatch[1]),
          status: executeMatch[2] === '成功' ? 'S' : 'F'
        }
      }

      // 示例：步骤"关系表输入"截至当前共处理记录数：4023，处理速度：1788 条/秒!
      const runningMatch = line.match(/步骤\s*[“"'‘’]?(.+?)[”"'‘’]?\s*截至当前共处理记录数/)
      if (runningMatch) {
        return {
          stepName: this.normalizeStepName(runningMatch[1]),
          status: 'R'
        }
      }

      // 示例：Java代码 - 意外错误
      const errorMatch = line.match(/^(.+?)\s*[-－]\s*意外错误/)
      if (errorMatch) {
        return {
          stepName: this.normalizeStepName(errorMatch[1]),
          status: 'F'
        }
      }

      return null
    },

    collectStepStatusFromLogs(logList) {
      const result = {}
      ;(logList || []).forEach((item) => {
        const parsed = this.extractStepStatusFromText(item && item.text)
        if (parsed && parsed.stepName) {
          result[parsed.stepName] = parsed.status
        }
      })
      return result
    },

    getStatusWeight(status) {
      if (status === 'F') return 3
      if (status === 'S') return 2
      if (status === 'R') return 1
      return 0
    },

    mergeStepStatus(prevStatus = '', nextStatus = '') {
      // 失败最高优先级，其次成功，再次运行中
      return this.getStatusWeight(nextStatus) >= this.getStatusWeight(prevStatus) ? nextStatus : prevStatus
    },

    startEdgeFlowAnimation() {
      if (this.edgeFlowTimer || !this.graph) return
      this.edgeFlowTimer = setInterval(() => {
        if (!this.graph || !this.isRunning) return
        this.edgeFlowDashOffset = (this.edgeFlowDashOffset - 2 + 1000) % 1000
        this.graph.getEdges().forEach((edge) => {
          const runtimeStatus = (edge.getData() && edge.getData().runtimeStatus) || ''
          if (runtimeStatus === 'R') {
            edge.attr('line/strokeDashoffset', this.edgeFlowDashOffset)
          }
        })
      }, 80)
    },

    stopEdgeFlowAnimation() {
      if (this.edgeFlowTimer) {
        clearInterval(this.edgeFlowTimer)
        this.edgeFlowTimer = null
      }
      this.edgeFlowDashOffset = 0
      if (!this.graph) return
      this.graph.getEdges().forEach((edge) => {
        edge.attr('line/strokeDashoffset', 0)
      })
    },

    finalizeRuntimeStatusMap() {
      const finalized = { ...this.stepStatusMap }
      Object.keys(finalized).forEach((key) => {
        if (finalized[key] === 'R') {
          finalized[key] = 'S'
        }
      })
      this.stepStatusMap = finalized
      this.applyRuntimeStyles(this.stepStatusMap)
    },

    getNodeStyleByStatus(status = '') {
      if (status === 'R') {
        return {
          stroke: '#4f83ff',
          strokeWidth: 1.5
        }
      }
      if (status === 'S') {
        return {
          stroke: '#25b864',
          strokeWidth: 1.5
        }
      }
      if (status === 'F') {
        return {
          stroke: '#f04f4f',
          strokeWidth: 1.5
        }
      }
      return {
        stroke: '#d7dfeb',
        strokeWidth: 1.5
      }
    },

    getEdgeStyleByStatus(status = '', edgeRole = '') {
      // 条件判断组件出线样式：匹配线(绿实线) / 不匹配线(红虚线)
      const roleStroke = edgeRole === 'match'
        ? '#52c41a'
        : edgeRole === 'unmatch'
          ? '#f56c6c'
          : '#7f8ea3'

      if (status === 'R') {
        return {
          stroke: roleStroke,
          strokeWidth: 2.2,
          targetMarker: { name: 'classic', size: 8, fill: roleStroke, stroke: roleStroke },
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeDasharray: '8 6',
          strokeDashoffset: this.edgeFlowDashOffset
        }
      }

      if (edgeRole === 'match') {
        return {
          stroke: '#52c41a',
          strokeWidth: 2.2,
          targetMarker: { name: 'classic', size: 8, fill: '#52c41a', stroke: '#52c41a' },
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeDasharray: '',
          strokeDashoffset: 0
        }
      }

      if (edgeRole === 'unmatch') {
        return {
          stroke: '#f56c6c',
          strokeWidth: 2.2,
          targetMarker: { name: 'classic', size: 8, fill: '#f56c6c', stroke: '#f56c6c' },
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeDasharray: '6 4',
          strokeDashoffset: 0
        }
      }

      return {
        stroke: '#7f8ea3',
        strokeWidth: 2.2,
        targetMarker: { name: 'classic', size: 8 },
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeDasharray: '',
        strokeDashoffset: 0
      }
    },

    applyRuntimeStyles(stepStatusMap = {}) {
      if (!this.graph) return

      const nodeStatusById = {}
      this.graph.getNodes().forEach((node) => {
        const label = this.normalizeStepName(node.attr('label/text') || node.getData()?.name || '')
        nodeStatusById[node.id] = stepStatusMap[label] || ''
      })

      this.graph.getNodes().forEach((node) => {
        const status = nodeStatusById[node.id] || ''
        const nodeStyle = this.getNodeStyleByStatus(status)
        node.attr('body/stroke', nodeStyle.stroke)
        node.attr('body/strokeWidth', nodeStyle.strokeWidth)
        // 按需求：状态变化仅修改节点边框颜色，不修改文本颜色和内部填充色
        node.attr('body/fill', '#fff')
        node.attr('label/fill', '#555')
      })

      this.graph.getEdges().forEach((edge) => {
        const sourceId = edge.getSourceCellId()
        const targetId = edge.getTargetCellId()
        const sourceStatus = sourceId ? nodeStatusById[sourceId] || '' : ''
        const targetStatus = targetId ? nodeStatusById[targetId] || '' : ''
        const edgeStatus = this.isRunning && (sourceStatus === 'R' || targetStatus === 'R') ? 'R' : ''
        const edgeRole = this.getConditionJudgeEdgeRole(edge)
        this.applyConditionEdgeBadge(edge, edgeRole)

        const edgeStyle = this.getEdgeStyleByStatus(edgeStatus, edgeRole)
        edge.attr('line/stroke', edgeStyle.stroke)
        edge.attr('line/strokeWidth', edgeStyle.strokeWidth)
        edge.attr('line/targetMarker', edgeStyle.targetMarker)
        edge.attr('line/strokeLinecap', edgeStyle.strokeLinecap)
        edge.attr('line/strokeLinejoin', edgeStyle.strokeLinejoin)
        edge.attr('line/strokeDasharray', edgeStyle.strokeDasharray || '')
        edge.attr('line/strokeDashoffset', edgeStyle.strokeDashoffset || 0)
        const edgeData = edge.getData() || {}
        edge.setData({ ...edgeData, runtimeStatus: edgeStatus, conditionRole: edgeRole || '' })
      })

      if (this.isRunning) {
        this.startEdgeFlowAnimation()
      } else {
        this.stopEdgeFlowAnimation()
      }
    },

    updateStepRuntimeStatus(logList) {
      const latestMap = this.collectStepStatusFromLogs(logList)
      if (Object.keys(latestMap).length === 0) return
      const merged = { ...this.stepStatusMap }
      Object.keys(latestMap).forEach((stepName) => {
        const prev = merged[stepName] || ''
        merged[stepName] = this.mergeStepStatus(prev, latestMap[stepName])
      })
      this.stepStatusMap = merged
      this.applyRuntimeStyles(this.stepStatusMap)
    },

    resetRuntimeStyles() {
      this.stopEdgeFlowAnimation()
      this.stepStatusMap = {}
      this.applyRuntimeStyles({})
    },

    handleConfigDrawerSave(formData) {
      const node = this.configDrawer.currentNode
      if (node) {
        const nodeData = node.getData() || {}
        const normalizedCode = this.isConditionJudgeType(formData.code) ? 'JavaCondition' : formData.code
        // 后端 create(String config, ...) 期望：
        // config = { name: string, code: string, data: { ...真实参数... } }
        const flatData = this.unwrapChainedPluginData({ ...formData, code: normalizedCode })
        if (this.isPrintLogType(flatData.code)) {
          delete flatData.logFieldList
          delete flatData.limitInputRows
          delete flatData.maxOutputLogRows
          // 浅拷贝会带上嵌套 data，内层旧 fieldList 会在下次打开时覆盖顶层，必须去掉
          if (flatData.data != null && typeof flatData.data === 'object' && !Array.isArray(flatData.data)) {
            delete flatData.data
          }
          if (Array.isArray(flatData.fieldList)) {
            flatData.fieldList = flatData.fieldList.filter(r => r && r.name).map(r => ({ name: String(r.name) }))
          }
        } else if (this.isProcessBranchType(flatData.code)) {
          flatData.conditionFiled = String(flatData.conditionFiled || flatData.conditionField || '').trim()
          delete flatData.conditionField
          const setup = Array.isArray(flatData.ProcessBranchSetup) ? flatData.ProcessBranchSetup : []
          flatData.ProcessBranchSetup = setup
            .map((r) => ({
              caseValue: String((r && r.caseValue) || '').trim(),
              stepId: String((r && r.stepId) || '').trim(),
              stepName: String((r && r.stepName) || '')
            }))
            .filter(r => r.caseValue && r.stepId)
          flatData.defaultTargetStep = String(flatData.defaultTargetStep || '').trim()
          if (flatData.distributeType === undefined) flatData.distributeType = true
          if (flatData.copiesCache === undefined || flatData.copiesCache === '') flatData.copiesCache = 1
        } else if (this.isSortRowsType(flatData.code)) {
          if (flatData.data != null && typeof flatData.data === 'object' && !Array.isArray(flatData.data)) {
            delete flatData.data
          }
          const sortYn = (v, def) => {
            if (v === true || v === 'true' || v === 1 || v === '1' || v === 'Y' || v === 'y') return 'Y'
            if (v === false || v === 'false' || v === 0 || v === '0' || v === 'N' || v === 'n') return 'N'
            return def
          }
          const normSortRow = (r) => {
            if (!r || typeof r !== 'object') return { name: '', ascending: 'Y', caseSensitive: 'N' }
            return {
              name: r.name != null ? String(r.name).trim() : '',
              ascending: sortYn(r.ascending, 'Y'),
              caseSensitive: sortYn(r.caseSensitive, 'N')
            }
          }
          if (Array.isArray(flatData.fieldList)) {
            flatData.fieldList = flatData.fieldList.map(normSortRow).filter((r) => r.name)
          }
          if (flatData.sortSize != null) flatData.sortSize = String(flatData.sortSize).trim() || '1000'
          if (flatData.copiesCache === undefined || flatData.copiesCache === '') flatData.copiesCache = 1
          if (flatData.distributeType === undefined) flatData.distributeType = false
        } else if (this.isSplitFieldToRowsType(flatData.code)) {
          if (flatData.data != null && typeof flatData.data === 'object' && !Array.isArray(flatData.data)) {
            delete flatData.data
          }
          flatData.splitField = String(flatData.splitField || '').trim()
          flatData.delimiter = flatData.delimiter != null ? String(flatData.delimiter) : ''
          flatData.newFieldname = String(flatData.newFieldname || '').trim()
          if (flatData.copiesCache === undefined || flatData.copiesCache === '') flatData.copiesCache = 1
          if (flatData.distributeType === undefined) flatData.distributeType = false
        } else if (this.isFieldSplitterType(flatData.code)) {
          if (flatData.data != null && typeof flatData.data === 'object' && !Array.isArray(flatData.data)) {
            delete flatData.data
          }
          flatData.splitField = String(flatData.splitField || '').trim()
          flatData.delimiter = flatData.delimiter != null ? String(flatData.delimiter) : ''
          const normFsRow = (r) => {
            if (!r || typeof r !== 'object') return { fieldName: '', fieldType: 2, fieldTrimType: 0 }
            const ft = Math.trunc(Number(r.fieldType))
            const tr = Math.trunc(Number(r.fieldTrimType))
            return {
              fieldName: r.fieldName != null ? String(r.fieldName).trim() : '',
              fieldType: Number.isFinite(ft) ? ft : 2,
              fieldTrimType: Number.isFinite(tr) ? tr : 0
            }
          }
          if (Array.isArray(flatData.fieldList)) {
            flatData.fieldList = flatData.fieldList.map(normFsRow).filter((x) => x.fieldName)
          } else {
            flatData.fieldList = []
          }
          if (flatData.copiesCache === undefined || flatData.copiesCache === '') flatData.copiesCache = 1
          if (flatData.distributeType === undefined) flatData.distributeType = false
        } else if (this.isFormulaType(flatData.code)) {
          if (flatData.data != null && typeof flatData.data === 'object' && !Array.isArray(flatData.data)) {
            delete flatData.data
          }
          const normFormulaRow = (r) => {
            if (!r || typeof r !== 'object') {
              return { fieldName: '', formula: '', valueType: 0, valueLength: 0, valuePrecision: 0 }
            }
            const vt = Math.trunc(Number(r.valueType))
            const vl = Math.trunc(Number(r.valueLength))
            const vp = Math.trunc(Number(r.valuePrecision))
            return {
              fieldName: r.fieldName != null ? String(r.fieldName).trim() : '',
              formula: r.formula != null ? String(r.formula) : '',
              valueType: Number.isFinite(vt) ? vt : 0,
              valueLength: Number.isFinite(vl) && vl >= 0 ? vl : 0,
              valuePrecision: Number.isFinite(vp) && vp >= 0 ? vp : 0
            }
          }
          if (Array.isArray(flatData.fieldList)) {
            flatData.fieldList = flatData.fieldList.map(normFormulaRow).filter((x) => x.fieldName && x.formula)
          } else {
            flatData.fieldList = []
          }
          if (flatData.copiesCache === undefined || flatData.copiesCache === '') flatData.copiesCache = 1
          if (flatData.distributeType === undefined) flatData.distributeType = false
        } else if (this.isGroupByType(flatData.code)) {
          if (flatData.data != null && typeof flatData.data === 'object' && !Array.isArray(flatData.data)) {
            delete flatData.data
          }
          const normGf = (raw) => {
            if (raw == null) return []
            if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean)
            if (typeof raw === 'string') {
              const t = raw.trim()
              if (!t) return []
              try {
                const p = JSON.parse(t)
                if (Array.isArray(p)) return p.map((x) => String(x).trim()).filter(Boolean)
              } catch (e) {
                /* 单字段 */
              }
              return [t]
            }
            return []
          }
          const normGbRow = (r) => {
            if (!r || typeof r !== 'object') {
              return { aggregateField: '', subjectField: '', aggregateType: NaN, valueField: '' }
            }
            const at = Math.trunc(Number(r.aggregateType))
            return {
              aggregateField: r.aggregateField != null ? String(r.aggregateField).trim() : '',
              subjectField: r.subjectField != null ? String(r.subjectField).trim() : '',
              aggregateType: Number.isFinite(at) ? at : NaN,
              valueField: r.valueField != null ? String(r.valueField) : ''
            }
          }
          flatData.groupField = normGf(flatData.groupField)
          if (Array.isArray(flatData.fieldList)) {
            flatData.fieldList = flatData.fieldList
              .map(normGbRow)
              .filter((r) => r.subjectField && r.aggregateField && Number.isFinite(r.aggregateType))
          } else {
            flatData.fieldList = []
          }
          if (flatData.copiesCache === undefined || flatData.copiesCache === '') flatData.copiesCache = 1
          if (flatData.distributeType === undefined) flatData.distributeType = false
        } else if (this.isRedisOutputType(flatData.code)) {
          if (flatData.data != null && typeof flatData.data === 'object' && !Array.isArray(flatData.data)) {
            delete flatData.data
          }
          flatData.key = String(flatData.key || '').trim()
          flatData.value = flatData.value != null ? String(flatData.value) : ''
          if (flatData.copiesCache === undefined || flatData.copiesCache === '') flatData.copiesCache = 1
          if (flatData.distributeType === undefined) flatData.distributeType = false
        } else if (this.isKafkaProducerOutputType(flatData.code)) {
          if (flatData.data != null && typeof flatData.data === 'object' && !Array.isArray(flatData.data)) {
            delete flatData.data
          }
          let ds = flatData.dataSourceId != null && flatData.dataSourceId !== '' ? String(flatData.dataSourceId) : ''
          if (!ds && flatData.dataSource != null && flatData.dataSource !== '') {
            ds = String(flatData.dataSource)
          }
          flatData.dataSourceId = ds || null
          delete flatData.dataSource
          flatData.topic = String(flatData.topic || '').trim()
          flatData.clientId = String(flatData.clientId || '').trim()
          flatData.keyField = String(flatData.keyField || '').trim()
          flatData.messageField = String(flatData.messageField || '').trim()
          if (typeof flatData.properties !== 'string') {
            flatData.properties = JSON.stringify(
              Array.isArray(flatData.properties) ? flatData.properties : []
            )
          }
          if (flatData.copiesCache === undefined || flatData.copiesCache === '') flatData.copiesCache = 1
          if (flatData.distributeType === undefined) flatData.distributeType = false
        } else if (this.isRabbitMqProducerOutputType(flatData.code)) {
          if (flatData.data != null && typeof flatData.data === 'object' && !Array.isArray(flatData.data)) {
            delete flatData.data
          }
          let ds = flatData.dataSourceId != null && flatData.dataSourceId !== '' ? String(flatData.dataSourceId) : ''
          if (!ds && flatData.dataSource != null && flatData.dataSource !== '') {
            ds = String(flatData.dataSource)
          }
          flatData.dataSourceId = ds || null
          delete flatData.dataSource
          const vh = flatData.virtualHost != null && String(flatData.virtualHost).trim() !== ''
            ? String(flatData.virtualHost).trim()
            : '/'
          flatData.virtualHost = vh
          flatData.exchange = String(flatData.exchange || '').trim()
          flatData.routingKey = String(flatData.routingKey || '').trim()
          flatData.queue = String(flatData.queue || '').trim()
          if (Array.isArray(flatData.topics)) {
            flatData.topics = flatData.topics.map((x) => String(x)).filter(Boolean)
          } else if (typeof flatData.topics === 'string') {
            try {
              const parsed = JSON.parse(flatData.topics)
              flatData.topics = Array.isArray(parsed) ? parsed.map((x) => String(x)).filter(Boolean) : []
            } catch (e) {
              flatData.topics = []
            }
          } else {
            flatData.topics = []
          }
          flatData.messageField = String(flatData.messageField || '').trim()
          flatData.routingKeyField = String(flatData.routingKeyField || '').trim()
          let pct = flatData.publisherConfirmType != null ? String(flatData.publisherConfirmType).trim().toLowerCase() : 'correlated'
          if (!['correlated', 'simple', 'none'].includes(pct)) pct = 'correlated'
          flatData.publisherConfirmType = pct
          flatData.publisherReturns = flatData.publisherReturns !== false && flatData.publisherReturns !== 'false'
          const tm =
            flatData.templateMandatory !== undefined && flatData.templateMandatory !== null && flatData.templateMandatory !== ''
              ? flatData.templateMandatory !== false && flatData.templateMandatory !== 'false'
              : flatData.mandatory !== false && flatData.mandatory !== 'false'
          flatData.templateMandatory = tm
          delete flatData.mandatory
          if (typeof flatData.properties !== 'string') {
            flatData.properties = JSON.stringify(
              Array.isArray(flatData.properties) ? flatData.properties : []
            )
          }
          if (flatData.copiesCache === undefined || flatData.copiesCache === '') flatData.copiesCache = 1
          if (flatData.distributeType === undefined) flatData.distributeType = false
        } else if (this.isRabbitMqConsumerInputType(flatData.code)) {
          if (flatData.data != null && typeof flatData.data === 'object' && !Array.isArray(flatData.data)) {
            delete flatData.data
          }
          let ds = flatData.dataSourceId != null && flatData.dataSourceId !== '' ? String(flatData.dataSourceId) : ''
          if (!ds && flatData.dataSource != null && flatData.dataSource !== '') {
            ds = String(flatData.dataSource)
          }
          flatData.dataSourceId = ds || null
          delete flatData.dataSource
          const vh = flatData.virtualHost != null && String(flatData.virtualHost).trim() !== ''
            ? String(flatData.virtualHost).trim()
            : '/'
          flatData.virtualHost = vh
          flatData.queue = String(flatData.queue || '').trim()
          if (Array.isArray(flatData.topics)) {
            flatData.topics = flatData.topics.map((x) => String(x)).filter(Boolean)
          } else if (typeof flatData.topics === 'string') {
            try {
              const parsed = JSON.parse(flatData.topics)
              flatData.topics = Array.isArray(parsed) ? parsed.map((x) => String(x)).filter(Boolean) : []
            } catch (e) {
              flatData.topics = []
            }
          } else {
            flatData.topics = []
          }
          const ack = flatData.listenerAcknowledgeMode != null ? String(flatData.listenerAcknowledgeMode).trim().toLowerCase() : ''
          flatData.listenerAcknowledgeMode = ack === 'auto' ? 'auto' : 'manual'
          flatData.listenerPrefetch = Math.max(1, Math.trunc(Number(flatData.listenerPrefetch)) || 1)
          flatData.listenerConcurrency = Math.max(1, Math.trunc(Number(flatData.listenerConcurrency)) || 1)
          flatData.listenerMaxConcurrency = Math.max(1, Math.trunc(Number(flatData.listenerMaxConcurrency)) || 1)
          flatData.listenerDefaultRequeueRejected = flatData.listenerDefaultRequeueRejected !== false && flatData.listenerDefaultRequeueRejected !== 'false'
          flatData.listenerRetryEnabled = flatData.listenerRetryEnabled !== false && flatData.listenerRetryEnabled !== 'false'
          flatData.listenerRetryInitialInterval = Math.max(1, Math.trunc(Number(flatData.listenerRetryInitialInterval)) || 1000)
          flatData.listenerRetryMaxAttempts = Math.max(1, Math.trunc(Number(flatData.listenerRetryMaxAttempts)) || 3)
          flatData.listenerRetryMaxInterval = Math.max(1, Math.trunc(Number(flatData.listenerRetryMaxInterval)) || 10000)
          const mul = Number(flatData.listenerRetryMultiplier)
          flatData.listenerRetryMultiplier = Number.isFinite(mul) && mul > 0 ? mul : 1.0
          flatData.maxMessages = Math.max(0, Math.trunc(Number(flatData.maxMessages)) || 0)
          if (Array.isArray(flatData.fieldList)) {
            flatData.fieldList = flatData.fieldList
              .filter((r) => r && r.rabbitName != null && String(r.rabbitName).trim())
              .map((r) => ({
                rabbitName: String(r.rabbitName).trim(),
                outputName: r.outputName != null ? String(r.outputName).trim() : String(r.rabbitName).trim(),
                outputType: r.outputType != null ? String(r.outputType).trim() : 'String'
              }))
          } else {
            flatData.fieldList = []
          }
          if (typeof flatData.properties !== 'string') {
            flatData.properties = JSON.stringify(
              Array.isArray(flatData.properties) ? flatData.properties : []
            )
          }
          if (flatData.copiesCache === undefined || flatData.copiesCache === '') flatData.copiesCache = 1
          if (flatData.distributeType === undefined) flatData.distributeType = false
        } else if (flatData.code === 'InsertOrUpdate') {
          this.normalizeInsertOrUpdatePluginData(flatData)
        }
        const newData = {
          ...nodeData,
          name: formData.name,
          code: normalizedCode,
          data: flatData
        }
        // X6 默认 setData 为 lodash 深合并：数组按索引合并，删短的 fieldList 会留下尾部旧元素，必须用整对象覆盖
        node.replaceData(newData)
        node.attr('label/text', formData.name)
        this.applyRuntimeStyles(this.stepStatusMap)
        this.configDrawer.visible = false
        this.$message.success('配置保存成功')
        // 此处仅保存到画布内存，并未持久化到后端，因此应视为“有未保存更改”
        this.hasChange = true
      }
    },

    // 当配置抽屉关闭时，标记为已修改
    handleConfigDrawerClose() {
      this.configDrawer.visible = false
      // 当用户打开配置抽屉并可能修改了配置时，标记为已修改
      this.hasChange = true
    },

    hasUnsavedChanges() {
      return this.hasChange
    },

    handleBeforeUnload(e) {
      if (this.hasChange) {
        const confirmationMessage = '当前流程设计内容尚未保存，是否确认离开此页面？'
        e.returnValue = confirmationMessage
        return confirmationMessage
      }
    },

    onDragStart(e, item) {
      if (this.isComponentDisabled(item)) {
        e.preventDefault()
        return
      }
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', JSON.stringify(item))
    },

    onDragOver(e) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    },

    onDrop(e) {
      e.preventDefault()
      const dataStr = e.dataTransfer.getData('text/plain')
      if (!dataStr) return

      try {
        const item = JSON.parse(dataStr)
        if (this.isComponentDisabled(item)) {
          return
        }
        const uniqueNodeName = this.getUniqueDefaultNodeName(item?.label || '')
        const point = this.graph.clientToLocal(e.clientX, e.clientY)
        const nodeConfig = this.createNode(
          'rect',
          point.x - 90,
          point.y - 20,
          uniqueNodeName,
          6,
          6,
          item.icon && item.icon.startsWith('data:image') ? item.icon : '',
          28,
          28,
          12,
          6
        )

        this.graph.addNode({
          ...nodeConfig,
          data: this.buildFrontendNodeData(item, uniqueNodeName), // 直接使用扁平化的前端节点数据
          ports: {
            groups: {
              left: {
                position: 'left',
                attrs: {
                  circle: {
                    r: 4,
                    magnet: true,
                    stroke: '#5F95FF',
                    strokeWidth: 1,
                    fill: '#fff',
                    visibility: 'hidden'
                  }
                }
              },
              right: {
                position: 'right',
                attrs: {
                  circle: {
                    r: 4,
                    magnet: true,
                    stroke: '#5F95FF',
                    strokeWidth: 1,
                    fill: '#fff',
                    visibility: 'hidden'
                  }
                }
              }
            },
            items: [
              { group: 'left', id: 'left' + Date.now() },
              { group: 'right', id: 'right' + Date.now() }
            ]
          }
        })
      } catch (error) {
        console.error('创建节点失败:', error)
      }
    },

    getUniqueDefaultNodeName(baseName) {
      const normalizedBaseName = String(baseName || '').trim()
      if (!normalizedBaseName || !this.graph) return normalizedBaseName

      const escapedBase = normalizedBaseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const baseReg = new RegExp(`^${escapedBase}(\\d+)?$`)
      const usedSuffixSet = new Set()

      this.graph.getNodes().forEach((node) => {
        const nodeLabel = String(node.attr('label/text') || node.getData()?.name || '').trim()
        const match = nodeLabel.match(baseReg)
        if (!match) return
        const suffix = match[1]
        usedSuffixSet.add(suffix ? Number(suffix) : 0)
      })

      if (!usedSuffixSet.has(0)) {
        return normalizedBaseName
      }

      let index = 1
      while (usedSuffixSet.has(index)) {
        index += 1
      }
      return `${normalizedBaseName}${index}`
    },

    // 新增：构建前端节点数据结构，确保扁平化
    buildFrontendNodeData(item, nodeName) {
      const name = nodeName || item?.label || ''
      const rawCode = item?.code || ''
      const code = this.isConditionJudgeType(rawCode) ? 'JavaCondition' : rawCode
      let initialFormData = {
        name,
        code,
        description: ''
      }

      // 清洗转换组件给一份可用的默认结构
      if (this.isCleanTransformType(code)) {
        initialFormData = {
          ...initialFormData,
          distributeType: false,
          copiesCache: 1,
          fieldList: [],
          requestCode: 'UTF-8',
          responseCode: 'UTF-8',
          connectOutTime: '5000',
          readOutTime: '5000',
          supportCopy: true,
          supportError: true,
          supportInput: true,
          errorStepName: name // 默认错误步骤名称为当前组件名称
        }
      } else if (this.isPrintLogType(code)) {
        initialFormData = {
          ...initialFormData,
          limitRows: true,
          limitRowsNumber: 1000,
          fieldList: []
        }
      } else if (this.isExecSqlType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          sql: '',
          executeEachRow: false,
          bindVariable: false,
          variableReplace: false,
          filedList: []
        }
      } else if (this.isConditionJudgeType(code)) {
        initialFormData = {
          ...initialFormData,
          trueStepName: '',
          errorStepName: '',
          condition: 'true',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isDataFilterType(code)) {
        initialFormData = {
          ...initialFormData,
          filterType: '0',
          condition: {
            conditionGroups: [],
            condition: 'ALL'
          },
          javaCode: '',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isProcessBranchType(code)) {
        initialFormData = {
          ...initialFormData,
          conditionFiled: '',
          ProcessBranchSetup: [],
          defaultTargetStep: '',
          copiesCache: 1,
          distributeType: true
        }
      } else if (this.isDenormalizedType(code)) {
        initialFormData = {
          ...initialFormData,
          groupField: '',
          keyField: '',
          denormaliserTargetField: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isNormaliserType(code)) {
        initialFormData = {
          ...initialFormData,
          keyField: '',
          valueField: '',
          normaliserFields: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isFieldSelectType(code)) {
        initialFormData = {
          ...initialFormData,
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isSortRowsType(code)) {
        initialFormData = {
          ...initialFormData,
          sortSize: '1000',
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isSplitFieldToRowsType(code)) {
        initialFormData = {
          ...initialFormData,
          splitField: '',
          delimiter: ',',
          newFieldname: '',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isFieldSplitterType(code)) {
        initialFormData = {
          ...initialFormData,
          splitField: '',
          delimiter: ',',
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isFormulaType(code)) {
        initialFormData = {
          ...initialFormData,
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isGroupByType(code)) {
        initialFormData = {
          ...initialFormData,
          groupField: [],
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isFtpUploadType(code)) {
        initialFormData = {
          ...initialFormData,
          localDirectory: '',
          wildCard: '',
          dataSource: '',
          remoteDirectory: '',
          outFiledList: [
            { name: '源文件目录', fieldName: 'upload_src_dir' },
            { name: '目标文件目录', fieldName: 'upload_target_dir' },
            { name: '文件名', fieldName: 'upload_file_name' },
            { name: '文件类型', fieldName: 'upload_file_type' }
          ],
          binaryMode: true,
          removeLocalFile: true,
          overwriteFile: true,
          timeOut: 60000,
          distributeType: false,
          copiesCache: 1
        }
      } else if (this.isAliYunOssUploadType(code)) {
        initialFormData = {
          ...initialFormData,
          localDirectory: '',
          wildCard: '',
          dataSource: '',
          bucketName: '',
          outFiledList: [
            { name: '源文件目录', fieldName: 'upload_src_dir' },
            { name: '目标文件目录', fieldName: 'upload_target_dir' },
            { name: '文件名', fieldName: 'upload_file_name' },
            { name: '文件类型', fieldName: 'upload_file_type' }
          ],
          binaryMode: true,
          removeLocalFile: true,
          overwriteFile: true,
          timeOut: 60000,
          distributeType: false,
          copiesCache: 1
        }
      } else if (this.isFtpDownloadType(code)) {
        initialFormData = {
          ...initialFormData,
          localDirectory: '',
          wildCard: '',
          dataSource: '',
          remoteDirectory: '',
          outFiledList: [
            { name: '源文件目录', fieldName: 'download_src_dir' },
            { name: '目标文件目录', fieldName: 'download_target_dir' },
            { name: '文件名', fieldName: 'download_file_name' },
            { name: '文件类型', fieldName: 'download_file_type' },
            { name: '文件大小', fieldName: 'download_file_size' }
          ],
          binaryMode: true,
          timeOut: 60000,
          removeAfterDownload: true,
          moveAfterDownload: false,
          moveToFolder: '',
          createMoveFolderIfNotExist: false,
          fileNameContainsDate: false,
          dateTimeFormat: '',
          distributeType: false,
          copiesCache: 1
        }
      } else if (this.isAliYunOssDownloadType(code)) {
        initialFormData = {
          ...initialFormData,
          localDirectory: '',
          wildCard: '',
          dataSource: '',
          bucketName: '',
          outFiledList: [
            { name: '源文件目录', fieldName: 'download_src_dir' },
            { name: '目标文件目录', fieldName: 'download_target_dir' },
            { name: '文件名', fieldName: 'download_file_name' },
            { name: '文件类型', fieldName: 'download_file_type' },
            { name: '文件大小', fieldName: 'download_file_size' }
          ],
          binaryMode: true,
          timeOut: 60000,
          removeAfterDownload: true,
          moveAfterDownload: false,
          moveToFolder: '',
          createMoveFolderIfNotExist: false,
          fileNameContainsDate: false,
          dateTimeFormat: '',
          distributeType: false,
          copiesCache: 1
        }
      } else if (this.isRowGeneratorType(code)) {
        initialFormData = {
          ...initialFormData,
          recordGenerationType: 1,
          rowLimit: '10',
          timeInterval: '100',
          timeFieldName: 'currentTime',
          lastTimeFieldName: 'lastTime',
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isRecordsFromStreamType(code)) {
        initialFormData = {
          ...initialFormData,
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isSystemDateType(code)) {
        initialFormData = {
          ...initialFormData,
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isKafkaInputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSource: '',
          topics: [],
          partition: '',
          consumerGroup: '',
          transId: this.flowId != null ? Number(this.flowId) : null,
          batchDuration: 1000,
          batchSize: 1000,
          prefetchCount: 100000,
          commitType: 'AUTO_COMMIT',
          fieldList: [
            { kafkaName: 'key', outputName: 'key', outputType: 'String' },
            { kafkaName: 'message', outputName: 'message', outputType: 'String' },
            { kafkaName: 'topic', outputName: 'topic', outputType: 'String' },
            { kafkaName: 'partition', outputName: 'partition', outputType: 'Integer' },
            { kafkaName: 'offset', outputName: 'offset', outputType: 'Integer' },
            { kafkaName: 'timestamp', outputName: 'timestamp', outputType: 'Integer' }
          ],
          properties: '[]',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isRabbitMqConsumerInputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          virtualHost: '/',
          queue: '',
          topics: [],
          listenerAcknowledgeMode: 'manual',
          listenerPrefetch: 1,
          listenerConcurrency: 1,
          listenerMaxConcurrency: 1,
          listenerDefaultRequeueRejected: true,
          listenerRetryEnabled: true,
          listenerRetryInitialInterval: 1000,
          listenerRetryMaxAttempts: 3,
          listenerRetryMaxInterval: 10000,
          listenerRetryMultiplier: 1.0,
          maxMessages: 0,
          fieldList: [
            { rabbitName: 'message', outputName: 'message', outputType: 'String' },
            { rabbitName: 'routingKey', outputName: 'routingKey', outputType: 'String' },
            { rabbitName: 'messageId', outputName: 'messageId', outputType: 'String' },
            { rabbitName: 'deliveryTag', outputName: 'deliveryTag', outputType: 'Long' },
            { rabbitName: 'exchange', outputName: 'exchange', outputType: 'String' },
            { rabbitName: 'timestamp', outputName: 'timestamp', outputType: 'Long' }
          ],
          properties: '[]',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isRedisInputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          key: '',
          fieldDelimiter: '',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isRedisOutputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          dbName: '',
          key: '',
          value: '',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isKafkaProducerOutputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          topic: '',
          clientId: '',
          keyField: '',
          messageField: '',
          properties: '[]',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isRabbitMqProducerOutputType(code)) {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          virtualHost: '/',
          exchange: '',
          routingKey: '',
          queue: '',
          topics: [],
          messageField: '',
          routingKeyField: '',
          publisherConfirmType: 'correlated',
          publisherReturns: true,
          templateMandatory: true,
          properties: '[]',
          copiesCache: 1,
          distributeType: false
        }
      } else if (code === 'DebeziumJson') {
        initialFormData = {
          ...initialFormData,
          sourceField: '',
          sample: '',
          fieldList: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (code === 'ApiInput') {
        initialFormData = {
          ...initialFormData,
          url: '',
          requestMethod: 'GET',
          requestType: '',
          responseStatus: 'in_response_status_',
          responseHeader: 'in_response_header_',
          responseBody: 'in_response_body_',
          headerList: [],
          xFormList: [],
          raw: '',
          useXForm: true,
          useRaw: false,
          usePage: false,
          pageCondition: '',
          pageDelayMin: 1,
          pageDelayMax: 100,
          startPageNo: 1,
          requestCode: 'UTF-8',
          responseCode: 'UTF-8',
          connectOutTime: 5000,
          readOutTime: 5000,
          retryNum: 0,
          retryTime: 10000,
          distributeType: false
        }
      } else if (code === 'ApiOutput') {
        initialFormData = {
          ...initialFormData,
          url: '',
          requestMethod: 'GET',
          requestType: 'application/json',
          responseStatus: 'out_response_status_',
          responseHeader: 'out_response_header_',
          responseBody: 'out_response_body_',
          headerList: [],
          xFormList: [],
          raw: '',
          useXForm: true,
          useRaw: false,
          requestCode: 'UTF-8',
          responseCode: 'UTF-8',
          connectOutTime: 5000,
          readOutTime: 5000,
          retryNum: 0,
          retryTime: 10000,
          copiesCache: 1,
          distributeType: false
        }
      } else if (code === 'ApiAttachmentDownload' || code === 'ApiFileDownload') {
        initialFormData = {
          ...initialFormData,
          url: '',
          requestMethod: 'GET',
          requestType: 'application/json',
          responseStatus: 'out_response_status_',
          responseHeader: 'out_response_header_',
          responseBody: 'out_response_body_',
          headerList: [],
          xFormList: [],
          raw: '',
          useXForm: true,
          useRaw: false,
          usePage: false,
          pageCondition: '',
          startPageNo: 1,
          requestCode: 'UTF-8',
          responseCode: 'UTF-8',
          connectOutTime: 5000,
          readOutTime: 5000,
          retryNum: 0,
          retryTime: 10000,
          copiesCache: 1,
          distributeType: false
        }
      } else if (code === 'InsertOrUpdate') {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          dbId: '',
          dbConnection: '',
          tableId: null,
          tableName: '',
          commitSize: '1000',
          updateBypassed: false,
          selectField: [],
          updateField: [],
          copiesCache: 1,
          distributeType: false
        }
      } else if (code === 'DorisOutput') {
        initialFormData = {
          ...initialFormData,
          dataSourceId: '',
          tableId: null,
          tableName: '',
          truncateTable: false,
          fieldList: [],
          // Doris Stream Load 相关默认值（对齐你提供的样式图）
          maxBatchRows: 500000,
          maxBytes: 90,
          scanningFrequency: 3000,
          connectTimeout: 10,
          retries: 3,
          timeout: 600,
          headerProperties: [
            { key: 'line_delimiter', value: '\\x02' },
            { key: 'column_separator', value: '\\x01' }
          ],
          upsertOrDelete: '',
          partialUpdate: '',
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isExcelInputType(code)) {
        initialFormData = {
          ...initialFormData,
          fileList: [],
          sheetList: [],
          fieldList: [],
          fileSourceType: 'FTP_FILE',
          dataSourceId: '',
          ftpDataSourceId: '',
          dataSource: '',
          engine: '',
          password: '',
          readLine: 0,
          assCode: 'UTF-8',
          ignoreEmptyRows: true,
          copiesCache: 1,
          distributeType: false
        }
      } else if (this.isExcelOutputType(code)) {
        initialFormData = {
          ...initialFormData,
          outputPath: '',
          fileName: '',
          fileSourceType: 'FTP_FILE',
          extension: 'xls',
          ifFileExists: 'new',
          splitEvery: 0,
          streamingData: false,
          dateInFilename: false,
          dateTimeFormat: '',
          sheetname: 'Sheet1',
          startingCell: 'A1',
          appendLines: false,
          appendOmitHeader: false,
          fieldList: [],
          dataSourceId: '',
          ftpDataSourceId: '',
          dataSource: '',
          copiesCache: 1,
          distributeType: false
        }
      }

      return {
        type: item.type,
        name,
        code: item.code,
        data: initialFormData // 这里直接是扁平的 formData
      }
    },

    deleteSelectedItem() {
      if (this.contextMenu.selectedCell) {
        this.graph.removeCells([this.contextMenu.selectedCell])
        this.contextMenu.visible = false
        this.contextMenu.selectedCell = null
      }
    },

    saveComponentConfig() {
      if (!this.configDrawer.form.name) {
        alert('请输入组件名称')
        return
      }
      const node = this.configDrawer.currentNode
      if (node) {
        const nodeData = node.getData() || {}
        node.replaceData({ ...nodeData, ...this.configDrawer.form })
        node.attr('label/text', this.configDrawer.form.name)
        this.configDrawer.visible = false
        this.$message.success('配置保存成功')
      }
    },

    isKeyEventFromEditableControl(e) {
      const isEditable = (el) => {
        if (!el || typeof el !== 'object') return false
        if (el.isContentEditable) return true
        const tag = String(el.tagName || '').toUpperCase()
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
          if (tag === 'INPUT') {
            const t = String(el.type || '').toLowerCase()
            // 按钮类不应吞掉快捷键；其余含文本框、勾选等，焦点在表单内不误删画布
            if (t === 'button' || t === 'submit' || t === 'reset' || t === 'image') return false
          }
          return true
        }
        return false
      }
      // 以焦点元素为准：组件配置抽屉、ElementUI 输入框等场景下最可靠
      const active = document.activeElement
      if (isEditable(active)) return true
      const t = e.target
      if (isEditable(t)) return true
      if (t && typeof t.closest === 'function') {
        const hit = t.closest('input, textarea, select, [contenteditable="true"]')
        if (hit) return true
      }
      return false
    },

    handleKeyDown(e) {
      // 输入框、下拉、富文本内不误删画布节点，也不拦截退格/删除
      if (this.isKeyEventFromEditableControl(e)) {
        return
      }
      // 组件配置抽屉打开时，不响应画布删除快捷键（避免焦点在按钮等控件上误删节点）
      if (this.configDrawer && this.configDrawer.visible) {
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.contextMenu.selectedCell) {
        this.graph.removeCells([this.contextMenu.selectedCell])
        this.contextMenu.visible = false
        this.contextMenu.selectedCell = null
        e.preventDefault()
      }
    },

    // 日志弹窗拖拽 - 开始拖动
    onLogMouseDown(e) {
      // 只响应左键
      if (e.button !== 0) return
      const dialog = this.$el.querySelector('.log-dialog')
      if (!dialog) return

      const rect = dialog.getBoundingClientRect()
      this.logDragging = true
      this.logDragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }

      document.addEventListener('mousemove', this.onLogMouseMove)
      document.addEventListener('mouseup', this.onLogMouseUp)
    },

    // 日志弹窗拖拽 - 拖动中
    onLogMouseMove(e) {
      if (!this.logDragging) return
      const newLeft = e.clientX - this.logDragOffset.x
      const newTop = e.clientY - this.logDragOffset.y

      this.logDialogPosition = {
        top: newTop,
        left: newLeft
      }
    },

    // 日志弹窗拖拽 - 结束拖动
    onLogMouseUp() {
      if (!this.logDragging) return
      this.logDragging = false
      document.removeEventListener('mousemove', this.onLogMouseMove)
      document.removeEventListener('mouseup', this.onLogMouseUp)
    }
  }
}
</script>

<style scoped>
.flow-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border: 1px solid #e8e8e8;
  position: relative;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  z-index: 10;
}

.toolbar-left {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.flow-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.toolbar-btn:hover {
  color: #1890ff;
}

.toolbar-btn.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toolbar-btn.is-disabled:hover {
  color: inherit;
}

.toolbar-btn-txt {
  margin-left: 5px;
}

.sidebar {
  position: absolute;
  top: 60px;
  left: 10px;
  width: 200px;
  background: #f0f7ff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 5;
  max-height: calc(100% - 80px);
}

.menu-section {
  background: #fff;
  border-bottom: 1px dashed #d1d1d1;
}

.menu-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  padding: 10px 16px;
  background: #f0f7ff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-title:hover {
  background: #f0f7ff;
}

.menu-icon {
  font-size: 16px;
  margin-right: 8px;
}

.menu-icon-img {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  object-fit: contain;
}

.toggle-icon {
  font-size: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: #666;
}

.toggle-icon.rotate {
  transform: rotate(180deg);
}

.menu-items {
  padding: 8px 0;
}

.menu-item-wrap {
  display: block;
  width: 100%;
}

.menu-item-wrap ::v-deep .el-tooltip {
  display: block;
  width: 95%;
}

.component-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  margin: 4px 6px;
  width: calc(100% - 12px);
  box-sizing: border-box;
  min-height: 34px;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  transition: all 0.2s ease;
  background: #fff;
  border: 1px solid #fff;
  border-radius: 2%;
  box-shadow: 0 -1px 0 0 rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.1);
}

.component-item-content {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.component-item:hover {
  background: #f0f7ff;
  border-color: #5F95FF;
  box-shadow: 0 -1px 0 0 rgba(0, 0, 0, 0.05), 0 3px 8px rgba(95, 149, 255, 0.2);
  transform: translateY(-1px);
}

.component-item:active {
  transform: translateY(0);
}

.component-item.is-disabled {
  opacity: 0.45;
  filter: grayscale(0.9);
  cursor: not-allowed;
  box-shadow: 0 -1px 0 0 rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06);
}

.component-item.is-disabled:hover {
  background: #fff;
  border-color: #fff;
  box-shadow: 0 -1px 0 0 rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06);
  transform: none;
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  width: 16px;
  height: 16px;
  text-align: center;
  flex: 0 0 16px;
}

.icon-img {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  object-fit: contain;
  display: block;
}

.label {
  flex: 1 1 auto;
  min-width: 0;
  line-height: 16px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.graph-container {
  flex: 1;
  background: #fff;
  position: relative;
  height: 100%;
  width: 100%;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 100px;
}

.menu-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.menu-item:hover {
  background: #f5f5f5;
}

/* 数据分发模式选择对话框 */
.distribution-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 400px;
  max-width: 90%;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.dialog-body {
  padding: 24px 16px;
}

.dialog-body p {
  margin: 0 0 24px 0;
  color: #666;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 8px 24px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.distribute-btn:hover {
  border-color: #5f95ff;
  color: #5f95ff;
}

.copy-btn {
  background: #5f95ff;
  color: white;
  border-color: #5f95ff;
}

.copy-btn:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

/* 组件配置抽屉样式已迁移至 ConfigDrawer.vue，勿在此重复写 .config-drawer（Vue2 父 scoped 会作用到子根节点，覆盖子组件 z-index） */

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  background: #f5f5f5;
}

.drawer-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.drawer-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.config-form {
  width: 100%;
}

.form-item {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.form-label {
  width: 100px;
  font-weight: 600;
  color: #333;
  margin-right: 16px;
  text-align: right;
  flex-shrink: 0;
}

.form-input,
.form-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
  width: 100%;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #5f95ff;
  box-shadow: 0 0 0 2px rgba(95, 149, 255, 0.2);
}

.form-input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.form-actions {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.primary-btn {
  background: #5f95ff;
  color: white;
  border-color: #5f95ff;
}

.primary-btn:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.secondary-btn {
  background: white;
  color: #333;
}

.secondary-btn:hover {
  border-color: #5f95ff;
  color: #5f95ff;
}

/* 日志弹窗样式 */
.log-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 10000;
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.log-dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 1000px;
  min-height: 60vh;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.log-dialog.is-movable {
  transform: none;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  cursor: grab;
  user-select: none;
}

.log-header.dragging {
  cursor: grabbing;
}

.log-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}

.log-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background-color: #409eff;
  margin-right: 8px;
  border-radius: 2px;
}

.close-log {
  background: none;
  border: none;
  font-size: 22px;
  color: #909399;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s;
  outline: none;
}

.close-log:hover {
  color: #f56c6c;
}

.log-body {
  flex: 1;
  padding: 12px 20px 20px;
  overflow: auto;
  background-color: #fff;
  max-height: calc(80vh - 54px);
}

/* 滚动条样式 */
.log-body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.log-body::-webkit-scrollbar-track {
  background: transparent;
}
.log-body::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}
.log-body::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.log-content {
  margin: 0;
  padding: 4px 0 0;
  background-color: transparent;
  border: none;
  border-radius: 0;
  white-space: pre-wrap;
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.65;
  color: #606266;
  box-shadow: none;
}

.log-line {
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
  transition: background-color 0.2s;
}

.log-line:hover {
  background-color: #f0f4ff;
}

.log-line--fail {
  color: #f56c6c;
  background-color: #fef0f0;
}

.log-line--fail:hover {
  background-color: #fde2e2;
}
</style>
