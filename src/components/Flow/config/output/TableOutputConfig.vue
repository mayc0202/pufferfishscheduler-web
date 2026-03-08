<template>
  <div class="table-output-config">
    <!-- 标签页 -->
    <div class="config-tabs">
      <div
        class="tab-item"
        :class="{ active: currentTab === 'basic' }"
        @click="currentTab = 'basic'"
      >
        基础配置
      </div>
      <div
        class="tab-item"
        :class="{ active: currentTab === 'advanced' }"
        @click="currentTab = 'advanced'"
      >
        高级配置
      </div>
      <div
        class="tab-item"
        :class="{ active: currentTab === 'step' }"
        @click="currentTab = 'step'"
      >
        步骤错误处理设置
      </div>
    </div>

    <!-- 配置内容 -->
    <div class="config-content">
      <!-- 基础配置 -->
      <div v-show="currentTab === 'basic'" class="tab-content">
        <h3 class="section-title">关系库表输出</h3>

        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input
            v-model="formData.name"
            type="text"
            class="form-input"
            placeholder="输出到治理库"
          >
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <input
            v-model="formData.description"
            type="text"
            class="form-input"
            placeholder="请输入说明"
          >
        </div>

        <div class="section-header">
          <h4>通用配置</h4>
          <div class="section-toggle" @click="toggleSection('general')">
            {{ sectionOpen.general ? '▼' : '▶' }}
          </div>
        </div>
        <div v-show="sectionOpen.general" class="section-content">
          <div class="form-item">
            <label class="form-label required">数据源：</label>
            <div v-click-outside="closeDbDropdown" class="custom-select">
              <div class="select-input" @click="dbDropdownOpen = !dbDropdownOpen">
                <span v-if="selectedLabel">{{ selectedLabel }}</span>
                <span v-else class="placeholder">请选择数据源</span>
                <span class="arrow" :class="{ open: dbDropdownOpen }">▼</span>
              </div>
              <div v-show="dbDropdownOpen" class="select-dropdown">
                <div
                  v-for="group in processedDbOptions"
                  :key="group.label"
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
                <div v-if="processedDbOptions.length === 0" class="select-empty">暂无数据</div>
              </div>
            </div>
          </div>

          <div class="form-item">
            <label class="form-label">模式名称 (schema)：</label>
            <input
              v-model="formData.schemaName"
              type="text"
              class="form-input"
              placeholder="请输入模式名称 (schema)"
            >
          </div>

          <div class="form-item">
            <label class="form-label required">表名称：</label>
            <div v-click-outside="closeTableDropdown" class="custom-select">
              <div class="select-input" @click="tableDropdownOpen = !tableDropdownOpen">
                <span v-if="formData.tableName">{{ formData.tableName }}</span>
                <span v-else class="placeholder">请选择表名称</span>
                <span class="arrow" :class="{ open: tableDropdownOpen }">▼</span>
              </div>
              <div v-show="tableDropdownOpen" class="select-dropdown">
                <div
                  v-for="table in tableList"
                  :key="table.id || table"
                  class="select-option"
                  :class="{ selected: formData.tableName === (table.name || table) }"
                  @click="selectTableItem(table)"
                >
                  {{ table.name || table }}
                </div>
                <div v-if="tableList.length === 0" class="select-empty">{{ selectedValue ? '暂无数据' : '请先选择数据源' }}</div>
              </div>
            </div>
          </div>

          <div class="form-item">
            <label class="form-label">提交记录数量：</label>
            <input
              v-model="formData.commitSize"
              type="number"
              class="form-input"
              placeholder="1000"
              min="1"
            >
          </div>

          <div class="form-item checkbox-item">
            <el-checkbox v-model="formData.truncateTable">写入之前清空表</el-checkbox>
          </div>
        </div>

        <div class="section-header">
          <h4>数据库字段</h4>
          <div class="section-toggle" @click="toggleSection('fields')">
            {{ sectionOpen.fields ? '▼' : '▶' }}
          </div>
        </div>
        <div v-show="sectionOpen.fields" class="section-content">
          <div class="form-item checkbox-item">
            <el-checkbox v-model="formData.specifyFields">指定数据库字段</el-checkbox>
          </div>

          <div v-if="formData.specifyFields" class="field-mapping">
            <table class="field-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>流字段</th>
                  <th>表字段</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(field, index) in formData.fieldList" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>
                    <input
                      v-model="field.fieldStream"
                      type="text"
                      class="field-input"
                    >
                  </td>
                  <td>
                    <input
                      v-model="field.fieldDatabase"
                      type="text"
                      class="field-input"
                    >
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="field-actions">
              <a href="#" @click.prevent="editFields">编辑字段</a>
            </div>
          </div>
        </div>
      </div>

      <!-- 高级配置 -->
      <div v-show="currentTab === 'advanced'" class="tab-content">
        <div class="form-item checkbox-item">
          <el-checkbox v-model="formData.ignoreErrors">忽略插入错误</el-checkbox>
        </div>

        <div class="form-item checkbox-item">
          <el-checkbox v-model="formData.useBatchUpdate">是否批量插入</el-checkbox>
        </div>

        <div class="form-item">
          <label class="form-label">分区表类型：</label>
          <select v-model="formData.partitioningType" class="form-select">
            <option value="">请选择</option>
            <option value="none">无</option>
            <option value="time">时间分区</option>
            <option value="field">字段分区</option>
          </select>
        </div>

        <div v-if="formData.partitioningType === 'field'" class="form-item">
          <label class="form-label">分区字段：</label>
          <input
            v-model="formData.partitioningField"
            type="text"
            class="form-input"
            placeholder="请输入分区字段"
          >
        </div>

        <div v-if="formData.partitioningType === 'time'" class="form-item">
          <label class="form-label">分区字段：</label>
          <input
            v-model="formData.partitioningField"
            type="text"
            class="form-input"
            placeholder="请输入分区字段"
          >
        </div>

        <div v-if="formData.partitioningType === 'time'" class="form-item">
          <label class="form-label">按月或天：</label>
          <select v-model="formData.partitioningTimeRadio" class="form-select">
            <option value="">请选择</option>
            <option value="month">按月</option>
            <option value="day">按天</option>
          </select>
        </div>

        <div class="form-item">
          <label class="form-label">包含表名的字段：</label>
          <input
            v-model="formData.tableNameField"
            type="text"
            class="form-input"
            placeholder="请输入包含表名的字段"
          >
        </div>

        <div class="form-item checkbox-item">
          <el-checkbox v-model="formData.tableNameInTable">存储表名字段</el-checkbox>
        </div>

        <div class="form-item checkbox-item">
          <el-checkbox v-model="formData.returningGeneratedKeys">返回自动产生的关键字</el-checkbox>
        </div>

        <div v-if="formData.returningGeneratedKeys" class="form-item">
          <label class="form-label">自动产生的关键字的字段名称：</label>
          <input
            v-model="formData.generatedKeyField"
            type="text"
            class="form-input"
            placeholder="请输入字段名称"
          >
        </div>

        <div class="form-item checkbox-item">
          <el-checkbox v-model="formData.distributeType">分发或复制</el-checkbox>
        </div>
      </div>

      <!-- 步骤错误处理设置 -->
      <div v-show="currentTab === 'step'" class="tab-content">
        <!-- 这里可以添加错误处理相关的配置 -->
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <!-- 编辑字段对话框 -->
    <div v-if="editFieldsVisible" class="dialog-mask" @click="editFieldsVisible = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>编辑数据库字段</h3>
          <button class="close-btn" @click="editFieldsVisible = false">×</button>
        </div>
        <div class="dialog-body">
          <table class="field-edit-table">
            <thead>
              <tr>
                <th>#</th>
                <th class="required">流字段</th>
                <th class="required">表字段</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(field, index) in editFieldList" :key="index">
                <td>{{ index + 1 }}</td>
                <td>
                  <input
                    v-model="field.fieldStream"
                    type="text"
                    class="field-input"
                  >
                </td>
                <td>
                  <input
                    v-model="field.fieldDatabase"
                    type="text"
                    class="field-input"
                  >
                </td>
                <td>
                  <button type="button" class="btn remove-btn" @click="removeField(index)">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <button type="button" class="btn add-btn" @click="addField">+ 添加行</button>
        </div>
        <div class="dialog-footer">
          <button type="button" class="btn secondary-btn" @click="getFields">获取字段</button>
          <button type="button" class="btn primary-btn" @click="saveFields">确定</button>
          <button type="button" class="btn secondary-btn" @click="editFieldsVisible = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { relationalDbTree } from '@/api/database/database/dbGroup'
