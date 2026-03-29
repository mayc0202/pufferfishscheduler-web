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
            class="component-item"
            draggable="true"
            @dragstart="onDragStart($event, item)"
          >
            <span
              v-if="!item.icon || !item.icon.startsWith('data:image')"
              class="icon"
            >{{ item.icon }}</span>
            <img v-else class="icon-img" :src="item.icon" alt="">
            <span class="label">{{ item.label }}</span>
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
        flowConfig: null
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
      isStopping: false
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
    if (this.graph) {
      this.graph.dispose()
    }
    document.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },
  methods: {
    isCleanTransformType(code) {
      return ['DataCleanTransform', 'DataCleanConvert', 'DataCleanConversion', 'CleanTransform', 'DataClean'].includes(code)
    },

    // 该方法已不再用于构建 node.data，新节点直接使用 buildFrontendNodeData 构建扁平结构
    // 保留此方法仅为兼容旧代码或特定场景，但其返回值不再嵌套 data
    buildBackendConfigForNewNode(item) {
      const name = item?.label || ''
      const code = item?.code || ''

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
          this.$message.error('网络请求超时...')
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
        // 检查画布上是否有组件
        const hasComponents = flowData.cells && flowData.cells.length > 0
        const configData = {
          id: this.flowId,
          config: hasComponents ? JSON.stringify(flowData) : null
        }
        const res = await setConfig(configData)
        if (res.code === '000000') {
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
            if (wasRunning && !res.data) {
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
          fontSize: 14,
          fill: '#555',
          refX: '50%',
          refY: '50%',
          textAnchor: 'middle'
        }
      }
      if (img) {
        attrs.img = this.createImg(img, imgWidth, imgHeight, imgX, imgY)
      }
      return attrs
    },

    createBody(x, y) {
      return {
        stroke: '#fff',
        strokeWidth: 1,
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
            return this.graph.createEdge({
              attrs: {
                line: {
                  stroke: '#8f8f8f',
                  strokeWidth: 2,
                  targetMarker: { name: 'block', size: 6 }
                }
              },
              connector: { name: 'smooth', args: { type: 'cubic' }},
              router: { name: 'manhattan' },
              zIndex: 0
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
        const nodeData = node.getData() || {}
        const label = node.attr('label/text')
        const componentType = nodeData.code

        // 基础字段
        const baseForm = {
          name: nodeData.name || label || '',
          code: nodeData.code || '',
          description: nodeData.data?.description || '' // 从 nodeData.data 中取 description
        }

        // 真实的 formData 数据在 nodeData.data 中
        const realFormData = nodeData.data || {}

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

        // 根据组件类型构建表单数据
        let formData
        if (componentType === 'TableInput') {
          formData = { ...formDataToEdit, ...tableInputFields }
        } else if (componentType === 'TableOutput') {
          formData = { ...formDataToEdit, ...tableOutputFields }
        } else if (this.isCleanTransformType(componentType)) {
          formData = { ...formDataToEdit } // CleanTransformFields 已经包含在 realFormData 中，直接使用 formDataToEdit
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
          flowConfig: flowConfig
        }
      })

      this.graph.on('blank:click', () => {
        this.contextMenu.visible = false
      })

      this.graph.on('canvas:mouseleave', () => {
        this.contextMenu.visible = false
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
          setTimeout(() => {
            const outgoingEdges = this.graph.getOutgoingEdges(sourceCell)
            if (outgoingEdges && outgoingEdges.length > 1) {
              this.showDistributionDialog(edge)
            }
          }, 100)
        }
      })

      // 监听画布编辑操作，标记为已修改
      this.graph.on('cell:added', () => {
        this.hasChange = true
      })

      this.graph.on('cell:removed', () => {
        this.hasChange = true
      })

      this.graph.on('cell:change:*', () => {
        this.hasChange = true
      })
    },

    handleConfigDrawerSave(formData) {
      const node = this.configDrawer.currentNode
      if (node) {
        const nodeData = node.getData() || {}
        // 后端 create(String config, ...) 期望：
        // config = { name: string, code: string, data: { ...真实参数... } }
        const newData = {
          ...nodeData,
          name: formData.name,
          code: formData.code,
          data: { ...formData } // 扁平化，直接将 formData 作为 data 存储
        }
        console.log(newData)
        node.setData(newData)
        node.attr('label/text', formData.name)
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
        const point = this.graph.clientToLocal(e.clientX, e.clientY)
        const nodeConfig = this.createNode(
          'rect',
          point.x - 90,
          point.y - 20,
          item.label,
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
          data: this.buildFrontendNodeData(item), // 直接使用扁平化的前端节点数据
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

    // 新增：构建前端节点数据结构，确保扁平化
    buildFrontendNodeData(item) {
      const name = item?.label || ''
      const code = item?.code || ''
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
      }

      return {
        type: item.type,
        name: item.label,
        code: item.code,
        data: initialFormData // 这里直接是扁平的 formData
      }
    },

    deleteSelectedItem() {
      if (this.contextMenu.selectedCell) {
        this.graph.removeCells([this.contextMenu.selectedCell])
        this.contextMenu.visible = false
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
        node.setData({ ...nodeData, ...this.configDrawer.form })
        node.attr('label/text', this.configDrawer.form.name)
        this.configDrawer.visible = false
        this.$message.success('配置保存成功')
      }
    },

    handleKeyDown(e) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.contextMenu.selectedCell) {
        this.graph.removeCells([this.contextMenu.selectedCell])
        this.contextMenu.visible = false
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

.component-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  transition: all 0.2s ease;
  background: #fff;
  border: 1px solid #fff;
  border-radius: 2%;
  box-shadow: 0 -1px 0 0 rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.1);
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

.icon {
  font-size: 20px;
  margin-right: 8px;
}

.icon-img {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  object-fit: contain;
}

.label {
  flex: 1;
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
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
}

.log-dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #FFF;
  border-radius: 4px;
  width: 90%;
  max-width: 1000px;
  min-height: 50vh;
  max-height: 50vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.log-dialog.is-movable {
  transform: none;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  cursor: grab;
}

.log-header.dragging {
  cursor: grabbing;
}

.log-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.close-log {
  background: none;
  border: none;
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.close-log:hover {
  color: #606266;
}

.log-body {
  flex: 1;
  padding: 20px;
  overflow: auto;
  max-height: calc(80vh - 60px);
}

.log-content {
  margin: 0;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.log-line {
  color: #333;
}

.log-line--fail {
  color: #f56c6c;
}
</style>
