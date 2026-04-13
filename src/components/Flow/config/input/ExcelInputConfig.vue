<template>
  <div class="excel-input-config">
    <div class="config-content">
      <FlowConfigHero
        badge="输入"
        title="Excel 输入"
        description="从 Excel 文件（含 FTP 等来源）读取工作表数据并映射为流程字段。"
        tone="azure"
        icon="el-icon-document"
      />
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <template v-if="activeTab === 'basic'">
        <div class="form-item">
          <label class="form-label required">步骤名称：</label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="Excel输入">
        </div>

        <div class="form-item">
          <label class="form-label">说明：</label>
          <textarea v-model="formData.description" class="form-textarea" rows="3" placeholder="请输入说明" />
        </div>

        <div class="section-header" @click="sectionOpen.file = !sectionOpen.file">
          <h4>文件</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.file ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.file" class="section-content">
          <div class="form-item">
            <label class="form-label required">数据源：</label>
            <el-select
              v-model="ftpDataSourceModel"
              class="form-select"
              filterable
              clearable
              placeholder="请选择数据源"
              @visible-change="onFtpDataSourceVisible"
            >
              <el-option
                v-for="db in ftpDataSourceOptions"
                :key="String(db.id)"
                :label="db.name"
                :value="db.id"
              />
            </el-select>
          </div>

          <div class="form-item">
            <label class="form-label required">
              表格处理引擎
              <span class="help-icon" title="与后端 SpreadSheetType 枚举一致">?</span>
              ：
            </label>
            <el-select v-model="formData.engine" class="form-select" clearable placeholder="请选择表格处理引擎">
              <el-option
                v-for="opt in engineOptions"
                :key="String(opt.value)"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>

          <div class="form-item form-item--block">
            <label class="form-label required">文件或目录：</label>
            <div class="block-grow">
              <div class="field-table-wrap">
                <el-table :data="formData.fileList" border style="width: 100%" max-height="220">
                  <el-table-column type="index" label="#" width="50" />
                  <el-table-column prop="name" label="文件/目录" min-width="160" show-overflow-tooltip />
                  <el-table-column prop="fileMask" label="文件名匹配通配符" min-width="140" show-overflow-tooltip />
                  <el-table-column prop="excludeMask" label="文件名排除表达式" min-width="140" show-overflow-tooltip />
                </el-table>
              </div>
              <div class="field-actions">
                <button type="button" class="dash-btn" @click="openFileDialog">
                  <i class="el-icon-plus" /> 添加文件或目录
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="section-header" @click="sectionOpen.sheet = !sectionOpen.sheet">
          <h4><span class="excel-section-req">*</span>工作表</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.sheet ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.sheet" class="section-content">
          <div class="field-table-wrap">
            <el-table :data="formData.sheetList" border style="width: 100%" max-height="200">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column prop="sheetName" label="工作表名称" min-width="120" show-overflow-tooltip />
              <el-table-column prop="startRow" label="起始行" width="88" />
              <el-table-column prop="startColumn" label="起始列" width="88" />
            </el-table>
          </div>
          <div class="field-actions">
            <button type="button" class="dash-btn" @click="openSheetDialog">
              <i class="el-icon-edit" /> 编辑工作表
            </button>
          </div>
        </div>

        <div class="section-header" @click="sectionOpen.field = !sectionOpen.field">
          <h4>字段</h4>
          <div class="section-toggle">
            <i :class="sectionOpen.field ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          </div>
        </div>
        <div v-show="sectionOpen.field" class="section-content">
          <div class="field-table-wrap">
            <el-table :data="formData.fieldList" border style="width: 100%" max-height="240">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column prop="name" label="名称" min-width="100" show-overflow-tooltip />
              <el-table-column label="类型" width="100">
                <template slot-scope="scope">
                  {{ fieldTypeLabel(scope.row.type) }}
                </template>
              </el-table-column>
              <el-table-column prop="length" label="长度" width="72" />
              <el-table-column prop="precision" label="精度" width="72" />
            </el-table>
          </div>
          <div class="field-actions">
            <button type="button" class="dash-btn" @click="openFieldDialog">
              <i class="el-icon-edit" /> 编辑字段
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="advanced-layout">
          <div class="section-header" @click="sectionOpen.fileAdv = !sectionOpen.fileAdv">
            <h4>文件</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.fileAdv ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.fileAdv" class="section-content">
            <div class="form-item">
              <label class="form-label">
                解密码
                <span class="help-icon" title="受保护 Excel 文件的密码">?</span>
                ：
              </label>
              <input v-model="formData.password" type="password" class="form-input" autocomplete="new-password" placeholder="请输入解密码">
            </div>
          </div>

          <div class="section-header" @click="sectionOpen.content = !sectionOpen.content">
            <h4>内容</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.content ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.content" class="section-content">
            <div class="form-item">
              <label class="form-label">
                读取行数
                <span class="help-icon" title="0 表示不限制">?</span>
                ：
              </label>
              <input v-model.number="formData.readLine" type="number" min="0" class="form-input" placeholder="0">
            </div>
            <div class="form-item">
              <label class="form-label">文件编码方式：</label>
              <el-select v-model="formData.assCode" class="form-select" clearable filterable placeholder="请选择编码">
                <el-option
                  v-for="opt in encodingOptions"
                  :key="String(opt.value)"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </div>
            <div class="form-item checkbox-row">
              <el-checkbox v-model="formData.ignoreEmptyRows">是否忽略空行</el-checkbox>
            </div>
          </div>

          <div class="section-header" @click="sectionOpen.distribution = !sectionOpen.distribution">
            <h4>数据分发</h4>
            <div class="section-toggle">
              <i :class="sectionOpen.distribution ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
            </div>
          </div>
          <div v-show="sectionOpen.distribution" class="section-content">
            <div class="advanced-row">
              <span class="advanced-label">数据分发模式：</span>
              <el-radio-group v-model="distributionMode">
                <el-radio label="copy">复制</el-radio>
                <el-radio label="distribute">分发</el-radio>
              </el-radio-group>
            </div>
            <div class="form-item" style="margin-top: 12px;">
              <label class="form-label">并发数量：</label>
              <input v-model.number="formData.copiesCache" type="number" min="1" class="form-input" placeholder="1">
            </div>
          </div>
        </div>
      </template>

      <div class="form-actions">
        <button type="button" class="btn preview-btn" @click="previewData">预览数据</button>
        <button type="button" class="btn primary-btn" @click="handleSubmit">确认</button>
        <button type="button" class="btn secondary-btn" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <!-- 添加文件或目录：双栏浏览 + 已选标签 + 表格 + 底部添加行（对齐参考样式） -->
    <el-dialog
      :visible.sync="fileDialog.visible"
      title="添加文件或目录"
      width="920px"
      append-to-body
      custom-class="excel-file-dialog"
      :close-on-click-modal="false"
      @close="closeFileDialog"
    >
      <div class="excel-file-picker">
        <div class="excel-file-picker__label">浏览添加：</div>

        <div v-loading="fileDialog.browseLoading" class="excel-file-picker__panes">
          <div class="excel-file-picker__pane excel-file-picker__pane--dirs">
            <div v-if="fileDialog.browsePath !== '/'" class="excel-file-picker__up" @click="goBrowseParent">
              <i class="el-icon-arrow-left" /> 上级目录
            </div>
            <div
              v-for="d in fileDialog.browseDirs"
              :key="d.path"
              class="excel-file-picker__row excel-file-picker__row--dir"
              @click="enterBrowseDirectory(d)"
            >
              <i class="el-icon-folder" />
              <span class="excel-file-picker__name">{{ d.name }}</span>
              <i class="el-icon-arrow-right excel-file-picker__chev" />
            </div>
            <div v-if="!fileDialog.browseLoading && !fileDialog.browseDirs.length && fileDialog.browsePath === '/'" class="excel-file-picker__empty">暂无子目录</div>
            <div v-if="!fileDialog.browseLoading && !fileDialog.browseDirs.length && fileDialog.browsePath !== '/'" class="excel-file-picker__empty">当前目录无子文件夹</div>
          </div>
          <div class="excel-file-picker__pane excel-file-picker__pane--files">
            <div class="excel-file-picker__pane-title">文件（可多选）</div>
            <el-checkbox-group v-model="fileDialog.selectedPaths" class="excel-file-picker__checks">
              <div
                v-for="f in fileDialog.browseFiles"
                :key="f.path"
                class="excel-file-picker__row excel-file-picker__row--file"
              >
                <el-checkbox :label="f.path">
                  <i class="el-icon-document" />
                  <span class="excel-file-picker__name">{{ f.name }}</span>
                </el-checkbox>
              </div>
            </el-checkbox-group>
            <div v-if="!fileDialog.browseLoading && !fileDialog.browseFiles.length" class="excel-file-picker__empty">暂无 Excel 文件</div>
          </div>
        </div>

        <div class="excel-file-picker__toolbar">
          <div class="excel-file-picker__tags-input">
            <template v-if="fileDialog.selectedPaths.length">
              <el-tag
                v-for="p in fileDialog.selectedPaths"
                :key="p"
                closable
                size="small"
                class="excel-file-picker__tag"
                @close="removeBrowseSelection(p)"
              >
                {{ displayPathAsTag(p) }}
              </el-tag>
            </template>
            <span v-else class="excel-file-picker__tags-placeholder">请选择</span>
          </div>
          <el-button type="primary" size="small" class="excel-file-picker__add-btn" @click="addCheckedFilesToStaging">添加</el-button>
        </div>

        <el-table
          :data="fileDialog.staging"
          border
          class="excel-dlg-table excel-file-picker__table"
          style="width: 100%"
          max-height="280"
        >
          <el-table-column type="index" label="#" width="48" align="center" />
          <el-table-column min-width="200">
            <template slot="header">
              <span>文件/目录</span>
            </template>
            <template slot-scope="scope">
              <el-input v-model="scope.row.name" size="small" placeholder="路径" />
            </template>
          </el-table-column>
          <el-table-column min-width="160">
            <template slot="header">
              <span>文件名匹配通配符</span>
              <el-tooltip placement="top" effect="dark" popper-class="excel-file-tooltip-popper">
                <div slot="content" class="excel-file-tooltip__content">
                  <div>使用正则匹配待包含的文件名。</div>
                  <div>示例：<code>^.*\.xlsx$</code> 匹配当前目录下所有 xlsx；<code>^.*</code> 匹配当前目录全部文件。</div>
                </div>
                <span class="excel-th-help">?</span>
              </el-tooltip>
            </template>
            <template slot-scope="scope">
              <el-input v-model="scope.row.fileMask" size="small" placeholder="请输入通配符" />
            </template>
          </el-table-column>
          <el-table-column min-width="160">
            <template slot="header">
              <span>文件名排除表达式</span>
              <el-tooltip placement="top" effect="dark" popper-class="excel-file-tooltip-popper">
                <div slot="content" class="excel-file-tooltip__content">
                  <div>对文件名采用正则匹配，符合规则的文件将被排除。</div>
                  <div>示例：使用 <code>.*\.xls</code> 可排除 xls 类型文件。</div>
                </div>
                <span class="excel-th-help">?</span>
              </el-tooltip>
            </template>
            <template slot-scope="scope">
              <el-input v-model="scope.row.excludeMask" size="small" placeholder="请输入表达式" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="72" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="small" class="excel-dlg-link-danger" @click="fileDialog.staging.splice(scope.$index, 1)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <button type="button" class="excel-file-picker__add-row" @click="addFileStagingRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>
      <span slot="footer" class="excel-dlg-footer excel-dlg-footer--center">
        <el-button type="primary" @click="confirmFileDialog">确认</el-button>
        <el-button class="excel-dlg-footer-cancel" @click="fileDialog.visible = false">取消</el-button>
      </span>
    </el-dialog>

    <!-- 编辑工作表：标签在上、表头帮助、表下虚线添加行、页脚三按钮 -->
    <el-dialog
      :visible.sync="sheetDialog.visible"
      title="编辑工作表"
      width="780px"
      append-to-body
      custom-class="excel-sheet-dialog"
      :close-on-click-modal="false"
      @close="closeSheetDialog"
    >
      <div class="excel-sheet-editor">
        <div class="excel-sheet-editor__label">
          <span class="excel-sheet-dlg__req">*</span> 工作表：
        </div>
        <el-table
          :data="sheetDialog.staging"
          border
          class="excel-dlg-table excel-sheet-editor__table"
          style="width: 100%"
          max-height="320"
        >
          <el-table-column type="index" label="#" width="48" align="center" />
          <el-table-column label="工作表名称" min-width="180">
            <template slot-scope="scope">
              <el-input v-model="scope.row.sheetName" size="small" placeholder="工作表名称" />
            </template>
          </el-table-column>
          <el-table-column width="132">
            <template slot="header">
              <span class="excel-sheet-editor__th-wrap">
                <span>起始行</span>
                <el-tooltip effect="dark" placement="top" popper-class="excel-sheet-tooltip-popper">
                  <div slot="content" class="excel-sheet-tooltip__text">
                    起始行为数据表头的Excel行号，数据表头的下一行是数据，默认值为1。
                  </div>
                  <span class="excel-th-help">?</span>
                </el-tooltip>
              </span>
            </template>
            <template slot-scope="scope">
              <el-input v-model.number="scope.row.startRow" size="small" type="number" :min="1" class="excel-sheet-editor__num-input" />
            </template>
          </el-table-column>
          <el-table-column width="132">
            <template slot="header">
              <span class="excel-sheet-editor__th-wrap">
                <span>起始列</span>
                <el-tooltip effect="dark" placement="top" popper-class="excel-sheet-tooltip-popper">
                  <div slot="content" class="excel-sheet-tooltip__text">
                    指定开始读取Excel中数据的列号，默认为1。
                  </div>
                  <span class="excel-th-help">?</span>
                </el-tooltip>
              </span>
            </template>
            <template slot-scope="scope">
              <el-input v-model.number="scope.row.startColumn" size="small" type="number" :min="1" class="excel-sheet-editor__num-input" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="72" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="small" class="excel-dlg-link-danger" @click="sheetDialog.staging.splice(scope.$index, 1)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <button type="button" class="excel-file-picker__add-row excel-sheet-editor__add-row" @click="addSheetRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>
      <div slot="footer" class="excel-sheet-dlg-footer">
        <el-button
          type="primary"
          :loading="sheetFetchLoading"
          @click="fetchSheetNames"
        >获取工作表名称</el-button>
        <el-button type="primary" @click="confirmSheetDialog">确定</el-button>
        <el-button class="excel-dlg-footer-cancel" @click="sheetDialog.visible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- 编辑字段：说明 + 表格 + 虚线添加行；页脚居中 获取字段 / 确定 / 取消 -->
    <el-dialog
      :visible.sync="fieldDialog.visible"
      title="编辑字段"
      top="5vh"
      append-to-body
      custom-class="excel-field-dialog"
      :close-on-click-modal="false"
      @close="closeFieldDialog"
    >
      <div class="excel-field-editor">
        <div class="excel-field-editor__toolbar">
          <span class="excel-field-editor__label"><span class="excel-sheet-dlg__req">*</span> 字段</span>
          <el-tooltip effect="dark" placement="top" popper-class="excel-sheet-tooltip-popper">
            <div slot="content" class="excel-sheet-tooltip__text">
              字段将写入步骤配置。页脚「获取来自头部数据的数据字段」会按当前文件、工作表及起始行，从 Excel 表头解析列名并填充下方表格（将覆盖当前表格内容）。
            </div>
            <span class="excel-th-help">?</span>
          </el-tooltip>
        </div>
        <div class="excel-field-editor__scroll">
          <el-table :data="fieldDialog.staging" border class="excel-dlg-table excel-field-editor__table" max-height="48vh">
            <el-table-column type="index" label="#" width="44" fixed />
            <el-table-column label="名称" min-width="120" fixed>
              <template slot-scope="scope">
                <el-input v-model="scope.row.name" size="small" placeholder="名称" />
              </template>
            </el-table-column>
            <el-table-column label="类型" width="120">
              <template slot-scope="scope">
                <el-select v-model="scope.row.type" size="small" class="w-100" @change="onFieldTypeChange(scope.row)">
                  <el-option v-for="t in fieldTypeOptions" :key="String(t.value)" :label="t.label" :value="t.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="长度" width="88">
              <template slot-scope="scope">
                <el-input v-model="scope.row.length" size="small" placeholder="长度" />
              </template>
            </el-table-column>
            <el-table-column label="精度" width="88">
              <template slot-scope="scope">
                <el-input v-model="scope.row.precision" size="small" placeholder="精度" />
              </template>
            </el-table-column>
            <el-table-column label="去空格类型" width="132">
              <template slot-scope="scope">
                <el-select v-model="scope.row.trimType" size="small" class="w-100">
                  <el-option v-for="t in trimTypeOptions" :key="String(t.value)" :label="t.label" :value="t.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="格式" width="140">
              <template slot-scope="scope">
                <el-select v-model="scope.row.format" size="small" class="w-100" clearable filterable placeholder="下拉选择">
                  <el-option v-for="f in formatOptionsForRow(scope.row)" :key="String(f.value)" :label="f.label" :value="f.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="是否重复" width="100">
              <template slot-scope="scope">
                <el-select v-model="scope.row.repeat" size="small" class="w-100">
                  <el-option label="否" :value="false" />
                  <el-option label="是" :value="true" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="小数点符号" width="100">
              <template slot-scope="scope">
                <el-input v-model="scope.row.decimalSymbol" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="千分位符号" width="100">
              <template slot-scope="scope">
                <el-input v-model="scope.row.groupingSymbol" size="small" placeholder="请输入" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="64" fixed="right" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" class="excel-dlg-link-danger" @click="fieldDialog.staging.splice(scope.$index, 1)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <button type="button" class="excel-file-picker__add-row excel-field-editor__add-row" @click="addFieldRow">
          <i class="el-icon-plus" /> 添加行
        </button>
      </div>
      <div slot="footer" class="excel-field-dlg-footer">
        <el-button
          type="primary"
          :loading="fieldFetchLoading"
          @click="fetchFieldsFromHeader"
        >获取来自头部数据的数据字段</el-button>
        <el-button type="primary" @click="confirmFieldDialog">确定</el-button>
        <el-button class="excel-dlg-footer-cancel" @click="fieldDialog.visible = false">取消</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :visible.sync="previewVisible"
      title="预览数据"
      width="90%"
      append-to-body
      :close-on-click-modal="false"
      custom-class="excel-preview-dialog"
    >
      <div class="preview-body">
        <el-table
          v-loading="previewLoading"
          :data="previewTableData"
          border
          style="width: 100%"
          max-height="500"
        >
          <el-table-column type="index" label="#" width="56" />
          <el-table-column
            v-for="(column, index) in previewColumns"
            :key="index"
            :prop="column"
            :label="column"
            show-overflow-tooltip
            min-width="120"
          />
        </el-table>
      </div>
      <span slot="footer">
        <el-button @click="previewVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { ftpDbTree } from '@/api/database/database/dbGroup'
