<template>
  <div class="data-visualization-panel">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-6xl mx-auto">
        <!-- 页面标题 -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Data Visualization
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-300">
            Visualisieren Sie Ihre Finanzdaten mit interaktiven Diagrammen
          </p>
        </div>

        <!-- 可视化类型选择 -->
        <div class="flex flex-wrap gap-4 mb-8 justify-center">
          <button
            v-for="type in visualizationTypes"
            :key="type.id"
            @click="selectedType = type.id"
            :class="[
              'px-6 py-3 rounded-lg font-medium transition-colors',
              selectedType === type.id
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
          >
            {{ type.name }}
          </button>
        </div>

        <!-- 图表展示区域 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold">{{ getCurrentTypeName() }}</h3>
            <div class="flex space-x-2">
              <button
                @click="refreshData"
                class="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                刷新
              </button>
              <button
                @click="exportChart"
                class="px-3 py-1 text-green-600 hover:bg-green-50 rounded transition-colors"
              >
                导出
              </button>
            </div>
          </div>

          <!-- 线性图表 -->
          <div v-if="selectedType === 'line'" class="chart-container">
            <canvas ref="lineChart" class="w-full h-96"></canvas>
          </div>

          <!-- 柱状图 -->
          <div v-if="selectedType === 'bar'" class="chart-container">
            <canvas ref="barChart" class="w-full h-96"></canvas>
          </div>

          <!-- 饼图 -->
          <div v-if="selectedType === 'pie'" class="chart-container">
            <canvas ref="pieChart" class="w-full h-96"></canvas>
          </div>

          <!-- 散点图 -->
          <div v-if="selectedType === 'scatter'" class="chart-container">
            <canvas ref="scatterChart" class="w-full h-96"></canvas>
          </div>

          <!-- 热力图 -->
          <div v-if="selectedType === 'heatmap'" class="chart-container">
            <div class="grid grid-cols-12 gap-1">
              <div
                v-for="(value, index) in heatmapData"
                :key="index"
                :class="[
                  'aspect-square rounded',
                  getHeatmapColor(value)
                ]"
                :title="`值: ${value}`"
              ></div>
            </div>
          </div>

          <!-- 3D可视化 -->
          <div v-if="selectedType === '3d'" class="chart-container">
            <div ref="threeDContainer" class="w-full h-96 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl mb-4">🎯</div>
                <p class="text-gray-600 dark:text-gray-300">3D可视化组件</p>
                <p class="text-sm text-gray-500">需要Three.js支持</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据配置面板 -->
        <div class="grid md:grid-cols-2 gap-8">
          <!-- 数据源配置 -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-semibold mb-4">数据源配置</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">数据类型</label>
                <select v-model="dataConfig.type" class="w-full p-2 border rounded-lg">
                  <option value="calculation">计算结果</option>
                  <option value="historical">历史数据</option>
                  <option value="realtime">实时数据</option>
                  <option value="custom">自定义数据</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">时间范围</label>
                <select v-model="dataConfig.timeRange" class="w-full p-2 border rounded-lg">
                  <option value="1d">1天</option>
                  <option value="7d">7天</option>
                  <option value="30d">30天</option>
                  <option value="1y">1年</option>
                  <option value="all">全部</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">数据字段</label>
                <div class="space-y-2">
                  <label v-for="field in availableFields" :key="field" class="flex items-center">
                    <input
                      type="checkbox"
                      :value="field"
                      v-model="dataConfig.selectedFields"
                      class="mr-2"
                    >
                    {{ field }}
                  </label>
                </div>
              </div>

              <button
                @click="updateVisualization"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                更新可视化
              </button>
            </div>
          </div>

          <!-- 样式配置 -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-semibold mb-4">样式配置</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">颜色主题</label>
                <select v-model="styleConfig.colorTheme" class="w-full p-2 border rounded-lg">
                  <option value="default">默认</option>
                  <option value="blue">蓝色系</option>
                  <option value="green">绿色系</option>
                  <option value="purple">紫色系</option>
                  <option value="rainbow">彩虹色</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">图表标题</label>
                <input
                  type="text"
                  v-model="styleConfig.title"
                  placeholder="输入图表标题"
                  class="w-full p-2 border rounded-lg"
                >
              </div>

              <div>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="styleConfig.showLegend"
                    class="mr-2"
                  >
                  显示图例
                </label>
              </div>

              <div>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="styleConfig.showGrid"
                    class="mr-2"
                  >
                  显示网格
                </label>
              </div>

              <div>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="styleConfig.animations"
                    class="mr-2"
                  >
                  启用动画
                </label>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">透明度</label>
                <input
                  type="range"
                  v-model="styleConfig.opacity"
                  min="0.1"
                  max="1"
                  step="0.1"
                  class="w-full"
                >
                <div class="text-sm text-gray-500 text-center">{{ styleConfig.opacity }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 预设模板 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-8">
          <h3 class="text-xl font-semibold mb-4">预设模板</h3>
          
          <div class="grid md:grid-cols-3 gap-4">
            <div
              v-for="template in templates"
              :key="template.id"
              @click="applyTemplate(template)"
              class="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="text-center">
                <div class="text-2xl mb-2">{{ template.icon }}</div>
                <h4 class="font-medium">{{ template.name }}</h4>
                <p class="text-sm text-gray-500">{{ template.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

// 可视化类型
const visualizationTypes = [
  { id: 'line', name: '线性图' },
  { id: 'bar', name: '柱状图' },
  { id: 'pie', name: '饼图' },
  { id: 'scatter', name: '散点图' },
  { id: 'heatmap', name: '热力图' },
  { id: '3d', name: '3D图' }
]

const selectedType = ref('line')

// 数据配置
const dataConfig = reactive({
  type: 'calculation',
  timeRange: '30d',
  selectedFields: ['amount', 'interest']
})

// 样式配置
const styleConfig = reactive({
  colorTheme: 'default',
  title: '财务数据可视化',
  showLegend: true,
  showGrid: true,
  animations: true,
  opacity: 0.8
})

// 可用字段
const availableFields = ['amount', 'interest', 'time', 'growth', 'tax', 'net']

// 热力图数据
const heatmapData = ref(Array.from({ length: 144 }, () => Math.random()))

// 预设模板
const templates = [
  {
    id: 'financial-overview',
    name: '财务概览',
    description: '显示收入、支出和净值',
    icon: '💰'
  },
  {
    id: 'growth-analysis',
    name: '增长分析',
    description: '分析投资增长趋势',
    icon: '📈'
  },
  {
    id: 'risk-assessment',
    name: '风险评估',
    description: '可视化风险分布',
    icon: '⚠️'
  },
  {
    id: 'comparison',
    name: '对比分析',
    description: '多项目对比图表',
    icon: '⚖️'
  },
  {
    id: 'timeline',
    name: '时间线',
    description: '时间序列数据展示',
    icon: '⏰'
  },
  {
    id: 'portfolio',
    name: '投资组合',
    description: '投资组合分布图',
    icon: '🎯'
  }
]

// 图表引用
const lineChart = ref<HTMLCanvasElement>()
const barChart = ref<HTMLCanvasElement>()
const pieChart = ref<HTMLCanvasElement>()
const scatterChart = ref<HTMLCanvasElement>()
const threeDContainer = ref<HTMLDivElement>()

// 方法
const getCurrentTypeName = () => {
  const type = visualizationTypes.find(t => t.id === selectedType.value)
  return type?.name || ''
}

const getHeatmapColor = (value: number) => {
  if (value < 0.2) return 'bg-blue-100'
  if (value < 0.4) return 'bg-blue-300'
  if (value < 0.6) return 'bg-blue-500'
  if (value < 0.8) return 'bg-blue-700'
  return 'bg-blue-900'
}

const refreshData = () => {
  console.log('刷新数据')
  heatmapData.value = Array.from({ length: 144 }, () => Math.random())
}

const exportChart = () => {
  console.log('导出图表')
}

const updateVisualization = () => {
  console.log('更新可视化', dataConfig)
}

const applyTemplate = (template: any) => {
  console.log('应用模板', template)
}

// 初始化图表
const initializeCharts = () => {
  // 这里应该初始化Chart.js或其他图表库
  console.log('初始化图表')
}

onMounted(() => {
  initializeCharts()
})
</script>

<style scoped>
.data-visualization-panel {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chart-container {
  position: relative;
  height: 400px;
}
</style>
