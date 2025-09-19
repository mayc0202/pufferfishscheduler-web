<template>
  <el-container>
    <el-header class="custom-header">
      <el-row>
        <el-col :span="12">
          <div class="lable">数据源接入</div>
        </el-col>
        <el-col :span="12" class="back">
          <div class="back-style" @click="cancel()">
            <img :src="icons.return" class="img">
            返回
          </div>
        </el-col>
      </el-row>
    </el-header>
    <el-main class="scrollable-main">
      <el-form
        ref="databaseInfo"
        :model="databaseInfo"
        :rules="rules"
        label-width="0"
      >
        <el-row>
          <el-col :span="24">
            <div class="title">
              <img :src="icons.columns" width="20px" height="14px">
              基础信息
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">数据源名称</div>
              <el-form-item prop="name">
                <el-input
                  ref="name"
                  v-model="databaseInfo.name"
                  size="mini"
                  placeholder="请输入数据源名称"
                  clearable
                />
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">数据库类型</div>
              <el-input
                v-model="databaseInfo.type"
                size="mini"
                placeholder="Mysql"
                :disabled="true"
              />
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">数据源分组</div>
              <el-select
                v-model="databaseInfo.groupId"
                size="mini"
                placeholder="请选择数据源分组"
                style="width: 100%"
              >
                <el-option
                  v-for="item in dbGroup"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">数据源分层</div>
              <el-select
                v-model="databaseInfo.label"
                size="mini"
                placeholder="请选择数据源分层"
                style="width: 100%"
              >
                <el-option
                  v-for="item in dbLabering"
                  :key="item.value"
                  :label="item.code"
                  :value="item.value"
                />
              </el-select>
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <div class="title">
              <img :src="icons.columns" width="20px" height="14px">
              数据源连接信息
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">主机地址</div>
              <el-input
                v-model="databaseInfo.dbHost"
                size="mini"
                placeholder="请输入主机地址"
                clearable
              />
            </div>
          </el-col>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">主机端口</div>
              <el-input
                v-model="databaseInfo.dbPort"
                size="mini"
                placeholder="请输入主机端口"
                clearable
              />
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">数据库名称</div>
              <el-input
                v-model="databaseInfo.dbName"
                size="mini"
                placeholder="请输入数据库名称"
                clearable
              />
            </div>
          </el-col>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">模式/Schema</div>
              <el-input
                v-model="databaseInfo.dbScheam"
                size="mini"
                placeholder="请输入模式/Schema"
                :disabled="true"
                clearable
              />
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">用户名</div>
              <el-input
                v-model="databaseInfo.username"
                size="mini"
                placeholder="请输入数据库用户名"
                clearable
              />
            </div>
          </el-col>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">密码</div>
              <el-input
                v-model="databaseInfo.password"
                size="mini"
                placeholder="请输入密码"
                show-password
                clearable
              />
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">FE地址</div>
              <el-input
                v-model="databaseInfo.feAddress"
                size="mini"
                placeholder="请输入FE地址，多个FE节点之间使用英文逗号分隔。"
                clearable
              />
            </div>
          </el-col>
          <el-col :span="12">
            <div class="wrap row">
              <div class="label">BE地址</div>
              <el-input
                v-model="databaseInfo.beAddress"
                size="mini"
                placeholder="请输入BE地址，多个BE节点之间使用英文逗号分隔。"
                clearable
              />
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <div class="title">
              <img :src="icons.columns" width="20px" height="14px">
              扩展属性
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <div class="attribute-list">
              <el-button
                type="primary"
                size="mini"
                icon="el-icon-plus"
                class="attribute-add"
                @click="addAttribute"
              >
                添加属性
              </el-button>
              <el-table :data="attributes" border style="width: 100%">
                <el-table-column prop="name" label="属性名" width="180">
                  <template slot-scope="scope">
                    <el-input
                      v-model="scope.row.name"
                      size="mini"
                      placeholder="请输入属性名"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="value" label="属性值">
                  <template slot-scope="scope">
                    <el-input
                      v-model="scope.row.value"
                      size="mini"
                      placeholder="请输入属性值"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                  <template slot-scope="scope">
                    <el-button
                      size="mini"
                      type="danger"
                      icon="el-icon-delete"
                      @click="removeAttribute(scope.$index)"
                    />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <div class="grid-content test-connect">
              <el-button
                type="primary"
                size="mini"
                icon="el-icon-connection"
                class="connect"
                @click="testConnect()"
              >
                测试连接
              </el-button>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="grid-content">
              <el-button
                type="primary"
                size="mini"
                class="save"
                @click="save()"
              >
                保存
              </el-button>
              <el-button
                type="primary"
                size="mini"
                class="cancel"
                @click="cancel()"
              >取消
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-main>
  </el-container>
</template>
<script>
import { encryptByPublicKey, decryptByPrivateKey } from '@/utils/rsa/rsa'
import icons from '@/assets/icon/icons.js'
import dictCode from '@/api/database/dict/dictCode.js'
import { getDict } from '@/api/database/dict/dict'
import { tree } from '@/api/database/database/dbGroup'
import { connect, saveDb, detailDb } from '@/api/database/database/database'
import { isEmpty } from '@/utils/validate'

