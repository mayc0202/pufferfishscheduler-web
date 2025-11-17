<template>
  <el-dialog
    :title="title"
    :visible="visible"
    :width="width + 'px'"
    :height="height"
    class="custom-dialog"
    @close="$emit('onClose')"
  >
    <!-- 自定义描述列表容器 -->
    <div
      v-loading="loading"
      element-loading-text="加载中..."
      element-loading-spinner="el-icon-loading"
      class="custom-descriptions"
      :class="{ 'has-border': border }"
    >

      <!-- 内容区域 -->
      <div class="descriptions-content">
        <div
          v-for="(value, key) in filteredData"
          :key="key"
          class="descriptions-row"
        >
          <!-- 标签列 -->
          <div class="descriptions-label">
            {{ getLabel(key) }}
          </div>
          <!-- 内容列 -->
          <div class="descriptions-value">
            {{ value || '-' }} <!-- 空值显示横线 -->
          </div>
        </div>

        <!-- 空数据提示 -->
        <div v-if="!loading && Object.keys(filteredData).length === 0" class="empty-container">
          暂无数据
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'DynamicDetailDialog',
  props: {
    title: {
      type: String,
      default: ''
    },
    visible: Boolean,
    width: {
      type: Number,
      default: 560
    },
    height: {
      type: String,
      default: 'auto'
    },
    data: {
      type: Object,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    },
    // 动态排除字段：由父组件传递，默认值保持不变
    excludeFields: {
      type: Array,
      default: () => ['id', 'password']
    },
    // 动态标签映射：由父组件传递，默认空对象
    labelMap: {
      type: Object,
      default: () => ({})
    },
    // 是否显示边框
    border: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    filteredData() {
      const result = {}
      for (const [key, value] of Object.entries(this.data)) {
        // 使用props传递的excludeFields进行过滤
        if (!this.excludeFields.includes(key)) {
          result[key] = value
        }
      }
      return result
    }
  },
  methods: {
    getLabel(key) {
      // 优先使用父组件传递的labelMap，没有则返回key本身
      return this.labelMap[key] || key
    }
  }
}
</script>

<style scoped>
.custom-dialog {
  --dialog-padding: 20px;
}

.custom-descriptions {
  width: 100%;
  font-size: 14px;
  /*padding: var(--dialog-padding);*/
  min-height: 200px; /* 设置最小高度避免布局跳动 */
}

.custom-descriptions.has-border {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.descriptions-content {
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 0;
}

.descriptions-row {
  display: contents;
}

.descriptions-label {
  padding: 12px 16px;
  background-color: #f5f7fa;
  color: #4e5969;
  font-weight: 500;
  border-bottom: 1px solid #e4e7ed;
  border-right: 1px solid #e4e7ed;
  text-align: left;
}

.descriptions-value {
  padding: 12px 16px;
  color: #1f2d3d;
  border-bottom: 1px solid #e4e7ed;
  word-break: break-all;
}

.descriptions-row:last-child .descriptions-label,
.descriptions-row:last-child .descriptions-value {
  border-bottom: none;
}

/* 空数据样式 */
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #909399;
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .descriptions-content {
    grid-template-columns: 1fr;
  }

  .descriptions-label {
    text-align: left;
    border-right: none;
    padding-bottom: 4px;
  }

  .descriptions-value {
    padding-top: 4px;
    padding-bottom: 20px;
  }
}
</style>
