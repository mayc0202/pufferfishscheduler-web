<template>
  <div class="container realtime-page">
    <!-- 主体内容 -->
    <div class="body">
      <el-container>
        <el-main>
          <div class="list">
            <!-- 搜索栏 -->
            <div class="search">
              <el-row class="search-row search-row-uniform">
                <el-col class="search-col search-col-equal">
                  <div class="col">
                    <div class="label">任务名称：</div>
                    <el-input v-model="searchParams.taskName" class="search-input" placeholder="输入任务名称" clearable />
                  </div>
                </el-col>
                <el-col class="search-col search-col-equal">
                  <div class="col">
                    <div class="label">来源库：</div>
                    <el-cascader
                      v-model="searchParams.sourceSchema"
                      :options="cascaderDbOptions"
                      :props="sourceSchema"
                      :show-all-levels="false"
                      placeholder="请选择来源数据库"
                      clearable
                      filterable
                      class="search-cascader"
                    />
                  </div>
                </el-col>
                <el-col class="search-col search-col-equal">
                  <div class="col">
                    <div class="label">目标库：</div>
                    <el-cascader
                      v-model="searchParams.targetSchema"
                      :options="cascaderDbOptions"
                      :props="targetSchema"
                      :show-all-levels="false"
                      placeholder="请选择目标数据库"
                      clearable
                      filterable
                      class="search-cascader"
                    />
                  </div>
                </el-col>
                <el-col class="search-col search-col-equal">
                  <div class="col">
                    <div class="label">任务状态：</div>
                    <el-select v-model="searchParams.status" class="search-select" clearable placeholder="请选择同步任务状态">
                      <el-option
                        v-for="item in taskStatusSelectOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </div>
                </el-col>
                <el-col class="search-col search-col-equal search-col-btns">
                  <div class="flex search-btns">
                    <el-button type="primary" icon="el-icon-search" size="mini" @click="queryTaskList">查询</el-button>
                    <el-button type="primary" size="mini" @click="handleAddTask">新增实时任务</el-button>
                  </div>
                </el-col>
              </el-row>
            </div>

            <!-- 表格 -->
            <el-table
              v-loading="tableLoading"
              :data="taskList"
              style="width: 100%"
              max-height="640"
              element-loading-text="正在加载数据..."
              element-loading-spinner="el-icon-loading"
              element-loading-background="rgba(255, 255, 255, 0.8)"
            >
              <el-table-column fixed type="index" label="#" width="46" />
              <el-table-column prop="taskName" label="任务名称" min-width="200" />
              <el-table-column prop="sourceDbName" label="来源数据库" min-width="160" />
              <el-table-column prop="targetDbName" label="目标数据库" min-width="160" />
              <el-table-column label="同步引擎" width="120">
                <template slot-scope="scope">
                  <el-tag type="primary">{{ scope.row.engineTypeTxt || (scope.row.engineType === '1' ? 'Flink' : 'Kafka') }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="任务运行状态" width="130">
                <template slot-scope="scope">
                  <span
                    class="rt-status"
                    :class="rtStatusClass(scope.row)"
                    @click="isFailureStatus(scope.row) && openReason(scope.row)"
                  >
                    <i v-if="rtStatusShowDot(scope.row)" class="rt-status-dot" />
                    <span class="rt-status-text">
                      <template v-if="getTaskStatusDisplay(scope.row).plain">
                        {{ getTaskStatusDisplay(scope.row).text }}
                      </template>
                      <template v-else>
                        {{ getTaskStatusDisplay(scope.row).before }}<span class="rt-status-fail-underline">失败</span>{{ getTaskStatusDisplay(scope.row).after }}
                      </template>
                    </span>
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="createdTimeTxt" label="创建时间" min-width="170" />
              <el-table-column fixed="right" label="操作" width="260">
                <template slot-scope="scope">
                  <div class="flex around action-btns">
                    <el-button
                      type="text"
                      size="small"
                      @click.prevent="handleOpenMonitor(scope.row)"
                    >监控</el-button>
                    <el-button
                      type="text"
                      size="small"
                      :disabled="!canStart(scope.row)"
                      @click.native.prevent="handleStartTask(scope.row)"
                    >启动</el-button>
                    <el-button
                      type="text"
                      size="small"
                      :disabled="!canStop(scope.row)"
                      @click.native.prevent="handleStopTask(scope.row)"
                    >停止</el-button>
                    <el-button
                      type="text"
                      size="small"
                      :disabled="!canEdit(scope.row)"
                      @click.prevent="handleEditTask(scope.row)"
                    >编辑</el-button>
                    <el-button
                      type="text"
                      size="small"
                      :disabled="!canDelete(scope.row)"
                      @click.prevent="handleDeleteTask(scope.row)"
                    >删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-wrapper">
              <el-pagination
                :current-page="pagination.currentPage"
                :page-sizes="[10, 20, 30, 40, 50, 100]"
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
    </div>

    <!-- 任务失败原因 -->
    <el-dialog
      v-el-drag-dialog
      :visible.sync="reasonDialogVisible"
      title="任务失败原因"
      width="700px"
      class="reason-dialog"
      :show-close="true"
      :close-on-click-modal="false"
      :modal-append-to-body="true"
      :append-to-body="true"
    >
      <div class="reason-body">
        <pre class="reason-pre">{{ reasonText || '暂无失败原因' }}</pre>
      </div>
    </el-dialog>

    <!-- 新增/编辑任务对话框 -->
    <el-dialog
      :visible.sync="taskDialogVisible"
      :title="isEdit ? '编辑任务' : '新增任务'"
      width="1000px"
      class="task-dialog"
      :close-on-click-modal="false"
      :modal-append-to-body="true"
      :append-to-body="true"
    >
      <el-steps :active="activeStep" finish-status="finish" class="steps" align-center>
        <el-step title="设置任务属性" />
        <el-step title="选择来源表" />
        <el-step title="设置字段映射" />
        <el-step title="写入设置" />
      </el-steps>

      <!-- 步骤1：设置任务属性 -->
      <div v-if="activeStep === 0" class="step-content">
        <el-form ref="taskFormRef" :model="taskForm" :rules="taskFormRules" label-width="120px" class="task-form">
          <el-form-item label="任务名称" prop="taskName">
            <el-input v-model="taskForm.taskName" placeholder="请输入任务名称" class="form-input" clearable />
          </el-form-item>
          <el-form-item label="来源数据库" prop="sourceSchema">
            <el-cascader
              v-model="taskForm.sourceSchema"
              :options="sourceDbOptions"
              :props="sourceSchema"
              :show-all-levels="false"
              placeholder="请选择来源数据库"
              clearable
              filterable
              class="full-width"
              @change="handleSourceChange"
            />
          </el-form-item>
          <el-form-item label="目标数据库" prop="targetSchema">
            <el-cascader
              v-model="taskForm.targetSchema"
              :options="targetDbOptions"
              :props="targetSchema"
              :show-all-levels="false"
              placeholder="请选择目标数据库"
              clearable
              filterable
              class="full-width"
              @change="handleTargetChange"
            />
          </el-form-item>
          <el-form-item label="CDC引擎" prop="engineType">
            <el-select v-model="taskForm.engineType" placeholder="请选择CDC引擎" class="form-select">
              <el-option
                v-for="item in engineTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="同步类型">
            <el-radio-group v-model="taskForm.syncType">
              <el-radio label="0">全量+增量同步</el-radio>
              <el-radio label="1">增量同步</el-radio>
            </el-radio-group>
            <div
              class="sync-type-tip"
              :class="{
                'full-active': taskForm.syncType === '0',
                'inc-active': taskForm.syncType === '1'
              }"
            >
              <div class="tip-header">
                <i class="el-icon-info" />
                <span>同步模式说明</span>
              </div>
              <div class="tip-content">
                <div class="tip-item" :class="{ 'active': taskForm.syncType === '0' }">
                  <span class="tip-badge full">全+增</span>
                  <span class="tip-text">
                    <strong>全量+增量：</strong>首次执行全量同步，完成后自动转为增量同步，适合需要完整数据的场景
                  </span>
                </div>
                <div class="tip-item" :class="{ 'active': taskForm.syncType === '1' }">
                  <span class="tip-badge inc">增量</span>
                  <span class="tip-text">
                    <strong>增量同步：</strong>直接进入增量同步状态，仅同步变更数据，适合已有历史数据的场景
                  </span>
                </div>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2：选择来源表 -->
      <div v-if="activeStep === 1" class="step-content">
        <div class="table-selection">
          <div class="transfer-panel">
            <div class="transfer-panel__header">
              <span class="header-title">来源表</span>
              <span class="header-count">{{ selectedTables.length }}/{{ allTables.length }}</span>
            </div>
            <div class="transfer-panel__body">
              <div class="transfer-panel__filter">
                <el-input
                  v-model="leftFilterText"
                  size="small"
                  placeholder="输入表名过滤"
                  prefix-icon="el-icon-search"
                  clearable
                />
              </div>
              <div class="transfer-panel__list">
                <el-checkbox-group v-model="selectedTables" class="table-list">
                  <div
                    v-for="item in filteredLeftTables"
                    :key="item.value"
                    class="transfer-panel__item"
                    :class="{ 'is-checked': selectedTables.includes(item.value) }"
                  >
                    <el-checkbox :label="item.value">
                      <span class="item-label">{{ item.label }}</span>
                      <span class="item-desc">{{ item.desc }}</span>
                    </el-checkbox>
                  </div>
                  <div v-if="filteredLeftTables.length === 0" class="transfer-panel__empty">
                    <i class="el-icon-info" />
                    <span>暂无数据</span>
                  </div>
                </el-checkbox-group>
              </div>
            </div>
          </div>
          <div class="transfer-buttons">
            <el-button
              type="primary"
              :disabled="selectedTables.length === 0"
              class="transfer-button"
              circle
              @click="moveToRight"
            >
              <i class="el-icon-arrow-right" />
            </el-button>
            <el-button
              type="primary"
              :disabled="selectedRightTables.length === 0"
              style="margin-left: 0px;"
              class="transfer-button"
              circle
              @click="moveToLeft"
            >
              <i class="el-icon-arrow-left" />
            </el-button>
          </div>
          <div class="transfer-panel">
            <div class="transfer-panel__header">
              <span class="header-title">已选择表</span>
              <span class="header-count">{{ rightPanelTables.length }}/{{ allTables.length }}</span>
            </div>
            <div class="transfer-panel__body">
              <div class="transfer-panel__filter">
                <el-input
                  v-model="rightFilterText"
                  size="small"
                  placeholder="输入表名过滤"
                  prefix-icon="el-icon-search"
                  clearable
                />
              </div>
              <div class="transfer-panel__list">
                <el-checkbox-group v-model="selectedRightTables" class="table-list">
                  <div
                    v-for="item in filteredRightTables"
                    :key="item.value"
                    class="transfer-panel__item"
                    :class="{ 'is-checked': selectedRightTables.includes(item.value) }"
                  >
                    <el-checkbox :label="item.value">
                      <span class="item-label">{{ item.label }}</span>
                      <span class="item-desc">{{ item.desc }}</span>
                    </el-checkbox>
                  </div>
                  <div v-if="filteredRightTables.length === 0" class="transfer-panel__empty">
                    <i class="el-icon-info" />
                    <span>{{ rightPanelTables.length === 0 ? '请从左侧选择表' : '没有匹配的结果' }}</span>
                  </div>
                </el-checkbox-group>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤3：设置字段映射（多组可折叠） -->
      <div v-if="activeStep === 2" class="step-content">
        <div class="field-mapping">
          <div class="mapping-header">
            <span class="mapping-header-title">来源 → 目标 字段映射</span>
            <el-button type="primary" size="small" @click="addMapping">添加匹配</el-button>
          </div>
          <el-collapse v-model="activeMappingNames" class="mapping-collapse">
            <el-collapse-item v-for="(group, gIndex) in mappingGroups" :key="group.id" :name="group.id">
              <template slot="title">
                <span class="collapse-title">
                  <span class="info-label">来源：</span>
                  <el-select
                    v-model="group.sourceTable"
                    class="table-select collapse-select"
                    size="small"
                    placeholder="请选择"
                    @change="onGroupSourceChange(group)"
                    @click.native.stop
                  >
                    <el-option v-for="table in getAvailableSourceTablesForGroup(group)" :key="table" :label="table" :value="table" />
                  </el-select>
                  <span class="info-label">目标：</span>
                  <el-select
                    v-model="group.targetTable"
                    class="table-select collapse-select"
                    size="small"
                    placeholder="请选择"
                    @focus="ensureTargetTablesLoaded"
                    @change="onGroupTargetChange(group)"
                    @click.native.stop
                  >
                    <el-option
                      v-for="item in getAvailableTargetTablesForGroup(group)"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <span v-if="group.sourceTable || group.targetTable" class="group-summary">
                    {{ group.sourceTable || '未选' }} → {{ group.targetTable || '未选' }}（{{ group.mappedFields.length }} 个字段）
                  </span>
                </span>
                <el-button
                  v-if="mappingGroups.length > 1"
                  type="text"
                  size="small"
                  icon="el-icon-delete"
                  class="remove-group-btn"
                  @click.stop="removeMappingGroup(gIndex)"
                />
              </template>
              <div class="mapping-content">
                <div class="left-tree">
                  <div class="tree-header">
                    <span>源字段</span>
                    <span class="tree-count">{{ getSourceFields(group).length }}个字段</span>
                  </div>
                  <div class="tree-body">
                    <el-table
                      :ref="'sourceTable_' + group.id"
                      :data="getSourceFields(group)"
                      style="width: 100%"
                      class="source-table"
                      border
                      max-height="320"
                    >
                      <el-table-column type="selection" width="40" :selectable="(row) => isSourceFieldSelectable(row, group)" />
                      <el-table-column prop="name" label="字段名" width="140">
                        <template slot-scope="scope">
                          <span class="source-field">{{ scope.row.name }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="dataType" label="数据类型" width="100" />
                    </el-table>
                    <div v-if="getSourceFields(group).length === 0" class="empty-fields">
                      <i class="el-icon-folder-opened" />
                      <p>暂无字段</p>
                      <p class="empty-tip">请选择来源表查看字段</p>
                    </div>
                  </div>
                </div>
                <div class="transfer-buttons">
                  <el-button
                    type="primary"
                    icon="el-icon-arrow-right"
                    class="transfer-button"
                    circle
                    @click="moveFieldToRight(group)"
                  />
                  <el-button
                    type="primary"
                    icon="el-icon-arrow-left"
                    class="transfer-button"
                    style="margin-left: 0px;"
                    circle
                    @click="moveFieldToLeft(group)"
                  />
                </div>
                <div class="right-fields">
                  <div class="fields-header">
                    <span>目标字段映射</span>
                    <span class="fields-count">{{ group.mappedFields.length }}个字段</span>
                  </div>
                  <div class="fields-body">
                    <el-table
                      :ref="'mappingTable_' + group.id"
                      :data="group.mappedFields"
                      style="width: 100%"
                      class="mapping-table"
                      border
                      max-height="320"
                      @selection-change="(sel) => handleMappingSelectionChange(group, sel)"
                    >
                      <el-table-column type="selection" width="40" />
                      <el-table-column prop="sourceField" label="来源字段" width="140">
                        <template slot-scope="scope">
                          <span class="source-field">{{ scope.row.sourceField }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="sourceType" label="数据类型" width="100" />
                      <el-table-column label="目标字段" width="140">
                        <template slot-scope="scope">
                          <el-select
                            v-model="scope.row.targetField"
                            class="field-select"
                            size="small"
                            placeholder="请选择"
                            @change="(val) => handleTargetFieldChange(scope.row, group)"
                          >
                            <el-option label="请选择" value="" />
                            <el-option
                              v-for="field in getTargetFieldLabels(group)"
                              :key="field"
                              :label="field"
                              :value="field"
                            />
                          </el-select>
                        </template>
                      </el-table-column>
                      <el-table-column prop="targetType" label="数据类型" width="100">
                        <template slot-scope="scope">
                          <span>{{ scope.row.targetType || 'varchar' }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="60" fixed="right">
                        <template slot-scope="scope">
                          <el-button
                            type="text"
                            size="small"
                            icon="el-icon-delete"
                            @click="removeField(group, scope.$index)"
                          />
                        </template>
                      </el-table-column>
                    </el-table>
                    <div v-if="group.mappedFields.length === 0" class="empty-fields">
                      <i class="el-icon-folder-opened" />
                      <p>暂无字段映射</p>
                      <p class="empty-tip">请从左侧选择字段进行映射</p>
                    </div>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>

      <!-- 步骤4：写入设置 -->
      <div v-if="activeStep === 3" class="step-content">
        <div class="write-setting-inline">
          <div class="write-setting-title">写入设置</div>
          <el-form :model="writeSettingForm" label-width="120px" size="small" class="write-setting-form">
            <el-form-item label="数据写入方式" required>
              <el-radio-group v-model="writeSettingForm.writeMode">
                <el-radio label="insert">仅插入</el-radio>
                <el-radio label="upsert">插入/更新</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="批量提交记录数" required>
              <el-input-number
                v-model="writeSettingForm.batchSize"
                :min="1"
                :max="100000"
                :step="100"
                controls-position="right"
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="删除重复号" required>
              <el-radio-group v-model="writeSettingForm.deleteBeforeWrite">
                <el-radio label="yes">是</el-radio>
                <el-radio label="no">否</el-radio>
              </el-radio-group>
              <div class="setting-tip">选择“是”时，任务每次启动都会先清除目标库中目标表的数据。</div>
            </el-form-item>
            <el-form-item label="开启并发写入" required>
              <el-radio-group v-model="writeSettingForm.enableParallel">
                <el-radio label="yes">是</el-radio>
                <el-radio label="no">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button v-if="activeStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="activeStep < 3" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="activeStep === 3" type="primary" @click="saveTask">保存</el-button>
        <el-button @click="taskDialogVisible = false">取消</el-button>
      </div>

    </el-dialog>

    <realtime-monitor-dialog
      v-if="monitorDialogVisible"
      :visible.sync="monitorDialogVisible"
      :task-row="monitorTaskRow"
    />
  </div>
</template>

<script>
import dictCode from '@/api/dict/dictCode.js'
import { getDict } from '@/api/dict/dict'
import { relationalDbTree } from '@/api/database/database/dbGroup'
import { dbTableList, fieldList } from '@/api/database/database/database'
import { add as addRealtimeTask, list as listRealtimeTask, detail as detailRealtimeTask, update as updateRealtimeTask, deleteTask as deleteRealtimeTask, start as startRealtimeTask, stop as stopRealtimeTask } from '@/api/collect/realtime/realtime'
import RealtimeMonitorDialog from './RealtimeMonitorDialog.vue'

export default {
  name: 'Collection',
  components: { RealtimeMonitorDialog },
  data() {
    return {
      // 搜索参数（来源库/目标库与步骤一一致为级联选择，值为数组）
      searchParams: {
        taskName: '',
        sourceSchema: [],
        targetSchema: [],
        status: ''
      },
      // 任务列表数据（初始为空，依赖接口查询）
      taskList: [],
      // 分页参数
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      // 任务状态字典（列表查询用）
      taskStatusOption: [],
      tableLoading: false,
      // 页面定时刷新
      listTimer: null,
      // 任务失败原因弹窗
      reasonDialogVisible: false,
      reasonText: '',
      // 实时任务监控弹窗
      monitorDialogVisible: false,
      monitorTaskRow: null,
      // 对话框控制
      taskDialogVisible: false,
      isEdit: false,
      activeStep: 0,
      dbList: [], // 数据源列表
      // 表单数据
      taskForm: {
        taskName: '',
        sourceSchema: '',
        targetSchema: '',
        syncType: '0'
      },
      // 表单验证规则
      taskFormRules: {
        taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
        sourceSchema: [{ required: true, message: '请选择来源数据库', trigger: 'change' }],
        targetSchema: [{ required: true, message: '请选择目标数据库', trigger: 'change' }],
        engineType: [{ required: true, message: '请选择CDC引擎', trigger: 'change' }]
      },
      // 表选择相关（来源表列表，步骤2时通过接口加载）
      allTables: [],
      selectedTables: [],
      rightPanelTables: [],
      selectedRightTables: [],
      // 表名到表ID的映射（来源 / 目标）
      sourceTableIdMap: {},
      targetTableIdMap: {},
      leftFilterText: '',
      rightFilterText: '',
      // 多组来源->目标字段映射（每组可折叠）
      mappingGroups: [],
      // 折叠面板当前展开的 name 列表
      activeMappingNames: [],
      // 表结构数据，包含tableId 与字段信息
      tableInfo: {},
      // 加载状态
      fieldsLoading: false,
      // 步骤3 目标表下拉选项
      targetTableOptions: [],
      writeSettingForm: {
        writeMode: 'upsert', // insert / upsert
        batchSize: 1000,
        deleteBeforeWrite: 'no',
        enableParallel: 'no'
      },

      /**
       * 引擎类型
       */
      engineTypes: [],
      // 级联选择器配置
      sourceSchema: {
        value: 'value',
        label: 'label',
        children: 'children',
        expandTrigger: 'hover'
      },
      targetSchema: {
        value: 'value',
        label: 'label',
        children: 'children',
        expandTrigger: 'hover'
      }
    }
  },
  computed: {
    // 左侧过滤后的表
    filteredLeftTables() {
      const filterText = this.leftFilterText.toLowerCase()
      if (!filterText) return this.allTables
      return this.allTables.filter(
        item =>
          item.label.toLowerCase().includes(filterText) ||
          item.desc.toLowerCase().includes(filterText)
      )
    },
    // 右侧过滤后的表
    filteredRightTables() {
      const filterText = this.rightFilterText.toLowerCase()
      const rightTables = this.allTables.filter(item =>
        this.rightPanelTables.includes(item.value)
      )
      if (!filterText) return rightTables
      return rightTables.filter(
        item =>
          item.label.toLowerCase().includes(filterText) ||
          item.desc.toLowerCase().includes(filterText)
      )
    },
    // 可用的来源表（步骤二已选表，允许多组重复选择同一来源表）
    availableSourceTables() {
      return this.rightPanelTables || []
    },
    // 转换来源库数据格式为级联选择器
    cascaderDbOptions() {
      return this.transformToCascader(this.dbList)
    },
    // 任务状态下拉选项：展示 value（中文），查询传 code（S/F/R/T）
    taskStatusSelectOptions() {
      return (this.taskStatusOption || []).map(item => this.toDictOption(item))
    },
    // 任务状态字典映射：code -> { label, type }
    taskStatusMap() {
      const map = {}
      ;(this.taskStatusOption || []).forEach(item => {
        const code = item.code != null ? String(item.code) : ''
        if (!code) return
        const label = item.value || code
        let type = 'info'
        if (code === 'R' || code === 'RUNNING') type = 'success'
        else if (code === 'F' || code === 'FAILURE') type = 'danger'
        map[code] = { label, type }
      })
      return map
    },
    // 来源数据库选项（排除已选择的目标数据库）
    sourceDbOptions() {
      const options = this.transformToCascader(this.dbList)
      if (!this.taskForm.targetSchema || this.taskForm.targetSchema.length === 0) {
        return options
      }
      const targetDbId = this.taskForm.targetSchema[this.taskForm.targetSchema.length - 1]
      return this.disableOption(options, targetDbId)
    },
    // 目标数据库选项（排除已选择的来源数据库）
    targetDbOptions() {
      const options = this.transformToCascader(this.dbList)
      if (!this.taskForm.sourceSchema || this.taskForm.sourceSchema.length === 0) {
        return options
      }
      const sourceDbId = this.taskForm.sourceSchema[this.taskForm.sourceSchema.length - 1]
      return this.disableOption(options, sourceDbId)
    },
    // CDC 引擎下拉选项，传值对齐 RtTask.engine_type：0-Kafka，1-Flink
    engineTypeOptions() {
      return (this.engineTypes || []).map((item) => this.toDictOption(item))
    }
  },
  mounted() {
    // 加载字典数据
    this.initDict()
    // 加载数据源数据
    this.loadDbData()
    // 初始化字段信息
    this.initFieldInfo()
    // 加载实时任务列表
    this.queryTaskList()
    // 定时刷新列表（避免重复定时器）
    this.startListTimer()
  },
  beforeDestroy() {
    this.stopListTimer()
  },
  methods: {
    toDictOption(item) {
      const labelRaw = item && (item.value ?? item.label ?? item.name ?? item.code)
      const valueRaw = item && (item.code ?? item.id ?? item.value)
      return {
        label: labelRaw != null ? String(labelRaw) : '',
        value: valueRaw != null ? String(valueRaw) : ''
      }
    },
    startListTimer() {
      this.stopListTimer()
      // 10s 刷新一次，可按需调整
      this.listTimer = setInterval(() => {
        // 避免弹窗编辑时频繁打断用户体验，这里仍然刷新列表（不影响弹窗内数据）
        this.queryTaskList(false)
      }, 10000)
    },
    stopListTimer() {
      if (this.listTimer) {
        clearInterval(this.listTimer)
        this.listTimer = null
      }
    },
    isFailureStatus(row) {
      const s = row && String(row.taskStatus)
      return s === 'FAILURE' || s === 'F'
    },
    rtStatusClass(row) {
      const s = row && row.taskStatus != null ? String(row.taskStatus) : ''
      if (s === 'RUNNING' || s === 'R') return 'is-running'
      if (s === 'FAILURE' || s === 'F') return 'is-failure is-clickable'
      if (s === 'STARTING') return 'is-starting'
      if (s === 'STOPPING') return 'is-stopping'
      if (s === 'STOP' || s === 'T') return 'is-stopped'
      if (s === 'INIT') return 'is-init'
      return 'is-init'
    },
    rtStatusShowDot(row) {
      const s = row && row.taskStatus != null ? String(row.taskStatus) : ''
      return s === 'RUNNING' || s === 'R' || s === 'FAILURE' || s === 'F'
    },
    taskStatusTagType(status) {
      const s = status != null ? String(status) : ''
      const meta = this.taskStatusMap[s]
      return meta ? meta.type : 'info'
    },
    taskStatusLabel(row) {
      const s = row && row.taskStatus != null ? String(row.taskStatus) : ''
      const meta = this.taskStatusMap[s]
      if (meta) return meta.label
      if (row && row.taskStatusTxt) return row.taskStatusTxt
      // 兜底：按任务管理状态常量显示
      if (s === 'INIT') return '未启动'
      if (s === 'STARTING') return '启动中'
      if (s === 'RUNNING' || s === 'R') return '运行中'
      if (s === 'STOPPING') return '停止中'
      if (s === 'STOP' || s === 'T') return '已停止'
      if (s === 'FAILURE' || s === 'F') return '失败'
      if (s === 'S') return '成功'
      return '未知'
    },
    getTaskStatusDisplay(row) {
      const text = this.taskStatusLabel(row)
      if (!this.isFailureStatus(row)) {
        return { plain: true, text }
      }
      const idx = text.indexOf('失败')
      if (idx === -1) {
        return { plain: true, text }
      }
      return {
        plain: false,
        before: text.slice(0, idx),
        after: text.slice(idx + 2)
      }
    },
    handleOpenMonitor(row) {
      if (!row || row.taskId == null) {
        this.$message.warning('缺少任务ID')
        return
      }
      this.monitorTaskRow = row
      this.monitorDialogVisible = true
    },
    async openReason(row) {
      // 优先用列表字段 reason；没有则走 detail 再取 reason
      const localReason = row && (row.reason || row.taskReason)
      if (localReason) {
        this.reasonText = String(localReason)
        this.reasonDialogVisible = true
        return
      }
      const taskId = row && row.taskId
      if (taskId == null) {
        this.reasonText = ''
        this.reasonDialogVisible = true
        return
      }
      try {
        const res = await detailRealtimeTask(taskId)
        const data = res && res.data
        this.reasonText = (data && (data.reason || data.taskReason)) ? String(data.reason || data.taskReason) : ''
        this.reasonDialogVisible = true
      } catch (err) {
        console.error(err)
        this.reasonText = err?.response?.data?.message || err?.message || ''
        this.reasonDialogVisible = true
      }
    },
    // 根据步骤一选择的来源数据库加载来源表列表
    async loadSourceTables() {
      // 来源数据库采用级联选择器，取最后一级作为 dbId
      if (!this.taskForm.sourceSchema || this.taskForm.sourceSchema.length === 0) {
        this.allTables = []
        this.selectedTables = []
        this.rightPanelTables = []
        this.selectedRightTables = []
        this.sourceTableIdMap = {}
        return
      }

      const dbId = this.taskForm.sourceSchema[this.taskForm.sourceSchema.length - 1]
      if (!dbId) {
        return
      }

      try {
        const res = await dbTableList(dbId)
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          // 将接口返回的表列表转换为步骤二左侧列表需要的格式，并记录表ID
          const tableIdMap = {}
          this.allTables = res.data.map(item => {
            const name = item.name || item.tableName || item
            const id = item.id || item.tableId
            if (name && id) {
              tableIdMap[name] = id
            }
            return {
              value: name,
              label: name,
              desc: item.comment || item.remark || ''
            }
          })
          this.sourceTableIdMap = tableIdMap
        } else {
          this.allTables = []
          this.msgError(res && res.message ? res.message : '获取来源表列表失败')
        }
        // 编辑回填时保留已设置的 rightPanelTables，新增时清空
        if (!this.isEdit) {
          this.selectedTables = []
          this.rightPanelTables = []
          this.selectedRightTables = []
        }
      } catch (error) {
        console.error('加载来源表列表失败:', error)
        this.allTables = []
        this.selectedTables = []
        this.rightPanelTables = []
        this.selectedRightTables = []
        this.sourceTableIdMap = {}
        this.msgError('获取来源表列表失败')
      }
    },
    // 加载目标数据库下的表列表（步骤3 目标表下拉）
    async loadTargetTables() {
      if (!this.taskForm.targetSchema || this.taskForm.targetSchema.length === 0) {
        this.targetTableOptions = []
        this.targetTableIdMap = {}
        return
      }
      const dbId = this.taskForm.targetSchema[this.taskForm.targetSchema.length - 1]
      if (!dbId) {
        return
      }
      try {
        const res = await dbTableList(dbId)
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          const tableIdMap = {}
          this.targetTableOptions = res.data.map(item => {
            const name = item.name || item.tableName || item
            const id = item.id || item.tableId
            if (name && id) {
              tableIdMap[name] = id
            }
            return {
              value: name,
              label: name
            }
          })
          this.targetTableIdMap = tableIdMap
        } else {
          this.targetTableOptions = []
          this.targetTableIdMap = {}
          this.msgError(res && res.message ? res.message : '获取目标表列表失败')
        }
      } catch (error) {
        console.error('加载目标表列表失败:', error)
        this.targetTableOptions = []
        this.targetTableIdMap = {}
        this.msgError('获取目标表列表失败')
      }
    },
    // 步骤3 目标表下拉获取焦点时，如果还没有加载则触发加载
    ensureTargetTablesLoaded() {
      if (!this.targetTableOptions || this.targetTableOptions.length === 0) {
        this.loadTargetTables()
      }
    },
    // 创建空映射组
    createEmptyGroup() {
      return {
        id: 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        sourceTable: '',
        targetTable: '',
        mappedFields: [],
        selectedMappedFields: []
      }
    },
    // 某组可选的来源表（已作为来源表配置过的表在其他组中不可再选）
    getAvailableSourceTablesForGroup(group) {
      const list = this.rightPanelTables || []
      return list.filter(table => {
        const usedByOther = this.mappingGroups.some(g => g.id !== group.id && g.sourceTable === table)
        return !usedByOther
      })
    },
    // 某组可选的目标表（已作为目标表配置过的表在其他组中不可再选）
    getAvailableTargetTablesForGroup(group) {
      const list = this.targetTableOptions || []
      return list.filter(item => {
        const usedByOther = this.mappingGroups.some(g => g.id !== group.id && g.targetTable === item.value)
        return !usedByOther
      })
    },
    // 某组的来源表字段列表
    getSourceFields(group) {
      if (!group || !group.sourceTable) return []
      return this.tableInfo[group.sourceTable]?.fields || []
    },
    // 某组的目标表字段名列表（用于下拉）
    getTargetFieldLabels(group) {
      if (!group || !group.targetTable) return []
      const fields = this.tableInfo[group.targetTable]?.fields || []
      return fields.map(f => f.label)
    },
    // 来源表变更：加载字段
    onGroupSourceChange(group) {
      if (group.sourceTable) this.getTableFields(group.sourceTable)
    },
    // 目标表变更：加载字段并同名字段自动匹配
    async onGroupTargetChange(group) {
      group.targetTable = group.targetTable || ''
      if (!group.targetTable) {
        group.mappedFields = []
        group.selectedMappedFields = []
        return
      }
      await this.getTableFields(group.targetTable)
      this.autoMatchFields(group)
    },
    // 根据来源表与目标表字段名自动匹配（针对某组）
    autoMatchFields(group) {
      const sourceList = this.getSourceFields(group) || []
      const targetList = this.tableInfo[group.targetTable]?.fields || []
      if (sourceList.length === 0 || targetList.length === 0) return

      const targetByName = {}
      targetList.forEach(f => {
        const name = f.name || f.label
        if (name) targetByName[name] = f
      })

      const existingSource = new Set((group.mappedFields || []).map(m => m.sourceField))
      let added = 0
      sourceList.forEach(source => {
        const name = source.name || source.label
        if (!name || existingSource.has(name)) return
        const target = targetByName[name]
        if (!target) return
        group.mappedFields.push({
          sourceField: name,
          sourceType: source.dataType || '',
          targetField: name,
          targetType: target.dataType || ''
        })
        existingSource.add(name)
        added++
      })
      if (added > 0) {
        this.msgSuccess(`已自动匹配 ${added} 个同名字段`)
      }
    },
    // 加载字典数据
    initDict() {
      getDict(dictCode.TASK_STATUS).then((res) => {
        this.taskStatusOption = res.data
      })
      getDict(dictCode.CDC_ENGINE_TYPE).then((res) => {
        this.engineTypes = res.data
      })
    },
    // 获取数据
    async loadDbData() {
      try {
        const res = await relationalDbTree()
        this.dbList = res.data
      } catch (error) {
        console.error('获取数据失败:', error)
        this.$message.error('获取数据源列表失败')
      }
    },
    // 转换数据格式
    transformToCascader(data) {
      if (!data || !Array.isArray(data)) return []
      // 为了兼容不同后端结构，这里不再强依赖 type 字段，只要有 children 就认为是分组
      return data
        .map(group => ({
          value: group.id || group.value,
          label: group.name || group.label,
          disabled: false,
          children: (group.children || []).map(db => ({
            value: db.id || db.value,
            label: db.name || db.label
          }))
        }))
        .filter(group => group.children && group.children.length > 0)
    },
    // 根据数据库 ID 在 dbList 树中查找级联路径 [groupId, dbId]，用于编辑回填来源库/目标库
    findCascaderPathByDbId(dbId) {
      if (dbId == null || !this.dbList || !Array.isArray(this.dbList)) return []
      for (const group of this.dbList) {
        const children = group.children || []
        for (const db of children) {
          const id = db.id || db.value
          if (id === dbId || Number(id) === Number(dbId)) {
            const groupValue = group.id || group.value
            return groupValue != null ? [groupValue, id] : [id]
          }
        }
      }
      return [dbId]
    },
    // 禁用指定数据库选项
    disableOption(options, targetId) {
      return options.map(group => ({
        ...group,
        children: group.children.map(db => ({
          ...db,
          disabled: db.value === targetId
        }))
      }))
    },
    // 来源数据库改变
    handleSourceChange(value) {
      if (value && value.length > 0) {
        const sourceDbId = value[value.length - 1]
        if (this.taskForm.targetSchema && this.taskForm.targetSchema.length > 0) {
          const targetDbId = this.taskForm.targetSchema[this.taskForm.targetSchema.length - 1]
          if (sourceDbId === targetDbId) {
            this.msgWarning('来源数据库和目标数据库不能相同')
            this.taskForm.sourceSchema = []
            // 重置来源表列表
            this.allTables = []
            this.selectedTables = []
            this.rightPanelTables = []
            this.selectedRightTables = []
            return
          }
        }
        // 当选择了新的来源数据库时，立即加载对应的表列表
        this.loadSourceTables()
      }
    },
    // 目标数据库改变
    handleTargetChange(value) {
      if (value && value.length > 0) {
        const targetDbId = value[value.length - 1]
        if (this.taskForm.sourceSchema && this.taskForm.sourceSchema.length > 0) {
          const sourceDbId = this.taskForm.sourceSchema[this.taskForm.sourceSchema.length - 1]
          if (targetDbId === sourceDbId) {
            this.msgWarning('目标数据库和来源数据库不能相同')
            this.taskForm.targetSchema = []
            this.targetTableOptions = []
            return
          }
        }
        // 目标数据库变更时，刷新目标表列表
        this.loadTargetTables()
      }
    },
    // 查询任务列表（对接 /realtime/task/list.do）
    // showLoading: 是否显示表格 loading，定时刷新时可传 false
    async queryTaskList(showLoading = true) {
      if (showLoading) {
        this.tableLoading = true
      }
      try {
        const s = this.searchParams
        const sourceDbId = Array.isArray(s.sourceSchema) && s.sourceSchema.length ? s.sourceSchema[s.sourceSchema.length - 1] : undefined
        const targetDbId = Array.isArray(s.targetSchema) && s.targetSchema.length ? s.targetSchema[s.targetSchema.length - 1] : undefined
        const res = await listRealtimeTask({
          taskName: s.taskName ? String(s.taskName).trim() : undefined,
          sourceDbId,
          targetDbId,
          taskStatus: s.status || undefined,
          pageNo: this.pagination.currentPage,
          pageSize: this.pagination.pageSize
        })
        const data = res && res.data
        if (data && Array.isArray(data.records)) {
          this.taskList = data.records
          this.pagination.total = data.total != null ? data.total : 0
          if (data.current != null) this.pagination.currentPage = data.current
          if (data.size != null) this.pagination.pageSize = data.size
        } else {
          this.taskList = []
        }
      } catch (err) {
        console.error(err)
        this.taskList = []
        this.$message.error(err?.response?.data?.message || err?.message || '查询任务列表失败')
      } finally {
        if (showLoading) {
          this.tableLoading = false
        }
      }
    },
    // 新增任务
    handleAddTask() {
      this.isEdit = false
      this.activeStep = 0
      this.taskForm = {
        taskName: '',
        sourceSchema: '',
        targetSchema: '',
        syncType: '0'
      }
      this.selectedTables = []
      this.rightPanelTables = []
      this.selectedRightTables = []
      const firstGroup = this.createEmptyGroup()
      this.mappingGroups = [firstGroup]
      this.activeMappingNames = [firstGroup.id]
      this.$nextTick(() => {
        if (this.$refs.taskFormRef) {
          this.$refs.taskFormRef.clearValidate()
        }
      })
      this.taskDialogVisible = true
    },
    // 弹窗内使用的 message，确保显示在弹窗之上（z-index）
    msgSuccess(text) {
      this.$message({ type: 'success', message: text, customClass: 'task-dialog-message' })
    },
    msgWarning(text) {
      this.$message({ type: 'warning', message: text, customClass: 'task-dialog-message' })
    },
    msgError(text) {
      this.$message({ type: 'error', message: text, customClass: 'task-dialog-message' })
    },
    // 编辑任务：拉取 detail 接口并回填表单、表映射、字段映射、写入设置
    async handleEditTask(task) {
      if (task.taskId == null) {
        this.$message.warning('缺少任务ID')
        return
      }
      if (!this.canEdit(task)) {
        this.$message.warning('启动中/运行中/停止中任务不可编辑')
        return
      }
      this.tableLoading = true
      try {
        // 确保数据源树已加载，否则级联路径无法解析
        if (!this.dbList || this.dbList.length === 0) {
          const dbRes = await relationalDbTree()
          if (dbRes && dbRes.data) this.dbList = dbRes.data
        }
        const res = await detailRealtimeTask(task.taskId)
        const data = res && res.data
        if (!data) {
          this.msgError(res?.message || '获取任务详情失败')
          return
        }
        this.isEdit = true
        this.activeStep = 0
        // 步骤一：任务属性（来源库/目标库用级联完整路径 [groupId, dbId]，否则下拉不显示）
        const sourcePath = this.findCascaderPathByDbId(data.sourceDbId)
        const targetPath = this.findCascaderPathByDbId(data.targetDbId)
        this.taskForm = {
          id: data.taskId,
          taskName: data.taskName || '',
          sourceSchema: sourcePath,
          targetSchema: targetPath,
          engineType: data.engineType != null ? String(data.engineType) : '',
          syncType: (data.syncType === '1' ? '1' : '0')
        }
        // 步骤四：写入设置（取首组表映射，与后端 deleteDataFlag / writeType / batchSize / parallelWriteFlag 一致）
        const firstTable = (data.tableMappers && data.tableMappers[0]) || {}
        this.writeSettingForm = {
          writeMode: (firstTable.writeType === 'INSERT' ? 'insert' : 'upsert'),
          batchSize: firstTable.batchSize != null ? firstTable.batchSize : 1000,
          deleteBeforeWrite: firstTable.deleteDataFlag ? 'yes' : 'no',
          enableParallel: firstTable.parallelWriteFlag ? 'yes' : 'no'
        }
        // 步骤二、三：表映射与字段映射
        this.rightPanelTables = (data.tableMappers || []).map(tm => tm.sourceTableName).filter(Boolean)
        this.mappingGroups = (data.tableMappers || []).map((tm, i) => ({
          id: 'g_edit_' + (tm.id != null ? tm.id : i) + '_' + Date.now(),
          sourceTable: tm.sourceTableName || '',
          targetTable: tm.targetTableName || '',
          mappedFields: (tm.fieldMappers || []).map(f => ({
            sourceField: f.sourceFieldName || '',
            targetField: f.targetFieldName || '',
            sourceType: '',
            targetType: ''
          })),
          selectedMappedFields: []
        }))
        if (this.mappingGroups.length === 0) {
          this.mappingGroups = [this.createEmptyGroup()]
        }
        this.activeMappingNames = this.mappingGroups.map(g => g.id);
        // 预填表ID映射，便于 getTableFields 解析（loadSourceTables/loadTargetTables 会覆盖为完整列表）
        (data.tableMappers || []).forEach(tm => {
          if (tm.sourceTableName != null && tm.sourceTableId != null) {
            this.$set(this.sourceTableIdMap, tm.sourceTableName, tm.sourceTableId)
          }
          if (tm.targetTableName != null && tm.targetTableId != null) {
            this.$set(this.targetTableIdMap, tm.targetTableName, tm.targetTableId)
          }
        })
        this.taskDialogVisible = true
        this.$nextTick(async() => {
          if (this.$refs.taskFormRef) this.$refs.taskFormRef.clearValidate()
          await Promise.all([this.loadSourceTables(), this.loadTargetTables()])
          this.initFieldInfo()
        })
      } catch (err) {
        console.error(err)
        this.msgError(err?.response?.data?.message || err?.message || '获取任务详情失败')
      } finally {
        this.tableLoading = false
      }
    },
    canStart(row) {
      const s = row && String(row.taskStatus)
      // 未启动 / 已停止 / 失败 可启动
      return s === 'INIT' || s === 'STOP' || s === 'FAILURE'
    },
    canStop(row) {
      const s = row && String(row.taskStatus)
      // 仅运行中可停止
      return s === 'RUNNING' || s === 'R'
    },
    canEdit(row) {
      const s = row && String(row.taskStatus)
      // 启动中/运行中/停止中不可编辑
      return s !== 'STARTING' && s !== 'RUNNING' && s !== 'STOPPING' && s !== 'R'
    },
    canDelete(row) {
      const s = row && String(row.taskStatus)
      // 启动中/运行中/停止中不可删除
      return s !== 'STARTING' && s !== 'RUNNING' && s !== 'STOPPING' && s !== 'R'
    },
    // 启动任务
    async handleStartTask(row) {
      const taskId = row && row.taskId
      if (taskId == null) {
        this.$message.warning('缺少任务ID')
        return
      }
      if (!this.canStart(row)) {
        this.$message.warning('当前状态不可启动')
        return
      }
      try {
        const res = await startRealtimeTask(taskId)
        if (res && (res.code === '000000' || res.code === 200 || res.success === true)) {
          this.$message.success(res.message || '启动成功')
          this.queryTaskList(false)
        } else {
          this.msgError(res?.message || '启动失败')
        }
      } catch (err) {
        console.error(err)
        this.msgError(err?.response?.data?.message || err?.message || '启动任务失败')
      }
    },
    // 停止任务
    async handleStopTask(row) {
      const taskId = row && row.taskId
      if (taskId == null) {
        this.$message.warning('缺少任务ID')
        return
      }
      if (!this.canStop(row)) {
        this.$message.warning('当前状态不可停止')
        return
      }
      try {
        const res = await stopRealtimeTask(taskId)
        if (res && (res.code === '000000' || res.code === 200 || res.success === true)) {
          this.$message.success(res.message || '停止成功')
          this.queryTaskList(false)
        } else {
          this.msgError(res?.message || '停止失败')
        }
      } catch (err) {
        console.error(err)
        this.msgError(err?.response?.data?.message || err?.message || '停止任务失败')
      }
    },
    // 删除任务（逻辑删除，对接 /realtime/task/delete.do）
    handleDeleteTask(row) {
      const taskId = row && row.taskId
      if (taskId == null) {
        this.$message.warning('缺少任务ID')
        return
      }
      if (!this.canDelete(row)) {
        this.$message.warning('启动中/运行中/停止中任务不可删除')
        return
      }
      this.$confirm('确定要删除该实时任务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async() => {
          try {
            const res = await deleteRealtimeTask(taskId)
            if (res && (res.code === '000000' || res.code === 200 || res.success === true)) {
              this.$message.success(res.message || '删除成功')
              this.queryTaskList(false)
            } else {
              this.msgError(res?.message || '删除失败')
            }
          } catch (err) {
            console.error(err)
            this.msgError(err?.response?.data?.message || err?.message || '删除任务失败')
          }
        })
        .catch(() => {
          this.$message.info('已取消删除')
        })
    },
    // 分页大小改变
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.queryTaskList()
    },
    // 当前页改变
    handleCurrentChange(current) {
      this.pagination.currentPage = current
      this.queryTaskList()
    },
    // 上一步
    prevStep() {
      this.activeStep--
    },
    // 下一步
    nextStep() {
      if (this.activeStep === 0) {
        if (!this.$refs.taskFormRef) return
        this.$refs.taskFormRef.validate(valid => {
          if (valid) {
            Promise.all([this.loadSourceTables(), this.loadTargetTables()]).finally(() => {
              this.activeStep++
            })
          } else {
            this.msgWarning('请完善步骤1的必填项')
          }
        })
      } else if (this.activeStep === 1) {
        if (this.rightPanelTables.length === 0) {
          this.msgWarning('请至少选择一个来源表')
          return
        }
        if (this.mappingGroups.length === 0) {
          const first = this.createEmptyGroup()
          this.mappingGroups = [first]
          this.activeMappingNames = [first.id]
        }
        this.activeStep++
      } else if (this.activeStep === 2) {
        this.activeStep++
      }
    },
    // 保存任务
    // 移动到右侧
    moveToRight() {
      this.selectedTables.forEach(table => {
        if (!this.rightPanelTables.includes(table)) {
          this.rightPanelTables.push(table)
        }
      })
      this.msgSuccess(`已添加 ${this.selectedTables.length} 个表`)
    },
    // 移动到左侧
    moveToLeft() {
      this.selectedRightTables.forEach(table => {
        const rightIndex = this.rightPanelTables.indexOf(table)
        if (rightIndex > -1) {
          this.rightPanelTables.splice(rightIndex, 1)
        }
        const leftIndex = this.selectedTables.indexOf(table)
        if (leftIndex > -1) {
          this.selectedTables.splice(leftIndex, 1)
        }
      })
      this.selectedRightTables = []
      this.msgSuccess('已移除选中表')
    },
    // 树节点点击
    handleTreeNodeClick(data) {
      if (data.type === 'field') {
        console.log('选中字段:', data)
      }
    },
    // 获取表字段信息（来源表 / 目标表通用）
    async getTableFields(tableName) {
      if (!tableName) return
      const tableMeta = this.tableInfo[tableName] || {}
      const tableId =
        tableMeta.tableId ||
        this.sourceTableIdMap[tableName] ||
        this.targetTableIdMap[tableName]

      if (!tableId) {
        console.warn('未找到表ID，无法加载字段：', tableName)
        return
      }

      this.fieldsLoading = true
      try {
        const res = await fieldList(tableId)
        if (res && res.code === '000000' && Array.isArray(res.data)) {
          const fields = res.data.map(field => ({
            id: field.id,
            label: field.name,
            name: field.name,
            businessName: field.businessName,
            dataType: field.dataType,
            primaryKey: field.primaryKey
          }))

          // 更新表结构缓存（各组从 tableInfo 按表名读取字段）
          this.$set(this.tableInfo, tableName, {
            ...(this.tableInfo[tableName] || {}),
            tableId,
            name: tableName,
            fields
          })
        } else {
          this.msgError(res && res.message ? res.message : '获取字段列表失败')
        }
      } catch (error) {
        console.error('获取字段列表失败:', error)
        this.msgError('获取字段列表失败')
      } finally {
        this.fieldsLoading = false
      }
    },
    // 已映射的源字段不可勾选（针对某组）
    isSourceFieldSelectable(row, group) {
      const name = row.name || row.label
      return !name || !(group.mappedFields || []).some(m => m.sourceField === name)
    },
    // 移动字段到右侧（某组）
    moveFieldToRight(group) {
      const refName = 'sourceTable_' + group.id
      const ref = this.$refs[refName]
      const tableRef = Array.isArray(ref) ? ref[0] : ref
      if (!tableRef || !tableRef.selection) return
      const selectedRows = tableRef.selection

      selectedRows.forEach(field => {
        const exists = (group.mappedFields || []).some(f => f.sourceField === (field.label || field.name))
        if (!exists) {
          group.mappedFields.push({
            sourceField: field.name || field.label,
            sourceType: field.dataType,
            targetField: '',
            targetType: field.dataType
          })
        }
      })

      if (selectedRows.length > 0) {
        this.msgSuccess(`已添加 ${selectedRows.length} 个字段`)
        if (tableRef) tableRef.clearSelection()
      }
    },
    // 映射表勾选变化（某组）
    handleMappingSelectionChange(group, selection) {
      group.selectedMappedFields = selection || []
    },
    // 移动字段到左侧（某组）
    moveFieldToLeft(group) {
      if ((group.mappedFields || []).length === 0) return
      const selection = group.selectedMappedFields && group.selectedMappedFields.length > 0
        ? group.selectedMappedFields
        : null
      const refName = 'mappingTable_' + group.id
      const ref = this.$refs[refName]
      const tableRef = Array.isArray(ref) ? ref[0] : ref
      if (selection && selection.length > 0) {
        const set = new Set(selection)
        group.mappedFields = group.mappedFields.filter(m => !set.has(m))
        group.selectedMappedFields = []
        if (tableRef) tableRef.clearSelection()
        this.msgSuccess(`已取消 ${selection.length} 个字段映射`)
      } else {
        group.mappedFields = []
        group.selectedMappedFields = []
        if (tableRef) tableRef.clearSelection()
        this.msgSuccess('已清空字段映射')
      }
    },
    // 移除某组中一条字段映射
    removeField(group, index) {
      group.mappedFields.splice(index, 1)
      this.msgSuccess('已移除字段')
    },
    // 处理目标字段变化（某组）
    handleTargetFieldChange(row, group) {
      const targetList = this.tableInfo[group.targetTable]?.fields || []
      const targetField = targetList.find(f => f.label === row.targetField)
      if (targetField) {
        row.targetType = targetField.dataType
        row.targetLength = targetField.targetLength
        row.targetPrecision = targetField.precision
      }
    },
    // 删除整组映射
    removeMappingGroup(gIndex) {
      this.mappingGroups.splice(gIndex, 1)
      this.msgSuccess('已移除该组映射')
    },
    // 初始化字段信息（为已有映射组加载表字段）
    initFieldInfo() {
      const tables = new Set();
      (this.mappingGroups || []).forEach(g => {
        if (g.sourceTable) tables.add(g.sourceTable)
        if (g.targetTable) tables.add(g.targetTable)
      })
      tables.forEach(name => this.getTableFields(name))
    },
    // 添加匹配：新增一组来源->目标映射（可折叠）
    addMapping() {
      const newGroup = this.createEmptyGroup()
      this.mappingGroups.push(newGroup)
      this.activeMappingNames.push(newGroup.id)
      this.msgSuccess('已新增一组映射，请选择来源表与目标表并配置字段')
    },
    // 保存任务：对接后端 /realtime/add.do（RealTimeTaskForm + RealTimeTableForm + RealTimeFieldMapperForm）
    async saveTask() {
      const schema = this.taskForm.sourceSchema
      const targetSchema = this.taskForm.targetSchema
      const sourceDbId = Array.isArray(schema) && schema.length ? schema[schema.length - 1] : null
      const targetDbId = Array.isArray(targetSchema) && targetSchema.length ? targetSchema[targetSchema.length - 1] : null

      if (!this.taskForm.taskName || !sourceDbId || !targetDbId || !this.taskForm.engineType || !this.taskForm.syncType) {
        this.msgWarning('请完善步骤一：任务名称、来源库、目标库、CDC 引擎、同步类型')
        return
      }

      if (!this.mappingGroups || this.mappingGroups.length === 0) {
        this.msgWarning('请至少配置一组来源表与目标表的字段映射')
        return
      }

      const w = this.writeSettingForm
      const deleteFlag = w.deleteBeforeWrite === 'yes'
      const parallelWriteFlag = w.enableParallel === 'yes'
      const parallelThreadNum = 5
      const writeType = (w.writeMode === 'insert' ? 'INSERT' : w.writeMode === 'upsert' ? 'UPSERT' : 'INSERT')
      const batchSize = w.batchSize || 1000

      const tableMappers = []
      for (const g of this.mappingGroups) {
        const sourceTableId = this.sourceTableIdMap[g.sourceTable]
        const targetTableId = this.targetTableIdMap[g.targetTable]
        if (!sourceTableId || !targetTableId || !g.sourceTable || !g.targetTable) {
          this.msgWarning(`请为「${g.sourceTable || '来源表'} → ${g.targetTable || '目标表'}」选择有效的来源表与目标表`)
          return
        }

        const sourceFields = this.tableInfo[g.sourceTable]?.fields || []
        const targetFields = this.tableInfo[g.targetTable]?.fields || []

        const fieldMappers = []
        for (const m of (g.mappedFields || [])) {
          const sourceFieldMeta = sourceFields.find(f => (f.name || f.label) === m.sourceField)
          const targetFieldMeta = targetFields.find(f => (f.name || f.label) === m.targetField)
          if (!sourceFieldMeta || !sourceFieldMeta.id || !targetFieldMeta || !targetFieldMeta.id) {
            this.msgWarning(`字段映射「${m.sourceField} → ${m.targetField}」缺少字段ID，请重新选择来源表/目标表`)
            return
          }
          fieldMappers.push({
            sourceFieldId: sourceFieldMeta.id,
            sourceFieldName: m.sourceField,
            targetFieldId: targetFieldMeta.id,
            targetFieldName: m.targetField
          })
        }

        tableMappers.push({
          sourceTableId: Number(sourceTableId),
          sourceTableName: g.sourceTable,
          targetTableId: Number(targetTableId),
          targetTableName: g.targetTable,
          deleteFlag,
          parallelWriteFlag,
          parallelThreadNum,
          writeType,
          batchSize,
          fieldMappers
        })
      }

      const first = this.mappingGroups[0]
      const payload = {
        taskName: this.taskForm.taskName,
        sourceDbId: Number(sourceDbId),
        targetDbId: Number(targetDbId),
        engineType: this.taskForm.engineType,
        syncType: this.taskForm.syncType,
        sourceTableId: Number(this.sourceTableIdMap[first.sourceTable]),
        targetTableId: Number(this.targetTableIdMap[first.targetTable]),
        writeType,
        batchSize,
        deleteFlag,
        parallelWriteFlag,
        parallelThreadNum,
        tableMappers
      }

      const isEdit = this.isEdit && this.taskForm.id != null && this.taskForm.id !== ''
      if (isEdit) {
        payload.taskId = Number(this.taskForm.id)
      }

      try {
        const res = isEdit
          ? await updateRealtimeTask(payload)
          : await addRealtimeTask(payload)
        if (res && (res.code === '000000' || res.code === 200 || res.success === true)) {
          this.msgSuccess(res.message || (isEdit ? '更新任务成功' : '保存任务成功'))
          this.taskDialogVisible = false
          this.queryTaskList()
        } else {
          this.msgError(res?.message || (isEdit ? '更新失败' : '保存失败'))
        }
      } catch (err) {
        console.error(err)
        this.msgError(err?.response?.data?.message || err?.message || (isEdit ? '更新任务失败' : '保存任务失败'))
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
.container {
  flex: 1;
  background-color: #f8f8fc;
}

// 主内容区域样式调整
::v-deep .el-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden; // 隐藏溢出内容
}

/* 确保内部容器高度正确 */
.body >>> .el-container {
  height: 100%;
  min-height: 100%;
}

.body .list {
  padding: 10px 20px 20px 20px;
  background: #fff fixed;
  box-shadow: $shadow;
  border-radius: 4px;
  height: 100%;
  min-width: 0;
}

// 表格区域样式调整
::v-deep .el-main {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  margin-left: 0 !important;
  margin-top: -10px !important;
  padding: 20px 10px;
  .list {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;
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

::v-deep .el-main {
  box-shadow: $shadow;
  overflow-y: visible;
  display: block;
}

::v-deep .el-table {
  border: 1px solid #ebeef5;
  border-bottom: 0;
  max-height: 630px;
}

::v-deep .el-cascader .el-input {
  width: 180px;
}

.body .list {
  padding: 10px 12px 20px 12px;
  background: #fff fixed;
  box-shadow: $shadow;
  border-radius: 4px;
  height: calc(100vh - 90px);
  min-width: 0;
}

.body .list .search {
  padding: 10px 6px 10px 0;
  margin-bottom: 20px;
  min-width: 0;
}

.body .list .search .search-row {
  flex-wrap: wrap;
}

.body .list .search .search-row-uniform {
  display: flex;
  align-items: center;
  row-gap: 8px;
  column-gap: 12px;
  margin-left: 0 !important;
  margin-right: 0 !important;
  flex-wrap: wrap;
}

.body .list .search .search-row-uniform .el-col {
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.body .list .search .search-col-btns .search-btns {
  justify-content: flex-end;
}

.body .list .search .search-col-btns {
  padding-left: 0 !important;
  flex: 0 0 auto;
  min-width: auto;
  margin-left: auto;
}

.body .list .search .search-col {
  min-width: 0;
}

.body .list .search .search-btns {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  white-space: nowrap;
  flex-wrap: nowrap;
}

.body .list .search .search-input {
  width: 170px;
  min-width: 170px;
}

.body .list .search .search-input,
.body .list .search .search-cascader,
.body .list .search .search-select {
  width: 170px;
  min-width: 170px;
  max-width: 170px;
}

.body .list .label {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
  flex-shrink: 0;
  margin-right: 4px;
}

.body .list .search .col .label {
  width: 72px;
  min-width: 72px;
  text-align: right;
}

.body .list .search .col {
  gap: 6px;
  width: 100%;
}

.body .list .col {
  display: flex;
  align-items: center;
  line-height: 32px;
}

.body .list .col .search-input,
.body .list .col .search-cascader,
.body .list .col .search-select {
  flex: 1 1 auto;
  min-width: 0;
}

.body .list .search .search-input ::v-deep .el-input__inner {
  padding-left: 10px;
}

.body .list .search .search-cascader,
.body .list .search .search-select {
  width: 170px;
  min-width: 170px;
}

.body .list .search .search-select ::v-deep .el-input__inner {
  width: 100%;
}

@media (max-width: 1500px) {
  .app-wrapper.openSidebar .realtime-page .body .list .search .search-col:not(.search-col-btns) {
    flex: 1 1 260px;
    min-width: 260px;
  }
}

.app-wrapper.openSidebar .realtime-page .body .list .search .search-col-btns {
  flex: 1 1 100%;
  min-width: 100%;
  margin-left: 0;
}

.app-wrapper.openSidebar .realtime-page .body .list .search .search-col-btns .search-btns {
  justify-content: flex-end;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 20px;
  flex-shrink: 0;
}

.action-btns {
  gap: 6px;
  justify-content: flex-start;
  flex-wrap: wrap;

  .el-button--text {
    padding: 0;

    &:hover {
      color: #409eff;
    }
  }
}

.status-clickable {
  cursor: pointer;
}

.rt-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 14px;
  font-size: 12px;
  line-height: 28px;
  border: 1px solid transparent;
  user-select: none;
}

.rt-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.rt-status.is-running {
  color: #19be6b;
  background: rgba(25, 190, 107, 0.08);
  border-color: rgba(25, 190, 107, 0.25);
}
.rt-status.is-running .rt-status-dot {
  background: #19be6b;
}

.rt-status.is-failure {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.08);
  border-color: rgba(245, 108, 108, 0.25);
}
.rt-status.is-failure .rt-status-dot {
  background: #f56c6c;
}

.rt-status.is-init,
.rt-status.is-stopped,
.rt-status.is-starting,
.rt-status.is-stopping {
  color: #606266;
  background: #f5f7fa;
  border-color: #e4e7ed;
}

.rt-status.is-clickable {
  cursor: pointer;
}
.rt-status.is-clickable:hover {
  border-color: rgba(245, 108, 108, 0.6);
  background: rgba(245, 108, 108, 0.12);
}

.rt-status-fail-underline {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.reason-dialog {
  ::v-deep .el-dialog {
    width: 700px !important;
    max-width: calc(100vw - 32px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    margin-top: 8vh !important;
    margin-bottom: 5vh;
    border-radius: 8px;
    border: 1px solid #ebeef5;
    box-shadow: 0 8px 36px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  ::v-deep .el-dialog__header {
    position: relative;
    flex-shrink: 0;
    padding: 14px 48px 14px 16px;
    margin: 0;
    border-bottom: 1px solid #ebeef5;
    background: #fff;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    cursor: move;
  }
  ::v-deep .el-dialog__title {
    color: #303133;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: 0.02em;
  }
  ::v-deep .el-dialog__headerbtn {
    top: 50%;
    right: 14px;
    transform: translateY(-50%);
    padding: 0;
  }
  ::v-deep .el-dialog__headerbtn .el-dialog__close {
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    border-radius: 50%;
    background: #eef0f3;
    color: #606266;
    font-size: 15px;
    transition: background-color 0.2s, color 0.2s;
  }
  ::v-deep .el-dialog__headerbtn .el-dialog__close:hover {
    background: #e4e7ed;
    color: #303133;
  }
  ::v-deep .el-dialog__body {
    flex-shrink: 0;
    padding: 14px 16px 16px;
    box-sizing: border-box;
    overflow: hidden;
    background: #fafafa;
  }
}

.reason-body {
  height: 270px;
  width: 100%;
  overflow-y: auto;
  overflow-x: auto;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  box-sizing: border-box;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02);
  scrollbar-width: thin;
  scrollbar-color: #c0c4cc #eff1f5;
}

.reason-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.reason-body::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

.reason-body::-webkit-scrollbar-track {
  background: #eff1f5;
  border-radius: 4px;
}

.reason-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #606266;
  font-size: 13px;
  line-height: 1.65;
  font-family: Consolas, Menlo, Monaco, 'Courier New', monospace;
}

// 任务对话框样式
.task-dialog {
  margin-top: -5vh;

  ::v-deep .el-dialog__wrapper {
    z-index: 20000 !important;
  }

  ::v-deep .v-modal {
    z-index: 19999 !important;
  }

  ::v-deep .el-dialog {
    z-index: 20001 !important;
  }

  ::v-deep .el-dialog__body {
    padding: 20px 30px;
  }

  .steps {
    margin-bottom: 30px;
  }

  .step-content {
    padding: 10px 0;
  }

  ::v-deep .el-steps {
    background: #f5f7fa;
    padding: 16px 24px;
    border-radius: 4px;
    margin: -10px -10px 24px;
  }

  ::v-deep .el-step__title.is-process {
    font-weight: 600;
    color: #303133;
  }

  ::v-deep .el-step__title.is-wait {
    color: #909399;
  }

  ::v-deep .el-step__icon {
    width: 26px;
    height: 26px;
    font-size: 14px;
  }

  /* 已完成步骤使用 Element 主色蓝 */
  ::v-deep .el-step__head.is-finish {
    color: #409eff;
    border-color: #409eff;
  }
  ::v-deep .el-step__title.is-finish {
    color: #409eff;
  }
  ::v-deep .el-step__icon.is-icon {
    border-color: #409eff;
    color: #409eff;
  }
  ::v-deep .el-step__line-inner {
    background-color: #409eff !important;
  }
}

// 同步类型提示样式
.sync-type-tip {
  margin-top: 16px;
  background: linear-gradient(135deg, #f8faff 0%, #f5f7fa 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e9ecf3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;

  &.full-active {
    border-left: 4px solid #409eff;
    background: linear-gradient(135deg, #f0f7ff 0%, #f5f7fa 100%);
  }

  &.inc-active {
    border-left: 4px solid #4ef048;
    background: linear-gradient(135deg, #f0f9eb 0%, #f5f7fa 100%);
  }

  .tip-header {
    display: flex;
    align-items: center;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #d9e1ec;

    i {
      color: #909399;
      font-size: 16px;
      margin-right: 6px;
    }

    span {
      font-size: 13px;
      font-weight: 500;
      color: #5a6a7e;
    }
  }

  .tip-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tip-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.9);
      transform: translateX(2px);
    }

    &.active {
      background-color: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      .tip-badge.full {
        background-color: #409eff;
        color: white;
        border-color: #409eff;
      }

      .tip-badge.inc {
        background-color: #67c23a;
        color: white;
        border-color: #67c23a;
      }
    }
  }

  .tip-badge {
    flex-shrink: 0;
    display: inline-block;
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    text-align: center;
    border: 1px solid;
    min-width: 48px;

    &.full {
      background-color: #ecf5ff;
      color: #409eff;
      border-color: #c6e2ff;
    }

    &.inc {
      background-color: #f0f9eb;
      color: #67c23a;
      border-color: #c2e7b0;
    }
  }

  .tip-text {
    font-size: 13px;
    line-height: 1.6;
    color: #5a6874;
    flex: 1;

    strong {
      color: #304156;
      font-weight: 600;
      margin-right: 4px;
    }
  }
}

// 表格选择样式 - 仿transfer
.table-selection {
  display: flex;
  gap: 20px;
  height: 440px;
  user-select: none;
}

.transfer-panel {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    border-color: #c0c4cc;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  }

  &__header {
    padding: 12px 16px;
    background: #f5f7fa;
    border-bottom: 1px solid #dcdfe6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;

    .header-title {
      font-weight: 500;
      color: #303133;
    }

    .header-count {
      color: #909399;
      font-size: 12px;
      background: #e4e7ed;
      padding: 2px 8px;
      border-radius: 12px;
    }
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__filter {
    padding: 12px;
    border-bottom: 1px solid #ebeef5;

    ::v-deep .el-input__inner {
      border-radius: 16px;
      background-color: #f5f7fa;
      border-color: transparent;

      &:focus {
        background-color: #fff;
        border-color: #409eff;
      }
    }

    ::v-deep .el-input__prefix {
      left: 8px;
    }
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  &__item {
    padding: 8px 16px;
    transition: background-color 0.2s;
    cursor: pointer;

    &:hover {
      background-color: #f5f7fa;
    }

    &.is-checked {
      background-color: #ecf5ff;
    }

    ::v-deep .el-checkbox {
      display: flex;
      align-items: flex-start;
      width: 100%;
      margin-right: 0;

      .el-checkbox__label {
        flex: 1;
        line-height: 1.4;
        white-space: normal;
        word-break: break-word;
      }
    }

    .item-label {
      font-size: 14px;
      color: #303133;
      font-weight: 500;
      display: block;
      margin-bottom: 2px;
    }

    .item-desc {
      font-size: 12px;
      color: #909399;
      display: block;
    }
  }

  &__empty {
    padding: 32px 16px;
    text-align: center;
    color: #909399;
    font-size: 13px;

    i {
      font-size: 24px;
      margin-bottom: 8px;
      color: #dcdfe6;
      display: block;
    }
  }
}

.transfer-buttons {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 0 4px;

  .transfer-button {
    width: 40px;
    height: 40px;
    padding: 0;
    font-size: 18px;
    transition: all 0.2s;
    border-radius: 10px;

    i {
      margin: 0;
    }

    &:hover {
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }

    &:disabled {
      opacity: 0.5;
      transform: none;
    }
  }
}

// 字段映射样式
.field-mapping {
  margin-top: 10px;

  .mapping-header-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .mapping-collapse {
    border: none;

    ::v-deep .el-collapse-item__header {
      height: auto;
      min-height: 48px;
      padding: 8px 12px;
      align-items: center;
      background: #fafbfc;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    ::v-deep .el-collapse-item__wrap {
      border: none;
      margin-bottom: 12px;
    }
    ::v-deep .el-collapse-item__content {
      padding: 12px 0;
    }
  }

  .collapse-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    flex: 1;
    margin-right: 8px;

    .info-label {
      font-size: 13px;
      color: #606266;
      flex-shrink: 0;
    }
    .collapse-select {
      width: 160px;
    }
    .group-summary {
      font-size: 12px;
      color: #909399;
      margin-left: 8px;
    }
  }

  .remove-group-btn {
    color: #f56c6c;
    padding: 4px;
    flex-shrink: 0;
  }
}

.write-setting-inline {
  margin-top: 24px;
  padding: 16px;
  background: #f9fafc;
  border: 1px solid #e4e7ed;
  border-radius: 8px;

  .write-setting-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }

  .write-setting-form {
    max-width: 480px;
  }

  .setting-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}

.mapping-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px;
  background: #f9fafc;
  border-radius: 8px;
  border: 1px solid #e4e7ed;

  .source-info,
  .target-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .info-label {
      font-size: 13px;
      color: #606266;
    }
  }

  .table-select {
    width: 180px;
  }

  .mapping-actions {
    display: flex;
    gap: 8px;

    .el-button + .el-button {
      margin-left: 4px;
    }
  }
}

.mapping-content {
  display: flex;
  gap: 20px;
  height: 400px;
}

.left-tree {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;

  .tree-body {
    flex: 1;
    min-height: 0;
    max-height: 320px;
    overflow-y: auto;
    position: relative;
  }

  .tree-header {
    padding: 10px 12px;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 500;
    color: #303133;
    flex-shrink: 0;

    .tree-count {
      color: #909399;
      font-size: 12px;
    }
  }
}

.source-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.tree-node {
  display: flex;
  align-items: center;
  width: 100%;

  .table-icon,
  .field-icon {
    margin-right: 6px;
    font-size: 14px;
  }

  .node-label {
    flex: 1;
    font-size: 13px;
  }

  .node-type {
    font-size: 11px;
    color: #909399;
    background: #f0f2f5;
    padding: 2px 6px;
    border-radius: 12px;
    margin-left: 8px;
  }
}

.center-buttons {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 0 5px;

  .el-button.is-circle {
    padding: 8px;
  }
}

.right-fields {
  flex: 2;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  .fields-body {
    flex: 1;
    min-height: 0;
    max-height: 320px;
    overflow-y: auto;
    position: relative;
  }

  .fields-header {
    padding: 10px 12px;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 500;
    color: #303133;
    flex-shrink: 0;

    .fields-count {
      color: #909399;
      font-size: 12px;
    }
  }
}

.source-table,
.mapping-table {
  flex: 1;
  height: calc(100% - 40px) !important;

  ::v-deep .el-table__header th {
    background-color: #fafafa;
    color: #606266;
    font-weight: 500;
    font-size: 12px;
    padding: 8px 0;
  }

  ::v-deep .el-table__row {
    height: 36px;
  }

  ::v-deep .el-table__cell {
    padding: 8px 0;
  }

  .source-field {
    font-weight: 500;
    color: #303133;
  }

  .field-select {
    width: 100%;
  }
}

.empty-fields {
  padding: 40px 16px;
  text-align: center;
  color: #909399;
  min-height: 120px;
  box-sizing: border-box;

  i {
    font-size: 40px;
    color: #dcdfe6;
    margin-bottom: 8px;
    display: block;
  }

  p {
    margin: 4px 0;
    font-size: 13px;
  }

  .empty-tip {
    font-size: 12px;
    color: #c0c4cc;
  }
}

// 写入设置弹窗
.write-setting-dialog {
  ::v-deep .el-dialog__body {
    padding: 16px 24px 10px;
  }

  .setting-tip {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
  }
}

// 表单样式（新增实时任务弹窗内保持原样，不受列表搜索栏 max-width 影响）
.task-form {

  .form-input,
  .form-select,
  .full-width {
    width: 100%;
    max-width: none;
  }

  /* 来源数据库、目标数据库级联与任务名称、CDC引擎宽度统一 */
  ::v-deep .el-cascader.full-width,
  ::v-deep .full-width.el-cascader {
    width: 100%;
    display: block;
  }
  ::v-deep .el-cascader .el-input {
    width: 100%;
  }
  ::v-deep .el-cascader .el-input .el-input__inner {
    width: 100%;
  }

  .el-form-item {
    margin-bottom: 20px;
  }

  ::v-deep .el-input__inner {
    border-radius: 4px;

    &:focus {
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }
  }
}

// 响应式调整
@media screen and (max-width: 1200px) {
  .body .list {
    min-width: 1000px;
  }
}

</style>

<style lang="scss">
/* 弹窗内的 message 显示在弹窗之上，不被遮挡 */
.task-dialog-message {
  z-index: 10000 !important;
}

</style>
