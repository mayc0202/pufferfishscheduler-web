<template>
  <el-dialog
    :visible.sync="visible"
    :center="true"
    :title="title"
    :width="width + 'px'"
    :height="height + 'px'"
    :before-close="handleBeforeClose"
    :close-on-click-modal="!uploading"
    :close-on-press-escape="!uploading"
    :show-close="!uploading"
  >
    <div
      ref="uploadPanel"
      :style="{ height: height + 'px', position: 'relative' }"
      class="resource-upload-panel"
    >
      <div class="upload-wrap">
        <el-upload
          ref="upload"
          class="upload-demo"
          drag
          action=""
          :show-file-list="false"
          :auto-upload="false"
          :disabled="uploading"
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

/** 与 api 层上传超时一致（毫秒） */
const UPLOAD_TIMEOUT_MS = 2 * 60 * 1000

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
      uploading: false,
      uploadLoadingText: '正在上传文件...',
      panelLoadingInstance: null
    }
  },
  beforeDestroy() {
    if (this.panelLoadingInstance) {
      this.panelLoadingInstance.close()
      this.panelLoadingInstance = null
    }
  },
  methods: {
    /**
     * 弹窗关闭前（含右上角 X）：上传中禁止关闭，避免遮罩残留
     */
    handleBeforeClose(done) {
      if (this.uploading) {
        this.$message.warning('文件上传中，请稍候')
        return
      }
      this.$emit('close')
      if (typeof done === 'function') {
        done()
      }
    },

    /**
     * 处理文件选择变化
     * @param {File} file - 选择的文件
     */
    async handleFileChange(file) {
      if (this.uploading) {
        return false
      }

      // 验证文件大小
      const isSizeValid = file.size / 1024 / 1024 <= this.maxFileSizeMB
      if (!isSizeValid) {
        this.$message.error(`文件大小不能超过${this.maxFileSizeMB}MB`)
        return false
      }

      let timeoutId = null
      this.uploading = true
      this.progress = 0
      this.uploadLoadingText = '正在传到服务器 (0%)'

      try {
        await this.$nextTick()
        if (this.$refs.uploadPanel) {
          this.panelLoadingInstance = this.$loading({
            target: this.$refs.uploadPanel,
            lock: true,
            text: this.uploadLoadingText,
            spinner: 'el-icon-loading',
            background: 'rgba(255, 255, 255, 0.85)',
            customClass: 'resource-upload-panel-loading'
          })
        }

        const formData = new FormData()
        formData.append('files', file.raw)
        formData.append('dbId', this.dbId)
        formData.append('path', this.currentPath)

        const controller = new AbortController()
        timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)

        const setPanelLoadingText = (text) => {
          this.uploadLoadingText = text
          if (this.panelLoadingInstance) {
            this.panelLoadingInstance.setText(text)
          }
        }

        const res = await upload(formData, (progressEvent) => {
          const e = progressEvent
          // axios 进度只表示「浏览器 → 应用服务器」发完请求体；服务端写 FTP 等仍在进行，不能显示 100% 即结束
          if (!e.lengthComputable || !e.total) {
            setPanelLoadingText('正在上传文件，请稍候...')
            return
          }
          if (e.loaded >= e.total) {
            setPanelLoadingText('已传至服务器，正在写入存储（请稍候）...')
            return
          }
          const pct = Math.min(99, Math.round((e.loaded / e.total) * 100))
          this.progress = pct
          setPanelLoadingText(`正在传到服务器 (${pct}%)`)
        }, controller.signal, UPLOAD_TIMEOUT_MS)

        if (timeoutId != null) {
          clearTimeout(timeoutId)
          timeoutId = null
        }

        this.$message.success(res.data)
        this.$emit('success', true)
        this.$emit('close')
      } catch (error) {
        console.error(error)
        if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
          this.$message.warning('文件上传超时（2 分钟），请稍后重试或联系管理员')
        } else {
          this.$message.error('文件上传异常！')
        }
        console.error('上传错误:', error)
      } finally {
        if (timeoutId != null) {
          clearTimeout(timeoutId)
        }
        if (this.panelLoadingInstance) {
          this.panelLoadingInstance.close()
          this.panelLoadingInstance = null
        }
        this.uploading = false
        this.uploadLoadingText = '正在上传文件...'
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
      border-radius: 8px;
    }
  }

  .el-upload__tip {
    margin-top: 10px;
    color: #6a7486;
    font-size: 12px;
    text-align: center;
  }
}

.upload-btn {
  width: 260px;
  background-color: $light-blue;
  padding: 8px;
  color: #fff;
  border-radius: 6px;
  text-align: center;
  margin: 10px auto;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: mix($light-blue, #000, 85%);
  }
}

/* 面板内 Loading 盖住上传区与底部按钮（相对 resource-upload-panel 定位） */
::v-deep .resource-upload-panel-loading {
  z-index: 20;
}

::v-deep .el-dialog {
  border-radius: 12px !important;
  overflow: hidden;
  z-index: 99999;

  .el-dialog__header {
    background: #f8faff;
    border-bottom: 1px solid #e9eef8;
    padding: 16px 20px;

    .el-dialog__title {
      color: #1f3358;
      font-weight: 600;
      font-size: 16px;
    }

    .el-dialog__headerbtn .el-dialog__close {
      color: #6a7486;
    }

    .el-dialog__headerbtn .el-dialog__close:hover {
      color: #1f3358;
      font-weight: bold;
    }
  }

  .el-dialog__body {
    padding: 24px 24px 20px;
  }
}
</style>
