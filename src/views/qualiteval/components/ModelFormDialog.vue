<template>
  <el-dialog
    :title="isEdit ? '编辑模型' : '新增模型'"
    :visible.sync="innerVisible"
    width="640px"
    append-to-body
    destroy-on-close
    custom-class="qe-model-form-dialog"
    @close="onDialogClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right" size="small">
      <el-collapse v-model="activeNames">
        <el-collapse-item name="base">
          <template slot="title">
            <span class="qe-section-title"><i class="qe-bar" />基础信息</span>
          </template>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="模型名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入模型名称" maxlength="128" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-select v-model="form.status" placeholder="请选择状态" style="width:100%">
                  <el-option label="启用" value="ACTIVE" />
                  <el-option label="停用" value="INACTIVE" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="表匹配规则" prop="tablePattern">
            <el-input v-model="form.tablePattern" placeholder="例如 %、order_%" maxlength="256" show-word-limit />
          </el-form-item>
          <el-form-item label="模型描述" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" maxlength="500" show-word-limit />
          </el-form-item>
        </el-collapse-item>
        <el-collapse-item name="db">
          <template slot="title">
            <span class="qe-section-title"><i class="qe-bar" />数据库信息</span>
          </template>
          <el-form-item label="评测数据库" prop="datasourceId">
            <el-cascader
              v-model="form.datasourceCascader"
              :options="dbTreeOptions"
              :props="cascaderProps"
              clearable
              filterable
              placeholder="请选择评测数据库"
              style="width:100%"
              @change="onDbChange"
            />
          </el-form-item>
          <el-form-item label="关联表设置">
            <div class="relation-setting-tip">用于配置主表与关联表的字段映射关系，支持多组关联。</div>
            <div
              v-for="(item, idx) in form.relationMappings"
              :key="item.uid"
              class="relation-item"
            >
              <el-row :gutter="10">
                <el-col :span="8">
                  <el-input v-model="item.relatedTable" placeholder="关联表名，如 order_detail" />
                </el-col>
                <el-col :span="7">
                  <el-input v-model="item.sourceField" placeholder="主表字段，如 order_id" />
                </el-col>
                <el-col :span="7">
                  <el-input v-model="item.targetField" placeholder="关联表字段，如 id" />
                </el-col>
                <el-col :span="2" class="relation-remove-col">
                  <el-button type="text" @click="removeRelationMapping(idx)">删除</el-button>
                </el-col>
              </el-row>
            </div>
            <el-button size="mini" icon="el-icon-plus" @click="addRelationMapping">新增关联映射</el-button>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
    </el-form>
    <div slot="footer" class="qe-model-form-footer">
      <el-button @click="innerVisible = false">关闭</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { relationalDbTree } from '@/api/database/database/dbGroup'