import { directoryTree } from '@/api/database/resource/resource'
import { getExcelResources, getExcelSheets, getExcelFields } from '@/api/collect/plugin/excel'
import { previewData as previewDataApi } from '@/api/collect/trans/transFlow'
import { normalizeDictList, normalizeFieldTypeDictList } from '@/utils/component-dict-normalize'
import FlowConfigHero from '../common/FlowConfigHero.vue'

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

function safeParseJson(raw) {
  if (raw == null || raw === '') return null
  if (typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  }
  return null
}

const DEFAULT_ENGINES = [
  { label: 'Excel 97-2003 XLS (JXL)', value: 'JXL' },
  { label: 'Excel 2007 XLSX (Apache POI)', value: 'POI' },
  { label: 'Excel 2007 XLSX (Apache POI Streaming)', value: 'SAX_POI' },
  { label: 'Open Office ODS openoffice', value: 'ODS' }
]

const DEFAULT_ENCODINGS = [
  { label: 'UTF-8', value: 'UTF-8' },
  { label: 'GB2312', value: 'GB2312' },
  { label: 'GBK', value: 'GBK' },
  { label: 'ISO-8859-1', value: 'ISO-8859-1' }
]

/** 与 Kettle ValueMetaInterface 类型码一致，后端 Excel 插件多返回数字 type */
const KETTLE_VALUE_META_TYPE = {
  NUMBER: 1,
  STRING: 2,
  DATE: 3,
  BOOLEAN: 4,
  INTEGER: 5,
  BIGNUMBER: 6,
  TIMESTAMP: 9
}

