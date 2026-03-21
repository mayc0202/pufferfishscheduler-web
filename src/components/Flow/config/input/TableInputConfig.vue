<template>
  <div class="table-input-config">
    <div class="config-content">
      <div class="form-title">关系表表输入</div>

      <div class="form-item">
        <label class="form-label required">节点名称：</label>
        <input
          v-model="formData.name"
          type="text"
          class="form-input"
          placeholder="关系表表输入"
        >
      </div>

      <div class="form-item">
        <label class="form-label">节点说明：</label>
        <textarea
          v-model="formData.description"
          class="form-textarea"
          placeholder="请输入说明"
          rows="3"
        />
      </div>

      <div class="form-item">
        <label class="form-label required">数据源连接：</label>
        <div v-click-outside="closeDbDropdown" class="custom-select">
          <div class="select-input" @click="dbDropdownOpen = !dbDropdownOpen">
            <span v-if="selectedLabel">{{ selectedLabel }}</span>
            <span v-else class="placeholder">请选择数据源</span>
            <i class="el-icon-arrow-down arrow" :class="{ open: dbDropdownOpen }" />
          </div>
          <div v-show="dbDropdownOpen" class="select-dropdown">
            <div
              v-for="group in processedOptions"
              :key="group.value"
              class="select-group"
            >
              <div class="select-group-title">{{ group.label }}</div>
              <div
                v-for="item in group.children"
                :key="item.value"
                class="select-option"
                :class="{ selected: selectedValue === item.value }"
                @click="selectDbItem(item)"
              >
                {{ item.label }}
              </div>
            </div>
            <div v-if="processedOptions.length === 0" class="select-empty">暂无数据</div>
          </div>
        </div>
      </div>

      <div class="form-item">
        <label class="form-label required">自定义sql：</label>
        <div class="sql-editor-wrapper">
          <textarea
            v-model="formData.sql"
            class="sql-editor"
            placeholder="请输入SQL语句"
            rows="8"
          />
        </div>
      </div>

      <div class="form-item checkbox-item">
        <el-checkbox v-model="formData.replaceVariables">替换SQL语句里的变量</el-checkbox>
        <span class="help-icon" title="帮助">?</span>
      </div>

      <div class="form-item checkbox-item">
        <el-checkbox v-model="formData.isIncrement">是否增量</el-checkbox>
      </div>

      <div class="form-item">
        <label class="form-label">记录数量限制：</label>
        <input
          v-model="formData.rowLimit"
          type="number"
          class="form-input"
          placeholder="默认0（不限制）"
          min="1"
        >
      </div>

      <div class="form-actions">
        <button type="button" class="btn preview-btn" @click="previewData">预览数据</button>
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <div v-if="previewVisible" class="preview-dialog-mask" @click="previewVisible = false">
      <div class="preview-dialog" @click.stop>
        <div class="preview-header">
          <span class="preview-title">预览数据</span>
          <button class="close-preview" @click="previewVisible = false">×</button>
        </div>
        <div class="preview-body">
          <el-table
            v-loading="previewLoading"
            :data="previewTableData"
            border
            style="width: 100%"
            max-height="500"
          >
            <el-table-column
              type="index"
              label="#"
              width="60"
            />
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
      </div>
    </div>
  </div>
</template>

<script>
import { relationalDbTree } from '@/api/database/database/dbGroup'
import { previewData as previewDataApi } from '@/api/collect/trans/transFlow'

