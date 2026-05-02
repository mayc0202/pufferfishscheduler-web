<template>
  <div class="minio-upload-config">
    <div class="config-content">
      <FlowConfigHero
        badge="文件"
        title="MinIO 上传"
        description="将本地或流程产生的文件上传到 MinIO 存储桶目录。"
        tone="amber"
        icon="el-icon-upload2"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="MinIO上传">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="section-header" @click="sectionOpen.file = !sectionOpen.file">
          <h4>文件</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.file ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.file" class="section-content">
          <div class="form-item">
            <label class="form-label required">本地目录：</label>
            <el-cascader
              v-model="localDirectorySelection"
              class="form-select"
              :options="localDirectoryOptions"
              :props="localDirectoryCascaderProps"
              filterable
              clearable
              placeholder="请选择本地目录"
              @visible-change="onLocalDirectoryVisible"
              @change="onLocalDirectoryChange"
            />
          </div>

          <div class="form-item">
            <label class="form-label">通配符（正则表达式）：</label>
            <input v-model="formData.wildCard" type="text" class="form-input" placeholder="请输入通配符（正则表达式）">
          </div>
        </div>

        <div class="section-header" @click="sectionOpen.target = !sectionOpen.target">
          <h4>目标目录</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.target ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.target" class="section-content">
          <div class="form-item">
            <label class="form-label required">数据源：</label>
            <el-select
              v-model="formData.dataSource"
              class="form-select"
              filterable
              clearable
              placeholder="请选择数据源"
              @visible-change="onDataSourceVisible"
              @change="onDataSourceChange"
            >
              <el-option
                v-for="db in dataSourceOptions"
                :key="String(db.id)"
                :label="db.name"
                :value="db.id"
              />
            </el-select>
          </div>

          <div class="form-item">
            <label class="form-label required">Bucket 名称：</label>
            <el-select
              v-model="formData.bucketName"
              class="form-select"
              filterable
              clearable
              placeholder="请选择 Bucket"
              @visible-change="onBucketVisible"
            >
              <el-option
                v-for="item in bucketOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <div class="section-header" @click="sectionOpen.outputFields = !sectionOpen.outputFields">
          <h4>输出字段</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.outputFields ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.outputFields" class="section-content">
          <div class="field-table-wrap">
            <el-table :data="formData.outFiledList" border style="width: 100%" max-height="320">
              <el-table-column type="index" label="#" width="56" />
              <el-table-column prop="name" label="输出字段中文名称" min-width="180" show-overflow-tooltip />
              <el-table-column label="输出字段名称" min-width="220">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.fieldName" size="small" placeholder="请输入输出字段名称" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="advanced-layout">
          <div class="form-item checkbox-row">
            <el-checkbox v-model="formData.binaryMode">二进制模式</el-checkbox>
          </div>

          <div class="form-item">
            <label class="form-label required">超时时间（毫秒）：</label>
            <input v-model="formData.timeOut" type="number" min="1" class="form-input" placeholder="60000">
          </div>

          <div class="section-header" @click="sectionOpen.fileAdvanced = !sectionOpen.fileAdvanced">
            <h4>文件</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.fileAdvanced ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.fileAdvanced" class="section-content">
            <div class="form-item checkbox-row">
              <el-checkbox v-model="formData.removeLocalFile">上传文件后删除本地文件</el-checkbox>
            </div>
            <div class="form-item checkbox-row">
              <el-checkbox v-model="formData.overwriteFile">是否覆盖文件</el-checkbox>
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
import { minioOssDbTree, minioBucketList } from '@/api/collect/plugin/objectStorage'
import { getLocalDirectory } from '@/api/collect/plugin/ftp'
import FlowConfigHero from '../common/FlowConfigHero.vue'

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

function parseFtpBool(v, defaultVal) {
  if (v === undefined || v === null || v === '') return defaultVal
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase()
    if (t === 'true') return true
    if (t === 'false') return false
  }
  return Boolean(v)
}

function buildDefaultOutFields() {
  return [
    { name: '源文件目录', fieldName: 'upload_src_dir' },
    { name: '目标文件目录', fieldName: 'upload_target_dir' },
    { name: '文件名', fieldName: 'upload_file_name' },
    { name: '文件类型', fieldName: 'upload_file_type' }
  ]
}