/** 下拉展示英文技术名，value 仍为后端类型码 */
const DEFAULT_FIELD_TYPES = [
  { label: 'String', value: KETTLE_VALUE_META_TYPE.STRING },
  { label: 'Number', value: KETTLE_VALUE_META_TYPE.NUMBER },
  { label: 'Date', value: KETTLE_VALUE_META_TYPE.DATE },
  { label: 'Boolean', value: KETTLE_VALUE_META_TYPE.BOOLEAN },
  { label: 'Integer', value: KETTLE_VALUE_META_TYPE.INTEGER },
  { label: 'BigNumber', value: KETTLE_VALUE_META_TYPE.BIGNUMBER },
  { label: 'Timestamp', value: KETTLE_VALUE_META_TYPE.TIMESTAMP }
]

function coerceFieldTypeToId(raw) {
  if (raw == null || raw === '') return KETTLE_VALUE_META_TYPE.STRING
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  const s = String(raw).trim()
  if (s === '') return KETTLE_VALUE_META_TYPE.STRING
  if (/^-?\d+$/.test(s)) {
    const n = Number(s)
    return Number.isFinite(n) ? n : KETTLE_VALUE_META_TYPE.STRING
  }
  const lower = s.toLowerCase()
  const NAME_TO_ID = {
    string: KETTLE_VALUE_META_TYPE.STRING,
    str: KETTLE_VALUE_META_TYPE.STRING,
    number: KETTLE_VALUE_META_TYPE.NUMBER,
    num: KETTLE_VALUE_META_TYPE.NUMBER,
    date: KETTLE_VALUE_META_TYPE.DATE,
    boolean: KETTLE_VALUE_META_TYPE.BOOLEAN,
    bool: KETTLE_VALUE_META_TYPE.BOOLEAN,
    integer: KETTLE_VALUE_META_TYPE.INTEGER,
    int: KETTLE_VALUE_META_TYPE.INTEGER,
    bignumber: KETTLE_VALUE_META_TYPE.BIGNUMBER,
    bigint: KETTLE_VALUE_META_TYPE.BIGNUMBER,
    timestamp: KETTLE_VALUE_META_TYPE.TIMESTAMP,
    time: KETTLE_VALUE_META_TYPE.TIMESTAMP
  }
  return NAME_TO_ID[lower] != null ? NAME_TO_ID[lower] : KETTLE_VALUE_META_TYPE.STRING
}