import { dbTableList } from '@/api/database/database/database'

export default {
  name: 'TableOutputConfig',
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
      sectionOpen: {
        general: true,
        fields: true
      },
      dbList: [],
      tableList: [],
      dbDropdownOpen: false,
      tableDropdownOpen: false,
      processedDbOptions: [],
      selectedValue: '',
      selectedLabel: '',
      editFieldsVisible: false,
      editFieldList: []
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
    },
    selectedValue: {
      handler(val) {
        this.formData.dataSourceId = val
      }
    }
  },
  created() {
    this.loadDbList()
    this.initFormData()
  },
  methods: {
    initFormData() {
      // 初始化默认值
      if (!this.formData.commitSize) {
        this.formData.commitSize = '1000'
      }
      if (!this.formData.fieldList) {
        this.formData.fieldList = []
      }
    },
    toggleSection(section) {
      this.sectionOpen[section] = !this.sectionOpen[section]
    },
    async loadDbList() {
      try {
        const res = await relationalDbTree()
        if (res && res.code === '000000' && res.data) {
          this.$set(this, 'dbList', res.data)
          this.processDbOptions()
        } else {
          this.$set(this, 'dbList', [])
        }
      } catch (error) {
        console.error('加载数据库列表失败:', error)
        this.$set(this, 'dbList', [])
      }
    },
    processDbOptions() {
      if (!this.dbList || this.dbList.length === 0) {
        this.$set(this, 'processedDbOptions', [])
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
            label: group.name || '未知分组',
            children: children
          })
        }
      }

      this.$set(this, 'processedDbOptions', result)
    },
    selectDbItem(item) {
      this.selectedValue = item.value
      this.selectedLabel = item.label
      this.formData.dataSourceId = item.value
      this.formData.tableName = ''
      this.tableList = []
      this.dbDropdownOpen = false
      this.loadTableList(item.value)
    },
    selectTableItem(table) {
      this.formData.tableName = table.name || table
      this.tableDropdownOpen = false
    },
    closeDbDropdown() {
      this.dbDropdownOpen = false
    },
    closeTableDropdown() {
      this.tableDropdownOpen = false
    },
    async loadTableList(dataSourceId) {
      try {
        const res = await dbTableList(dataSourceId)
        if (res && res.code === '000000' && res.data) {
          this.$set(this, 'tableList', res.data)
        } else {
          this.$set(this, 'tableList', [])
        }
      } catch (error) {
        console.error('加载表列表失败:', error)
        this.$set(this, 'tableList', [])
      }
    },
    editFields() {
      // 复制当前字段列表用于编辑
      this.editFieldList = JSON.parse(JSON.stringify(this.formData.fieldList))
      this.editFieldsVisible = true
    },
    addField() {
      this.editFieldList.push({
        fieldStream: '',
        fieldDatabase: '',
        spatialType: false,
        coordinateSystem: ''
      })
    },
    removeField(index) {
      this.editFieldList.splice(index, 1)
    },
    getFields() {
      // 这里可以添加从数据源获取字段的逻辑
      this.$message.info('获取字段功能待实现')
    },
    saveFields() {
      this.formData.fieldList = this.editFieldList
      this.editFieldsVisible = false
    },
    handleSubmit() {
      // 验证必填字段
      if (!this.formData.name) {
        this.$message.warning('请输入步骤名称')
        return
      }
      if (!this.formData.dataSourceId) {
        this.$message.warning('请选择数据源')
        return
      }
      if (!this.formData.tableName) {
        this.$message.warning('请选择表名称')
        return
      }

      // 确保提交记录数量有默认值
      if (!this.formData.commitSize) {
        this.formData.commitSize = '1000'
      }

      // 调整字段名称以匹配后端期望的JSON结构，与表输入保持一致
      this.formData.dataSourceId = this.formData.dataSourceId
      this.formData.tableName = this.formData.tableName
      this.formData.commitSize = this.formData.commitSize
      this.formData.preSql = this.formData.preSql
      this.formData.postSql = this.formData.postSql
      this.formData.fieldList = this.formData.fieldList
      this.formData.updateField = this.formData.updateField
      this.formData.updatePolicy = this.formData.updatePolicy
      this.formData.skipHeader = this.formData.skipHeader
      this.formData.ignoreError = this.formData.ignoreError
      this.formData.retryTimes = this.formData.retryTimes
      this.formData.retryInterval = this.formData.retryInterval

      this.$emit('save')
    }
  }
}
</script>

