<template>
  <div v-if="visible" class="config-drawer">
    <div class="drawer-content">
      <div class="drawer-header">
        <div class="drawer-header-text">
          <h3>{{ drawerMainTitle }}</h3>
          <p v-if="drawerSubTitle" class="drawer-subtitle">{{ drawerSubTitle }}</p>
        </div>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <div class="drawer-body">
        <!-- 动态加载对应类型的配置表单组件 -->
        <component
          :is="formComponent"
          :form-data="formData"
          :flow-id="flowId"
          :flow-config="flowConfig"
          :current-node-id="currentNodeId"
          :component-tree-config="componentTreeConfig"
          @save="handleSave"
          @cancel="handleClose"
        />
      </div>
    </div>
  </div>
</template>

<script>
// 导入各类型的配置表单组件
import TableInputConfig from './config/input/TableInputConfig.vue'
import UpsetOutputConfig from './config/output/UpsetOutputConfig.vue'
import TableOutputConfig from './config/output/TableOutputConfig.vue'
import InsertOrUpdateConfig from './config/output/InsertOrUpdateConfig.vue'
import DorisOutputConfig from './config/output/DorisOutputConfig.vue'
import FTPUploadConfig from './config/file/FTPUploadConfig.vue'
import FTPDownloadConfig from './config/file/FTPDownloadConfig.vue'
import AlibabaOSSUploadConfig from './config/file/AlibabaOSSUploadConfig.vue'
import AlibabaOSSDownloadConfig from './config/file/AlibabaOSSDownloadConfig.vue'
import MinIOUploadConfig from './config/file/MinIOUploadConfig.vue'
import MinIODownloadConfig from './config/file/MinIODownloadConfig.vue'
import CleanTransformConfig from './config/clean/CleanTransformConfig.vue'
import PrintLogConfig from './config/log/PrintLogConfig.vue'
import ExecSqlConfig from './config/sql/ExecSqlConfig.vue'
import JavaCodeConfig from './config/java/JavaCodeConfig.vue'
import ConditionJudgeConfig from './config/java/ConditionJudgeConfig.vue'
import DataFilterConfig from './config/filter/DataFilterConfig.vue'
import DebeziumJsonConfig from './config/debezium/DebeziumJsonConfig.vue'
import ProcessBranchConfig from './config/branch/ProcessBranchConfig.vue'
import RowGeneratorConfig from './config/input/RowGeneratorConfig.vue'
import KafkaInputConfig from './config/input/KafkaInputConfig.vue'
import KafkaProducerOutputConfig from './config/output/KafkaProducerOutputConfig.vue'
import RabbitMqProducerOutputConfig from './config/output/RabbitMqProducerOutputConfig.vue'
import RabbitMqConsumerInputConfig from './config/input/RabbitMqConsumerInputConfig.vue'
import RedisInputConfig from './config/input/RedisInputConfig.vue'
import RedisOutputConfig from './config/output/RedisOutputConfig.vue'
import ExcelInputConfig from './config/input/ExcelInputConfig.vue'
import RecordsFromStreamConfig from './config/input/RecordsFromStreamConfig.vue'
import SystemDateConfig from './config/input/SystemDateConfig.vue'
import ExcelOutputConfig from './config/output/ExcelOutputConfig.vue'
import DenormalizedConfig from './config/transform/DenormalizedConfig.vue'
import NormaliserConfig from './config/transform/NormaliserConfig.vue'
import FieldSelectConfig from './config/transform/FieldSelectConfig.vue'
import SortRowsConfig from './config/transform/SortRowsConfig.vue'
import SplitFieldToRowsConfig from './config/transform/SplitFieldToRowsConfig.vue'
import FieldSplitterConfig from './config/transform/FieldSplitterConfig.vue'
import FormulaConfig from './config/transform/FormulaConfig.vue'
import GroupByConfig from './config/transform/GroupByConfig.vue'
import MicroscopicConfig from './config/transform/MicroscopicConfig.vue'
import ApiInputConfig from './config/input/ApiInputConfig.vue'
import ApiAttachmentDownloadConfig from './config/input/ApiAttachmentDownloadConfig.vue'
import ApiOutputConfig from './config/output/ApiOutputConfig.vue'