function enrichFieldTypeOption(opt, defaults) {
  const n = typeof opt.value === 'number' ? opt.value : Number(String(opt.value).trim())
  if (!Number.isFinite(n)) return opt
  const def = defaults.find((d) => Number(d.value) === n)
  const lb = String(opt.label || '').trim()
  if (def) {
    return { label: def.label, value: n }
  }
  return { label: lb || String(n), value: n }
}

const DEFAULT_TRIM_TYPES = [
  { label: '不去掉空格', value: 0 },
  { label: '左去掉空格', value: 1 },
  { label: '右去掉空格', value: 2 },
  { label: '两端去掉空格', value: 3 }
]

function emptyFileRow() {
  return { name: '', fileMask: '', excludeMask: '' }
}

function emptySheetRow() {
  return { sheetName: '', startRow: 1, startColumn: 1 }
}

function emptyFieldRow() {
  return {
    name: '',
    type: KETTLE_VALUE_META_TYPE.STRING,
    length: '',
    precision: '',
    trimType: 0,
    format: '',
    repeat: false,
    decimalSymbol: '.',
    groupingSymbol: ''
  }
}

export default {
  name: 'ExcelInputConfig',
  components: { FlowConfigHero },
  props: {
    formData: {
      type: Object,
      required: true
    },
    flowId: {
      type: [Number, String],
      default: null
    },
    /** /trans/component/tree.do 中当前组件节点上的 config（字典等） */
    componentTreeConfig: {
      type: [Object, String, Array],
      default: null
    }
  },
  data() {
    return {
      activeTab: 'basic',
      sectionOpen: {
        file: true,
        sheet: true,
        field: true,
        fileAdv: true,
        content: true,
        distribution: true
      },
      ftpDataSourceOptions: [],
      fileDialog: {
        visible: false,
        staging: [],
        browsePath: '/',
        browseDirs: [],
        browseFiles: [],
        selectedPaths: [],
        browseLoading: false
      },
      sheetDialog: {
        visible: false,
        staging: []
      },
      fieldDialog: {
        visible: false,
        staging: []
      },
      previewVisible: false,
      previewLoading: false,
      previewTableData: [],
      previewColumns: [],
      sheetFetchLoading: false,
      fieldFetchLoading: false
    }
  },
  computed: {
    parsedTreeConfig() {
      return safeParseJson(this.componentTreeConfig) || {}
    },
    /** 支持整包在 data 下，或直接平铺 */
    dictRoot() {
      const p = this.parsedTreeConfig
      const inner = p && typeof p.data === 'object' && !Array.isArray(p.data) ? p.data : null
      return inner && Object.keys(inner).length ? inner : p
    },
    engineOptions() {
      const fromApi = normalizeDictList(
        this.dictRoot.engine ||
        this.dictRoot.engineList ||
        this.dictRoot.spreadSheetType ||
        this.dictRoot.excelEngine
      )
      return fromApi.length ? fromApi : DEFAULT_ENGINES
    },
    encodingOptions() {
      const fromApi = normalizeDictList(
        this.dictRoot.assCode ||
        this.dictRoot.encoding ||
        this.dictRoot.encodingList ||
        this.dictRoot.charset
      )
      return fromApi.length ? fromApi : DEFAULT_ENCODINGS
    },
    fieldTypeOptions() {
      const raw =
        this.dictRoot.fieldType ||
        this.dictRoot.fieldTypes ||
        this.dictRoot.valueType ||
        this.dictRoot.types
      const fromApi = normalizeFieldTypeDictList(raw)
      if (!fromApi.length) return DEFAULT_FIELD_TYPES

      const enriched = fromApi.map((opt) => enrichFieldTypeOption(opt, DEFAULT_FIELD_TYPES))
      const haveNum = new Set(
        enriched.filter((o) => typeof o.value === 'number' && Number.isFinite(o.value)).map((o) => Number(o.value))
      )
      DEFAULT_FIELD_TYPES.forEach((d) => {
        const n = Number(d.value)
        if (!haveNum.has(n)) {
          enriched.push({ ...d })
          haveNum.add(n)
        }
      })
      enriched.sort((a, b) => {
        const na = typeof a.value === 'number' && Number.isFinite(a.value) ? a.value : 1000
        const nb = typeof b.value === 'number' && Number.isFinite(b.value) ? b.value : 1000
        return na - nb
      })
      return enriched
    },
    trimTypeOptions() {
      const fromApi = normalizeDictList(this.dictRoot.trimType || this.dictRoot.trimTypes)
      return fromApi.length ? fromApi : DEFAULT_TRIM_TYPES
    },
    formatDictBundle() {
      const d = this.dictRoot
      const fmt = d.format || d.formats || d.formatDict
      if (fmt && typeof fmt === 'object' && !Array.isArray(fmt)) {
        return {
          all: normalizeDictList(fmt.all || fmt.string || fmt.str),
          date: normalizeDictList(fmt.date || fmt.time),
          number: normalizeDictList(fmt.number || fmt.num)
        }
      }
      return {
        all: normalizeDictList(d.formatAll || d.stringFormat),
        date: normalizeDictList(d.formatDate || d.dateFormat),
        number: normalizeDictList(d.formatNumber || d.numberFormat)
      }
    },
    ftpDataSourceModel: {
      get() {
        const v =
          this.formData.ftpDataSourceId != null && this.formData.ftpDataSourceId !== ''
            ? this.formData.ftpDataSourceId
            : (this.formData.dataSourceId != null && this.formData.dataSourceId !== ''
              ? this.formData.dataSourceId
              : this.formData.dataSource)
        return v !== '' && v != null ? v : null
      },
      set(v) {
        this.$set(this.formData, 'ftpDataSourceId', v)
        this.$set(this.formData, 'dataSource', v)
        this.$set(this.formData, 'dataSourceId', v)
      }
    },
    distributionMode: {
      get() {
        return this.formData.distributeType ? 'copy' : 'distribute'
      },
      set(v) {
        this.$set(this.formData, 'distributeType', v === 'copy')
      }
    }
  },
  mounted() {
    this.initDefaults()
    this.loadFtpDataSources()
  },
  methods: {
    initDefaults() {
      if (this.formData.code === undefined || this.formData.code === '') {
        this.$set(this.formData, 'code', 'ExcelInput')
      }
      if (!Array.isArray(this.formData.fileList)) this.$set(this.formData, 'fileList', [])
      if (!Array.isArray(this.formData.sheetList)) this.$set(this.formData, 'sheetList', [])
      if (!Array.isArray(this.formData.fieldList)) this.$set(this.formData, 'fieldList', [])
      else {
        this.formData.fieldList.forEach((row, i) => {
          if (!row) return
          const nid = coerceFieldTypeToId(row.type)
          if (row.type !== nid) this.$set(this.formData.fieldList[i], 'type', nid)
        })
      }
      this.$set(this.formData, 'fileSourceType', 'FTP_FILE')
      if (!this.formData.engine) {
        const first = this.engineOptions[0]
        this.$set(this.formData, 'engine', first ? first.value : 'JXL')
      }
      if (this.formData.password === undefined) this.$set(this.formData, 'password', '')
      if (this.formData.readLine === undefined || this.formData.readLine === null) {
        this.$set(this.formData, 'readLine', 0)
      }
      if (!this.formData.assCode) {
        const enc = this.encodingOptions[0]
        this.$set(this.formData, 'assCode', enc ? enc.value : 'UTF-8')
      }
      if (this.formData.ignoreEmptyRows === undefined) this.$set(this.formData, 'ignoreEmptyRows', true)
      if (this.formData.distributeType === undefined) this.$set(this.formData, 'distributeType', false)
      if (this.formData.copiesCache === undefined || this.formData.copiesCache === '') {
        this.$set(this.formData, 'copiesCache', 1)
      }
    },
    fieldTypeLabel(type) {
      const id = coerceFieldTypeToId(type)
      const opts = this.fieldTypeOptions
      const hit = opts.find((o) => o.value === id || Number(o.value) === id)
      if (hit) return hit.label
      return String(type != null ? type : '')
    },
    formatDictKeyForType(type) {
      const n = Number(type)
      if (Number.isFinite(n)) {
        if (n === KETTLE_VALUE_META_TYPE.DATE || n === KETTLE_VALUE_META_TYPE.TIMESTAMP) return 'date'
        if (n === KETTLE_VALUE_META_TYPE.NUMBER || n === KETTLE_VALUE_META_TYPE.INTEGER || n === KETTLE_VALUE_META_TYPE.BIGNUMBER) {
          return 'number'
        }
      }
      const t = String(type || '').toLowerCase()
      if (t.includes('date') || t.includes('time') || t.includes('timestamp')) return 'date'
      if (t.includes('number') || t.includes('integer') || t.includes('big') || t === 'int') return 'number'
      return 'all'
    },
    formatOptionsForRow(row) {
      const key = this.formatDictKeyForType(row && row.type)
      const b = this.formatDictBundle
      const list = (key === 'date' && b.date.length) ? b.date
        : (key === 'number' && b.number.length) ? b.number
          : b.all.length ? b.all : []
      return list
    },
    onFieldTypeChange(row) {
      if (!row) return
      const opts = this.formatOptionsForRow(row)
      if (opts.length && row.format) {
        const hit = opts.some(o => String(o.value) === String(row.format))
        if (!hit) this.$set(row, 'format', '')
      }
    },
    async onFtpDataSourceVisible(visible) {
      if (!visible) return
      if (this.ftpDataSourceOptions.length) return
      await this.loadFtpDataSources()
    },
    async loadFtpDataSources() {
      try {
        const res = await ftpDbTree('')
        const nodes = Array.isArray(res?.data) ? res.data : []
        this.ftpDataSourceOptions = this.flattenDatabaseNodes(nodes)
      } catch (e) {
        this.ftpDataSourceOptions = []
      }
    },
    flattenDatabaseNodes(nodes) {
      const out = []
      const walk = (arr) => {
        const list = arr || []
        list.forEach((n) => {
          if (!n) return
          if (String(n.type || '').toUpperCase() === 'DATABASE') {
            out.push({ id: n.id, name: n.name || String(n.id) })
          }
          if (Array.isArray(n.children) && n.children.length) walk(n.children)
        })
      }
      walk(nodes)
      return out
    },
    getLocalListFromResponse(res) {
      if (Array.isArray(res?.result)) return res.result
      if (Array.isArray(res?.data)) return res.data
      return []
    },
    isExcelFileName(name) {
      return /\.(xlsx|xls|ods)$/i.test(String(name || ''))
    },
    normalizePathForStore(path) {
      let p = String(path || '').trim()
      if (!p) return ''
      if (!p.startsWith('/')) p = '/' + p
      return p
    },
    /**
     * FTP/Excel 资源项：接口常只返回 name + type，需用当前目录路径拼接全路径
     */
    joinUnderFtpPath(parentPath, segment) {
      const seg = String(segment || '').replace(/^\/+|\/+$/g, '')
      if (!seg) return ''
      let p = String(parentPath || '/').trim() || '/'
      if (!p.startsWith('/')) p = '/' + p
      const trimmed = p.replace(/\/+$/, '')
      if (trimmed === '' || trimmed === '/') return '/' + seg
      return trimmed + '/' + seg
    },
    resolveFtpEntryPath(parentPath, item) {
      if (!item) return ''
      const explicit = item.path != null ? String(item.path).trim() : ''
      if (explicit) return this.normalizePathForStore(explicit)
      const name = item.name != null ? String(item.name).trim() : ''
      if (!name) return ''
      return this.normalizePathForStore(this.joinUnderFtpPath(parentPath, name))
    },
    /**
     * 拉取某 FTP 目录下的子目录与 Excel 文件（getResources 优先，空则 directoryTree）
     */
    async fetchFtpDirectoryListing(parentPath) {
      const dbId = Number(this.ftpDataSourceModel)
      if (!Number.isFinite(dbId) || dbId <= 0) {
        return { dirs: [], files: [] }
      }
      const parentPathNorm = this.normalizePathForStore(parentPath) || '/'
      let list = []
      try {
        const er = await getExcelResources(dbId, parentPathNorm)
        list = this.getLocalListFromResponse(er)
      } catch (e) {
        list = []
      }
      if (!list.length) {
        try {
          const treeRes = await directoryTree(dbId, parentPathNorm)
          list = Array.isArray(treeRes?.data) ? treeRes.data : []
        } catch (e) {
          list = []
        }
      }
      const dirs = []
      const files = []
      const pathSeen = new Set()
      list.forEach((x) => {
        const type = String(x?.type || '').toUpperCase()
        const fullPath = this.resolveFtpEntryPath(parentPathNorm, x)
        const name = x?.name != null ? String(x.name) : (fullPath ? fullPath.replace(/^.*\//, '') : '')
        if (!fullPath || pathSeen.has(fullPath)) return
        pathSeen.add(fullPath)
        if (type === 'FILE') {
          if (!this.isExcelFileName(name)) return
          files.push({ path: fullPath, name })
          return
        }
        if (type === 'DIRECTORY' || type === 'DIR' || type === 'FOLDER') {
          dirs.push({ path: fullPath, name: name || fullPath })
          return
        }
        if (this.isExcelFileName(name)) {
          files.push({ path: fullPath, name })
        } else {
          dirs.push({ path: fullPath, name: name || fullPath })
        }
      })
      dirs.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-CN'))
      files.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-CN'))
      return { dirs, files }
    },
    async loadFileBrowsePanel() {
      this.fileDialog.browseLoading = true
      try {
        const { dirs, files } = await this.fetchFtpDirectoryListing(this.fileDialog.browsePath)
        this.fileDialog.browseDirs = dirs
        this.fileDialog.browseFiles = files
        const valid = new Set(files.map((f) => f.path))
        this.fileDialog.selectedPaths = (this.fileDialog.selectedPaths || []).filter((p) => valid.has(p))
      } catch (e) {
        this.fileDialog.browseDirs = []
        this.fileDialog.browseFiles = []
      } finally {
        this.fileDialog.browseLoading = false
      }
    },
    enterBrowseDirectory(d) {
      if (!d || !d.path) return
      this.fileDialog.browsePath = d.path
      this.fileDialog.selectedPaths = []
      this.loadFileBrowsePanel()
    },
    goBrowseParent() {
      const p = String(this.fileDialog.browsePath || '/').trim() || '/'
      if (p === '/' || p === '') return
      const trimmed = p.replace(/\/+$/, '')
      const parts = trimmed.split('/').filter(Boolean)
      parts.pop()
      this.fileDialog.browsePath = parts.length ? '/' + parts.join('/') : '/'
      this.fileDialog.selectedPaths = []
      this.loadFileBrowsePanel()
    },
    displayPathAsTag(fullPath) {
      const s = String(fullPath || '').replace(/^\/+/, '')
      return s ? s.split('/').join(' / ') : ''
    },
    removeBrowseSelection(path) {
      this.fileDialog.selectedPaths = (this.fileDialog.selectedPaths || []).filter((x) => x !== path)
    },
    addCheckedFilesToStaging() {
      const paths = this.fileDialog.selectedPaths || []
      if (!paths.length) {
        this.$message.warning('请先勾选要添加的文件')
        return
      }
      paths.forEach((path) => {
        const norm = this.normalizePathForStore(path)
        const exists = this.fileDialog.staging.some((r) => String(r.name || '') === norm)
        if (!exists) {
          this.fileDialog.staging.push({ name: norm, fileMask: '', excludeMask: '' })
        }
      })
      this.fileDialog.selectedPaths = []
      this.$message.success('已添加到下方列表')
    },
    openFileDialog() {
      if (this.ftpDataSourceModel == null || this.ftpDataSourceModel === '') {
        this.$message.warning('请先选择数据源')
        return
      }
      this.fileDialog.staging = clone(this.formData.fileList || []).map((r) => ({
        name: r.name || '',
        fileMask: r.fileMask || '',
        excludeMask: r.excludeMask || ''
      }))
      this.fileDialog.browsePath = '/'
      this.fileDialog.selectedPaths = []
      this.fileDialog.browseDirs = []
      this.fileDialog.browseFiles = []
      this.fileDialog.visible = true
      this.$nextTick(() => this.loadFileBrowsePanel())
    },
    closeFileDialog() {
      this.fileDialog.selectedPaths = []
    },
    addFileStagingRow() {
      this.fileDialog.staging.push(emptyFileRow())
    },
    confirmFileDialog() {
      const rows = (this.fileDialog.staging || [])
        .map((r) => ({
          name: String(r.name || '').trim(),
          fileMask: r.fileMask != null ? String(r.fileMask) : '',
          excludeMask: r.excludeMask != null ? String(r.excludeMask) : ''
        }))
        .filter((r) => r.name)
      this.$set(this.formData, 'fileList', rows)
      this.fileDialog.visible = false
    },
    openSheetDialog() {
      this.sheetDialog.staging = clone(this.formData.sheetList || []).map((r) => ({
        sheetName: r.sheetName || '',
        startRow: Number(r.startRow) > 0 ? Number(r.startRow) : 1,
        startColumn: Number(r.startColumn) > 0 ? Number(r.startColumn) : 1
      }))
      if (!this.sheetDialog.staging.length) this.sheetDialog.staging.push(emptySheetRow())
      this.sheetDialog.visible = true
    },
    closeSheetDialog() {},
    addSheetRow() {
      this.sheetDialog.staging.push(emptySheetRow())
    },
    confirmSheetDialog() {
      const rows = (this.sheetDialog.staging || [])
        .map((r) => ({
          sheetName: String(r.sheetName || '').trim(),
          startRow: Number(r.startRow) > 0 ? Number(r.startRow) : 1,
          startColumn: Number(r.startColumn) > 0 ? Number(r.startColumn) : 1
        }))
        .filter((r) => r.sheetName)
      this.$set(this.formData, 'sheetList', rows)
      this.sheetDialog.visible = false
    },
    /**
     * 构建 TransConfigForm：flowId、config（步骤 JSON 字符串）、stepName
     */
    buildTransConfigForm() {
      const stepName = String(this.formData.name || '').trim()
      if (!stepName) return null
      const fid = Number(this.flowId)
      if (!Number.isFinite(fid)) return null
      const config = {
        name: stepName,
        code: 'ExcelInput',
        data: this.buildBackendDataPayload()
      }
      return {
        flowId: fid,
        config: JSON.stringify(config),
        stepName
      }
    },
    normalizeSheetNamesFromApi(data) {
      if (data == null) return []
      if (Array.isArray(data)) {
        return data
          .map((x) => {
            if (typeof x === 'string') return x.trim()
            if (x != null && x.sheetName != null) return String(x.sheetName).trim()
            if (x != null && x.name != null) return String(x.name).trim()
            return String(x).trim()
          })
          .filter(Boolean)
      }
      return []
    },
    normalizeFieldRowsFromApi(data) {
      const list = Array.isArray(data) ? data : []
      return list
        .map((vo) => {
          if (vo == null) return null
          const row = emptyFieldRow()
          const name = String(vo.name != null ? vo.name : (vo.fieldName != null ? vo.fieldName : (vo.field_name != null ? vo.field_name : ''))).trim()
          if (!name) return null
          row.name = name
          if (vo.type != null) row.type = coerceFieldTypeToId(vo.type)
          if (vo.length != null && vo.length !== '') row.length = String(vo.length)
          if (vo.precision != null && vo.precision !== '') row.precision = String(vo.precision)
          if (vo.trimType != null && vo.trimType !== '') {
            const t = Number(vo.trimType)
            if (Number.isFinite(t)) row.trimType = t
          }
          if (vo.format != null) row.format = String(vo.format)
          if (vo.repeat != null) {
            row.repeat = vo.repeat === true || vo.repeat === 'true' || vo.repeat === 1 || vo.repeat === '1'
          }
          if (vo.decimalSymbol != null) row.decimalSymbol = String(vo.decimalSymbol)
          if (vo.groupingSymbol != null) row.groupingSymbol = String(vo.groupingSymbol)
          else if (vo.groupSymbol != null) row.groupingSymbol = String(vo.groupSymbol)
          return row
        })
        .filter(Boolean)
    },
    async fetchSheetNames() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在')
        return
      }
      if (!String(this.formData.name || '').trim()) {
        this.$message.warning('请先填写步骤名称')
        return
      }
      if (!this.formData.fileList || !this.formData.fileList.length) {
        this.$message.warning('请先配置文件列表')
        return
      }
      if (!this.formData.engine) {
        this.$message.warning('请选择表格处理引擎')
        return
      }
      if (this.ftpDataSourceModel == null || this.ftpDataSourceModel === '') {
        this.$message.warning('请先选择数据源')
        return
      }
      const body = this.buildTransConfigForm()
      if (!body || !body.config) {
        this.$message.warning('无法组装配置，请检查步骤名称与流程')
        return
      }
      this.sheetFetchLoading = true
      try {
        const res = await getExcelSheets(body)
        if (res.code !== '000000') {
          this.$message.error(res.message || '获取工作表名称失败')
          return
        }
        const names = this.normalizeSheetNamesFromApi(res.data)
        if (!names.length) {
          this.$message.warning('未解析到工作表名称')
          return
        }
        this.sheetDialog.staging = names.map((sheetName) => ({
          sheetName,
          startRow: 1,
          startColumn: 1
        }))
        this.$message.success(`已获取 ${names.length} 个工作表`)
      } catch (e) {
        console.error(e)
        this.$message.error('获取工作表名称失败')
      } finally {
        this.sheetFetchLoading = false
      }
    },
    openFieldDialog() {
      this.fieldDialog.staging = clone(this.formData.fieldList || []).map((r) => this.normalizeFieldRow(r))
      this.fieldDialog.visible = true
    },
    normalizeFieldRow(r) {
      const repeatVal = r.repeat === true || r.repeat === 'true' || r.repeat === 1 || r.repeat === '1'
      let trim = r.trimType
      if (trim === undefined || trim === null || trim === '') trim = 0
      trim = Number(trim)
      if (!Number.isFinite(trim)) trim = 0
      return {
        name: r.name != null ? String(r.name) : '',
        type: r.type != null ? coerceFieldTypeToId(r.type) : KETTLE_VALUE_META_TYPE.STRING,
        length: r.length != null ? String(r.length) : '',
        precision: r.precision != null ? String(r.precision) : '',
        trimType: trim,
        format: r.format != null ? String(r.format) : '',
        repeat: repeatVal,
        decimalSymbol: r.decimalSymbol != null ? String(r.decimalSymbol) : '.',
        groupingSymbol: r.groupingSymbol != null ? String(r.groupingSymbol) : (r.groupSymbol != null ? String(r.groupSymbol) : '')
      }
    },
    closeFieldDialog() {},
    addFieldRow() {
      this.fieldDialog.staging.push(emptyFieldRow())
    },
    confirmFieldDialog() {
      const rows = (this.fieldDialog.staging || [])
        .map((r) => this.normalizeFieldRow(r))
        .filter((r) => r.name)
      this.$set(this.formData, 'fieldList', rows)
      this.fieldDialog.visible = false
    },
    async fetchFieldsFromHeader() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在')
        return
      }
      if (!String(this.formData.name || '').trim()) {
        this.$message.warning('请先填写步骤名称')
        return
      }
      if (!this.formData.fileList || !this.formData.fileList.length) {
        this.$message.warning('请先配置文件列表')
        return
      }
      if (!this.formData.sheetList || !this.formData.sheetList.length) {
        this.$message.warning('请先配置工作表（可先使用「获取工作表名称」）')
        return
      }
      if (!this.formData.engine) {
        this.$message.warning('请选择表格处理引擎')
        return
      }
      if (this.ftpDataSourceModel == null || this.ftpDataSourceModel === '') {
        this.$message.warning('请先选择数据源')
        return
      }
      const body = this.buildTransConfigForm()
      if (!body || !body.config) {
        this.$message.warning('无法组装配置，请检查步骤名称与流程')
        return
      }
      this.fieldFetchLoading = true
      try {
        const res = await getExcelFields(body)
        if (res.code !== '000000') {
          this.$message.error(res.message || '获取字段失败')
          return
        }
        const rows = this.normalizeFieldRowsFromApi(res.data)
        if (!rows.length) {
          this.$message.warning('未解析到字段')
          return
        }
        this.fieldDialog.staging = rows
        this.$message.success(`已获取 ${rows.length} 个字段`)
      } catch (e) {
        console.error(e)
        this.$message.error('获取字段失败')
      } finally {
        this.fieldFetchLoading = false
      }
    },
    buildBackendDataPayload() {
      const fd = this.formData
      const rawDs = this.ftpDataSourceModel
      let dataSourceId = null
      if (rawDs != null && rawDs !== '') {
        const n = Number(rawDs)
        dataSourceId = Number.isFinite(n) ? n : String(rawDs)
      }
      return {
        fileList: Array.isArray(fd.fileList) ? clone(fd.fileList) : [],
        sheetList: Array.isArray(fd.sheetList) ? clone(fd.sheetList) : [],
        fieldList: Array.isArray(fd.fieldList) ? clone(fd.fieldList) : [],
        dataSourceId,
        fileSourceType: 'FTP_FILE',
        engine: fd.engine || 'JXL',
        password: fd.password != null ? String(fd.password) : '',
        readLine: fd.readLine != null && fd.readLine !== '' ? Number(fd.readLine) : 0,
        assCode: fd.assCode != null ? String(fd.assCode) : '',
        ignoreEmptyRows: fd.ignoreEmptyRows !== false,
        copiesCache: fd.copiesCache != null && fd.copiesCache !== '' ? Number(fd.copiesCache) : 1,
        distributeType: !!fd.distributeType
      }
    },
    async previewData() {
      if (!this.flowId) {
        this.$message.warning('流程ID不存在')
        return
      }
      if (!this.formData.name) {
        this.$message.warning('请先输入步骤名称')
        return
      }
      if (!this.formData.fileList || !this.formData.fileList.length) {
        this.$message.warning('请先配置文件列表')
        return
      }

      this.previewVisible = true
      this.previewLoading = true
      this.previewTableData = []
      this.previewColumns = []

      const config = {
        name: this.formData.name,
        code: 'ExcelInput',
        data: this.buildBackendDataPayload()
      }

      try {
        const res = await previewDataApi({
          id: this.flowId,
          config: JSON.stringify(config)
        })
        if (res.code === '000000' && res.data) {
          if (res.data.fieldList && res.data.fieldList.length > 0) {
            this.previewColumns = res.data.fieldList
            if (res.data.dataList && res.data.dataList.length > 0) {
              this.previewTableData = res.data.dataList.map((row) => {
                const obj = {}
                res.data.fieldList.forEach((field, index) => {
                  obj[field] = row[index]
                })
                return obj
              })
            }
          } else {
            this.previewColumns = []
            this.previewTableData = []
            if (res.message) this.$message.info(res.message)
          }
        } else {
          this.$message.error(res.message || '获取预览数据失败')
        }
      } catch (e) {
        console.error(e)
        this.$message.error('预览数据失败')
      } finally {
        this.previewLoading = false
      }
    },
    handleSubmit() {
      if (!this.formData.name || !String(this.formData.name).trim()) {
        this.$message.warning('请输入步骤名称')
        return
      }
      if (!this.formData.fileList || !this.formData.fileList.length) {
        this.$message.warning('文件列表不能为空')
        return
      }
      const badFile = this.formData.fileList.find((r) => !r || !String(r.name || '').trim())
      if (badFile) {
        this.$message.warning('文件列表中存在空的文件/目录路径')
        return
      }
      if (!this.formData.engine) {
        this.$message.warning('请选择表格处理引擎')
        return
      }
      if (this.ftpDataSourceModel == null || this.ftpDataSourceModel === '') {
        this.$message.warning('请选择数据源')
        return
      }
      if (!this.formData.sheetList || !this.formData.sheetList.length) {
        this.$message.warning('工作表配置不能为空')
        return
      }
      const badSheet = this.formData.sheetList.find((r) => !r || !String(r.sheetName || '').trim())
      if (badSheet) {
        this.$message.warning('工作表名称不能为空')
        return
      }
      if (!this.formData.fieldList || !this.formData.fieldList.length) {
        this.$message.warning('字段列表不能为空')
        return
      }
      const badField = this.formData.fieldList.find((r) => !r || !String(r.name || '').trim())
      if (badField) {
        this.$message.warning('字段名称不能为空')
        return
      }

      const payload = {
        name: String(this.formData.name).trim(),
        code: 'ExcelInput',
        description: this.formData.description != null ? String(this.formData.description) : '',
        ...this.buildBackendDataPayload()
      }
      this.$emit('save', payload)
    }
  }
}
</script>

