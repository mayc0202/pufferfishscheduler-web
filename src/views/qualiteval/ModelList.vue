<template>
  <model-manage />
</template>

<script>
import ModelManage from './ModelManage.vue'

/** 计划文档中的模型页文件名；实现委托给 ModelManage */
export default {
  name: 'QualitevalModelList',
  components: { ModelManage }
}
</script>
