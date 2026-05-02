<!-- eslint-disable vue/no-side-effects-in-computed-properties -->
<template>
  <!-- 数据库选择弹窗组件 -->
  <database-dialog
    :title="title"
    :visible="visible"
    :width="width"
    :height="height"
    :draggable="true"
    top="14vh"
    custom-class="db-access-dialog"
    :show-bth="false"
    :loading="loading"
    @onClose="handleDialogClose"
    @onConfirm="handleDialogConfirm"
  >
    <div slot="content" class="db-select-root">
      <el-container class="db-select-container">
        <el-aside width="208px" class="dialog-aside">
          <div class="aside-inner">
            <div class="aside-title">
              <i class="el-icon-s-operation aside-title-icon" />
              <span>请选择数据库类型</span>
            </div>
            <nav class="type-nav" aria-label="数据库大类">
              <button
                v-for="(item, index) in databaseType"
                :key="item.id || index"
                type="button"
                class="type-nav-item hand"
                :class="{ 'is-active': selectedTypeId === item.id }"
                @click="handleDbTypeSelect(item)"
              >
                <span class="type-icon-wrap">
                  <img
                    :src="item.img"
                    :width="item.width || 22"
                    :height="item.height || 22"
                    class="type-icon-img"
                    :alt="item.name"
                  >
                </span>
                <span class="type-nav-label">{{ item.name }}</span>
              </button>
            </nav>
          </div>
        </el-aside>

        <el-main v-loading="loading" class="db-select-main">
          <div class="main-inner">
            <div class="main-panel-head">
              <div class="main-panel-title">
                <span class="main-panel-dot" aria-hidden="true" />
                <span>可选数据源</span>
              </div>
              <span v-if="filteredDatabaseList.length" class="main-panel-badge">{{ filteredDatabaseList.length }}</span>
            </div>

            <div v-if="filteredDatabaseList.length" class="card-grid">
              <el-tooltip
                v-for="item in filteredDatabaseList"
                :key="item.id || item.name"
                content="暂未开放"
                placement="top"
                effect="dark"
                :disabled="!isDatabaseDisabled(item)"
              >
                <div
                  class="database-card"
                  :class="{ hand: !isDatabaseDisabled(item), 'is-disabled': isDatabaseDisabled(item) }"
                  @dblclick.stop="handleDatabaseActivate(item)"
                >
                  <div class="database-card-shine" aria-hidden="true" />
                  <div class="database-card-logo">
                    <img
                      :src="item.img"
                      :width="item.width || 52"
                      :height="item.height || 52"
                      :alt="item.name"
                    >
                  </div>
                  <div class="database-card-name">{{ item.name }}</div>
                </div>
              </el-tooltip>
            </div>
            <el-empty
              v-else-if="!loading"
              class="grid-empty"
              description="该分类下暂无数据源"
              :image-size="72"
            />

            <div class="db-select-hint">
              <i class="el-icon-info hint-icon" />
              <span>双击卡片进入接入配置</span>
            </div>
          </div>
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
    height: {
      type: [Number, String],
      default: 520
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
     * 接口 enabled === false 时视为未开放，不可进入编辑流程
     */
    isDatabaseDisabled(item) {
      return item && item.enabled === false
    },

    /**
     * 1. 选择数据库类型（向父组件传递选中的类型）
     */
    handleDbTypeSelect(type) {
      this.selectedTypeId = type.id
      this.$emit('select-type', type) // 向父组件发送"选中类型"事件
    },

    /**
     * 双击：选择数据库并进入接入流程（未开放类型不响应；单击仍无操作，与原先一致）
     */
    handleDatabaseActivate(database) {
      if (this.isDatabaseDisabled(database)) {
        return
      }
      this.$emit('select-database', database)
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

$db-border: #e9eef8;
$db-muted: #8b95a8;
$db-title: #31415f;
$db-surface: #fafcff;
$db-glow: rgba(42, 135, 255, 0.12);

@mixin thin-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(42, 135, 255, 0.35) transparent;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(42, 135, 255, 0.35), rgba(42, 135, 255, 0.2));
    border-radius: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.db-select-root {
  height: 100%;
  min-height: 0;
}

.db-select-container {
  height: 100%;
  min-height: 0;
  border-radius: 0 0 16px 16px;
  overflow: hidden;
  background: #fff;
}

::v-deep .el-container.db-select-container {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

.dialog-aside {
  flex-shrink: 0;
  background:
    radial-gradient(120% 80% at 0% 0%, rgba(42, 135, 255, 0.06) 0%, transparent 55%),
    linear-gradient(180deg, #f9fbff 0%, #f0f4fb 100%);
  border-right: 1px solid $db-border;
  padding: 0;
  margin: 0;
  color: $label;
  user-select: none;
}

.aside-inner {
  padding: 20px 14px 18px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.aside-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  color: $db-title;
  margin-bottom: 16px;
  padding: 10px 12px;
  line-height: 1.35;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(233, 238, 248, 0.9);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(22, 40, 94, 0.04);
}

.aside-title-icon {
  font-size: 16px;
  color: $blue;
  filter: drop-shadow(0 1px 2px rgba(42, 135, 255, 0.2));
}

.type-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 2px;
  @include thin-scrollbar;
}

.type-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 11px 12px 11px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.35);
  font-size: 13px;
  font-weight: 500;
  color: $label;
  text-align: left;
  cursor: pointer;
  transition: background 0.22s ease, border-color 0.22s ease, color 0.22s ease,
    box-shadow 0.22s ease, transform 0.18s ease;
  box-sizing: border-box;

  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(42, 135, 255, 0.2);
    color: $menuText;
    box-shadow: 0 4px 12px rgba(22, 40, 94, 0.06);
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    border-color: rgba(42, 135, 255, 0.55);
    box-shadow: 0 0 0 2px rgba(42, 135, 255, 0.2);
  }

  &.is-active {
    background: #fff;
    border-color: rgba(42, 135, 255, 0.38);
    color: $blue;
    box-shadow: 0 6px 20px rgba(22, 40, 94, 0.08);
    transform: translateX(1px);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 56%;
      border-radius: 0 4px 4px 0;
      background: linear-gradient(180deg, $light-blue 0%, $blue 100%);
      box-shadow: 0 0 8px rgba(42, 135, 255, 0.45);
    }

    .type-nav-label {
      font-weight: 600;
      color: $blue;
    }

    .type-icon-wrap {
      border-color: rgba(42, 135, 255, 0.45);
      background: linear-gradient(145deg, #fff 0%, #f0f6ff 100%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }
  }
}