<style scoped>
.excel-input-config {
  width: 100%;
}

.config-content {
  padding: 20px;
}

.config-tabs {
  margin: 0 0 8px;
}

.form-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.form-item {
  margin-bottom: 14px;
  display: flex;
  align-items: flex-start;
}

.form-item--block {
  align-items: flex-start;
}

.block-grow {
  flex: 1;
  min-width: 0;
}

.form-label {
  width: 118px;
  font-weight: 400;
  color: #606266;
  margin-right: 10px;
  text-align: right;
  flex-shrink: 0;
  font-size: 14px;
  padding-top: 8px;
}

.form-label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  background: #f0f2f5;
  border-radius: 50%;
  font-size: 11px;
  color: #909399;
  cursor: default;
  vertical-align: middle;
}

.form-input {
  flex: 1;
  padding: 0 12px;
  height: 36px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  box-sizing: border-box;
}

.form-textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  resize: none;
  min-height: 72px;
  box-sizing: border-box;
}

.form-select {
  flex: 1;
  width: 100% !important;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  margin-top: 4px;
  border-top: 1px solid #ebeef5;
  cursor: pointer;
  user-select: none;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.excel-section-req {
  color: #f56c6c;
  margin-right: 2px;
}

.section-toggle {
  color: #909399;
}

.section-content {
  padding-top: 6px;
  margin-bottom: 8px;
}

.field-table-wrap {
  width: 100%;
}

.field-actions {
  margin-top: 10px;
}

.dash-btn {
  width: 100%;
  padding: 10px 12px;
  border: 1px dashed #409eff;
  border-radius: 4px;
  background: #fff;
  color: #409eff;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.dash-btn:hover {
  background: #ecf5ff;
}

.checkbox-row {
  margin-left: 128px;
  align-items: center;
}

.advanced-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.advanced-label {
  color: #606266;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid #ebeef5;
}

.btn {
  padding: 0 18px;
  height: 34px;
  line-height: 34px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: #fff;
  color: #606266;
}

.preview-btn {
  background: #ecf5ff;
  color: #409eff;
  border-color: #b3d8ff;
}

.primary-btn {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.secondary-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

/* —— 添加文件或目录弹窗（scoped，对齐参考图） —— */
.excel-file-picker__label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.excel-file-picker__panes {
  display: flex;
  min-height: 228px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
  background: #fafafa;
}

.excel-file-picker__pane {
  min-width: 0;
  overflow-y: auto;
  background: #fff;
}

.excel-file-picker__pane--dirs {
  flex: 0 0 232px;
  border-right: 1px solid #f0f0f0;
}

.excel-file-picker__pane--files {
  flex: 1;
  padding: 0 12px 10px;
}

.excel-file-picker__pane-title {
  font-size: 12px;
  color: #909399;
  padding: 10px 0 6px;
}

.excel-file-picker__up {
  padding: 10px 12px;
  font-size: 13px;
  color: #409eff;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.excel-file-picker__up:hover {
  background: #ecf5ff;
}

.excel-file-picker__row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 14px;
  color: #303133;
}

.excel-file-picker__row--dir {
  gap: 8px;
  cursor: pointer;
}

.excel-file-picker__row--dir:hover {
  background: #f5f7fa;
}

.excel-file-picker__row--file {
  padding: 4px 0;
}

.excel-file-picker__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.excel-file-picker__chev {
  color: #c0c4cc;
  font-size: 12px;
}

.excel-file-picker__empty {
  padding: 28px 12px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.excel-file-picker__checks {
  display: block;
  width: 100%;
}

.excel-file-picker__checks .el-checkbox {
  display: flex;
  align-items: center;
  width: 100%;
  margin-right: 0;
  margin-bottom: 4px;
}

.excel-file-picker__toolbar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.excel-file-picker__tags-input {
  flex: 1;
  min-height: 40px;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.excel-file-picker__tags-placeholder {
  color: #c0c4cc;
  font-size: 14px;
  line-height: 28px;
}

.excel-file-picker__tag {
  margin: 0;
}

.excel-file-picker__add-btn {
  flex-shrink: 0;
  margin-top: 4px;
}

.excel-file-picker__table {
  margin-bottom: 0;
}

.excel-file-picker__add-row {
  width: 100%;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px dashed #409eff;
  border-radius: 4px;
  background: #fff;
  color: #409eff;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.excel-file-picker__add-row:hover {
  background: #ecf5ff;
}

.excel-th-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  font-size: 11px;
  color: #909399;
  background: #f0f2f5;
  border-radius: 50%;
  cursor: default;
  vertical-align: middle;
  line-height: 1;
}

.excel-dlg-btn-outline {
  align-self: flex-start;
  border-color: #dcdfe6;
  color: #606266;
  background: #fff;
}

.excel-dlg-btn-outline:hover {
  border-color: #409eff;
  color: #409eff;
}

.excel-dlg-btn-ghost {
  border-color: #b3d8ff;
  color: #409eff;
  background: #fff;
}

.excel-dlg-btn-ghost:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.excel-sheet-dlg__req {
  color: #f56c6c;
  margin-right: 2px;
}

.excel-sheet-editor__label {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
  line-height: 22px;
}

.excel-sheet-editor__table {
  margin-bottom: 0;
}

.excel-sheet-editor__num-input {
  width: 100%;
}

.excel-sheet-editor__add-row {
  margin-top: 12px;
}

.excel-sheet-editor__th-wrap {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  vertical-align: middle;
}

.excel-field-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 120px;
}

.excel-field-editor__toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
  line-height: 22px;
}