<style scoped>
.table-output-config {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 标签页样式 */
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
  transition: all 0.3s;
}

.tab-item:hover {
  color: #409EFF;
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

/* 配置内容 */
.config-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #F5F7FA;
}

.tab-content {
  background: #FFF;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #EBEEF5;
  margin-top: 20px;
  margin-bottom: 15px;
}

.section-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.section-toggle {
  cursor: pointer;
  color: #909399;
  font-size: 12px;
}

.section-content {
  padding: 15px 0;
}

/* 表单样式 */
.form-item {
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
}

.form-item.checkbox-item {
  align-items: center;
  margin-left: 112px;
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

.form-input, .form-select {
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

.form-input:hover, .form-select:hover {
  border-color: #C0C4CC;
}

.form-input:focus, .form-select:focus {
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
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

.secondary-btn {
  background: white;
  color: #606266;
  border-color: #DCDFE6;
}

.secondary-btn:hover {
  border-color: #409EFF;
  color: #409EFF;
}

/* 自定义下拉框 */
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

/* 字段映射 */
.field-mapping {
  margin-top: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
}

.field-table {
  width: 100%;
  border-collapse: collapse;
}

.field-table th,
.field-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #EBEEF5;
}

.field-table th {
  background: #F5F7FA;
  font-weight: 600;
  color: #303133;
}

.field-input {
  width: 100%;
  padding: 0 15px;
  height: 32px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  color: #606266;
  background: #FFF;
  transition: border-color 0.2s;
}

.field-input:hover {
  border-color: #C0C4CC;
}

.field-input:focus {
  border-color: #409EFF;
  outline: none;
}

.field-actions {
  padding: 12px;
  text-align: right;
  background: #F5F7FA;
}

.field-actions a {
  color: #409EFF;
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
}

.field-actions a:hover {
  text-decoration: underline;
}

/* 编辑字段对话框 */
.edit-fields-dialog {
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

.edit-fields-dialog-content {
  background: #FFF;
  border-radius: 4px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.edit-fields-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
}

.edit-fields-dialog-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0;
}

.close-dialog {
  background: none;
  border: none;
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-dialog:hover {
  color: #606266;
  background: #E4E7ED;
}

.edit-fields-dialog-body {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.edit-fields-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding: 16px 20px;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .form-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-label {
    width: 100%;
    text-align: left;
    margin-bottom: 8px;
    padding-top: 0;
  }

  .form-item.checkbox-item {
    margin-left: 0;
  }

  .custom-select {
    width: 100%;
  }
}

.secondary-btn {
  background: white;
  color: #333;
}

.secondary-btn:hover {
  border-color: #409EFF;
  color: #409EFF;
}

/* 对话框样式 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.dialog {
  background: #FFF;
  border-radius: 4px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  padding: 16px 20px;
  border-bottom: 1px solid #EBEEF5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #909399;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #606266;
}

.dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.field-edit-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.field-edit-table th,
.field-edit-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #EBEEF5;
}

.field-edit-table th {
  background: #F5F7FA;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.field-edit-table th.required::after {
  content: '*';
  color: #F56C6C;
  margin-left: 4px;
}

.add-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #ECF5FF;
  color: #409EFF;
  border-color: #D9ECFF;
}

.add-btn:hover {
  background: #D9ECFF;
  border-color: #409EFF;
}

.remove-btn {
  padding: 4px 8px;
  background: #FEF0F0;
  color: #F56C6C;
  border-color: #FBC4C4;
  font-size: 12px;
}

.remove-btn:hover {
  background: #FBC4C4;
  border-color: #F56C6C;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid #EBEEF5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
