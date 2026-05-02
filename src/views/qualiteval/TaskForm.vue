<template>
  <el-dialog :visible.sync="visibleProxy" :title="form.id ? '编辑质检任务' : '新增质检任务'" width="640px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-form-item label="任务名称" prop="taskName"><el-input v-model="form.taskName" /></el-form-item>
      <el-form-item label="所属模型" prop="modelId">
        <el-select v-model="form.modelId" placeholder="请选择模型" style="width:100%">
          <el-option v-for="m in modelOptions" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="关联规则" prop="ruleIds">
        <el-select v-model="form.ruleIds" multiple collapse-tags style="width:100%" placeholder="请选择规则">
          <el-option v-for="r in ruleOptions" :key="r.id" :label="r.ruleName || r.name" :value="r.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="调度CRON" prop="scheduleCron">
        <el-input v-model="form.scheduleCron" placeholder="例如 0 */10 * * * ?" />
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio label="ENABLE">启用</el-radio>
          <el-radio label="DISABLE">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="visibleProxy = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'QualitevalTaskForm',
  props: {
    visible: { type: Boolean, default: false },
    value: { type: Object, default: () => ({}) },
    modelOptions: { type: Array, default: () => [] },
    ruleOptions: { type: Array, default: () => [] }
  },
  data() {
    return {
      form: { id: null, taskName: '', modelId: '', ruleIds: [], scheduleCron: '', status: 'ENABLE' },
      rules: {
        taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
        modelId: [{ required: true, message: '请选择模型', trigger: 'change' }]
      }
    }
  },
  computed: {
    visibleProxy: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    }
  },
  watch: {
    value: {
      immediate: true,
      deep: true,
      handler(v) {
        const ids = Array.isArray(v.ruleIds) ? v.ruleIds : (typeof v.ruleIds === 'string' && v.ruleIds ? v.ruleIds.split(',').map(i => Number(i)) : [])
        this.form = {
          id: v.id || null,
          taskName: v.taskName || '',
          modelId: v.modelId || '',
          ruleIds: ids,
          scheduleCron: v.scheduleCron || '',
          status: v.status || 'ENABLE'
        }
      }
    }
  },
  methods: {
    submit() {
      this.$refs.formRef.validate((valid) => {
        if (!valid) return
        this.$emit('submit', { ...this.form })
      })
    }
  }
}
</script>
