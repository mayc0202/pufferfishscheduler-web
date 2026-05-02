<template>
  <el-dialog :visible.sync="visibleProxy" title="导出问题数据" width="460px" append-to-body>
    <el-form :model="form" label-width="100px">
      <el-form-item label="导出格式">
        <el-select v-model="form.format" style="width:100%">
          <el-option label="Excel" value="xlsx" />
        </el-select>
      </el-form-item>
      <el-form-item label="问题状态">
        <el-select v-model="form.status" clearable placeholder="全部" style="width:100%">
          <el-option label="待修复" value="PENDING" />
          <el-option label="已修复" value="FIXED" />
        </el-select>
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="visibleProxy = false">取消</el-button>
      <el-button type="primary" @click="$emit('submit', { ...form })">导出</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'QualitevalExportDialog',
  props: {
    visible: { type: Boolean, default: false }
  },
  data() {
    return {
      form: { format: 'xlsx', status: '' }
    }
  },
  computed: {
    visibleProxy: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    }
  }
}
</script>
