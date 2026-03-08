<template>
  <div class="flow-editor">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div>清洗流程设计</div>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="saveFlow">保存</button>
        <button class="toolbar-btn" @click="executeFlowHandler">运行</button>
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
          <span
            class="toggle-icon"
            :class="{ rotate: menuState[menu.id] }"
          >▼</span>
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
      @close="handleConfigDrawerClose"
      @save="handleConfigDrawerSave"
    />
  </div>
</template>

<script>
import { Graph } from '@antv/x6'
import { getTransComponentTree } from '@/api/collect/trans/transComponent'
import { setConfig, getFlowDetail, executeFlow } from '@/api/collect/trans/transFlow'
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
        }
      }
    }
  },
  mounted() {
    this.loadComponentTree()
    this.$nextTick(() => {
      this.initGraph()
      if (this.flowId) {
        this.loadFlowConfig()
      }
    })
    document.addEventListener('keydown', this.handleKeyDown)
  },
  beforeDestroy() {
    if (this.graph) {
      this.graph.dispose()
    }
    document.removeEventListener('keydown', this.handleKeyDown)
  },
  methods: {
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

    async saveFlow() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在，无法保存')
        return
      }
      try {
        const flowData = this.graph.toJSON()
        const configData = {
          id: this.flowId,
          config: JSON.stringify(flowData)
        }
        const res = await setConfig(configData)
        if (res.code === '000000') {
          this.$message.success('流程保存成功')
        } else {
          this.$message.error(res.message || '保存失败')
        }
      } catch (error) {
        console.error('保存流程失败:', error)
        this.$message.error('保存流程失败')
      }
    },

    async loadFlowConfig() {
      if (!this.flowId) return
      try {
        const res = await getFlowDetail(this.flowId)
        if (res.code === '000000' && res.data && res.data.config) {
          const flowData = JSON.parse(res.data.config)
          this.graph.clearCells()
          this.graph.fromJSON(flowData)
          this.$message.success('流程加载成功')
        }
      } catch (error) {
        console.error('加载流程失败:', error)
      }
    },

    async executeFlowHandler() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在，无法运行')
        return
      }
      try {
        const res = await executeFlow(this.flowId)
        if (res.code === '000000') {
          this.$message.success('转换流程启动成功！')
        } else {
          this.$message.error(res.message || '流程启动失败')
        }
      } catch (error) {
        console.error('执行流程失败:', error)
        this.$message.error('流程启动失败')
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
          allowMulti: false,
          allowLoop: false,
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
        // 从 data 对象中读取表输入和表输出的配置数据
        const componentData = nodeData.data || nodeData
        this.configDrawer = {
          visible: true,
          currentNode: node,
          componentType: nodeData.code,
          form: {
            name: componentData.name || label || '',
            type: componentData.code || '',
            dbId: componentData.dbId || '',
            dataSourceId: componentData.dataSourceId || '',
            dbConnection: componentData.dbConnection || '',
            tableName: componentData.tableName || '',
            targetTable: componentData.targetTable || '',
            updateField: componentData.updateField || '',
            outputPath: componentData.outputPath || '',
            fileFormat: componentData.fileFormat || '',
            commitSize: componentData.commitSize || '',
            preSql: componentData.preSql || '',
            postSql: componentData.postSql || '',
            fieldList: componentData.fieldList || [],
            updatePolicy: componentData.updatePolicy || '',
            skipHeader: componentData.skipHeader || false,
            ignoreError: componentData.ignoreError || false,
            retryTimes: componentData.retryTimes || '',
            retryInterval: componentData.retryInterval || ''
          }
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
    },

    handleConfigDrawerClose() {
      this.configDrawer.visible = false
    },

    handleConfigDrawerSave(formData) {
      const node = this.configDrawer.currentNode
      if (node) {
        const nodeData = node.getData() || {}
        // 为表输入和表输出组件添加 data 包装，与后端期望的JSON结构保持一致
        if (this.configDrawer.componentType === 'TableInput' || this.configDrawer.componentType === 'TableOutput') {
          // 确保 data 对象存在
          if (!nodeData.data) {
            nodeData.data = {}
          }
          // 将所有表单数据放入 data 对象中
          nodeData.data = { ...formData }
        } else {
          // 其他组件保持原有结构
          nodeData = { ...nodeData, ...formData }
        }
        node.setData({ ...nodeData })
        node.attr('label/text', formData.name)
        this.configDrawer.visible = false
        this.$message?.success('配置保存成功') || alert('配置保存成功')
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
          data: {
            type: item.type,
            name: item.label,
            code: item.code
          },
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
        this.$message?.success('配置保存成功') || alert('配置保存成功')
      }
    },

    handleKeyDown(e) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.contextMenu.selectedCell) {
        this.graph.removeCells([this.contextMenu.selectedCell])
        this.contextMenu.visible = false
        e.preventDefault()
      }
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
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
  z-index: 10;
}

.toolbar-left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
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
  padding: 6px 16px;
  background: #5f95ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.toolbar-btn:hover {
  background: #40a9ff;
}

.toolbar-btn:active {
  background: #1890ff;
}

.sidebar {
  position: absolute;
  top: 60px;
  left: 10px;
  width: 200px;
  background: rgba(245, 245, 245, 0.95);
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  z-index: 5;
  max-height: calc(100% - 80px);
}

.menu-section {
  margin-bottom: 8px;
}

.menu-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  padding: 10px 16px;
  background: #f0f0f0;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-title:hover {
  background: #e8f0ff;
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
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.3s ease;
}

.component-item:hover {
  background: #e8f0ff;
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

/* 组件配置抽屉样式 */
.config-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

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
</style>
