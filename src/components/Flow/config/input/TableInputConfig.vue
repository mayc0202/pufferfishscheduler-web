<template>
  <div class="table-input-config">
    <div class="config-tabs">
      <div
        class="tab-item"
        :class="{ active: currentTab === 'basic' }"
        @click="currentTab = 'basic'"
      >基础配置</div>
      <div
        class="tab-item"
        :class="{ active: currentTab === 'advanced' }"
        @click="currentTab = 'advanced'"
      >高级配置</div>
    </div>

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
            <span class="arrow" :class="{ open: dbDropdownOpen }">▼</span>
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
        <label class="form-label required">配置方式：</label>
        <div class="custom-select">
          <div class="select-input" @click="configModeOpen = !configModeOpen">
            <span>{{ configMode === 'default' ? '默认' : '自定义SQL' }}</span>
            <span class="arrow" :class="{ open: configModeOpen }">▼</span>
          </div>
          <div v-show="configModeOpen" class="select-dropdown">
            <div
              class="select-option"
              :class="{ selected: configMode === 'default' }"
              @click="selectConfigMode('default')"
            >默认</div>
            <div
              class="select-option"
              :class="{ selected: configMode === 'custom' }"
              @click="selectConfigMode('custom')"
            >自定义SQL</div>
          </div>
        </div>
      </div>

      <div v-if="configMode === 'custom'" class="form-item">
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

      <div v-if="configMode === 'default'" class="form-item">
        <label class="form-label required">关系表名：</label>
        <div v-click-outside="closeTableDropdown" class="custom-select">
          <div class="select-input" @click="tableDropdownOpen = !tableDropdownOpen">
            <span v-if="formData.tableName">{{ formData.tableName }}</span>
            <span v-else class="placeholder">请选择关系表</span>
            <span class="arrow" :class="{ open: tableDropdownOpen }">▼</span>
          </div>
          <div v-show="tableDropdownOpen" class="select-dropdown">
            <div
              v-for="item in tableList"
              :key="item.id"
              class="select-option"
              :class="{ selected: formData.tableName === item.name }"
              @click="selectTableItem(item)"
            >
              {{ item.name }}<span v-if="item.description" class="table-desc">{{ item.description }}</span>
            </div>
            <div v-if="tableList.length === 0" class="select-empty">{{ selectedValue ? '暂无数据' : '请先选择数据源' }}</div>
          </div>
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
        <label class="form-label">行限制：</label>
        <input
          v-model="formData.rowLimit"
          type="number"
          class="form-input"
          placeholder="默认1000"
          min="1"
        >
      </div>

      <div class="form-item">
        <label class="form-label">步骤插入变量：</label>
        <input
          v-model="formData.stepInsertVariable"
          type="text"
          class="form-input"
          placeholder="可选"
        >
      </div>

      <div class="form-item checkbox-item">
        <el-checkbox v-model="formData.implementEveryOne">是否每个实例都执行</el-checkbox>
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
            :data="previewData"
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
import { dbTableList } from '@/api/database/database/database'
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
      currentTab: 'basic',
      configMode: 'default',
      dbList: [],
      selectedValue: null,
      processedOptions: [],
      dbDropdownOpen: false,
      tableDropdownOpen: false,
      configModeOpen: false,
      tableList: [],
      previewVisible: false,
      previewLoading: false,
      previewData: [],
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
        if (val) {
          this.loadTableList(val)
        }
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
    closeTableDropdown() {
      this.tableDropdownOpen = false
    },
    selectDbItem(item) {
      this.selectedValue = item.value
      this.formData.dataSourceId = item.value
      this.formData.dbConnection = item.value
      this.formData.tableName = ''
      this.tableList = []
      this.dbDropdownOpen = false
      this.loadTableList(item.value)
    },
    selectTableItem(item) {
      this.formData.tableName = item.name
      this.tableDropdownOpen = false
    },
    selectConfigMode(mode) {
      this.configMode = mode
      this.configModeOpen = false
    },
    async loadTableList(dataSourceId) {
      try {
        const res = await dbTableList(dataSourceId)
        if (res && res.code === '000000' && res.data) {
          this.tableList = res.data
        } else {
          this.tableList = []
        }
      } catch (error) {
        console.error('获取表列表失败:', error)
        this.tableList = []
      }
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
    },
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
      if (this.configMode === 'default' && !this.formData.tableName) {
        this.$message.warning('请先选择关系表')
        return
      }
      if (this.configMode === 'custom' && !this.formData.sql) {
        this.$message.warning('请先输入自定义SQL')
        return
      }

      this.previewVisible = true
      this.previewLoading = true
      this.previewData = []
      this.previewColumns = []

      try {
        const res = await previewDataApi(this.flowId, this.formData.name)
        if (res.code === '000000' && res.data) {
          if (res.data.columns && res.data.columns.length > 0) {
            this.previewColumns = res.data.columns
          } else if (res.data.list && res.data.list.length > 0) {
            this.previewColumns = Object.keys(res.data.list[0])
          }
          this.previewData = res.data.list || res.data.rows || []
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
      if (this.configMode === 'default' && !this.formData.tableName) {
        this.$message.warning('请选择关系表')
        return
      }
      if (this.configMode === 'custom' && !this.formData.sql) {
        this.$message.warning('请输入自定义SQL')
        return
      }

      // 调整字段名称以匹配后端期望的JSON结构
      this.formData.dataSourceId = this.formData.dataSourceId
      this.formData.sql = this.formData.sql
      this.formData.replaceVariable = this.formData.replaceVariables
      this.formData.increment = this.formData.isIncrement
      this.formData.rowLimit = this.formData.rowLimit || '1000' // 默认1000行
      this.formData.stepInsertVariable = this.formData.stepInsertVariable
      this.formData.implementEveryOne = this.formData.implementEveryOne
      this.formData.configMode = this.configMode

      this.$emit('save')
    }
  }
}
</script>

<style scoped>
.table-input-config {
  width: 100%;
}

.config-tabs {
  display: flex;
  border-bottom: 1px solid #EBEEF5;
  background: #FFF;
}

.tab-item {
  padding: 12px 20px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #409EFF;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #409EFF;
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
}
</style>