.type-icon-wrap {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #fff;
  border: 1px solid #e4ebf5;
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgba(22, 40, 94, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.type-icon-img {
  display: block;
  object-fit: contain;
}

.type-nav-label {
  flex: 1;
  line-height: 1.35;
  min-width: 0;
}

.db-select-main {
  padding: 0 !important;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse 85% 55% at 85% 0%, rgba(42, 135, 255, 0.06) 0%, transparent 52%),
    linear-gradient(180deg, $db-surface 0%, #fff 28%, #fff 100%) !important;
}

.main-inner {
  height: 100%;
  min-height: 0;
  padding: 22px 24px 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.main-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  flex-shrink: 0;
}

.main-panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: $db-title;
  letter-spacing: 0.02em;
}

.main-panel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, $light-blue, $blue);
  box-shadow: 0 0 0 3px rgba(42, 135, 255, 0.18);
}

.main-panel-badge {
  min-width: 26px;
  height: 26px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: $blue;
  background: linear-gradient(180deg, #f2f7ff 0%, #e8f1ff 100%);
  border: 1px solid rgba(42, 135, 255, 0.22);
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(42, 135, 255, 0.12);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 18px;
  flex: 1;
  align-content: start;
  overflow-y: auto;
  min-height: 0;
  padding: 4px 2px 8px;
  @include thin-scrollbar;
}

.grid-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 24px 0;
}

.grid-empty ::v-deep .el-empty__description {
  margin-top: 12px;
  color: $db-muted;
  font-size: 13px;
}

