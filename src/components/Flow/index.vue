<template>
  <div class="flow-editor">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div>清洗流程设计</div>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="saveFlow">保存</button>
        <button class="toolbar-btn" @click="loadFlow">加载</button>
        <button class="toolbar-btn" @click="centerCanvas">运行</button>
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
          <span>{{ menu.name }}</span>
          <span
            class="toggle-icon"
            :class="{ rotate: menuState[menu.id] }"
          >▼</span>
        </div>
        <div v-show="menuState[menu.id]" class="menu-items">
          <div
            v-for="item in menu.items"
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

    <!-- 组件配置抽屉 -->
    <div v-if="configDrawer.visible" class="config-drawer">
      <div class="drawer-content">
        <div class="drawer-header">
          <h3>组件配置</h3>
          <button class="close-btn" @click="configDrawer.visible = false">
            ×
          </button>
        </div>
        <div class="drawer-body">
          <form class="config-form" @submit.prevent="saveComponentConfig">
            <div class="form-item">
              <label class="form-label">组件名称</label>
              <input
                v-model="configDrawer.form.name"
                type="text"
                class="form-input"
                placeholder="请输入组件名称"
              >
            </div>

            <div class="form-item">
              <label class="form-label">组件类型</label>
              <input
                v-model="configDrawer.form.type"
                type="text"
                class="form-input"
                disabled
              >
            </div>

            <!-- 其他配置项，根据组件类型动态生成 -->
            <template v-if="configDrawer.form.type === 'input'">
              <div class="form-item">
                <label class="form-label">数据库连接</label>
                <select
                  v-model="configDrawer.form.dbConnection"
                  class="form-select"
                >
                  <option value="">请选择</option>
                  <option value="conn1">连接1</option>
                  <option value="conn2">连接2</option>
                </select>
              </div>
              <div class="form-item">
                <label class="form-label">表名</label>
                <input
                  v-model="configDrawer.form.tableName"
                  type="text"
                  class="form-input"
                  placeholder="请输入表名"
                >
              </div>
            </template>

            <template v-else-if="configDrawer.form.type === 'upset'">
              <div class="form-item">
                <label class="form-label">目标表</label>
                <input
                  v-model="configDrawer.form.targetTable"
                  type="text"
                  class="form-input"
                  placeholder="请输入目标表名"
                >
              </div>
              <div class="form-item">
                <label class="form-label">更新字段</label>
                <input
                  v-model="configDrawer.form.updateField"
                  type="text"
                  class="form-input"
                  placeholder="请输入更新字段"
                >
              </div>
            </template>

            <template v-else-if="configDrawer.form.type === 'output'">
              <div class="form-item">
                <label class="form-label">输出路径</label>
                <input
                  v-model="configDrawer.form.outputPath"
                  type="text"
                  class="form-input"
                  placeholder="请输入输出路径"
                >
              </div>
              <div class="form-item">
                <label class="form-label">文件格式</label>
                <select
                  v-model="configDrawer.form.fileFormat"
                  class="form-select"
                >
                  <option value="">请选择</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>
            </template>

            <div class="form-actions">
              <button type="submit" class="btn primary-btn">保存配置</button>
              <button
                type="button"
                class="btn secondary-btn"
                @click="configDrawer.visible = false"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Graph } from '@antv/x6'