export default {
  name: 'ConfigDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    componentType: {
      type: String,
      required: true
    },
    initialForm: {
      type: Object,
      default: () => ({})
    },
    title: {
      type: String,
      default: '组件配置'
    },
    flowId: {
      type: [Number, String],
      default: null
    },
    flowConfig: {
      type: Object,
      default: null
    },
    currentNodeId: {
      type: String,
      default: ''
    },
    /** 组件树节点上的 config 字段（字典等），来自 /trans/component/tree.do */
    componentTreeConfig: {
      type: [Object, String, Array],
      default: null
    }
  },
  data() {
    return {
      // 表单数据（双向绑定）
      formData: {}
    }
  },
  computed: {
    drawerMainTitle() {
      if (this.componentType === 'WriteToLog' || this.componentType === 'PrintLog') {
        return '基础配置'
      }
      return this.title
    },
    drawerSubTitle() {
      if (this.componentType === 'WriteToLog' || this.componentType === 'PrintLog') {
        return '打印日志'
      }
      return ''
    },
    // 根据组件类型匹配对应的表单组件
    formComponent() {
      const componentMap = {
        TableInput: TableInputConfig,
        UpsetOutput: UpsetOutputConfig,
        TableOutput: TableOutputConfig,
        InsertOrUpdate: InsertOrUpdateConfig,
        DorisOutput: DorisOutputConfig,
        KafkaInput: KafkaInputConfig,
        KafkaConsumerInput: KafkaInputConfig,
        KafkaProducerOutput: KafkaProducerOutputConfig,
        RabbitMqProducerOutput: RabbitMqProducerOutputConfig,
        RabbitMqConsumerInput: RabbitMqConsumerInputConfig,
        RedisInput: RedisInputConfig,
        RedisOutput: RedisOutputConfig,
        ExcelInput: ExcelInputConfig,
        ExcelOutput: ExcelOutputConfig,
        FtpUpload: FTPUploadConfig,
        FTPUpload: FTPUploadConfig,
        AliYunOSSUpload: AlibabaOSSUploadConfig,
        AliyunOSSUpload: AlibabaOSSUploadConfig,
        AlibabaOSSUpload: AlibabaOSSUploadConfig,
        AlibabaOssUpload: AlibabaOSSUploadConfig,
        OSSUpload: AlibabaOSSUploadConfig,
        OssUpload: AlibabaOSSUploadConfig,
        FtpDownload: FTPDownloadConfig,
        FTPDownload: FTPDownloadConfig,
        AliYunOSSDownload: AlibabaOSSDownloadConfig,
        AliyunOSSDownload: AlibabaOSSDownloadConfig,
        AlibabaOSSDownload: AlibabaOSSDownloadConfig,
        AlibabaOssDownload: AlibabaOSSDownloadConfig,
        OSSDownload: AlibabaOSSDownloadConfig,
        OssDownload: AlibabaOSSDownloadConfig,
        MinIOUpload: MinIOUploadConfig,
        MinioUpload: MinIOUploadConfig,
        MinIODownload: MinIODownloadConfig,
        MinioDownload: MinIODownloadConfig,
        // 数据清洗转换（不同环境 code 可能略有差异，这里做兼容映射）
        DataCleanTransform: CleanTransformConfig,
        DataCleanConvert: CleanTransformConfig,
        DataCleanConversion: CleanTransformConfig,
        CleanTransform: CleanTransformConfig,
        DataClean: CleanTransformConfig,
        PrintLog: PrintLogConfig,
        WriteToLog: PrintLogConfig,
        // 执行SQL脚本（统一标识 SQLScript；兼容旧标识 executeSQL）
        SQLScript: ExecSqlConfig,
        executeSQL: ExecSqlConfig,
        // Java 代码/脚本（不同后端组件树 code 可能不同，这里做兼容映射）
        JavaCode: JavaCodeConfig,
        ConditionJudge: ConditionJudgeConfig,
        ConditionJudgeJava: ConditionJudgeConfig,
        JavaCondition: ConditionJudgeConfig,
        JavaFilter: ConditionJudgeConfig,
        FilterRows: ConditionJudgeConfig,
        DataFilter: DataFilterConfig,
        ProcessBranch: ProcessBranchConfig,
        JavaScript: JavaCodeConfig,
        UserDefinedJavaClass: JavaCodeConfig,
        UserDefinedJavaClassMeta: JavaCodeConfig,
        Java: JavaCodeConfig,
        DebeziumJson: DebeziumJsonConfig,
        RowGenerator: RowGeneratorConfig,
        RecordsFromStream: RecordsFromStreamConfig,
        SystemDate: SystemDateConfig,
        Denormalized: DenormalizedConfig,
        // 行转列：后端部分环境使用 Denormaliser，与 Denormalized 同义
        Denormaliser: DenormalizedConfig,
        // 列转行（Row Normaliser）
        Normaliser: NormaliserConfig,
        Normalizer: NormaliserConfig,
        RowNormaliser: NormaliserConfig,
        NormaliserMeta: NormaliserConfig,
        FieldSelect: FieldSelectConfig,
        SelectValues: FieldSelectConfig,
        SortRows: SortRowsConfig,
        SplitFieldToRows: SplitFieldToRowsConfig,
        FieldSplitter: FieldSplitterConfig,
        Formula: FormulaConfig,
        Microscopic: MicroscopicConfig,
        GroupBy: GroupByConfig,
        ApiInput: ApiInputConfig,
        ApiAttachmentDownload: ApiAttachmentDownloadConfig,
        ApiFileDownload: ApiAttachmentDownloadConfig,
        ApiOutput: ApiOutputConfig
      }
      return componentMap[this.componentType] || TableInputConfig
    }
  },
  watch: {
    /**
     * 抽屉关闭时子组件不挂载；打开瞬间需与 initialForm 对齐。
     * 仅依赖 initialForm 的 deep 监听在部分更新顺序下会早于 props 就绪，导致子组件 mounted 读到空表单。
     */
    visible(v) {
      if (!v) return
      this.formData = JSON.parse(JSON.stringify(this.initialForm || {}))
    },
    initialForm: {
      handler() {
        if (!this.visible) return
        this.formData = JSON.parse(JSON.stringify(this.initialForm || {}))
      },
      deep: true
    }
  },
  methods: {
    // 关闭抽屉
    handleClose() {
      this.$emit('close')
    },
    // 保存配置（子组件若传入规范化后的 payload，优先使用）
    handleSave(payload) {
      if (payload != null && typeof payload === 'object' && !Array.isArray(payload)) {
        this.$emit('save', payload)
      } else {
        this.$emit('save', { ...this.formData })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.config-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 30%;
  height: 100%;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  /* 低于 ElementUI 弹窗默认 z-index(2000)，避免编辑规则等 dialog 被抽屉压住 */
  z-index: 1990;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

/* 统一字段表格（ElementUI el-table）样式：更紧凑、更小字号 */
.config-drawer ::v-deep .el-table {
  font-size: 12px;
}

.config-drawer ::v-deep .el-table th,
.config-drawer ::v-deep .el-table td {
  padding: 6px 0;
}

.config-drawer ::v-deep .el-table th > .cell,
.config-drawer ::v-deep .el-table td > .cell {
  padding-left: 10px;
  padding-right: 10px;
  line-height: 18px;
}

.config-drawer ::v-deep .el-table thead {
  color: #303133;
}

.config-drawer ::v-deep .el-table--border::after,
.config-drawer ::v-deep .el-table--group::after,
.config-drawer ::v-deep .el-table::before {
  background-color: #ebeef5;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  background: #f5f5f5;
}

.drawer-header-text {
  min-width: 0;
}

.drawer-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.drawer-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

/*
 * 配置抽屉内容区：统一与弹窗边缘、与内部 Hero/表单的距离。
 * 各组件内 .config-content 的 padding 在下方清零，避免与这里叠加导致每个组件间距不同。
 */
.drawer-body {
  flex: 1;
  padding: 20px 24px 24px;
  overflow-y: auto;
}

.drawer-body ::v-deep .config-content {
  padding: 0 !important;
}

.drawer-body ::v-deep form.config-form {
  margin: 0;
  padding: 0;
}

/* Hero 与 el-tabs 页签间距：Hero 已设 12px 下边距，页签不再使用负 margin-top 吃掉空隙 */
.drawer-body ::v-deep .flow-config-hero + .el-tabs.config-tabs,
.drawer-body ::v-deep .flow-config-hero + .el-tabs {
  margin-top: 0 !important;
}

/* Redis 等：Hero 与包在 config-body 内的页签 */
.drawer-body ::v-deep .flow-config-hero + .config-body {
  padding-top: 0 !important;
}

.drawer-body ::v-deep .flow-config-hero + .config-body > .config-tabs.el-tabs,
.drawer-body ::v-deep .flow-config-hero + .config-body > .el-tabs.config-tabs {
  margin-top: 0 !important;
}

/* Upset 等：form 根下直接跟 Hero + tabs */
.drawer-body ::v-deep form.config-form > .flow-config-hero + .el-tabs {
  margin-top: 0 !important;
}

/* 全组件统一：基础配置表单排版对齐 Debezium（标签在上，控件整行） */
.drawer-body ::v-deep .form-item {
  display: block !important;
  margin-bottom: 16px !important;
}

.drawer-body ::v-deep .form-label {
  display: block !important;
  width: 100% !important;
  text-align: left !important;
  line-height: 20px !important;
  margin: 0 0 8px !important;
  padding-top: 0 !important;
  flex: none !important;
}

.drawer-body ::v-deep .form-input,
.drawer-body ::v-deep .form-textarea,
.drawer-body ::v-deep .form-select,
.drawer-body ::v-deep .custom-select,
.drawer-body ::v-deep .db-select,
.drawer-body ::v-deep .code-editor-wrap,
.drawer-body ::v-deep .sql-editor-wrapper {
  width: 100% !important;
  min-width: 0 !important;
}

/* 避免部分组件遗留“左侧占位缩进”导致大面积空白 */
.drawer-body ::v-deep .aligned-block {
  margin-left: 0 !important;
  width: 100% !important;
}

/* 复选项行保持水平排列 */
.drawer-body ::v-deep .checkbox-item,
.drawer-body ::v-deep .checkbox-row {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.drawer-body ::v-deep .checkbox-item .form-label:empty {
  display: none !important;
}

/* 高级配置统一按 Debezium 结构间距 */
.drawer-body ::v-deep .advanced-layout .section-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 10px 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  border-top: 1px solid #ebeef5 !important;
  border-bottom: none !important;
  cursor: pointer !important;
  user-select: none !important;
}

.drawer-body ::v-deep .advanced-layout .section-header h4 {
  margin: 0 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  color: #303133 !important;
}

/* Kafka 输入/输出：高级页分节不加粗；仅带 section-header--emphasis 的「Kafka选项配置」加粗 */
.drawer-body ::v-deep .kafka-input-config .advanced-layout .section-header h4,
.drawer-body ::v-deep .kafka-producer-output-config .advanced-layout .section-header h4 {
  font-weight: 400 !important;
}

.drawer-body ::v-deep .kafka-input-config .section-header--emphasis h4,
.drawer-body ::v-deep .kafka-producer-output-config .section-header--emphasis h4 {
  font-weight: 600 !important;
}

.drawer-body ::v-deep .kafka-input-config .form-label,
.drawer-body ::v-deep .kafka-producer-output-config .form-label {
  font-weight: 400 !important;
}

.drawer-body ::v-deep .kafka-input-config .flow-config-hero__title,
.drawer-body ::v-deep .kafka-producer-output-config .flow-config-hero__title {
  font-weight: 400 !important;
}

.drawer-body ::v-deep .kafka-input-config .flow-config-hero__badge,
.drawer-body ::v-deep .kafka-producer-output-config .flow-config-hero__badge {
  font-weight: 400 !important;
}

.drawer-body ::v-deep .kafka-input-config .config-tabs .el-tabs__item,
.drawer-body ::v-deep .kafka-producer-output-config .config-tabs .el-tabs__item {
  font-weight: 400 !important;
}

.drawer-body ::v-deep .kafka-input-config .config-tabs .el-tabs__item.is-active,
.drawer-body ::v-deep .kafka-producer-output-config .config-tabs .el-tabs__item.is-active {
  font-weight: 400 !important;
}

/* Kafka：步骤名称等输入框内文字不加粗 */
.drawer-body ::v-deep .kafka-input-config input.form-input,
.drawer-body ::v-deep .kafka-input-config textarea.form-textarea,
.drawer-body ::v-deep .kafka-producer-output-config input.form-input,
.drawer-body ::v-deep .kafka-producer-output-config textarea.form-textarea {
  font-weight: 400 !important;
}

.drawer-body ::v-deep .kafka-input-config .el-input__inner,
.drawer-body ::v-deep .kafka-input-config .el-textarea__inner,
.drawer-body ::v-deep .kafka-producer-output-config .el-input__inner,
.drawer-body ::v-deep .kafka-producer-output-config .el-textarea__inner {
  font-weight: 400 !important;
}

.drawer-body ::v-deep .advanced-layout .section-toggle {
  color: #909399 !important;
}

.drawer-body ::v-deep .advanced-layout .section-content {
  padding-top: 8px !important;
  margin-bottom: 8px !important;
}

.drawer-body ::v-deep .advanced-layout .advanced-row,
.drawer-body ::v-deep .advanced-layout .radio-row {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin-bottom: 12px !important;
}

.drawer-body ::v-deep .advanced-layout .advanced-label,
.drawer-body ::v-deep .advanced-layout .radio-label {
  color: #606266 !important;
  font-size: 14px !important;
}

.drawer-body ::v-deep .form-actions {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  margin-top: 24px !important;
  padding-top: 16px !important;
  border-top: 1px solid #ebeef5 !important;
}

/* 统一标题与高级分组之间的间距（避免出现大块空白） */
.drawer-body ::v-deep .form-title {
  margin-bottom: 8px !important;
  padding-bottom: 0 !important;
  border-bottom: none !important;
}

.drawer-body ::v-deep .advanced-layout {
  margin-top: 0 !important;
}

/*
 * API 输入/输出：设计稿为「左侧标签 + 右侧控件」横向表单项，需覆盖上文 Debezium 纵向表单规则。
 */
.drawer-body ::v-deep .api-http-step-config .config-content {
  padding: 0 !important;
}

.drawer-body ::v-deep .api-http-step-config .panel-head-title {
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #303133 !important;
  margin: 0 0 12px !important;
  padding: 0 !important;
  line-height: 24px !important;
  border: none !important;
}

.drawer-body ::v-deep .api-http-step-config .config-tabs {
  margin: 0 0 16px !important;
}

.drawer-body ::v-deep .api-http-step-config .form-item:not(.checkbox-item),
.drawer-body ::v-deep .api-http-step-config .advanced-layout .form-item {
  display: flex !important;
  flex-direction: row !important;
  align-items: flex-start !important;
  margin-bottom: 16px !important;
}

.drawer-body ::v-deep .api-http-step-config .form-item.body-mode-row,
.drawer-body ::v-deep .api-http-step-config .form-item.checkbox-item {
  align-items: center !important;
}

.drawer-body ::v-deep .api-http-step-config .form-label {
  display: block !important;
  width: 148px !important;
  min-width: 148px !important;
  max-width: 148px !important;
  flex-shrink: 0 !important;
  text-align: right !important;
  padding-top: 8px !important;
  margin: 0 12px 0 0 !important;
  line-height: 20px !important;
  font-size: 14px !important;
  color: #606266 !important;
}

.drawer-body ::v-deep .api-http-step-config .form-input,
.drawer-body ::v-deep .api-http-step-config .form-textarea,
.drawer-body ::v-deep .api-http-step-config .form-select,
.drawer-body ::v-deep .api-http-step-config .form-select.el-select {
  flex: 1 1 auto !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: none !important;
}

.drawer-body ::v-deep .api-http-step-config .form-item.checkbox-item {
  padding-left: 160px !important;
}

.drawer-body ::v-deep .api-http-step-config .form-item.checkbox-item .form-label:empty {
  display: none !important;
}

.drawer-body ::v-deep .api-http-step-config .section-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 10px 0 !important;
  margin-bottom: 8px !important;
  border-bottom: 1px solid #ebeef5 !important;
  cursor: pointer !important;
  user-select: none !important;
}

.drawer-body ::v-deep .api-http-step-config .section-header h4 {
  margin: 0 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  color: #303133 !important;
  display: flex !important;
  align-items: center !important;
}

.drawer-body ::v-deep .api-http-step-config .section-toggle {
  color: #909399 !important;
}

.drawer-body ::v-deep .api-http-step-config .field-table-wrap {
  width: 100% !important;
}

.drawer-body ::v-deep .api-http-step-config .field-actions {
  display: flex !important;
  justify-content: center !important;
  padding-top: 10px !important;
}

.drawer-body ::v-deep .api-http-step-config .dash-btn {
  max-width: 100% !important;
}

.drawer-body ::v-deep .api-http-step-config .advanced-layout .advanced-row {
  padding-left: 0 !important;
  margin-bottom: 12px !important;
}

.drawer-body ::v-deep .api-http-step-config .body-radio-toolbar {
  padding-left: 160px !important;
  margin-bottom: 12px !important;
}

.drawer-body ::v-deep .api-http-step-config .form-item--radios {
  align-items: center !important;
}

.drawer-body ::v-deep .api-http-step-config .form-label--spacer {
  min-height: 1px !important;
  padding-top: 0 !important;
  visibility: hidden !important;
}

.drawer-body ::v-deep .api-http-step-config .form-actions {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: flex-end !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
}

.drawer-body ::v-deep .api-http-step-config .section-content--muted {
  opacity: 0.55;
  pointer-events: none;
}

.drawer-body ::v-deep .api-http-step-config .form-item--checkbox {
  align-items: center !important;
  padding-left: 160px !important;
}

.drawer-body ::v-deep .api-http-step-config .form-item--checkbox .form-label:empty {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

</style>
