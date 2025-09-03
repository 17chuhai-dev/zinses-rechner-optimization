<template>
  <div class="export-panel">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- 页面标题 -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Export Tools
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-300">
            Exportieren Sie Ihre Berechnungen in verschiedene Formate
          </p>
        </div>

        <!-- 导出选项卡 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div class="flex flex-wrap gap-4 mb-6">
            <button
              v-for="format in exportFormats"
              :key="format.id"
              @click="selectedFormat = format.id"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                selectedFormat === format.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
            >
              {{ format.name }}
            </button>
          </div>

          <!-- 导出内容 -->
          <div class="space-y-6">
            <!-- PDF 导出 -->
            <div v-if="selectedFormat === 'pdf'" class="export-section">
              <h3 class="text-xl font-semibold mb-4">PDF 导出</h3>
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium mb-2">模板选择</label>
                  <select v-model="pdfOptions.template" class="w-full p-2 border rounded-lg">
                    <option value="standard">标准报告</option>
                    <option value="detailed">详细分析</option>
                    <option value="summary">摘要报告</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">页面方向</label>
                  <select v-model="pdfOptions.orientation" class="w-full p-2 border rounded-lg">
                    <option value="portrait">纵向</option>
                    <option value="landscape">横向</option>
                  </select>
                </div>
              </div>
              <div class="mt-4">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="pdfOptions.includeCharts"
                    class="mr-2"
                  >
                  包含图表
                </label>
              </div>
            </div>

            <!-- Excel 导出 -->
            <div v-if="selectedFormat === 'excel'" class="export-section">
              <h3 class="text-xl font-semibold mb-4">Excel 导出</h3>
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium mb-2">工作表结构</label>
                  <select v-model="excelOptions.structure" class="w-full p-2 border rounded-lg">
                    <option value="single">单个工作表</option>
                    <option value="multiple">多个工作表</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">数据格式</label>
                  <select v-model="excelOptions.format" class="w-full p-2 border rounded-lg">
                    <option value="table">表格格式</option>
                    <option value="raw">原始数据</option>
                  </select>
                </div>
              </div>
              <div class="mt-4 space-y-2">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="excelOptions.includeFormulas"
                    class="mr-2"
                  >
                  包含公式
                </label>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="excelOptions.includeCharts"
                    class="mr-2"
                  >
                  包含图表
                </label>
              </div>
            </div>

            <!-- CSV 导出 -->
            <div v-if="selectedFormat === 'csv'" class="export-section">
              <h3 class="text-xl font-semibold mb-4">CSV 导出</h3>
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium mb-2">分隔符</label>
                  <select v-model="csvOptions.delimiter" class="w-full p-2 border rounded-lg">
                    <option value=",">逗号 (,)</option>
                    <option value=";">分号 (;)</option>
                    <option value="\t">制表符</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">编码</label>
                  <select v-model="csvOptions.encoding" class="w-full p-2 border rounded-lg">
                    <option value="utf-8">UTF-8</option>
                    <option value="utf-16">UTF-16</option>
                    <option value="iso-8859-1">ISO-8859-1</option>
                  </select>
                </div>
              </div>
              <div class="mt-4">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="csvOptions.includeHeaders"
                    class="mr-2"
                  >
                  包含列标题
                </label>
              </div>
            </div>

            <!-- JSON 导出 -->
            <div v-if="selectedFormat === 'json'" class="export-section">
              <h3 class="text-xl font-semibold mb-4">JSON 导出</h3>
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium mb-2">格式化</label>
                  <select v-model="jsonOptions.format" class="w-full p-2 border rounded-lg">
                    <option value="pretty">格式化</option>
                    <option value="minified">压缩</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">数据结构</label>
                  <select v-model="jsonOptions.structure" class="w-full p-2 border rounded-lg">
                    <option value="flat">扁平结构</option>
                    <option value="nested">嵌套结构</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- 导出按钮 -->
          <div class="mt-8 flex justify-center">
            <button
              @click="handleExport"
              :disabled="isExporting"
              class="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="isExporting">导出中...</span>
              <span v-else>导出 {{ getCurrentFormatName() }}</span>
            </button>
          </div>
        </div>

        <!-- 导出历史 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-4">导出历史</h3>
          <div v-if="exportHistory.length === 0" class="text-center py-8 text-gray-500">
            暂无导出记录
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in exportHistory"
              :key="item.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <div class="font-medium">{{ item.filename }}</div>
                <div class="text-sm text-gray-500">{{ item.date }} • {{ item.size }}</div>
              </div>
              <button
                @click="downloadFile(item)"
                class="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                下载
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 导出格式配置
const exportFormats = [
  { id: 'pdf', name: 'PDF' },
  { id: 'excel', name: 'Excel' },
  { id: 'csv', name: 'CSV' },
  { id: 'json', name: 'JSON' }
]

// 当前选择的格式
const selectedFormat = ref('pdf')

// 导出选项
const pdfOptions = ref({
  template: 'standard',
  orientation: 'portrait',
  includeCharts: true
})

const excelOptions = ref({
  structure: 'single',
  format: 'table',
  includeFormulas: true,
  includeCharts: true
})

const csvOptions = ref({
  delimiter: ',',
  encoding: 'utf-8',
  includeHeaders: true
})

const jsonOptions = ref({
  format: 'pretty',
  structure: 'nested'
})

// 导出状态
const isExporting = ref(false)

// 导出历史
const exportHistory = ref([
  {
    id: '1',
    filename: 'calculation-report-2024-01-15.pdf',
    date: '2024-01-15 14:30',
    size: '2.3 MB'
  },
  {
    id: '2',
    filename: 'data-export-2024-01-14.xlsx',
    date: '2024-01-14 09:15',
    size: '1.8 MB'
  }
])

// 获取当前格式名称
const getCurrentFormatName = () => {
  const format = exportFormats.find(f => f.id === selectedFormat.value)
  return format?.name || ''
}

// 处理导出
const handleExport = async () => {
  isExporting.value = true
  
  try {
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 添加到导出历史
    const now = new Date()
    const filename = `export-${selectedFormat.value}-${now.toISOString().split('T')[0]}.${selectedFormat.value}`
    
    exportHistory.value.unshift({
      id: Date.now().toString(),
      filename,
      date: now.toLocaleString('de-DE'),
      size: '1.2 MB'
    })
    
    // 这里应该调用实际的导出服务
    console.log('导出完成:', selectedFormat.value)
    
  } catch (error) {
    console.error('导出失败:', error)
  } finally {
    isExporting.value = false
  }
}

// 下载文件
const downloadFile = (item: any) => {
  // 这里应该实现实际的文件下载逻辑
  console.log('下载文件:', item.filename)
}
</script>

<style scoped>
.export-panel {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.export-section {
  @apply border-t pt-6;
}

.export-section:first-child {
  @apply border-t-0 pt-0;
}
</style>
