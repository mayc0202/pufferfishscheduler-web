<template>
  <el-container>
    <el-header style="height: 20px">
      <div class="flex between">
        <div>流程名称...</div>
        <div class="flex">
          <img :src="icons.return" class="icon">
          <div class="return">返回</div>
        </div>
      </div>
    </el-header>
    <el-main>
      <flow-chart :flow-id="flowId" />
    </el-main>
  </el-container>
</template>

<script>
import icons from '@/assets/icon/icons'
import FlowChart from '@/components/Flow/index.vue'

export default {
  components: {
    'flow-chart': FlowChart
  },
  data() {
    return {
      icons,
      flowId: 0 // 流程id
    }
  },

  created() {
    this.getFlowId()
  },

  mounted() {},

  beforeDestroy() {},

  methods: {
    /**
     * 获取流程id
     */
    getFlowId() {
      // 获取路径参数
      this.flowId = this.$route.query.id
      console.log('流程id：' + this.flowId) // 正确输出123
    }
  }
}
</script>

<style scoped>
.el-container {
  margin: 0;
  padding: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: rgb(247, 247, 247);
}

.el-header {
  margin-top: 20px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  -ms-flex-negative: 0;
  flex-shrink: 0;
  color: #6e6e6e;
  user-select: none;
}

.el-main {
  color: #333;
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
}

.icon {
  width: 26px;
  height: 26px;
  margin-right: 4px;
  margin-top: -4px;
  user-select: none;
}

.return {
  cursor: pointer;
  user-select: none;
}

.return:hover {
  transform: translate(0, -2px);
}
</style>

