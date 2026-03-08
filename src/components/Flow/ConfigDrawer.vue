<template>
  <div v-if="visible" class="config-drawer">
    <div class="drawer-content">
      <div class="drawer-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <div class="drawer-body">
        <!-- 动态加载对应类型的配置表单组件 -->
        <component
          :is="formComponent"
          :form-data="formData"
          :flow-id="flowId"
          @save="handleSave"
          @cancel="handleClose"
        />
      </div>
    </div>
  </div>
</template>

<script>
// 导入各类型的配置表单组件
import TableInputConfig from './config/input/TableInputConfig.vue'
import UpsetOutputConfig from './config/output/UpsetOutputConfig.vue'
import TableOutputConfig from './config/output/TableOutputConfig.vue'

export default {
  name: 'ConfigDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    componentType: {
      type: String,
      required: true
    },
    initialForm: {
      type: Object,
      default: () => ({})
    },
    title: {
      type: String,
      default: '组件配置'
    },
    flowId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      // 表单数据（双向绑定）
      formData: { ...this.initialForm }
    }
  },
  computed: {
    // 根据组件类型匹配对应的表单组件
    formComponent() {
      const componentMap = {
        TableInput: TableInputConfig,
        UpsetOutput: UpsetOutputConfig,
        TableOutput: TableOutputConfig
      }
      return componentMap[this.componentType] || TableInputConfig
    }
  },
  watch: {
    // 监听初始数据变化，同步到表单
    initialForm: {
      handler(newVal) {
        this.formData = { ...newVal }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    // 关闭抽屉
    handleClose() {
      this.$emit('close')
    },
    // 保存配置
    handleSave() {
      this.$emit('save', { ...this.formData })
    }
  }
}
</script>

<style scoped>
.config-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 30%;
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

.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.drawer-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
