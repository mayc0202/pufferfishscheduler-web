<template>
  <el-container>
    <el-header style="height: 20px">
      <div class="flex between">
        <div class="flow-title">{{ flowName || '流程设计' }}</div>
        <div class="flex" @click="handleReturn">
          <img :src="icons.return" class="icon">
          <div class="return">返回</div>
        </div>
      </div>
    </el-header>
    <el-main>
      <flow-chart :flow-id="flowId" :flow-name="flowName" />
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
      flowId: null,
      flowName: ''
    }
  },

  created() {
    this.getFlowInfo()
  },

  methods: {
    getFlowInfo() {
      this.flowId = this.$route.query.id || null
      this.flowName = this.$route.query.name || ''
    },

    handleReturn() {
      this.$confirm(
        '当前流程设计内容尚未保存，是否确认离开此页面？',
        '提示',
        {
          confirmButtonText: '确认离开',
          cancelButtonText: '取消',
          type: 'warning',
          distinguishCancelAndClose: true
        }
      ).then(() => {
        this.$router.back()
      }).catch(() => {
        this.$message.info('已取消离开，继续编辑流程')
      })
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

.flow-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
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

.flex.between > div:last-child {
  cursor: pointer;
}
</style>
