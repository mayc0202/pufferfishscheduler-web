<template>
  <div class="container resource-page">
    <div class="wrap">
      <div class="header">
        <el-row>
          <el-col :span="8">
            <div class="flex">
              <img :src="icons.manger" class="el-icon-s-unfold icon">
              <div class="font">资源管理</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="flex">
              <img :src="icons.db_ftp" class="el-icon-s-unfold icon">
              <div class="font">当前数据源:</div>
              <div class="crurrent">{{ currentDb.name }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="flex">
              <img :src="icons.path" class="el-icon-s-unfold icon">
              <div class="font">当前路径:</div>
              <div class="crurrent">{{ currentPath }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <div class="body">
      <el-container>
        <el-aside width="260px" class="page-aside">
          <div class="group">
            <div class="wrap">
              <div class="search">
                <el-input
                  v-model="dbName"
                  placeholder="请输入FTP数据源名称"
                  clearable
                  @input="queryGroupsByName()"
                >
                  <i slot="prefix" class="el-input__icon el-icon-search" />
                </el-input>
              </div>
              <el-tree
                :data="group"
              >
                <div slot-scope="{ data }" class="custom-node flex between">
                  <div class="flex node-label" @click="selectFtpDb(data)">
                    <img
                      v-if="data.type === 'GROUP'"
                      :src="icons.db_group"
                      class="group_icon"
                    >
                    <img v-else :src="data.icon" class="group_icon">
                    {{ data.name }}
                  </div>
                </div>
              </el-tree>
            </div>
          </div>
        </el-aside>
        <el-container>
          <el-main>
            <div class="list">
              <div class="flex between search">
                <div class="search_input">
                  <input
                    v-model="queryData.name"
                    placeholder="请输入文件夹/文件名称"
                    class="input"
                  >
                </div>
                <div>
                  <el-button
                    type="primary"
                    size="mini"
                    icon="el-icon-search"
                    @click="queryResource()"
                  >查询</el-button>
                  <el-button
                    type="primary"
                    size="mini"
                    :disabled="isObjectStorageRoot"
                    @click="mkdirCurDir()"
                  >创建目录</el-button>
                  <el-button
                    type="primary"
                    size="mini"
                    :disabled="isObjectStorageRoot"
                    @click="uploadFile()"
                  >上传文件</el-button>
                  <el-button
                    v-if="currentPath !== '/'"
                    type="primary"
                    size="mini"
                    @click="backe()"
                  >返回</el-button>
                </div>
              </div>
              <template>
                <el-table
                  v-loading="loading"
                  element-loading-text="正在加载数据..."
                  element-loading-spinner="el-icon-loading"
                  element-loading-background="rgba(255, 255, 255, 0.8)"
                  :data="resourceList"
                  style="width: 100%"
                  max-height="640"
                >
                  <el-table-column fixed type="index" label="#" />
                  <el-table-column prop="name" label="资源名称" min-width="220">
                    <template slot-scope="scope">
                      <div class="flex node-label" :class="scope.row.type === 'FILE' ? '': 'hand'" @click="queryResourceChildren(scope.row)">
                        <img :src="scope.row.icon" class="icon">
                        {{ scope.row.name }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="typeTxt" label="文件类型" min-width="160" />
                  <el-table-column prop="size" label="资源大小" min-width="160" />
                  <el-table-column
                    prop="createdTimeTxt"
                    label="创建日期"
                    min-width="220"
                  />
                  <el-table-column fixed="right" label="操作" min-width="260">
                    <template slot-scope="scope">
                      <div class="resource-row-actions">
                        <el-button
                          type="text"
                          size="mini"
                          :disabled="scope.row.type === 'FILE' || isBucketNode(scope.row)"
                          @click.native.prevent="mkdir(scope.row)"
                        >
                          创建目录
                        </el-button>
                        <el-button
                          type="text"
                          size="mini"
                          :disabled="isBucketNode(scope.row)"
                          @click.native.prevent="rename(scope.row)"
                        >
                          重命名
                        </el-button>
                        <el-button
                          type="text"
                          size="mini"
                          :disabled="scope.row.type != 'FILE' || isBucketNode(scope.row)"
                          @click.native.prevent="move(scope.row)"
                        >
                          移动
                        </el-button>
                        <el-button
                          type="text"
                          size="mini"
                          :disabled="scope.row.type != 'FILE' || isBucketNode(scope.row)"
                          :loading="downloadingWithProgress"
                          @click="handleDownloadWithProgress(scope.row)"
                        >
                          下载
                        </el-button>
                        <el-button
                          type="text"
                          size="mini"
                          :disabled="isBucketNode(scope.row)"
                          @click.native.prevent="remove(scope.row)"
                        >
                          删除
                        </el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </template>
              <div class="pagination-wrapper">
                <el-pagination
                  :current-page="pagination.pageNo"
                  :page-sizes="pagination.sizes"
                  :page-size="pagination.pageSize"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="pagination.total"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </div>
          </el-main>
        </el-container>
      </el-container>
    </div>
    <mkdir-dialog
      :title="mkdirDialog.title"
      :visible="mkdirDialog.visible"
      :width="mkdirDialog.width"
      :height="mkdirDialog.height"
      :show-bth="false"
      @onClose="mkdirClose"
      @onConfirm="mkdirConfirm"
    >
      <div slot="content">
        <el-form ref="resource" :model="resource" :rules="resourceRule" label-width="80px">
          <el-form-item label="当前目录:">
            <el-input
              v-model="resource.remotePath"
              size="mini"
              :disabled="true"
            />
          </el-form-item>
          <el-form-item label="目录名称:" prop="name">
            <el-input
              ref="name"
              v-model="resource.name"
              size="mini"
              placeholder="请输入目录名称"
              prefix-icon="el-icon-edit-outline"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" @click="submitMkdir()">确认</el-button>
            <el-button size="mini" @click="cancelMkdir()">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </mkdir-dialog>
    <rename-dialog
      :title="renameDialog.title"
      :visible="renameDialog.visible"
      :width="renameDialog.width"
      :height="renameDialog.height"
      :show-bth="false"
      @onClose="renameClose"
      @onConfirm="renameConfirm"
    >
      <div slot="content">
        <el-form ref="resource" :model="resource" :rules="resourceRule" label-width="80px">
          <el-form-item label="当前目录:">
            <el-input
              v-model="resource.remotePath"
              size="mini"
              :disabled="true"
            />
          </el-form-item>
          <el-form-item label="新名称:" prop="newName">
            <el-input
              ref="name"
              v-model="resource.newName"
              size="mini"
              placeholder="请输入新名称"
              prefix-icon="el-icon-edit-outline"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" @click="submitRename()">确认</el-button>
            <el-button size="mini" @click="cancelRename()">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </rename-dialog>
    <move-dialog
      :title="moveDialog.title"
      :visible="moveDialog.visible"
      :width="moveDialog.width"
      :height="moveDialog.height"
      :show-bth="false"
      @onClose="moveClose"
      @onConfirm="moveConfirm"
    >
      <div slot="content" v-loading="directoryLoading">
        <div class="wrap">
          <div class="flex">
            <div class="move-label">资源目录：</div>
            <el-cascader
              v-model="directory"
              size="mini"
              class="move-input"
              placeholder="请选择资源目录"
              :options="directoryList"
              :props="{ checkStrictly: true }"
              clearable
              filterable
            />
          </div>
          <div class="move-btn">
            <el-button type="primary" size="mini" @click="submitMove()">确认</el-button>
            <el-button size="mini" @click="cancelMove()">取消</el-button>
          </div>
        </div>
      </div>
    </move-dialog>
    <upload-dialog
      ref="uploadDialogRef"
      :title="uploadDialog.title"
      :prompt="uploadDialog.prompt"
      :visible="uploadDialog.visible"
      :width="uploadDialog.width"
      :height="uploadDialog.height"
      :db-id="currentDb.id"
      :current-path="currentPath"
      @close="handleUploadClose"
      @success="handleUploadSuccess"
      @back="queryResource"
    >
      <template v-slot:content>
        <div class="move-btn">
          <el-button type="primary" size="mini" @click="confirmUpload()">确认</el-button>
          <el-button size="mini" @click="cancelUpload()">取消</el-button>
        </div>
      </template>
    </upload-dialog>
  </div>
</template>

<script>
import icons from '@/assets/icon/icons.js'
import DynamicDialog from '@/components/common/dynamic-dialog.vue'
import Upload from './component/uploadFile.vue'
import { exportFileFromResponse } from '@/utils/download-util'

import { directoryTree, list, mkdir, rename, remove, move, downloadResource } from '@/api/database/resource/resource.js'
import { resourceDbTree } from '@/api/database/database/dbGroup'

export default {
  name: 'Resource',
  components: {
    'mkdir-dialog': DynamicDialog,
    'rename-dialog': DynamicDialog,
    'move-dialog': DynamicDialog,
    'upload-dialog': Upload
  },
  data() {
    return {
      icons,
      groupForm: {
        id: null,
        name: '',
        orderBy: 0
      },
      dbName: '',
      group: [],
      queryData: {
        dbId: '',
        name: '',
        path: '/',
        pageNo: 1,
        pageSize: 10
      },
      resourceList: [],
      pagination: {
        total: 0,
        pageNo: 1,
        pageSize: 10,
        pageSizes: [10, 20, 30, 40, 50, 100]
      },
      pageNo: 0,
      pageSize: 0,
      total: 0,
      loading: false,
      // 当前数据库信息
      currentDb: {
        id: null,
        name: ''
      },
      currentPath: '/', // 当前路径，默认为根目录'/'
      // 资源操作表单数据
      resource: {
        dbId: '',
        name: '',
        path: '',
        remotePath: '/',
        fromPath: '',
        toPath: '',
        newName: '',
        oldName: ''
      },
      // 创建文件夹弹窗数据
      mkdirDialog: {
        title: '新增目录',
        visible: false,
        width: 360,
        height: 160
      },
      // 重命名弹窗数据
      renameDialog: {
        title: '资源重命名',
        visible: false,
        width: 360,
        height: 160
      },
      // 移动弹窗数据
      moveDialog: {
        title: '资源移动',
        visible: false,
        width: 530,
        height: 120
      },
      // 表单验证规则
      resourceRule: {
        name: [
          { required: true, trigger: 'blur', message: '请输入目录名称!' }
        ],
        newName: [
          { required: true, trigger: 'blur', message: '请输入新名称!' }
        ]
      },
      moveData: {},
      directory: [],
      directoryLoading: false,
      directoryList: [],
      // 上传文件弹窗数据
      uploadDialog: {
        title: '上传文件',
        prompt: '注意：文件大小不能超过900MB！',
        visible: false,
        width: 460,
        height: 320
      },
      // 下载进度条
      downloadingWithProgress: false
    }
  },

  computed: {
    isObjectStorageRoot() {
      return this.currentPath === '/' && this.resourceList.some(item => this.isBucketNode(item))
    },
    // 计算当前路径的父路径
    parentPath() {
      if (this.currentPath === '/') return '/'
      const paths = this.currentPath.split('/').filter(Boolean)
      paths.pop()
      return paths.length ? `/${paths.join('/')}` : '/'
    }
  },

  created() {
    this.pagination.pageNo = 1
    this.pagination.pageSize = 10
  },

  mounted() {
    this.queryGroupAll()
  },

  methods: {
    /**
     * 每页多少条记录
     * @param size
     */
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.queryResource()
    },

    /**
     * 查询第几页
     * @param page
     */
    handleCurrentChange(page) {
      this.pagination.pageNo = page
      this.queryResource()
    },

    /**
     * 返回上一级
     */
    backe() {
      if (this.currentPath === '/') return
      this.navigateTo(this.parentPath)
    },

    /**
     * 导航到指定路径
     */
    navigateTo(path) {
      this.currentPath = path
      this.queryData.path = path
      this.queryResource()
    },

    /**
     * 依据分组名称查询
     */
    async queryGroupsByName() {
      try {
        const res = await resourceDbTree(this.dbName)
        this.handleGroupResponse(res)
      } catch (error) {
        this.$message.error('获取资源分组失败!')
      }
    },

    /**
     * 选择FTP数据源
     */
    selectFtpDb(data) {
      if (data.type === 'DATABASE') {
        this.currentDb.id = data.id
        this.currentDb.name = data.name
        this.currentPath = '/'
        this.queryData.dbId = this.currentDb.id
        this.queryData.path = this.currentPath
        this.queryResource()
      }
    },

    /**
     * 获取分组
     */
    async queryGroupAll() {
      try {
        const res = await resourceDbTree(this.dbName)
        this.handleGroupResponse(res, true)
      } catch (error) {
        this.$message.error('获取资源分组失败!')
      }
    },

    /**
     * 处理分组响应数据
     */
    handleGroupResponse(res, isInitial = false) {
      if (res.code === '999999') {
        this.$message.warning(res.message)
        return
      }

      this.group = isInitial ? res.data : res.datadata

      if (isInitial && this.group.length) {
        const [firstGroup] = this.group
        const [firstChild] = firstGroup.children || []
        if (firstChild) {
          this.currentDb = {
            id: firstChild.id,
            name: firstChild.name
          }
          this.queryData.dbId = firstChild.id
          this.queryResource()
        }
      }
    },

    /**
     * 获取资源子级
     */
    async queryResourceChildren(data) {
      if (data.type === 'FILE') return

      const newPath = this.joinPaths(this.currentPath, data.name)
      this.queryData.dbId = data.dbId
      this.navigateTo(newPath)
    },

    /**
     * 获取资源列表
     */
    async queryResource() {
      try {
        this.loading = true
        const params = {
          ...this.queryData,
          pageNo: this.pagination.pageNo,
          pageSize: this.pagination.pageSize
        }

        const res = await list(params)

        if (res.code === '999999') {
          this.$message.warning(res.message)
          return
        }

        const data = res.data
        this.resourceList = data.records.map(this.processFile)

        // 更新分页信息
        this.pagination = {
          pageNo: data.current,
          pageSize: data.size,
          total: data.total
        }
      } catch (error) {
        this.$message.error('获取资源列表失败')
      } finally {
        this.loading = false
      }
    },

    /**
     * 处理文件
     */
    processFile(file) {
      const isDirectory = file.type === 'DIRECTORY'
      const isBucket = file.type === 'BUCKET'
      return {
        ...file,
        typeTxt: isBucket ? 'Bucket' : (isDirectory ? '文件夹' : '文件'),
        icon: (isDirectory || isBucket) ? icons.directory : this.getFileIcon(file.name)
      }
    },

    isBucketNode(node) {
      return node && node.type === 'BUCKET'
    },

    /**
     * 获取文件图标
     */
    getFileIcon(filename) {
      const extension = (filename.split('.').pop() || '').toLowerCase()
      const iconMap = {
        csv: icons.csv,
        xls: icons.excel,
        xlsx: icons.excel,
        pdf: icons.pdf,
        doc: icons.word,
        docx: icons.word,
        zip: icons.zip,
        png: icons.img,
        jpg: icons.img,
        jpeg: icons.img,
        sql: icons.sql,
        json: icons.json,
        jar: icons.jar

      }
      return iconMap[extension] || icons.file
    },

    // ///////////// 上传文件 /////////////

    /**
     * 上传文件
     */
    uploadFile() {
      if (this.isObjectStorageRoot) {
        this.$message.warning('对象存储根路径仅展示 Bucket，请先进入 Bucket 后再上传文件')
        return
      }
      this.uploadDialog.visible = true
    },

    /**
     * 处理上传关闭
     */
    handleUploadClose() {
      this.uploadDialog.visible = false
    },

    /**
     * 处理上传成功
     */
    handleUploadSuccess(success) {
      if (success) {
        // 处理上传成功逻辑
      // eslint-disable-next-line no-empty
      }
      this.uploadDialog.visible = false
    },

    /**
     * 确认上传
     */
    confirmUpload() {
      if (this.$refs.uploadDialogRef && this.$refs.uploadDialogRef.uploading) {
        this.$message.warning('文件上传中，请稍候')
        return
      }
      this.uploadDialog.visible = false
    },

    /**
     * 取消上传
     */
    cancelUpload() {
      if (this.$refs.uploadDialogRef && this.$refs.uploadDialogRef.uploading) {
        this.$message.warning('文件上传中，请稍候')
        return
      }
      this.uploadDialog.visible = false
    },

    // ///////////// 创建文件夹 /////////////
    /**
     * 创建当前目录
     */
    mkdirCurDir() {
      if (this.isObjectStorageRoot) {
        this.$message.warning('对象存储根路径仅展示 Bucket，请先进入 Bucket 后再创建目录')
        return
      }
      this.resource = {
        ...this.resource,
        dbId: this.currentDb.id,
        path: this.currentPath,
        remotePath: this.currentPath
      }
      this.mkdirDialog.visible = true
    },

    /**
     * 创建目录
     */
    mkdir(data) {
      if (this.isBucketNode(data)) {
        this.$message.warning('Bucket 节点不支持此操作，请先进入 Bucket')
        return
      }
      const parentPath = this.joinPaths(this.currentPath, data.name)
      this.resource = {
        ...this.resource,
        dbId: this.currentDb.id,
        path: parentPath,
        remotePath: parentPath
      }
      this.mkdirDialog.visible = true
    },

    /**
     * 配置弹窗确认
     */
    mkdirConfirm() {
      this.mkdirDialog.visible = false
    },

    /**
     * 配置弹窗取消
     */
    mkdirClose() {
      this.closeDialog('mkdir')
    },

    /**
     * 确认创建目录
     */
    async submitMkdir() {
      try {
        const res = await mkdir(this.resource)
        const ok = await this.handleOperationResponse(res, '目录创建成功')
        if (ok) {
          this.closeDialog('mkdir')
        }
      } catch (error) {
        this.$message.error('目录创建失败')
      }
    },

    /**
     * 取消创建目录
     */
    cancelMkdir() {
      this.closeDialog('mkdir')
    },

    // ///////////// 移动文件夹/文件 /////////////

    /**
     * 移动
     */
    move(data) {
      if (this.isBucketNode(data)) {
        this.$message.warning('Bucket 节点不支持移动操作')
        return
      }
      this.moveData.dbId = data.dbId
      this.moveData.name = data.name
      this.moveData.type = data.type

      this.loadDirectoryTree(this.currentDb.id, this.currentPath)
      this.moveDialog.visible = true
    },

    /**
     * 移动弹窗取消
     */
    moveClose() {
      this.moveDialog.visible = false
      this.directory = []
      this.moveData = {}
    },

    /**
     * 移动弹窗确认
     */
    moveConfirm() {
      this.moveDialog.visible = false
    },

    /**
     * 获取目录树形结构
    */
    async loadDirectoryTree(dbId, path) {
      this.directoryLoading = true

      try {
        const res = await directoryTree(dbId, path)

        // 检查返回数据有效性
        if (!res?.data) {
          throw new Error('请求成功，但返回数据异常')
        }

        const { code, message, data } = res

        if (code === '999999') {
          this.$message.warning(message || '操作失败，请重试')
          return null
        }

        // 成功处理
        this.directoryList = data
        return data
      } catch (error) {
        if (error.message.includes('timeout')) {
          this.$message.warning('网络请求超时...')
        } else {
          this.$message.error(error.message || '获取目录树失败')
        }
      } finally {
        this.directoryLoading = false
      }
    },

    /**
     * 确认移动
     */
    async submitMove() {
      var type = this.moveData.type === 'FILE' ? '文件' : '目录'
      this.moveData.fromPath = this.joinPaths(this.currentPath, this.moveData.name)
      if (this.directory.length === 0) {
        this.$message.warning('请选择目标目录')
        return
      }
      const path = this.directory[this.directory.length - 1]
      this.moveData.toPath = path

      try {
        const res = await move(this.moveData)
        const ok = await this.handleOperationResponse(res, type + '移动成功')
        if (ok) {
          this.closeDialog('move')
        }
      } catch (error) {
        this.$message.error(type + '移动失败')
      }
    },

    /**
     * 取消移动
     */
    cancelMove() {
      this.closeDialog('move')
    },
    // ///////////// 重命名文件夹/文件 /////////////

    /**
     * 重命名
     */
    rename(data) {
      if (this.isBucketNode(data)) {
        this.$message.warning('Bucket 节点不支持重命名')
        return
      }
      this.resource = {
        ...this.resource,
        dbId: this.currentDb.id,
        path: this.currentPath,
        oldName: data.name,
        remotePath: this.joinPaths(this.currentPath, data.name)
      }
      this.renameDialog.visible = true
    },

    /**
     * 配置弹窗确认
     */
    renameConfirm() {
      this.renameDialog.visible = false
    },

    /**
     * 配置弹窗取消
     */
    renameClose() {
      this.closeDialog('rename')
    },

    /**
     * 确认重命名
     */
    async submitRename() {
      try {
        const res = await rename(this.resource)
        const ok = await this.handleOperationResponse(res, '重命名成功')
        if (ok) {
          this.closeDialog('rename')
        }
      } catch (error) {
        this.$message.error('重命名失败')
      }
    },

    /**
     * 处理操作响应
     */
    async handleOperationResponse(res, successMessage) {
      if (res.code === '999999') {
        this.$message.warning(res.message)
        return false
      }
      this.$message.success(successMessage)
      await this.queryResource()
      return true
    },

    /**
     * 取消重命名
     */
    cancelRename() {
      this.closeDialog('rename')
    },

    // ///////////// 移除文件夹/文件 /////////////

    /**
     * 移除
     */
    async remove(data) {
      try {
        if (this.isBucketNode(data)) {
          this.$message.warning('Bucket 节点不支持删除，请在对象存储控制台操作')
          return
        }
        this.resource.dbId = data.dbId
        this.resource.path = this.joinPaths(this.currentPath, data.name)
        this.resource.type = data.type

        await this.$confirm(
          `此操作将永久删除该${data.type === 'FILE' ? '文件' : '目录'}, 是否继续?`,
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        const res = await remove(this.resource)

        if (res.code === '999999') {
          this.$message.warning(res.message)
        } else {
          this.$message.success('删除成功!')
          await this.queryResource()
        }
      } catch (error) {
        if (error === 'cancel') {
          this.$message.info('已取消删除')
        } else {
          this.$message.error('删除过程中发生错误')
        }
      }
    },

    // ///////////// 通用方法 /////////////

    /**
     * 关闭对话框
     */
    closeDialog(type) {
      this[`${type}Dialog`].visible = false
      const formRef = this.$refs.resource
      if (formRef) {
        const forms = Array.isArray(formRef) ? formRef : [formRef]
        forms.forEach(form => {
          if (form && typeof form.clearValidate === 'function') {
            form.clearValidate()
          }
        })
      }
      this.resetResource()
    },

    /**
     * 重置资源对象
     */
    resetResource() {
      this.resource = {
        dbId: '',
        name: '',
        path: '',
        remotePath: '/',
        fromPath: '',
        toPath: '',
        newName: '',
        oldName: ''
      }
    },

    /**
     * 拼接路径
     */
    joinPaths(...paths) {
      return paths.reduce((acc, path) => {
        const cleanPath = path.replace(/^\/+|\/+$/g, '')
        return acc === '/' ? `/${cleanPath}` : `${acc}/${cleanPath}`
      }, '/').replace(/\/+/g, '/')
    },

    /**
     * 处理带进度显示的下载
     */
    async handleDownloadWithProgress(data) {
      let response = null
      this.downloadingWithProgress = true

      try {
        // 1. 构造参数
        const downloadParams = {
          dbId: data.dbId,
          name: data.name,
          path: this.currentPath,
          type: data.type
        }

        // 2. 调用封装的下载方法（此时能拿到完整response对象）
        response = await downloadResource(downloadParams)

        // 3. 调用导出函数
        exportFileFromResponse(response, data.name)
        this.$message.success('下载完成')
      } catch (error) {
        this.$message.error(`下载失败：${error.message || '未获取到文件数据'}`)
      } finally {
        this.downloadingWithProgress = false
      }
    }
  }
}
</script>

<style lang="scss">
@import "@/styles/variables.scss";

.custom-tooltip .custom-menu {
  border: none;
}

.custom-tooltip .menu-item {
  color: $label;
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
}

.custom-tooltip .menu-item:last-child {
  border-bottom: none;
}

.custom-tooltip .menu-item:hover {
  background-color: #fff;
  color: #409eff;
}

.custom-tooltip {
  border: none !important;
  border-radius: 4px !important;
  box-shadow: $shadow;
}

.custom-tooltip .popper__arrow {
  border: none !important;
  box-shadow: $shadow;
}
</style>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

// 修改el-container的样式
.container {
  height: calc(100vh - 84px);
  background: radial-gradient(circle at 15% 20%, #eef4ff 0%, #f6f9ff 55%, #f7f8fb 100%);
  padding: 14px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 覆盖 App.vue 全局 .header 的 margin:10px，避免头部白条左右缩进，与下方 aside+main 同宽 */
.resource-page > .wrap > .header {
  margin: 0 0 14px;
  border-radius: 14px;
  border: 1px solid #e9eef8;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
}

// 主内容区域样式调整
::v-deep .el-container > .el-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

::v-deep .el-aside {
  font-size: 16px;
  font-weight: 600;
  padding: 10px;
  min-width: 200px;
  margin-left: 10px;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
  user-select: none;
  background-color: #fff;
}

// 侧边栏样式调整
::v-deep .page-aside {
  height: 100%;
  margin: 0 14px 0 0;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 14px;
  border: 1px solid #e9eef8;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
  user-select: none;
  min-width: 240px;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

/* 弹窗内的 el-aside */
::v-deep .dialog-aside {
  height: auto;
  min-height: 390px;
  overflow-y: auto;
}

// 表格区域样式调整
::v-deep .el-main {
  flex: 1;
  overflow-y: auto; // 改为垂直滚动
  display: flex;
  flex-direction: column;
  padding: 0 !important;

  .list {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 14px;
    border: 1px solid #e9eef8;
    box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
    .search {
      flex-shrink: 0;
    }
    .el-table {
      flex: 1;
    }
    .pagination-wrapper {
      flex-shrink: 0;
      margin-top: 20px;
    }
  }
}

::v-deep .el-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #edf2fb;
}

::v-deep .el-table__body-wrapper {
  flex: 1;
  overflow-y: auto;
}

::v-deep .el-table th {
  background-color: #f8faff !important;
  color: #31415f;
  font-weight: 600;
  height: 44px;
}

::v-deep .el-table td {
  padding: 10px 0;
  color: #4b566a;
}

/* 资源列表操作列：同一行横向排列 */
::v-deep .resource-row-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
}

::v-deep .resource-row-actions .el-button--text {
  flex-shrink: 0;
  padding-left: 6px;
  padding-right: 6px;
  margin-left: 0;
  margin-right: 0;
}

::v-deep .el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #fafcff;
}

::v-deep .el-input--mini .el-input__inner {
  height: 32px;
  line-height: 32px;
  font-size: 13px;
  border-radius: 8px;
}

::v-deep .el-button--mini {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
}

::v-deep .el-textarea__inner {
  display: block;
  resize: vertical;
  padding: 5px 15px;
  line-height: 1.5;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  width: 100%;
  font-size: 14px;
  color: #606266;
  background-color: #fff;
  background-image: none;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  -webkit-transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

::v-deep .el-pagination__sizes {
  margin-top: -5px;
}

::v-deep .el-form-item__label {
  font-size: 13px;
}

.body {
  flex: 1; // 占据剩余空间
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: hidden; // 隐藏溢出内容
}

/* 确保内部容器高度正确 */
.body >>> .el-container {
  height: 100%;
}

.body .group {
  border-radius: 4px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.body .group .wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

::v-deep .el-tree {
  flex: 1;
  overflow-y: auto;
}

.body .group .search {
  margin-bottom: 14px;
  flex-shrink: 0;
}

.body .group .search .add {
  margin-left: 10px;
}

.body .group .queryAll {
  width: 100%;
  margin-bottom: 14px;
  flex-shrink: 0;
  border-radius: 8px;
}

.body .group .group_icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 0;
  margin-right: 8px;
  object-fit: contain;
  display: block;
}

.body .list {
  margin: 0;
  padding: 20px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9eef8;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.body .list .search {
  padding: 0;
  margin-bottom: 20px;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.body .list .search .search_input {
  width: 220px;
  min-width: 220px;
  height: 32px;
  margin-right: 10px;
}

.body .list .search .search_input .input {
  height: 32px;
  width: 100%;
  background-color: white;
  box-shadow: none;
  border-radius: 8px;
  outline: none;
  border: 1px solid #dcdfe6;
  padding: 0 10px;
  box-sizing: border-box;
}

.body .list .search > div:last-child {
  flex-shrink: 0;
}

.item {
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
}

.item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item .item-name {
  margin-left: 10px;
}

.database-icon {
  margin-right: 8px;
  margin-top: 8px;
}

.database-block {
  width: 100%;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #eee;
  border-radius: 6px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
  transition: box-shadow 0.3s;
}

.database-block:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.database-block img {
  max-width: 80px;
  max-height: 60px;
  object-fit: contain;
  user-select: none;
}

.custom-node {
  display: flex;
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  width: 100%;
  padding: 0 8px;
  font-size: 14px;
}

.node-label {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
  font-weight: 400;
  color: #31415f;
  line-height: 1.25;
}

.node-label:hover {
  color: #409eff;
}

.node-icon {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
  transition: color 0.3s;
  -webkit-transform: rotate(90deg); /* Chrome/Safari */
  -moz-transform: rotate(90deg); /* Firefox */
  -ms-transform: rotate(90deg); /* IE9+ */
  -o-transform: rotate(90deg); /* Opera */
  transform: rotate(90deg);
}

.custom-menu {
  user-select: none;
  padding: 0;
}

.menu-item {
  padding: 2px 10px;
}

.menu-item:hover {
  background-color: #606266;
}

/**
* 资源图标（与资源名称同轴垂直居中）
*/
.icon {
  flex-shrink: 0;
  margin-right: 5px;
  width: 16px;
  height: 16px;
  object-fit: contain;
  display: block;
}

/**
* 移动目录弹窗
*/
.move-label {
  font-size: 14px;
  line-height: 34px;
  font-weight: 600;
}

.move-input {
  width: 400px;
}

.move-btn {
  text-align: center;
  justify-content: center;
  margin-top: 40px;
}
</style>