export default {
  name: 'MinIOUploadConfig',
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
      sectionOpen: {
        file: true,
        target: true,
        outputFields: true,
        fileAdvanced: true
      },
      dataSourceOptions: [],
      localDirectoryOptions: [],
      localDirectorySelection: '',
      bucketOptions: [],
      localDirectoryCascaderProps: {
        checkStrictly: true,
        emitPath: false,
        lazy: true,
        lazyLoad: (node, resolve) => this.localDirectoryLazyLoad(node, resolve)
      }
    }
  },
  async mounted() {
    this.initDefaults()
    await this.loadDataSourceTree()
    this.normalizeDataSourceWithOptions()
    this.syncSelectionsFromForm()
    if (this.formData.dataSource != null && this.formData.dataSource !== '') {
      await this.loadBucketOptions()
    }
    await this.loadLocalDirectoryTree('/')
    this.ensureLocalDirectorySelectionVisible()
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', 'MinIO上传')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.localDirectory === undefined) this.$set(this.formData, 'localDirectory', '')
      if (this.formData.wildCard === undefined) this.$set(this.formData, 'wildCard', '')
      // 兼容：后端期望 dataSourceId，前端 UI 使用 dataSource
      if ((this.formData.dataSource === undefined || this.formData.dataSource === null || this.formData.dataSource === '') && this.formData.dataSourceId != null && this.formData.dataSourceId !== '') {
        this.$set(this.formData, 'dataSource', this.formData.dataSourceId)
      }
      if (this.formData.dataSource === undefined || this.formData.dataSource === null) this.$set(this.formData, 'dataSource', '')
      if ((this.formData.bucketName === undefined || this.formData.bucketName === null || this.formData.bucketName === '') && this.formData.remoteDirectory != null && this.formData.remoteDirectory !== '') {
        this.$set(this.formData, 'bucketName', this.formData.remoteDirectory)
      }
      if ((this.formData.bucketName === undefined || this.formData.bucketName === null || this.formData.bucketName === '') && this.formData.ftpDirectory != null && this.formData.ftpDirectory !== '') {
        this.$set(this.formData, 'bucketName', this.formData.ftpDirectory)
      }
      if (this.formData.bucketName === undefined) this.$set(this.formData, 'bucketName', '')
      if (this.formData.binaryMode === undefined) this.$set(this.formData, 'binaryMode', true)
      if (this.formData.removeLocalFile === undefined) this.$set(this.formData, 'removeLocalFile', true)
      if (this.formData.overwriteFile === undefined) this.$set(this.formData, 'overwriteFile', true)
      this.$set(this.formData, 'binaryMode', parseFtpBool(this.formData.binaryMode, true))
      this.$set(this.formData, 'removeLocalFile', parseFtpBool(this.formData.removeLocalFile, true))
      this.$set(this.formData, 'overwriteFile', parseFtpBool(this.formData.overwriteFile, true))
      if (this.formData.timeOut === undefined || this.formData.timeOut === '') this.$set(this.formData, 'timeOut', 60000)
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)

      const list = Array.isArray(this.formData.outFiledList) ? clone(this.formData.outFiledList) : []
      const defaults = buildDefaultOutFields()
      if (!list.length) {
        this.$set(this.formData, 'outFiledList', defaults)
      } else {
        // 保留已有顺序和中文名，不足项补齐
        const merged = defaults.map((d) => {
          const hit = list.find(x => String(x.name || '') === d.name)
          return {
            name: d.name,
            fieldName: hit && hit.fieldName != null ? String(hit.fieldName) : d.fieldName
          }
        })
        this.$set(this.formData, 'outFiledList', merged)
      }
    },
    async loadDataSourceTree() {
      try {
        const res = await minioOssDbTree()
        const nodes = Array.isArray(res?.data) ? res.data : []
        this.dataSourceOptions = this.flattenDatabaseNodes(nodes, [])
      } catch (e) {
        this.dataSourceOptions = []
      }
    },
    flattenDatabaseNodes(nodes, typeKeywords = []) {
      const out = []
      const isMatchedType = (n) => {
        const tokens = [
          n?.dbType,
          n?.databaseType,
          n?.typeName,
          n?.typeCode,
          n?.code,
          n?.name
        ]
          .map(x => String(x || '').trim().toUpperCase())
          .filter(Boolean)
        if (!typeKeywords.length) return true
        return typeKeywords.some(k => tokens.some(t => t.includes(String(k).toUpperCase())))
      }
      const walk = (arr) => {
        (arr || []).forEach((n) => {
          if (!n) return
          if (String(n.type || '').toUpperCase() === 'DATABASE' && isMatchedType(n)) {
            out.push({ id: n.id, name: n.name || String(n.id) })
          }
          if (Array.isArray(n.children) && n.children.length) {
            walk(n.children)
          }
        })
      }
      walk(nodes)
      return out
    },
    async onDataSourceVisible(visible) {
      if (!visible) return
      if (!this.dataSourceOptions.length) {
        await this.loadDataSourceTree()
        this.normalizeDataSourceWithOptions()
      }
    },
    normalizeDataSourceWithOptions() {
      const raw = this.formData.dataSource != null && this.formData.dataSource !== ''
        ? this.formData.dataSource
        : this.formData.dataSourceId
      if (raw == null || raw === '') return
      const hit = this.dataSourceOptions.find(db => String(db.id) === String(raw))
      if (hit) {
        this.$set(this.formData, 'dataSource', hit.id)
        return
      }
      const n = Number(raw)
      const optId = Number.isFinite(n) ? n : raw
      this.dataSourceOptions = [
        { id: optId, name: `ID ${raw}（当前 MinIO 数据源列表中未找到）` },
        ...this.dataSourceOptions
      ]
      this.$set(this.formData, 'dataSource', optId)
    },
    onDataSourceChange() {
      this.formData.bucketName = ''
      this.bucketOptions = []
      this.loadBucketOptions()
    },
    getLocalDirectoryListFromResponse(res) {
      if (Array.isArray(res?.result)) return res.result
      if (Array.isArray(res?.data)) return res.data
      return []
    },
    normalizeLocalDirectoryOptions(raw) {
      if (!Array.isArray(raw)) return []
      return raw
        .filter(x => String(x?.type || '').toUpperCase() !== 'FILE')
        .map(x => {
          const dirPath = String(x?.path || '')
          return {
            label: x?.name != null ? String(x.name) : dirPath,
            value: dirPath,
            path: dirPath,
            leaf: false
          }
        })
        .filter(x => x.value)
    },
    applyLocalDirectoryFallbackIfEmpty(list) {
      if (Array.isArray(list) && list.length) return list
      if (!this.formData.localDirectory) {
        this.formData.localDirectory = '/'
      }
      this.localDirectorySelection = this.formData.localDirectory || '/'
      return [{
        label: '/',
        value: '/',
        path: '/',
        leaf: false
      }]
    },
    hasLocalDirectoryOptionByValue(value) {
      const target = String(value || '')
      if (!target) return false
      const walk = (nodes) => {
        for (const node of nodes || []) {
          if (String(node?.value || '') === target) return true
          if (Array.isArray(node?.children) && node.children.length && walk(node.children)) return true
        }
        return false
      }
      return walk(this.localDirectoryOptions || [])
    },
    ensureLocalDirectorySelectionVisible() {
      const selectedPath = this.formData.localDirectory ? String(this.formData.localDirectory) : ''
      if (!selectedPath || selectedPath === '/') return
      if (this.hasLocalDirectoryOptionByValue(selectedPath)) return
      const segments = selectedPath.split('/').filter(Boolean)
      const fallbackLabel = segments.length ? segments[segments.length - 1] : selectedPath
      this.localDirectoryOptions = [
        ...this.localDirectoryOptions,
        { label: fallbackLabel, value: selectedPath, path: selectedPath, leaf: false }
      ]
    },
    normalizeBucketOptions(raw) {
      if (!Array.isArray(raw)) return []
      return raw
        .map((x) => {
          if (typeof x === 'string') return { label: x, value: x }
          const value = String(x?.bucketName || x?.name || x?.label || x?.value || '')
          return { label: value, value }
        })
        .filter(x => x.value)
    },
    async loadLocalDirectoryTree(path = '/') {
      try {
        const res = await getLocalDirectory(path || '/')
        const list = this.getLocalDirectoryListFromResponse(res)
        const normalized = this.normalizeLocalDirectoryOptions(list)
        this.localDirectoryOptions = this.applyLocalDirectoryFallbackIfEmpty(normalized)
      } catch (e) {
        this.localDirectoryOptions = this.applyLocalDirectoryFallbackIfEmpty([])
      }
    },
    async localDirectoryLazyLoad(node, resolve) {
      const basePath = node && node.level > 0 && node.data ? node.data.path : '/'
      try {
        const res = await getLocalDirectory(basePath || '/')
        const list = this.getLocalDirectoryListFromResponse(res)
        resolve(this.normalizeLocalDirectoryOptions(list))
      } catch (e) {
        resolve([])
      }
    },
    async loadBucketOptions() {
      const dbId = Number(this.formData.dataSource)
      if (!Number.isFinite(dbId) || dbId <= 0) {
        this.bucketOptions = []
        return
      }
      try {
        const res = await minioBucketList(dbId)
        this.bucketOptions = this.normalizeBucketOptions(res?.data || res?.result || [])
      } catch (e) {
        this.bucketOptions = []
      }
    },
    async onLocalDirectoryVisible(visible) {
      if (!visible) return
      await this.loadLocalDirectoryTree('/')
      this.ensureLocalDirectorySelectionVisible()
    },
    async onBucketVisible(visible) {
      if (!visible) return
      await this.loadBucketOptions()
    },
    onLocalDirectoryChange(values) {
      this.formData.localDirectory = values ? String(values) : ''
    },
    syncSelectionsFromForm() {
      const local = this.formData.localDirectory ? String(this.formData.localDirectory) : ''
      this.localDirectorySelection = local
    },
    buildPayloadForSave() {
      const raw = { ...this.formData }
      raw.name = String(raw.name || '').trim()
      raw.description = raw.description != null ? String(raw.description) : ''
      raw.localDirectory = raw.localDirectory != null ? String(raw.localDirectory) : ''
      if (!raw.localDirectory.trim()) raw.localDirectory = '/'
      raw.wildCard = raw.wildCard != null ? String(raw.wildCard) : ''
      // 后端 key：dataSourceId（String）
      raw.dataSourceId = raw.dataSource != null && raw.dataSource !== '' ? String(raw.dataSource) : ''
      delete raw.dataSource
      raw.bucketName = raw.bucketName != null ? String(raw.bucketName) : ''
      raw.remoteDirectory = raw.bucketName
      raw.binaryMode = !!raw.binaryMode
      raw.removeLocalFile = !!raw.removeLocalFile
      raw.overwriteFile = !!raw.overwriteFile
      raw.timeOut = raw.timeOut != null && raw.timeOut !== '' ? Math.max(1, Math.trunc(Number(raw.timeOut))) : 60000

      const defaults = buildDefaultOutFields()
      const curr = Array.isArray(raw.outFiledList) ? raw.outFiledList : []
      raw.outFiledList = defaults.map((d) => {
        const hit = curr.find(x => String(x?.name || '') === d.name)
        return {
          name: d.name,
          fieldName: hit && String(hit.fieldName || '').trim() ? String(hit.fieldName).trim() : d.fieldName
        }
      })
      // FTP 上传高级配置不包含分发/并发，固定默认值
      raw.distributeType = false
      raw.copiesCache = 1
      return raw
    },
    handleSubmit() {
      const ui = { ...this.formData }
      const payload = this.buildPayloadForSave()
      if (!payload.name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      if (!ui.localDirectory) {
        this.$message.warning('请选择本地目录')
        return
      }
      if (!ui.dataSource) {
        this.$message.warning('请选择数据源')
        return
      }
      if (!ui.bucketName) {
        this.$message.warning('请选择 Bucket')
        return
      }
      this.$emit('save', payload)
    }
  }
}
</script>

<style lang="scss" scoped>
.minio-upload-config {
  height: 100%;
}

.config-content {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.config-tabs {
  margin: 0 0 8px;
}

.form-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.form-item {
  margin-bottom: 16px;
  display: block;
}

.form-label {
  display: block;
  width: 100%;
  text-align: left;
  line-height: 20px;
  color: #606266;
  font-size: 14px;
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
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #409eff;
}

.form-select {
  width: 100%;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: #409eff;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  margin-top: 4px;
  border-top: 1px solid #ebeef5;
  cursor: pointer;
  user-select: none;
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
  padding-top: 8px;
  margin-bottom: 8px;
}

.field-table-wrap {
  width: 100%;
  max-width: 680px;
  margin-bottom: 10px;
}

.advanced-layout {
  padding-top: 2px;
}

.checkbox-row {
  margin-bottom: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  height: 36px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.primary-btn {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
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
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}
</style>
