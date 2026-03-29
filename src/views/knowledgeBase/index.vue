<template>
  <div class="knowledge-base-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-btn" circle icon="el-icon-back" @click="goBack" />
        <div class="title-wrap">
          <h1 class="page-title">知识库管理</h1>
          <div class="page-subtitle">统一沉淀 · 快速检索 · 结构化维护</div>
        </div>
      </div>
      <div class="header-right">
        <el-button type="primary" icon="el-icon-plus" @click="openAddModal">新增知识</el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-filter card">
      <el-form class="search-form" :inline="true" @submit.native.prevent>
        <el-form-item class="search-item keyword">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索标题 / 内容"
            prefix-icon="el-icon-search"
            clearable
            @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item class="search-item category">
          <el-select
            v-model="categoryFilter"
            placeholder="按分类筛选"
            clearable
            @change="handleSearch"
          >
            <el-option label="技术文档" value="tech" />
            <el-option label="操作指南" value="guide" />
            <el-option label="常见问题" value="faq" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <div class="search-actions">
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="resetSearch">重置</el-button>
        </div>
      </el-form>
      <div class="search-meta">
        <div class="meta-left">
          <span class="meta-count">共 {{ filteredKnowledge.length }} 条</span>
          <span v-if="searchKeyword || categoryFilter" class="meta-split">·</span>
          <span v-if="searchKeyword" class="meta-chip">关键词：{{ searchKeyword }}</span>
          <span v-if="categoryFilter" class="meta-chip">分类：{{ getCategoryName(categoryFilter) }}</span>
        </div>
      </div>
    </div>

    <!-- 知识库列表 -->
    <div class="knowledge-list card">
      <el-table
        v-if="filteredKnowledge.length"
        :data="paginatedData"
        style="width: 100%"
        stripe
        :header-cell-style="{ background: '#f7f9fc', color: '#303133', fontWeight: 600 }"
      >
        <el-table-column prop="title" label="标题" min-width="200">
          <template slot-scope="scope">
            <a href="#" class="knowledge-title" @click.prevent="viewKnowledge(scope.row)">
              {{ scope.row.title }}
            </a>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="260">
          <template slot-scope="scope">
            <el-tag :type="getCategoryType(scope.row.category)">
              {{ getCategoryName(scope.row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" width="360">
          <template slot-scope="scope">
            <el-tag
              v-for="(tag, index) in scope.row.tags"
              :key="index"
              size="small"
              class="tag-item"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="上传人" width="200" />
        <el-table-column prop="createTime" label="创建时间" width="200" />
        <el-table-column prop="updateTime" label="更新时间" width="200" />
        <el-table-column label="操作" width="260" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="text" class="action-link primary" @click="editKnowledge(scope.row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button size="mini" type="text" class="action-link danger" @click="deleteKnowledge(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-else class="empty-wrap">
        <el-empty description="暂无知识内容">
          <el-button type="primary" icon="el-icon-plus" @click="openAddModal">新增第一条知识</el-button>
        </el-empty>
      </div>

      <!-- 分页 -->
      <div v-if="filteredKnowledge.length" class="pagination">
        <el-pagination
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredKnowledge.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑知识模态框 -->
    <el-dialog
      :title="isEditing ? '编辑知识' : '新增知识'"
      :visible.sync="modalVisible"
      width="700px"
      class="knowledge-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        class="knowledge-form"
      >
        <!-- 标题 -->
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入知识标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <!-- 分类和状态 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
                <el-option label="技术文档" value="tech" />
                <el-option label="操作指南" value="guide" />
                <el-option label="常见问题" value="faq" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-switch
                v-model="formData.status"
                active-text="启用"
                inactive-text="禁用"
                active-color="#13ce66"
                inactive-color="#ff4949"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 标签 -->
        <el-form-item label="标签" prop="tags">
          <div class="tag-input-container">
            <el-tag
              v-for="(tag, index) in formData.tags"
              :key="index"
              closable
              :disable-transitions="false"
              class="tag-item"
              @close="removeTag(index)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              ref="tagInput"
              v-model="newTag"
              placeholder="输入标签，按回车添加"
              class="tag-input"
              size="small"
              @keyup.enter.native="addTag"
              @blur="addTag"
            />
          </div>
        </el-form-item>

        <!-- 内容 -->
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="6"
            placeholder="请输入知识内容"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>

        <!-- 文件上传 -->
        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            multiple
          >
            <i class="el-icon-upload" />
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击上传</em>
            </div>
            <div slot="tip" class="el-upload__tip">
              支持上传 PDF、Word、Excel、PowerPoint、图片等格式，单个文件不超过 10MB
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="modalVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="saveKnowledge">
          确 定
        </el-button>
      </span>
    </el-dialog>

    <!-- 查看知识详情模态框 -->
    <el-dialog
      title="知识详情"
      :visible.sync="detailVisible"
      width="700px"
      class="knowledge-dialog detail-dialog"
      :close-on-click-modal="false"
    >
      <div class="knowledge-detail">
        <h2>{{ selectedKnowledge.title }}</h2>
        <div class="detail-meta">
          <span class="meta-item">
            <i class="el-icon-user" /> {{ selectedKnowledge.author }}
          </span>
          <span class="meta-item">
            <i class="el-icon-time" /> {{ selectedKnowledge.createTime }}
          </span>
          <span class="meta-item">
            <i class="el-icon-view" /> {{ selectedKnowledge.viewCount || 0 }} 次浏览
          </span>
        </div>
        <div class="detail-category">
          <el-tag :type="getCategoryType(selectedKnowledge.category)" size="medium">
            {{ getCategoryName(selectedKnowledge.category) }}
          </el-tag>
          <el-tag :type="selectedKnowledge.status ? 'success' : 'danger'" size="medium" style="margin-left: 8px;">
            {{ selectedKnowledge.status ? '已启用' : '已禁用' }}
          </el-tag>
        </div>
        <div v-if="selectedKnowledge.tags && selectedKnowledge.tags.length" class="detail-tags">
          <span class="label">标签：</span>
          <el-tag
            v-for="(tag, index) in selectedKnowledge.tags"
            :key="index"
            size="small"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
        <div class="detail-content" v-html="selectedKnowledge.content" />

        <!-- 附件列表 -->
        <div v-if="selectedKnowledge.attachments && selectedKnowledge.attachments.length" class="detail-attachments">
          <h4>附件</h4>
          <ul class="attachment-list">
            <li v-for="(file, index) in selectedKnowledge.attachments" :key="index">
              <i class="el-icon-document" />
              <span>{{ file.name }}</span>
            </li>
          </ul>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">关 闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'KnowledgeBase',
  data() {
    return {
      // 搜索和筛选
      searchKeyword: '',
      categoryFilter: '',
      currentPage: 1,
      pageSize: 10,

      // 模态框
      modalVisible: false,
      detailVisible: false,
      isEditing: false,
      saving: false,

      // 表单数据
      formData: {
        title: '',
        category: '',
        tags: [],
        content: '',
        status: true,
        attachments: []
      },
      // 新标签输入
      newTag: '',
      // 文件列表
      fileList: [],

      // 表单验证规则
      formRules: {
        title: [
          { required: true, message: '请输入标题', trigger: 'blur' },
          { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
        ],
        category: [
          { required: true, message: '请选择分类', trigger: 'change' }
        ],
        content: [
          { required: true, message: '请输入内容', trigger: 'blur' }
        ]
      },

      // 选中的知识
      selectedKnowledge: {},

      // 知识库数据
      knowledgeList: [
        // ... 保持原有数据不变
      ]
    }
  },
  computed: {
    // 过滤后的知识库数据
    filteredKnowledge() {
      let result = [...this.knowledgeList]

      // 按关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        result = result.filter(item => {
          const titleMatch = item.title && typeof item.title === 'string' && item.title.toLowerCase().includes(keyword)
          const contentMatch = item.content && typeof item.content === 'string' && item.content.toLowerCase().includes(keyword)
          return titleMatch || contentMatch
        })
      }

      // 按分类筛选
      if (this.categoryFilter) {
        result = result.filter(item => item.category === this.categoryFilter)
      }

      return result
    },
    // 分页后的数据
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredKnowledge.slice(start, end)
    }
  },
  methods: {
    // 返回上一页
    goBack() {
      this.$router.back()
    },

    // 搜索
    handleSearch() {
      this.currentPage = 1
    },

    // 重置搜索
    resetSearch() {
      this.searchKeyword = ''
      this.categoryFilter = ''
      this.currentPage = 1
    },

    // 分页大小变化
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },

    // 当前页码变化
    handleCurrentChange(current) {
      this.currentPage = current
    },

    // 获取分类类型
    getCategoryType(category) {
      const typeMap = {
        tech: 'primary',
        guide: 'success',
        faq: 'warning',
        other: 'info'
      }
      return typeMap[category] || 'info'
    },

    // 获取分类名称
    getCategoryName(category) {
      const nameMap = {
        tech: '技术文档',
        guide: '操作指南',
        faq: '常见问题',
        other: '其他'
      }
      return nameMap[category] || '其他'
    },

    // 打开新增模态框
    openAddModal() {
      this.isEditing = false
      this.formData = {
        title: '',
        category: '',
        tags: [],
        content: '',
        status: true,
        attachments: []
      }
      this.newTag = ''
      this.fileList = []
      this.modalVisible = true
      // 下一个 tick 聚焦标题输入框
      this.$nextTick(() => {
        const titleInput = this.$refs.formRef.$el.querySelector('input')
        if (titleInput) titleInput.focus()
      })
    },

    // 编辑知识
    editKnowledge(knowledge) {
      this.isEditing = true
      this.formData = { ...knowledge }
      this.fileList = knowledge.attachments || []
      this.modalVisible = true
    },

    // 查看知识详情
    viewKnowledge(knowledge) {
      this.selectedKnowledge = { ...knowledge }
      // 增加浏览量
      const index = this.knowledgeList.findIndex(item => item.id === knowledge.id)
      if (index !== -1) {
        this.knowledgeList[index].viewCount = (this.knowledgeList[index].viewCount || 0) + 1
        this.selectedKnowledge.viewCount = this.knowledgeList[index].viewCount
      }
      this.detailVisible = true
    },

    // 删除知识
    deleteKnowledge(id) {
      this.$confirm('确定要删除这条知识吗？删除后无法恢复！', '警告', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.knowledgeList.findIndex(item => item.id === id)
        if (index !== -1) {
          this.knowledgeList.splice(index, 1)
          this.$message({
            type: 'success',
            message: '删除成功！',
            duration: 2000
          })
        }
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除',
          duration: 2000
        })
      })
    },

    // 添加标签 - 修复版
    addTag() {
      const tag = this.newTag && this.newTag.trim()
      if (tag) {
        // 检查是否已存在相同标签（不区分大小写）
        const exists = this.formData.tags.some(
          t => t.toLowerCase() === tag.toLowerCase()
        )

        if (!exists) {
          // 直接修改原数组
          this.formData.tags.push(tag)
          this.newTag = ''

          // 显示成功提示（可选）
          this.$message({
            type: 'success',
            message: '标签添加成功',
            duration: 1000
          })
        } else {
          this.$message({
            type: 'warning',
            message: '标签已存在',
            duration: 1500
          })
          this.newTag = '' // 清空输入
        }
      }
    },

    // 移除标签
    removeTag(index) {
      this.formData.tags.splice(index, 1)
    },

    // 处理文件变化
    handleFileChange(file, fileList) {
      this.fileList = fileList
      // 将文件信息保存到 attachments
      this.formData.attachments = fileList.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.url
      }))
    },

    // 处理文件移除
    handleFileRemove(file, fileList) {
      this.fileList = fileList
      this.formData.attachments = fileList.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.url
      }))
    },

    // 保存知识
    saveKnowledge() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          this.saving = true

          // 模拟保存延迟
          setTimeout(() => {
            if (this.isEditing) {
              // 编辑现有知识
              const index = this.knowledgeList.findIndex(item => item.id === this.formData.id)
              if (index !== -1) {
                this.knowledgeList[index] = {
                  ...this.formData,
                  updateTime: new Date().toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  })
                }
                this.$message.success('更新成功')
              }
            } else {
              // 新增知识
              const newKnowledge = {
                ...this.formData,
                id: Date.now(),
                author: '当前用户', // 可从用户信息中获取
                createTime: new Date().toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }),
                updateTime: new Date().toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }),
                viewCount: 0
              }
              this.knowledgeList.unshift(newKnowledge)
              this.$message.success('新增成功')
            }

            // 重置状态
            this.saving = false
            this.fileList = []
            this.newTag = ''
            this.modalVisible = false
          }, 500)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.knowledge-base-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #f6f8fc 0%, #f2f6fb 100%);
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  box-shadow: $shadow;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  box-shadow: 0 8px 18px rgba(24, 144, 255, 0.12);
}

