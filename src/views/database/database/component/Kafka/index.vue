<template>
  <el-container>
    <el-header class="custom-header">
      <el-row>
        <el-col :span="12">
          <div class="lable">数据源接入</div>
        </el-col>
        <el-col :span="12" class="back">
          <div class="return" @click="cancel()">
            <i class="el-icon-back" />
            <div class="return-txt">返回</div>
          </div>
        </el-col>
      </el-row>
    </el-header>
    <el-main class="scrollable-main">
      <el-form
        ref="databaseInfo"
        :model="databaseInfo"
        :rules="rules"
        label-position="top"
        class="db-access-form"
      >
        <el-row>
          <el-col :span="24">
            <div class="title">
              <img :src="icons.columns" width="20px" height="14px">
              基础信息
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="数据源名称" prop="name" class="db-form-item">
              <el-input
                ref="name"
                v-model="databaseInfo.name"
                size="mini"
                placeholder="请输入数据源名称"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据库类型" class="db-form-item">
              <el-input v-model="databaseInfo.type" size="mini" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="数据源分组" prop="groupId" class="db-form-item">
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
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据源分层" prop="label" class="db-form-item">
              <el-select
                v-model="databaseInfo.label"
                size="mini"
                placeholder="请选择数据源分层"
                style="width: 100%"
              >
                <el-option
                  v-for="item in dbLabering"
                  :key="String(item.code)"
                  :label="item.value"
                  :value="String(item.code)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <div class="title">
              <img :src="icons.columns" width="20px" height="14px">
              连接配置信息
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="主机地址" prop="dbHost" class="db-form-item">
              <el-input
                v-model="databaseInfo.dbHost"
                size="mini"
                placeholder="请输入主机地址，多个主机之间可用英文逗号分隔"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口" prop="dbPort" class="db-form-item">
              <el-input
                v-model="databaseInfo.dbPort"
                size="mini"
                placeholder="请输入端口"
                clearable
              />
            </el-form-item>
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
              <el-button type="primary" size="mini" class="save" @click="save()">
                保存
              </el-button>
              <el-button
                type="primary"
                size="mini"
                class="cancel"
                @click="cancel()"
              >取消</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-main>
  </el-container>
</template>

<script>
import { encrypt } from '@/utils/encrypt/RsaUtil'
import { decode } from '@/utils/encrypt/Base64Util'
import icons from '@/assets/icon/icons.js'
import dictCode from '@/api/dict/dictCode.js'
import { getDict } from '@/api/dict/dict'

import { tree } from '@/api/database/database/dbGroup'
import { connect, saveDb, detailDb } from '@/api/database/database/database'
import { isEmpty } from '@/utils/validate'

export default {
  name: 'KafkaComponent',
  data() {
    return {
      icons,
      dbGroup: [],
      dbLabering: [],
      databaseInfo: {
        id: '',
        groupId: '',
        name: '',
        type: 'Kafka',
        label: '',
        category: '2',
        dbHost: '',
        dbPort: '9092',
        dbSchema: '',
        dbName: '',
        username: '',
        password: ''
      },
      attributes: [],
      rules: {
        name: [{ required: true, trigger: 'blur', message: '请输入数据源名称!' }],
        groupId: [
          { required: true, trigger: 'change', message: '请选择数据源分组!' }
        ],
        label: [
          { required: true, trigger: 'change', message: '请选择数据源分层!' }
        ],
        dbHost: [{ required: true, trigger: 'blur', message: '请输入主机地址!' }],
        dbPort: [{ required: true, trigger: 'blur', message: '请输入端口!' }]
      }
    }
  },
  created() {
    this.reset()
    this.getDbGroup()
    this.getDict()
  },
  methods: {
    reset() {
      this.databaseInfo = {
        id: '',
        groupId: '',
        name: '',
        type: 'Kafka',
        label: '',
        category: '2',
        dbHost: '',
        dbPort: '9092',
        dbSchema: '',
        dbName: '',
        username: '',
        password: ''
      }
      this.attributes = []
    },
    getDbGroup() {
      tree('').then((res) => {
        this.dbGroup = res.data
      })
    },
    getDict() {
      getDict(dictCode.DATA_SOURCE_LAYERING).then((res) => {
        this.dbLabering = res.data
      })
    },
    addAttribute() {
      this.attributes.push({ name: '', value: '' })
    },
    removeAttribute(index) {
      this.attributes.splice(index, 1)
    },
    loadDetail(dbId) {
      detailDb(dbId).then((res) => {
        this.databaseInfo = res.data
        if (this.databaseInfo.password) {
          this.databaseInfo.password = decode(this.databaseInfo.password)
        }
        if (!isEmpty(this.databaseInfo.properties)) {
          this.attributes = this.databaseInfo.properties
        }
      })
    },
    async testConnect() {
      this.$refs.databaseInfo.validate(async(valid) => {
        if (!valid) return
        const database = JSON.parse(JSON.stringify(this.databaseInfo))
        if (database.password) {
          database.password = await encrypt(database.password)
        }
        connect(database).then((res) => {
          this.$message.success(res.data)
        })
      })
    },
    async save() {
      this.$refs.databaseInfo.validate(async(valid) => {
        if (!valid) return
        const database = JSON.parse(JSON.stringify(this.databaseInfo))
        if (database.password) {
          database.password = await encrypt(database.password)
        }
        saveDb(database).then((res) => {
          this.$message.success(res.data)
          this.reset()
          this.$emit('save-to-list')
        })
      })
    },
    cancel() {
      this.reset()
      this.$emit('back-to-list')
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

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.custom-header {
  height: 40px !important;
  margin-left: 10px;
  padding: 10px;
  color: $label;
  font-size: 14px;
  user-select: none;
  flex-shrink: 0;

  .back {
    display: flex;
    justify-content: right;
    cursor: pointer;
  }

  .return {
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .return:hover {
    color: #1890ff;
    transform: translate(0, -2px);
  }

  .return-txt {
    margin-left: 5px;
  }
}

.scrollable-main {
  margin-left: 10px;
  background-color: #fff;
  box-shadow: $shadow;
  padding: 20px !important;
  color: $label;
  font-size: 14px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  .title {
    font-size: 14px;
    color: #000;
    font-weight: 600;
    margin-top: 10px;
    margin-bottom: 10px;
  }
}

.db-access-form ::v-deep .el-form-item__label {
  padding: 0 0 6px 0;
  line-height: 1.4;
}

.db-form-item {
  margin: 10px 0 10px 10px;
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

