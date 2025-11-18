<template>
  <el-dialog
    :visible.sync="visible"
    :center="true"
    :title="title"
    :width="width + 'px'"
    :height="height + 'px'"
    :before-close="handleClose"
  >
    <div :style="{ height: height + 'px' }">
      <div class="upload-wrap">
        <el-upload
          ref="upload"
          class="upload-demo"
          drag
          action=""
          :show-file-list="false"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-progress="null"
          :on-success="handleSuccess"
          multiple
        >
          <i class="el-icon-upload" />
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <div slot="tip" class="el-upload__tip">
            {{ prompt }}
          </div>
        </el-upload>
        <slot name="content" />
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { upload } from '@/api/database/resource/resource.js'

export default {
  name: 'UploadDialog',
  props: {
    title: {
      type: String,
      default: '文件上传'
    },
    prompt: {
      type: String,
      default: '提示:'
    },
    visible: {
      type: Boolean,
      default: false
    },
    width: {
      type: Number,
      default: 460
    },
    height: {
      type: Number,
      default: 320
    },
    dbId: {
      type: Number,
      default: 0
    },
    currentPath: {
      type: String,
      default: '/'
    },
    maxFileSizeMB: {
      type: Number,
      default: 900
    }
  },
  data() {
    return {
      formData: null,
      progress: 0,
      loadingInstance: null
    }
  },
  methods: {
    /**
     * 关闭对话框
     */
    handleClose() {
      this.$emit('close')
    },

    /**
     * 处理文件选择变化
     * @param {File} file - 选择的文件
     */
    async handleFileChange(file) {
      // 验证文件大小
      const isSizeValid = file.size / 1024 / 1024 <= this.maxFileSizeMB
      if (!isSizeValid) {
        this.$message.error(`文件大小不能超过${this.maxFileSizeMB}MB`)
        return false
      }

      this.loadingInstance = this.$loading({
        lock: true,
        text: `正在上传文件 (${this.progress}%)`,
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.5)'
      })

      try {
        const formData = new FormData()
        formData.append('files', file.raw)
        formData.append('dbId', this.dbId)
        formData.append('path', this.currentPath)

        // 设置30秒超时
        var timeout = 3 * 10 * 1000
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const res = await upload(formData, (progressEvent) => {
          if (progressEvent.lengthComputable) {
            this.progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
            this.loadingInstance.setText(`正在上传文件 (${this.progress}%)`)
          }
        }, controller.signal, timeout)

        // 清除超时定时器
        clearTimeout(timeoutId)

        const { data } = res
        if (data.code === '999999') {
          this.$message.warning(data.message)
        } else {
          this.$message.success(data.data)
          this.$emit('success', true)
          this.handleClose()
        }
      } catch (error) {
        console.error(error)
        this.$message.error(
          error.name === 'AbortError'
            ? '文件上传超时，后台断点续传中...'
            : '文件上传异常！'
        )
        console.error('上传错误:', error)
      } finally {
        this.loadingInstance?.close()
        this.$emit('back') // 触发返回事件
      }
    },

    /**
     * 上传成功处理
     * @param {Object} response - 响应数据
     */
    handleSuccess(response) {
      this.$message.success('文件上传成功')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.upload-wrap {
  padding: 20px;

  ::v-deep .el-upload {
    width: 100%;

    .el-upload-dragger {
      width: 100%;
      padding: 20px;
    }
  }

  .el-upload__tip {
    margin-top: 10px;
    color: #999;
    font-size: 12px;
    text-align: center;
  }
}

.upload-btn {
  width: 260px;
  background-color: $light-blue;
  padding: 8px;
  color: #fff;
  border-radius: 3px;
  text-align: center;
  margin: 10px auto;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: mix($light-blue, #000, 85%);
  }
}

::v-deep .el-dialog {
  border-radius: 7px !important;
  z-index: 99999;

  .el-dialog__header {
    border-top-left-radius: 7px !important;
    border-top-right-radius: 7px !important;
    background-color: $headerTxtHover;

    .el-dialog__title,
    .el-dialog__headerbtn .el-dialog__close {
      color: #fff;
    }

    .el-dialog__headerbtn .el-dialog__close:hover {
      font-weight: bold;
    }
  }
}
</style>