export default {
  name: 'DorisComponent', // 组件名称
  props: {},
  data() {
    return {
      icons,
      dbGroup: [],
      dbLabering: [],
      databaseInfo: {
        id: '',
        groupId: '',
        name: '',
        type: 'Doris',
        label: '',
        category: 1,
        dbHost: '',
        dbPort: '',
        dbName: '',
        dbSchema: '',
        username: '',
        password: '',
        feAddress: '',
        beAddress: '',
        extConfig: '',
        properties: ''
      },
      attributes: [],
      rules: {
        name: [
          { required: true, trigger: 'blur', message: '请输入数据源名称!' }
        ],
        groupId: [{ required: true, trigger: 'blur', message: '请选择分组!' }]
      }
    }
  },

  created() {
    this.reset()
    this.getDbGroup()
    this.getDict()
    this.addOrUpdate = true
  },

  mounted() {},

  methods: {
    // 重置表单数据
    reset() {
      this.databaseInfo = {
        id: '',
        groupId: '',
        name: '',
        type: 'Doris',
        label: '',
        category: 1,
        dbHost: '',
        dbPort: '',
        dbName: '',
        dbSchema: '',
        username: '',
        password: '',
        feAddress: '',
        beAddress: '',
        extConfig: '',
        properties: ''
      }
      this.attributes = []
    },

    // 获取数据源分组
    getDbGroup() {
      tree('').then((res) => {
        this.dbGroup = res.data.result
      })
    },

    // 获取数据源分层
    getDict() {
      getDict(dictCode.DATA_SOURCE_LAYERING).then((res) => {
        this.dbLabering = res.data.result
      })
    },

    // 添加属性
    addAttribute() {
      this.attributes.push({
        name: '',
        value: ''
      })
    },

    // 移除属性
    removeAttribute(index) {
      this.attributes.splice(index, 1)
    },

    // 测试连接
    testConnect() {
      // 深拷贝 databaseInfo，避免修改原始对象
      const database = JSON.parse(JSON.stringify(this.databaseInfo))
      database.password = encryptByPublicKey(database.password)

      connect(database).then((res) => {
        const data = res.data
        if (data.code === '999999') {
          this.$message.warning(data.message)
        } else {
          this.$message.success(data.result)
        }
      })
    },

    // 保存
    save() {
      // 深拷贝 databaseInfo，避免修改原始对象
      const database = JSON.parse(JSON.stringify(this.databaseInfo))
      database.password = encryptByPublicKey(database.password)

      saveDb(database).then((res) => {
        var data = res.data
        if (data.code === '999999') {
          this.$message.warning(data.message)
        } else {
          this.$message.success(data.result)
          // 保存成功后
          this.reset()
          this.$emit('save-to-list')
        }
      })
    },

    // 加载数据源详情
    loadDetail(dbId) {
      detailDb(dbId).then((res) => {
        var data = res.data
        if (data.code === '999999') {
          this.$message.warning(data.message)
        } else {
          this.databaseInfo = data.result

          // RSA解密密码
          this.databaseInfo.password = decryptByPrivateKey(
            this.databaseInfo.password
          )

          // 处理配置

          // 处理扩展属性
          if (!isEmpty(this.databaseInfo.extConfig)) {
            var extConfig = JSON.parse(this.databaseInfo.extConfig)
            this.databaseInfo.feAddress = extConfig.feAddress
            this.databaseInfo.beAddress = extConfig.beAddress
          }
        }
      })
    },

    // 取消
    cancel() {
      this.reset()
      this.$emit('back-to-list') // 触发返回事件
    }
  }
}
</script>

<style scoped>
::v-deep .el-table {
  border: 1px solid #ebeef5;
  border-bottom: 0;
  min-height: 100px !important;
}
</style>

<style lang='scss' scoped>
@import "~@/styles/variables.scss";
// 容器整体样式
.container-wrapper {
  height: 100vh; // 占据整个视口高度
  display: flex;
  flex-direction: column;
}

.custom-header {
  height: 40px !important;
  margin-left: 10px;
  padding: 10px;
  color: $label;
  font-size: 14px;
  user-select: none;
  flex-shrink: 0; // 防止头部被压缩

  .back {
    display: flex;
    justify-content: right;
    cursor: pointer;

    .back-style {
      display: flex;

      .img {
        width: 14px;
        height: 14px;
        margin-right: 5px;
      }
    }
    .back-style:hover {
      transform: translate(0, -2px);
    }
  }
}

// 主要内容区域样式
.scrollable-main {
  margin-left: 10px;
  background-color: #fff;
  box-shadow: $shadow;
  padding: 20px !important;
  color: $label;
  font-size: 14px;
  flex: 1; // 占据剩余空间
  overflow-y: auto; // 启用垂直滚动
  max-height: calc(100vh - 100px); // 视口高度减去头部和页脚高度

  .title {
    font-size: 14px;
    color: #000;
    font-weight: 600;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .row {
    margin: 10px 0 10px 10px;

    .label {
      margin-bottom: 10px;
    }
  }
}

// 页脚样式
.el-footer {
  flex-shrink: 0; // 防止页脚被压缩
  height: 60px !important; // 设置固定高度
}

.attribute-list {
  padding: 20px;
}

.attribute-add {
  margin-bottom: 20px;
}

.test-connect {
  display: flex;
  justify-content: right;
}

.connect {
  margin-right: 10px;
}

.save {
}

.cancel {
  color: $label;
  font-weight: 500;
  white-space: nowrap;
  background: #fff;
  border-width: 1px;
  border-style: solid;
  border-color: rgb(220, 223, 230);
}

.cancel:hover {
  color: rgb(64, 158, 255);
  background-color: rgb(236, 245, 255);
  border-color: rgb(198, 226, 255);
}
</style>