.excel-field-editor__label {
  display: inline-flex;
  align-items: center;
}

.excel-field-editor__scroll {
  width: 100%;
  overflow-x: hidden;
  border-radius: 4px;
}

.excel-field-editor__table {
  width: 100%;
}

.excel-field-editor__add-row {
  margin-top: 2px;
}

.w-100 {
  width: 100%;
}

.preview-body {
  min-height: 120px;
}
</style>

<style>
/* 弹窗整体：内边距、表头与页脚分隔（与参考图 enterprise 风格对齐） */
.excel-file-dialog .el-dialog__header,
.excel-sheet-dialog .el-dialog__header,
.excel-field-dialog .el-dialog__header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.excel-file-dialog .el-dialog__title,
.excel-sheet-dialog .el-dialog__title,
.excel-field-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.excel-file-dialog .el-dialog__body,
.excel-sheet-dialog .el-dialog__body,
.excel-field-dialog .el-dialog__body {
  padding: 20px 24px 8px;
}

.excel-file-dialog .el-dialog__footer,
.excel-sheet-dialog .el-dialog__footer,
.excel-field-dialog .el-dialog__footer {
  padding: 12px 24px 20px;
  border-top: 1px solid #f0f0f0;
}

.excel-dlg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.excel-file-dialog .excel-dlg-footer--center {
  justify-content: center;
}

