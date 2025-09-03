<!--
  Freistellungsauftrag管理组件
  支持免税额度分配、使用情况显示和优化建议
-->

<template>
  <div class="freistellungsauftrag-manager bg-white rounded-lg shadow-lg p-6">
    <!-- 标题和概览 -->
    <div class="manager-header mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">
            💰 Freistellungsauftrag-Verwaltung
          </h3>
          <p class="text-sm text-gray-600">
            Optimieren Sie Ihre Sparerpauschbetrag-Nutzung
          </p>
        </div>
        
        <div class="text-right">
          <div class="text-2xl font-bold text-green-600">
            {{ formatCurrency(maxAmount) }}
          </div>
          <div class="text-sm text-gray-500">
            {{ maritalStatus === 'married' ? 'Verheiratet' : 'Ledig' }}
          </div>
        </div>
      </div>

      <!-- 使用情况概览 -->
      <div class="usage-overview bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-lg font-semibold text-blue-600">
              {{ formatCurrency(usedAmount) }}
            </div>
            <div class="text-sm text-gray-600">Verwendet</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-green-600">
              {{ formatCurrency(remainingAmount) }}
            </div>
            <div class="text-sm text-gray-600">Verfügbar</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-orange-600">
              {{ Math.round(usagePercentage) }}%
            </div>
            <div class="text-sm text-gray-600">Ausschöpfung</div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="mt-4">
          <div class="flex justify-between text-sm text-gray-600 mb-2">
            <span>Freistellungsauftrag-Nutzung</span>
            <span>{{ Math.round(usagePercentage) }}% von {{ formatCurrency(maxAmount) }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div 
              class="h-3 rounded-full transition-all duration-500 ease-out"
              :class="getProgressBarColor(usagePercentage)"
              :style="{ width: `${Math.min(usagePercentage, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分配管理 -->
    <div class="allocation-section mb-8">
      <h4 class="text-md font-medium text-gray-800 mb-4 flex items-center">
        <Icon name="chart-pie" class="w-5 h-5 mr-2 text-purple-600" />
        Aufteilung nach Anlageprodukten
      </h4>

      <div class="space-y-4">
        <div 
          v-for="(allocation, index) in allocations" 
          :key="index"
          class="allocation-item bg-gray-50 rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-3">
              <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: allocation.color }"></div>
              <div>
                <div class="font-medium text-gray-900">{{ allocation.name }}</div>
                <div class="text-sm text-gray-500">{{ allocation.bank }}</div>
              </div>
            </div>
            <button
              @click="removeAllocation(index)"
              class="text-red-500 hover:text-red-700 p-1"
              title="Entfernen"
            >
              <Icon name="trash" class="w-4 h-4" />
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Zugeteilter Betrag
              </label>
              <BaseInput
                v-model="allocation.amount"
                type="currency"
                :min="0"
                :max="remainingAmount + allocation.amount"
                suffix="€"
                @input="updateAllocation(index)"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Erwartete Erträge (jährlich)
              </label>
              <BaseInput
                v-model="allocation.expectedReturn"
                type="currency"
                :min="0"
                suffix="€"
                @input="updateAllocation(index)"
              />
            </div>
          </div>

          <!-- 税收节省显示 -->
          <div class="mt-3 p-3 bg-green-50 rounded-lg">
            <div class="text-sm text-green-800">
              <strong>Steuerersparnis:</strong> 
              {{ formatCurrency(calculateTaxSavings(allocation.amount, allocation.expectedReturn)) }} pro Jahr
            </div>
          </div>
        </div>

        <!-- 添加新分配按钮 -->
        <button
          @click="addAllocation"
          class="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <Icon name="plus" class="w-5 h-5 mx-auto mb-2" />
          <div class="text-sm">Neues Anlageprodukt hinzufügen</div>
        </button>
      </div>
    </div>

    <!-- 优化建议 -->
    <div class="optimization-section mb-6">
      <h4 class="text-md font-medium text-gray-800 mb-4 flex items-center">
        <Icon name="lightbulb" class="w-5 h-5 mr-2 text-yellow-600" />
        Optimierungsvorschläge
      </h4>

      <div class="space-y-3">
        <div 
          v-for="tip in optimizationTips" 
          :key="tip.id"
          class="tip-card bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div class="flex items-start space-x-3">
            <Icon :name="tip.icon" class="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <div class="font-medium text-yellow-900 mb-1">{{ tip.title }}</div>
              <div class="text-sm text-yellow-800">{{ tip.description }}</div>
              <div v-if="tip.potentialSavings" class="text-sm font-medium text-yellow-900 mt-2">
                Potenzielle Ersparnis: {{ formatCurrency(tip.potentialSavings) }} pro Jahr
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 可视化图表 -->
    <div class="chart-section mb-6">
      <h4 class="text-md font-medium text-gray-800 mb-4 flex items-center">
        <Icon name="chart-bar" class="w-5 h-5 mr-2 text-indigo-600" />
        Visualisierung
      </h4>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 饼图：分配情况 -->
        <div class="chart-container">
          <canvas ref="allocationChartRef" class="max-h-64"></canvas>
        </div>

        <!-- 柱状图：税收节省 -->
        <div class="chart-container">
          <canvas ref="savingsChartRef" class="max-h-64"></canvas>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions flex flex-col sm:flex-row gap-3">
      <BaseButton
        variant="primary"
        @click="saveConfiguration"
        :loading="isSaving"
        class="flex-1"
      >
        Konfiguration speichern
      </BaseButton>
      <BaseButton
        variant="secondary"
        @click="exportReport"
        class="flex-1"
      >
        Bericht exportieren
      </BaseButton>
      <BaseButton
        variant="outline"
        @click="resetConfiguration"
        class="flex-1"
      >
        Zurücksetzen
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/utils/formatters'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import Icon from '@/components/ui/Icon.vue'