export default {
  name: 'TableInputConfig',
  directives: {
    'click-outside': {
      bind(el, binding) {
        el._clickOutside = function(event) {
          if (!(el === event.target || el.contains(event.target))) {
            binding.value()
          }
        }
        document.addEventListener('click', el._clickOutside)
      },
      unbind(el) {
        document.removeEventListener('click', el._clickOutside)
      }
    }
  },
  props: {
    formData: {
      type: Object,
      required: true
    },
    flowId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      dbList: [],
      selectedValue: null,
      processedOptions: [],
      dbDropdownOpen: false,
      previewVisible: false,
      previewLoading: false,
      previewTableData: [],
      previewColumns: []
    }
  },
  computed: {
    selectedLabel() {
      if (!this.selectedValue) return ''
      for (const group of this.processedOptions) {
        if (group.children) {
          const item = group.children.find(opt => opt.value === this.selectedValue)
          if (item) {
            return `${group.label} / ${item.label}`
          }
        }
      }
      return ''
    }
  },
  watch: {
    'formData.dataSourceId': {
      handler(val) {
        this.selectedValue = val
      },
      immediate: true
    }
  },
  mounted() {
    this.loadDbData()
  },
  methods: {
    closeDbDropdown() {
      this.dbDropdownOpen = false
    },
    selectDbItem(item) {
      this.selectedValue = item.value
      this.formData.dataSourceId = item.value
      this.formData.dbConnection = item.value
      this.dbDropdownOpen = false
    },
    async loadDbData() {
      try {
        const res = await relationalDbTree()
        if (res && res.code === '000000' && res.data) {
          this.$set(this, 'dbList', res.data)
          this.processData()
        } else {
          console.error('接口返回数据格式错误：', res)
          this.$message.error('获取数据源列表失败')
          this.$set(this, 'processedOptions', [])
        }
      } catch (error) {
        console.error('获取数据失败:', error)
        this.$message.error('获取数据源列表失败')
        this.$set(this, 'processedOptions', [])
      }
    },
    /**
     * 处理数据源数据，转换为树状结构
     */
    processData() {
      if (!this.dbList || this.dbList.length === 0) {
        this.processedOptions = []
        return
      }

      const result = []
      for (const group of this.dbList) {
        if (!group || group.type !== 'GROUP') continue
        if (!group.children || !Array.isArray(group.children)) continue

        const children = []
        for (const child of group.children) {
          if (child && child.type === 'DATABASE') {
            children.push({
              value: String(child.id),
              label: child.name
            })
          }
        }

        if (children.length > 0) {
          result.push({
            value: String(group.id),
            label: group.name || '未知分组',
            children: children
          })
        }
      }

      this.$set(this, 'processedOptions', result)

      // 如果已有选中的数据源，更新 selectedLabel
      if (this.selectedValue) {
        this.updateSelectedLabel(this.selectedValue)
      }
    },
    /**
     * 更新选中的标签
     * @param dataSourceId 数据源ID
     */
    updateSelectedLabel(dataSourceId) {
      // 根据 dataSourceId 更新 selectedLabel
      if (!dataSourceId || !this.processedOptions || this.processedOptions.length === 0) {
        return
      }
      for (const group of this.processedOptions) {
        if (group.children) {
          const item = group.children.find(opt => opt.value === String(dataSourceId))
          if (item) {
            // selectedLabel 是一个计算属性，会自动更新
            return
          }
        }
      }
    },
    /**
     * 预览数据
     */
    async previewData() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在')
        return
      }
      if (!this.formData.name) {
        this.$message.warning('请先输入步骤名称')
        return
      }
      if (!this.formData.dataSourceId) {
        this.$message.warning('请先选择数据源')
        return
      }
      if (!this.formData.sql) {
        this.$message.warning('请先输入自定义SQL')
        return
      }

      this.previewVisible = true
      this.previewLoading = true
      this.previewTableData = []
      this.previewColumns = []

      try {
        // 构建组件配置数据
        const config = {
          name: this.formData.name,
          code: 'TableInput',
          data: {
            name: this.formData.name,
            description: this.formData.description,
            dataSourceId: this.formData.dataSourceId,
            dbConnection: this.formData.dbConnection,
            sql: this.formData.sql,
            replaceVariable: this.formData.replaceVariables,
            increment: this.formData.isIncrement,
            rowLimit: this.formData.rowLimit || '0',
            configMode: 'custom'
          }
        }

        var data = {
          id: this.flowId,
          config: JSON.stringify(config)
        }
        const res = await previewDataApi(data)
        if (res.code === '000000' && res.data) {
          // 适配新的接口返回格式：fieldList（字段列表）和 dataList（数据列表）
          if (res.data.fieldList && res.data.fieldList.length > 0) {
            this.previewColumns = res.data.fieldList
            // 将数组的数组转换为对象数组，方便 el-table 展示
            if (res.data.dataList && res.data.dataList.length > 0) {
              this.previewTableData = res.data.dataList.map(row => {
                const obj = {}
                res.data.fieldList.forEach((field, index) => {
                  obj[field] = row[index]
                })
                return obj
              })
            } else {
              this.previewTableData = []
            }
          } else {
            this.previewColumns = []
            this.previewTableData = []
          }
        } else {
          this.$message.error(res.message || '获取预览数据失败')
        }
      } catch (error) {
        console.error('预览数据失败:', error)
        this.$message.error('预览数据失败')
      } finally {
        this.previewLoading = false
      }
    },
    handleSubmit() {
      if (!this.formData.name) {
        this.$message.warning('请输入步骤名称')
        return
      }
      if (!this.formData.dataSourceId) {
        this.$message.warning('请选择数据源')
        return
      }
      if (!this.formData.sql) {
        this.$message.warning('请输入自定义SQL')
        return
      }

      this.formData.dataSourceId = this.formData.dataSourceId
      this.formData.sql = this.formData.sql
      this.formData.replaceVariable = this.formData.replaceVariables
      this.formData.increment = this.formData.isIncrement
      this.formData.rowLimit = this.formData.rowLimit || '0'
      this.formData.configMode = 'custom'

      this.$emit('save')
    }
  }
}
</script>