.excel-file-dialog .excel-dlg-footer-cancel,
.excel-sheet-dialog .excel-dlg-footer-cancel,
.excel-field-dialog .excel-dlg-footer-cancel {
  background: #fff;
  border-color: #dcdfe6;
  color: #606266;
}

.excel-file-dialog .excel-dlg-footer-cancel:hover,
.excel-sheet-dialog .excel-dlg-footer-cancel:hover,
.excel-field-dialog .excel-dlg-footer-cancel:hover {
  border-color: #c0c4cc;
  color: #409eff;
}

/* 表格：略紧凑、圆角与边框色 */
.excel-file-dialog .excel-dlg-table,
.excel-sheet-dialog .excel-dlg-table,
.excel-field-dialog .excel-dlg-table {
  border-radius: 4px;
}

.excel-file-dialog .excel-dlg-table th,
.excel-sheet-dialog .excel-dlg-table th,
.excel-field-dialog .excel-dlg-table th {
  background: #fafafa;
  color: #606266;
  font-weight: 500;
}

.excel-dlg-link-danger {
  color: #409eff !important;
  padding: 0 !important;
}

.excel-dlg-link-danger:hover {
  color: #66b1ff !important;
}

.excel-preview-dialog .el-dialog__body {
  padding: 10px 20px 6px;
}

.excel-file-tooltip-popper {
  max-width: 320px;
}

.excel-file-tooltip__content {
  line-height: 1.55;
  font-size: 12px;
}

.excel-file-tooltip__content code {
  font-size: 11px;
  padding: 0 4px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

/* 编辑工作表：页脚三按钮整体居中 */
.excel-sheet-dialog .excel-sheet-dlg-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

/* 表头单元格默认 overflow:hidden 会裁切「?」并导致 Tooltip 无法命中 */
.excel-sheet-dialog .excel-sheet-editor__table th > .cell,
.excel-sheet-dialog .excel-sheet-editor__table th.el-table__cell > .cell {
  overflow: visible;
}

.excel-sheet-tooltip-popper {
  max-width: 340px;
}

.excel-sheet-tooltip__text {
  line-height: 1.55;
  font-size: 12px;
}

/* 编辑字段：页脚三按钮居中 */
.excel-field-dialog .excel-field-dlg-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

/* 加宽弹窗且不超出视口，减少表头横向滚动 */
.excel-field-dialog.el-dialog {
  width: min(96vw, 1360px) !important;
  max-width: calc(100vw - 24px);
}
</style>
