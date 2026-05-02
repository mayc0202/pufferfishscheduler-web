<template>
  <div class="container flow-chart-page">
    <div class="body">
      <el-container>
        <el-header style="height: 20px; margin-top: 0; margin-bottom: 14px; padding: 0;">
          <div class="flex between">
            <div class="flow-title">{{ flowName || '流程设计' }}</div>
            <div class="return" @click="handleReturn">
              <i class="el-icon-back" />
              <div class="return-txt">返回</div>
            </div>
          </div>
        </el-header>
        <el-main>
          <flow-chart ref="flowEditor" :flow-id="flowId" :flow-name="flowName" />
        </el-main>
      </el-container>
    </div>
  </div>
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
      flowName: '',
      isLeaving: false
    }
  },

  created() {
    this.getFlowInfo()
  },

  beforeRouteLeave(to, from, next) {
    // 检查是否有未保存的更改，且不是通过handleReturn方法触发的
    if (!this.isLeaving && this.$refs.flowEditor && this.$refs.flowEditor.hasUnsavedChanges()) {
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
        next()
      }).catch(() => {
        this.$message.info('已取消离开，继续编辑流程')
        next(false)
      })
    } else {
      next()
    }
  },

  methods: {
    getFlowInfo() {
      this.flowId = this.$route.query.id || null
      this.flowName = this.$route.query.name || ''
    },

    handleReturn() {
      // 如果日志弹窗打开，先关闭，避免遮挡后续弹窗/路由行为
      if (this.$refs.flowEditor && this.$refs.flowEditor.logVisible) {
        this.$refs.flowEditor.closeLogDialog()
      }
      // 检查是否有未保存的更改
      if (this.$refs.flowEditor && this.$refs.flowEditor.hasUnsavedChanges()) {
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
          // 设置离开标志，避免触发beforeRouteLeave的确认
          this.isLeaving = true
          // 明确跳转到流程列表页面
          this.$router.push('/dataclean/flow')
        }).catch(() => {
          this.$message.info('已取消离开，继续编辑流程')
        })
      } else {
        // 没有未保存的更改，直接跳转到流程列表页面
        this.$router.push('/dataclean/flow')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  height: calc(100vh - 84px);
  background: radial-gradient(circle at 15% 20%, #eef4ff 0%, #f6f9ff 55%, #f7f8fb 100%);
  padding: 14px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.body {
  margin: 0;
  padding: 0;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

::v-deep .el-container {
  height: 100%;
}

::v-deep .el-main {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9eef8;
  box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
}

.flow-title {
  font-size: 16px;
  font-weight: 600;
  color: #31415f;
}

.return {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: #6a7486;
  transition: all 0.3s ease;
}

.return:hover {
  color: #409eff;
  transform: translate(0, -2px);
}

.return-txt {
  margin-left: 5px;
}

.flex.between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
