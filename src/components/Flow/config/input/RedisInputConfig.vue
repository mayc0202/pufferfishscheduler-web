<template>
  <div class="redis-input-config">
    <FlowConfigHero
      badge="Redis"
      title="Redis 输入"
      description="从 Redis 数据源按 Key 读取字符串，并按分隔符拆分为字段。"
      tone="coral"
      icon="el-icon-connection"
    />

    <div class="config-body">
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="Redis输入">
        </div>

        <div class="form-item">
          <label class="form-label">说明</label>
          <textarea v-model="formData.description" class="form-textarea" rows="2" placeholder="选填：用途、注意事项" />
        </div>

        <div class="form-item">
          <label class="form-label required">Redis 数据源</label>
          <el-select
            v-model="formData.dataSourceId"
            filterable
            clearable
            placeholder="请选择已配置的 Redis 数据源"
            class="redis-el-select"
            popper-class="redis-input-db-popper"
            @visible-change="onDbSelectVisible"
          >
            <el-option-group
              v-for="group in processedOptions"
              :key="group.value"
              :label="group.label"
            >
              <el-option
                v-for="item in group.children"
                :key="item.value"
                :label="`${group.label} / ${item.label}`"
                :value="item.value"
              />
            </el-option-group>
          </el-select>
          <p class="field-hint">仅展示类型为 Redis 的连接；若列表为空，请先在「数据源」中新建 Redis。</p>
        </div>

        <div class="form-item">
          <label class="form-label required">Key</label>
          <el-input
            v-model="formData.key"
            class="redis-el-input"
            clearable
            placeholder="例如：cache:user:rows 或 ${变量名}"
          >
            <template slot="prepend">
              <i class="el-icon-key" />
            </template>
          </el-input>
        </div>

        <div class="form-item">
          <label class="form-label">字段分隔符</label>
          <div class="delimiter-row">
            <el-input
              v-model="formData.fieldDelimiter"
              class="redis-el-input flex-1"
              clearable
              placeholder="例如逗号 , 或制表符（留空则按插件默认处理）"
            />
            <div class="chip-group">
              <button type="button" class="chip" @click="formData.fieldDelimiter = ','">,</button>
              <button type="button" class="chip" @click="formData.fieldDelimiter = '\t'">TAB</button>
              <button type="button" class="chip" @click="formData.fieldDelimiter = '|'">|</button>
              <button type="button" class="chip" @click="formData.fieldDelimiter = ';'">;</button>
            </div>
          </div>
          <p class="field-hint">与 Kettle Redis 输入步骤中「字段分隔符」一致，用于将一行文本拆成多列。</p>
        </div>
      </template>

      <template v-else>
        <div class="advanced-layout">
          <div class="section-header" @click="sectionOpen.distribution = !sectionOpen.distribution">
            <h4>数据分发</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.distribution ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.distribution" class="section-content">
            <div class="advanced-row">
              <span class="advanced-label">模式</span>
              <el-radio-group v-model="distributionMode">
                <el-radio :label="'copy'">复制</el-radio>
                <el-radio :label="'distribute'">分发</el-radio>
              </el-radio-group>
            </div>
          </div>

          <div class="section-header" @click="sectionOpen.parallel = !sectionOpen.parallel">
            <h4>并发</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.parallel ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.parallel" class="section-content">
            <div class="form-item tight">
              <label class="form-label">副本数（copies）</label>
              <input
                v-model.number="formData.copiesCache"
                type="number"
                min="1"
                class="form-input"
                placeholder="1"
              >
            </div>
          </div>
        </div>
      </template>

      <div class="form-actions">
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import FlowConfigHero from '../common/FlowConfigHero.vue'
import { redisDbTree } from '@/api/collect/plugin/redis'

function isRedisDatabaseNode(child, relaxTypeCheck) {
  if (!child || child.type !== 'DATABASE') return false
  if (relaxTypeCheck) return true
  const dt = String(child.dbType || child.databaseType || child.typeName || '').trim().toUpperCase()
  if (!dt) return true
  return dt === 'REDIS' || dt.includes('REDIS')
}

