<template>
  <el-container>
    <el-header style="height: 20px">
      <div class="flex between">
        <div>清洗流程设计</div>
        <div class="flex">
          <img src="./../../assets/icon/return.png" class="icon">
          <div class="return">返回</div>
        </div>
      </div>
    </el-header>
    <el-main>
      <div class="plugin_menu">
        <el-menu
          default-active="2"
          class="el-menu-vertical-demo"
          @open="handleOpen1"
          @close="handleClose1"
        >
          <el-submenu index="1">
            <template slot="title">
              <i class="el-icon-location" />
              <span>输入</span>
            </template>
            <el-menu-item-group>
              <el-menu-item index="1">关系库表输入</el-menu-item>
              <el-menu-item index="2">Excel输入</el-menu-item>
              <el-menu-item index="3">CSV输入</el-menu-item>
              <el-menu-item index="4">JSON输入</el-menu-item>
              <el-menu-item index="5">XML输入</el-menu-item>
              <el-menu-item index="6">Redis输入</el-menu-item>
              <el-menu-item index="7">MongoDB输入</el-menu-item>
              <el-menu-item index="8">Kafka输入</el-menu-item>
              <el-menu-item index="9">MQTT输入</el-menu-item>
              <el-menu-item index="10">生成测试数据</el-menu-item>
              <el-menu-item index="11">从流程获取数据</el-menu-item>
              <el-menu-item index="12">钉钉</el-menu-item>
              <el-menu-item index="13">从流程获取数据</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
          <el-submenu index="2">
            <template slot="title">
              <i class="el-icon-location" />
              <span>输出</span>
            </template>
            <el-menu-item-group>
              <el-menu-item index="1">关系库表输出</el-menu-item>
              <el-menu-item index="2">Excel输出</el-menu-item>
              <el-menu-item index="3">关系库更新</el-menu-item>
              <el-menu-item index="4">关系库插入/更新</el-menu-item>
              <el-menu-item index="5">StarRocks输出</el-menu-item>
              <el-menu-item index="6">Doris输出</el-menu-item>
              <el-menu-item index="7">Kafka输出</el-menu-item>
              <el-menu-item index="8">MQTT输出</el-menu-item>
              <el-menu-item index="9">附件下载</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
          <el-submenu index="3">
            <template slot="title">
              <i class="el-icon-location" />
              <span>转换</span>
            </template>
            <el-menu-item-group>
              <el-menu-item index="1">数据加密</el-menu-item>
              <el-menu-item index="2">数据解密</el-menu-item>
              <el-menu-item index="3">数据过滤</el-menu-item>
              <el-menu-item index="4">数据清洗转换</el-menu-item>
              <el-menu-item index="5">Debezium报文解析</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
          <el-submenu index="4">
            <template slot="title">
              <i class="el-icon-location" />
              <span>流程</span>
            </template>
            <el-menu-item-group>
              <el-menu-item index="1">条件判断</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
          <el-submenu index="5">
            <template slot="title">
              <i class="el-icon-location" />
              <span>脚本</span>
            </template>
            <el-menu-item-group>
              <el-menu-item index="1">JAVA脚本</el-menu-item>
              <el-menu-item index="2">SQL脚本</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
          <el-submenu index="6">
            <template slot="title">
              <i class="el-icon-location" />
              <span>文件共享</span>
            </template>
            <el-menu-item-group>
              <el-menu-item index="1">FTP上传</el-menu-item>
              <el-menu-item index="2">FTP下载</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
          <el-submenu index="7">
            <template slot="title">
              <i class="el-icon-location" />
              <span>其他</span>
            </template>
            <el-menu-item-group>
              <el-menu-item index="1">打印日志</el-menu-item>
              <el-menu-item index="2">获取变量</el-menu-item>
              <el-menu-item index="3">设置变量</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
        </el-menu>
      </div>
      <flow-chart />
    </el-main>
  </el-container>
</template>

<script>
import FlowChart from '@/components/Flow/index.vue' // 导入组件

export default {
  components: {
    'flow-chart': FlowChart
  },
  data() {
    return {
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

::v-deep .el-menu {
  list-style: none;
  position: relative;
  margin: 0;
  padding-left: 0;
  background-color: #f0f7ff;
}

.plugin_menu {
  position: absolute;
  z-index: 2;
  width: 240px;
  background: #f0f7ff;
  -webkit-box-shadow: 0 2px 10px 0 hsla(0, 0%, 87.1%, 0.4);
  box-shadow: 0 2px 10px 0 hsla(0, 0%, 87.1%, 0.4);
  height: 400px;
  min-height: 400px;
  overflow-y: auto;
  overflow-x: auto;
}

::v-deep .el-menu-item-group > ul {
    padding: 0;
    background-color: #fff;
}
::v-deep .el-menu-item-group__title {
    /* padding: 7px 0 7px 20px; */
    line-height: normal;
    font-size: 12px;
    color: #909399;
}
.el-menu-item-group__title {
    /* padding: 7px 0 7px 20px; */
    line-height: normal;
    font-size: 12px;
    color: #909399;
}
</style>

