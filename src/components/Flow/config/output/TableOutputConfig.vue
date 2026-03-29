<template>
  <div class="table-output-config">
    <!-- 配置内容 -->
    <div class="config-content">
      <!-- 基础配置 -->
      <div class="form-title">关系库表输出</div>

      <div class="form-item">
        <label class="form-label required">节点名称：</label>
        <input v-model="formData.name" type="text" class="form-input" placeholder="输出到治理库">
      </div>

      <div class="form-item">
        <label class="form-label">节点说明：</label>
        <textarea v-model="formData.description" type="text" class="form-textarea" placeholder="请输入说明" />
      </div>

      <div class="section-header">
        <h4>通用配置</h4>
        <div class="section-toggle" @click="toggleSection('general')">
          <i :class="sectionOpen.general ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        </div>
      </div>
      <div v-show="sectionOpen.general" class="section-content">
        <div class="form-item">
          <label class="form-label required">数据源连接：</label>
          <div v-click-outside="closeDbDropdown" class="custom-select">
            <div class="select-input" @click="dbDropdownOpen = !dbDropdownOpen">
              <span v-if="selectedLabel">{{ selectedLabel }}</span>
              <span v-else class="placeholder">请选择数据源</span>
              <i class="el-icon-arrow-down arrow" :class="{ open: dbDropdownOpen }" />
            </div>
            <div v-show="dbDropdownOpen" class="select-dropdown">
              <div v-for="group in processedDbOptions" :key="group.label" class="select-group">
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
          <label class="form-label">目标模式：</label>
          <input v-model="formData.schemaName" type="text" class="form-input" placeholder="请输入模式名称 (schema)">
        </div>

        <div class="form-item">
          <label class="form-label required">目标表：</label>
          <div v-click-outside="closeTableDropdown" class="custom-select">
            <div class="select-input" @click="tableDropdownOpen = !tableDropdownOpen">
              <span v-if="formData.tableName">{{ formData.tableName }}</span>
              <span v-else class="placeholder">请选择表名称</span>
              <i class="el-icon-arrow-down arrow" :class="{ open: tableDropdownOpen }" />
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
          <input v-model="formData.commitSize" type="number" class="form-input" placeholder="1000" min="1">
        </div>

        <div class="form-item checkbox-item">
          <el-checkbox v-model="formData.truncateTable">写入之前清空表</el-checkbox>
        </div>
      </div>

      <div class="section-header">
        <h4>数据库字段</h4>
        <div class="section-toggle" @click="toggleSection('fields')">
          <i :class="sectionOpen.fields ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
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
                  <span class="field-text" :title="field.fieldStream">{{ field.fieldStream }}</span>
                </td>
                <td>
                  <span class="field-text" :title="field.fieldDatabase">{{ field.fieldDatabase }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="field-actions">
            <a href="#" @click.prevent="editFields">编辑字段</a>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <!-- 编辑字段对话框 -->
    <div v-if="editFieldsVisible" class="dialog-mask">
      <div class="dialog" :style="editDialogStyle" @click.stop>
        <div class="dialog-header dialog-draggable-handle" @mousedown="onEditDialogMouseDown">
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
                  <el-select
                    v-model="field.fieldStream"
                    class="field-select"
                    filterable
                    clearable
                    placeholder="请选择流字段"
                  >
                    <el-option
                      v-for="opt in streamFieldOptions"
                      :key="opt"
                      :label="opt"
                      :value="opt"
                    />
                  </el-select>
                </td>
                <td>
                  <el-select
                    v-model="field.fieldDatabase"
                    class="field-select"
                    filterable
                    clearable
                    placeholder="请选择表字段"
                  >
                    <el-option
                      v-for="opt in dbFieldOptions"
                      :key="opt"
                      :label="opt"
                      :value="opt"
                    />
                  </el-select>
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
          <button
            type="button"
            class="btn secondary-btn"
            :class="{ 'is-loading': getFieldsLoading }"
            :disabled="getFieldsLoading"
            @click="getFields"
          >
            <span v-if="getFieldsLoading" class="btn-spinner" />
            {{ getFieldsLoading ? '获取中...' : '获取字段' }}
          </button>
          <button type="button" class="btn primary-btn" @click="saveFields">确定</button>
          <button type="button" class="btn secondary-btn" @click="editFieldsVisible = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { relationalDbTree } from '@/api/database/database/dbGroup'
import { dbTableList, fieldList as dbFieldList } from '@/api/database/database/database'
import { getFieldStream } from '@/api/collect/plugin/tableoutput'
import { getFieldStream as getFlowFieldStream } from '@/api/collect/trans/transFlow'

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
    },
    flowConfig: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
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
      editFieldList: [],
      getFieldsLoading: false,
      streamFieldOptions: [],
      dbFieldOptions: [],
      editDialogDrag: {
        dragging: false,
        moved: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        left: 0,
        top: 0
      }
    }
  },
  computed: {
    editDialogStyle() {
      if (!this.editDialogDrag.moved) return {}
      return {
        left: `${this.editDialogDrag.left}px`,
        top: `${this.editDialogDrag.top}px`,
        transform: 'none'
      }
    },
    cascaderDbOptions() {
      return this.transformToCascader(this.dbList)
    },
    dbCascaderProps() {
      return {
        value: 'value',
        label: 'label',
        children: 'children',
        expandTrigger: 'hover'
      }
    }
  },
  watch: {
    'formData.dataSourceId': {
      handler(val) {
        if (val) {
          this.selectedValue = String(val)
          this.updateSelectedLabel(val)
          this.loadTableList(val)
        }
      },
      immediate: true
    },
    formData: {
      handler(val) {
        if (val && val.dataSourceId) {
          this.selectedValue = String(val.dataSourceId)
          this.updateSelectedLabel(val.dataSourceId)
        }
        // 确保 fieldList 是数组
        if (val && !Array.isArray(val.fieldList)) {
          this.$set(this.formData, 'fieldList', [])
        }
      },
      deep: true,
      immediate: true
    },
    'formData.tableId': {
      handler(val) {
        if (val) this.loadDbFieldOptions(val)
      },
      immediate: true
    }
  },
  created() {
    this.loadDbList()
  },
  mounted() {
    this.initFormData()
  },
  methods: {
    /**
     * 初始化表单数据
     */
    initFormData() {
      // 初始化默认值，但不覆盖已有值
      if (this.formData.commitSize === undefined || this.formData.commitSize === '') {
        this.formData.commitSize = '1000'
      }
      if (!this.formData.fieldList) {
        this.formData.fieldList = []
      }
      // 确保 truncateTable 有默认值
      if (this.formData.truncateTable === undefined) {
        this.formData.truncateTable = false
      }
      // 确保 specifyFields 有默认值
      if (this.formData.specifyFields === undefined) {
        this.formData.specifyFields = false
      }
      // 确保 ignoreErrors 有默认值
      if (this.formData.ignoreErrors === undefined) {
        this.formData.ignoreErrors = false
      }
      // 确保 useBatchUpdate 有默认值
      if (this.formData.useBatchUpdate === undefined) {
        this.formData.useBatchUpdate = false
      }
    },
    /**
     * 切换段落展开状态
     * @param section 段落名称
     */
    toggleSection(section) {
      this.sectionOpen[section] = !this.sectionOpen[section]
    },
    /**
     * 加载数据库列表
     */
    async loadDbList() {
      try {
        const res = await relationalDbTree()
        if (res && res.code === '000000' && res.data) {
          this.$set(this, 'dbList', res.data)
          this.processDbOptions()
        } else {
          console.error('加载数据库列表失败，返回数据异常：', res)
          this.$set(this, 'dbList', [])
          this.$set(this, 'processedDbOptions', [])
        }
      } catch (error) {
        console.error('加载数据库列表失败:', error)
        this.$set(this, 'dbList', [])
        this.$set(this, 'processedDbOptions', [])
      }
    },
    /**
     * 处理数据库选项，生成自定义下拉所需结构
     */
    processDbOptions() {
      if (!this.dbList || !this.dbList.length) {
        this.processedDbOptions = []
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
            children
          })
        }
      }

      this.processedDbOptions = result

      // 回显已选
      if (this.selectedValue) {
        this.updateSelectedLabel(this.selectedValue)
      }
    },
    /**
     * 选择数据库项
     */
    selectDbItem(item) {
      this.selectedValue = item.value
      this.selectedLabel = item.label
      this.formData.dataSourceId = item.value
      // 重置表相关
      this.formData.tableName = ''
      this.formData.tableId = null
      this.tableList = []
      this.dbDropdownOpen = false
      this.loadTableList(item.value)
    },
    /**
     * 关闭数据库下拉菜单
     */
    closeDbDropdown() {
      this.dbDropdownOpen = false
    },
    /**
     * 选择表项
     * @param table 表项
     */
    selectTableItem(table) {
      this.formData.tableName = table.name || table
      this.formData.tableId = table.id
      this.tableDropdownOpen = false
    },

    closeTableDropdown() {
      this.tableDropdownOpen = false
    },
    /**
     * 加载表列表
     * @param {*} dataSourceId 数据源ID
     */
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
    /**
     * 根据 dataSourceId 更新已选标签
     */
    updateSelectedLabel(dataSourceId) {
      if (!dataSourceId || !this.processedDbOptions || !this.processedDbOptions.length) {
        this.selectedLabel = ''
        return
      }
      const target = String(dataSourceId)
      for (const group of this.processedDbOptions) {
        if (!group.children) continue
        const item = group.children.find(opt => opt.value === target)
        if (item) {
          this.selectedLabel = `${group.label} / ${item.label}`
          return
        }
      }
      this.selectedLabel = ''
    },
    /**
     * 编辑字段
     */
    editFields() {
      // 复制当前字段列表用于编辑
      this.editFieldList = JSON.parse(JSON.stringify(this.formData.fieldList))
      this.editFieldsVisible = true
      this.resetEditDialogDrag()
      // 尝试提前加载表字段列表（如果已选表）
      if (this.formData.tableId) {
        this.loadDbFieldOptions(this.formData.tableId)
      }
      // 通用：获取流字段下拉选项（/trans/flow/getFieldStream.do）
      this.loadStreamFieldOptions()
    },
    /**
     * 添加字段
     */
    addField() {
      this.editFieldList.push({
        fieldStream: '',
        fieldDatabase: '',
        spatialType: false,
        coordinateSystem: ''
      })
    },
    /**
     * 删除字段
     * @param {*} index 字段索引
     */
    removeField(index) {
      this.editFieldList.splice(index, 1)
    },
    /**
     * 获取字段列表
     */
    async getFields() {
      if (this.getFieldsLoading) return
      // 验证必填字段
      if (!this.flowId) {
        this.$message.warning('流程ID不存在')
        return
      }
      if (!this.formData.name) {
        this.$message.warning('步骤名称不能为空')
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

      this.getFieldsLoading = true
      try {
        // 使用父组件传入的完整流程配置
        let flowData = this.flowConfig

        // 如果没有传入配置，构建临时配置
        if (!flowData) {
          // 构建临时的流程配置
          flowData = {
            cells: [
              {
                id: 'temp-output-step',
                shape: 'rect',
                data: {
                  name: this.formData.name,
                  code: 'TableOutput',
                  data: {
                    name: this.formData.name,
                    description: this.formData.description,
                    dataSourceId: this.formData.dataSourceId,
                    tableId: this.formData.tableId,
                    tableName: this.formData.tableName,
                    commitSize: this.formData.commitSize || '1000',
                    preSql: this.formData.preSql,
                    postSql: this.formData.postSql,
                    fieldList: this.editFieldList,
                    updateField: this.formData.updateField,
                    updatePolicy: this.formData.updatePolicy,
                    skipHeader: this.formData.skipHeader,
                    ignoreError: this.formData.ignoreError,
                    retryTimes: this.formData.retryTimes,
                    retryInterval: this.formData.retryInterval
                  }
                }
              }
            ]
          }
        }

        var data = {
          flowId: Number(this.flowId),
          stepName: this.formData.name,
          config: JSON.stringify(flowData),
          type: 1,
          dbId: Number(this.formData.dataSourceId),
          tableId: this.formData.tableId ? Number(this.formData.tableId) : null
        }

        const res = await getFieldStream(data)

        if (res.code === '000000' && res.data) {
          this.editFieldList = res.data.map(field => ({
            fieldStream: field.fieldStream,
            fieldDatabase: field.fieldDatabase
          }))
          // 流字段下拉选项走通用接口，避免仅依赖映射接口的返回
          this.loadStreamFieldOptions()
          this.$message.success('获取字段成功')
        } else {
          this.$message.error(res.message || '获取字段失败')
        }
      } catch (error) {
        console.error('获取字段失败:', error)
        this.$message.error('获取字段失败')
      } finally {
        this.getFieldsLoading = false
      }
    },
    /**
     * 保存字段
     */
    saveFields() {
      this.formData.fieldList = this.editFieldList
      this.editFieldsVisible = false
    },
    async loadDbFieldOptions(tableId) {
      try {
        const res = await dbFieldList(tableId)
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          // 兼容后端可能返回 string[] 或 {name: string}[]
          const names = res.data
            .map(it => (typeof it === 'string' ? it : it && (it.name || it.fieldName || it.code)))
            .filter(Boolean)
          this.dbFieldOptions = Array.from(new Set(names))
        } else {
          this.dbFieldOptions = []
        }
      } catch (e) {
        console.error('加载表字段失败:', e)
        this.dbFieldOptions = []
      }
    },
    async loadStreamFieldOptions() {
      if (!this.flowId) return
      try {
        // 优先使用父组件传入的完整流程配置；没有的话构建临时配置
        let flowData = this.flowConfig
        if (!flowData) {
          flowData = {
            cells: [
              {
                id: 'temp-output-step',
                shape: 'rect',
                data: {
                  name: this.formData.name,
                  code: 'TableOutput',
                  data: {
                    name: this.formData.name,
                    description: this.formData.description,
                    dataSourceId: this.formData.dataSourceId,
                    tableId: this.formData.tableId,
                    tableName: this.formData.tableName,
                    commitSize: this.formData.commitSize || '1000',
                    preSql: this.formData.preSql,
                    postSql: this.formData.postSql,
                    fieldList: this.editFieldList,
                    updateField: this.formData.updateField,
                    updatePolicy: this.formData.updatePolicy,
                    skipHeader: this.formData.skipHeader,
                    ignoreError: this.formData.ignoreError,
                    retryTimes: this.formData.retryTimes,
                    retryInterval: this.formData.retryInterval
                  }
                }
              }
            ]
          }
        }

        const res = await getFlowFieldStream({
          flowId: Number(this.flowId),
          config: JSON.stringify(flowData),
          stepName: this.formData.name || '关系库表输出',
          code: 'TableOutput',
          dbId: this.formData.dataSourceId ? Number(this.formData.dataSourceId) : undefined,
          tableId: this.formData.tableId ? Number(this.formData.tableId) : undefined
        })

        if (res && res.code === '000000' && Array.isArray(res.data)) {
          this.streamFieldOptions = res.data
            .map(x => (typeof x === 'string' ? x : (x.name || x.fieldName || x.fieldStream)))
            .filter(Boolean)
        } else if (res && res.code === '000000' && res.data && Array.isArray(res.data.fieldList)) {
          this.streamFieldOptions = res.data.fieldList.filter(Boolean)
        } else {
          this.streamFieldOptions = []
        }
      } catch (e) {
        this.streamFieldOptions = []
      }
    },
    resetEditDialogDrag() {
      this.editDialogDrag.dragging = false
      this.editDialogDrag.moved = false
      this.editDialogDrag.startX = 0
      this.editDialogDrag.startY = 0
      this.editDialogDrag.offsetX = 0
      this.editDialogDrag.offsetY = 0
      this.editDialogDrag.left = 0
      this.editDialogDrag.top = 0
    },
    onEditDialogMouseDown(e) {
      if (e.button !== 0) return
      const dialogEl = this.$el && this.$el.querySelector('.dialog')
      if (!dialogEl) return

      const rect = dialogEl.getBoundingClientRect()
      this.editDialogDrag.dragging = true
      this.editDialogDrag.startX = e.clientX
      this.editDialogDrag.startY = e.clientY
      this.editDialogDrag.offsetX = e.clientX - rect.left
      this.editDialogDrag.offsetY = e.clientY - rect.top

      const onMove = (ev) => {
        if (!this.editDialogDrag.dragging) return
        const dx = ev.clientX - this.editDialogDrag.startX
        const dy = ev.clientY - this.editDialogDrag.startY
        if (!this.editDialogDrag.moved && Math.abs(dx) + Math.abs(dy) < 3) return

        if (!this.editDialogDrag.moved) {
          this.editDialogDrag.moved = true
        }

        let left = ev.clientX - this.editDialogDrag.offsetX
        let top = ev.clientY - this.editDialogDrag.offsetY

        // 简单边界，避免拖出窗口太多
        const maxLeft = window.innerWidth - 120
        const maxTop = window.innerHeight - 80
        left = Math.max(12, Math.min(left, maxLeft))
        top = Math.max(12, Math.min(top, maxTop))

        this.editDialogDrag.left = left
        this.editDialogDrag.top = top
      }

      const onUp = () => {
        this.editDialogDrag.dragging = false
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    /**
     * 提交配置
     */
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

.form-input,
.form-select {
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

.form-input:hover,
.form-select:hover {
  border-color: #C0C4CC;
}

.form-input:focus,
.form-select:focus {
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

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.btn.is-loading {
  pointer-events: none;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  border-radius: 50%;
  border: 2px solid rgba(64, 158, 255, 0.25);
  border-top-color: #409eff;
  animation: btn-spin 0.8s linear infinite;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
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
  font-size: 12px;
}

.field-table th {
  background: #F5F7FA;
  font-size: 12px;
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

.field-text {
  display: inline-block;
  width: 100%;
  min-height: 32px;
  line-height: 32px;
  color: #606266;
  font-size: 12px;
  padding: 0 6px;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  font-size: 14px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.dialog-header {
  padding: 16px 20px;
  border-bottom: 1px solid #EBEEF5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-draggable-handle {
  cursor: move;
  user-select: none;
}

.dialog-header h3 {
  margin: 0;
  font-size: 14px;
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

.field-select {
  width: 100%;
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