.title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0;
}

.page-subtitle {
  font-size: 12px;
  color: #7a879a;
}

/* 搜索和筛选 */
.search-filter {
  margin-bottom: 24px;
  padding: 16px 16px 12px;
}

.card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 10px;
  box-shadow: $shadow;
  border: 1px solid rgba(228, 231, 237, 0.85);
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  .search-item {
    margin-bottom: 0;
  }

  .keyword {
    width: 360px;
    max-width: 52vw;
  }

  .category {
    width: 180px;
  }
}

.search-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 10px;
  align-items: center;
}

.search-meta {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #7a879a;
  font-size: 12px;
}

.meta-left {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.meta-count {
  color: #384252;
  font-weight: 600;
}

.meta-split {
  opacity: 0.7;
}

.meta-chip {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(24, 144, 255, 0.08);
  color: #2f6fde;
  border: 1px solid rgba(24, 144, 255, 0.14);
}

/* 知识库列表 */
.knowledge-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.el-table {
  flex: 1;
}

.empty-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.knowledge-title {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.knowledge-title:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 4px;
}

/* 弹窗样式优化 */
.knowledge-dialog ::v-deep .el-dialog__header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  padding: 20px 24px;
  border-radius: 8px 8px 0 0;
}

.knowledge-dialog ::v-deep .el-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.knowledge-dialog ::v-deep .el-dialog__body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.knowledge-dialog ::v-deep .el-dialog__footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #e4e7ed;
  background-color: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

