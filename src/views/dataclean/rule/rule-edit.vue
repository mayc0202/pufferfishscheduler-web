<template>
  <div class="rule-edit-container" :class="{ 'java-custom-mode': isJavaCustom, 'readonly-mode': isReadonlyView }">
    <div class="header">
      <div>
        <div class="title">{{ pageTitle }}</div>
        <div class="subtitle">{{ pageSubtitle }}</div>
      </div>
      <div class="back" @click="$router.back()">
        <i class="el-icon-back" />
        <span>返回列表</span>
      </div>
    </div>

    <div class="body">
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleRules"
        label-width="100px"
        size="small"
        class="rule-form"
      >
        <div v-if="isReadonlyView" class="rule-detail-card">
          <div class="section-title">
            <i class="el-icon-document" />
            <span>规则基础信息</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="12"><div class="detail-item"><span class="k">规则名称：</span><span class="v">{{ ruleForm.name || '-' }}</span></div></el-col>
            <el-col :span="12"><div class="detail-item"><span class="k">规则编码：</span><span class="v">{{ ruleForm.code || '-' }}</span></div></el-col>
            <el-col :span="12"><div class="detail-item"><span class="k">规则分组：</span><span class="v">{{ detailGroupName }}</span></div></el-col>
            <el-col :span="12"><div class="detail-item"><span class="k">发布状态：</span><span class="v">{{ ruleForm.enabled ? '启用' : '禁用' }}</span></div></el-col>
            <el-col :span="12"><div class="detail-item"><span class="k">规则类型：</span><span class="v">{{ detailProcessorName }}</span></div></el-col>
            <el-col :span="24"><div class="detail-item multiline"><span class="k">规则描述：</span><span class="v">{{ ruleForm.description || '-' }}</span></div></el-col>
          </el-row>
        </div>
        <div v-else v-loading="processorConfigLoading" class="form-card processor-card">
          <div class="section-title">
            <i class="el-icon-document" />
            <span>基础信息</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="规则名称" prop="name">
                <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="规则编码" prop="code">
                <el-input
                  v-model="ruleForm.code"
                  placeholder="由系统生成"
                  disabled
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="规则分组" prop="groupId">
                <el-cascader
                  v-model="ruleForm.groupId"
                  :options="ruleGroupOptionsForSelect"
                  :props="{ value: 'id', label: 'name', children: 'children', emitPath: false }"
                  placeholder="请选择规则分组"
                  clearable
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="发布启用">
                <el-switch v-model="ruleForm.enabled" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="24">
              <el-form-item label="规则描述">
                <el-input
                  v-model="ruleForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入规则描述"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-divider content-position="left">规则配置</el-divider>

        <!-- 规则处理器选择 -->
        <div class="form-card" :class="{ 'readonly-block': isReadonlyView }">
          <div class="section-title">
            <i class="el-icon-setting" />
            <span>处理器配置</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="规则类型" prop="processorId">
                <el-select
                  v-model="ruleForm.processorId"
                  placeholder="请选择规则类型"
                  clearable
                  class="rule-edit-std-select"
                  :disabled="isReadonlyView"
                  @change="handleProcessorChange"
                >
                  <el-option
                    v-for="item in processorOptions"
                    :key="item.id"
                    :label="item.processorName"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 需要配置返回值类型的规则：统一在「规则类型」正下方 -->
          <el-row v-if="showOutputFieldTypeSection" :gutter="20">
            <el-col :span="24">
              <el-form-item
                label-width="100px"
                :class="{ 'readonly-block': isReadonlyView }"
              >
                <template slot="label">
                  <span v-if="outputFieldTypeLabelRequired" class="req-mark">*</span>
                  <span>返回值类型</span>
                </template>
                <el-select
                  v-model="outputFieldTypeValue"
                  placeholder="请选择返回值类型"
                  clearable
                  class="rule-edit-std-select"
                  :disabled="isReadonlyView"
                  @change="handleOutputFieldTypeChange"
                >
                  <el-option
                    v-for="opt in outputFieldTypeOptions"
                    :key="String(opt.value)"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row v-if="currentProcessor">
            <el-col :span="24">
              <div v-if="currentConfig.descriptipn" class="processor-desc">
                {{ currentConfig.descriptipn }}
              </div>
            </el-col>
          </el-row>

          <el-row v-if="isValueMapping" :gutter="20">
            <el-col :span="24">
              <el-form-item label="配置方式" prop="mappingType">
                <el-radio-group v-model="ruleForm.mappingType" :disabled="isReadonlyView">
                  <el-radio
                    v-for="opt in filteredMappingTypeOptions"
                    :key="opt.value"
                    :label="opt.value"
                  >
                    {{ opt.label }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <template v-if="isMappingDbDictMode">
              <el-col :span="12">
                <el-form-item label="数据源">
                  <el-select
                    v-model="ruleForm.mappingSourceDbId"
                    placeholder="请选择数据源"
                    filterable
                    clearable
                    style="width:100%;"
                    :disabled="isReadonlyView"
                    @change="handleMappingSourceChange"
                  >
                    <el-option
                      v-for="db in mappingSourceDbOptions"
                      :key="db.value"
                      :label="db.label"
                      :value="db.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="字典表">
                  <el-select
                    v-model="ruleForm.mappingDictTableId"
                    placeholder="请选择字典表"
                    filterable
                    clearable
                    style="width:100%;"
                    :disabled="isReadonlyView"
                    @change="handleMappingTableChange"
                  >
                    <el-option
                      v-for="tb in mappingTableOptions"
                      :key="tb.value"
                      :label="tb.label"
                      :value="tb.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="值(转换前)">
                  <el-select
                    v-model="ruleForm.mappingFromField"
                    placeholder="请选择来源字段"
                    filterable
                    clearable
                    style="width:100%;"
                    :disabled="isReadonlyView"
                  >
                    <el-option
                      v-for="fd in mappingFieldOptions"
                      :key="fd.value"
                      :label="fd.label"
                      :value="fd.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="值(转换后)">
                  <el-select
                    v-model="ruleForm.mappingToField"
                    placeholder="请选择目标字段"
                    filterable
                    clearable
                    style="width:100%;"
                    :disabled="isReadonlyView"
                  >
                    <el-option
                      v-for="fd in mappingFieldOptions"
                      :key="`to-${fd.value}`"
                      :label="fd.label"
                      :value="fd.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <div class="mapping-filter-title">过滤条件：</div>
                <div class="mapping-filter-root">
                  <span>满足下列</span>
                  <el-select v-model="ruleForm.mappingFilter.logic" size="mini" class="logic-select" :disabled="isReadonlyView">
                    <el-option label="所有" value="ALL" />
                    <el-option label="任一" value="ANY" />
                  </el-select>
                  <span>条件</span>
                  <el-dropdown v-if="!isReadonlyView" size="mini" @command="handleAddRootFilter">
                    <el-button type="primary" size="mini">
                      添加条件<i class="el-icon-arrow-down el-icon--right" />
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="condition">所有</el-dropdown-item>
                      <el-dropdown-item command="group">组</el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                </div>
                <div class="mapping-filter-lines">
                  <div
                    v-for="(item, idx) in ruleForm.mappingFilter.items"
                    :key="item.id"
                    class="mapping-filter-item"
                  >
                    <template v-if="item.type === 'condition'">
                      <el-select v-model="item.field" size="mini" placeholder="字段" filterable clearable class="field-select" :disabled="isReadonlyView">
                        <el-option
                          v-for="fd in mappingFieldOptions"
                          :key="fd.value"
                          :label="fd.label"
                          :value="fd.value"
                        />
                      </el-select>
                      <el-select v-model="item.operator" size="mini" placeholder="操作符" clearable class="op-select" :disabled="isReadonlyView">
                        <el-option
                          v-for="op in mappingOperatorOptions"
                          :key="op.value"
                          :label="op.label"
                          :value="op.value"
                        />
                      </el-select>
                      <el-input v-model="item.value" size="mini" placeholder="默认值" class="value-input" :readonly="isReadonlyView" />
                      <el-button v-if="!isReadonlyView" type="text" @click="removeRootFilter(idx)">
                        <i class="el-icon-delete" />
                      </el-button>
                    </template>
                    <template v-else>
                      <div class="mapping-filter-group">
                        <div class="mapping-filter-group-title">条件组</div>
                        <div class="mapping-filter-root">
                          <span>满足下列</span>
                          <el-select v-model="item.logic" size="mini" class="logic-select" :disabled="isReadonlyView">
                            <el-option label="所有" value="ALL" />
                            <el-option label="任一" value="ANY" />
                          </el-select>
                          <span>条件</span>
                          <el-button v-if="!isReadonlyView" type="primary" size="mini" @click="addGroupCondition(item)">
                            添加条件
                          </el-button>
                        </div>
                        <div
                          v-for="(sub, subIdx) in item.conditions"
                          :key="sub.id"
                          class="mapping-filter-item"
                        >
                          <el-select v-model="sub.field" size="mini" placeholder="字段" filterable clearable class="field-select" :disabled="isReadonlyView">
                            <el-option
                              v-for="fd in mappingFieldOptions"
                              :key="fd.value"
                              :label="fd.label"
                              :value="fd.value"
                            />
                          </el-select>
                          <el-select v-model="sub.operator" size="mini" placeholder="操作符" clearable class="op-select" :disabled="isReadonlyView">
                            <el-option
                              v-for="op in mappingOperatorOptions"
                              :key="op.value"
                              :label="op.label"
                              :value="op.value"
                            />
                          </el-select>
                          <el-input v-model="sub.value" size="mini" placeholder="默认值" class="value-input" :readonly="isReadonlyView" />
                          <el-button v-if="!isReadonlyView" type="text" @click="removeGroupCondition(item, subIdx)">
                            <i class="el-icon-delete" />
                          </el-button>
                        </div>
                      </div>
                      <el-button v-if="!isReadonlyView" type="text" @click="removeRootFilter(idx)">
                        <i class="el-icon-delete" />
                      </el-button>
                    </template>
                  </div>
                </div>
              </el-col>
            </template>
            <template v-if="isMappingSqlMode">
              <el-col :span="12">
                <el-form-item label="数据源">
                  <el-select
                    v-model="ruleForm.mappingSourceDbId"
                    placeholder="请选择数据源"
                    filterable
                    clearable
                    style="width:100%;"
                    :disabled="isReadonlyView"
                  >
                    <el-option
                      v-for="db in mappingSourceDbOptions"
                      :key="db.value"
                      :label="db.label"
                      :value="db.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="SQL脚本">
                  <el-input
                    v-model="ruleForm.mappingSql"
                    type="textarea"
                    :rows="8"
                    resize="vertical"
                    placeholder="请输入自定义 SQL 脚本"
                    :readonly="isReadonlyView"
                  />
                </el-form-item>
              </el-col>
            </template>
            <template v-if="isMappingManualMode">
              <el-col :span="24" class="manual-mapping-section">
                <!-- 与表单项内容区左对齐：左侧添加行，右侧导入 + 文字链样式模板下载 -->
                <div v-if="!isReadonlyView" class="mapping-toolbar mapping-toolbar--manual">
                  <div class="left">
                    <el-button type="primary" size="small" plain icon="el-icon-plus" @click="addManualMappingRow">
                      添加参数
                    </el-button>
                  </div>
                  <div class="right">
                    <el-button type="primary" size="small" @click="triggerManualMappingImport">导入</el-button>
                    <el-button type="text" class="manual-template-link" @click="downloadManualMappingTemplate">
                      模板下载
                    </el-button>
                  </div>
                </div>
                <input
                  ref="mappingImportInput"
                  type="file"
                  accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  style="display:none;"
                  @change="handleManualMappingImport"
                >
                <el-table
                  :data="ruleForm.manualMappings"
                  border
                  stripe
                  class="param-table"
                  style="width:100%; margin-bottom: 10px;"
                >
                  <el-table-column type="index" label="#" width="50" />
                  <el-table-column label="值（转换前）" min-width="240">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.fromValue" placeholder="请输入值（转换前）" :readonly="isReadonlyView" />
                    </template>
                  </el-table-column>
                  <el-table-column label="值（转换后）" min-width="240">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.toValue" placeholder="请输入值（转换后）" :readonly="isReadonlyView" />
                    </template>
                  </el-table-column>
                  <el-table-column label="说明" min-width="240">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" placeholder="请输入说明" :readonly="isReadonlyView" />
                    </template>
                  </el-table-column>
                  <el-table-column v-if="!isReadonlyView" label="操作" width="90" fixed="right">
                    <template slot-scope="scope">
                      <el-button type="text" @click="removeManualMappingRow(scope.$index)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </template>
          </el-row>

          <el-row v-if="isJavaCustom" :gutter="20">
            <el-col :span="24">
              <el-form-item label="JAVA代码" prop="javaCode">
                <div class="md-workbench">
                  <div class="md-pane md-pane-edit">
                    <markdown-editor
                      v-model="ruleForm.javaCode"
                      title="清洗规则编辑区"
                      hint="支持用注释组织代码结构，提升可读性"
                      :rows="16"
                      placeholder="请输入 Java 代码片段"
                      :readonly="isReadonlyView"
                    />
                  </div>
                </div>
                <div class="java-code-tip">
                  支持用户自定义编写代码片段；系统会将该代码作为处理器配置的一部分提交。
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 非 Java：值映射在「数据库字典 / 自定义 SQL」模式下不展示处理器参数表；手工配置等其它方式仍展示 -->
        <!-- 与顶部「返回值类型」重复的 fieldList 行已过滤；无其它参数时可整块不展示 -->
        <template v-if="showLegacyProcessorParamBlock">
          <el-table
            v-if="displayLegacyParamFieldList.length"
            :data="displayLegacyParamFieldList"
            border
            stripe
            class="param-table"
            :class="{ 'readonly-block': isReadonlyView }"
            style="width: 100%; margin-bottom: 20px;"
          >
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="description" label="参数名称" width="200" />
            <el-table-column prop="name" label="参数编码" width="200" />
            <el-table-column prop="requires" label="必填" width="80">
              <template slot-scope="scope">
                <span>{{ scope.row.requires ? '是' : '否' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="参数值">
              <template slot-scope="scope">
                <el-input
                  v-if="scope.row.controlType === 1"
                  v-model="paramValues[scope.row.name]"
                  :placeholder="`请输入${scope.row.description}`"
                  size="small"
                  :readonly="isReadonlyView"
                />
                <el-select
                  v-else-if="scope.row.controlType === 2"
                  v-model="paramValues[scope.row.name]"
                  placeholder="请选择"
                  clearable
                  size="small"
                  :disabled="isReadonlyView"
                >
                  <el-option
                    v-for="opt in scope.row.selectArray || []"
                    :key="String(opt.Code)"
                    :label="opt.name"
                    :value="opt.Code"
                  />
                </el-select>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty
            v-else
            description="该处理器暂无参数配置"
            :image-size="80"
          />
        </template>

        <div class="form-footer">
          <el-button
            v-if="!isReadonlyView && isValueMapping && isMappingSqlMode"
            :loading="sqlValidateLoading"
            @click="handleValidateSql"
          >校验SQL</el-button>
          <el-button
            v-if="!isReadonlyView && isValueMapping && (isMappingDbDictMode || isMappingSqlMode)"
            :loading="mappingPreviewLoading"
            @click="handlePreviewData"
          >预览数据</el-button>
          <el-button
            v-if="!isReadonlyView && isJavaCustom"
            :loading="javaValidateLoading"
            @click="handleJavaScriptValidate"
          >校验java脚本</el-button>
          <el-button
            v-if="!isReadonlyView && isJavaCustom"
            @click="openJavaTestDialog"
          >测试</el-button>
          <el-button v-if="!isReadonlyView" type="primary" @click="handleSave">保存</el-button>
          <el-button @click="$router.back()">{{ isReadonlyView ? '返回' : '取消' }}</el-button>
        </div>
      </el-form>
    </div>

    <el-dialog
      :title="previewDialogTitle"
      :visible.sync="previewDialogVisible"
      width="760px"
      append-to-body
      class="rule-preview-dialog"
      @closed="resetPreviewDialog"
    >
      <div v-loading="previewDialogLoading" class="rule-preview-body">
        <el-table
          v-if="previewMode === 'table'"
          :data="previewTableRows"
          border
          stripe
          max-height="420"
          style="width: 100%;"
        >
          <el-table-column
            type="index"
            label="#"
            width="60"
          />
          <el-table-column
            v-for="col in previewTableColumns"
            :key="col"
            :prop="col"
            :label="col"
            min-width="150"
            show-overflow-tooltip
          />
        </el-table>
        <pre v-else class="preview-pre">{{ previewText }}</pre>
      </div>
    </el-dialog>

    <!-- Java 自定义：测试弹窗（示例数据 → previewJavaCode → 输出结果） -->
    <el-dialog
      title="测试Java规则"
      :visible.sync="javaTestDialogVisible"
      width="720px"
      top="5vh"
      append-to-body
      :close-on-click-modal="false"
      custom-class="java-test-rule-dialog"
      @closed="resetJavaTestDialog"
    >
      <div class="java-test-dialog-body">
        <el-form label-width="100px" size="small" @submit.native.prevent>
          <el-form-item>
            <template slot="label">
              <span class="req-mark">*</span>示例数据
            </template>
            <el-input
              v-model="javaTestSampleData"
              type="textarea"
              :rows="4"
              placeholder="请输入用于测试的示例数据（如单行文本或 JSON）"
              resize="vertical"
            />
          </el-form-item>
          <el-form-item label="JAVA代码">
            <div class="java-test-code-view" tabindex="-1" @keydown.prevent @paste.prevent>
              <pre class="java-test-code-pre">{{ ruleForm.javaCode || '（暂无代码）' }}</pre>
            </div>
          </el-form-item>
          <el-form-item label="输出结果">
            <el-input
              v-model="javaTestOutputResult"
              type="textarea"
              :rows="6"
              readonly
              resize="vertical"
              placeholder="点击「测试」后在此展示接口返回结果"
              class="java-test-output"
            />
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="java-test-dialog-footer">
        <el-button type="primary" :loading="javaTestRunLoading" @click="runJavaTestInDialog">
          测试
        </el-button>
        <el-button @click="javaTestDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { dict as processorDict } from '@/api/collect/rule/ruleProcessor'
import { tree as ruleGroupTree, regularGroupId as regularRuleGroupId } from '@/api/collect/rule/ruleGroup'
import { detail as processorDetail } from '@/api/collect/rule/ruleProcessor'
import { getDict } from '@/api/dict/dict'
import dictCode from '@/api/dict/dictCode'
import { relationalDbTree } from '@/api/database/database/dbGroup'
import { dbTableList, fieldList as dbFieldList } from '@/api/database/database/database'
import {
  addRule,
  updateRule,
  detail as ruleDetail,
  validateJavaCode,
  previewJavaCode,
  validateSql,
  previewRuleData,
  downloadValueMappingTemplate,
  importValueMappingTemplate
} from '@/api/collect/rule/rule'
import MarkdownEditor from '@/components/MarkdownEditor/index.vue'

export default {
  name: 'DataCleanRuleEdit',
  components: {
    MarkdownEditor
  },
  data() {
    return {
      ruleForm: {
        name: '',
        code: '',
        groupId: null,
        enabled: true,
        description: '',
        processorId: null,
        javaCode: '',
        mappingType: '',
        mappingSourceDbId: '',
        mappingDictTableId: '',
        mappingFromField: '',
        mappingToField: '',
        mappingSql: '',
        manualMappings: [],
        mappingFilter: {
          logic: 'ALL',
          items: []
        }
      },
      ruleRules: {
        name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
        groupId: [{ required: true, message: '请选择规则分组', trigger: 'change' }],
        processorId: [{ required: true, message: '请选择规则类型', trigger: 'change' }]
      },
      groupOptions: [],
      processorOptions: [],
      processorDetailData: null,
      ruleDetailData: null,
      processorConfigLoading: false,
      regularGroupId: null,
      dataTypeOptions: [],
      mappingTypeOptions: [],
      mappingSourceDbOptions: [],
      mappingTableOptions: [],
      mappingFieldOptions: [],
      mappingOperatorOptions: [
        { label: '=', value: '=' },
        { label: '>', value: '>' },
        { label: '<', value: '<' },
        { label: '>=', value: '>=' },
        { label: '<=', value: '<=' },
        { label: '!=', value: '!=' },
        { label: '以..开始', value: 'START_WITH' },
        { label: '以..结尾', value: 'END_WITH' },
        { label: '包含', value: 'CONTAINS' }
      ],
      paramValues: {},
      outputFieldTypeValue: null,
      javaValidateLoading: false,
      javaTestDialogVisible: false,
      javaTestSampleData: '',
      javaTestOutputResult: '',
      javaTestRunLoading: false,
      mappingPreviewLoading: false,
      sqlValidateLoading: false,
      previewDialogVisible: false,
      previewDialogTitle: '',
      previewDialogLoading: false,
      previewMode: 'text',
      previewTableRows: [],
      previewTableColumns: [],
      previewText: '',
      outputRenameTypeCode: ''
    }
  },
  computed: {
    currentProcessor() {
      return this.processorOptions.find(p => p.id === this.ruleForm.processorId) || null
    },
    currentConfig() {
      const detailConfig = this.processorDetailData && this.processorDetailData.paramsConfig
      const sourceConfig = detailConfig != null ? detailConfig : this.currentProcessor && this.currentProcessor.paramsConfig
      return this.parseParamsConfig(sourceConfig)
    },
    fieldList() {
      const cfg = this.currentConfig || {}
      const direct = cfg.fieldList || cfg.fields || cfg.paramList || cfg.params
      if (Array.isArray(direct)) return direct
      const detail = this.processorDetailData || {}
      const fromDetail = detail.fieldList || detail.fields || detail.paramList || detail.params
      if (Array.isArray(fromDetail)) return fromDetail
      return []
    },
    isJavaCustom() {
      const name = this.currentProcessor && this.currentProcessor.processorName
      return !!name && String(name).includes('Java自定义')
    },
    isValueMapping() {
      const name = this.currentProcessor && this.currentProcessor.processorName
      return !!name && String(name).includes('值映射')
    },
    outputFieldTypeOptions() {
      const fallback = (this.currentConfig && this.currentConfig.outputFieldType && this.currentConfig.outputFieldType.selectArray) || []
      if (Array.isArray(fallback) && fallback.length) {
        return fallback
          .map((opt) => {
            return this.toDictOption({
              code: opt && (opt.Code ?? opt.code ?? opt.id),
              value: opt && (opt.name ?? opt.label ?? opt.value ?? opt.Code)
            })
          })
          .filter(Boolean)
      }
      if (Array.isArray(this.dataTypeOptions) && this.dataTypeOptions.length) {
        return this.dataTypeOptions
      }
      return []
    },
    filteredMappingTypeOptions() {
      return (this.mappingTypeOptions || []).filter(
        (opt) => !String(opt.label || '').includes('标准库')
      )
    },
    currentMappingTypeLabel() {
      const hit = (this.filteredMappingTypeOptions || []).find(
        (opt) => String(opt.value) === String(this.ruleForm.mappingType || '')
      )
      return hit ? String(hit.label || '') : ''
    },
    isMappingDbDictMode() {
      const label = this.currentMappingTypeLabel
      return label.includes('字典') || label.includes('数据库')
    },
    isMappingSqlMode() {
      const label = this.currentMappingTypeLabel
      return label.toLowerCase().includes('sql')
    },
    isMappingManualMode() {
      const label = this.currentMappingTypeLabel
      return label.includes('手工')
    },
    isReadonlyView() {
      const q = this.$route && this.$route.query ? this.$route.query : {}
      return String(q.readonly || '').toLowerCase() === 'true'
    },
    detailProcessorName() {
      const d = this.ruleDetailData || {}
      return d.processorName || (this.currentProcessor && this.currentProcessor.processorName) || '-'
    },
    detailGroupName() {
      const d = this.ruleDetailData || {}
      if (d.groupName) return d.groupName
      const name = this.findGroupNameById(this.groupOptions, this.ruleForm.groupId)
      return name || '-'
    },
    isAdmin() {
      const roles = (this.$store && this.$store.getters && this.$store.getters.roles) || []
      return Array.isArray(roles) && roles.some(r => String(r).toLowerCase() === 'admin')
    },
    isCreateMode() {
      const id = this.$route && this.$route.query ? this.$route.query.id : ''
      return !id
    },
    ruleGroupOptionsForSelect() {
      if (!this.isCreateMode) return this.groupOptions
      return this.filterRuleGroupTreeByPermission(this.groupOptions || [])
    },
    pageTitle() {
      if (this.isReadonlyView) return '规则详情'
      return this.isCreateMode ? '新建规则' : '编辑规则'
    },
    pageSubtitle() {
      if (this.isReadonlyView) return '查看规则基础信息'
      return '配置规则基础信息与处理参数'
    },
    /** 是否展示「返回值类型」下拉（模板声明 rename 类型 / 值映射 / Java 等） */
    showOutputFieldTypeSection() {
      if (!this.currentProcessor) return false
      if (this.currentConfig && this.currentConfig.outputFieldType) return true
      if (this.isValueMapping) return true
      if (this.isJavaCustom) return true
      return false
    },
    outputFieldTypeLabelRequired() {
      return this.showOutputFieldTypeSection
    },
    /**
     * 处理器模板参数表（参数值列）。
     * Java 自定义无动态参数表，不展示本表。
     * 值映射：与历史逻辑一致，仅在「数据库字典」「自定义 SQL」两种配置方式下隐藏（手工配置等仍展示）。
     */
    showLegacyProcessorParamSection() {
      if (!this.currentProcessor || this.isJavaCustom) return false
      if (this.isValueMapping && (this.isMappingDbDictMode || this.isMappingSqlMode)) return false
      return true
    },
    /** 模板 fieldList 中与顶部「返回值类型」重复的一行，不在下方参数表里再展示 */
    displayLegacyParamFieldList() {
      const list = this.fieldList || []
      return list.filter((f) => !this.isEmbeddedOutputFieldRow(f))
    },
    /** 是否渲染下方处理器参数区域（避免仅剩「输出字段类型」行时出现重复或空白块） */
    showLegacyProcessorParamBlock() {
      if (!this.currentProcessor || !this.showLegacyProcessorParamSection) return false
      const raw = this.fieldList || []
      const shown = this.displayLegacyParamFieldList || []
      if (this.isValueMapping) {
        if (!raw.length) return false
        if (!shown.length) return false
        return true
      }
      if (!raw.length) return true
      if (!shown.length) return false
      return true
    }
  },
  async created() {
    await Promise.all([
      this.queryGroupOptions(),
      this.queryProcessorOptions(),
      this.queryDataTypeDict(),
      this.queryMappingTypeDict(),
      this.queryRegularGroupId()
    ])
    await this.initRuleDetailIfNeeded()
  },
  methods: {
    /** 是否与表单顶部「返回值类型」为同一配置项（模板常把其放在 fieldList 里） */
    isEmbeddedOutputFieldRow(f) {
      if (!f) return false
      const name = String(f.name || '')
      if (name === 'outputFieldType') return true
      const oft = this.currentConfig && this.currentConfig.outputFieldType
      if (oft && oft.name != null && String(oft.name) !== '' && name === String(oft.name)) return true
      const desc = String(f.description || '')
      if (desc === '输出字段类型') return true
      return false
    },
    findGroupNameById(nodes, id) {
      for (const node of nodes || []) {
        if (!node) continue
        if (String(node.id) === String(id)) return node.name
        if (Array.isArray(node.children) && node.children.length) {
          const hit = this.findGroupNameById(node.children, id)
          if (hit) return hit
        }
      }
      return ''
    },
    classifyRootTypeByName(name) {
      const n = String(name || '')
      if (n.includes('通用')) return 'GENERAL'
      if (n.includes('公共')) return 'PUBLIC'
      if (n.includes('自定义')) return 'CUSTOM'
      return 'OTHER'
    },
    filterRuleGroupTreeByPermission(nodes, rootType = null) {
      const out = []
      ;(nodes || []).forEach((node) => {
        if (!node) return
        const currentRootType = rootType || this.classifyRootTypeByName(node.name)
        if (this.regularGroupId != null) {
          const groupId = Number(node.id)
          if (rootType == null && groupId === Number(this.regularGroupId)) return
          if (rootType === 'GENERAL') return
        } else if (currentRootType === 'GENERAL') {
          return
        }
        if (rootType == null) {
          if (this.isAdmin) {
            if (!(currentRootType === 'PUBLIC' || currentRootType === 'CUSTOM')) return
          } else if (currentRootType !== 'CUSTOM') {
            return
          }
        }
        const cloned = { ...node }
        if (Array.isArray(node.children) && node.children.length) {
          cloned.children = this.filterRuleGroupTreeByPermission(node.children, currentRootType)
        }
        out.push(cloned)
      })
      return out
    },
    findRootTypeById(nodes, id, rootType = null) {
      for (const node of nodes || []) {
        if (!node) continue
        const currentRootType = rootType || this.classifyRootTypeByName(node.name)
        if (node.id === id) return currentRootType
        if (Array.isArray(node.children) && node.children.length) {
          const hit = this.findRootTypeById(node.children, id, currentRootType)
          if (hit) return hit
        }
      }
      return null
    },
    findRootGroupIdById(nodes, id, rootId = null) {
      for (const node of nodes || []) {
        if (!node) continue
        const currentRootId = rootId != null ? rootId : node.id
        if (node.id === id) return currentRootId
        if (Array.isArray(node.children) && node.children.length) {
          const hit = this.findRootGroupIdById(node.children, id, currentRootId)
          if (hit != null) return hit
        }
      }
      return null
    },
    async initRuleDetailIfNeeded() {
      const id = this.$route && this.$route.query ? this.$route.query.id : ''
      if (!id) return
      try {
        const res = await ruleDetail(id)
        const data = (res && res.data) || {}
        const releasedConfig = this.parseReleasedConfig(data.releasedConfig)
        const configJson = this.parseReleasedConfig(data.config)
        const runtimeConfig = configJson || releasedConfig
        this.ruleDetailData = data
        this.ruleForm.id = data.id || data.ruleId || id
        this.ruleForm.name = data.ruleName || data.name || ''
        this.ruleForm.code = data.ruleCode || data.code || ''
        this.ruleForm.groupId = data.groupId != null ? Number(data.groupId) : null
        this.ruleForm.enabled = data.status != null ? Boolean(data.status) : (data.enabled != null ? Boolean(data.enabled) : true)
        this.ruleForm.description = data.ruleDescription || data.description || data.ruleDesc || ''
        const processorIdFromConfig =
          runtimeConfig && (runtimeConfig.processorId != null
            ? runtimeConfig.processorId
            : (runtimeConfig.ruleProcessorId != null ? runtimeConfig.ruleProcessorId : null))
        const processorIdFromRule = data.ruleProcessorId != null ? data.ruleProcessorId : data.processorId
        this.ruleForm.processorId = processorIdFromConfig != null
          ? Number(processorIdFromConfig)
          : (processorIdFromRule != null ? Number(processorIdFromRule) : null)
        if (this.ruleForm.processorId) {
          await this.handleProcessorChange(this.ruleForm.processorId)
        }
        await this.applyReleasedConfig(runtimeConfig, data)
      } catch (e) {
        this.$message.warning('加载规则详情失败')
      }
    },
    parseReleasedConfig(raw) {
      if (!raw) return null
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        return parsed && typeof parsed === 'object' ? parsed : null
      } catch (e) {
        return null
      }
    },
    async applyReleasedConfig(releasedConfig, detailData = {}) {
      const cfgRoot = releasedConfig && typeof releasedConfig === 'object' ? releasedConfig : {}
      const cfg = cfgRoot.data && typeof cfgRoot.data === 'object' ? cfgRoot.data : cfgRoot
      const source = detailData && typeof detailData === 'object' ? detailData : {}

      if (cfg.javaCode != null || source.javaCode != null) {
        this.ruleForm.javaCode = String(cfg.javaCode != null ? cfg.javaCode : source.javaCode || '')
      }

      const paramsFromCfg = cfg.params && typeof cfg.params === 'object' ? cfg.params : null
      const paramsFromDetail = source.params && typeof source.params === 'object' ? source.params : null
      const paramsFromCfgFieldList = Array.isArray(cfg.fieldList)
        ? cfg.fieldList.reduce((acc, item) => {
          if (!item || item.name == null) return acc
          acc[item.name] = item.value != null ? item.value : ''
          return acc
        }, {})
        : null
      if (paramsFromCfg || paramsFromDetail) {
        this.paramValues = {
          ...this.paramValues,
          ...(paramsFromDetail || {}),
          ...(paramsFromCfg || {})
        }
      }
      if (paramsFromCfgFieldList) {
        this.paramValues = {
          ...this.paramValues,
          ...paramsFromCfgFieldList
        }
      }

      const outputType = cfg.outputFieldType != null ? cfg.outputFieldType : source.outputFieldType
      let outputTypeVal =
        outputType && typeof outputType === 'object'
          ? (outputType.value != null && outputType.value !== ''
            ? outputType.value
            : outputType.dataType)
          : outputType
      if (
        (outputTypeVal == null || outputTypeVal === '') &&
        source.outputFieldType != null &&
        typeof source.outputFieldType !== 'object'
      ) {
        outputTypeVal = source.outputFieldType
      }
      if (outputTypeVal != null && outputTypeVal !== '') {
        this.outputFieldTypeValue = this.normalizeOutputFieldTypeToCode(outputTypeVal)
        this.outputRenameTypeCode = this.mapOutputFieldTypeToDataTypeCode(this.outputFieldTypeValue)
      } else {
        const renameTypeRaw = cfg.renameType != null ? cfg.renameType : source.renameType
        if (renameTypeRaw != null && renameTypeRaw !== '') {
          this.outputFieldTypeValue = this.normalizeOutputFieldTypeToCode(renameTypeRaw)
          this.outputRenameTypeCode = this.mapOutputFieldTypeToDataTypeCode(this.outputFieldTypeValue)
        } else {
          this.outputRenameTypeCode = ''
        }
      }

      const mappingKeys = [
        'mappingType',
        'mappingSourceDbId',
        'mappingDictTableId',
        'mappingFromField',
        'mappingToField',
        'mappingSql'
      ]
      mappingKeys.forEach((key) => {
        const val = cfg[key] != null ? cfg[key] : source[key]
        if (val != null) {
          this.ruleForm[key] = String(val)
        }
      })
      const dataSourceId = cfg.dataSourceId != null ? cfg.dataSourceId : source.dataSourceId
      if (dataSourceId != null) {
        this.ruleForm.mappingSourceDbId = String(dataSourceId)
      }
      const sqlContext = cfg.sqlContext != null ? cfg.sqlContext : source.sqlContext
      if (sqlContext != null) {
        this.ruleForm.mappingSql = String(sqlContext)
      }

      const manualMappings = Array.isArray(cfg.manualMappings)
        ? cfg.manualMappings
        : (Array.isArray(source.manualMappings) ? source.manualMappings : null)
      if (manualMappings) {
        this.ruleForm.manualMappings = manualMappings.map((row) => ({
          fromValue: row && row.fromValue != null ? String(row.fromValue) : '',
          toValue: row && row.toValue != null ? String(row.toValue) : '',
          remark: row && row.remark != null ? String(row.remark) : ''
        }))
      }
      // 值映射-手工配置：兼容后端使用 fieldList 结构回显（勿用于 Java 等非值映射规则）
      if (
        this.isValueMapping &&
        (!manualMappings || !manualMappings.length) &&
        Array.isArray(cfg.fieldList) &&
        cfg.fieldList.length
      ) {
        this.ruleForm.manualMappings = cfg.fieldList.map((row) => ({
          fromValue: row && row.code != null ? String(row.code) : '',
          toValue: row && row.valueName != null ? String(row.valueName) : '',
          remark: row && row.name != null ? String(row.name) : ''
        }))
      }

      const mappingFilter = cfg.mappingFilter || source.mappingFilter || cfg.condition || source.condition
      if (mappingFilter && typeof mappingFilter === 'object') {
        const conditionGroups = Array.isArray(mappingFilter.conditionGroups) ? mappingFilter.conditionGroups : null
        this.ruleForm.mappingFilter = {
          logic: mappingFilter.logic || mappingFilter.condition || 'ALL',
          items: Array.isArray(mappingFilter.items) ? mappingFilter.items : (conditionGroups || [])
        }
      }

      const savedSourceDbId = this.ruleForm.mappingSourceDbId
      const savedTableId = this.ruleForm.mappingDictTableId
      const savedFromField = this.ruleForm.mappingFromField
      const savedToField = this.ruleForm.mappingToField
      if (savedSourceDbId) {
        await this.handleMappingSourceChange(savedSourceDbId)
        this.ruleForm.mappingSourceDbId = savedSourceDbId
        this.ruleForm.mappingDictTableId = savedTableId
        this.ruleForm.mappingFromField = savedFromField
        this.ruleForm.mappingToField = savedToField
      }
      if (savedTableId) {
        await this.handleMappingTableChange(savedTableId)
        this.ruleForm.mappingDictTableId = savedTableId
        this.ruleForm.mappingFromField = savedFromField
        this.ruleForm.mappingToField = savedToField
      }
    },
    normalizeOutputFieldTypeToCode(raw) {
      if (raw == null || raw === '') return null
      const s = String(raw).trim()
      const opts = this.outputFieldTypeOptions || []
      const byValue = opts.find((o) => String(o.value) === s)
      if (byValue) return String(byValue.value)
      const byLabel = opts.find((o) => String(o.label).trim() === s)
      if (byLabel) return String(byLabel.value)
      return s
    },
    mapOutputFieldTypeToDataTypeCode(raw) {
      if (raw == null || raw === '') return ''
      const selected = String(raw).trim()
      const outputOpt = (this.outputFieldTypeOptions || []).find(
        (o) => String(o.value) === selected
      )
      const selectedLabel = outputOpt ? String(outputOpt.label || '') : ''
      const hit = (this.dataTypeOptions || []).find((d) => {
        const dv = String(d.value || '').trim()
        const dl = String(d.label || '').trim()
        return (
          dv === selected ||
          dl === selected ||
          (selectedLabel && (dv === selectedLabel || dl === selectedLabel))
        )
      })
      return hit ? String(hit.value) : selected
    },
    getDefaultStringOutputTypeCode() {
      const opts = this.dataTypeOptions || []
      if (!opts.length) return ''
      const hit = opts.find((o) => {
        const v = String(o.value || '').toLowerCase()
        const l = String(o.label || '').toLowerCase()
        return l === 'string' || l.includes('字符串') || v === 'string'
      })
      if (hit) return String(hit.value)
      return String((opts[0] && opts[0].value) || '')
    },
    handleOutputFieldTypeChange(value) {
      this.outputRenameTypeCode = this.mapOutputFieldTypeToDataTypeCode(value)
    },
    toDictOption(item) {
      // 展示优先使用字典项 name/label，避免下拉显示 code
      const labelRaw = item && (item.name ?? item.label ?? item.value ?? item.code)
      const valueRaw = item && (item.code ?? item.id ?? item.value)
      if (valueRaw == null || labelRaw == null) return null
      return { value: String(valueRaw), label: String(labelRaw) }
    },
    parseParamsConfig(paramsConfig) {
      if (!paramsConfig) return {}
      try {
        const parsed = typeof paramsConfig === 'string' ? JSON.parse(paramsConfig) : paramsConfig
        if (!parsed || typeof parsed !== 'object') return {}
        if (parsed.data && typeof parsed.data === 'object') return parsed.data
        if (parsed.config && typeof parsed.config === 'object') return parsed.config
        if (parsed.paramsConfig && typeof parsed.paramsConfig === 'object') return parsed.paramsConfig
        return parsed
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('解析 paramsConfig 失败', e)
        return {}
      }
    },
    formatGroupOptions(data) {
      return (data || [])
        .filter(item => item && item.type === 'GROUP')
        .map(item => {
          const node = { id: item.id, name: item.name }
          if (Array.isArray(item.children) && item.children.length > 0) {
            const children = this.formatGroupOptions(item.children)
            if (children.length) node.children = children
          }
          return node
        })
    },
    async queryGroupOptions() {
      try {
        const res = await ruleGroupTree('')
        this.groupOptions = this.formatGroupOptions((res && res.data) || [])
      } catch (e) {
        this.groupOptions = []
      }
    },
    async queryProcessorOptions() {
      try {
        const res = await processorDict()
        this.processorOptions = (res && res.data) || []
      } catch (e) {
        this.processorOptions = []
      }
    },
    async queryRegularGroupId() {
      try {
        const res = await regularRuleGroupId()
        this.regularGroupId = res && res.data != null ? Number(res.data) : null
      } catch (e) {
        this.regularGroupId = null
      }
    },
    async queryDataTypeDict() {
      try {
        const res = await getDict(dictCode.DATA_TYPE)
        const items = Array.isArray(res && res.data) ? res.data : []
        this.dataTypeOptions = items
          .map((item) => this.toDictOption(item))
          .filter(Boolean)
      } catch (e) {
        this.dataTypeOptions = []
      }
    },
    async queryMappingTypeDict() {
      try {
        const res = await getDict(dictCode.MAPPING_TYPE)
        const items = Array.isArray(res && res.data) ? res.data : []
        this.mappingTypeOptions = items
          .map((item) => this.toDictOption(item))
          .filter(Boolean)
      } catch (e) {
        this.mappingTypeOptions = []
      }
    },
    async queryMappingSourceDbOptions() {
      try {
        const res = await relationalDbTree()
        const list = Array.isArray(res && res.data) ? res.data : []
        const flat = []
        list.forEach((group) => {
          (group.children || []).forEach((db) => {
            flat.push({
              value: String(db.id),
              label: `${db.name}${group.name ? ` (${group.name})` : ''}`
            })
          })
        })
        this.mappingSourceDbOptions = flat
      } catch (e) {
        this.mappingSourceDbOptions = []
      }
    },
    async handleMappingSourceChange(dbId) {
      this.ruleForm.mappingDictTableId = ''
      this.ruleForm.mappingFromField = ''
      this.ruleForm.mappingToField = ''
      this.mappingFieldOptions = []
      if (!dbId) {
        this.mappingTableOptions = []
        return
      }
      try {
        const res = await dbTableList(dbId)
        const list = Array.isArray(res && res.data) ? res.data : []
        this.mappingTableOptions = list.map((tb) => ({
          value: String(tb.id),
          label: String(tb.name || tb.tableName || tb.value || tb.id)
        }))
      } catch (e) {
        this.mappingTableOptions = []
      }
    },
    async handleMappingTableChange(tableId) {
      this.ruleForm.mappingFromField = ''
      this.ruleForm.mappingToField = ''
      if (!tableId) {
        this.mappingFieldOptions = []
        return
      }
      try {
        const res = await dbFieldList(tableId)
        const list = Array.isArray(res && res.data) ? res.data : []
        this.mappingFieldOptions = list.map((fd) => ({
          value: String(fd.name || fd.fieldName || fd.id),
          label: String(fd.name || fd.fieldName || fd.label || fd.id)
        }))
      } catch (e) {
        this.mappingFieldOptions = []
      }
    },
    createMappingCondition() {
      return {
        id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'condition',
        field: '',
        operator: '=',
        value: ''
      }
    },
    createMappingGroup() {
      return {
        id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'group',
        logic: 'ALL',
        conditions: [this.createMappingCondition()]
      }
    },
    handleAddRootFilter(command) {
      if (command === 'group') {
        this.ruleForm.mappingFilter.items.push(this.createMappingGroup())
      } else {
        this.ruleForm.mappingFilter.items.push(this.createMappingCondition())
      }
    },
    removeRootFilter(index) {
      this.ruleForm.mappingFilter.items.splice(index, 1)
    },
    addGroupCondition(group) {
      group.conditions.push(this.createMappingCondition())
    },
    removeGroupCondition(group, index) {
      group.conditions.splice(index, 1)
    },
    async loadProcessorDetail(processorId) {
      if (!processorId) {
        this.processorDetailData = null
        return
      }
      this.processorConfigLoading = true
      try {
        const res = await processorDetail(processorId)
        const raw = (res && res.data) || null
        this.processorDetailData =
          raw && raw.paramsConfig == null && raw.data && typeof raw.data === 'object'
            ? raw.data
            : raw
      } catch (e) {
        this.processorDetailData = null
        this.$message.warning('获取处理器配置失败')
      } finally {
        this.processorConfigLoading = false
      }
    },
    async handleProcessorChange(value) {
      await this.loadProcessorDetail(value || this.ruleForm.processorId)
      // 重置参数值
      this.paramValues = {}
      const javaCodeFromConfig = this.currentConfig && this.currentConfig.javaCode
      if (this.isJavaCustom) {
        this.ruleForm.javaCode =
          javaCodeFromConfig != null ? String(javaCodeFromConfig) : ''
      } else {
        this.ruleForm.javaCode = ''
      }
      if (this.isValueMapping) {
        if (!this.ruleForm.mappingType) {
          const first = (this.filteredMappingTypeOptions || [])[0]
          this.ruleForm.mappingType = first ? first.value : ''
        }
        if (!Array.isArray(this.ruleForm.manualMappings)) {
          this.ruleForm.manualMappings = []
        }
        if (this.ruleForm.manualMappings.length === 0) {
          this.addManualMappingRow()
        }
        this.queryMappingSourceDbOptions()
      } else {
        this.ruleForm.mappingType = ''
        this.ruleForm.mappingSourceDbId = ''
        this.ruleForm.mappingDictTableId = ''
        this.ruleForm.mappingFromField = ''
        this.ruleForm.mappingToField = ''
        this.ruleForm.mappingSql = ''
        this.ruleForm.manualMappings = []
        this.ruleForm.mappingFilter = { logic: 'ALL', items: [] }
        this.mappingTableOptions = []
        this.mappingFieldOptions = []
      }
      const list = this.fieldList || []
      list.forEach(f => {
        this.$set(this.paramValues, f.name, f.value != null ? f.value : '')
      })
      const outputCfg = this.currentConfig && this.currentConfig.outputFieldType
      const outputSelectArray = Array.isArray(outputCfg && outputCfg.selectArray) ? outputCfg.selectArray : []
      // 新建规则：每次切换规则类型后，若无 selectArray 则默认 String；有 selectArray 则置空让用户选
      if (this.isCreateMode && !this.isReadonlyView) {
        if (outputSelectArray.length > 0) {
          this.outputFieldTypeValue = null
          this.outputRenameTypeCode = ''
        } else {
          const defaultStringCode = this.getDefaultStringOutputTypeCode()
          this.outputFieldTypeValue = defaultStringCode || null
          this.outputRenameTypeCode = this.mapOutputFieldTypeToDataTypeCode(this.outputFieldTypeValue)
        }
        return
      }
      if (this.currentConfig.outputFieldType) {
        const oft = this.currentConfig.outputFieldType
        const raw =
          oft.dataType != null && oft.dataType !== ''
            ? oft.dataType
            : oft.value
        this.outputFieldTypeValue =
          raw != null && raw !== ''
            ? this.normalizeOutputFieldTypeToCode(raw)
            : null
        this.outputRenameTypeCode = this.mapOutputFieldTypeToDataTypeCode(this.outputFieldTypeValue)
      } else if (this.isJavaCustom || this.isValueMapping) {
        this.outputFieldTypeValue = null
        this.outputRenameTypeCode = ''
      } else {
        this.outputFieldTypeValue = null
        this.outputRenameTypeCode = ''
      }
    },
    addManualMappingRow() {
      this.ruleForm.manualMappings.push({
        fromValue: '',
        toValue: '',
        remark: ''
      })
    },
    removeManualMappingRow(index) {
      this.ruleForm.manualMappings.splice(index, 1)
    },
    triggerManualMappingImport() {
      if (this.$refs.mappingImportInput) {
        this.$refs.mappingImportInput.value = ''
        this.$refs.mappingImportInput.click()
      }
    },
    async handleManualMappingImport(e) {
      const file = e && e.target && e.target.files && e.target.files[0]
      if (!file) return
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await importValueMappingTemplate(formData)
        if (res && String(res.code) === '999999') return
        if (this.applyImportedManualMappings(res && res.data)) {
          this.$message.success(
            (res && res.message) ? String(res.message) : '模板导入成功'
          )
        }
      } catch (err) {
        if (err && (String(err.code) === '999999' || Number(err.code) === 999999)) return
        this.$message.warning((err && err.message) ? String(err.message) : '模板导入失败')
      } finally {
        if (this.$refs.mappingImportInput) {
          this.$refs.mappingImportInput.value = ''
        }
      }
    },
    applyImportedManualMappings(data) {
      const findFirstArray = (root, depth = 6) => {
        if (Array.isArray(root)) return root
        if (!root || typeof root !== 'object' || depth <= 0) return null
        for (const k of Object.keys(root)) {
          const v = root[k]
          const hit = findFirstArray(v, depth - 1)
          if (Array.isArray(hit)) return hit
        }
        return null
      }

      const raw = findFirstArray(data, 8)
      if (!Array.isArray(raw) || !raw.length) {
        this.$message.warning('导入结果为空，请检查模板内容')
        return false
      }

      const getCaseInsensitive = (obj, keys) => {
        if (!obj || typeof obj !== 'object') return null
        const map = {}
        Object.keys(obj).forEach((k) => {
          map[String(k).toLowerCase()] = obj[k]
        })
        for (const cand of keys) {
          const hit = map[String(cand).toLowerCase()]
          if (hit != null) return hit
        }
        return null
      }

      const mapRow = (row) => {
        // row 可能是 [from,to,remark] 这种数组
        if (Array.isArray(row)) {
          return {
            fromValue: row[0] != null ? String(row[0]) : '',
            toValue: row[1] != null ? String(row[1]) : '',
            remark: row[2] != null ? String(row[2]) : ''
          }
        }
        // row 可能是对象：code/valueName/name 或 fromValue/toValue/remark
        if (row && typeof row === 'object') {
          const fromValue = getCaseInsensitive(row, [
            '0', // importTemplate.do 返回：0=转换前
            'fromValue',
            'FromValue',
            'code',
            'Code',
            'from',
            'From',
            'oldValue',
            'OldValue',
            'valueBefore',
            'ValueBefore'
          ])
          const toValue = getCaseInsensitive(row, [
            '1', // importTemplate.do 返回：1=转换后
            'toValue',
            'ToValue',
            'valueName',
            'ValueName',
            'value',
            'Value',
            'to',
            'To',
            'newValue',
            'NewValue',
            'valueAfter',
            'ValueAfter'
          ])
          const remark = getCaseInsensitive(row, [
            '2', // importTemplate.do 返回：2=说明
            'remark',
            'Remark',
            'name',
            'Name',
            'remarkName',
            'RemarkName',
            'desc',
            'Desc',
            'description',
            'Description'
          ])
          return {
            fromValue: fromValue != null ? String(fromValue) : '',
            toValue: toValue != null ? String(toValue) : '',
            remark: remark != null ? String(remark) : ''
          }
        }
        return { fromValue: '', toValue: '', remark: '' }
      }

      this.ruleForm.manualMappings = raw.map(mapRow)
      return true
    },
    async downloadManualMappingTemplate() {
      try {
        const response = await downloadValueMappingTemplate()
        const blob = response && response.data
        if (!(blob instanceof Blob)) {
          this.$message.warning('模板下载失败')
          return
        }
        if (blob.type && String(blob.type).indexOf('application/json') !== -1) {
          const text = await blob.text()
          try {
            const j = JSON.parse(text)
            if (j && (String(j.code) === '999999' || j.message)) {
              this.$message.warning(j.message || '模板下载失败')
              return
            }
          } catch (parseErr) {
            this.$message.warning('模板下载失败')
            return
          }
        }
        const disposition =
          (response.headers && response.headers['content-disposition']) || ''
        let filename = '值映射导入模板.xlsx'
        const utf8Match = /filename\*=UTF-8''([^;\n]+)/i.exec(disposition)
        const asciiMatch = /filename="([^"]+)"/i.exec(disposition) ||
          /filename=([^;\n]+)/i.exec(disposition)
        if (utf8Match && utf8Match[1]) {
          filename = decodeURIComponent(utf8Match[1].replace(/"/g, '').trim())
        } else if (asciiMatch && asciiMatch[1]) {
          filename = asciiMatch[1].replace(/"/g, '').trim()
        }
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        this.$message.success('模板下载成功')
      } catch (err) {
        this.$message.warning((err && err.message) ? String(err.message) : '模板下载失败')
      }
    },
    /**
     * 与后端 @RequestBody JSONObject 对齐：规则校验 / 预览 / 保存共用（避免展开 ruleForm 带入多余字段）
     */
    buildRulePersistPayload() {
      const mappingTable = (this.mappingTableOptions || []).find(
        (tb) => String(tb.value) === String(this.ruleForm.mappingDictTableId || '')
      )
      const outputFieldTypeConfig = this.currentConfig && this.currentConfig.outputFieldType
        ? {
          ...this.currentConfig.outputFieldType,
          description: '返回值类型',
          dataType: this.outputFieldTypeValue != null ? this.outputFieldTypeValue : (this.currentConfig.outputFieldType.dataType || ''),
          value: this.outputFieldTypeValue != null ? this.outputFieldTypeValue : (this.currentConfig.outputFieldType.value || '')
        }
        : {
          name: 'outputFieldType',
          description: '返回值类型',
          dataType: this.outputFieldTypeValue,
          value: this.outputFieldTypeValue,
          controlType: 2,
          selectArray: (this.outputFieldTypeOptions || []).map(opt => ({ name: opt.label, Code: opt.value }))
        }
      const manualFieldList = (this.ruleForm.manualMappings || []).map((row) => ({
        code: row && row.fromValue != null ? String(row.fromValue) : '',
        valueName: row && row.toValue != null ? String(row.toValue) : '',
        name: row && row.remark != null ? String(row.remark) : ''
      }))
      // 预览接口（值映射）只关心 mappingType = 1(数据库字典) / 2(自定义SQL)
      // mappingType==1 需要 beforefieldName/afterfieldName/tableName/condition
      const previewMappingType = this.isMappingSqlMode ? 2 : 1
      const dataSourceIdNum = this.ruleForm.mappingSourceDbId != null && this.ruleForm.mappingSourceDbId !== ''
        ? Number(this.ruleForm.mappingSourceDbId)
        : null
      const tableIdNum = this.ruleForm.mappingDictTableId != null && this.ruleForm.mappingDictTableId !== ''
        ? Number(this.ruleForm.mappingDictTableId)
        : null
      const configData = {
        value: this.ruleForm.value || '',
        // 为了兼容后端 preview() 的 JSONObject.getInteger("mappingType")，这里必须是 number
        mappingType: this.isValueMapping ? previewMappingType : this.ruleForm.mappingType,
        dataSourceId: this.isValueMapping ? dataSourceIdNum : this.ruleForm.mappingSourceDbId,
        sqlContext: this.isValueMapping && previewMappingType === 2 ? this.ruleForm.mappingSql : this.ruleForm.mappingSql,

        // mappingType==1：数据库字典/可视化映射，后端需要以下字段
        ...(this.isValueMapping && previewMappingType === 1
          ? {
            beforefieldName: this.ruleForm.mappingFromField,
            afterfieldName: this.ruleForm.mappingToField,
            tableName: mappingTable ? mappingTable.label : '',
            tableId: tableIdNum,
            beforefieldId: this.ruleForm.mappingFromField,
            afterfieldId: this.ruleForm.mappingToField
          }
          : {}),

        // mappingType==2：自定义SQL，后端需要 sqlContext（controller 走 mappingType!=1 分支）

        rename: this.isValueMapping ? (this.ruleForm.mappingFromField || '') : '',
        renameType: this.isValueMapping
          ? (this.ruleForm.mappingToField || '')
          : ((this.outputRenameTypeCode != null && this.outputRenameTypeCode !== '')
            ? String(this.outputRenameTypeCode)
            : (this.outputFieldTypeValue != null ? String(this.outputFieldTypeValue) : '')),
        fieldList: this.isValueMapping
          ? (this.isMappingManualMode ? manualFieldList : [])
          : this.isJavaCustom
            ? []
            : (this.fieldList || []).map((f) => ({
              ...f,
              value: this.isEmbeddedOutputFieldRow(f)
                ? (this.outputFieldTypeValue != null ? String(this.outputFieldTypeValue) : '')
                : (this.paramValues[f.name] != null ? this.paramValues[f.name] : '')
            })),
        condition: {
          conditionGroups: this.ruleForm.mappingFilter && Array.isArray(this.ruleForm.mappingFilter.items)
            ? this.ruleForm.mappingFilter.items
            : [],
          condition: this.ruleForm.mappingFilter && this.ruleForm.mappingFilter.logic
            ? this.ruleForm.mappingFilter.logic
            : 'ALL'
        },
        outputFieldType: outputFieldTypeConfig,
        javaCode: this.ruleForm.javaCode
      }
      const routeQuery = this.$route && this.$route.query ? this.$route.query : {}
      const routeId = routeQuery.id
      const mappingFilterPlain = this.ruleForm.mappingFilter
        ? JSON.parse(JSON.stringify(this.ruleForm.mappingFilter))
        : { logic: 'ALL', items: [] }
      return {
        id:
          this.ruleForm.id != null && this.ruleForm.id !== ''
            ? this.ruleForm.id
            : (routeId || undefined),
        ruleName: this.ruleForm.name,
        ruleCode: this.ruleForm.code,
        ruleDescription: this.ruleForm.description,
        name: this.ruleForm.name,
        code: this.ruleForm.code,
        description: this.ruleForm.description,
        ruleProcessorId: this.ruleForm.processorId,
        processorId: this.ruleForm.processorId,
        groupId: this.ruleForm.groupId,
        enabled: this.ruleForm.enabled,
        status: this.ruleForm.enabled,
        mappingType: this.ruleForm.mappingType,
        mappingSourceDbId: this.ruleForm.mappingSourceDbId,
        mappingDictTableId: this.ruleForm.mappingDictTableId,
        mappingFromField: this.ruleForm.mappingFromField,
        mappingToField: this.ruleForm.mappingToField,
        mappingDictName: mappingTable ? mappingTable.label : '',
        manualMappings: this.ruleForm.manualMappings || [],
        mappingFilter: mappingFilterPlain,
        dataSourceId: this.ruleForm.mappingSourceDbId,
        sqlContext: this.ruleForm.mappingSql,
        condition: configData.condition,
        params: { ...this.paramValues },
        outputFieldType: this.outputFieldTypeValue,
        javaCode: this.ruleForm.javaCode,
        config: JSON.stringify({ data: configData })
      }
    },
    resetPreviewDialog() {
      this.previewDialogTitle = ''
      this.previewDialogLoading = false
      this.previewMode = 'text'
      this.previewTableRows = []
      this.previewTableColumns = []
      this.previewText = ''
    },
    /**
     * 将接口返回的 data 规整为表格或文本展示（兼容 list / rows / records 等常见字段）
     */
    normalizePreviewData(raw) {
      if (raw == null) {
        return { mode: 'text', text: '无数据' }
      }
      // 适配参考表输入组件的数据返回结构：{ fieldList: string[], dataList: any[] }
      // dataList 可能是二维数组（按字段顺序对应），也可能是对象数组
      if (
        raw &&
        typeof raw === 'object' &&
        Array.isArray(raw.fieldList) &&
        Array.isArray(raw.dataList)
      ) {
        const columns = raw.fieldList
        const dataList = raw.dataList || []
        if (dataList.length === 0) return { mode: 'table', rows: [], columns }

        // 二维数组 -> 对象数组（el-table 更好展示）
        if (Array.isArray(dataList[0])) {
          const rows = dataList.map((rowArr) => {
            const obj = {}
            columns.forEach((field, idx) => {
              obj[field] = rowArr ? rowArr[idx] : undefined
            })
            return obj
          })
          return { mode: 'table', rows, columns }
        }

        // 已经是对象数组
        return { mode: 'table', rows: dataList, columns }
      }
      if (Array.isArray(raw)) {
        if (raw.length === 0) {
          return { mode: 'text', text: '暂无数据' }
        }
        if (typeof raw[0] === 'object' && raw[0] !== null && !Array.isArray(raw[0])) {
          return {
            mode: 'table',
            rows: raw,
            columns: Object.keys(raw[0])
          }
        }
        return { mode: 'text', text: raw.map((x) => String(x)).join('\n') }
      }
      if (typeof raw === 'object') {
        const inner =
          raw.list || raw.rows || raw.records || raw.items || raw.data
        if (Array.isArray(inner)) {
          return this.normalizePreviewData(inner)
        }
        return { mode: 'text', text: JSON.stringify(raw, null, 2) }
      }
      return { mode: 'text', text: String(raw) }
    },
    showPreviewDialog(title, rawData) {
      const norm = this.normalizePreviewData(rawData)
      this.previewDialogTitle = title
      if (norm.mode === 'table') {
        this.previewMode = 'table'
        this.previewTableRows = norm.rows
        this.previewTableColumns = norm.columns || []
        this.previewText = ''
      } else {
        this.previewMode = 'text'
        this.previewText = norm.text || ''
        this.previewTableRows = []
        this.previewTableColumns = []
      }
      this.previewDialogVisible = true
    },
    /** 原「测试」：调用 validateJavaCode，现由「校验java脚本」触发 */
    async handleJavaScriptValidate() {
      if (!this.isJavaCustom) return
      const code = String(this.ruleForm.javaCode || '').trim()
      if (!code) {
        this.$message.warning('请先编写 Java 代码')
        return
      }
      if (!this.ruleForm.processorId) {
        this.$message.warning('请先选择规则类型')
        return
      }
      const payload = this.buildRulePersistPayload()
      this.javaValidateLoading = true
      try {
        const res = await validateJavaCode(payload)
        if (res && String(res.code) === '999999') return
        const text =
          res && res.data != null && res.data !== ''
            ? String(res.data)
            : (res && res.message ? String(res.message) : '')
        this.$message.success(text || 'Java 脚本校验通过')
      } catch (e) {
        if (e && (String(e.code) === '999999' || Number(e.code) === 999999)) return
        const tip = (e && e.message) ? String(e.message) : 'Java 脚本校验失败'
        this.$message({ message: tip, type: 'warning' })
      } finally {
        this.javaValidateLoading = false
      }
    },
    openJavaTestDialog() {
      if (!this.isJavaCustom) return
      const code = String(this.ruleForm.javaCode || '').trim()
      if (!code) {
        this.$message.warning('请先编写 Java 代码')
        return
      }
      if (!this.ruleForm.processorId) {
        this.$message.warning('请先选择规则类型')
        return
      }
      this.javaTestSampleData = ''
      this.javaTestOutputResult = ''
      this.javaTestDialogVisible = true
    },
    resetJavaTestDialog() {
      this.javaTestRunLoading = false
    },
    /**
     * 与 buildRulePersistPayload 一致，并写入待转换的示例值（后端 previewJavaCode 常从 value 或 config.data.value 读取）
     */
    buildJavaPreviewPayload(sampleValue) {
      const payload = JSON.parse(JSON.stringify(this.buildRulePersistPayload()))
      const sv = sampleValue != null ? String(sampleValue) : ''
      payload.value = sv
      try {
        const wrap = JSON.parse(payload.config || '{}')
        if (wrap.data && typeof wrap.data === 'object') {
          wrap.data.value = sv
        }
        payload.config = JSON.stringify(wrap)
      } catch (_) {
        /* keep payload.config as-is */
      }
      return payload
    },
    async runJavaTestInDialog() {
      if (!this.isJavaCustom) return
      if (!String(this.javaTestSampleData || '').trim()) {
        this.$message.warning('请输入示例数据')
        return
      }
      const payload = this.buildJavaPreviewPayload(this.javaTestSampleData)
      this.javaTestRunLoading = true
      this.javaTestOutputResult = ''
      try {
        const res = await previewJavaCode(payload)
        if (res && String(res.code) === '999999') return
        const raw = res && res.data !== undefined && res.data !== null ? res.data : (res && res.message)
        if (raw !== undefined && raw !== null && typeof raw === 'object') {
          try {
            this.javaTestOutputResult = JSON.stringify(raw, null, 2)
          } catch (_) {
            this.javaTestOutputResult = String(raw)
          }
        } else {
          this.javaTestOutputResult = raw != null && raw !== '' ? String(raw) : '（无返回内容）'
        }
      } catch (e) {
        if (e && (String(e.code) === '999999' || Number(e.code) === 999999)) return
        const tip = (e && e.message) ? String(e.message) : 'Java 测试请求失败'
        this.$message({ message: tip, type: 'warning' })
        this.javaTestOutputResult = tip
      } finally {
        this.javaTestRunLoading = false
      }
    },
    async handleValidateSql() {
      if (!this.isValueMapping || !this.isMappingSqlMode) return
      if (!String(this.ruleForm.mappingSourceDbId || '').trim()) {
        this.$message({
          message: '请先选择数据源后再校验',
          type: 'warning'
        })
        return
      }
      if (!String(this.ruleForm.mappingSql || '').trim()) {
        this.$message({
          message: '请先输入 SQL 脚本后再校验',
          type: 'warning'
        })
        return
      }
      if (!this.ruleForm.processorId) {
        this.$message({
          message: '请先选择规则类型',
          type: 'warning'
        })
        return
      }
      const payload = this.buildRulePersistPayload()
      this.sqlValidateLoading = true
      try {
        const v = await validateSql(payload)
        if (v && String(v.code) === '999999') return
        const msg =
          v && v.data != null && v.data !== ''
            ? String(v.data)
            : (v && v.message ? String(v.message) : 'sql校验通过')
        this.$message.success(msg)
      } catch (e) {
        if (e && (String(e.code) === '999999' || Number(e.code) === 999999)) return
        this.$message({
          message: (e && e.message) ? String(e.message) : 'SQL 校验失败',
          type: 'warning'
        })
      } finally {
        this.sqlValidateLoading = false
      }
    },
    async handlePreviewData() {
      if (this.isMappingDbDictMode) {
        if (
          !this.ruleForm.mappingSourceDbId ||
          !this.ruleForm.mappingDictTableId ||
          !this.ruleForm.mappingFromField ||
          !this.ruleForm.mappingToField
        ) {
          this.$message.warning('请先选择数据源、字典表以及转换前/转换后字段后再预览')
          return
        }
      }
      if (this.isMappingSqlMode && !String(this.ruleForm.mappingSql || '').trim()) {
        this.$message.warning('请先输入 SQL 脚本后再预览')
        return
      }
      if (this.isMappingSqlMode && !String(this.ruleForm.mappingSourceDbId || '').trim()) {
        this.$message.warning('请先选择数据源后再预览')
        return
      }
      if (!this.ruleForm.processorId) {
        this.$message.warning('请先选择规则类型')
        return
      }
      const payload = this.buildRulePersistPayload()
      this.mappingPreviewLoading = true
      this.previewDialogLoading = true
      this.previewDialogTitle = '数据预览'
      this.previewMode = 'text'
      this.previewText = '加载中…'
      this.previewDialogVisible = true
      try {
        if (this.isMappingSqlMode) {
          const v = await validateSql(payload)
          if (v && String(v.code) === '999999') {
            this.previewDialogVisible = false
            return
          }
          const sqlOk =
            v && v.data != null && v.data !== ''
              ? String(v.data)
              : (v && v.message ? String(v.message) : 'sql校验通过')
          this.$message.success(sqlOk)
        }
        const res = await previewRuleData(payload)
        if (res && String(res.code) === '999999') {
          this.previewDialogVisible = false
          return
        }
        this.showPreviewDialog('数据预览', res && res.data)
      } catch (e) {
        if (e && (String(e.code) === '999999' || Number(e.code) === 999999)) {
          this.previewDialogVisible = false
          return
        }
        this.previewDialogVisible = false
        const tip = (e && e.message) ? String(e.message) : '数据预览失败'
        this.$message({ message: tip, type: 'warning' })
      } finally {
        this.mappingPreviewLoading = false
        this.previewDialogLoading = false
      }
    },
    handleSave() {
      this.$refs.ruleFormRef.validate(valid => {
        if (!valid) return
        if (this.isCreateMode && this.ruleForm.groupId != null) {
          const rootType = this.findRootTypeById(this.groupOptions, this.ruleForm.groupId)
          const selectedRootId = this.findRootGroupIdById(this.groupOptions, this.ruleForm.groupId)
          if (this.regularGroupId != null && Number(selectedRootId) === Number(this.regularGroupId)) {
            this.$message.warning('新建规则时不允许选择通用目录')
            return
          }
          if (rootType === 'GENERAL') {
            this.$message.warning('新建规则时不允许选择通用目录')
            return
          }
          if (!this.isAdmin && rootType === 'PUBLIC') {
            this.$message.warning('当前角色仅允许在自定义目录下新建规则')
            return
          }
        }
        const payload = this.buildRulePersistPayload()
        const id = this.$route && this.$route.query ? this.$route.query.id : ''
        const request = id ? updateRule(payload) : addRule(payload)
        request.then((res) => {
          if (res && String(res.code) === '999999') return
          this.$message.success((res && res.data) || (id ? '规则编辑成功' : '规则新增成功'))
          this.$router.back()
        }).catch((err) => {
          if (err && (String(err.code) === '999999' || Number(err.code) === 999999)) return
          const tip =
            (err && err.message) ? String(err.message) : (id ? '规则编辑失败' : '规则新增失败')
          this.$message({ message: tip, type: 'warning' })
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.rule-edit-container {
  height: 100%;
  background: linear-gradient(180deg, #f6f8fc 0%, #f2f5fa 100%);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 16px 0;
  padding: 14px 18px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #eef2f8;
  box-shadow: 0 4px 16px rgba(30, 60, 120, 0.06);

  .title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    line-height: 24px;
  }

  .subtitle {
    margin-top: 4px;
    color: #909399;
    font-size: 12px;
  }

  .back {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: #409eff;
    font-size: 13px;
    padding: 6px 10px;
    border-radius: 6px;
    transition: all 0.2s;

    span {
      margin-left: 4px;
    }

    &:hover {
      background: #ecf5ff;
    }
  }
}

.body {
  flex: 1;
  padding: 12px 16px 16px;
  overflow: auto;
}

.rule-form {
  background: #fff;
  padding: 18px 20px 10px;
  border-radius: 8px;
  border: 1px solid #eef2f8;
  box-shadow: 0 6px 20px rgba(30, 60, 120, 0.06);
}

.form-card {
  padding: 14px 14px 2px;
  margin-bottom: 10px;
  border: 1px solid #edf1f7;
  border-radius: 8px;
  background: #fcfdff;
}

.rule-detail-card {
  padding: 14px 14px 6px;
  margin-bottom: 10px;
  border: 1px solid #edf1f7;
  border-radius: 8px;
  background: #fcfdff;
}

.detail-item {
  display: flex;
  line-height: 24px;
  margin-bottom: 8px;
  color: #303133;
  font-size: 13px;
}

.detail-item .k {
  color: #909399;
  min-width: 84px;
}

.detail-item .v {
  flex: 1;
  word-break: break-all;
}

.detail-item.multiline {
  align-items: flex-start;
}

.readonly-block {
  user-select: none;
}

.readonly-mode .readonly-block ::v-deep .el-input__inner,
.readonly-mode .readonly-block ::v-deep .el-textarea__inner,
.readonly-mode .readonly-block ::v-deep .el-select,
.readonly-mode .readonly-block ::v-deep .el-radio-group,
.readonly-mode .readonly-block ::v-deep .el-switch {
  user-select: none;
}

.readonly-mode .readonly-block ::v-deep .el-input,
.readonly-mode .readonly-block ::v-deep .el-textarea,
.readonly-mode .readonly-block ::v-deep .el-select,
.readonly-mode .readonly-block ::v-deep .el-radio-group,
.readonly-mode .readonly-block ::v-deep .el-switch,
.readonly-mode .readonly-block ::v-deep .el-button {
  pointer-events: none;
}

/* Java 代码区在详情页需要可滚动查看（只读，不可编辑） */
.readonly-mode .md-workbench ::v-deep .el-textarea,
.readonly-mode .md-workbench ::v-deep .el-textarea__inner {
  pointer-events: auto;
  user-select: text;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin: 12px 0 10px;
}

.req-mark {
  color: #f56c6c;
  margin-right: 2px;
}

.processor-desc {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f5f9ff;
  border: 1px solid #dbeafe;
  border-radius: 6px;
  color: #606266;
  font-size: 12px;
  line-height: 18px;
}

.param-table {
  border-radius: 8px;
  overflow: hidden;
}

.param-table ::v-deep .el-table__header th {
  background: #f7f9fc;
  color: #606266;
  font-weight: 600;
}

.rule-form ::v-deep .el-form-item {
  margin-bottom: 18px;
}

.rule-form ::v-deep .el-input__inner,
.rule-form ::v-deep .el-textarea__inner {
  border-radius: 6px;
}

.rule-form ::v-deep .el-divider--horizontal {
  margin: 14px 0;
}

.form-footer {
  margin-top: 12px;
  padding: 12px 0 4px;
  border-top: 1px solid #edf1f7;
  text-align: right;
}

.java-custom-mode {
  background: #f7f8fa;
}

.java-custom-mode .header {
  border-radius: 4px;
  box-shadow: none;
  border-color: #ebeef5;
}

.java-custom-mode .rule-form {
  border-radius: 4px;
  box-shadow: none;
  border-color: #ebeef5;
  padding: 14px 16px 8px;
}

.java-custom-mode .form-card {
  background: #fff;
  border: none;
  border-radius: 0;
  margin-bottom: 6px;
  padding: 8px 8px 0;
}

.java-custom-mode .processor-card {
  border-top: 1px solid #f0f2f5;
  padding-top: 12px;
}

.java-custom-mode .section-title {
  font-size: 14px;
  margin-bottom: 10px;
}

.java-custom-mode .param-table {
  border-radius: 0;
}

.java-custom-mode .param-table ::v-deep .el-table__header th {
  background: #f5f7fa;
  color: #909399;
  font-weight: 500;
}

.java-custom-mode .processor-desc {
  background: #f8f8f9;
  border-color: #e5e9f2;
}

.java-code-input ::v-deep .el-textarea__inner {
  font-family: SFMono-Regular, Menlo, Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
  background: #f8fafc;
  border: 1px solid #dbe3ef;
  color: #334155;
  padding: 12px 14px;
}

.java-code-input ::v-deep .el-textarea__inner::placeholder {
  color: #94a3b8;
}

.java-code-tip {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}

.java-test-rule-dialog ::v-deep .el-dialog__body {
  padding: 12px 20px 8px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.java-test-dialog-body ::v-deep .el-textarea__inner {
  font-family: SFMono-Regular, Menlo, Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
}

.java-test-code-view {
  max-height: 320px;
  overflow: auto;
  border: 1px solid #dbe3ef;
  border-radius: 4px;
  background: #f8fafc;
  user-select: text;
}

.java-test-code-pre {
  margin: 0;
  padding: 12px 14px;
  font-family: SFMono-Regular, Menlo, Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.65;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
}

.java-test-output ::v-deep .el-textarea__inner {
  background: #f9fafb;
}

.java-test-dialog-footer {
  text-align: center;
}

.mapping-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.mapping-toolbar .right {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 手工映射整块与表单 label-width=100px 时内容区左缘对齐 */
.manual-mapping-section {
  padding-left: 100px;
}

.mapping-toolbar--manual {
  margin-bottom: 12px;
}

.manual-template-link {
  padding: 0 6px;
  font-size: 13px;
}

/* 规则编辑页主要下拉统一宽度，与「规则类型」「返回值类型」等对齐 */
.rule-edit-std-select {
  width: 260px;
  max-width: 100%;
}

.mapping-filter-title {
  margin-bottom: 8px;
  color: #606266;
  font-size: 12px;
}

.mapping-filter-root {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #606266;
}

.logic-select {
  width: 90px;
}

.mapping-filter-lines {
  border-left: 1px solid #e6ebf3;
  margin-left: 8px;
  padding-left: 10px;
}

.mapping-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.field-select {
  width: 180px;
}

.op-select {
  width: 130px;
}

.value-input {
  width: 220px;
}

.mapping-filter-group {
  width: calc(100% - 40px);
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  background: #f8fbff;
  padding: 8px 10px 4px;
}

.mapping-filter-group-title {
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 6px;
}

.mapping-filter-group .mapping-filter-item {
  margin-bottom: 6px;
}

.mapping-filter-group .mapping-filter-root {
  margin-bottom: 6px;
}

.md-editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border: 1px solid #dbe3ef;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  background: #f1f5f9;
}

.md-editor-title {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.md-editor-hint {
  font-size: 12px;
  color: #64748b;
}

.java-code-input ::v-deep .el-textarea__inner {
  border-radius: 0 0 6px 6px;
}

.md-workbench {
  display: block;
}

.md-pane {
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}

.md-pane-title {
  font-size: 12px;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 6px 10px;
}

.md-pane-edit .java-code-input ::v-deep .el-textarea__inner {
  border: none;
  border-radius: 0;
  min-height: 320px;
}

.java-custom-mode .form-footer {
  text-align: center;
  border-top: none;
  padding-top: 4px;
}

.rule-preview-body {
  min-height: 120px;
}

.preview-pre {
  margin: 0;
  padding: 12px;
  max-height: 420px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  background: #f8fafc;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