export default {
  name: 'FlowEditor',
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
        '1': true,
        '2': false,
        'etl': false,
        'switch': false,
        'script': false,
        'file_transfer': false,
        'other': false
      },
      distributionDialog: {
        visible: false,
        currentEdge: null
      },
      configDrawer: {
        visible: false,
        currentNode: null,
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
      },
      // 菜单配置
      menuConfig: [
        {
          id: '1',
          name: '输入',
          icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABItJREFUeF7tWz1sHEUUfm92LmcLJBoKMBCCEyGEBEJCIhKhcBQkRCAit0fcIhIpd2sDFQUFiET8FUgUiNzuFSBqm9t1gaAICEtBUNFYVFESQoCkoKRwTjuzL+zZZ298u7eze7ebu/O69My8N9/33sx7894twi7/w12OHwoCCg/Y5QzEHoHPv6MyX28/gJ62dxCuGPErtXm8NoiMLNb2JcCyZZ0Q3gOimSEpXwVJZ40TpdUhyesR02zR/ZLkQURAo8qdOD2RBFgOHSGSP8QJSDUu6fAwSTBtehlJHgPEZwjoqe6eDJ3HenjoBN/t99z01gjo0QDAQa0215VFQBfFFH/yraPYTkXg5qIOcJSnieDYbXIQrwOxmqHjt3HyQwloOrTfI3lpa/EQLGYuu3Og4U9dmQy1A7UKXo7bYNi4tUKPe1J+hAjHe8fxt7JgL56cx39VZIcSsGOzq4bOD6sIi5tj2sInYMMTUpJqOeIUEX4IQPf16CNoGFW+GLeP4PhYEWDZ8m0C+jQC4PeGzo8mAe/PHRsCGrZ4HQG+igLIqD1Tq951YyIJaK60n/A8bS0KHAG+saBr55KCHxsPMG33EwB8J9r62kytiomtPxYENJfoHq8k14AgKhP91dD5s2msPxYEmI40gKgRBdAjOrtYLZ2ZXAJs8SUAnIwEiPimUdG+mGQCfgaAQ5EXoAeVhVf5ysQRcK7ldtyaMbYIRPf2AdhJ0RHo47peOp+UiJHMA0xbUFIg/2eYqTLWkSSgYYsLCPBcQhIcQ+d6wjWjmQk2WuIlRIh9yW2DxcsM3RdqlanEj6uR9AAfmNVyPyDEd5UsSqCrFD/CZI0sAf5mTUecB4Ln+5Ew0XnA5hvgFwC4O4KEVOc+KCu8ILJEez0u/9yamPLtHlTUUxAR2sMqRdKmI097RM1eAtKf+1gCOu4XLF5srBhaSSxpyDJt8TUAvHYbCQOcezUCdpSwlC4jxUkqxcqgqM+WaHqaexcA6Gn//4OeeyUCOl6w7M6RBk0EDBZHFWGGOC3Acl3n82kFNL4Rx5FpQqXYqaojtmzsV4jLbXjQE+IhVaGh87i4alSmrw4kI4PFsQRkoHOkRBYEqJij6YdFFLMqc6PmEJPXxHT5H5VmSJ76Yj0gJBym5oEILjFG9Xql9GOUkLz19SUg5bM0nqCIxCpvff5Go5ujtlgigBMBNJkmQlbO+rq4wh9Dzvo+oNIfW+AzSIWDrTEzD33oPhIWhu/YazCYzd3JXmRBQNiNlYdFCg8INDTyIDyqHV8cgeIIhDCQh0sWd0BxB2x3dfPwuOISjMhmiyhQRIEiCvQykMelVITBIgyOcBhstG7OIvLtXnvGBZE89BGJ/QvVqSs7D3zkz+X5uvwdEQ5kUhJDvL6HscdOvYL/+fI3vkrJVp9bZrNhFek+H0y4R4gwkw8m/I856rpmBa1hOfnq61sT7A5uRoP3t37iHl/v7TsDAS8CsoV6BUPL4nnr61sVDiLpFC0F3zcIfsb5X+0y/K3SGMlTX2xjZBDQ47C2IGAcrJTlHgsPyJLdcZB9CwLBJX13AeOIAAAAAElFTkSuQmCC',
          type: 'menu',
          items: [
            {
              id: '1',
              code: 'TableInput',
              label: '表输入',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAA2RJREFUeF7tW0toE0EY/iabtOmD0tKHFgVtD0VEEcSLFSWtF71IQRRFLJbQHqQexEelRa2gB0kvxpsXUa9ir60g1noqgh4UiyBVTBGpbZVCTdMmuzIJG7MxzexsNulkM3vJhnns/3/zzf9/M7tDkHJ5D4Vb4HJ3AzgMaDsB1KeWF/H9AkA+AngBNfp4ZbLii+4L0W8qfGuXNWiBInbStOkE5Ep4wjNCG8QBKCXn/418AgSSoL0yYxo+J1VUY63E61u7CWjDTvLLvC9kmAIwCWgHzTdyUk3ymnh9q/MOiva8o7NAAdB4WzmpvgRAMkBOARkDZBB0UlTn9UVmAZkF0rJA+KWHl0WG+hUda4b/ovf33xQQ3WC77ZMApMcAuxEWvT/JAMkAmQWMawHR56zd9kklKJWg3A+Q+wGG/QC7g4zo/UkhJIWQFEJSCMkgmLqFI3rUtts+mQWkFJZSWErh0n419j60IjQAVeUu1Fa6QH/L3Mmv+nJ6d5HamIgMwJY6N+qqFNuczdSRsABsb/Cg2uvKq/PxDyVFZEAhRj75waRoANC53tLI937y52+gygtUevkJIxwDeEf/yZiKvrsxNNYCIxcUnOzkmzamAKCjkulajqj8kDNatG0u44r21HkKgn49GFBw9oh5EJgANNe6UV+dORIvLsfw/VfUVhB2bS3n6m98SkPXNaMNwYsKeo+ZA4EJAMugD7MRLoNZlVnPy9T+2YSKM7dihqJAv4L+42wQmAA01bjRVJOZAXNLMcwtbSwDdK8zgXC7T8Gl09lBYALAGjG7y9MZQCn+Ztp8rLnzyFj3eo+Cwe71QRAegL09UUx/zU2tfxv1xLNEUSjBdAaUPAAbPgWyBUHW/LcSJK1kAWpH3oKgVYN0cHjTpJXn5TUNZhNCLAZYEUq8AOQshJ6/jUSbG7Wsi+71pDALACtSuZBS+E9EAwmOrvzo2IdNLGcKVV7IxdCnkBomp4YjD4f82rlCOch6TiGXw8Gn0bH4wcmhXtdMly83scFyjKeclwU8fet1331W0e5fbU0enb13VQ3s3y0OCPncEpudV9F2Qk0cndURoeeHB/1qwOlMoCN/oDfhPPXdsM9Mp0NXp+tG+x7t6I5tpIGVHaxQj7eNHdviNNqH5rTw+JT6auB+9Hzq8fm/jS8Ysp+LrQkAAAAASUVORK5CYII=',
              type: 'plugin',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '2',
              code: 'KafkaInput',
              label: 'Kafka输入',
              icon: 'data:image/png;base64,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',
              type: 'plugin',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '3',
              code: 'RedisInput',
              label: 'Redis输入',
              icon: 'data:image/png;base64,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',
              type: 'plugin',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '4',
              code: 'MongoDBInput',
              label: 'MongoDB输入',
              icon: 'data:image/png;base64,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',
              type: 'plugin',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '5',
              code: 'JsonInput',
              label: 'Json输入',
              icon: 'data:image/png;base64,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',
              type: 'plugin',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '6',
              code: 'ExcelInput',
              label: 'Excel输入',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFfUlEQVR4nO2ae2xTVRzHv31trCtzGxvvTVrdFpx7h6hBBAwDFhYCEnwghqhARlRYTOQfH4SgaEz4Q4g6s4gPIAqKIcqcwDYohulcNhjixh5USHGsBVYYlK7do+Z3OZu3o+vrtrSR80lO7zn3nPO75/c75/zOOfcWHA6Hw+FwOBzOvYnM6XT6rfiZrnbNGVN7VqAWU8fH3Qq0bt649KYUzfhAq7sgk8n8N8Dn9fsLf2o5uhjAq4E+OGna1ECrbqKf2ZPy9C+kLdAHKmQIMoDcnwpWhw1VHbXzpCgvkc0Uak1/zrzRF/AgcsEvA/zdfVFj67OrQ6efb/QN9is7rVfGBEOWXwZghKv3xWwOlqBADPC/ghsgAtoQVu55Ayh7Hb0wmM6rm42tmRbrtURPhc03r064Yb7sVWhUrBqq6GjIlcpgtjUkKHfp9y4oP/LVWgBPBfMB45LGIyPjzs3igNOJJHWyZPmdPeYpGfGp56TKUVaf1s8LtvLE1Stm1F07Ttstl/tyhQLJPVrJ8ldq51+QLITaYzCd1wVDkDuc8P+ccbfhTtDdzXxdDmT4b+g2GE7dUaZAl+uSdlcm1Cz+6JnRnjAJwIcAqIAZQCOASgBVANq9GqDR0IRXitZg1dznhPT2ijLs1u8bzlcpVHjv+beRODYBXRYT1paV3nXlvUB60ZFTBWAKAAcAWr7IaV5gaYFRp8DHleVo6+wQ4usXlWBSwsThvHULXxaUJ3bW7BaMEGGQ8xkQNYmMMR/AHAAp4o736AO+qNkzHC9Z8KJwzbo/EytnPy3ED5+qwYG6ikhRXbzcXGc9fYOlVcwIxQBeApBDKzVleNypVJ/W40jTURTmzEVRfiH0f53A0keKhbzumxa8883WEOrjE6RYDIAJAOh4bAdgBEDDlYalhd1XMWG0MaFNSD+AJgA/eN2qvblnCx5Nn4GxMRqsKVyFBybeXsO3fr8Ng87BcBtgDuvZ6QDiAfSwXo8FoGVzfeRaTMZZDmCmTwYgtu7fhvdXbhpW/kDdQRxvrg2FQv6yms3pNABxAG6yaU3z38p63t00n86C5ykwxMj3hrfsNp/a2dtlw6DDdZTEj70PpoEOyZpfn2UhhZcBUIhui88y41jvy9xUH8brRigmagzeXfGWEG9ka/2KJ5YjffKDkhQIEq0AmgGcpK0IW+9/Z/Gz5KpGrAZD0Ei5RHGvI2Dj0lIoFbeLlR/+Gp+W3N4AbVyyAas/eS3cBviAOUE7620n8wM0Oh4GMJddY0R17MxobZTwOAIW5s3DooL5QnyXfq+w26MrkT0tE88+viyk2vnAYQA/s+tQoNfldaLVQdzJZJzjAL6kN/x0Y1QDTE6ciDeWrBfiBtN57Kj4TIjTldJEafG6cE8FWuousuHcxdLXmKLpAFKZI+xneb8B2MfCMRIwqgFo90dLH7H9YJlL3lBaLpcLS2MEQr0u/nxkYaODev4Q8w0Cbn0AHXS+O3FACHSkpbOBmNrWP7Cu7HWX8uE4DHnBzLLJL7QAqGfO0Siu5tYAvigTCQr/uGHvaFk0LRZ6qy8r3cffB8gLdDkNoRLu7I/8N0LKJ7NnVzcYmgqC/V5QI49F6tQUt3nyKIXb+77SbuzAhUtGbb42u1uSIJoG1l4rzv7TlthysS3zlt3m8cNnu/FcWlX9sR3ehA72OeGkMBC6EfDtlp2xD2kzJH0ips/jSnW0Gvm63O58Xe6v3ipUnDjU+UtNtZRnRhzcCUZAG8IKN0AEtCGscAP4UzhKFe1gHxjCTaVKqeq/6wZ4LGtG6/iEZFOYjVCZm551Mi1F5/ChrFf8/p+g2XIZVfX6mVabVROMBvhLYlxC9+JZRfUqpUqyLNoIcTgcDofD4XA49yIA/gWMmpe0gtxXjQAAAABJRU5ErkJggg==',
              type: 'plugin',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '7',
              code: 'CsvInput',
              label: 'CSV输入',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABWdJREFUeF7tm21MFEcYx/+zvAoEQQQUJKj0loPjKAioFbEa22Js06Y2RUg06ZWavn9om/RL06hNGps2qfFL+6EJZ2sFpGmKsdEYQoAYDC1HpdUSA1IFVNCKgFDkRXaaObjljntbuLdd7yYhJLuzM8//d888z8zsLIGfF+Ln+hEAEPAAHxPIqdKvDQbWmpthKNM1esssrw2BgqqKFAQRjUCJhlBoQKkGhGQCNGqhWEOpzmt2ub2jp2q+T54SqIZQgQnUAFAD4AHES/1VFQEg7+cTq7lH0xpQohEAnoDyAFEBSJUq1F49WQHYVPld4gwJzgChPCWcikDgQQkPCh4EnKtibT3vUwAFpyr2CSA8EYwCVQDhbY1TTwgX26TY4e72w8aFtuby8tGF7VrFgPxqPXV353JojwI3OOCr1lLdN+b2yBMAFQ67HRrhDgKoNZTqXpY9AE/EgDnPbjSU6iyGlyw9IADAAxMhRXkAbMQAQ1n5ITZ286v02wFhu7MYYapvqqcsADbUmYaFEQBBg0MAVDgcADDnMQEPmCOgtCFgtRw2pS+/GAKKSoPxyyKRsSIeGxKSEBEcgusPhnB7bBSX/r2NB1OTzoK1zfuKAFCUlIpXnsgyirdVbo6NoKbrCs73dC0egtzT4DvZm/DS+gxJwhpvXscRQ5Okuo4qySYNfrpxB7YmWe95XBseRERICJIio610VHf+BX3HHy5BkAUAdWw8jj39vIUQJux8bxeGJh4ar6ti4lCi0mJb8vw+J7v3VsNpDE9OLBmCLAAc3bYbmSsSRBHMtZmL2ypHtjxnDIym8mXbBdT3dUsF4CwNsqWt/UKFJrfPBPepc7BfnSN22jLQh4Mt9XaNeFWVhV2pKrB6Lf19uDx4R6p4yDILfJhbiOJUtuc5W5h4Js4TRZYAvigsRm78alHv2w2n8c/IkCf0szYdDwFfrAYrntmD5Kj5CF967hSGJmcDnzeKz4Pgry/uRwgXJGotrj3uDd1iHz4HULmrBHHhEaJBJWerMTK19LS2WHo+B/B10W5o4uZT4IH6X9A7OrJYHVLryy8NfpxXhJ0paaKAjy6cwxUHqS0xIso4XW7u78Hfg3elCjfWk2UWeD0zD3t5rSjk7I1OHGu/6HAe8IYm33j/z3v9qOvtRl3vNUkgZAmAZQA2DGLCwkUR7zWeQdfwoJUoFis+3/Is1kXHive+vfw7ars7JAGQZRpklu9Jy8Sb2o2iiMGJcRy91IzWO7fEa2uiluNAVj42r0oRrw2Mj+LdhjMYm56SCsCqns+DoMmihRMidp15Qcf9u1geGm6c/0eHhlkIOHG1HT9ebV+yePO44PMtsYRlkfggt9BioeNIGQuCn/3meBdbChnZeIDJ2Pef3IwX1rHDH/ZL5/A9fHKxbilbY/JLg7Zksm0xPnYl+JiVxv8zgoD7kw8x8N+YcenbdMv2UtnZLy7LLODMaHfe93sATtMggeMNEYJGw16dxRkDpb0YcS0NEhzybwCBl6PKfzusjDTozshv3pbfZ4EAgMAZIbNzghxHIQiuH+qePSeojGNynootFChpK9X9ZN6+LM8J2jol5goUQoJ6QNHbWvaa1assKwB5lXo14Wg6pUQNAjUhJJ1QqqbA/PaOK9ZIeNYTQdBet5LG1taTJ2Mng6e1lEINKqhBSPrchxDrJehZdBXZAbCnIK/6eBoI1UKAliNIp7Nfh7C/yEWrNntAMQBsicysqQmNmhnNpiRIS0GzAZI15zVrpEJRNAB7Igtq9KsooKWPhGyOcFpKwPbYswCELnzmsQRgD8yG6h8yODqTaDEVfhw/m5Pq/t6uJykLeNsob/YXAOBN2nLs63+qnXpuBFpXVAAAAABJRU5ErkJggg==',
              type: 'plugin',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '8',
              code: 'ApiInput',
              label: 'API输入',
              icon: 'data:image/png;base64,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',
              type: 'plugin',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '9',
              code: 'StreamDataReader',
              label: '从流中获取数据',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEEAAABACAYAAABFqxrgAAAAAXNSR0IArs4c6QAAA8BJREFUeF7tmU9oVFcUh7/z3iTSWCG0CTbiIouqtN0oisFsnNCFCOKiCyFUcWW6Ck1nVhXEZldqZyZoQZQUF4KbLBT/IJZC7KKmUAxutLQWWqWLtDSpLdKomHfaN0mmM2MmufPmdt5MuHc1zPvde8/57jnn3Xev4BriGOAghEHgIsFBmC8GLhIcBBcJhRejSweXDi4dXDoU75RdTXA1wdUEVxNcTSg7P2iewjik3XgkAY+ASUbkjq2zkOaA8IG+jnC/yOlHwCGyctUGiHghDOlWfHagbFzWGWUnwt4SjXCFjOxvbggp/Qg4XpMTWbGyiFYGieRISn9C+RkYQ7m37Bgen/2re6ssEibISG+kuRumMKZUUW6Sk74VHUnpPuBKiU7ZQ06+WLGvgSDOSFgewvvag89eshKmDaT1TQJ2ISgB3zEiEwb+GUkaE0JaB1DOFDxQ2sjJrJFHEUT2IITvcZ+vUTZEsGOlLqNk5chKoqjP7UEY1E5a+ZyAdUbGCMl8TViqSR7k5qJI+JCcfGw0bgSRPQjVTh4WRhgu5Hxx/yFN4nEO6M6DStDPCZmqdgpTfTwQFnNeOEJGRisaG8IYkaWjxdRDA509CKbpIHTnVxjuIhwgI8vvEQycqFViD4JpYQy3uzAO3GgEACFAexBqXY4Y+zcUhI6bf2fVk22KXGYuGJvpa/ulHmysQugcf7w18P1XFUl4kNC5uRb1F34H0qKQ8DwSGgQt4CfEX/wt+f/E8wofVKKa+z3ZlmoqCB3js0n18rlurU3vfsnqIlUyzOokYSQofnskCgnt0kAuLPbVIBie6Vs7/93wPzerEGq1teOrJwMq2k+gJ6eTbRdrHc+0f0NBMDXats4eBNN9AkwhPAAu8Ywcp+SpbaeqHc8eBPMd4xvA+gVDJxFGyMh5I8ND0K2s4RP53khvKLIHwXDCvOy/A5J+4G2Ea3kYn8qXFYdJ6zcoPQvPbyMcIyPXq5m2Lm+HSAalNY1yFHgFIfyY+pY5figZy+MdYLBs/B/JyqZIc5Z1iicSyi0PI2MexLtVOdX0p81LeZvSzQjbUbaUPF7q3iEUrEoIlcLgxRuoUHmArIxVFTkVxI2RDiaehLdVHoeBdoTwzuGsSTcTTfNAMPEmosZBcIcq86HjIsFBcJFQKKMuHVw6uHRw6VC8r3I1od41oeu9Pw9Ws7Nt8fTaw9Ptf1TTJ4q2rpGwYeCv8DreuD0PvNd+G335V+MOEYVxQbhlYG/vqoRg4HgskrpGQiweGkzqINT77WCwKLFI/gEMWfZBIBM1nQAAAABJRU5ErkJggg==',
              type: 'plugin',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '18',
              code: 'EnterpriseWeChatInput',
              label: '企业微信',
              icon: 'data:image/png;base64,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',
              type: 'plugin',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '19',
              code: 'DingDingInput',
              label: '钉钉',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABYBJREFUeF7tm3+IFGUYx7/P3M7unZBEkn8EiYRpKYk7e16YhErJleJpSZ7+0T9q6u1S9gMCM8ggqQjsB+3sKflPRGmEF3XZ75QoD4+c1avELOgH9EdBEB56uzs7841Z22u9u7252d3Z271t/9t5n+ed5/t533ned56ZETT4TxpcP/4HMN4MWLKPLZlm6x4K54P2TYTMqIcZI+BfEOWcUM4GU009fY/KULG4i84ATU8vJORlAZbXg+hiMRI4LuBOIxoaGMtmTABaPL0HIk/Vs/BRsZNPG7HQnpHHRwHQEql2UPloSonPixH7LqOr+eNCbVcAuPUVTjcDZj+AeVMSAPCDmlXbTj4kF4aZFArV4ulOiByaouIvyyI3GrHQ4SIAzN0QPjO1AciTRkzdOzYAPeOMfueUBgAcNqLBjWMCCOuZY/W+7LkNnrMsJqPBFRUFQPC8QOa6nbwW2n0BYESDsjDBmQFmdgLyMIBptSB2rBh8A5A/2dKDvGoobW4BsA3AzbUGwncAecHLjzFw4Zy5BZRNAJfVCghfANiWteL0gy3Hi4kMd5t3CNkJ5laY6ZMJwxcAAF8woqHH3YQtjl+63lbUDXRgAIvd7P1o9weA4BujK+hJkBZPrQHE2XluAKD6IbZqSfDfPeb9RjT0hlchbQc417KynSA7CSzw6u/V3p8ZkItCjhhRdb3XgArtw3qqQ4HSQaADwLXl9FXM10cAGLIta9V4yXCigpa8xmvSabMDkA4IHRhNE/V1s/MTgHPuQQgOAXLI6FK/cAtmIu1aPDWH0tQhyIEoezn1G8B/mog+iPQCdm+xctREABTatCYybTZlF8B1Xn3z9r4CcLbE4W7OF8tsg4JlYK6eOBuQz4TsbVLVD/u3yflSg8/7hfXMDgGeBXC11758BUDIY8moum9kUGHdXAbY7SLSDmJQiB4E1J5T2+U3rwLy9hE9fR8hb3v19xUAiK+MWPB2t6Ai+6nSTrcTykyB/JJF4LuBLvnTzW9ku6Zn6NXHXwC51VBZY3QFer0G5tV+UWJotsKmn736+Q8A8r4RVZ2M7euv1NJ9FQDkdD9iRIMv+UVg8QEusLLZEwA931hVC8Co6mslYWiJzEEQm0vps3oActHxd1LOivAiRC6SGFKAIYCXbCg3OBYK7KRtK/3TWgL9X2+RQTdRYT17t8A+6mZXrL3KAIbDcJ7LnRHKAGANBIKhMycfkD9KEaHp5qcA7yzFNzckfhRFxwvGrVjiRYiWyGwH0e3FZ6Rt1QGQPJqMhVaXE7Tj2/YqZ1iKeYJAWdXnqgO4nArYY8RC95YDQUuYe0E+UU4fk3IJFAT8q62oK0/vkB+9imhNMExkT5Bs9uo76ZfAiAAGSW5OxkLvFB6P6NnVpL1WBMqpaHDryKA1Pf0WIMOPs8qBMDmXwOiI/yZw2jkswNJ8TZDE1mQseLDQvFVPzbOgjEp8pT7CqxUAYw4iFXVBcoecHW+EF3XzRsXO9gP0fCs82TnAdeY69QQ3o0jC/ITkSje7Yu21OwMEfUZX8LbxhGm6uRcobyWoXQDEi7ZtvVcIoLDAGtGz6wi7p9SRz/vVLoArlQ2CtmbEmn9yDkf2cxatbB/A6xoDgMjnRpc6vN+PJMx3Sa4tV3zNJ8HhaUo+l4yFdjn/tYS5G6zce0v1cQmQ641Y6Ehrd3aVbdsfVGLk6yoHNDE7yw60ZGmZXwKY01AASJ5PxkLzIonMmyQ2VVJ8XeQAAV4n+T1Enq+0+PoAQMQoiPshvi4AQPAtiFsaFUAKQNn3/OPBG3cZ1Br9VVkt3ugvSzf66/IN/8HE5b13A38yk8+epT559Wvpqki/E/1oahhCI382l4fQ0B9OVmTa1UEnrlXYOtBQVogND+Afm6YMbvKWQ54AAAAASUVORK5CYII=',
              type: 'plugin',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            }
          ]
        },
        {
          id: '2',
          name: '输出',
          icon: 'data:image/png;base64,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',
          type: 'menu',
          items: [
            {
              id: 'upset',
              code: '13',
              label: '插入/更新',
              icon: 'data:image/png;base64,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',
              type: 'output',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '14',
              code: 'TableOutput',
              label: '表输出',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABR9JREFUeF7tW02IHEUU/l5v+mfWzVUPoiQQiJhFlAQEDUyPsCvRs54MuHqTRPAvwVyyuRiSqJcNnjQG9KRnhSTo1MQYDLgkyG4wgri4Erzvbqa6J/bT2p6Z7erpmfTOjNnuoRsGhupXXe999areq+73EbpcdllOgYzdBozdjOBJAOo30U0+Y+2rAG4QjBsBglvg4JZXcy4l6UhJjY7rfwHglYwZNag6X0phHYw/RAOgVPZeYiJlvD3oaBnt7xHzwXrN/rqlXxuA0nONZzjgHxMUXwLzTTawSIw7GTVMU4sJ4xRgD4geB7CjY9YNerb+vXlVtbcBcNzGCsDaGifio/WqfToPRnfTsVTxjjDTKf0+rUphbm8D4FQaH4D5/aiQQdh3p2rN59n4lu7jFX9vwPhZs4XopKyax8guN6aI+KJu6D87pSgtjYLxLRsct74DGPsjahMzTVOp7L/FhI8jN2aksM6PkvEbIPivAvi8vQEy3ian7H8GwmthIy9LYT8aN35imh9s+Hc/IfB+AA/lAJzzwZh5xv+ObsZ1dVzvT4AeCc3FOXJc/ycAT4eCdEkKc1rrtJfH7e2NKwQ8lQPDoyouUmAeqF+m5Wij4zYuAjzVbLumAFBZ0wMhIPjIE9a7egdvFqDjOTM+nE7gbF1Yh6O6267/IQHvNNvWFAC8IcAnpLBndQB8tXF0xNKcAPK7FNauXhOaBoAIQDkxO6KmFJaW7Tqu7tEFACmWQOEB+XP8DY2LJVDsAcUmWESBIeYBnYlSrw0yFnOFFFYlzYbquH4VgBvKDjQmhrwJDqRMAUDhAcUSKPaAYhMsokAKBDIcBiFS6B8XacbzTfftt58av9V32HlAH+ZvcZchJ0JbbE0fwxcADPc4vBWpMM1KYZ5IO/mO2zj+3/vt9ovdIXtAAUDHa/PiNNgDgeI4rL+DL47DOT0O19tZlfJ2KUqJ2aDt8i5w4wCM4Dev6lxQso6brm98FWUqFU4ffvxPAbyu5In55WghUtpntOTyCoD2EbUbCPqXqM1Cs3n5gfOAtEPGPzp284SRBUAZbJe9U0R0JApa3BNGGgBleMn15xg41A2E5vpO41jZOA6n0bRjF6/458CY6eUJvTPITH0XUKFsrN8SGS2Epo0OmYoCtutfp7BSfBjXvBTWvns9KFMAOO4wa4T4LynssESt5xkiU0tgmFVi6Y7TmfKAe81W0v1m2f1X+r10xqs+uQZgUONzDYDj+uosoM4EkWtzr7RyC0BSKgymY7JmnozCcV8TIaLbsmo+rI/fWSe40iJDMfEZr2prqWzaPSAeLZjxplez5jqSJK0yNe3T+5Xr3HfsineamN5rPnFVFUr+AEBVgQPM38qa/WI/wzmuvwBgT9jXmJFiW2LJ/f06CzBw3Vsx92OeNJqPU/a+AdELTRuvUMm9O8cIWrn7khTWzn4ACNeuN8sBX/UuOzECxsYT/3cAiG4zB9e2ofHGmpj4O8ED28d2gnGWbNc/REDbVUeBJ9RtAuP8IQYOkyJIEhnajI0SX6gFRhJviDmYXq+hSyZKjg5vKIkvBGCdSBmhzfkygTCZe/6Q4+o8oaZHeFJYjvq/QZwMWaOx9HU9NCwDxq8M/oXAil2S+YtBEwR6Aggea/ODoqlZ5KWtTp1dZ4/iQpxAmXmLUytIq2Tg+RZrVPMALVtKIFKmHiOrgk2iZFy9RPa4ElKESgM8ycAkaD3BmWyRq7JqY0SvNQALYCwSsBCAFryamUif/xcjeN3ADEVYOgAAAABJRU5ErkJggg==',
              type: 'output',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '15',
              code: 'DorisOutput',
              label: 'Doris输出',
              icon: 'data:image/png;base64,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',
              type: 'output',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '16',
              code: 'KafkaOutput',
              label: 'Kafka输出',
              icon: 'data:image/png;base64,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',
              type: 'output',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '17',
              code: 'ExcelOutput',
              label: 'Excel输出',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFW0lEQVR4nO2af0zUZRzH3xx3/DiQ+C2omFyBc4T8mqtGZjRRmIxpzn4YzVXqYJW6tvynH65Z1Nr8I11FY2mlrrBsrCQSAT0aFDFQzFR+SDoIuVM5Fe/OO35c+3x5oOO4X7v7cl+Wz2v78jzP9/n5+TzP8/k83+cAh8PhcDgcDodzb+JnsVgkEfzcQFfoOU1Xqqf1leFhBk/rZkQltyeExgpxSRTwRcvR3J8unCwE8KqnbUQvWuBp1V30Z0V8hvqFpNVqmaeteIrebERtd9NKb4T3knfpadL8mT00bIDPFfD3YF+ocdik9HW/tgyPjcj79deDfK4AhlSzbw2tBN+vgNkGV8AsGIOk3PMKkIvRyF3zXfRoLivP93ak6PQ3I52V1d65MXdIe81lmwEhSigCAyGTizJEh4jS+kF1xeryE19tBfCUmIOLio7F4sXTD4ujFguilTFet99/WztfFAXUnVWvFFt44sZ1LZpvNgB+flPey/z9EXM70ev2ixJXXRHFBvRoLqvEaMceFszsUZ0bwcKPn3GUFw/gIwBUQAugDUA1gFoAXROFftxeYbdypioNfvhv6bb2nJlWJkuVPiVtr8xM48wGUB59cikAzAdgBkDm+xKAKyztkLaedrySvwWbcp4TiuytKsMh9ZHJ4gp/Bd5//m1EzonAgE6DrWU7fC484WwL0OYbtUqTMlYBeAJAgjse5JPqcnT2dwvxbWuKER8RN5lXkveyIDyxv/6QoAQpsFWAtbm9xWZ6iKUVTAkFAF4CkEaeytWYD9QfnowXr35RCFPvT0HRiqeFeM2ZelQ2V0kiPCFnggUDmAsgCIAJQC8Ami6aFh17r2B1yDGTEx4B0A7gB2cd1J1V40T7SeSm5SA/Mxfqvxqx7uECIW/wjg7vfFPqCzkdImdLmmZ2CYBwALfZrIcASGR73dYXkXI2AMh2pQDizcO78UjyMswJDsWW3E14IG7ch5d+vwdjljFfyjsNUsBmtqeTAIQBuMO2Bu1/PZt5e7ZiCXvcovToHnxQtGtS+MrmY2g43ySV3JOQAtYD8Ld6Z32Wj2Kz7+egvtvY3j0aTEa3qt4dMGLMPHWVhM+5D5rRbm+HhFvLdWE0sx0AzgM4Ta6Y+fvfWfwibVUbbzABrZSr7nQUHBCE9za+JcTbmK/f+PgGJM970GshvIVWwIfMCJrYbFuYHaDt8BCAHBYGW/VlYkrrdKf/net2QO4/7jXLa77GZ8XjB6Cda7dj86evSaoAWgE1AH5m4cSjBtBs5R2sfT4ppwHAl3TD7aqDvIyVWJO1SogfVFcIpz0KiaWLUvDsY+tnTjo3kDFX18eW8wBL32SCJgNYyAzhCMv7DcAR9pxy1sW8yDi8sXabEO/RXMa+qs+FOIWUJnYUlEi6FZydBGnWY63SOrY6aOaPM9vgFDr9kesj9h4rm1J0Ii2TyQTXKBWujrNaFpJduACghRnHXlfjpQ+d7xorhYc+aenbwJqmjj9QUvb6lPKSfAw5+ppj2yLP04bdEUYKgW255+8DRFFAliqtVYx27GEZmdkbIVHuBJ9cuqKutac9S+x7wVBZCBYuSLCbJwvwt/veXbp6u3Hlam+iKD+PG0wGXPynM/JCX2eKwWR0+sNnV++lpNqWU/tctTk2bIGFntGZWwHf7t4fIsoKUAYqkalKH8xUpf/qqmxV4/H+X+rrxOhWFLgRnAVjkBSugFkwBknhCvB1hwGKQDP7gUVqqhVyxYjPFfBo6rKO2IgYjcRKqE5PTj2dlKAyS/J/glrdNdS2qLP1Rn2ozzunS8+wiMHC5fktCrnCjdIcDofD4XA4HM7/DwD/Aqtfl06eRhdwAAAAAElFTkSuQmCC',
              type: 'output',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            },
            {
              id: '18',
              code: 'AttachmentDownload',
              label: '附件下载',
              icon: 'data:image/png;base64,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',
              type: 'output',
              width: 100, // 加宽节点，适配图标+文字
              height: 40
            }
          ]
        },
        {
          id: 'etl',
          name: '通用',
          icon: 'data:image/png;base64,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',
          type: 'menu',
          items: [
            {
              id: '10',
              code: 'DataClean',
              label: '数据清洗',
              icon: 'data:image/png;base64,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',
              type: 'etl',
              width: 100,
              height: 40
            },
            {
              id: '11',
              code: 'Filter',
              label: '过滤',
              icon: 'data:image/png;base64,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',
              type: 'file_transfer',
              width: 100,
              height: 40
            }
          ]
        },
        {
          id: 'switch',
          name: '流程',
          icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABJlJREFUeF7tmk2IHEUUx/+vu2dPglFJDkFxRRBxFVYSFENQc8ghSMTpNXsRMYKQ6c1JIgRzMbmJCjnt9gw5JIinXaZ7UfEmBmRFwYAeFAJi/Lz4AeZkzHTXk961x95xt6equ6p7xp2+DfPq/1796r3q6tdN2OEX7fD5YwJgkgE7nMCkBHZ4ApjfBJfCm/uI7ccBfroi2N+AxZo3N3VJxp/REmgH8SsMflMmEP02fNVzG/cP0zUGoBP0DgrQx8MCMPs/XfFce3+eD2MA2mH0KTMeTZ0L5nNmJ7uhbhE9AuBI3xfRG17TPr2dbyMA/PDPaXDjWuqULHum9Qx9nf7uhDfuFZF9lzEgFs6A6HCiT4TVVtNplgLgr/SeVAmWLZ4lss6nYzzX6YNuh9G7zDiqolfS9rLnOocKAfAD3gPEnwGYLhNECmCx2ztrEb1WRqvA2BIAwvgtMJ8q4HTTkBSAH0S/A7i9rJ7i+BIAgugjAGn6X5Z1TKBdDJ4dLAE/iFhWQ6OdJgAxH/KONaQgrO8ZNiXw1q9MBkwAaFxZWanqM+BCl++MKP6xH+E/2VNHCRCw0nKd+YJ3gcweoFACiTM/iD4B8FjqODkI1XAHAMCve27j1eoBdKPnQXhbNk8N2X3nuc49edq5J0E/exdQzIDE6VIQHSNg2dDkhsnm1n462CiAxEln9a+Hotias4ieGBaxjv8Z+AkQawvuVFtGzzgAmSDqtKkVQFIiyeQXXGelLgi1AcjuDwzM1wWhFgBbbY51QagcQN6doQ4IlQKQuS1WDaEyANulfbL5DZ4VqoQgDaBMT4+IHiBgfcdPr+wkt4Gzwsz9NlqRu4QTO+dPzNP14ifBMLoIxvEizvPGbLXCMuVRKA4WL+a9I8jNgE7ABwVi7a3tKgEwECy4zlyhh6H1p7qN5kapPh6BdjN4RqUECPQVg38ttOobg/qdrMJN0RLO/zO0yk1woCNVvCGiE0CiJVPnOu4AIwtgGAQdk8+UbdqTHJ0MSDPK9FF4pDNgKwi6Vj7VHgsAaTmYeBweGwC6N1mjGbDUjZ6yQHfHEHtMBZ7VtYm+BfHPrWbjQ1V/2jPAD+LPAd6nGogm+9BzHVdFSyuAdhAt88CDjEowWmyJFrym7ctqaQPgB9FzAN751zFdESzelw2kjJ1N1rPZ4/MNsm97uUl/yGjqA7D5aXDTgaId9A4L5hkG7ZIJqohN9k2SIPHwyebUFzI6+gBkXowk/YCTc42zSQC1fOig8GLGKIClMDpCjA9kVkKrzagAqGX1E5KMSwL8vSzUTPkUfxbIvhtMS6A2ALIzH7Ar1RD5PwBAmZbYSAFQLIEkEco3RYPoAoCXErH0S4u6SoAgZlvu1JcFK2HbYflt8e7N4yDrYjo62QeIeJpgvaA7kGF6VsPefeIo/TbMTvX/XACLy7/cYjXuuArmvarCOu2J8F6r6Rj53H7ot8KLq70DlqA1nRNS0Uq6wy3XflBljIrtUACJWGeZbxUNcYbA9zHD2NE3GziBfohZXEtPnyqTUrGVAqAiOG62EwDjtmK6451kgG6i46Y3yYBxWzHd8f4NLoGTX9/QWZIAAAAASUVORK5CYII=',
          type: 'menu',
          items: [
            {
              id: '12',
              code: 'JavaCondition',
              label: '条件判断',
              icon: 'data:image/png;base64,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',
              type: 'switch',
              width: 100,
              height: 40
            },
            {
              id: '12',
              code: 'Switch',
              label: '流程分支',
              icon: 'data:image/png;base64,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',
              type: 'switch',
              width: 100,
              height: 40
            }
          ]
        },
        {
          id: 'script',
          name: '脚本',
          icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAA7xJREFUeF7tWz1oFEEU/t7uniBWKlrHXqxsxMIEtFLU25CAYGFCIrcXUikiGtCAwUIrIbcJ/kSRBDXeXawEG2NhJSktxTQWGhBrb/eeziV32dvksrfJ7A+X2ebC3cub7/vmzZuffUPY5Q/tcv5QAqgI8Clgz1e6oeMkQEMAujpEoGWAn8DFZ6svs+jltGEI2EVnEoR8hxBvpsEoWL3GyJYCFIrOLyIcAtCkVAcI0s2MlXyvcXjrCCg5vGawaJlGTwcQh11yPv7v0G7BxTKNpqjfOASUACoC1BBQOWBVgU2T4GSxctefGEd6M43vxDqiqq0mnPrj/V18Z5fdO+KzWq02cpDfRmbylZoEhQAaUY1AjQTzuF8A6CSybuPxZ14voM18yCRfE1zmLKAEUBGw8xwQlEdSPQRkg4vDn9QcEAdg2W0oAbY7C8Dlcdm9kYg/vTZth94MJYI16kbD7AajxpKI/zACLFaZP8WBUtM09i6LW7XZjp3Xpv63RnRqO0NAHYioEyF1JKbOBNWhaByzQNRtqKXwdpfCahYIMQvYZWeGqzgL4md5M3Mz6rAO4z+WIWCvv1AR2N5kHN0a6qffYYBGZRuLAP6zQgZ/AbGVz+5ZiopYu35jEUCAKRT/XiXSpteB0Qox53O9xtt2wUZhF5sAa0fQ5wC8AHCgTobBN/Jm5kEU5NrxGasAtUh4x8fIrc4CfLQBkKhgZfWmd/PtgJdhE7sANRFm/+ynvfteA3TGQ+K9oesDwxfopwxi7fpIRIA6OLvkPAUw6MkLS5apH28F3p9MW9kR6GvO1NcjbAs1EhVA4NpAyuUef62OR7BGMUNQD/tfy7WyT1SAQsl5ScBlD7hXlmlcCogAcYIT9PywTMPrt6V9IgLYZe4Cu3MATqwj4wnLzIwFMZP9e6FUeUCg60RYyGWNrNd/JCUyhYXKabg0t1ZsVWuPgcG8aczIJteuP/HafrNhJ12AqZKbY7DtAfYNpA9ZWUpl1ZlUAexy5SGYrtXJM/hDxjByw+fpe7s9FbedNAHEbhCMKx4C0wcdfaS/n9y4SYVpT5oAngJLENGtXFa/HwZIUrbSBJgqOSYDo6zhcf6iIbJ/qp7YkmCqWK+BKRSdR0QYBeG5lTUGIp8G0yZCIguhNImgBFCnwqpaXJXLq/qAEDVCYt0uLkulcvOyg9lFFEktW6ZxJGAdULkN0L0dNJTif+Uxy8xMbC2AuDanUR8Dfd79fIpZBUITl6UImEeV5wOvzQV66zADdXW2wzo0NJ1dHwH/AD5AzV8AEPBEAAAAAElFTkSuQmCC',
          type: 'menu',
          items: [
            {
              id: '12',
              code: 'JavaScript',
              label: 'Java脚本',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAACxxJREFUeF7lWguMlNUV/r777wOQisD8A+iKsDOrtaZQH1FgZy0kVEHRtKba1qpV2R00lbRW0D7SiLFPm5YqiLCzoJX4qJSQGq1aY0BmQG2pBRpdHzsD4ha7889SnsIKc0+9s7s4r53X7myNnGQyr3PuOef7zz33nnMv8SkicbnGMRb7YDBN4mAqy6dLbHsvHeeUfHwD+f+nCwCXaxEsay07Ov41kE7mGuvTBwAwjLHYnScmALa9BUAHHefyEw4AGT36Qij1GoCddJyJJx4Atv0UgKsBHKHjDD2hABDbvgnAqh6n36LjnH3CACBu9/UQefS4wyKPMRa77oQAQGzbhLwJ/WS6jI7z3GceAHG7fweR21McFXmJsdjMwXLe6Pm/7APEtjcDmJrm6AFoPZOdnX/LBYC43WMATMaxY63cs+f9/oI1qADIqFE1sKy+jL6NjvNgukPidl8CYBK0ngRyMsjHGI3e11/He+UHDYA+5nuvHY/Scb7T+0VsuwEic0BeAaB3RdgGpeaxo8PsFQaMBgWArPP9ExfW0HGuMV8TIJELIHJhmocP0HG+N2BeJw1UdgDEtl8AYMI4GyWcF5frcyDvB2D2A6lEXsVodF05nC97EhTb/gOAG7IaL3IfY7G7xOU6C+RKAPVpfK2orvaxvX1PuZwvKwBi278A8KM+nL+HsdiiRNi7XKtBpm98yhbyGQFWDnQTmVvEhH42+hUdJwGM2PZsAH9JYRJZzVgse9SUwdiy5ACxbeOgiYD0+fw4o9Fv9/4otv0AgPkpTEpNZUfHq2XwNeuQ5QLgSQDfSNO4H/H4VO7Z82YSAJLGM6iFUNlygLjdf4bIlWmhfXze5wBgAx1nxmA9/fIB4HItA3lrmiMZRY7YdmoEiOxhLDb6swDAIpB3JztCx8mYbmLb6wFMT3N4Ph1n6WCBUJ4c4HZ7ILIVwPDjjpCTGY1uT3ZMTBc4DSgA7yMerx+IQqcQEMsCQGKJc7keAnlLEgA3MBpdnQKAbRuATGX4xTRjl9JxUleHQrwpgad8ANi2F0AQwNiEXWQzo9F56TaKbZsi6JG03w+gq2sC9+8v6y6wbEkwKcubp2jW+m4SuYCx2D+ygLAWwFVpq8Z1jMUeK+GhFiVStgg47rPbbaq73+SMgtGjT4NSZkc4Kcn6QVkSyw5ATz6YB3J5DwiXMBp9MSMKMhPi/XSc7xf1OEtgHhQAekC4tqfqC9JxMspjcbm+BfLxpOlyBWOxZ0rwqSiRQQHgfP+Wyn3oGv/uuq+OA9ACkRWMxRanrAipEfBHOs43i/KkROZ+AVDr3zKC8QM2WenSVC5I3CboAnH6xwcd44UMRJrrn82S9BZD6xXs7HwrER1ebzX27TMnwnUgFzMa/UE+fzxNodkiclEvn1J4o625YU0+ufT/iwZggj94kdKYTbIJwKlpA24A8KxwSCDSfMG+XMaYkpnR6F97psfdIOdAJMBYrDmXXG1TcA7BOwQwx2d1BEYdT7jCNZGW+kR7rVAqCoDaxuAiZu7cErpE1LWRlmlPFKr4uNG2/SXTA8zmuPemjTYqcTpE1QCsAfSBtkBDymbK2xhaJkRS3cH7woH6uwq1ozgAmkKdyYhnhBO5EeBz0NIO6HYoVaVFV0FYRQuV1KyCSJVW5l1XUVgFxSrRejgUayioARLTx7xXp+QIkXsiLQ2JLlI6eZqCTwA8njPi1tGJO5fP2FkICMUB0LjpKVLMcdagkQjXKI3FbavqX+lLqbcxOF1IU1h1k8i8cEtDzqnUy1oUAEao1r/pVkKuhGBWGVDoEHAbIdsB2Uyq7W3N9eF8ejIAgPaHAxcH8smZ/4sGoHfQmts3D606BC+0rqOiF1rqQJj9/0kAhom56gIOA2SY+Q7wIEQ6ScYEEgOkkzCfsZuMb4/r6m07WqZ0FGJ0Oo/XH/qlCH74SQDg8kiLL7XX2MfAJQOQPl6tPzieUNcTurKtOftcLcW5fDKn+rcMG4ojIQjO7eF9h0PGTGpbUteVT7ZfEdA7eGJZBH9CgTnGQpwyZWdzw4AeX+VyJH1lkhzJMts4/Y4AT1Po35n7AT4pwqctcOvQrmG7tq+efKgvJ+puDtbGLdRSUCvk50lMgSROjteRXJgrB3jnbj5XlA51T7EEbQgHfEX1FPsFgFmnpUJF84Ya2QlgFyBHIDgZkBEATwbM55y0W0QCcTV0xXvNF6TcIPX6N10iIg/3gk/gxWPWUX+hy1/Jq0BGAmoKXSmAudeXfrSVF5cCGDaIqOb0DZanMegHuaJbXvYBakn1aafc++aicz4qYMwUln5FQPJItU3BmQQvBXA9AHOJoVjaCTIM0RFCbbXisvrtVb4D6YN4/Jt+DpEf9/y+VMexdMcq39vFKhuwCMimuGbu86OGWSe7tWCMiB4LxTHQMoIKB0V4UCiHlOCg1voQFN+P7P0gjDXXxHM54Z3/6sn6yNFbFRERjcjRSkR2PdTw31IdLwsAnnmbZ0FkJkTuoMiMtpYGUxwVTGZFsUTO7tIVT7evnFb2fqAxbMCmgNcfvFqEKTe+zJKkLPWChhXTXYedCRNwsP09a6Su4EiLGCnAeK1xDsmJApxFoLe8DQOyMBxoKNu9gAGPgNoy1AkiuD3S4vt9wSFUAmPBEZDYbwMzhRhJYCQEI4VsVcCGtoDv6dqm0C0EfpqlR1CCWQmRNwguawvUL8uZGxqD04udasnj5QTA2xiaIoTp5Zvb23aaIRsECAPcR5FD1ft2/wy2XXXko4oFJL+c5cgrHxCmDmj9uHX+DLXanKv6Sx6opxB6GFp9JbxyWls+Jen/9wmAt2njpQL1p5TjrW7pDQKZFwk0vJNL2Rn+LeMqcdhn5jigvkBKMoAfgmylllYR/VYXKlpLTXoe/6Y7IfJrAM+FA77LBgwAT2NoIYiM+3gEv5svLIs1olT+Cbesn2DFK3f0yHeEA77uU6giqM8I8DRtvBFQZquZQcc45NT0rWkROvvN6mkMng+l/BDx9w5GcG1boP7rxQ6eMwfkyuxmiSOxjVL597aWKe3FKi6W3zN3Yz2p5gjhAxKvJOLrsDA7vLw+oy6pa3zl7Hdbprb2pS/vKuBp2nQvoOcDHJHD6LAIX1eQrVCIQhAlrQ6lVbS6a0g0VzWYPGaitq/Qo9l1zIWKeI3EcRFoXrywu4jKoN2kWoLqvYvbllyWUv9PuHH9EKuq6o5wc/3Pc4GdFwAjPPHm0FnKwm1A4lUKHQVwGMSHIjhM4ENI4rt5DYcWF0hzM6S3rM2nY7uIrMtWJRpBT9Mm0yBdCMqCcLPvk15hllELAqBX7gz/xnEWrPMIOa+nZm/IskrkM77Y//cC2AowJNCvVVjWP99ZPs30IDKouz8Qv9N0iE0ztZAzgqIAyK705XNhKa/p22sxPXzWUEkNRE7v7uXnpP0CdFLQCbKTIp1CdoroPVSyNa7iWwup75MOaxYm+pEFOm8s6zcAxT7OgeLvdlrNAmV2Ug1hWuK/Dbc0LChUT78AmDgvOJlxfI1UU0DZC9HPQ1eEStmR5TLYlMI48tFULdYUUib33CPwpMmsE60fjKy8+KVCnR/QCPDMDc4ClQ+JZUr7QBWBiNmatlHwH1E8SC2HBDhoPiutD2mlTqKW4QSGi2Lis0BGCTmW5FiIjBVgXF+nUSLYCMoWwlobDkwzd42Kpn5FQF/apk9fX9HurfAJVR0gZyZOfc07WQdBRdFWdgvs+vjmeUREXgYR0kePbdn5yAyTIPtFZQEgl0WmCyyWVSeQM0V0n5ciqfiB0ohoUTvC+9t35OsYlYrC/wAmUmN9S6klswAAAABJRU5ErkJggg==',
              type: 'script',
              width: 100,
              height: 40
            },
            {
              id: '12',
              code: 'SQLScript',
              label: 'SQL脚本',
              icon: 'data:image/png;base64,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',
              type: 'switch',
              width: 100,
              height: 40
            }
          ]
        },
        {
          id: 'file_transfer',
          name: '文件传输',
          icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABCNJREFUeF7tW01oE0EUfm93UxUELx4Ee9CjetEiKihiD4IgBbO1RfQmqN1UsKCCB8UoeFAURWg3RdGLHqxmIyKCXiwo/hy0XhQEwR5UUI+CVjO7TzY00qYbN+mbmWw0uRS6+b75vm/nTWbf7iJMfnK3aTlRsBuBNhDB2vL/Zf810Vy1N42vZPPOlg9DoFvwjwNRdrYk9eAIYHfGtq7Wg1H5XXRHaDFY/geVg0znxouObR7QN97fR8JcwT9PRAP6BNEjx05t1DdeXACeP0ZAKzUK+hYI0dHfO/edxjGrDoWuJ2jGUZ86pYkz8WElFxL09HVbt6SNwSCqGoDTkxpl8JagwyO0wDf9MURYWrEOnHJs8yiXXwZeaQChwJwn8gRgTxNLcM/ptrbKMMDlUB6Am/ePAdLJCqGffk5MdAzsnP+Za4CLVx7A4C3RZRhwZ4bQgLY421P3uQa4eOUBXMpTu0B/DAAWThWLgEf6bPM01wAXrzyAUKDriQcAsHmqWEK4kUlbO7gGuHgtAeS84hkCPDxNLOJbwzI69nXhd64JDl5LAEN5sRMRrlcKDQxa378t9YRjgIvVEsCgR8sMKK0Dc6aVAQT7M3bbINcEB68lgMl14CkArKsQe9mxrT0cA1ystgCGPOEiQB9XMAePCM8J8DGicaVvG74JubQFMFzw9wZEwxwDMrEB0Yn+7lRWWwBu4dcaIOO5TBNsLmG2awsgO0Jti6zgJQGtYAuXRICIF7QFMLkQXgOAXZL0s2kQ8JXeAG4WN7FVcwiiehPVGiIy+gEcrbKxbhh+K4CI7lRrBlTpCbZKQEJPUHYdc/i0rwFDnuhBgBEC6M3Y1k2OeBlYrQGUzZeFJyEEbQFUmk9KCFoCqGZ+MoRRx7bk3XCpsy6UBxBjHhpdBkoDSLr50nWIqp1gLebRp691ztiavo4p60u5sREHUBaA64nw5mfDLnIIg9WZdNuL/zYA8Kmzll3rPzsDWgE0egZE3vWJK0h5x8cBi51Oet54HKWyEogbOCnHWwGo2gck5QzH6VA2A9zCjyUgrCVxApQct8R4LfWvdCfoeuI9ADQmAIBxx7YqHsCKjlrdDIhqqSk53dGkjm2VHveN+7QCULUIRnaV406HxONJmAGNvRiqseeorAQknswZVLVcatfacG26AGSaV/ozqGIGyDbfdAEM5otZA/F4VLiz7S02XQnkPBHeVOmZGsJszTfdDCibnhoCx3zTBhAKH8r/GkBMvXNsvMtZb5quBDhmo7CtAFRthWWfKVV8dc8AVUIayhv1jFCuIJ6pfFW2oYZjBg8fnUW34J8FooNJFqpMG+I5LL00HfivlQ2SYGI0zBWlbsrftp4J1s+Thph10uaJP+2k8CVqTAWHgGCT5ldpeUbqQIePxgLCKBWNs04vfgyhvwEoFUl5agYvYgAAAABJRU5ErkJggg==',
          type: 'menu',
          items: [
            {
              id: 'ftp_upload',
              code: 'FtpUpload',
              label: 'FTP上传',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABNNJREFUeF7tm0+IG3UUx79vdjMzqWUVQVnwIFiwuHoR68U/m0lXXLqi4KEqnqRgRYoXFQ8iWA+iUlTwIHYvPXipFgQPWqyUmWBFUKs9WLQiKBR6URRdu/llJjtPf2n+TGYz2d8kv0mWZH6wyZK8937vfea9N7+Z+YXQHLZTew2ghwHsbn02oe/nwfhSVMynZHwkX2zH5wkNtm9YwjOJ7JJ/FISD0wgA4NfJdvwfANw6nQBwQQKYyvRvHfAcQJ4ByiXAr6TrE/QyAA/gSn89g4GQgOg7O//ryj8AW81LN17pYbQA8FXpfARSlMBGWXhFT2UC26k6wIwrAQjPLKvoRGVsx5e6TQBq81pL4mbaMI529NRmnRgArXAtp3aEQM+rhT9gBlw5wkbzCCVNlVwCwrMOR1ag7f87lqiUlAHN7GhWB34GcEZUzPdjGfQtgDtUIAyUAZEUV5kjLtNVFt3p3stcdwn0atoMOlHzCo9EoB4H6FEV5yYCABj/iIp5dbsMSrU3iOiF6QEAnBeeeVs7A8r+KhhPZgwg2gPkKSw6uEddt7/XXQK/E/OhasU60QZQCj4B8UpmAPoZVugPQwKQDbgzhPn3Nzg1f7lT/+1TsEr8+tcBWQPoF9XcMl8biPoxJn5IKXp5P0B9Kdzpxs0g5UovafQ7RQ6VAfEJZdCijvmZ+sZupvAIgF2qwUu5YQDI1dogYygA6gdMzbUcgDrRTSWQZ4Bakm2SyksgeoWoYyk84IFoqOU9QL0HDMN5++qmyIDtG8QwnpHtBP8OcitpmEm3jS5hXQL4GuA7t41TI3SEge/JdmqHgcbdm+kbbBxoPBu0nOBDAu+fKgJEp4RbWG4AkKNYrj3OIS2BcNNEgyD8COCccM3VxjpgooNVCG5sAMwlXqAwcCjEWoHEyTVv7g8Ff7WLjAWAvTdYRNj1xOgCEb9Yda2PtEe4hcGRA9ix6N8eGvhuk19E60B9RbjFLR6l6UU0UgDWXt5FYfBLnxAuhuAV37PknoWRjJEB2HnX2vV1y7oIhtkvMgbOzRQKD6x/TpdGQWA0ABy2bdR/BXheMajTolZ4EF9RVVF+YLGRALDLvtyZtZDSyw+EZz6WUie1eOYAbMf/AsA9qT2TixQy3q26s4cG0VXVyRRAsRR8nOYefW+n+VXhWS+pBpRWLjMAtuMfA/BEWod6yRPRc1W38JYOW3EbmQCwSv6bRHhWq8OMA6JiSqhah3YAdtk/CIbcqtJzyGf5yVee/BlAy0m6BmHPumue1UlAPwDHPwPg7gQnTwvPvC/pPqTcumo7fvLuDsZqa4+vLghZAEjaePmT8MxbpOP9ADS//w2A3P21aUhIuoKXdrQakwaLZf8dZjwTc3JNeOZc67OtADQglPzLIOyI2olvhdEBQjsAqyT2ERlvR7bdnxWeuSfqrAqAZiZ0yoHoknALN+gIOmpDO4CWcWtR3A/CTK1in4w7rQpg5718XTAb7DfY+LPqzR7XHXwmJaDipCoAFVvDymSWAf0cywEk7E/W3eFVsiPPABVKumXyEshLoPfPdPIeoHmZq1K6eRNUoaRbxnL8vwi4pstubMe37jmT7I0pA4JPAd6X9YWOCsSxAJCOxR7Jvyc882kVh3XLjA2A7kAGtZcDGJTcpOj9B0cglsIqzNvQAAAAAElFTkSuQmCC',
              type: 'file_transfer',
              width: 100,
              height: 40
            },
            {
              id: 'ftp_download',
              code: 'FtpDownload',
              label: 'FTP下载',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFH0lEQVR4nO2aS4gcVRSGv1Pd092DUUyMGnEhKBgyBrIQzcLF1BjIqJDFoBFRXAQ0gqKYhSBCfCwkoG5EcYgILlSUIRsfiEbCdEAJ4gMNRHFQQSQuVNREM1P9qiPVcztT3dPVUzV9q7vpmR+Ket269Z//nnvvuadKMCi4pUMgU8BWhhunUD7zjuceCKysC1BwyzrkRreFV8yJUxgvHx5Abj1B4PUOwk1rwNYIyJSsVfdvwBkMGv3DmhcgG7+oPpOsankKKIIe71zOUfClea8u4MZ7r1wFXAcyBnpBMo6JBPCLXnG0GKdkwV1wIRMIgFfMP52UVMEtu0nfm9/lXSs15/CScPEwNF2gdKww5xVzE4q+kOS5BB6whMUWdmIpXXBLyzwg7BXt7neurzx7/kSZAz71jufeaFwqFfOPFdzyBHB9nPpWJcAi6n18JbggrUK1uLOMJ3TbpbJSP96fdyt7SsWRO5eK6I8gsQQYii4gqpPhc1V+ifvscIwBwq9Np45sjPtoF10gPD05LdGkJh75u8Afoi1TpS9XIvEC3FUJYKaltlOTmQIt2teK2kQTl9yZLzi65Vzz+/W2uLV14QH9QaeY4KJJ3VTxqgc0ZuuvWoBwoNNvBEZ7VbZkqrWt5VLleYRrklDqxgMSRVy20Lp6LZcq9ZFcZXUvWPOLoXUBBoBDX7EuwABw6CvWc4IDwKGvcEDODTC/dCHMBx7w3TDb2Amq/OCA/+HgUkwXos5L9QAy71ZmBN1r8W01oGK24Ng3m4aOxWzaYY8ZpxrlHbMfYXHJmTHhfCbxeCZy1JsdmTwfQY9OlO5WX3YhXN2F4VXgLHAa6kmK34F/gP+AhSB0N2XCYjSEgGbDCYlDyNhCsAYCLgUuAYLkx2az3xC0Z8c1jvA98I03m3u1fqq6pmdB+/mAwkQ1TrFtgr4O7AT+VuRJgZfjPLgwa5dyP+KA7cARY3yAjYIeAp7oAxf7HiArd6lNwBjN6/cNit5gm0sc2E+JrZyY8CMe22ydSwz0owuUI67nVnpQta12XcG6ABq0pQgSXbUXcT1SAPXtG95Aqh4QkadL5AFptHoYqQoQ+EG2NtJ6edVdIA2k6wG0nREqEcWHT4AGWrwgygOWuUov0I9ZIMoDhluAkBcMVBdI69tgsHK7C7gQmAH+Ct1L4gFBPbeYqfNYGkTTECAgfVrxLxdFq5nKPpSdoQgxSoBWLsH5lyLODqQ+mgbL2EeBT2ySTaMLvIXqZeY4MPtGYD4UJNciwuFWDwi8ZkeonjHHcfbYJmtdAEGnlq0IhFGTJGkYGbVmbtw/aZIbTVDlYdt87XuA8kqEgVcA35qET9tuoEjgGe8v/vjYdln1lW261gVwHKZN+qsdtgEfdxjx3wEmI3kJb1vna7tCYA7lXuDf9rdld9ScL+gdUfdUCTJI03apphcHvCsiD5oEqQ18ABwwg6lVpBkIvQn6eLciiMrnwD7gjD1qS0g7EpwWcZ6N7g4r4ifgduDPtAj2IhR+DngRSPYNUuotvttMn6nBeiQ477UZwzRzMJevXuyI3mc+bKxgO3iavVmRnyM/mVhCzxZDTjb7CCJHOgRBpqCQqZRuddT/uie8evESA1XRh3QxDogqgpK9B5yP0mjtduidAHWD5CxS249woi0Zvx7qziy6fW8U6H1CRPlN8O8H3msKiR05iMhrjS6yyv8eE6Nn/wqHv4ErcipLaa+v2fGaZLZrJntS0BNQ84yn9IrWOtaxpgH8D4UjbyFRPhUbAAAAAElFTkSuQmCC',
              type: 'file_transfer',
              width: 100,
              height: 40
            }
          ]
        },
        {
          id: 'other',
          name: '其它',
          icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAB0NJREFUeF7tW2toHFUU/s7MnVRFEF+tLQgqPtCKr2qLimDxUanWdGfT4qsg0pidjRQL1gciKvgjan8Imp2NVkWsRVZ3NrYWrRZRsWLV+qKKVSmlivj6kV/a7s7co7NJ6j5md+7MbjbR5EII5J7znXO+Ofd9QpjmjaZ5/JghYCYDpjkDM0NgmidA5yZB2+HZABYyyXks5TwdNBca5jJDEtF+MPYz8X5iuSdldn3ZqQ8zoUPAdvhsInkFMy8HcLlqUMz4nQjbieROaMaOVDd9qqobVW5CCLAL7iqW3E9Ei6I6FChPyBPrm1ImOW3BqwBpKwFPD/OVUnp3MnBtux0dw/sEEo9aPSLfLvy2ELAhx8eUhHwU4NUKjh0AMALQCMAjRCApcSwRjgHKP+GNMVRC8ZE1ySN+ChduLtEyAU+9Wlyka/oGgM9uYmqHZN6u6yKXWk7fNHMp47griLAUXJ4zTmooy9gLwv2WKV5uhYSWCLAd92YAGxs5wOD10MWGdDftieNk1nFNyUgSYIJwWBAGM3rTSbEhDr6vE5sAu+A9COaHAg0ztkHygLXCeDeuY5V6T+b4ZKF7d4GQbkBCdzopNsexFYsAO8+XgrwPggwSaF3K1NfHcSZMx3bc25gxQITja2UNXT9tdTf9EIZR2x+ZgMHcgVM1Ib4PMiQ9XtK/wngrqhNR5LNO8VxAf4nB8+v19DmWSb9FwYtEwGCOjyTd20yExbVGhK6f0NtNv0YxHlc2O8xnQcpcAAlvlA7TE2uW0kFV7EgE2I77NIDedqWfqpNBcj4JLL0tAE6p7GfGs+mkUFmOy2rKBDQa90S0JpXQn2wlmLi65SUTyNXpS77G6jG2qeCqE+C4mwDcWMU28QPphPGIiqGJksk6pQEG3VOFT9hmJcQ1KjaVCLCHS0sg6c0qQMY2K6lmRMWRVmTsgrsDjEsqMYiwOpUQz4bhKhGQybv+xLesCszjxe1a58OcDOv3N0wM1J4P3rBMsTRMN5SA7KsHTmNNfFeV+uD1adNYFwbeyf5M3n2JCDdV2lTZG4QSMOR46yT4sajAnQzet2UXigvB2s7qYRA+QYcSYBfc98G47BAwYbuVEFd1OkAVe1nH212zNwgdBk0JeOY1nuN63i+VxjWitX0J/QkVhzotM5gvPaQRPVhpVzI/3J80gs8sYfsA2+HrgPJm498EMPTTU8socCvc6YBr7Y1tjgZrrt/etUxRt3Md122aAZmCdzsxD1UYOmCZ4vBGgQ5t4SPkwdIZUhh/9C+nH8MIybzGZ/gyKsflwWE+UXNLx2mzjD19y+jPRtiDjmtqlSsC82NW0qjeJ1R+0GZOBqTUL5Yp5gbplGU1rRfM8/x+ImyRjBfTpnilVn4UV7sO4AWjfbRLsnw9KFX93Z5GWMU8tgwT/SylfKZZWmec0uMEugsMW/P0gb6VtL9RnE0zIJt3h5hwe8UA+NYy9TPrAioUz9NY+7z27wS8kjLFyrpUrZ+sQKCvU6Zed6uUddwcAytqMSTJ8/sTXV+EZVlYf3MCCu7mQ8yPIn1kmeLiuoDyXpqJ/bFX12a5+uzbVtLv4x1j4/TrIFnS9PmVV2bP5fj4g8ILPN4SU38qqWfCAgzrnyGgGUPTfgj8VyfBsLSv7P/fLYNRgi+vP80UgjZCmvTO7OuZ9W1UQ52QH8z9diS6jj4HHq6GxsMqq0TkrTDA91mmMdCJgKLayNasRh7LBXckuz5rhhP9MNRgKYzq7ETIZxz3RQJuGcdmYGPaFKtaIiDoOAySi6xE18cTEURczKDhCkbGSor+lggIvhAJZzZuIHH17IL7JhhLqmZ4Xb8orLYgdAj4gEFXYsyI/RwVN8hGetlhdxlLVD+NEfJWQvSE2VIiIPBSFGh6zAwz3M5+O196G0RXVq/velKloEKJAB/YnqLX4na+eCtIe76G0E8sUyxUIVmdgAYPopP5MDKUL14giTYCVHVCZYlEukcMt5WAsSyYMk9jftUZwfuKgTlVqU/0RCqhr1UJPnQnWAsyVR5HyzdPJW8EgFE97umLv0hbvDbhl9+oNeUhMA432c/jmUJxAbEWWDbHJC9MJ7p2qYU+KhWZgPJQmMQCCQANnrv4Css03okSfGwCfMWgK+hDxttcIvPPMncpgLtBdH1QgK1MxLEyYNwJlSIpgnzBMmftjvplfPms43YzcANGfwJbK8G3lAHj3qiVyfnvCOyfHd6RJD8rwtgXNFFlXuej+aB3tUZ8CUD+3eNFTYjby8C9QbfOUchuKQPGDUUslByffPxiyX0MLgI4DsCxAI5Scl7hulsJJ+4k2Ah8oktlGfgAjIF0UmxVDTBMri0ZUGuk3cXSBGyVjE3ppPCrVNraJoSAfyfJeOXy5cmJsJOZP9QAp880AmsS28HEhBJQ6WCjf5gAw2BghEAj/m+AdwvW3+tNUsuF0CoEdYwAFWcmQ2aGgMlgfSrZnMmAqfQ1JsOXmQyYDNanks2/AZU+bG5Uq2hhAAAAAElFTkSuQmCC',
          type: 'menu',
          items: [
            {
              id: '99',
              code: 'PrintLog',
              label: '打印日志',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAA9tJREFUeF7tmjFv00AUgN9zEydmYIAJ1IWFoYKpQ1WQaCqkAgMSTQUrMJVUAn5ABE26sCIB6UhBMEDVVkJIVRfqSIiChJhgA6kMLAwMDMSOGx6YlJK4Se58vnNi4qx37/m97969e/dyCH3+wz73H2IAPBGwZ7w6TAAXieAoz3yZc5CoVCmnFmXqbNTFjABj3DlORC9VGcCjF4kuqILABJDO2AUAnOUxVOUcVRD8AjABakWVjtZ1a5lW0FVA8A3AMvVx1QA6RZ1sCFEAYAJApilxScwJHACcWQAqbBtgdiECTAAqe7eErEiIBAAXeqttIQNCZAC4EagCQqQAqIAQOQCyIUQSgEwIkQUgC0KkAciAwAGg6S6wuw4YJSOdskb8VoeWkd6AVbRbyXmyvVsI8fyEiiUOAO0LIf0kDWlb1RVAPMxjYeMcQninAcxU1vU3XllJF7APlqkfYdkVCEBwQ6lomam/VeaOrcaYM0pIr1jGs8YtU2f6x5yQzoQfAa5jqTHrDCL63lqNJbMkAOHnANbKthv3RmQ4AEStVSAXA/B0r+IIkJMEGTngzy2t0nQGi0a3ZRq8Z37LT4S+Bfaeon1V21nydmxEAQDgmmUmT4vKKwLQ/hhMZ6qXAOC+qMGt5II0OUIHIKtgaQShp5L7v6/hNxGooQMIVrDsdpFAf2Sb+FHE+VYXo/gUCOsUEF0x2XKKtgD7GJTtiKi+GEDYlaCRoUGArRIBnRVdNQ65TQB60OrazOojKE+Cxph9nhCfcjgReApqycHKC/zSSVHoW8AYr44QwevA3rEVcHV3PIXZpmXqh1iqORoinZOgnrHPaYDXWR8KMO46cplX3o0CAm0IAB/aZuI5Sy4wANYHen08BsBaIW+LOoy/x1k2yRyPVATMrzhzQNoBAC2fy+JXGSAiCABvAOB7IsrPTCWeBYUQUQB1t4noVi6byCMiiYKIFIDScq2IQDcbnSWidQ0hfyWb3BCBEDEAThEBmwBsO/1DQ8xPTw7c9gshUgDml5wCYPtHm4jwBGEgPz2Jn3hBdBXA/KKTgQHfr1BZHejPAJDPZROPeSB0F8By7S0ADfMY6nsOwd3cVOIqSy4GwCKkshK8t+hMgAbHWDY0jmsdcsD2vOhsAT+Ou3P/uyToG8BKrfC7+mn1dL8/jsHS8u46IPRCqP5wWfSHbnNjQVTaWwl2oxQWtX1Hjgiu2WX9joiifwBCvAwpaHwu+GlxNYKqA4CDoV6HXQNSJ6wJ1LQ5ABB4tNS01ptEP2fscnpVJAJUyDALIRUf7SWdMYBeWo1u2BJHQDeo99I3+z4CfgFvkuFfZXfddAAAAABJRU5ErkJggg==',
              type: 'plugin',
              width: 100,
              height: 40
            }
          ]
        }
      ]
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initGraph()
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
    // 切换菜单展开状态
    toggleMenu(menuId) {
      this.$set(this.menuState, menuId, !this.menuState[menuId])
    },

    // 设置连接线模式
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

    // 显示分发模式对话框
    showDistributionDialog(edge) {
      this.distributionDialog.currentEdge = edge
      this.distributionDialog.visible = true
    },

    // 选择分发模式
    selectDistributionMode(mode) {
      if (this.distributionDialog.currentEdge) {
        this.setEdgeMode(this.distributionDialog.currentEdge, mode)
      }
      this.distributionDialog.visible = false
      this.distributionDialog.currentEdge = null
    },

    // 保存流程图
    saveFlow() {
      const flowData = this.graph.toJSON()
      localStorage.setItem('flowEditorData', JSON.stringify(flowData))
      this.$message?.success('流程已保存') || alert('流程已保存')
    },

    // 加载流程图
    loadFlow() {
      const savedData = localStorage.getItem('flowEditorData')
      if (savedData) {
        try {
          const flowData = JSON.parse(savedData)
          this.graph.clearCells()
          this.graph.fromJSON(flowData)
          this.$message?.success('流程已加载') || alert('流程已加载')
        } catch (error) {
          console.error('加载流程失败:', error)
          this.$message?.error('加载流程失败') || alert('加载流程失败')
        }
      } else {
        this.$message?.info('没有保存的流程') || alert('没有保存的流程')
      }
    },

    // 画布居中
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

    /**
     * 创建节点
     */
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

    /**
     * 创建body
     */
    createBody(x, y) {
      return {
        stroke: '#fff',
        strokeWidth: 1,
        fill: '#fff',
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

    // 初始化图
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
        background: {
          color: '#fff'
        },
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
                  targetMarker: {
                    name: 'block',
                    size: 6
                  }
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
            args: {
              attrs: {
                fill: '#5F95FF',
                stroke: '#5F95FF'
              }
            }
          }
        }
      })

      // 监听拖放
      container.addEventListener('dragover', this.onDragOver)
      container.addEventListener('drop', this.onDrop)

      // 阻止画布默认右键菜单
      container.addEventListener('contextmenu', (e) => e.preventDefault())

      // 右键菜单逻辑
      this.graph.on('cell:contextmenu', ({ e, cell }) => {
        e.preventDefault()
        this.contextMenu = {
          visible: true,
          x: e.clientX,
          y: e.clientY,
          selectedCell: cell
        }
      })

      // 双击节点显示配置抽屉
      this.graph.on('node:dblclick', ({ node }) => {
        this.configDrawer.visible = true
        this.configDrawer.currentNode = node

        const nodeData = node.getData() || {}
        const label = node.attr('label/text')

        this.configDrawer.form = {
          name: nodeData.name || label || '',
          type: nodeData.type || '',
          dbConnection: nodeData.dbConnection || '',
          tableName: nodeData.tableName || '',
          targetTable: nodeData.targetTable || '',
          updateField: nodeData.updateField || '',
          outputPath: nodeData.outputPath || '',
          fileFormat: nodeData.fileFormat || ''
        }
      })

      // 点击空白处关闭右键菜单
      this.graph.on('blank:click', () => {
        this.contextMenu.visible = false
      })

      // 鼠标离开画布关闭右键菜单
      this.graph.on('canvas:mouseleave', () => {
        this.contextMenu.visible = false
      })

      // 节点悬停显示连接桩
      this.graph.on('node:mouseenter', ({ node }) => {
        const ports = node.getPorts()
        ports.forEach((port) => {
          node.portProp(port.id, 'attrs/circle/visibility', 'visible')
        })

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
      this.graph.on('node:mouseleave', ({ node }) => {
        const ports = node.getPorts()
        ports.forEach((port) => {
          node.portProp(port.id, 'attrs/circle/visibility', 'hidden')
        })

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

      // 连线完成后处理
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

    // 拖拽开始
    onDragStart(e, item) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', JSON.stringify(item))
    },

    // 拖拽经过
    onDragOver(e) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    },

    // 放置节点
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

        // 直接添加节点，不赋值给变量
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

    // 删除选中的元素
    deleteSelectedItem() {
      if (this.contextMenu.selectedCell) {
        this.graph.removeCells([this.contextMenu.selectedCell])
        this.contextMenu.visible = false
      }
    },

    // 保存组件配置
    saveComponentConfig() {
      if (!this.configDrawer.form.name) {
        alert('请输入组件名称')
        return
      }

      const node = this.configDrawer.currentNode
      if (node) {
        const nodeData = node.getData() || {}
        node.setData({
          ...nodeData,
          ...this.configDrawer.form
        })

        node.attr('label/text', this.configDrawer.form.name)

        this.configDrawer.visible = false
        this.$message?.success('配置保存成功') || alert('配置保存成功')
      }
    },

    // 键盘事件处理
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
