<template>
  <div class="avatar-base64-upload">
    <div class="avatar-base64-upload__main">
      <div
        class="avatar-base64-upload__preview"
        :class="{ 'is-empty': !previewSrc }"
      >
        <img v-if="previewSrc" :src="previewSrc" alt="头像预览">
        <div v-else class="avatar-base64-upload__placeholder">
          <i class="el-icon-plus" />
          <span>上传头像</span>
        </div>
        <div v-if="previewSrc" class="avatar-base64-upload__mask">
          <span @click.stop="clear">移除</span>
        </div>
      </div>
      <div class="avatar-base64-upload__actions">
        <el-upload
          class="avatar-base64-upload__uploader"
          action="#"
          :show-file-list="false"
          accept="image/*"
          :before-upload="handleBeforeUpload"
        >
          <el-button size="small" type="primary" plain icon="el-icon-upload2">
            选择图片
          </el-button>
        </el-upload>
        <p class="avatar-base64-upload__tip">
          支持 JPG/PNG/GIF/WebP 等，≤ {{ maxSizeMb }}MB；将转为 Base64（Data URL）写入头像字段
        </p>
        <el-button
          v-if="value"
          type="text"
          size="small"
          class="avatar-base64-upload__clear"
          @click="clear"
        >
          清空头像
        </el-button>
      </div>
    </div>
    <el-collapse v-model="collapse" class="avatar-base64-upload__collapse">
      <el-collapse-item title="手动粘贴 Base64 / 图片地址（可选）" name="manual">
        <el-input
          :value="value"
          type="textarea"
          :rows="3"
          placeholder="可粘贴 data:image/...;base64,... 或 http(s) 图片地址"
          @input="onManualInput"
        />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script>
import Message from '@/utils/compatible-message'

export default {
  name: 'AvatarBase64Upload',
  props: {
    value: {
      type: String,
      default: ''
    },
    maxSizeMb: {
      type: Number,
      default: 2
    },
    maxBase64Length: {
      type: Number,
      default: 800000
    }
  },
  data() {
    return {
      collapse: []
    }
  },
  computed: {
    previewSrc() {
      const v = this.value
      if (!v || !String(v).trim()) return ''
      const s = String(v).trim()
      if (s.startsWith('data:image')) return s
      if (/^https?:\/\//i.test(s)) return s
      return ''
    }
  },
  methods: {
    onManualInput(val) {
      this.$emit('input', val == null ? '' : String(val))
    },

    clear() {
      this.$emit('input', '')
    },

    handleBeforeUpload(file) {
      const isImage = file.type && file.type.startsWith('image/')
      if (!isImage) {
        Message.warning('请选择图片文件')
        return false
      }
      const maxBytes = this.maxSizeMb * 1024 * 1024
      if (file.size > maxBytes) {
        Message.warning(`图片大小不能超过 ${this.maxSizeMb}MB`)
        return false
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target && e.target.result
        if (typeof result !== 'string') {
          Message.error('图片读取失败')
          return
        }
        if (result.length > this.maxBase64Length) {
          Message.warning('转换后数据过长，请压缩图片或换用小图后再试')
          return
        }
        this.$emit('input', result)
        Message.success('已转为 Base64 并写入头像')
      }
      reader.onerror = () => {
        Message.error('图片读取失败')
      }
      reader.readAsDataURL(file)
      return false
    }
  }
}
</script>

<style scoped lang="scss">
.avatar-base64-upload {
  width: 100%;
}

.avatar-base64-upload__main {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.avatar-base64-upload__preview {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px dashed #dcdfe6;
  background: #fafafa;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &.is-empty {
    cursor: pointer;
  }

  &:hover .avatar-base64-upload__mask {
    opacity: 1;
  }
}

.avatar-base64-upload__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
  font-size: 12px;
  gap: 4px;

  i {
    font-size: 22px;
  }
}

.avatar-base64-upload__mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;

  span {
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.6);

    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  }
}

.avatar-base64-upload__actions {
  flex: 1;
  min-width: 200px;
}

.avatar-base64-upload__uploader {
  display: inline-block;
}

.avatar-base64-upload__tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.avatar-base64-upload__clear {
  padding-left: 0;
  margin-top: 4px;
}

.avatar-base64-upload__collapse {
  margin-top: 12px;
  border: none;

  ::v-deep .el-collapse-item__header {
    font-size: 12px;
    color: #909399;
    height: 36px;
    line-height: 36px;
    border: none;
    background: transparent;
  }

  ::v-deep .el-collapse-item__wrap {
    border: none;
    background: transparent;
  }

  ::v-deep .el-collapse-item__content {
    padding-bottom: 0;
  }
}
</style>