/* 表单样式 */
.knowledge-form {
  padding: 8px 0;
}

.knowledge-form ::v-deep .el-form-item {
  margin-bottom: 22px;
}

.knowledge-form ::v-deep .el-form-item__label {
  font-weight: 500;
  color: #606266;
  padding-right: 12px;
}

.knowledge-form ::v-deep .el-input__inner {
  border-radius: 6px;
}

.knowledge-form ::v-deep .el-textarea__inner {
  border-radius: 6px;
  font-family: inherit;
}

/* 标签输入容器 */
.tag-input-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  min-height: 42px;
  background-color: #fff;
  transition: border-color 0.2s;
}

.tag-input-container:focus-within {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.tag-input {
  width: 120px;
  border: none;
  padding: 0;
}

.tag-input ::v-deep .el-input__inner {
  border: none;
  padding: 0;
  height: 28px;
  line-height: 28px;
  box-shadow: none !important;
}

.tag-input ::v-deep .el-input__inner:focus {
  box-shadow: none;
}

/* 上传组件样式 */
.upload-demo ::v-deep .el-upload-dragger {
  width: 100%;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.3s;
}

.upload-demo ::v-deep .el-upload-dragger:hover {
  border-color: #409eff;
  background-color: #f0f7ff;
}

.upload-demo ::v-deep .el-upload-dragger .el-icon-upload {
  font-size: 48px;
  color: #909399;
  margin-bottom: 8px;
}

.upload-demo ::v-deep .el-upload__tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

/* 知识详情样式 */
.knowledge-detail {
  padding: 8px 0;
}

.knowledge-detail h2 {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px;
  line-height: 1.4;
}

.detail-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #e4e7ed;
  font-size: 14px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-item i {
  font-size: 16px;
}

.detail-category {
  margin-bottom: 16px;
}

.detail-tags {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-tags .label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.detail-content {
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
  line-height: 1.8;
  color: #303133;
}

.detail-content ::v-deep h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 12px;
  color: #303133;
}

.detail-content ::v-deep h3:first-child {
  margin-top: 0;
}

.detail-content ::v-deep h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 20px 0 10px;
  color: #606266;
}

