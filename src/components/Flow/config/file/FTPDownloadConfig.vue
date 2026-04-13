<template>
  <div class="ftp-download-config">
    <div class="config-content">
      <FlowConfigHero
        badge="文件"
        title="FTP 下载"
        description="从 FTP/SFTP 远端拉取文件到指定目录，并可配置通配与下载后处理。"
        tone="amber"
        icon="el-icon-download"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="FTP下载">
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
            <label class="form-label required">远程目录：</label>
            <el-cascader
              v-model="remoteDirectorySelection"
              class="form-select"
              :options="remoteDirectoryOptions"
              :props="directoryCascaderProps"
              filterable
              clearable
              placeholder="请选择远程目录"
              @visible-change="onRemoteDirectoryVisible"
              @change="onRemoteDirectoryChange"
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
            <div class="form-item checkbox-row inline-checks">
              <el-checkbox v-model="formData.removeAfterDownload" @change="onRemoveAfterDownloadChange">获取后删除文件</el-checkbox>
              <el-checkbox v-model="formData.moveAfterDownload" @change="onMoveAfterDownloadChange">获取后移动文件</el-checkbox>
            </div>

            <div class="form-item">
              <label class="form-label required">移动到文件夹：</label>
              <input
                v-model="formData.moveToFolder"
                type="text"
                class="form-input"
                placeholder="请输入文件夹名称"
                :disabled="!formData.moveAfterDownload"
              >
            </div>

            <div class="form-item checkbox-row">
              <el-checkbox
                v-model="formData.createMoveFolderIfNotExist"
                :disabled="!formData.moveAfterDownload"
              >移动到文件夹不存在自动创建</el-checkbox>
            </div>

            <div class="form-item checkbox-row">
              <el-checkbox v-model="formData.fileNameContainsDate">文件名中包含日期</el-checkbox>
            </div>

            <div class="form-item">
              <label class="form-label required">日期时间格式：</label>
              <el-select
                v-model="formData.dateTimeFormat"
                class="form-select"
                clearable
                placeholder="请选择日期时间格式"
                :disabled="!formData.fileNameContainsDate"
              >
                <el-option
                  v-for="fmt in dateFormats"
                  :key="fmt"
                  :label="fmt"
                  :value="fmt"
                />
              </el-select>
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
import { ftpDbTree } from '@/api/database/database/dbGroup'
import { directoryTree } from '@/api/database/resource/resource'
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
    { name: '源文件目录', fieldName: 'download_src_dir' },
    { name: '目标文件目录', fieldName: 'download_target_dir' },
    { name: '文件名', fieldName: 'download_file_name' },
    { name: '文件类型', fieldName: 'download_file_type' },
    { name: '文件大小', fieldName: 'download_file_size' }
  ]
}

