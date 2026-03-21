<template>
  <div class="container">
    <div class="body">
      <el-container>
        <el-aside width="260px" class="page-aside">
          <div class="group">
            <div class="wrap">
              <div class="flex search">
                <el-input
                  v-model="groupFilter"
                  placeholder="请输入分组名称"
                  clearable
                  @input="queryGroupsByName"
                >
                  <i slot="prefix" class="el-input__icon el-icon-search" />
                </el-input>
              </div>

              <el-button
                type="primary"
                class="queryAll"
                size="mini"
                @click="handleViewAll"
              >
                查看全部数据
              </el-button>

              <el-tree
                :data="groupTree"
                node-key="id"
                highlight-current
                :default-expand-all="true"
                :props="{ children: 'children', label: 'name' }"
                @node-click="handleGroupClick"
              >
                <div slot-scope="{ data }" class="custom-node flex between">
                  <img :src="icons.db_group" class="group_icon">
                  <div class="flex node-label">
                    {{ data.name }}
                  </div>
                </div>
              </el-tree>
            </div>
          </div>
        </el-aside>

        <el-main>
          <div class="list">
            <div class="search">
              <el-row class="search-row search-row-uniform" :gutter="12">
                <el-col class="search-col search-col-equal" :span="6">
                  <div class="col">
                    <div class="label">任务名称：</div>
                    <el-input
                      v-model="searchForm.taskName"
                      class="search-input"
                      placeholder="请输入任务名称"
                      clearable
                    />
                  </div>
                </el-col>
                <el-col
                  class="search-col search-col-equal search-col-btns"
                  :span="6"
                >
                  <div class="col">
                    <div class="label">最近执行状态：</div>
                    <el-select
                      v-model="searchForm.lastRunStatus"
                      class="search-select"
                      clearable
                      placeholder="请选择"
                    >
                      <el-option
                        v-for="opt in taskStatusSelectOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </el-select>
                  </div>
                </el-col>
                <el-col class="search-col search-col-equal" :span="6">
                  <div class="col">
                    <div class="label">启用状态：</div>
                    <el-select
                      v-model="searchForm.enabled"
                      class="search-select"
                      clearable
                      placeholder="全部"
                    >
                      <el-option
                        v-for="opt in enabledOptions"
                        :key="String(opt.value)"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </el-select>
                  </div>
                </el-col>
                <el-col class="search-col search-col-equal" :span="6">
                  <div class="col search-btns">
                    <el-button
                      type="primary"
                      icon="el-icon-search"
                      size="small"
                      @click="queryTaskList(true)"
                    >查询</el-button>
                    <el-button
                      type="primary"
                      size="small"
                      @click="openTaskDialog('add')"
                    >新建任务</el-button>
                  </div>
                </el-col>
              </el-row>
            </div>

            <el-table
              v-loading="tableLoading"
              :data="taskList"
              style="width: 100%"
              max-height="640"
              element-loading-text="正在加载数据..."
              element-loading-spinner="el-icon-loading"
              element-loading-background="rgba(255, 255, 255, 0.8)"
            >
              <el-table-column fixed type="index" label="#" width="60" />
              <el-table-column
                prop="taskName"
                label="任务名称"
                min-width="220"
                max-width="220"
              />
              <el-table-column
                prop="remark"
                label="备注"
                min-width="220"
                max-width="220"
              />
              <el-table-column
                prop="scheduleText"
                label="同步策略"
                width="180"
              />

              <el-table-column label="最近执行状态" width="140">
                <template slot-scope="scope">
                  <el-tag :type="taskStatusType(scope.row)">
                    {{ taskStatusLabel(scope.row) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column
                prop="lastRunTime"
                label="最近执行时间"
                width="200"
              />
              <el-table-column fixed="right" label="操作" width="220">
                <template slot-scope="scope">
                  <el-button
                    type="text"
                    size="small"
                    @click="handleRun(scope.row)"
                  >查看</el-button>
                  <el-button
                    type="text"
                    size="small"
                    @click="openTaskDialog('edit', scope.row)"
                  >编辑</el-button>
                  <el-button
                    type="text"
                    size="mini"
                    @click="toggleEnableStatus(scope.row)"
                  >
                    {{
                      isEnabled(
                        scope.row.enable != null
                          ? scope.row.enable
                          : scope.row.enabled
                      )
                        ? "禁用"
                        : "启用"
                    }}
                  </el-button>
                  <el-button
                    type="text"
                    size="small"
                    @click="handleImmediatelyExecute(scope.row)"
                  >立即执行</el-button>
                  <el-button
                    type="text"
                    size="small"
                    @click="handleDeleteTask(scope.row)"
                  >删除</el-button>
                </template>
              </el-table-column>
            </el-table>

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

    <el-dialog
      :visible.sync="taskDialogVisible"
      :title="taskDialogMode === 'edit' ? '编辑任务' : '新增任务'"
      width="460px"
      class="task-dialog"
      :close-on-click-modal="false"
      :append-to-body="true"
      :modal-append-to-body="true"
    >
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="taskFormRules"
        label-width="92px"
        size="small"
        class="dialog-form"
      >
        <el-form-item label="任务名称" prop="taskName">
          <el-input
            v-model="taskForm.taskName"
            placeholder="请输入任务名称"
            clearable
            class="dialog-input"
          />
        </el-form-item>

        <el-form-item label="清洗流程" prop="flowId">
          <el-cascader
            v-model="taskForm.flowId"
            :options="flowCascaderOptions"
            :props="flowCascaderProps"
            :show-all-levels="false"
            placeholder="请选择清洗流程"
            clearable
            filterable
            class="dialog-cascader"
          />
        </el-form-item>

        <el-form-item label="执行类型" prop="executeType">
          <el-select
            v-model="taskForm.executeType"
            placeholder="请选择执行类型"
            clearable
            class="dialog-select"
          >
            <el-option
              v-for="opt in scheduleTypeOptions"
              :key="opt.code"
              :label="opt.label"
              :value="opt.code"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="isCronScheduleType()"
          label="执行周期"
          prop="cron"
        >
          <div class="cron-input-group">
            <el-input
              v-model="taskForm.cron"
              placeholder="CRON表达式（按需填写）"
              clearable
              class="cron-input"
            />
            <el-button
              type="primary"
              class="cron-help-btn"
              @click="showCronHelp"
            >
              cron生成器
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="失败策略">
          <el-select
            v-model="taskForm.failurePolicy"
            placeholder="请选择失败策略"
            clearable
            class="dialog-select"
          >
            <el-option
              v-for="policy in failurePolicyOptions"
              :key="String(policy.code)"
              :label="policy.value"
              :value="String(policy.code)"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="通知策略">
          <el-select
            v-model="taskForm.notifyPolicy"
            placeholder="请选择通知策略"
            clearable
            class="dialog-select"
          >
            <el-option
              v-for="policy in notifyPolicyOptions"
              :key="String(policy.code)"
              :label="policy.value"
              :value="String(policy.code)"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="启用状态">
          <el-radio-group v-model="taskForm.enable">
            <el-radio :label="true">启用</el-radio>
            <el-radio :label="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="taskForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
            class="dialog-textarea"
          />
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleSaveTask">保存</el-button>
        <el-button @click="taskDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <cron-helper
      v-model="taskForm.cron"
      :visible.sync="showCronDialog"
      @apply="handleCronApply"
    />

    <!-- 任务详情（参考“数据源接入”详情弹窗 dynamic-detail.vue） -->
    <dynamic-detail-dialog
      title="任务详情"
      :visible="detailDialogVisible"
      :width="560"
      :data="detailData"
      :loading="detailLoading"
      :exclude-fields="detailExcludeFields"
      :label-map="detailLabelMap"
      @onClose="detailDialogVisible = false"
    />
  </div>
</template>

<script>
import icons from '@/assets/icon/icons.js'
import CronHelper from '@/components/common/cron-helper.vue'
import DynamicDetailDialog from '@/components/common/dynamic-detail.vue'
import dictCode from '@/api/dict/dictCode.js'
import { getDict } from '@/api/dict/dict'
import { groupTree as flowGroupTree } from '@/api/collect/trans/transGroup'
import { tree as flowTree } from '@/api/collect/trans/transFlow'
import {
  list as transTaskList,
  add as addTransTask,
  update as updateTransTask,
  detail as transTaskDetail,
  deleteTask,
  enableTask,
  disableTask,
  immediatelyExecute
} from '@/api/collect/task/transtask'

function nowText() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default {
  name: 'DataCleanTaskList',
  components: {
    'cron-helper': CronHelper,
    'dynamic-detail-dialog': DynamicDetailDialog
  },
  data() {
    return {
      icons,
      tableLoading: false,
      searchForm: {
        flowId: null,
        taskName: '',
        lastRunStatus: '',
        enabled: ''
      },
      // 从字典接口加载的任务状态（执行状态）
      taskStatusOption: [],
      enabledOptions: [
        { label: '启用', value: true },
        { label: '停用', value: false }
      ],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      rawTaskList: [],
      taskList: [],
      flowCascaderOptions: [],
      flowCascaderProps: {
        expandTrigger: 'hover',
        value: 'value',
        label: 'label',
        children: 'children',
        emitPath: false
      },

      // 左侧：流程分组树
      groupFilter: '',
      groupTree: [],
      selectedGroupId: null,
      // 防止输入频繁触发导致接口响应乱序覆盖最新结果
      groupTreeQuerySeq: 0,

      // flowId / groupId 映射，用于左侧分组过滤
      flowIdToGroupId: {},
      flowIdToFlow: {},

      // 新增/编辑弹窗
      taskDialogVisible: false,
      taskDialogMode: 'add', // add | edit
      taskForm: {
        id: null,
        taskName: '',
        flowId: null,
        executeType: 'STREAM',
        cron: '',
        enable: true, // true-启用 false-禁用（后端字段要求为 boolean）
        failurePolicy: '1',
        notifyPolicy: '0',
        remark: ''
      },
      failurePolicyOptions: [],
      notifyPolicyOptions: [],
      scheduleTypeOptions: [],
      // 用于判断当前调度方式是否为 CRON（从字典推断）
      cronScheduleTypeValues: [],
      taskFormRules: {
        taskName: [
          { required: true, message: '请输入任务名称', trigger: 'blur' }
        ],
        flowId: [
          { required: true, message: '请选择清洗流程', trigger: 'change' }
        ],
        executeType: [
          { required: true, message: '请选择执行类型', trigger: 'change' }
        ],
        cron: [
          {
            validator: (rule, value, callback) => {
              if (!this.isCronScheduleType()) return callback()
              if (!value) return callback(new Error('CRON表达式必填'))
              return callback()
            },
            trigger: 'blur'
          }
        ]
      },
      // 任务详情弹窗（查看详情）
      detailDialogVisible: false,
      detailLoading: false,
      detailData: {},
      // detail dialog 默认排除字段（根据需要可调整）
      detailExcludeFields: ['password'],
      detailLabelMap: {
        id: '任务ID',
        name: '任务名称',
        taskName: '任务名称',
        flowId: '清洗流程',
        flowName: '清洗流程名称',
        executeType: '调度方式',
        scheduleType: '调度方式',
        cron: '执行周期',
        cronExpr: '执行周期',
        enable: '启用状态',
        enabled: '启用状态',
        failurePolicy: '失败策略',
        notifyPolicy: '通知策略',
        remark: '备注',
        description: '备注',
        status: '执行状态',
        taskStatus: '执行状态',
        lastRunStatus: '执行状态',
        statusTxt: '执行状态',
        lastRunTime: '最近执行时间',
        executeTimeTxt: '最近执行时间'
      },
      showCronDialog: false
    }
  },
  computed: {
    taskStatusSelectOptions() {
      return (this.taskStatusOption || []).map((item) => ({
        label: item.value != null ? String(item.value) : String(item.code || ''),
        value: item.code != null ? String(item.code) : String(item.value || '')
      }))
    },
    taskStatusMap() {
      const map = {};
      (this.taskStatusOption || []).forEach((item) => {
        const code = item.code != null ? String(item.code) : ''
        if (!code) return
        const label = item.value || code
        let type = 'info'
        if (code === 'R' || code === 'RUNNING' || code === 'S' || code === 'SUCCESS') { type = 'success' } else if (code === 'F' || code === 'FAILURE') type = 'danger'
        map[code] = { label, type }
      })
      return map
    }
  },
  async created() {
    await this.initTaskDicts()
    await this.loadFlowCascaderOptions()
    this.queryTaskList()
  },
  methods: {
    async initTaskDicts() {
      const [failureRes, notifyRes, taskStatusRes, scheduleRes] = await Promise.all([
        getDict(dictCode.FAILURE_POLICY),
        getDict(dictCode.NOTIFY_POLICY),
        getDict(dictCode.TASK_STATUS),
        getDict(dictCode.SCHEDULE_TYPE)
      ])
      this.failurePolicyOptions = Array.isArray(failureRes && failureRes.data)
        ? failureRes.data
        : []
      this.notifyPolicyOptions = Array.isArray(notifyRes && notifyRes.data)
        ? notifyRes.data
        : []
      this.taskStatusOption = (taskStatusRes && taskStatusRes.data) || []

      const items = (scheduleRes && scheduleRes.data) || []
      this.scheduleTypeOptions = items.map((item) => {
        const code =
          item && item.code != null ? String(item.code) : String(item.value)
        const label =
          item && item.value != null ? String(item.value) : code
        return { code, label }
      })

      // 推断哪些调度方式代表 CRON
      this.cronScheduleTypeValues = items
        .filter((item) => {
          const codeRaw = item && item.code != null ? String(item.code) : ''
          const valueRaw = item && item.value != null ? String(item.value) : ''
          const code = codeRaw.toUpperCase()
          const valueUpper = valueRaw.toUpperCase()
          // 兜底兼容：可能字典 value 是“定时调度/CRON”等中文或英文
          return (
            code === 'CRON' ||
            code.includes('CRON') ||
            valueUpper.includes('CRON') ||
            valueRaw.includes('定时')
          )
        })
        .map((item) =>
          item && item.code != null ? String(item.code) : String(item.value)
        )

      // 回填默认执行类型：优先 STREAM，其次第一个
      const optionCodes = new Set(this.scheduleTypeOptions.map((o) => o.code))
      if (!optionCodes.has(String(this.taskForm.executeType))) {
        const streamOpt = this.scheduleTypeOptions.find((o) =>
          String(o.code).toUpperCase().includes('STREAM')
        )
        this.taskForm.executeType = streamOpt
          ? streamOpt.code
          : (this.scheduleTypeOptions[0] ? this.scheduleTypeOptions[0].code : this.taskForm.executeType)
      }
    },
    normalizeTaskFormByDicts() {
      const execOpts = this.scheduleTypeOptions || []
      if (execOpts.length && this.taskForm) {
        const raw =
          this.taskForm.executeType != null
            ? String(this.taskForm.executeType)
            : ''
        let hit = execOpts.find((o) => String(o.code) === raw)
        if (!hit) {
          hit = execOpts.find((o) => String(o.label) === raw)
        }
        if (!hit) {
          hit = execOpts.find(
            (o) => String(o.code).toUpperCase() === raw.toUpperCase()
          )
        }
        if (hit) this.taskForm.executeType = hit.code
      }

      const alignPolicy = (field, options, fallback) => {
        const opts = options || []
        if (!opts.length || !this.taskForm) return
        const raw =
          this.taskForm[field] != null ? String(this.taskForm[field]) : ''
        let hit = opts.find((p) => String(p.code) === raw)
        if (!hit) {
          hit = opts.find((p) => String(p.value) === raw)
        }
        if (hit) {
          this.taskForm[field] = String(hit.code)
        } else if (fallback != null) {
          const fb = String(fallback)
          let fbHit = opts.find((p) => String(p.code) === fb)
          if (!fbHit) {
            fbHit = opts.find((p) => String(p.value) === fb)
          }
          if (fbHit) {
            this.taskForm[field] = String(fbHit.code)
          }
        }
      }
      alignPolicy('failurePolicy', this.failurePolicyOptions, '1')
      alignPolicy('notifyPolicy', this.notifyPolicyOptions, '0')
    },
    isCronScheduleType() {
      const cur =
        this.taskForm && this.taskForm.executeType != null
          ? String(this.taskForm.executeType)
          : ''
      if (!cur) return false
      if (cur.toUpperCase().includes('CRON')) return true
      if ((this.cronScheduleTypeValues || []).includes(cur)) return true
      // 兜底：如果后端回填的是字典中文（不常见，但可兼容）
      if (cur.includes('定时')) return true
      return false
    },
    // 后端 enable 字段可能是 boolean / 0|1 / '0'|'1' 等多种类型
    // 统一归一化：返回 true 表示“启用”
    isEnabled(val) {
      if (val === true) return true
      if (val === false) return false
      if (val === 1 || val === '1') return true
      if (val === 0 || val === '0') return false
      if (val === 'true' || val === 'TRUE') return true
      if (val === 'false' || val === 'FALSE') return false
      return Boolean(val)
    },
    getTaskStatusCode(row) {
      const raw =
        row && (row.status != null
          ? row.status
          : row.taskStatus != null
            ? row.taskStatus
            : row.lastRunStatus != null
              ? row.lastRunStatus
              : undefined)
      let code = raw != null ? String(raw).toUpperCase() : ''

      // 兜底：如果后端只返回中文 statusTxt（不含 code），用字典反查 code
      if (!code && row && row.statusTxt) {
        const match = (this.taskStatusOption || []).find(
          (item) => String(item.value || '') === String(row.statusTxt || '')
        )
        code =
          match && match.code != null ? String(match.code).toUpperCase() : ''
      }
      return code
    },
    taskStatusLabel(row) {
      const code = this.getTaskStatusCode(row)
      const meta = this.taskStatusMap[code]

      // 常见状态码别名兜底（兼容后端返回 SUCCESS/FAIL 等完整词）
      const aliasMeta =
        !meta && code
          ? this.taskStatusMap[
            code === 'SUCCESS'
              ? 'S'
              : code === 'RUNNING'
                ? 'R'
                : code === 'FAIL'
                  ? 'F'
                  : code === 'NEVER'
                    ? 'N'
                    : ''
          ]
          : null
      const finalMeta = meta || aliasMeta
      if (finalMeta && finalMeta.label) return finalMeta.label

      return (
        (row && row.statusTxt && String(row.statusTxt)) ||
        (row && row.lastRunStatus && String(row.lastRunStatus)) ||
        '未知'
      )
    },
    taskStatusType(row) {
      const code = this.getTaskStatusCode(row)
      const meta = this.taskStatusMap[code]
      const aliasMeta =
        !meta && code
          ? this.taskStatusMap[
            code === 'SUCCESS'
              ? 'S'
              : code === 'RUNNING'
                ? 'R'
                : code === 'FAIL'
                  ? 'F'
                  : code === 'NEVER'
                    ? 'N'
                    : ''
          ]
          : null
      const finalMeta = meta || aliasMeta
      return (finalMeta && finalMeta.type) || 'info'
    },
    loadMockTasks() {
      const mock = []
      const flowIds = Object.keys(this.flowIdToFlow || {})
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
      const fallbackFlowIds = [1, 2, 3, 4, 5, 6, 7]
      const ids = flowIds.length ? flowIds : fallbackFlowIds

      for (let i = 1; i <= 23; i++) {
        const scheduleType = i % 2 === 0 ? 'CRON' : 'MANUAL'
        const cronExpr = scheduleType === 'CRON' ? '0 0 * * ? *' : ''
        const flowId = ids[(i - 1) % ids.length]
        const flow = this.flowIdToFlow[flowId] || {}
        mock.push({
          id: i,
          taskName: i === 1 ? '测试Excel' : `清洗任务-${i}`,
          flowId,
          flowName: i === 1 ? '清洗Excel' : flow.name || `清洗流程-${flowId}`,
          scheduleType,
          cronExpr,
          scheduleText: scheduleType === 'CRON' ? '每天00:00执行' : '手动触发',
          lastRunTime: i % 3 === 0 ? '' : nowText(),
          lastRunStatus:
            i % 3 === 0 ? 'NEVER' : i % 3 === 1 ? 'SUCCESS' : 'FAIL',
          enabled: i % 4 !== 0,
          enable: i % 4 !== 0,
          description: i % 2 === 0 ? '字段清洗与标准化' : '数据校验与清洗'
        })
      }
      this.rawTaskList = mock
    },
    async loadFlowCascaderOptions() {
      try {
        // 左侧分组树仍沿用 /trans/group/groupTree.do
        const groupRes = await flowGroupTree('')
        this.groupTree = (groupRes && groupRes.data) || []

        // 弹窗“清洗流程”直接对接 /trans/flow/tree.do（一次返回分组+流程树）
        const flowRes = await flowTree()
        const flowTreeData = (flowRes && flowRes.data) || []

        this.flowIdToGroupId = {}
        this.flowIdToFlow = {}

        const buildGroupOption = (groupNode) => {
          if (!groupNode || groupNode.type !== 'GROUP') return null
          const children = Array.isArray(groupNode.children)
            ? groupNode.children
            : []

          const childOptions = []
          children.forEach((child) => {
            if (!child) return

            // 叶子：转换/清洗流程
            if (child.type === 'TRANS_FLOW') {
              this.flowIdToGroupId[child.id] = groupNode.id
              this.flowIdToFlow[child.id] = child
              childOptions.push({
                value: child.id,
                label: child.name,
                leaf: true
              })
              return
            }

            // 递归：子分组（如接口未来返回多层）
            if (child.type === 'GROUP') {
              const subOpt = buildGroupOption(child)
              if (subOpt && subOpt.children && subOpt.children.length) {
                childOptions.push(subOpt)
              }
              return
            }
          })

          // 过滤没有任何子流程的分组
          if (!childOptions.length) return null

          return {
            value: groupNode.id,
            label: groupNode.name,
            children: childOptions
          }
        }

        this.flowCascaderOptions = flowTreeData
          .filter((n) => n && n.type === 'GROUP')
          .map((g) => buildGroupOption(g))
          .filter((opt) => opt && opt.children && opt.children.length)
      } catch (e) {
        this.flowCascaderOptions = []
        this.groupTree = []
        this.flowIdToGroupId = {}
        this.flowIdToFlow = {}
      }
    },
    async queryTaskList(resetPage = false) {
      try {
        if (resetPage) this.pagination.currentPage = 1
        this.tableLoading = true

        const res = await transTaskList({
          groupId: this.selectedGroupId,
          name: this.searchForm.taskName,
          status: this.searchForm.lastRunStatus,
          enable: this.searchForm.enabled,
          pageNo: this.pagination.currentPage,
          pageSize: this.pagination.pageSize
        })

        const result = (res && res.data) || {}
        this.pagination.total = result.total ?? 0
        this.pagination.currentPage = result.current ?? this.pagination.currentPage
        this.pagination.pageSize = result.size ?? this.pagination.pageSize
        const records = result.records || []
        this.taskList = records.map((r) => {
          const scheduleType = r.scheduleType || r.syncType || ''
          const normalizedScheduleType = String(scheduleType).toUpperCase()
          return {
            ...r,
            taskName: r.taskName || r.name || '',
            lastRunTime: r.lastRunTime || r.executeTimeTxt || r.executeTime || '',
            enable: r.enable != null ? r.enable : r.enabled,
            remark: r.remark != null ? r.remark : r.description,
            scheduleText:
              r.scheduleText ||
              (normalizedScheduleType === 'CRON'
                ? `CRON：${r.cronExpr || r.cron || ''}`
                : normalizedScheduleType === 'STREAM'
                  ? '流式执行'
                  : '流式执行')
          }
        })
        this.rawTaskList = this.taskList
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        this.$message.error('获取清洗任务列表失败')
      } finally {
        this.tableLoading = false
      }
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
      this.queryTaskList(false)
    },
    handleCurrentChange(page) {
      this.pagination.currentPage = page
      this.queryTaskList(false)
    },

    // 左侧分组过滤：查询分组树
    queryGroupsByName() {
      const name = this.groupFilter || ''
      const seq = ++this.groupTreeQuerySeq
      flowGroupTree(name)
        .then((res) => {
          if (seq !== this.groupTreeQuerySeq) return
          this.groupTree = (res && res.data) || []
        })
        .finally(() => {
          if (seq !== this.groupTreeQuerySeq) return
        })
    },
    handleGroupClick(node) {
      if (!node || node.type !== 'GROUP') return
      this.selectedGroupId = node.id
      this.queryTaskList(true)
    },
    handleViewAll() {
      this.selectedGroupId = null
      this.queryTaskList(true)
    },

    /**
     * 切换启用状态：启用->禁用 / 禁用->启用
     */
    async toggleEnableStatus(row) {
      if (!row || row.id == null) return
      try {
        const curEnabled = this.isEnabled(row.enable != null ? row.enable : row.enabled)
        if (curEnabled) {
          await disableTask(row.id)
          this.$message.success('已禁用该任务')
        } else {
          await enableTask(row.id)
          this.$message.success('已启用该任务')
        }
        await this.queryTaskList(false)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        this.$message.error('切换启用状态失败')
      }
    },

    // 新增/编辑：弹窗逻辑
    async openTaskDialog(mode, row = null) {
      this.taskDialogMode = mode
      this.taskDialogVisible = true

      const baseForm = {
        id: null,
        taskName: '',
        flowId: null,
        executeType:
          this.taskForm && this.taskForm.executeType ? this.taskForm.executeType : 'STREAM',
        cron: '',
        enable: true,
        failurePolicy: this.taskForm && this.taskForm.failurePolicy ? this.taskForm.failurePolicy : '1',
        notifyPolicy: '0',
        remark: ''
      }

      // 先用列表行信息做一个“乐观回填”
      if (mode === 'edit' && row && row.id != null) {
        this.taskForm = {
          ...baseForm,
          id: row.id,
          taskName: row.taskName || row.name || '',
          flowId: row.flowId || null,
          executeType:
            row.executeType ||
            row.scheduleType ||
            (row.scheduleText && String(row.scheduleText).includes('CRON')
              ? 'CRON'
              : 'STREAM'),
          cron: row.cron || row.cronExpr || '',
          enable: this.isEnabled(row.enable != null ? row.enable : row.enabled),
          failurePolicy: row.failurePolicy != null ? String(row.failurePolicy) : '1',
          notifyPolicy: row.notifyPolicy != null ? String(row.notifyPolicy) : '0',
          remark: row.remark || row.description || ''
        }

        // 再拉取详情接口，确保字段完整
        try {
          const res = await transTaskDetail(row.id)
          const d = (res && res.data) || {}
          this.taskForm = {
            ...this.taskForm,
            id: d.id != null ? d.id : row.id,
            taskName: d.taskName || d.name || this.taskForm.taskName,
            flowId: d.flowId != null ? d.flowId : this.taskForm.flowId,
            executeType: d.executeType || d.scheduleType || this.taskForm.executeType,
            cron: d.cron || d.cronExpr || this.taskForm.cron,
            enable: this.isEnabled(d.enable != null ? d.enable : d.enabled),
            failurePolicy:
              d.failurePolicy != null
                ? String(d.failurePolicy)
                : this.taskForm.failurePolicy,
            notifyPolicy:
              d.notifyPolicy != null
                ? String(d.notifyPolicy)
                : this.taskForm.notifyPolicy,
            remark: d.remark != null ? d.remark : (d.description != null ? d.description : this.taskForm.remark)
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e)
          this.$message.error('获取任务详情失败')
        }
      } else {
        this.taskForm = { ...baseForm }
      }

      this.normalizeTaskFormByDicts()

      this.$nextTick(() => {
        if (this.$refs.taskFormRef) this.$refs.taskFormRef.clearValidate()
      })
    },

    showCronHelp() {
      this.showCronDialog = true
    },

    handleCronApply(cron) {
      this.taskForm.cron = cron
      // CRON 生成器填充后清理校验错误，避免红框残留
      this.$nextTick(() => {
        if (this.$refs.taskFormRef && this.$refs.taskFormRef.clearValidate) {
          this.$refs.taskFormRef.clearValidate('cron')
        }
      })
    },

    handleSaveTask() {
      this.$refs.taskFormRef.validate(async(valid) => {
        if (!valid) return

        try {
          const payload = {
            id: this.taskForm.id,
            // controller 参数是 name，这里做字段映射
            name: this.taskForm.taskName,
            flowId: this.taskForm.flowId,
            executeType: this.taskForm.executeType,
            cron:
              this.isCronScheduleType()
                ? this.taskForm.cron
                : '',
            enable: this.taskForm.enable,
            failurePolicy: this.taskForm.failurePolicy,
            notifyPolicy: this.taskForm.notifyPolicy,
            remark: this.taskForm.remark
          }

          if (this.taskDialogMode === 'edit') {
            await updateTransTask(payload)
            this.$message.success('编辑任务成功')
          } else {
            await addTransTask(payload)
            this.$message.success('新增任务成功')
          }

          this.taskDialogVisible = false
          await this.queryTaskList(false)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e)
          this.$message.error('保存失败')
        }
      })
    },

    // 兼容旧方法名（如果有地方仍在引用）
    handleAddTask() {
      this.openTaskDialog('add')
    },
    handleEditTask(row) {
      this.openTaskDialog('edit', row)
    },
    // 查看详情（表格“查看”按钮）
    async handleRun(row) {
      if (!row || row.id == null) return
      this.detailDialogVisible = true
      this.detailLoading = true
      try {
        const res = await transTaskDetail(row.id)
        this.detailData = (res && res.data) || {}
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        this.$message.error('获取任务详情失败')
      } finally {
        this.detailLoading = false
      }
    },

    // 立即执行
    async handleImmediatelyExecute(row) {
      if (!row || row.id == null) return
      try {
        await immediatelyExecute(row.id)
        this.$message.success('已触发立即执行')
        await this.queryTaskList(false)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        this.$message.error('立即执行失败')
      }
    },

    // 删除任务
    async handleDeleteTask(row) {
      if (!row || row.id == null) return
      this.$confirm('确定要删除该任务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async() => {
          try {
            await deleteTask(row.id)
            this.$message.success('删除成功')
            await this.queryTaskList(false)
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e)
            this.$message.error('删除失败')
          }
        })
        .catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  height: 100%;
  background-color: #f5f7fa;
}

.body {
  margin: 0 10px;
  padding: 0;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: calc(100vh - 60px);
}

::v-deep .el-main {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.page-aside {
  height: 92.5vh;
  margin: 10px 0 10px 10px;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  user-select: none;
  min-width: 200px;
  padding: 10px;
}

.group {
  border-radius: 4px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.group .wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.group .search {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.queryAll {
  width: 100%;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.custom-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 8px;
  font-size: 14px;
}

.node-label {
  flex: 1;
  font-weight: 400;
}

.group_icon {
  width: 18px;
  height: 18px;
  margin-right: 6px;
}

.dialog-input,
.dialog-select,
.dialog-cascader {
  width: 100%;
}

.dialog-textarea {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* CRON 输入行内布局 */
.cron-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cron-input {
  width: calc(100% - 110px);
}

.cron-help-btn {
  white-space: nowrap;
  flex-shrink: 0;
}

/* 修复 cron-helper 弹窗定位/宽度问题（避免在父弹窗内受影响） */
::v-deep .cron-generator-dialog .el-dialog {
  margin-top: 8vh !important;
}

/* 确保 element 内部输入框真正收敛 */
::v-deep .search-input .el-input__inner {
  width: 180px;
}

::v-deep .search-select .el-input__inner {
  width: 180px;
}

::v-deep .task-dialog .el-dialog__body {
  padding: 18px 24px 10px;
}

::v-deep .dialog-form .el-form-item {
  margin-bottom: 18px;
}

::v-deep .dialog-input .el-input__inner {
  width: 100%;
}

::v-deep .dialog-cascader .el-input__inner {
  width: 100%;
}

::v-deep .dialog-select .el-input__inner {
  width: 100%;
}

/* 限制弹出下拉层宽度，避免超过弹窗 */
::v-deep .el-select-dropdown,
::v-deep .el-select-dropdown__wrap {
  max-width: 420px !important;
}

::v-deep .el-select-dropdown__item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

::v-deep .el-cascader-menu {
  max-width: 210px !important;
  width: 210px !important;
}

::v-deep .el-cascader-menu__wrap,
::v-deep .el-cascader-menu__list {
  max-width: 210px !important;
  width: 210px !important;
}

.body .list .search .search-input,
.body .list .search .search-cascader,
.body .list .search .search-select {
  max-width: 180px;
}

.list {
  margin: 10px;
  padding: 10px 20px 20px 20px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 90px);
  min-width: 1300px;
}

.search {
  padding: 10px 0 0;
  margin-bottom: 40px;
  flex-shrink: 0;
}

.col {
  display: flex;
  align-items: center;
}

.label {
  white-space: nowrap;
  font-size: 13px;
  color: #606266;
  margin-right: 6px;
}

/* 筛选行：文字/控件水平、竖直居中 */
.search-row-uniform {
  align-items: center;
}

/* el-col 本身也做 flex 居中，避免按钮列和其他列对齐不一致 */
.search-row-uniform .el-col {
  display: flex;
  align-items: center;
}

/* 按钮列与筛选项隔开，同时靠右 */
.search-col-btns {
  padding-left: 16px;
}

.search-btns {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.search-input {
  width: 220px;
}

.search-select {
  width: 220px;
}

.search-cascader {
  width: 220px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.search-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

/* 对齐 CDC 实时归集的搜索按钮样式 */
.search-btns {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  white-space: nowrap;
  justify-content: flex-end;
}

.pagination-wrapper {
  margin-top: 15px;
  text-align: right;
  flex-shrink: 0;
}
</style>

