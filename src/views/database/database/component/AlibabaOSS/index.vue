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
            <el-form-item label="访问域名" prop="endpoint" class="db-form-item">
              <el-input
                v-model="databaseInfo.endpoint"
                size="mini"
                placeholder="请输入访问域名"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="访问密钥ID" prop="accessKeyId" class="db-form-item">
              <el-input
                v-model="databaseInfo.accessKeyId"
                size="mini"
                placeholder="请输入访问密钥ID"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="访问密钥密码" prop="accessKeySecret" class="db-form-item">
              <el-input
                v-model="databaseInfo.accessKeySecret"
                size="mini"
                placeholder="请输入访问密钥密码"
                show-password
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="STS临时凭证" class="db-form-item">
              <el-input
                v-model="databaseInfo.securityToken"
                size="mini"
                placeholder="请输入临时凭证（可选）"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="连接超时时间(ms)" prop="connectionTimeout" class="db-form-item">
              <el-input-number
                v-model="databaseInfo.connectionTimeout"
                size="mini"
                :min="1"
                :step="1000"
                controls-position="right"
                style="width: 100%"
                placeholder="可选，默认60000"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Socket超时时间(ms)" prop="socketTimeout" class="db-form-item">
              <el-input-number
                v-model="databaseInfo.socketTimeout"
                size="mini"
                :min="1"
                :step="1000"
                controls-position="right"
                style="width: 100%"
                placeholder="可选，默认60000"
              />
            </el-form-item>
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
  name: 'AlibabaOSSComponent',
  data() {
    return {
      icons,
      dbGroup: [],
      dbLabering: [],
      databaseInfo: {
        id: '',
        groupId: '',
        name: '',
        type: 'AliYunOSS',
        label: '',
        category: '4',
        endpoint: '',
        accessKeyId: '',
        accessKeySecret: '',
        securityToken: '',
        connectionTimeout: 60000,
        socketTimeout: 60000
      },
      rules: {
        name: [{ required: true, trigger: 'blur', message: '请输入数据源名称!' }],
        groupId: [{ required: true, trigger: 'change', message: '请选择数据源分组!' }],
        label: [{ required: true, trigger: 'change', message: '请选择数据源分层!' }],
        endpoint: [{ required: true, trigger: 'blur', message: '请输入访问域名!' }],
        accessKeyId: [{ required: true, trigger: 'blur', message: '请输入访问密钥ID!' }],
        accessKeySecret: [{ required: true, trigger: 'blur', message: '请输入访问密钥密码!' }],
        connectionTimeout: [{ type: 'number', min: 1, trigger: 'change', message: '连接超时时间需大于0!' }],
        socketTimeout: [{ type: 'number', min: 1, trigger: 'change', message: 'Socket超时时间需大于0!' }]
      }
    }
  },
  created() {
    this.reset()
    this.getDbGroup()
    this.getDbLayering()
  },
  methods: {
    reset() {
      this.databaseInfo = {
        id: '',
        groupId: '',
        name: '',
        type: 'AliYunOSS',
        label: '',
        category: '4',
        endpoint: '',
        accessKeyId: '',
        accessKeySecret: '',
        securityToken: '',
        connectionTimeout: 60000,
        socketTimeout: 60000
      }
    },
    getDbGroup() {
      tree('').then((res) => {
        this.dbGroup = res.data
      })
    },
    getDbLayering() {
      getDict(dictCode.DATA_SOURCE_LAYERING).then((res) => {
        this.dbLabering = res.data
      })
    },
    async buildPayload() {
      const database = JSON.parse(JSON.stringify(this.databaseInfo))
      database.category = '4'
      database.dbHost = database.endpoint
      database.username = database.accessKeyId
      database.password = await encrypt(database.accessKeySecret)
      database.dbPort = ''
      database.dbName = ''
      database.dbSchema = ''
      database.properties = {
        securityToken: database.securityToken || '',
        connectionTimeout: database.connectionTimeout,
        socketTimeout: database.socketTimeout
      }
      return database
    },
    async testConnect() {
      this.$refs.databaseInfo.validate(async(valid) => {
        if (!valid) return
        const database = await this.buildPayload()
        connect(database).then((res) => {
          this.$message.success(res.data)
        })
      })
    },
    async save() {
      this.$refs.databaseInfo.validate(async(valid) => {
        if (!valid) return
        const database = await this.buildPayload()
        saveDb(database).then((res) => {
          this.$message.success(res.data)
          this.reset()
          this.$emit('save-to-list')
        })
      })
    },
    loadDetail(dbId) {
      detailDb(dbId).then((res) => {
        const detail = res.data || {}
        const properties = !isEmpty(detail.properties) ? detail.properties : {}
        this.databaseInfo = {
          ...this.databaseInfo,
          ...detail,
          type: detail.type || 'AliYunOSS',
          endpoint: detail.dbHost || '',
          accessKeyId: detail.username || '',
          accessKeySecret: detail.password ? decode(detail.password) : '',
          securityToken: properties.securityToken || '',
          connectionTimeout: properties.connectionTimeout || 60000,
          socketTimeout: properties.socketTimeout || 60000
        }
      })
    },
    cancel() {
      this.reset()
      this.$emit('back-to-list')
    }
  }
}
</script>

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
