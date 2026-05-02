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

.custom-dialog ::v-deep .el-dialog {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.custom-dialog ::v-deep .el-dialog__header {
  position: relative;
  flex-shrink: 0;
  padding: 16px 48px 16px 20px;
  margin: 0;
  border-bottom: 1px solid #e9eef8;
  background: #f8faff;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.custom-dialog ::v-deep .el-dialog__title {
  color: #1f3358;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.02em;
}

.custom-dialog ::v-deep .el-dialog__headerbtn {
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  padding: 0;
}

.custom-dialog ::v-deep .el-dialog__headerbtn .el-dialog__close {
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  border-radius: 50%;
  background: #eef0f3;
  color: #606266;
  font-size: 14px;
  transition: background-color 0.2s, color 0.2s;
}

.custom-dialog ::v-deep .el-dialog__headerbtn .el-dialog__close:hover {
  background: #e4e7ed;
  color: #1f3358;
}

.custom-dialog ::v-deep .el-dialog__body {
  padding: 20px;
  background: #fff;
}

.custom-descriptions {
  width: 100%;
  font-size: 14px;
  min-height: 200px;
}

.custom-descriptions.has-border {
  border: 1px solid #e9eef8;
  border-radius: 8px;
  overflow: hidden;
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
  background-color: #f8faff;
  color: #31415f;
  font-weight: 500;
  border-bottom: 1px solid #e9eef8;
  border-right: 1px solid #e9eef8;
  text-align: left;
}

.descriptions-value {
  padding: 12px 16px;
  color: #4b566a;
  border-bottom: 1px solid #e9eef8;
  word-break: break-all;
  background-color: #fff;
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
  background-color: #fff;
}

@media (max-width: 768px) {
  .descriptions-content {
    grid-template-columns: 1fr;
  }

  .descriptions-label {
    text-align: left;
    border-right: none;
    padding-bottom: 4px;
    border-bottom: none;
  }

  .descriptions-value {
    padding-top: 4px;
    padding-bottom: 20px;
  }
}
</style>