// 注册Chart.js组件
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

interface AllocationItem {
  id: string
  name: string
  bank: string
  amount: number
  expectedReturn: number
  color: string
}

interface OptimizationTip {
  id: string
  title: string
  description: string
  icon: string
  potentialSavings?: number
}

const props = defineProps<{
  maritalStatus?: 'single' | 'married'
  currentAllocations?: AllocationItem[]
}>()

const emit = defineEmits<{
  'configuration-saved': [allocations: AllocationItem[]]
  'allocation-changed': [allocations: AllocationItem[]]
}>()

// Store
const authStore = useAuthStore()

// 状态
const isSaving = ref(false)
const allocationChartRef = ref<HTMLCanvasElement>()
const savingsChartRef = ref<HTMLCanvasElement>()

// 分配数据
const allocations = ref<AllocationItem[]>([
  {
    id: '1',
    name: 'ETF World',
    bank: 'ING DiBa',
    amount: 500,
    expectedReturn: 400,
    color: '#3b82f6'
  },
  {
    id: '2', 
    name: 'Tagesgeld',
    bank: 'DKB',
    amount: 500,
    expectedReturn: 150,
    color: '#10b981'
  }
])

// 计算属性
const maxAmount = computed(() => 
  props.maritalStatus === 'married' ? 2000 : 1000
)

const usedAmount = computed(() => 
  allocations.value.reduce((sum, item) => sum + item.amount, 0)
)

const remainingAmount = computed(() => 
  Math.max(0, maxAmount.value - usedAmount.value)
)

const usagePercentage = computed(() => 
  maxAmount.value > 0 ? (usedAmount.value / maxAmount.value) * 100 : 0
)

const optimizationTips = computed((): OptimizationTip[] => {
  const tips: OptimizationTip[] = []

  if (remainingAmount.value > 100) {
    tips.push({
      id: 'unused-allowance',
      title: 'Ungenutzter Freibetrag',
      description: `Sie nutzen noch nicht Ihren vollen Sparerpauschbetrag. ${formatCurrency(remainingAmount.value)} bleiben ungenutzt.`,
      icon: 'exclamation-triangle',
      potentialSavings: remainingAmount.value * 0.26375 // ~26.375% Steuerersparnis
    })
  }

  if (usagePercentage.value > 90) {
    tips.push({
      id: 'well-utilized',
      title: 'Gute Ausschöpfung',
      description: 'Sie nutzen Ihren Sparerpauschbetrag sehr gut aus. Prüfen Sie regelmäßig, ob Anpassungen nötig sind.',
      icon: 'check-circle'
    })
  }

  if (allocations.value.length < 2) {
    tips.push({
      id: 'diversification',
      title: 'Diversifikation empfohlen',
      description: 'Verteilen Sie Ihren Freistellungsauftrag auf mehrere Banken für bessere Flexibilität.',
      icon: 'chart-pie'
    })
  }

  return tips
})