<style scoped>
.table-input-config {
  width: 100%;
}

.config-content {
  padding: 20px;
}

.form-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
}

.form-item {
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
}

.form-label {
  width: 100px;
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
  color: #F56C6C;
  margin-right: 4px;
}

.form-input {
  flex: 1;
  padding: 0 15px;
  height: 40px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  color: #606266;
  background: #FFF;
  transition: border-color 0.2s;
}

.form-input:hover {
  border-color: #C0C4CC;
}

.form-input:focus {
  border-color: #409EFF;
  outline: none;
}

.form-textarea {
  flex: 1;
  padding: 8px 15px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  color: #606266;
  background: #FFF;
  transition: border-color 0.2s;
  resize: none;
}

.form-textarea:hover {
  border-color: #C0C4CC;
}

.form-textarea:focus {
  border-color: #409EFF;
  outline: none;
}

.sql-editor-wrapper {
  flex: 1;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  overflow: hidden;
}

.sql-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: #F5F7FA;
  border-bottom: 1px solid #DCDFE6;
}

.sql-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 12px;
  background: #E4E7ED;
  border-radius: 2px;
  font-size: 12px;
  color: #606266;
}

.fullscreen-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #909399;
  padding: 4px;
}

.sql-editor {
  width: 100%;
  padding: 10px;
  border: none;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  color: #606266;
  background: #FFF;
  resize: none;
  box-sizing: border-box;
}

.sql-editor:focus {
  outline: none;
}

.checkbox-item {
  align-items: center;
  margin-left: 112px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #F0F2F5;
  border-radius: 50%;
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #EBEEF5;
}

.btn {
  padding: 0 20px;
  height: 36px;
  line-height: 36px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: #FFF;
  color: #606266;
  transition: all 0.2s;
}

.preview-btn {
  background: #ECF5FF;
  color: #409EFF;
  border-color: #B3D8FF;
}

.preview-btn:hover {
  background: #D9ECFF;
}

.primary-btn {
  background: #409EFF;
  color: #FFF;
  border-color: #409EFF;
}

.primary-btn:hover {
  background: #66B1FF;
  border-color: #66B1FF;
}

.secondary-btn:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.custom-select {
  flex: 1;
  position: relative;
  font-size: 14px;
}

.select-input {
  padding: 0 30px 0 15px;
  height: 40px;
  line-height: 40px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #FFF;
  color: #606266;
  transition: border-color 0.2s;
}

.select-input:hover {
  border-color: #C0C4CC;
}

.placeholder {
  color: #C0C4CC;
}

.arrow {
  position: absolute;
  right: 10px;
  font-size: 12px;
  color: #C0C4CC;
  transition: transform 0.3s;
  line-height: 40px;
}

.arrow.open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: #FFF;
  border: 1px solid #E4E7ED;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 9999;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.select-option {
  padding: 0 15px;
  height: 34px;
  line-height: 34px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.select-option:hover {
  background-color: #F5F7FA;
}

.select-option.selected {
  color: #409EFF;
  font-weight: 500;
}

.select-empty {
  padding: 10px 0;
  color: #909399;
  text-align: center;
  font-size: 14px;
}

.select-group {
  margin: 0;
  padding: 0;
}

.select-group-title {
  padding: 0 15px;
  height: 30px;
  line-height: 30px;
  font-size: 12px;
  color: #909399;
  background: #F5F7FA;
  font-weight: 500;
}

.select-group .select-option {
  padding-left: 25px;
}

.table-desc {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.preview-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-dialog {
  background: #FFF;
  border-radius: 4px;
  width: 90%;
  max-width: 1200px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
}

.preview-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.close-preview {
  background: none;
  border: none;
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.close-preview:hover {
  color: #606266;
}

.preview-body {
  flex: 1;
  padding: 20px;
  overflow: auto;
  max-height: calc(80vh - 60px);
  overflow-x: auto;
  overflow-y: auto;
}

.preview-body .el-table {
  max-width: none;
}
</style>
