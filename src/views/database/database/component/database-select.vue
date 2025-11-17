<!-- eslint-disable vue/no-side-effects-in-computed-properties -->
<template>
  <!-- 数据库选择弹窗组件 -->
  <database-dialog
    :title="title"
    :visible="visible"
    :width="width"
    :height="height"
    :show-bth="false"
    @onClose="handleDialogClose"
    @onConfirm="handleDialogConfirm"
  >
    <div slot="content">
      <el-container>
        <!-- 数据库类型侧边栏 -->
        <el-aside width="160px" class="dialog-aside">
          <div class="wrap">
            <div class="flex">
              <i class="el-icon-s-unfold database-icon" />
              请选择数据库类型
            </div>
            <!-- 数据库类型列表（父组件传入） -->
            <div v-for="(item, index) in databaseType" :key="index">
              <div class="item hand" @click="handleDbTypeSelect(item)">
                <div class="flex db-type-item">
                  <img
                    :src="item.img"
                    :width="item.width || 24"
                    :height="item.height || 24"
                    :alt="item.name"
                  >
                  <div class="item-name">{{ item.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-aside>

        <!-- 数据库列表主区域 -->
        <el-main v-loading="loading">
          <el-row
            v-for="(row, rowIndex) in Math.ceil(filteredDatabaseList.length / 3)"
            :key="rowIndex"
            :gutter="20"
          >
            <!-- 数据库列表（父组件传入，按类型筛选后展示） -->
            <el-col
              v-for="item in filteredDatabaseList.slice(rowIndex * 3, (rowIndex + 1) * 3)"
              :key="item.id || rowIndex + '-' + item.name"
              :span="8"
            >
              <div class="database-block hand" @dblclick="handleDatabaseSelect(item)">
                <img
                  :src="item.img"
                  :width="item.width || 48"
                  :height="item.height || 48"
                  :alt="item.name"
                >
              </div>
            </el-col>
          </el-row>
        </el-main>
      </el-container>
    </div>
  </database-dialog>
</template>

<script>
// 引入依赖组件（确保路径与父项目一致，可根据实际调整）
import Dialog from '@/components/common/dynamic-dialog.vue'

export default {
  name: 'DatabaseSelectDialog',
  components: {
    // 注册弹窗基础组件
    'database-dialog': Dialog
  },
  props: {
    // 1. 弹窗可见性（必传）
    visible: {
      type: Boolean,
      required: true,
      default: false
    },
    // 2. 弹窗标题（可选，默认"选择数据库"）
    title: {
      type: String,
      default: '选择数据库'
    },
    // 3. 弹窗宽度（可选，默认"880px"）
    width: {
      type: Number,
      default: 630
    },
    // 4. 弹窗高度（可选，默认"440px"）
    height: {
      type: String,
      default: 'auto'
    },
    // 5. 数据库类型列表（必传，格式：[{id, name, img, width, height}]）
    databaseType: {
      type: Array,
      required: true,
      default: () => []
    },
    // 6. 数据库列表（必传，格式：[{id, name, img, width, height, categoryId}]）
    databaseList: {
      type: Array,
      required: true,
      default: () => []
    },
    // 7. 加载状态（可选，默认false）
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 当前选中的数据库类型ID（用于筛选数据库列表）
      selectedTypeId: ''
    }
  },
  computed: {
    // 筛选后的数据库列表（根据选中的类型过滤）
    filteredDatabaseList() {
      // 若未选类型，默认显示第一个类型的数据库（兼容初始状态）
      if (!this.selectedTypeId && this.databaseType.length > 0) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.selectedTypeId = this.databaseType[0].id
      }
      // 按选中的类型ID筛选
      return this.databaseList.filter(db => db.categoryId === this.selectedTypeId)
    }
  },
  methods: {
    /**
     * 1. 选择数据库类型（向父组件传递选中的类型）
     */
    handleDbTypeSelect(type) {
      this.selectedTypeId = type.id
      this.$emit('select-type', type) // 向父组件发送"选中类型"事件
    },

    /**
     * 2. 双击选择数据库（向父组件传递选中的数据库）
     */
    handleDatabaseSelect(database) {
      this.$emit('select-database', database) // 向父组件发送"选中数据库"事件
      // 可选：选中后自动关闭弹窗（如需手动控制可删除）
      // this.$emit('update:visible', false)
    },

    /**
     * 3. 弹窗关闭事件（向父组件传递关闭信号）
     */
    handleDialogClose() {
      this.$emit('close') // 向父组件发送"关闭弹窗"事件
      // 重置选中状态（可选，根据需求决定是否保留）
      this.selectedTypeId = ''
    },

    /**
     * 4. 弹窗确认事件（向父组件传递确认信号）
     */
    handleDialogConfirm() {
      this.$emit('confirm') // 向父组件发送"确认选择"事件
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
// 修改el-container的样式
::v-deep .el-container {
  flex: 1;
  overflow: hidden;
  background-color: #fff !important;
}

::v-deep .el-dialog {
    max-width: 680px;
    min-height: 530px;
}

::v-deep .el-dialog--center .el-dialog__body {
    text-align: initial;
    padding: 20px 20px 30px;
}

/* 类型列表样式 */
.wrap {
  .flex {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #696969;
    user-select: none;
  }

  .item {
    padding: 8px 10px;
    margin-bottom: 8px;
    border-radius: 4px;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .db-type-item {
    display: flex;
    align-items: center;
    line-height: 24px;
  }

  .item-name {
    margin-left: 10px;
    font-size: 14px;
    font-weight: 500;
  }
}

/* 数据库图标区域样式 */
.database-icon {
  margin-right: 8px;
  margin-top: 2px; // 微调图标对齐
}

.database-block {
  width: 100%;
  height: 110px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #eee;
  border-radius: 6px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  img {
    object-fit: contain;
    user-select: none;
  }
}

/* 适配Element UI栅格间距 */
::v-deep .el-row {
  margin-bottom: 15px;

  &:last-child {
    margin-bottom: 0;
  }
}

::v-deep .el-aside {
  background-color: #fff;
  padding: 10px;
  color: #696969;
  box-shadow: $shadow;
  margin-bottom: 0;
  font-size: 16px;
  font-weight: 600;
  user-select: none;
  min-width: 180px;
}
</style>