export default {
  name: 'RedisInputConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'basic',
      processedOptions: [],
      sectionOpen: {
        distribution: true,
        parallel: true
      }
    }
  },
  computed: {
    distributionMode: {
      get() {
        return this.formData.distributeType ? 'copy' : 'distribute'
      },
      set(v) {
        this.$set(this.formData, 'distributeType', v === 'copy')
      }
    }
  },
  mounted() {
    this.initDefaults()
    this.loadDbData()
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', 'Redis输入')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.dataSourceId === undefined || this.formData.dataSourceId === null) {
        this.$set(this.formData, 'dataSourceId', '')
      } else {
        this.$set(this.formData, 'dataSourceId', String(this.formData.dataSourceId))
      }
      if (this.formData.key === undefined) this.$set(this.formData, 'key', '')
      if (this.formData.fieldDelimiter === undefined) this.$set(this.formData, 'fieldDelimiter', '')
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
    },
    onDbSelectVisible(v) {
      if (v && (!this.processedOptions || this.processedOptions.length === 0)) {
        this.loadDbData()
      }
    },
    async loadDbData() {
      try {
        const res = await redisDbTree()
        if (res && res.code === '000000' && res.data) {
          this.processData(res.data, true)
        } else {
          this.$message.error('获取数据源列表失败')
          this.$set(this, 'processedOptions', [])
        }
      } catch (e) {
        this.$message.error('获取数据源列表失败')
        this.$set(this, 'processedOptions', [])
      }
    },
    processData(dbList, relaxTypeCheck) {
      if (!dbList || !dbList.length) {
        this.processedOptions = []
        return
      }
      const result = []
      for (const group of dbList) {
        if (!group || group.type !== 'GROUP') continue
        if (!group.children || !Array.isArray(group.children)) continue
        const children = []
        for (const child of group.children) {
          if (isRedisDatabaseNode(child, relaxTypeCheck)) {
            children.push({
              value: String(child.id),
              label: child.name || '未命名'
            })
          }
        }
        if (children.length > 0) {
          result.push({
            value: String(group.id),
            label: group.name || '未知分组',
            children
          })
        }
      }
      this.$set(this, 'processedOptions', result)
    },
    buildPayloadForSave() {
      const raw = { ...this.formData }
      raw.name = String(raw.name || '').trim()
      raw.description = raw.description != null ? String(raw.description) : ''
      raw.dataSourceId = raw.dataSourceId != null && raw.dataSourceId !== '' ? String(raw.dataSourceId) : ''
      raw.key = raw.key != null ? String(raw.key).trim() : ''
      raw.fieldDelimiter = raw.fieldDelimiter != null ? String(raw.fieldDelimiter) : ''
      raw.copiesCache =
        raw.copiesCache != null && raw.copiesCache !== ''
          ? Math.max(1, Math.trunc(Number(raw.copiesCache)) || 1)
          : 1
      raw.distributeType = !!raw.distributeType
      return raw
    },
    handleSubmit() {
      if (!String(this.formData.name || '').trim()) {
        this.$message.warning('请填写步骤名称')
        return
      }
      if (!this.formData.dataSourceId) {
        this.$message.warning('请选择 Redis 数据源')
        return
      }
      if (!String(this.formData.key || '').trim()) {
        this.$message.warning('请填写 Redis Key')
        return
      }
      this.$emit('save', this.buildPayloadForSave())
    }
  }
}
</script>

<style scoped>
.redis-input-config {
  width: 100%;
}

/* 与流程内其他配置组件统一的 Element 蓝基调（标签页、表单、按钮） */
.config-body {
  --flow-primary: #409eff;
  --flow-primary-soft: #ecf5ff;
  padding: 0 0 8px;
}

.config-tabs {
  margin: 0 0 8px;
}

.config-tabs ::v-deep .el-tabs__header {
  margin-bottom: 4px;
}

.config-tabs ::v-deep .el-tabs__item {
  font-weight: 500;
  color: #909399;
}

.config-tabs ::v-deep .el-tabs__item.is-active {
  color: var(--flow-primary);
}

.config-tabs ::v-deep .el-tabs__active-bar {
  background-color: var(--flow-primary);
}

.form-item {
  margin-bottom: 16px;
  display: block;
}

.form-item.tight {
  margin-bottom: 8px;
}

.form-label {
  display: block;
  width: 100%;
  text-align: left;
  line-height: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.form-label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--flow-primary);
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  min-height: 64px;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--flow-primary);
}

.redis-el-select {
  width: 100%;
}

.redis-el-select ::v-deep .el-input__inner {
  border-radius: 4px;
  height: 40px;
  line-height: 40px;
  border-color: #dcdfe6;
}

.redis-el-select ::v-deep .el-input__inner:focus {
  border-color: var(--flow-primary);
}

.redis-el-input ::v-deep .el-input__inner {
  border-radius: 0 4px 4px 0;
  height: 40px;
}

.redis-el-input ::v-deep .el-input-group__prepend {
  background: #f5f7fa;
  color: var(--flow-primary);
  border-color: #dcdfe6;
  border-radius: 4px 0 0 4px;
}

.delimiter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.flex-1 {
  flex: 1 1 200px;
  min-width: 0;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.chip:hover {
  border-color: var(--flow-primary);
  color: var(--flow-primary);
  background: var(--flow-primary-soft);
}

.field-hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

.field-hint.subtle {
  margin-top: 6px;
}

.field-hint code {
  font-size: 11px;
  background: #f4f4f5;
  padding: 1px 5px;
  border-radius: 4px;
  color: #606266;
}

.advanced-layout {
  padding-bottom: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 8px;
  border-top: 1px solid #ebeef5;
  cursor: pointer;
  user-select: none;
}

.section-header:first-of-type {
  border-top: none;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.section-toggle {
  color: #909399;
}

.section-content {
  padding: 4px 0 12px;
}

.advanced-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.advanced-label {
  color: #606266;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.btn {
  padding: 0 20px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
}

.primary-btn {
  background: var(--flow-primary);
  color: #fff;
  border-color: var(--flow-primary);
}

.primary-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.secondary-btn {
  background: #fff;
  color: #606266;
  border-color: #dcdfe6;
}

.secondary-btn:hover {
  color: var(--flow-primary);
  border-color: #c6e2ff;
  background: var(--flow-primary-soft);
}
</style>