.database-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 124px;
  padding: 16px 12px;
  border: 1px solid $db-border;
  border-radius: 14px;
  background: linear-gradient(165deg, #fff 0%, #fafcff 100%);
  box-shadow: 0 2px 12px rgba(22, 40, 94, 0.055);
  overflow: hidden;
  transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;

  &:hover:not(.is-disabled) {
    border-color: rgba(42, 135, 255, 0.42);
    box-shadow: 0 10px 28px rgba(22, 40, 94, 0.11), 0 0 0 1px rgba(42, 135, 255, 0.08);
    transform: translateY(-2px);
  }

  &:hover:not(.is-disabled) .database-card-shine {
    opacity: 1;
  }

  &.is-disabled {
    opacity: 0.46;
    filter: grayscale(0.88);
    cursor: not-allowed;

    &:hover {
      transform: none;
      border-color: $db-border;
      box-shadow: 0 2px 12px rgba(22, 40, 94, 0.055);
    }
  }
}

.database-card-shine {
  pointer-events: none;
  position: absolute;
  inset: -40% -20%;
  background: radial-gradient(
    circle at 30% 0%,
    $db-glow 0%,
    transparent 55%
  );
  opacity: 0;
  transition: opacity 0.28s ease;
}

.database-card-logo {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 58px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 14px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.95) 0%, #f1f5fc 100%);
  border: 1px solid rgba(233, 238, 248, 0.95);
  box-sizing: border-box;

  img {
    object-fit: contain;
    max-width: 100%;
    user-select: none;
    filter: drop-shadow(0 2px 6px rgba(22, 40, 94, 0.08));
  }
}

.database-card-name {
  position: relative;
  z-index: 1;
  font-size: 12px;
  font-weight: 600;
  color: $db-title;
  text-align: center;
  line-height: 1.35;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.92;
}

.db-select-hint {
  margin-top: auto;
  padding-top: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: $db-muted;
  letter-spacing: 0.03em;

  .hint-icon {
    font-size: 14px;
    color: rgba(42, 135, 255, 0.65);
  }

  span {
    padding: 8px 16px;
    border-radius: 999px;
    background: rgba(42, 135, 255, 0.06);
    border: 1px solid rgba(42, 135, 255, 0.12);
    color: darken($db-muted, 4%);
  }
}

::v-deep .el-dialog {
  border-radius: 16px !important;
  overflow: hidden;
  border: 1px solid $db-border;
  box-shadow:
    0 4px 6px rgba(22, 40, 94, 0.03),
    0 24px 48px rgba(22, 40, 94, 0.14);
}

::v-deep .el-dialog.db-access-dialog:not(.is-fullscreen) {
  margin-top: clamp(56px, 14vh, 168px) !important;
}

::v-deep .el-dialog__header {
  padding: 16px 22px !important;
  background:
    linear-gradient(90deg, rgba(42, 135, 255, 0.07) 0%, transparent 38%),
    linear-gradient(180deg, #fbfcff 0%, #f3f6fb 100%);
  border-bottom: 1px solid $db-border !important;
}

::v-deep .el-dialog__title {
  font-size: 16px !important;
  font-weight: 600 !important;
  color: $db-title !important;
  letter-spacing: 0.02em;
}

::v-deep .el-dialog__headerbtn .el-dialog__close {
  color: $db-muted !important;
  background: rgba(255, 255, 255, 0.85) !important;
  border: 1px solid $db-border !important;
  border-radius: 10px !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease,
    transform 0.15s ease;
}

::v-deep .el-dialog__headerbtn .el-dialog__close:hover {
  color: $blue !important;
  background: #fff !important;
  border-color: rgba(42, 135, 255, 0.35) !important;
  transform: scale(1.04);
}

::v-deep .el-dialog--center .el-dialog__body {
  text-align: initial;
  padding: 0 !important;
}

::v-deep .el-dialog__body > div {
  height: 100%;
}

/* 数据源接入弹窗单独下移，避免顶部过高 */
::v-deep .db-access-dialog .el-dialog:not(.is-fullscreen) {
  margin-top: clamp(56px, 14vh, 160px) !important;
}
</style>
