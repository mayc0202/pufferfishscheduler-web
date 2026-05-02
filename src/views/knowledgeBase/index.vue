<template>
  <div class="container knowledge-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <el-button
          v-if="showBackButton"
          class="back-btn"
          circle
          icon="el-icon-back"
          @click="goBack"
        />
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
            placeholder="搜索标题"
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
            <el-option
              v-for="c in categoryOptions"
              :key="c.id"
              :label="c.label"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <div class="search-actions">
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="resetSearch">重置</el-button>
        </div>
      </el-form>
      <div class="search-meta">
        <div class="meta-left">
          <span class="meta-count">共 {{ total }} 条</span>
          <span v-if="searchKeyword || (categoryFilter != null && categoryFilter !== '')" class="meta-split">·</span>
          <span v-if="searchKeyword" class="meta-chip">关键词：{{ searchKeyword }}</span>
          <span v-if="categoryFilter != null && categoryFilter !== ''" class="meta-chip">分类：{{ getCategoryName(categoryFilter) }}</span>
        </div>
      </div>
    </div>

    <!-- 知识库列表 -->
    <div v-loading="listLoading" class="knowledge-list card table-card">
      <el-table
        v-if="listRecords.length"
        class="knowledge-table"
        :data="listRecords"
        style="width: 100%"
        stripe
        row-key="id"
        :header-cell-style="{ background: '#f7f9fc', color: '#303133', fontWeight: 600 }"
      >
        <el-table-column prop="title" label="标题" min-width="220">
          <template slot-scope="scope">
            <a href="#" class="knowledge-title" @click.prevent="viewKnowledge(scope.row)">
              {{ scope.row.title }}
            </a>
          </template>
        </el-table-column>
        <el-table-column prop="categoryTxt" label="分类" width="200">
          <template slot-scope="scope">
            <el-tag :type="getCategoryTypeByTxt(scope.row.categoryTxt)">
              {{ scope.row.categoryTxt || '—' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" width="300">
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
        <el-table-column prop="createdBy" label="上传人" width="180" />
        <el-table-column prop="createdTimeTxt" label="创建时间" width="200" />
        <el-table-column prop="updatedTimeTxt" label="更新时间" width="200" />
        <el-table-column label="操作" width="260" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="text" class="action-link primary" @click="editKnowledge(scope.row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button size="mini" type="text" class="action-link danger" @click="deleteKnowledge(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-else-if="!listLoading" class="empty-wrap">
        <el-empty description="暂无知识内容">
          <el-button type="primary" icon="el-icon-plus" @click="openAddModal">新增第一条知识</el-button>
        </el-empty>
      </div>

      <!-- 分页 -->
      <div v-if="listRecords.length" class="pagination">
        <el-pagination
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑知识模态框 -->
    <el-dialog
      :title="isEditing ? '编辑知识' : '新增知识'"
      :visible.sync="modalVisible"
      width="760px"
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
            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="formData.categoryId" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="c in categoryOptions"
                  :key="c.id"
                  :label="c.label"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="enabled">
              <el-switch
                v-model="formData.enabled"
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

        <!-- 一问一答（写入向量库；可与附件并存） -->
        <el-form-item label="知识问答" prop="qaPairs" class="qa-form-item">
          <div class="qa-list-hint">
            <i class="el-icon-info" />
            可配置多组「问题 + 回答」；后台可将结构化问答写入向量库，附件仍单独解析入库。
          </div>
          <div
            v-for="(row, idx) in formData.qaPairs"
            :key="row._uid"
            class="qa-card"
          >
            <div class="qa-card-accent" aria-hidden="true" />
            <div class="qa-card-inner">
              <div class="qa-card-head">
                <span class="qa-card-title">问答 {{ idx + 1 }}</span>
                <el-button
                  type="text"
                  class="qa-remove-btn"
                  icon="el-icon-delete"
                  :disabled="formData.qaPairs.length <= 1"
                  @click="removeQaPair(idx)"
                >
                  删除
                </el-button>
              </div>
              <el-form-item
                :prop="`qaPairs.${idx}.question`"
                :rules="qaQuestionRules(idx)"
                label-width="0"
                class="qa-field-item qa-field-question"
              >
                <div class="qa-field-label">
                  问题
                </div>
                <el-input
                  v-model="row.question"
                  placeholder="请输入问题"
                  maxlength="500"
                  show-word-limit
                  @input="touchQaValidation"
                />
              </el-form-item>
              <el-form-item
                :prop="`qaPairs.${idx}.answer`"
                :rules="qaAnswerRules(idx)"
                label-width="0"
                class="qa-field-item qa-field-answer"
              >
                <div class="qa-field-label">
                  回答
                </div>
                <el-input
                  v-model="row.answer"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入回答"
                  maxlength="5000"
                  show-word-limit
                  @input="touchQaValidation"
                />
              </el-form-item>
            </div>
          </div>
          <el-button type="primary" plain icon="el-icon-plus" size="small" class="qa-add-btn" @click="addQaPair">
            添加一组问答
          </el-button>
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

    <!-- 查看知识详情模态框（单独加大上边距，避免贴顶） -->
    <el-dialog
      title="知识详情"
      :visible.sync="detailVisible"
      width="700px"
      class="knowledge-dialog detail-dialog"
      :close-on-click-modal="false"
    >
      <div v-loading="detailLoading" class="knowledge-detail">
        <div class="detail-title-row">
          <h2 class="detail-title-text">
            {{ selectedKnowledge.title }}
          </h2>
          <el-tag
            :type="selectedKnowledge.enabled ? 'success' : 'danger'"
            size="small"
            class="detail-status-tag"
            effect="plain"
          >
            {{ selectedKnowledge.enabled ? '已启用' : '已禁用' }}
          </el-tag>
        </div>
        <div class="detail-meta">
          <span class="meta-item">
            <i class="el-icon-user" /> {{ selectedKnowledge.author }}
          </span>
          <span class="meta-item">
            <i class="el-icon-time" /> {{ selectedKnowledge.createTime }}
          </span>
        </div>
        <div class="detail-category">
          <span class="detail-field-label">分类</span>
          <el-tag :type="getCategoryTypeByTxt(selectedKnowledge.categoryTxt)" size="small" effect="plain">
            {{ selectedKnowledge.categoryTxt || getCategoryName(selectedKnowledge.categoryId) }}
          </el-tag>
        </div>
        <div v-if="selectedKnowledge.tags && selectedKnowledge.tags.length" class="detail-tags">
          <span class="detail-field-label">标签</span>
          <el-tag
            v-for="(tag, index) in selectedKnowledge.tags"
            :key="index"
            size="small"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
        <div
          v-if="detailQaDisplayList.length"
          class="detail-qa-list"
        >
          <div
            v-for="(pair, idx) in detailQaDisplayList"
            :key="'qa-' + idx"
            class="detail-qa-block"
          >
            <div class="detail-qa-q">
              <span class="detail-qa-label">问</span>
              <div class="detail-qa-body">{{ pair.question || '—' }}</div>
            </div>
            <div class="detail-qa-a">
              <span class="detail-qa-label">答</span>
              <div class="detail-qa-body pre-wrap">{{ pair.answer || '—' }}</div>
            </div>
          </div>
        </div>
        <div v-else class="detail-content" v-html="selectedKnowledge.content" />

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
import {
  listKnowledge,
  getKnowledgeDetail,
  addKnowledge,
  updateKnowledgeJson,
  updateKnowledgeMultipart,
  deleteKnowledge as deleteKnowledgeApi
} from '@/api/agent/knowledgeBase'
import dictCode from '@/api/dict/dictCode.js'
import { getDict } from '@/api/dict/dict'

export default {
  name: 'KnowledgeBase',
  data() {
    return {
      /** 来自字典 knowledge_type：{ id, code, label }，id 提交为 categoryId */
      categoryOptions: [],
      searchKeyword: '',
      categoryFilter: null,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      listRecords: [],
      listLoading: false,
      detailLoading: false,

      modalVisible: false,
      detailVisible: false,
      isEditing: false,
      saving: false,

      formData: {
        id: null,
        title: '',
        categoryId: null,
        tags: [],
        /** 一问一答；每项含 _uid 供列表渲染 */
        qaPairs: [],
        enabled: true
      },
      qaUidSeq: 1,
      newTag: '',
      fileList: [],
      /** 打开编辑时详情里是否带附件（用于 JSON 更新时传 files:[] 清空） */
      editDetailHadAttachments: false,

      formRules: {
        title: [
          { required: true, message: '请输入标题', trigger: 'blur' },
          { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
        ],
        categoryId: [
          { required: true, message: '请选择分类', trigger: 'change' }
        ],
        qaPairs: [
          {
            validator: (rule, value, callback) => {
              const pairs = Array.isArray(value) ? value : []
              const hasComplete = pairs.some(
                p => (p && String(p.question || '').trim()) && (p && String(p.answer || '').trim())
              )
              const hasFiles =
                this.collectNewRawFiles().length > 0 || (this.fileList && this.fileList.length > 0)
              if (!hasComplete && !hasFiles) {
                callback(new Error('请至少填写一组完整的问题与回答，或上传附件'))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      },

      selectedKnowledge: {}
    }
  },
  computed: {
    /** 详情弹窗：仅展示非空问答行 */
    detailQaDisplayList() {
      const list = (this.selectedKnowledge && this.selectedKnowledge.qaPairs) || []
      if (!Array.isArray(list)) return []
      return list.filter(
        p => (p && String(p.question || '').trim()) || (p && String(p.answer || '').trim())
      )
    },
    /** 仅从 agent-assistant 会话页带 query 跳转过来时展示，侧边栏进入不展示 */
    showBackButton() {
      return this.$route.query.from === 'agent-assistant'
    }
  },
  mounted() {
    this.fetchKnowledgeTypeDict()
    this.fetchList()
  },
  methods: {
    nextQaUid() {
      this.qaUidSeq += 1
      return this.qaUidSeq
    },

    createEmptyQaRow() {
      return { _uid: this.nextQaUid(), question: '', answer: '' }
    },

    addQaPair() {
      this.formData.qaPairs.push(this.createEmptyQaRow())
      this.touchQaValidation()
    },

    removeQaPair(index) {
      if (this.formData.qaPairs.length <= 1) return
      this.formData.qaPairs.splice(index, 1)
      this.touchQaValidation()
    },

    touchQaValidation() {
      this.$nextTick(() => {
        if (this.$refs.formRef) this.$refs.formRef.validateField('qaPairs')
      })
    },

    qaQuestionRules(idx) {
      return [
        {
          validator: (rule, value, callback) => {
            const row = this.formData.qaPairs[idx]
            const q = value != null ? String(value).trim() : ''
            const a = row && String(row.answer || '').trim()
            if (!q && !a) return callback()
            if (!q && a) return callback(new Error('请填写问题'))
            return callback()
          },
          trigger: ['blur', 'change']
        }
      ]
    },

    qaAnswerRules(idx) {
      return [
        {
          validator: (rule, value, callback) => {
            const row = this.formData.qaPairs[idx]
            const a = value != null ? String(value).trim() : ''
            const q = row && String(row.question || '').trim()
            if (!q && !a) return callback()
            if (q && !a) return callback(new Error('请填写回答'))
            return callback()
          },
          trigger: ['blur', 'change']
        }
      ]
    },

    /** 从详情 DTO 解析问答列表（兼容仅 content 的旧数据） */
    parseQaPairsFromDetail(d) {
      if (!d || typeof d !== 'object') return []
      let raw = d.qaPairs
      if (typeof raw === 'string' && raw.trim()) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) raw = parsed
        } catch (e) {
          raw = null
        }
      }
      if (Array.isArray(raw) && raw.length) {
        return raw.map(item => ({
          question: item && item.question != null ? String(item.question) : '',
          answer: item && item.answer != null ? String(item.answer) : ''
        }))
      }
      const legacy = d.content != null ? String(d.content) : ''
      if (legacy.trim()) {
        return [{ question: '', answer: legacy }]
      }
      return []
    },

    /** 提交给后端的问答（无 _uid）；去掉问、答均为空的行 */
    qaPairsForApi() {
      return (this.formData.qaPairs || [])
        .map(({ question, answer }) => ({
          question: question != null ? String(question).trim() : '',
          answer: answer != null ? String(answer).trim() : ''
        }))
        .filter(p => p.question || p.answer)
    },

    /** 详情展示等：由问答拼成纯文本（仅前端使用，不再提交后端） */
    buildContentFromQaPairs(pairs) {
      const list = Array.isArray(pairs) ? pairs : []
      const blocks = list
        .filter(p => (p.question && p.question.trim()) || (p.answer && p.answer.trim()))
        .map(p => {
          const q = (p.question || '').trim()
          const a = (p.answer || '').trim()
          return `【问】${q}\n【答】${a}`
        })
      return blocks.join('\n\n---\n\n')
    },

    goBack() {
      this.$router.back()
    },

    /**
     * 知识分类字典（dictCode = knowledge_type）
     * 字典项常见字段：code、value（展示）；与项目其它页 getDict 约定一致
     */
    async fetchKnowledgeTypeDict() {
      try {
        const res = await getDict(dictCode.KNOWLEDGE_TYPE)
        const items = Array.isArray(res && res.data) ? res.data : []
        this.categoryOptions = items.map((item) => {
          const codeRaw = item && (item.code != null ? item.code : item.id)
          const labelRaw =
            item &&
            (item.value != null ? item.value : item.label != null ? item.label : item.name)
          const codeStr = codeRaw != null ? String(codeRaw) : ''
          const idNum = Number(codeRaw)
          const id = Number.isFinite(idNum) && !Number.isNaN(idNum) ? idNum : codeStr
          return {
            id,
            code: codeStr,
            label: labelRaw != null ? String(labelRaw) : codeStr
          }
        })
      } catch (e) {
        this.categoryOptions = []
        this.$message.warning('知识分类字典加载失败，请确认已配置字典 knowledge_type')
      }
    },

    parseTags(raw) {
      if (Array.isArray(raw)) return raw.map(t => String(t)).filter(Boolean)
      if (raw == null || raw === '') return []
      if (typeof raw === 'string') {
        return raw.split(/[,，]/).map(s => s.trim()).filter(Boolean)
      }
      return []
    },

    normalizeAttachments(detail) {
      const raw = detail && (detail.attachments || detail.files || detail.fileList || [])
      if (!Array.isArray(raw)) return []
      return raw.map((a, i) => {
        const name = (a && (a.fileName || a.name || a.originalFilename)) || `附件${i + 1}`
        const url = a && (a.url || a.fileUrl || a.downloadUrl)
        return { name, url, uid: `srv-${i}-${name}` }
      })
    },

    mapDetailToView(d) {
      if (!d || typeof d !== 'object') return {}
      const categoryId = d.categoryId != null ? Number(d.categoryId) : null
      const attachments = this.normalizeAttachments(d)
      const qaPairs = this.parseQaPairsFromDetail(d)
      const legacyContent = d.content != null ? String(d.content) : ''
      return {
        id:
          d.id != null && d.id !== ''
            ? String(d.id)
            : (d.documentId != null && d.documentId !== '' ? String(d.documentId) : ''),
        categoryTxt: d.categoryTxt != null ? String(d.categoryTxt) : '',
        title: d.title || '',
        content: qaPairs.length ? this.buildContentFromQaPairs(qaPairs) : legacyContent,
        qaPairs,
        categoryId,
        tags: this.parseTags(d.tags),
        author:
          d.createdBy ||
          d.author ||
          d.createUser ||
          d.createBy ||
          d.uploader ||
          this.$store.getters.name ||
          '—',
        createTime:
          d.createdTimeTxt != null && d.createdTimeTxt !== ''
            ? String(d.createdTimeTxt)
            : (d.createTime != null ? String(d.createTime) : '—'),
        updateTime:
          d.updatedTimeTxt != null && d.updatedTimeTxt !== ''
            ? String(d.updatedTimeTxt)
            : (d.updateTime != null ? String(d.updateTime) : '—'),
        enabled: (() => {
          const v = d.enabled !== undefined && d.enabled !== null ? d.enabled : d.status
          if (v === undefined || v === null) return true
          return Boolean(v === true || v === 1 || v === '1')
        })(),
        attachments
      }
    },

    mapListRow(item) {
      if (!item || typeof item !== 'object') return {}
      const id =
        item.id != null && item.id !== ''
          ? String(item.id)
          : (item.documentId != null && item.documentId !== '' ? String(item.documentId) : '')
      const categoryId = item.categoryId != null ? Number(item.categoryId) : null
      const categoryTxt = item.categoryTxt != null ? String(item.categoryTxt) : ''
      const createdBy = item.createdBy != null && item.createdBy !== '' ? String(item.createdBy) : '—'
      const createdTimeTxt =
        item.createdTimeTxt != null && item.createdTimeTxt !== ''
          ? String(item.createdTimeTxt)
          : (item.createdTime != null ? String(item.createdTime) : '—')
      const updatedTimeTxt =
        item.updatedTimeTxt != null && item.updatedTimeTxt !== ''
          ? String(item.updatedTimeTxt)
          : (item.updatedTime != null ? String(item.updatedTime) : '—')
      return {
        id,
        title: item.title || '',
        categoryId,
        categoryTxt,
        tags: this.parseTags(item.tags),
        createdBy,
        createdTimeTxt,
        updatedTimeTxt
      }
    },

    async fetchList() {
      this.listLoading = true
      try {
        const params = {
          pageNo: this.currentPage,
          pageSize: this.pageSize
        }
        const kw = (this.searchKeyword || '').trim()
        if (kw) {
          params.title = kw
        }
        if (this.categoryFilter != null && this.categoryFilter !== '') {
          params.categoryId = this.categoryFilter
        }
        const res = await listKnowledge(params)
        const body = (res && res.data) || {}
        this.total = Number(body.total) || 0
        this.currentPage = body.current != null ? Number(body.current) : this.currentPage
        this.pageSize = body.size != null ? Number(body.size) : this.pageSize
        const records = Array.isArray(body.records) ? body.records : []
        this.listRecords = records.map(r => this.mapListRow(r))
      } catch (e) {
        this.listRecords = []
        this.total = 0
        this.$message.error('获取知识列表失败')
      } finally {
        this.listLoading = false
      }
    },

    handleSearch() {
      this.currentPage = 1
      this.fetchList()
    },

    resetSearch() {
      this.searchKeyword = ''
      this.categoryFilter = null
      this.currentPage = 1
      this.fetchList()
    },

    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.fetchList()
    },

    handleCurrentChange(current) {
      this.currentPage = current
      this.fetchList()
    },

    categoryOptionMatch(categoryId) {
      if (categoryId == null || categoryId === '') return null
      const s = String(categoryId)
      const n = Number(categoryId)
      return this.categoryOptions.find(
        c =>
          String(c.code) === s ||
          String(c.id) === s ||
          (Number.isFinite(n) && !Number.isNaN(n) && Number(c.id) === n)
      )
    },

    getCategoryType(categoryId) {
      const types = ['primary', 'success', 'warning', 'info']
      const idx = this.categoryOptions.findIndex(
        c =>
          String(c.code) === String(categoryId) ||
          String(c.id) === String(categoryId) ||
          Number(c.id) === Number(categoryId)
      )
      if (idx < 0) return 'info'
      return types[idx % types.length]
    },

    /** 列表/详情：用 categoryTxt 与字典 label 匹配后取标签色 */
    getCategoryTypeByTxt(categoryTxt) {
      const t = String(categoryTxt || '').trim()
      if (!t) return 'info'
      const hit = this.categoryOptions.find(c => String(c.label) === t)
      if (hit) return this.getCategoryType(hit.id)
      if (t.includes('技术')) return 'primary'
      if (t.includes('指南')) return 'success'
      if (t.includes('常见') || t.includes('问题')) return 'warning'
      return 'info'
    },

    getCategoryName(categoryId) {
      const hit = this.categoryOptionMatch(categoryId)
      return hit ? hit.label : '—'
    },

    openAddModal() {
      this.isEditing = false
      this.editDetailHadAttachments = false
      this.qaUidSeq = 1
      this.formData = {
        id: null,
        title: '',
        categoryId: null,
        tags: [],
        qaPairs: [this.createEmptyQaRow()],
        enabled: true
      }
      this.newTag = ''
      this.fileList = []
      this.modalVisible = true
      this.$nextTick(() => {
        if (this.$refs.formRef) this.$refs.formRef.clearValidate()
        const el = this.$refs.formRef && this.$refs.formRef.$el && this.$refs.formRef.$el.querySelector('input')
        if (el) el.focus()
      })
    },

    async editKnowledge(row) {
      if (!row || !row.id) return
      this.isEditing = true
      this.modalVisible = true
      this.newTag = ''
      this.fileList = []
      this.editDetailHadAttachments = false
      this.qaUidSeq = 1
      try {
        const res = await getKnowledgeDetail(row.id)
        const d = this.mapDetailToView((res && res.data) || {})
        this.editDetailHadAttachments = (d.attachments && d.attachments.length > 0) || false
        const basePairs =
          d.qaPairs && d.qaPairs.length ? d.qaPairs : [{ question: '', answer: '' }]
        const rows = basePairs.map(p => ({
          _uid: this.nextQaUid(),
          question: p.question || '',
          answer: p.answer || ''
        }))
        this.formData = {
          id: d.id,
          title: d.title,
          categoryId: d.categoryId,
          tags: [...(d.tags || [])],
          qaPairs: rows,
          enabled: d.enabled
        }
        this.fileList = (d.attachments || []).map(a => ({
          name: a.name,
          url: a.url,
          uid: a.uid
        }))
      } catch (e) {
        this.modalVisible = false
        this.$message.error('加载知识详情失败')
      }
      this.$nextTick(() => {
        if (this.$refs.formRef) this.$refs.formRef.clearValidate()
      })
    },

    async viewKnowledge(row) {
      if (!row || !row.id) return
      this.detailVisible = true
      this.detailLoading = true
      this.selectedKnowledge = { title: row.title || '加载中…' }
      try {
        const res = await getKnowledgeDetail(row.id)
        this.selectedKnowledge = this.mapDetailToView((res && res.data) || {})
      } catch (e) {
        this.selectedKnowledge = {}
        this.$message.error('加载详情失败')
      } finally {
        this.detailLoading = false
      }
    },

    deleteKnowledge(id) {
      if (!id) return
      this.$confirm('确定要删除这条知识吗？删除后无法恢复！', '警告', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        try {
          await deleteKnowledgeApi(id)
          this.$message.success('删除成功')
          this.fetchList()
        } catch (e) {
          this.$message.error('删除失败')
        }
      }).catch(() => {
        this.$message.info('已取消删除')
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

    handleFileChange(file, fileList) {
      this.fileList = fileList
      this.touchQaValidation()
    },

    handleFileRemove(file, fileList) {
      this.fileList = fileList
      this.touchQaValidation()
    },

    collectNewRawFiles() {
      return (this.fileList || [])
        .map(f => f.raw)
        .filter(f => f instanceof File)
    },

    buildJsonPayload(includeId) {
      const qaPairs = this.qaPairsForApi()
      const payload = {
        title: this.formData.title,
        qaPairs,
        categoryId: this.formData.categoryId,
        tags: this.formData.tags,
        enabled: this.formData.enabled
      }
      if (includeId && this.formData.id) {
        payload.id = this.formData.id
      }
      return payload
    },

    saveKnowledge() {
      this.$refs.formRef.validate(async(valid) => {
        if (!valid) return
        this.saving = true
        try {
          const newFiles = this.collectNewRawFiles()
          if (this.isEditing) {
            if (newFiles.length) {
              const json = this.buildJsonPayload(true)
              const fd = new FormData()
              fd.append('form', new Blob([JSON.stringify(json)], { type: 'application/json' }))
              newFiles.forEach(f => fd.append('files', f, f.name))
              await updateKnowledgeMultipart(fd)
            } else {
              const json = this.buildJsonPayload(true)
              const clearedServerFiles =
                this.editDetailHadAttachments &&
                (this.fileList || []).every(f => !f.raw)
              if (clearedServerFiles && (this.fileList || []).length === 0) {
                json.files = []
              }
              await updateKnowledgeJson(json)
            }
            this.$message.success('更新成功')
          } else {
            const addRes = await addKnowledge(this.buildJsonPayload(false))
            const raw = addRes && addRes.data
            const newId =
              typeof raw === 'string'
                ? raw
                : (raw && (raw.id != null ? String(raw.id) : (raw.documentId != null ? String(raw.documentId) : '')))
            if (newFiles.length && newId) {
              const json = { ...this.buildJsonPayload(false), id: newId }
              const fd = new FormData()
              fd.append('form', new Blob([JSON.stringify(json)], { type: 'application/json' }))
              newFiles.forEach(f => fd.append('files', f, f.name))
              await updateKnowledgeMultipart(fd)
              this.$message.success('新增成功')
            } else if (newFiles.length && !newId) {
              this.$message.warning('已保存正文，但未返回知识 id，附件未上传')
            } else {
              this.$message.success('新增成功')
            }
          }
          this.modalVisible = false
          this.newTag = ''
          this.fileList = []
          this.fetchList()
        } catch (e) {
          this.$message.error(this.isEditing ? '更新失败' : '新增失败')
        } finally {
          this.saving = false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.knowledge-page {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 84px);
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  padding: 16px 20px 20px;
  box-sizing: border-box;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding: 16px 20px;
  border-radius: 8px;
  background: #fff;
  box-shadow: none;
  border: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  box-shadow: 0 4px 12px rgba(42, 135, 255, 0.14);
}

.title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-title {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.page-subtitle {
  font-size: 12px;
  color: #909399;
}

/* 搜索和筛选 */
.search-filter {
  margin-bottom: 14px;
  padding: 16px 20px 14px;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid #e4e7ed;
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  .search-item {
    margin-bottom: 0;
  }

  .keyword {
    width: 320px;
    max-width: 46vw;
  }

  .category {
    width: 200px;
  }
}

.search-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.search-meta {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 12px;
}

.meta-left {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.meta-count {
  color: #606266;
  font-weight: 600;
}

.meta-split {
  opacity: 0.7;
}

.meta-chip {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba($blue, 0.08);
  color: $blue;
  border: 1px solid rgba($blue, 0.22);
}

/* 知识库列表 */
.knowledge-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-card {
  padding: 4px 16px 0;
}

.knowledge-table {
  flex: 1;
}

.knowledge-table ::v-deep .el-table__header-wrapper th {
  background: #f8fafc !important;
  color: #606266;
  font-size: 13px;
}

.knowledge-table ::v-deep .el-table__body td {
  padding: 10px 0;
}

.knowledge-table ::v-deep .el-table__row:hover > td {
  background-color: rgba($blue, 0.05) !important;
}

.empty-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.knowledge-title {
  color: $blue;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.knowledge-title:hover {
  color: $light-blue;
  text-decoration: underline;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 4px;
}

/* 弹窗样式优化 */
.knowledge-dialog ::v-deep .el-dialog__header {
  background-color: #f8fafc;
  border-bottom: 1px solid #ebeef5;
  padding: 16px 20px;
  border-radius: 8px 8px 0 0;
}

.knowledge-dialog ::v-deep .el-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.knowledge-dialog ::v-deep .el-dialog__body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

/* 详情弹窗整体下移：覆盖全局 el-dialog margin-top clamp 上限过小的问题 */
.detail-dialog.knowledge-dialog {
  margin-top: clamp(56px, 14vh, 160px) !important;
}

.detail-dialog.knowledge-dialog ::v-deep .el-dialog__body {
  padding: 16px 20px 18px;
}

.knowledge-dialog ::v-deep .el-dialog__footer {
  padding: 14px 20px 18px;
  border-top: 1px solid #ebeef5;
  background-color: #f8fafc;
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

.qa-form-item {
  margin-bottom: 24px !important;
}

.qa-form-item ::v-deep > .el-form-item__content {
  line-height: 1.5;
}

.qa-list-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  margin: 0 0 14px;
  line-height: 1.55;
  padding: 10px 12px;
  background: linear-gradient(135deg, #f4f9ff 0%, #f0f5fa 100%);
  border: 1px solid #e1ecf7;
  border-radius: 8px;
}

.qa-list-hint i {
  margin-top: 2px;
  color: $blue;
  flex-shrink: 0;
}

/* 卡片：左侧色条 + 白底 + 轻阴影，与表单其它区域区分 */
.qa-card {
  position: relative;
  display: flex;
  margin-bottom: 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.qa-card-accent {
  width: 4px;
  flex-shrink: 0;
  background: linear-gradient(180deg, $blue 0%, $light-blue 100%);
}

.qa-card-inner {
  flex: 1;
  min-width: 0;
  padding: 14px 16px 6px;
}

.qa-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef1f6;
}

.qa-card-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.02em;
}

.qa-remove-btn {
  padding: 4px 8px !important;
  font-size: 13px;
  color: #f56c6c !important;
  border-radius: 6px;
  transition: background 0.15s;
}

.qa-remove-btn:not(.is-disabled):hover {
  color: #f78989 !important;
  background: #fef0f0 !important;
}

.qa-remove-btn.is-disabled {
  color: #c0c4cc !important;
}

/* 卡片内字段：标签在上，输入与「标题」等主字段左缘对齐 */
.qa-field-item {
  margin-bottom: 14px !important;
}

.qa-field-item:last-child {
  margin-bottom: 4px !important;
}

.qa-field-item ::v-deep .el-form-item__label {
  display: none !important;
  width: 0 !important;
  padding: 0 !important;
}

.qa-field-item ::v-deep .el-form-item__content {
  margin-left: 0 !important;
  line-height: 1.4;
}

.qa-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}

.qa-field-question ::v-deep .el-input__inner {
  border-radius: 8px;
}

.qa-field-answer ::v-deep .el-textarea__inner {
  border-radius: 8px;
  min-height: 96px !important;
  line-height: 1.6;
}

/* 校验错误：与卡片内排版统一，避免「红框 + 文案」显得拥挤 */
.qa-field-item ::v-deep .el-form-item__error {
  position: static;
  padding-top: 6px;
  line-height: 1.4;
  font-size: 12px;
  color: #f56c6c;
}

.qa-field-item.is-error ::v-deep .el-input__inner,
.qa-field-item.is-error ::v-deep .el-textarea__inner {
  box-shadow: 0 0 0 1px rgba(245, 108, 108, 0.12) inset;
}

.qa-add-btn {
  margin-top: 6px;
  padding: 9px 16px !important;
  border-radius: 8px;
  font-weight: 500;
}

.detail-qa-list {
  margin-top: 2px;
}

.detail-qa-block {
  padding: 12px 14px;
  margin-bottom: 10px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.detail-qa-block:last-child {
  margin-bottom: 0;
}

.detail-qa-q,
.detail-qa-a {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.detail-qa-a {
  margin-bottom: 0;
}

.detail-qa-label {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  border-radius: 4px;
}

.detail-qa-q .detail-qa-label {
  background: $blue;
}

.detail-qa-a .detail-qa-label {
  background: #67c23a;
}

.detail-qa-body {
  flex: 1;
  font-size: 14px;
  color: #303133;
  line-height: 1.7;
  min-width: 0;
}

.detail-qa-body.pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
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
  border-color: $blue;
  box-shadow: 0 0 0 2px rgba($blue, 0.18);
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
  border-color: $blue;
  background-color: rgba($blue, 0.06);
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
  padding: 4px 0 8px;
}

.detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
  margin-bottom: 12px;
}

.detail-title-text {
  flex: 1;
  min-width: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.45;
}

.detail-status-tag {
  flex-shrink: 0;
  margin-top: 2px;
  font-weight: 600;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e4e7ed;
  font-size: 13px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-item i {
  font-size: 15px;
}

.detail-field-label {
  flex-shrink: 0;
  font-size: 13px;
  color: #909399;
  font-weight: 500;
  min-width: 36px;
  margin-right: 8px;
}

.detail-category {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.detail-tags {
  margin-bottom: 14px;
  display: flex;
  align-items: flex-start;
  gap: 6px 8px;
  flex-wrap: wrap;
}

.detail-tags .detail-field-label {
  margin-top: 2px;
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
  color: $blue;
  font-size: 16px;
}

/* 分页 */
.pagination {
  padding: 14px 16px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
}

.action-link {
  font-weight: 600;
  padding: 0;
}

.action-link.primary {
  color: $blue;
}

.action-link.danger {
  color: #e64a4a;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .knowledge-page {
    padding: 12px;
  }

  .search-filter {
    flex-wrap: wrap;
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .knowledge-page {
    min-height: auto;
    padding: 10px;
  }

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

  .search-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
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

  .table-card {
    padding: 8px 6px 0;
  }
}
</style>
