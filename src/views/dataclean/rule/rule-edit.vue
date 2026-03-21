<template>
  <div class="rule-edit-container">
    <div class="header">
      <div class="title">新建规则</div>
      <div class="back" @click="$router.back()">
        <i class="el-icon-back" />
        <span>返回</span>
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
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="规则名称" prop="name">
              <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="规则编码" prop="code">
              <el-input v-model="ruleForm.code" placeholder="请输入规则编码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="规则分组" prop="groupId">
              <el-cascader
                v-model="ruleForm.groupId"
                :options="groupOptions"
                :props="{ value: 'id', label: 'name', children: 'children', emitPath: false }"
                placeholder="请选择规则分组"
                clearable
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="规则类型" prop="scope">
              <el-select v-model="ruleForm.scope" placeholder="请选择规则类型" clearable>
                <el-option label="自定义" value="custom" />
                <el-option label="公共" value="public" />
              </el-select>
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

        <el-divider />

        <!-- 规则处理器选择 -->
        <div class="section-title">规则配置</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="规则类型" prop="processorId">
              <el-select
                v-model="ruleForm.processorId"
                placeholder="请选择规则类型"
                clearable
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

        <el-row v-if="currentProcessor">
          <el-col :span="24">
            <div v-if="currentConfig.descriptipn" class="processor-desc">
              {{ currentConfig.descriptipn }}
            </div>
          </el-col>
        </el-row>

        <!-- 参数配置 -->
        <div v-if="fieldList && fieldList.length" class="section-subtitle">参数配置</div>
        <el-table
          v-if="fieldList && fieldList.length"
          :data="fieldList"
          border
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
              />
              <el-select
                v-else-if="scope.row.controlType === 2"
                v-model="paramValues[scope.row.name]"
                placeholder="请选择"
                clearable
                size="small"
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

        <!-- 输出字段类型（有则显示） -->
        <div
          v-if="currentConfig.outputFieldType"
          class="section-subtitle"
        >
          输出字段类型
        </div>
        <el-form-item
          v-if="currentConfig.outputFieldType"
          :label="currentConfig.outputFieldType.description || '输出字段类型'"
          label-width="130px"
        >
          <el-select
            v-model="outputFieldTypeValue"
            placeholder="请选择输出字段类型"
            clearable
            style="width: 260px;"
          >
            <el-option
              v-for="opt in currentConfig.outputFieldType.selectArray || []"
              :key="String(opt.Code)"
              :label="opt.name"
              :value="opt.Code"
            />
          </el-select>
        </el-form-item>

        <div class="form-footer">
          <el-button type="primary" @click="handleSave">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
// 先用测试数据模拟 /ruleprocessor/dict.do 返回
const MOCK_PROCESSORS = [
  {
    id: 1,
    processorName: '字符串截取',
    paramsConfig: `{
      "data": {
        "renameType": "String",
        "rename": "",
        "fieldList": [
          {
            "controlType": 1,
            "dataType": 1,
            "name": "start",
            "description": "开始位置",
            "value": 0,
            "selectArray": [],
            "requires": true
          },
          {
            "controlType": 1,
            "dataType": 1,
            "name": "end",
            "description": "截至位置",
            "value": 0,
            "selectArray": [],
            "requires": true
          }
        ],
        "value": "",
        "descriptipn": ""
      }
    }`
  },
  {
    id: 2,
    processorName: '字符串替换',
    paramsConfig: `{
      "data": {
        "rename": "",
        "renameType": "String",
        "fieldList": [
          {
            "name": "replaceType",
            "description": "替换方式",
            "requires": true,
            "dataType": 1,
            "value": null,
            "controlType": 2,
            "selectArray": [
              { "name": "按照查找内容替换", "Code": 0 },
              { "name": "按照指定位置替换", "Code": 1 }
            ]
          },
          {
            "name": "start",
            "description": "开始位置",
            "requires": true,
            "dataType": 1,
            "value": null,
            "controlType": 1,
            "selectArray": []
          },
          {
            "name": "end",
            "description": "截至位置",
            "requires": true,
            "dataType": 1,
            "value": null,
            "controlType": 1,
            "selectArray": []
          },
          {
            "name": "searchContent",
            "description": "查询内容",
            "requires": true,
            "dataType": 2,
            "value": null,
            "controlType": 1,
            "selectArray": []
          },
          {
            "name": "replaceContent",
            "description": "替换内容",
            "requires": true,
            "dataType": 2,
            "value": null,
            "controlType": 1,
            "selectArray": []
          }
        ],
        "value": "",
        "descriptipn": ""
      }
    }`
  }
]

export default {
  name: 'DataCleanRuleEdit',
  data() {
    return {
      ruleForm: {
        name: '',
        code: '',
        groupId: null,
        scope: 'custom',
        enabled: true,
        description: '',
        processorId: null
      },
      ruleRules: {
        name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
        code: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
        groupId: [{ required: true, message: '请选择规则分组', trigger: 'change' }],
        scope: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
        processorId: [{ required: true, message: '请选择规则类型', trigger: 'change' }]
      },
      groupOptions: [
        { id: 1, name: '字符串处理', children: [] },
        { id: 2, name: '数字处理', children: [] },
        { id: 3, name: '日期处理', children: [] }
      ],
      processorOptions: MOCK_PROCESSORS,
      paramValues: {},
      outputFieldTypeValue: null
    }
  },
  computed: {
    currentProcessor() {
      return this.processorOptions.find(p => p.id === this.ruleForm.processorId) || null
    },
    currentConfig() {
      if (!this.currentProcessor || !this.currentProcessor.paramsConfig) return {}
      try {
        const parsed = JSON.parse(this.currentProcessor.paramsConfig)
        return parsed.data || {}
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('解析 paramsConfig 失败', e)
        return {}
      }
    },
    fieldList() {
      return this.currentConfig.fieldList || []
    }
  },
  methods: {
    handleProcessorChange() {
      // 重置参数值
      this.paramValues = {}
      const list = this.fieldList || []
      list.forEach(f => {
        this.$set(this.paramValues, f.name, f.value != null ? f.value : '')
      })
      if (this.currentConfig.outputFieldType) {
        this.outputFieldTypeValue =
          this.currentConfig.outputFieldType.value != null
            ? this.currentConfig.outputFieldType.value
            : null
      } else {
        this.outputFieldTypeValue = null
      }
    },
    handleSave() {
      this.$refs.ruleFormRef.validate(valid => {
        if (!valid) return
        const payload = {
          ...this.ruleForm,
          params: { ...this.paramValues },
          outputFieldType: this.outputFieldTypeValue
        }
        // 这里先打印，后续对接保存接口
        // eslint-disable-next-line no-console
        console.log('保存规则 payload:', payload)
        this.$message.success('保存成功（测试）')
        this.$router.back()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.rule-edit-container {
  height: 100%;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px 8px;

  .title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .back {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: #409eff;

    span {
      margin-left: 4px;
    }
  }
}

.body {
  flex: 1;
  padding: 0 24px 24px;
}

.rule-form {
  background: #fff;
  padding: 20px 24px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px;
}

.section-subtitle {
  font-size: 13px;
  font-weight: 500;
  margin: 10px 0 8px;
}

.processor-desc {
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 3px;
  color: #606266;
  font-size: 12px;
}

.form-footer {
  margin-top: 20px;
}
</style>

