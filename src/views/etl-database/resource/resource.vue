<template>
  <div class="container">
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
              <el-tree :data="group">
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
          <el-main v-loading="loading">
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
                    @click="mkdirCurDir()"
                  >创建目录</el-button>
                  <el-button
                    type="primary"
                    size="mini"
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
                  :data="resourceList"
                  style="width: 100%"
                  max-height="640"
                >
                  <el-table-column fixed type="index" label="#" />
                  <el-table-column prop="name" label="数据源名称" width="320">
                    <template slot-scope="scope">
                      <div class="flex node-label" :class="scope.row.type === 'FILE' ? '': 'hand'" @click="queryResourceChildren(scope.row)">
                        <img :src="scope.row.icon" class="icon">
                        {{ scope.row.name }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="typeTxt" label="文件类型" width="140" />
                  <el-table-column prop="size" label="文件大小" width="200" />
                  <el-table-column
                    prop="createdTimeTxt"
                    label="创建日期"
                    width="200"
                  />
                  <el-table-column fixed="right" label="操作" width="240">
                    <template slot-scope="scope">
                      <div class="wrap">
                        <div>
                          <el-button
                            type="text"
                            size="mini"
                            :disabled="scope.row.type === 'FILE'"
                            @click.native.prevent="mkdir(scope.row)"
                          >
                            创建目录
                          </el-button>
                          <el-button
                            type="text"
                            size="mini"
                            @click.native.prevent="rename(scope.row)"
                          >
                            重命名
                          </el-button>
                          <el-button
                            type="text"
                            size="mini"
                            @click.native.prevent="move(scope.row)"
                          >
                            移动
                          </el-button>
                          <el-button
                            type="text"
                            size="mini"
                            @click.native.prevent="remove(scope.row)"
                          >
                            删除
                          </el-button>
                        </div>
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

import { tree, directoryTree, list, mkdir, rename, remove, move } from '@/api/database/resource/resource.js'

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
      currentDb: {
        id: null,
        name: ''
      },
      currentPath: '/',
      resource: {
        dbId: '',
        name: '',
        path: '',
        remotePath: '/',
        formPath: '',
        toPath: '',
        newName: '',
        oldName: ''
      },
      mkdirDialog: {
        title: '新增目录',
        visible: false,
        width: 360,
        height: 160
      },
      renameDialog: {
        title: '资源重命名',
        visible: false,
        width: 360,
        height: 160
      },
      moveDialog: {
        title: '资源移动',
        visible: false,
        width: 530,
        height: 120
      },
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
      uploadDialog: {
        title: '上传文件',
        prompt: '注意：文件大小不能超过900MB！',
        visible: false,
        width: 460,
        height: 320
      }
    }
  },

  computed: {
    // 计算当前路径的父路径
    parentPath() {
      if (this.currentPath === '/') return '/'
      const paths = this.currentPath.split('/').filter(Boolean)
      paths.pop()
      return paths.length ? `/${paths.join('/')}` : '/'
    }
  },

  created() {
    this.pageNo = 1
    this.pageSize = 10
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
        const res = await tree(this.dbName)
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
        const res = await tree(this.dbName)
        this.handleGroupResponse(res, true)
      } catch (error) {
        this.$message.error('获取资源分组失败!')
      }
    },

    /**
     * 处理分组响应数据
     */
    handleGroupResponse(res, isInitial = false) {
      const { data } = res
      if (data.code === '999999') {
        this.$message.warning(data.message)
        return
      }

      this.group = isInitial ? data.result : data.resultdata

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
        const { data } = res

        if (data.code === '999999') {
          this.$message.warning(data.message)
          return
        }

        const { result } = data
        this.resourceList = result.records.map(this.processFile)

        // 更新分页信息
        this.pagination = {
          pageNo: result.current,
          pageSize: result.size,
          total: result.total
        }
      } catch (error) {
        console.log(error)
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
      return {
        ...file,
        typeTxt: isDirectory ? '文件夹' : '文件',
        icon: isDirectory ? icons.directory : this.getFileIcon(file.name)
      }
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
        jpeg: icons.img
      }
      return iconMap[extension] || icons.file
    },

    // ///////////// 上传文件 /////////////

    /**
     * 上传文件
     */
    uploadFile() {
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
      // 确认上传逻辑
      this.uploadDialog.visible = false
    },

    /**
     * 取消上传
     */
    cancelUpload() {
      this.uploadDialog.visible = false
    },

    // ///////////// 创建文件夹 /////////////
    /**
     * 创建当前目录
     */
    mkdirCurDir() {
      this.resource = {
        ...this.resource,
        dbId: this.currentDb.id,
        remotePath: this.currentPath
      }
      this.mkdirDialog.visible = true
    },

    /**
     * 创建目录
     */
    mkdir(data) {
      this.resource = {
        ...this.resource,
        dbId: this.currentDb.id,
        remotePath: this.joinPaths(this.currentPath, data.name)
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
      // 重置表单和校验状态
      this.$refs.resource.resetFields()
      this.resource.name = ''
      this.mkdirDialog.visible = false
    },

    /**
     * 确认创建目录
     */
    async submitMkdir() {
      try {
        const res = await mkdir(this.resource)
        this.handleOperationResponse(res, '目录创建成功')
      } catch (error) {
        this.$message.error('目录创建失败')
      } finally {
        this.closeDialog('mkdir')
      }
    },

    /**
     * 取消创建目录
     */
    cancelMkdir() {
      this.mkdirClose()
    },

    // ///////////// 移动文件夹/文件 /////////////

    /**
     * 移动
     */
    move(data) {
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
        const res = await directoryTree(dbId, this.currentPath)

        // 检查返回数据有效性
        if (!res?.data) {
          throw new Error('请求成功，但返回数据异常')
        }

        const { code, message, result } = res.data

        if (code === '999999') {
          this.$message.warning(message || '操作失败，请重试')
          return null
        }

        // 成功处理
        this.directoryList = result
        return result
      } catch (error) {
        if (error.message.includes('timeout')) {
          this.$message.error('网络请求超时...')
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
      this.moveData.fromPath = this.currentPath + this.joinPaths(this.moveData.name)
      if (this.directory.length > 0) {
        const path = this.directory[this.directory.length - 1]
        this.moveData.toPath = path
      }

      try {
        const res = await move(this.moveData)
        this.handleOperationResponse(res, type + '移动成功')
      } catch (error) {
        this.$message.error(type + '移动失败')
      } finally {
        this.directory = []
        this.moveData = {}
        this.closeDialog('move')
        this.queryResource()
      }
    },

    /**
     * 取消移动
     */
    cancelMove() {
      this.moveClose()
    },
    // ///////////// 重命名文件夹/文件 /////////////

    /**
     * 重命名
     */
    rename(data) {
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
      // 重置表单和校验状态
      this.$refs.resource.resetFields()
      this.resetResource()
      this.renameDialog.visible = false
    },

    /**
     * 确认重命名
     */
    async submitRename() {
      try {
        const res = await rename(this.resource)
        this.handleOperationResponse(res, '重命名成功')
      } catch (error) {
        this.$message.error('重命名失败')
      } finally {
        this.closeDialog('rename')
      }
    },

    /**
     * 处理操作响应
     */
    handleOperationResponse(res, successMessage) {
      const { data } = res
      if (data.code === '999999') {
        this.$message.warning(data.message)
      } else {
        this.$message.success(successMessage)
        this.queryResource()
      }
    },

    /**
     * 取消重命名
     */
    cancelRename() {
      this.renameClose()
    },

    // ///////////// 移除文件夹/文件 /////////////

    /**
     * 移除
     */
    async remove(data) {
      try {
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

        if (res.data.code === '999999') {
          this.$message.warning(res.data.message)
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
      this.$refs.resource.resetFields()
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
        formPath: '',
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
    }
  }
}
</script>

<style lang="scss">
@import "@/styles/variables.scss";

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

// 主内容区域样式调整
::v-deep .el-container > .el-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

::v-deep .el-aside {
  background-color: rgb(255, 255, 255);
  padding: 10px;
  color: #696969;
  box-shadow: $shadow;
  margin-bottom: 0;
  font-size: 16px;
  font-weight: 600;
  user-select: none;
  min-width: 200px;
}

// 侧边栏样式调整
::v-deep .page-aside {
  height: 100%;
  overflow-y: auto; // 允许侧边栏单独滚动
  background-color: rgb(255, 255, 255);
  box-shadow: $shadow;
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
  padding: 0 !important;
  margin-left: 10px;
  overflow-y: auto; // 改为垂直滚动
  display: flex;
  flex-direction: column;
  .list {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 10px 20px 20px 20px;
    background: #fff;
    box-shadow: $shadow;
    border-radius: 4px;
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

/* 页面主区域 */
::v-deep .page-aside + .el-container > .el-main {
  margin-left: 10px;
  box-shadow: $shadow;
}

::v-deep .el-table {
  border: 1px solid #ebeef5;
  border-bottom: 0;
  max-height: 630px;
}

::v-deep .el-input--mini .el-input__inner {
  height: 36px;
  line-height: 28px;
  font-size: 14px;
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
  background-color: #ffffff;
  background-image: none;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  -webkit-transition: border-color 0.2s cubic-
  bezier(0.645, 0.045, 0.355, 1);
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

::v-deep .el-pagination__sizes {
  margin-top: -5px;
}

::v-deep .el-form-item__label {
  font-size: 13px;
}

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
  background: #fff fixed;
  box-shadow: 0 2px px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  min-width: 220px; /* 设置最小输入宽度 */
}

.body .group .search {
  margin-bottom: 10px;
}

.body .group .search .add {
  margin-left: 10px;
}

.body .group .queryAll {
  width: 100%;
  margin-bottom: 10px;
}

.body .group .group_icon {
  width: 18px;
  height: 18px;
  margin-top: 8px;
  margin-right: 6px;
}

.body .list {
  padding: 10px 20px 20px 20px;
  background: #fff fixed;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  height: 100%;
  min-width: 504px;
}

.body .list .search {
  padding: 10px;
  margin-bottom: 20px;
}

.body .list .search .search_input {
  border-bottom: 1px rgb(167, 167, 167) inset;
  width: 220px;
  min-width: 220px;
  height: 30px;
  margin-right: 10px;
}

.body .list .search .search_input .input {
  height: 24px;
  background-color: white;
  box-shadow: none;
  border-radius: 4px;
  outline: none;
  border: none;
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
  flex: 1;
  font-weight: 400;
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
* 资源图标
*/
.icon {
  margin-right: 5px;
  margin-top: 2px;
  width: 16px;
  height: 16px;
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

