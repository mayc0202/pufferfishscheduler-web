/**
 * 用户中心列表页：在 .uc-list flex 布局下测量 .uc-table-wrap 高度，作为 el-table 的 max-height，
 * 表体区域固定可视高度内滚动，与清洗任务等页一致。
 */
export default {
  data() {
    return {
      ucTableMaxHeight: 560
    }
  },

  mounted() {
    this._ucWinResize = () => this.ucSyncTableMaxHeight()
    this.ucSyncTableMaxHeight()
    window.addEventListener('resize', this._ucWinResize, { passive: true })
  },

  activated() {
    this.ucSyncTableMaxHeight()
  },

  beforeDestroy() {
    window.removeEventListener('resize', this._ucWinResize)
  },

  methods: {
    ucSyncTableMaxHeight() {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const el = this.$el && this.$el.querySelector && this.$el.querySelector('.uc-table-wrap')
            if (!el) return
            const h = el.clientHeight
            if (h > 80) {
              this.ucTableMaxHeight = Math.max(200, h - 2)
            } else {
              const win = typeof window !== 'undefined' ? window.innerHeight : 800
              this.ucTableMaxHeight = Math.max(240, win - 400)
            }
          })
        })
      })
    }
  }
}