// 方法
function getProgressBarColor(percentage: number): string {
  if (percentage < 50) return 'bg-red-500'
  if (percentage < 80) return 'bg-yellow-500'
  return 'bg-green-500'
}

function calculateTaxSavings(amount: number, expectedReturn: number): number {
  const taxableAmount = Math.min(amount, expectedReturn)
  return taxableAmount * 0.26375 // 25% + 5.5% Soli + ~1% Kirchensteuer
}

function addAllocation(): void {
  const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16']
  const newAllocation: AllocationItem = {
    id: Date.now().toString(),
    name: 'Neues Produkt',
    bank: '',
    amount: 0,
    expectedReturn: 0,
    color: colors[allocations.value.length % colors.length]
  }
  allocations.value.push(newAllocation)
}

function removeAllocation(index: number): void {
  allocations.value.splice(index, 1)
  updateCharts()
}

function updateAllocation(index: number): void {
  // 确保总分配不超过最大额度
  const totalOthers = allocations.value
    .filter((_, i) => i !== index)
    .reduce((sum, item) => sum + item.amount, 0)
  
  const maxForThis = maxAmount.value - totalOthers
  if (allocations.value[index].amount > maxForThis) {
    allocations.value[index].amount = maxForThis
  }
  
  emit('allocation-changed', [...allocations.value])
  nextTick(() => updateCharts())
}

async function saveConfiguration(): Promise<void> {
  isSaving.value = true
  
  try {
    // 这里应该保存到用户设置
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟保存
    
    emit('configuration-saved', [...allocations.value])
    
    // TODO: 显示成功消息
  } catch (error) {
    console.error('保存配置失败:', error)
    // TODO: 显示错误消息
  } finally {
    isSaving.value = false
  }
}

function exportReport(): void {
  // TODO: 实现报告导出功能
  console.log('导出Freistellungsauftrag报告')
}

function resetConfiguration(): void {
  allocations.value = [
    {
      id: '1',
      name: 'ETF World',
      bank: 'ING DiBa', 
      amount: maxAmount.value / 2,
      expectedReturn: 0,
      color: '#3b82f6'
    }
  ]
  updateCharts()
}

function updateCharts(): void {
  nextTick(() => {
    createAllocationChart()
    createSavingsChart()
  })
}

function createAllocationChart(): void {
  if (!allocationChartRef.value) return

  const ctx = allocationChartRef.value.getContext('2d')
  if (!ctx) return

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [...allocations.value.map(a => a.name), 'Verfügbar'],
      datasets: [{
        data: [...allocations.value.map(a => a.amount), remainingAmount.value],
        backgroundColor: [...allocations.value.map(a => a.color), '#e5e7eb']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed
              return `${context.label}: ${formatCurrency(value)}`
            }
          }
        }
      }
    }
  })
}

function createSavingsChart(): void {
  if (!savingsChartRef.value) return

  const ctx = savingsChartRef.value.getContext('2d')
  if (!ctx) return

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: allocations.value.map(a => a.name),
      datasets: [{
        label: 'Steuerersparnis (€)',
        data: allocations.value.map(a => calculateTaxSavings(a.amount, a.expectedReturn)),
        backgroundColor: '#10b981'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `Ersparnis: ${formatCurrency(context.parsed.y)}`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(Number(value))
          }
        }
      }
    }
  })
}

// 监听分配变化
watch(allocations, () => {
  emit('allocation-changed', [...allocations.value])
}, { deep: true })

// 组件挂载时初始化
onMounted(() => {
  if (props.currentAllocations) {
    allocations.value = [...props.currentAllocations]
  }
  
  nextTick(() => {
    updateCharts()
  })
})
</script>

<style scoped>
.allocation-item {
  transition: all 0.2s ease;
}

.allocation-item:hover {
  @apply bg-gray-100;
}

.tip-card {
  transition: all 0.2s ease;
}

.tip-card:hover {
  @apply bg-yellow-100;
}

.chart-container {
  @apply bg-white rounded-lg p-4 border border-gray-200;
}
</style>
