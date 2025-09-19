<template>
  <div ref="container" class="x6-canvas" />
</template>
<script>
import { Graph } from '@antv/x6'

export default {
  name: 'FlowChart',
  props: {
    // flowId: {
    //   type: Number,
    //   default: 0
    // }
  },
  data() {
    return {}
  },

  created() {},

  mounted() {
    this.initGraph()
    window.addEventListener('resize', this.handleResize)
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    handleResize() {
      if (this.$graph && this.$refs.container) {
        this.$graph.resize(
          this.$refs.container.clientWidth,
          this.$refs.container.clientHeight
        )
      }
    },

    // 初始化画布
    initGraph() {
      var container = this.$refs.container
      var graph = new Graph({
        container: container,
        width: container.clientWidth,
        height: container.clientHeight,
        autoResize: true, // 启用自动尺寸调整
        grid: {
          visible: true, // 启用网格背景
          type: 'doubleMesh', // 网格类型（双线网格）
          args: [
            { color: '#eee', thickness: 1 }, // 主网格线样式
            { color: '#ddd', thickness: 1, factor: 4 } // 次级网格线样式
          ]
        },
        scroller: { enabled: true }, // 启用画布滚动
        background: {
          color: '#fff' // 设置画布底色
        },
        panning: true, // 启用画布拖拽平移
        mousewheel: true, // 支持滚轮缩放
        // 启用连线交互配置
        connecting: {
          // allowBlank: false, // 不允许连接到空白位置
          allowMulti: false, // 不允许一条线连接多个目标
          allowLoop: false, // 不允许循环连接（自己连自己）
          // allowNode: false, // 不允许直接连接到节点（必须通过连接桩）
          snap: true, // 自动对齐到连接桩
          highlight: true, // 拖拽时高亮可连接的连接桩
          connectionPoint: 'anchor', // 自动对齐到连接桩中心
          // 创建新连线时的回调（保持原有贝塞尔曲线样式）
          createEdge: () => this.createEdge(),
          // 验证连接有效性
          validateConnection: ({ sourceMagnet, targetMagnet }) => {
            return !!sourceMagnet && !!targetMagnet // 必须连接两个有效桩
          }
        }
      })

      // 创建连线时使用 X6 的工厂方法
      this.$graph = graph // 将 graph 实例挂载到 Vue 组件

      // 阻止画布默认右键菜单
      container.addEventListener('contextmenu', (e) => e.preventDefault())

      // 右键删除连线逻辑
      graph.on('cell:contextmenu', ({ e, cell }) => {
        e.preventDefault() // 阻止默认右键菜单
        if (cell.isEdge()) {
          // 仅处理连线
          const confirmDelete = confirm('确定删除该连线吗？')
          if (confirmDelete) {
            cell.remove() // 删除连线
          }
        }
      })

      // initGraph 方法中修改事件监听
      graph.on('edge:connected', ({ edge }) => {
        if (!edge.getSourceCell() || !edge.getTargetCell()) {
          edge.remove() // 自动移除无效连线
        }
      })

      // 定义阴影滤镜
      graph.defineFilter({
        id: 'node-hover-shadow',
        name: 'dropShadow',
        args: {
          dx: 0,
          dy: 2,
          blur: 12,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      })

      // 监听节点悬停事件
      graph.on('node:mouseenter', ({ node }) => {
        const ports = node.getPorts()
        ports.forEach((port) => {
          node.portProp(port.id, 'attrs/circle/visibility', 'visible')
        })

        // 如果还要加阴影效果也放这里
        node.attr('body/filter', {
          name: 'dropShadow',
          args: {
            dx: 0,
            dy: 2,
            blur: 12,
            color: 'rgba(0, 0, 0, 0.1)'
          }
        })
      })

      // 鼠标离开节点
      graph.on('node:mouseleave', ({ node }) => {
        const ports = node.getPorts()
        ports.forEach((port) => {
          node.portProp(port.id, 'attrs/circle/visibility', 'hidden')
        })

        // 恢复原样
        node.attr('body/filter', {
          name: 'dropShadow',
          args: {
            dx: -1,
            dy: 2,
            blur: 4,
            color: 'rgba(0, 0, 0, 0.1)'
          }
        })
      })

      var sourceImg =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAADTklEQVR4Xu2aMWgUURCGZ14MXrKHRjFgYyEWoiB2StKIFhIQFZtYKIKVCOptCsHCQNAiTSB3hwqiYqWdIY2VgjYGgphCBWMnigRjJEZ2z3i6O84FL1w05763m9tbsnPVwv7z3ptvZ+bN2z2ElP8w5f6DAJAISDkBSYGUB4AUQUkBSYGUE5AUMA2AbMEnU5u49LywkptTlsl8xhEgAP5EAJObWb8WPprQbpR2bh62EMJGInBdW2VN5gkdAVs7/LHRI363yWSN0vY8UONTrtobawoIAIkASQGpAVIEZReQbTC9fcCGDEwMdHktjWpuTMbtf9YC38qwO9ZO0GSBcWlj7QQJ6L6bazmh4xwfoN76hEMlG29p6YvUCUTTZR93lvvwTZANjz/KmqMCIM7jsESApIDUACmCad8F7jGAk0FbVOV+Nu9P+sjbYA5v6+hhiDZlW+lzWeGO8nmcDLKpboNAMOPYqjNIX3s/9CuxBO4C+z3Cg99tHE8dAKvg3QFSBdfGlybOV7RRIiAxKQB3KQOncd7U+YgA4BUCjehNiue4TR1j/YSOng817Yh40Qe6rvj1e10bUpzzeE1nzHqa8BFAMI0IgX16ZWJ2aA9rP/DllOZiW1nXzXbP2a60nA3f8xhSzsnha80xl5WFB5CgTlAARCAgEWAKr/pxNEl9gKkPq64REgARCEgNMIVXUwMa2glaa+gdN6rbuL399N81FmkdbAYXetEz9SViJ0iNAzBMHW0I2wMPNqyzFD3mMH7vzGIvDOAvUwiJTAEtJ25SqzVPL9iBXQt6ghHnKx43hRAeQCNaYYI5pw1PwRmc04HQXqSziuhGVcvnjYduBo+x/U8d+0gpoDuBgc7xfdxX6kOtA1N13H8gEDxy2/BQLQQr7zt8plj495iTU0seeugIMHAsUFr5oMEfTg4E5nydkawi2Ug0vBgJf0FYUQCB3jRJYBXoEh+3B5dAUHgYLuCPVACoON5eoH4FdGXxGRA8dRT2WD59WbEUaNID1p42m/euAuLlmsL4hK+7ONczK1IDtFfSRKGV94b5ZYm93BIiF8Em+mU0dT0IqxYAf3uY5Ve8HUGUBEDUPiCIcLPupz4CwoI37gTDTpRUOwGQ1CcT17p+A9WgaG6dEb5nAAAAAElFTkSuQmCC'
      graph.addNode({
        ...this.createNode(
          'rect',
          540,
          240,
          '关系表输入',
          6,
          6,
          sourceImg,
          28,
          28,
          12,
          4
        ),
        ports: this.createPorts() // 为节点添加连接桩
      })

      var targetImg =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAArZJREFUeF7tmsFq20AQhkcKCBwnTeo2hEKvoeQlQvoQLfQFSnHpIeBLDyXyM5SaXvoCyRPkZOeSky859FCcnAolpJAeCzbeKSu0rlAiezXWWrvS6GKwPaP9v52d3dldD+Kn1RudAMDpXXvvVH1Xh09PiozFv4oFv64TBC8lXnV6bSBIALLnZfinn1pAUEMgF4Ttz6ND3xeHSWJ371+ELuaMCECcB7QhRADWoK9sEWDwp7330mkAeSBUFoAuhEoD0IFQeQCLIIgp/K5kDkgnsXlTZHLqXCYJyncgQLusBDqbBbIaMAfCzIQKQMe3aTALASwYDlH7KABsEC/bfg+ATHAPUffXYCdjxZgbwO7X6zcTFO9M926mf4QD9ds9AI97o74H8CCELId5IuDo4mejETzfLkv8t+HVh4mAj6UAOLrARiOA0sRL0aUBsEG8NgBKeM6rBd4Of60/hWdbFL9F2yyMgKJfGA5xfQxghXitCCgSgG3iVwqgc3bTDJ7sPioSaBG+VjIEOpc3zWBin/iVREDnEpvBBKzreRU9RiPAdvFGIyDs326MN3c2ixinJn0YiYDwO26M/4L14o1EgEviCwcgq7op4r7JkDXhWyB+yiyGdF9oSz2v296s/2ltiKSNpXjq+WGrN0JA0V3mIEX6yFOCJ9vf+vIjBM8/JkeA2sOjHoQ4DUCFPZW+pO4sgOSYryWA5FYZA1jiMNTZIcARkNgt5iHAQ4B+IYJzgKsrQU6CnAT/nxnyLMCzAAxwCl1KLR5drUHRFcIfUOyljfQho5DShuh+I6UcphybUwWu0k57QyQ9C1Doq95zPgI4CXIS5KUw+XI01wJcCzi6Lc7FEBdDXAzNbpDyQogXQrwQ4oWQh+KcVLbKWhwFaS9h9j7PP5Z5aKk2xM5I5TBJuKVGDEC3Y6q6I/QPGy+gmbRCmB4AAAAASUVORK5CYII='
      graph.addNode({
        ...this.createNode(
          'rect',
          860,
          240,
          '关系表输出',
          6,
          6,
          targetImg,
          20,
          20,
          12,
          8
        ),
        ports: this.createPorts() // 为节点添加连接桩
      })
    },

    /**
     * 连线
     * @param source 来源节点
     * @param target 目标节点
     */
    createEdge(source, target) {
      // 使用 X6 的 Edge 构造函数
      return this.$graph.createEdge({
        source: source ? { cell: source.cell, port: source.port } : null,
        target: target ? { cell: target.cell, port: target.port } : null,
        attrs: {
          line: {
            stroke: '#8f8f8f',
            targetMarker: { name: 'block', size: 6 }
          }
        },
        connector: { name: 'smooth', args: { type: 'cubic' }},
        router: { name: 'manhattan' }
      })
    },

    /**
     * 创建节点
     */
    createNode(
      shape,
      nodeX,
      nodeY,
      nodeLable,
      bodyX,
      bodyY,
      img,
      imgWidth,
      imgHeight,
      imgX,
      imgY
    ) {
      return {
        shape: shape,
        x: nodeX,
        y: nodeY,
        width: 180,
        height: 40,
        label: nodeLable,
        markup: this.createMarkup(),
        attrs: this.createNodeAttrs(
          bodyX,
          bodyY,
          img,
          imgWidth,
          imgHeight,
          imgX,
          imgY
        )
      }
    },

    /**
     * 创建Markup
     */
    createMarkup() {
      return [
        {
          tagName: 'rect',
          selector: 'body'
        },
        {
          tagName: 'image',
          selector: 'img'
        },
        {
          tagName: 'text',
          selector: 'label'
        }
      ]
    },

    /**
     * 创建attrs属性
     */
    createNodeAttrs(bodyX, bodyY, img, imgWidth, imgHeight, imgX, imgY) {
      return {
        body: this.createBody(bodyX, bodyY),
        img: this.createImg(img, imgWidth, imgHeight, imgX, imgY),
        label: {
          fontSize: 14,
          fill: '#555',
          refX: '50%', // 水平居中
          refY: '50%', // 位于节点底部
          textAnchor: 'middle' // 文本居中
          // textVerticalAnchor: 'bottom'
        }
      }
    },

    /**
     * 创建body
     * @param x x轴
     * @param y y轴
     */
    createBody(x, y) {
      return {
        stroke: '#fff', // #5da8ff 边框色
        strokeWidth: 1, // 边框厚度
        fill: '#fff', // 背景色 #f9fdff | 透明 transparent
        rx: x,
        ry: y,
        filter: {
          name: 'dropShadow',
          args: {
            dx: -1,
            dy: 2,
            blur: 4,
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    },

    /**
     * 创建img
     * @param img base64
     * @param width 长度
     * @param heigh 高度
     * @param x x轴
     * @param y y轴
     */
    createImg(img, width, height, x, y) {
      return {
        'xlink:href': img,
        width: width,
        height: height,
        x: x,
        y: y
      }
    },

    // 创建连接桩配置
    createPorts() {
      return {
        groups: {
          // 连接桩组定义（四个方向）
          // top: { position: 'top', attrs: { circle: { r: 4, magnet: true, stroke: '#5da8ff', fill: '#fff', cursor: 'pointer', 'stroke-width': 2, style: { transition: 'r 0.3s, stroke-width 0.3s' }}}},
          // bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: true, stroke: '#5da8ff', fill: '#fff', cursor: 'pointer', 'stroke-width': 2, style: { transition: 'r 0.3s, stroke-width 0.3s' }}}},
          left: {
            position: 'left',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#5da8ff',
                fill: '#fff',
                cursor: 'pointer',
                'stroke-width': 2,
                style: { transition: 'r 0.3s, stroke-width 0.3s' },
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
                stroke: '#5da8ff',
                fill: '#fff',
                cursor: 'pointer',
                'stroke-width': 2,
                style: { transition: 'r 0.3s, stroke-width 0.3s' },
                visibility: 'hidden'
              }
            }
          }
        },
        // 默认在每个方向放置一个连接桩
        items: [
          // { id: 'top', group: 'top' },
          // { id: 'bottom', group: 'bottom' },
          { id: 'left', group: 'left' },
          { id: 'right', group: 'right' }
        ]
      }
    },

    handleOpen1(key, keyPath) {
      console.log(key, keyPath)
    },
    handleClose1(key, keyPath) {
      console.log(key, keyPath)
    }
  }
}
</script>

<style scoped>
.x6-canvas {
  background: #f8fafc;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  flex: 1;
  height: 100%;
  width: 100%;
}
</style>