.detail-content ::v-deep p {
  margin: 0 0 12px;
}

.detail-content ::v-deep ul,
.detail-content ::v-deep ol {
  margin: 8px 0 16px;
  padding-left: 24px;
}

.detail-content ::v-deep li {
  margin: 4px 0;
}

.detail-attachments {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.detail-attachments h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.attachment-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.attachment-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.attachment-list li i {
  color: #409eff;
  font-size: 16px;
}

/* 分页 */
.pagination {
  padding: 20px;
  border-top: 1px solid rgba(224, 224, 224, 0.8);
  display: flex;
  justify-content: flex-end;
}

.action-link {
  font-weight: 600;
  padding: 0;
}

.action-link.primary {
  color: #2f6fde;
}

.action-link.danger {
  color: #e64a4a;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .knowledge-base-container {
    padding: 16px;
  }

  .search-filter {
    flex-wrap: wrap;
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-right {
    width: 100%;
  }

  .el-button {
    width: 100%;
  }

  .search-filter {
    flex-direction: column;
    align-items: stretch;
  }

  .el-input,
  .el-select {
    width: 100% !important;
    margin-left: 0 !important;
  }

  .el-table {
    font-size: 12px;
  }

  .knowledge-dialog {
    width: 95% !important;
    margin: 0 auto;
  }
}
</style>