export default {
  name: 'FTPDownloadConfig',
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
      remoteDirectoryOptions: [],
      localDirectorySelection: '',
      remoteDirectorySelection: [],
      localDirectoryCascaderProps: {
        checkStrictly: true,
        emitPath: false,
        lazy: true,
        lazyLoad: (node, resolve) => this.localDirectoryLazyLoad(node, resolve)
      },
      directoryCascaderProps: {
        checkStrictly: true,
        emitPath: true
      },
      dateFormats: ['yyyyMMddHHmmss', 'yyyy-MM-dd', 'yyyyMMdd']
    }
  },
  async mounted() {
    this.initDefaults()
    await this.loadDataSourceTree()
    this.normalizeDataSourceWithOptions()
    this.syncPathSelectionFromForm()
    if (this.formData.dataSource != null && this.formData.dataSource !== '') {
      await this.loadRemoteDirectoryTree('/')
    }
    await this.loadLocalDirectoryTree(this.formData.localDirectory || '/')
  },
  methods: {
    initDefaults() {
      if (!this.formData.name) this.$set(this.formData, 'name', 'FTP下载')
      if (this.formData.description === undefined) this.$set(this.formData, 'description', '')
      if (this.formData.localDirectory === undefined) this.$set(this.formData, 'localDirectory', '')
      if (this.formData.wildCard === undefined) this.$set(this.formData, 'wildCard', '')
      // 兼容：后端期望 dataSourceId，前端 UI 使用 dataSource
      if ((this.formData.dataSource === undefined || this.formData.dataSource === null || this.formData.dataSource === '') && this.formData.dataSourceId != null && this.formData.dataSourceId !== '') {
        this.$set(this.formData, 'dataSource', this.formData.dataSourceId)
      }
      if (this.formData.dataSource === undefined || this.formData.dataSource === null) this.$set(this.formData, 'dataSource', '')

      // 兼容：后端期望 ftpDirectory，前端 UI 使用 remoteDirectory
      if ((this.formData.remoteDirectory === undefined || this.formData.remoteDirectory === null || this.formData.remoteDirectory === '') && this.formData.ftpDirectory != null && this.formData.ftpDirectory !== '') {
        this.$set(this.formData, 'remoteDirectory', this.formData.ftpDirectory)
      }
      if (this.formData.remoteDirectory === undefined) this.$set(this.formData, 'remoteDirectory', '')

      // 按需求默认勾选
      if (this.formData.binaryMode === undefined) this.$set(this.formData, 'binaryMode', true)
      // 按需求默认 60000
      if (this.formData.timeOut === undefined || this.formData.timeOut === '') this.$set(this.formData, 'timeOut', 60000)

      // 兼容：后端 keys
      if (this.formData.removeAfterDownload === undefined && this.formData.removeFile !== undefined) this.$set(this.formData, 'removeAfterDownload', !!this.formData.removeFile)
      if (this.formData.moveAfterDownload === undefined && this.formData.moveFile !== undefined) this.$set(this.formData, 'moveAfterDownload', !!this.formData.moveFile)
      if (this.formData.moveToFolder === undefined && this.formData.moveToDirectory !== undefined) this.$set(this.formData, 'moveToFolder', this.formData.moveToDirectory)
      if (this.formData.createMoveFolderIfNotExist === undefined && this.formData.createNewFolder !== undefined) this.$set(this.formData, 'createMoveFolderIfNotExist', !!this.formData.createNewFolder)
      if (this.formData.fileNameContainsDate === undefined && this.formData.dateInFilename !== undefined) this.$set(this.formData, 'fileNameContainsDate', !!this.formData.dateInFilename)

      if (this.formData.removeAfterDownload === undefined) this.$set(this.formData, 'removeAfterDownload', true)
      if (this.formData.moveAfterDownload === undefined) this.$set(this.formData, 'moveAfterDownload', false)
      if (this.formData.moveToFolder === undefined) this.$set(this.formData, 'moveToFolder', '')
      if (this.formData.createMoveFolderIfNotExist === undefined) this.$set(this.formData, 'createMoveFolderIfNotExist', false)
      if (this.formData.fileNameContainsDate === undefined) this.$set(this.formData, 'fileNameContainsDate', false)
      if (this.formData.dateTimeFormat === undefined) this.$set(this.formData, 'dateTimeFormat', '')

      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') this.$set(this.formData, 'copiesCache', 1)

      const list = Array.isArray(this.formData.outFiledList) ? clone(this.formData.outFiledList) : []
      const defaults = buildDefaultOutFields()
      if (!list.length) {
        this.$set(this.formData, 'outFiledList', defaults)
      } else {
        const merged = defaults.map((d) => {
          const hit = list.find(x => String(x.name || '') === d.name)
          return {
            name: d.name,
            fieldName: hit && hit.fieldName != null ? String(hit.fieldName) : d.fieldName
          }
        })
        this.$set(this.formData, 'outFiledList', merged)
      }

      if (!this.formData.moveAfterDownload) {
        this.formData.createMoveFolderIfNotExist = false
      }
      if (!this.formData.fileNameContainsDate) {
        this.formData.dateTimeFormat = ''
      }

      this.$set(this.formData, 'binaryMode', parseFtpBool(this.formData.binaryMode, true))
      this.$set(this.formData, 'removeAfterDownload', parseFtpBool(this.formData.removeAfterDownload, true))
      this.$set(this.formData, 'moveAfterDownload', parseFtpBool(this.formData.moveAfterDownload, false))
      this.$set(this.formData, 'createMoveFolderIfNotExist', parseFtpBool(this.formData.createMoveFolderIfNotExist, false))
      this.$set(this.formData, 'fileNameContainsDate', parseFtpBool(this.formData.fileNameContainsDate, false))
    },
    async loadDataSourceTree() {
      try {
        const res = await ftpDbTree('')
        const nodes = Array.isArray(res?.data) ? res.data : []
        this.dataSourceOptions = this.flattenDatabaseNodes(nodes)
      } catch (e) {
        this.dataSourceOptions = []
      }
    },
    flattenDatabaseNodes(nodes) {
      const out = []
      const walk = (arr) => {
        ;(arr || []).forEach((n) => {
          if (!n) return
          if (String(n.type || '').toUpperCase() === 'DATABASE') {
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
        { id: optId, name: `ID ${raw}（当前 FTP 数据源列表中未找到）` },
        ...this.dataSourceOptions
      ]
      this.$set(this.formData, 'dataSource', optId)
    },
    onDataSourceChange() {
      this.remoteDirectorySelection = []
      this.formData.remoteDirectory = ''
      this.remoteDirectoryOptions = []
      this.loadRemoteDirectoryTree('/')
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
    normalizeDirectoryOptions(raw) {
      if (!Array.isArray(raw)) return []
      return raw
        .filter(x => String(x?.type || '').toUpperCase() !== 'FILE')
        .map(x => ({
          ...x,
          children: this.normalizeDirectoryOptions(x.children || [])
        }))
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
    async loadRemoteDirectoryTree(path = '/') {
      const dbId = Number(this.formData.dataSource)
      if (!Number.isFinite(dbId) || dbId <= 0) {
        this.remoteDirectoryOptions = []
        return
      }
      try {
        const res = await directoryTree(dbId, path || '/')
        this.remoteDirectoryOptions = this.normalizeDirectoryOptions(res?.data || [])
      } catch (e) {
        this.remoteDirectoryOptions = []
      }
    },
    async onLocalDirectoryVisible(visible) {
      if (!visible) return
      const path = this.formData.localDirectory || '/'
      await this.loadLocalDirectoryTree(path)
    },
    async onRemoteDirectoryVisible(visible) {
      if (!visible) return
      const path = this.formData.remoteDirectory || '/'
      await this.loadRemoteDirectoryTree(path)
    },
    onLocalDirectoryChange(values) {
      this.formData.localDirectory = values ? String(values) : ''
    },
    onRemoteDirectoryChange(values) {
      const arr = Array.isArray(values) ? values : []
      this.formData.remoteDirectory = arr.length ? String(arr[arr.length - 1] || '') : ''
    },
    syncPathSelectionFromForm() {
      const local = this.formData.localDirectory ? String(this.formData.localDirectory) : ''
      const remote = this.formData.remoteDirectory ? String(this.formData.remoteDirectory) : ''
      this.localDirectorySelection = local
      this.remoteDirectorySelection = remote ? [remote] : []
    },
    onRemoveAfterDownloadChange(v) {
      if (v) {
        this.formData.moveAfterDownload = false
        this.formData.createMoveFolderIfNotExist = false
      }
    },
    onMoveAfterDownloadChange(v) {
      if (v) {
        this.formData.removeAfterDownload = false
      } else {
        this.formData.createMoveFolderIfNotExist = false
      }
    },
    buildPayloadForSave() {
      const raw = { ...this.formData }
      raw.name = String(raw.name || '').trim()
      raw.description = raw.description != null ? String(raw.description) : ''
      raw.localDirectory = raw.localDirectory != null ? String(raw.localDirectory) : ''
      if (!raw.localDirectory.trim()) raw.localDirectory = '/'
      raw.wildCard = raw.wildCard != null ? String(raw.wildCard) : ''
      // 后端 keys：dataSourceId（String）、ftpDirectory（String）
      raw.dataSourceId = raw.dataSource != null && raw.dataSource !== '' ? String(raw.dataSource) : ''
      delete raw.dataSource
      raw.ftpDirectory = raw.remoteDirectory != null ? String(raw.remoteDirectory) : ''
      delete raw.remoteDirectory
      raw.binaryMode = !!raw.binaryMode
      raw.timeOut = raw.timeOut != null && raw.timeOut !== '' ? Math.max(1, Math.trunc(Number(raw.timeOut))) : 60000
      // 后端 keys
      raw.removeFile = !!raw.removeAfterDownload
      raw.moveFile = !!raw.moveAfterDownload
      raw.moveToDirectory = raw.moveToFolder != null ? String(raw.moveToFolder) : ''
      raw.createNewFolder = !!raw.createMoveFolderIfNotExist
      raw.dateInFilename = !!raw.fileNameContainsDate
      raw.dateTimeFormat = raw.dateTimeFormat != null ? String(raw.dateTimeFormat) : ''

      if (!raw.moveFile) {
        raw.createNewFolder = false
      }
      if (!raw.dateInFilename) {
        raw.dateTimeFormat = ''
      }

      const defaults = buildDefaultOutFields()
      const curr = Array.isArray(raw.outFiledList) ? raw.outFiledList : []
      raw.outFiledList = defaults.map((d) => {
        const hit = curr.find(x => String(x?.name || '') === d.name)
        return {
          name: d.name,
          fieldName: hit && String(hit.fieldName || '').trim() ? String(hit.fieldName).trim() : d.fieldName
        }
      })
      // FTP 下载高级配置不包含分发/并发，固定默认值
      raw.distributeType = false
      raw.copiesCache = 1
      // 清理 UI 临时字段，避免后端误读
      delete raw.removeAfterDownload
      delete raw.moveAfterDownload
      delete raw.moveToFolder
      delete raw.createMoveFolderIfNotExist
      delete raw.fileNameContainsDate
      return raw
    },
    handleSubmit() {
      const ui = { ...this.formData }
      const payload = this.buildPayloadForSave()
      if (!payload.name) {
        this.$message.warning('请填写步骤名称')
        return
      }
      if (!ui.dataSource) {
        this.$message.warning('请选择数据源')
        return
      }
      if (!ui.remoteDirectory) {
        this.$message.warning('请选择远程目录')
        return
      }
      if (!ui.localDirectory) {
        this.$message.warning('请选择本地目录')
        return
      }
      if (ui.moveAfterDownload && !String(ui.moveToFolder || '').trim()) {
        this.$message.warning('请输入移动到文件夹')
        return
      }
      if (ui.fileNameContainsDate && !ui.dateTimeFormat) {
        this.$message.warning('请选择日期时间格式')
        return
      }
      this.$emit('save', payload)
    }
  }
}
</script>

<style lang="scss" scoped>
.ftp-download-config {
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

.inline-checks {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
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