export default {
  name: 'ModelFormDialog',
  props: {
    visible: { type: Boolean, default: false },
    /** 父组件保存请求中 */
    saving: { type: Boolean, default: false },
    /** 编辑时传入行数据 */
    value: { type: Object, default: null }
  },
  data() {
    return {
      innerVisible: false,
      activeNames: ['base', 'db'],
      dbTreeOptions: [],
      cascaderProps: {
        value: 'id',
        label: 'name',
        children: 'children',
        emitPath: true,
        checkStrictly: false
      },
      form: {
        id: null,
        name: '',
        description: '',
        datasourceId: null,
        datasourceCascader: [],
        tablePattern: '%',
        status: 'ACTIVE',
        relationMappings: []
      },
      rules: {
        name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
        status: [{ required: true, message: '请选择状态', trigger: 'change' }],
        tablePattern: [{ required: true, message: '请输入表匹配规则', trigger: 'blur' }],
        datasourceId: [{ required: true, message: '请选择评测数据库', trigger: 'change' }]
      }
    }
  },
  computed: {
    isEdit() {
      return !!(this.form && this.form.id)
    }
  },
  watch: {
    visible(v) {
      this.innerVisible = v
      if (v) this.open()
    },
    innerVisible(v) {
      this.$emit('update:visible', v)
    }
  },
  methods: {
    async open() {
      await this.loadDbTree()
      this.resetForm()
      const row = this.value
      if (row && row.id) {
        this.form.id = row.id
        this.form.name = row.name || ''
        this.form.description = row.description || ''
        this.form.datasourceId = row.datasourceId != null ? row.datasourceId : row.datasource_id
        this.form.tablePattern = row.tablePattern != null ? row.tablePattern : (row.table_pattern != null ? row.table_pattern : '%')
        this.form.status = row.status != null && row.status !== '' ? String(row.status) : 'ACTIVE'
        this.form.relationMappings = this.normalizeRelationMappings(
          row.relationMappings || row.associationMappings || row.joinMappings || row.relation_mappings
        )
        this.form.datasourceCascader = this.pathForDatasource(this.form.datasourceId)
      }
      this.$nextTick(() => this.$refs.formRef && this.$refs.formRef.clearValidate())
    },
    resetForm() {
      this.form = {
        id: null,
        name: '',
        description: '',
        datasourceId: null,
        datasourceCascader: [],
        tablePattern: '%',
        status: 'ACTIVE',
        relationMappings: []
      }
    },
    normalizeDbTree(nodes) {
      return (nodes || []).map((n) => {
        const children = Array.isArray(n.children) ? this.normalizeDbTree(n.children) : []
        const hasChildren = children.length > 0
        return {
          ...n,
          children,
          leaf: !hasChildren
        }
      })
    },
    normalizeRelationMappings(input) {
      if (!Array.isArray(input)) return []
      return input
        .map((item, idx) => ({
          uid: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
          relatedTable: item.relatedTable || item.related_table || item.table || '',
          sourceField: item.sourceField || item.source_field || item.leftField || '',
          targetField: item.targetField || item.target_field || item.rightField || ''
        }))
        .filter((item) => item.relatedTable || item.sourceField || item.targetField)
    },
    pathForDatasource(leafId) {
      if (leafId == null || leafId === '') return []
      const walk = (nodes, path) => {
        if (!nodes || !nodes.length) return null
        for (const n of nodes) {
          const p = path.concat(n.id)
          if (String(n.id) === String(leafId)) return p
          const sub = walk(n.children, p)
          if (sub) return sub
        }
        return null
      }
      return walk(this.dbTreeOptions, []) || []
    },
    async loadDbTree() {
      try {
        const res = await relationalDbTree()
        const data = (res && res.data) ? res.data : res
        const raw = Array.isArray(data) ? data : (data && data.data) || []
        this.dbTreeOptions = this.normalizeDbTree(raw)
      } catch (e) {
        this.dbTreeOptions = []
      }
    },
    onDbChange(val) {
      if (val && val.length) {
        this.form.datasourceId = val[val.length - 1]
      } else {
        this.form.datasourceId = null
      }
    },
    onDialogClose() {
      this.$emit('close')
    },
    addRelationMapping() {
      this.form.relationMappings.push({
        uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        relatedTable: '',
        sourceField: '',
        targetField: ''
      })
    },
    removeRelationMapping(idx) {
      this.form.relationMappings.splice(idx, 1)
    },
    buildRelationMappingsPayload() {
      return (this.form.relationMappings || [])
        .map((item) => ({
          relatedTable: String(item.relatedTable || '').trim(),
          sourceField: String(item.sourceField || '').trim(),
          targetField: String(item.targetField || '').trim()
        }))
        .filter((item) => item.relatedTable && item.sourceField && item.targetField)
    },
    submit() {
      this.$refs.formRef.validate((valid) => {
        if (!valid) return
        const relationMappings = this.buildRelationMappingsPayload()
        const payload = {
          id: this.form.id,
          name: this.form.name.trim(),
          description: this.form.description || '',
          datasourceId: this.form.datasourceId,
          tablePattern: (this.form.tablePattern || '').trim() || '%',
          status: this.form.status || 'ACTIVE',
          relationMappings
        }
        this.$emit('save', payload)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.qe-section-title {
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
}
.qe-bar {
  display: inline-block;
  width: 3px;
  height: 14px;
  margin-right: 8px;
  background: #409eff;
  border-radius: 2px;
}
.qe-model-form-footer {
  text-align: center;
}
.relation-setting-tip {
  margin-bottom: 8px;
  color: #909399;
  font-size: 12px;
}
.relation-item {
  margin-bottom: 8px;
}
.relation-remove-col {
  text-align: right;
}
::v-deep .qe-model-form-dialog .el-dialog__body {
  padding-top: 8px;
}
</style>
