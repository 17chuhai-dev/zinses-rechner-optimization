<template>
  <div class="history-item">
    <BaseCard :hover="true" padding="md" class="transition-all duration-200">
      <div class="flex items-start justify-between">
        <!-- 主要信息 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-3 mb-2">
            <!-- 计算器图标 -->
            <div class="flex-shrink-0">
              <BaseIcon 
                :name="getCalculatorIcon(calculation.calculatorId)" 
                class="text-blue-600" 
                size="lg"
              />
            </div>
            
            <!-- 标题和时间 -->
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 truncate">
                {{ calculation.calculatorName }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ formatDate(calculation.timestamp) }}
              </p>
            </div>
            
            <!-- 收藏状态 -->
            <div class="flex-shrink-0">
              <BaseButton
                variant="ghost"
                size="sm"
                @click="$emit('favorite', calculation)"
              >
                <BaseIcon 
                  name="star" 
                  :class="calculation.isFavorite ? 'text-yellow-500' : 'text-gray-400'"
                  size="sm"
                />
              </BaseButton>
            </div>
          </div>
          
          <!-- 关键结果摘要 -->
          <div class="mb-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div 
                v-for="(value, key) in getKeyResults()"
                :key="key"
                class="bg-gray-50 px-3 py-2 rounded-md"
              >
                <div class="text-xs text-gray-500 uppercase tracking-wide">
                  {{ getResultLabel(key) }}
                </div>
                <div class="text-sm font-semibold text-gray-900">
                  {{ formatValue(value, key) }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- 标签 -->
          <div v-if="calculation.tags.length > 0" class="mb-3">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="tag in calculation.tags"
                :key="tag"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          
          <!-- 备注 -->
          <div v-if="calculation.notes" class="mb-3">
            <p class="text-sm text-gray-600 italic">
              "{{ calculation.notes }}"
            </p>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="flex-shrink-0 ml-4">
          <div class="flex items-center space-x-2">
            <!-- 查看详情 -->
            <BaseButton
              variant="secondary"
              size="sm"
              @click="$emit('view', calculation)"
            >
              <BaseIcon name="eye" size="sm" class="mr-1" />
              Anzeigen
            </BaseButton>
            
            <!-- 添加到比较 -->
            <BaseButton
              variant="secondary"
              size="sm"
              @click="$emit('compare', calculation)"
            >
              <BaseIcon name="scale" size="sm" class="mr-1" />
              Vergleichen
            </BaseButton>
            
            <!-- 更多操作 -->
            <div class="relative" ref="dropdownRef">
              <BaseButton
                variant="ghost"
                size="sm"
                @click="toggleDropdown"
              >
                <BaseIcon name="dots-vertical" size="sm" />
              </BaseButton>
              
              <!-- 下拉菜单 -->
              <div
                v-if="showDropdown"
                class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
              >
                <div class="py-1">
                  <button
                    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="duplicateCalculation"
                  >
                    <BaseIcon name="duplicate" size="sm" class="mr-2" />
                    Duplizieren
                  </button>
                  
                  <button
                    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="exportCalculation"
                  >
                    <BaseIcon name="download" size="sm" class="mr-2" />
                    Exportieren
                  </button>
                  
                  <button
                    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="editNotes"
                  >
                    <BaseIcon name="pencil" size="sm" class="mr-2" />
                    Notiz bearbeiten
                  </button>
                  
                  <div class="border-t border-gray-100 my-1"></div>
                  
                  <button
                    class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    @click="confirmDelete"
                  >
                    <BaseIcon name="trash" size="sm" class="mr-2" />
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
    
    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg max-w-md mx-4">
        <div class="flex items-center space-x-3 mb-4">
          <BaseIcon name="exclamation-triangle" class="text-red-600" size="lg" />
          <h3 class="text-lg font-semibold text-gray-900">Berechnung löschen?</h3>
        </div>
        
        <p class="text-gray-600 mb-6">
          Sind Sie sicher, dass Sie diese Berechnung löschen möchten? 
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        
        <div class="flex space-x-3">
          <BaseButton
            variant="danger"
            @click="deleteCalculation"
            class="flex-1"
          >
            Ja, löschen
          </BaseButton>
          <BaseButton
            variant="secondary"
            @click="showDeleteConfirm = false"
            class="flex-1"
          >
            Abbrechen
          </BaseButton>
        </div>
      </div>
    </div>
    
    <!-- 备注编辑对话框 -->
    <div v-if="showNotesEditor" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg max-w-md mx-4 w-full">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Notiz bearbeiten</h3>
        
        <BaseInput
          v-model="editedNotes"
          type="textarea"
          placeholder="Fügen Sie eine Notiz hinzu..."
          :rows="4"
          class="mb-4"
        />
        
        <div class="flex space-x-3">
          <BaseButton
            variant="primary"
            @click="saveNotes"
            class="flex-1"
          >
            Speichern
          </BaseButton>
          <BaseButton
            variant="secondary"
            @click="cancelEditNotes"
            class="flex-1"
          >
            Abbrechen
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { CalculationHistory } from '@/services/LocalStorageService'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseInput from '../ui/BaseInput.vue'

interface Props {
  calculation: CalculationHistory
}

interface Emits {
  (e: 'favorite', calculation: CalculationHistory): void
  (e: 'delete', calculation: CalculationHistory): void
  (e: 'view', calculation: CalculationHistory): void
  (e: 'compare', calculation: CalculationHistory): void
  (e: 'duplicate', calculation: CalculationHistory): void
  (e: 'export', calculation: CalculationHistory): void
  (e: 'update-notes', calculation: CalculationHistory, notes: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态管理
const showDropdown = ref(false)
const showDeleteConfirm = ref(false)
const showNotesEditor = ref(false)
const editedNotes = ref('')
const dropdownRef = ref<HTMLElement>()

// 方法
const getCalculatorIcon = (calculatorId: string): string => {
  const icons: Record<string, string> = {
    'compound-interest': 'chart-line',
    'loan': 'credit-card',
    'mortgage': 'home',
    'retirement': 'user-group',
    'investment': 'trending-up',
    'tax': 'document-text'
  }
  return icons[calculatorId] || 'calculator'
}

const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getKeyResults = (): Record<string, any> => {
  const results = props.calculation.results
  const keyResults: Record<string, any> = {}
  
  // 根据计算器类型提取关键结果
  switch (props.calculation.calculatorId) {
    case 'compound-interest':
      if (results.finalAmount) keyResults.finalAmount = results.finalAmount
      if (results.totalInterest) keyResults.totalInterest = results.totalInterest
      if (results.annualReturn) keyResults.annualReturn = results.annualReturn
      break
      
    case 'loan':
      if (results.monthlyPayment) keyResults.monthlyPayment = results.monthlyPayment
      if (results.totalInterest) keyResults.totalInterest = results.totalInterest
      if (results.totalPayment) keyResults.totalPayment = results.totalPayment
      break
      
    case 'mortgage':
      if (results.monthlyPayment) keyResults.monthlyPayment = results.monthlyPayment
      if (results.totalCosts) keyResults.totalCosts = results.totalCosts
      if (results.affordabilityRatio) keyResults.affordabilityRatio = results.affordabilityRatio
      break
  }
  
  return keyResults
}

const getResultLabel = (key: string): string => {
  const labels: Record<string, string> = {
    finalAmount: 'Endbetrag',
    totalInterest: 'Zinsen',
    annualReturn: 'Rendite',
    monthlyPayment: 'Monatsrate',
    totalPayment: 'Gesamtzahlung',
    totalCosts: 'Gesamtkosten',
    affordabilityRatio: 'Belastungsquote'
  }
  return labels[key] || key
}

const formatValue = (value: any, key: string): string => {
  if (typeof value === 'number') {
    if (key.includes('Ratio') || key.includes('Return')) {
      return `${(value * 100).toFixed(1)}%`
    }
    return `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return String(value)
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

const duplicateCalculation = () => {
  emit('duplicate', props.calculation)
  showDropdown.value = false
}

const exportCalculation = () => {
  emit('export', props.calculation)
  showDropdown.value = false
}

const editNotes = () => {
  editedNotes.value = props.calculation.notes || ''
  showNotesEditor.value = true
  showDropdown.value = false
}

const saveNotes = () => {
  emit('update-notes', props.calculation, editedNotes.value)
  showNotesEditor.value = false
}

const cancelEditNotes = () => {
  editedNotes.value = ''
  showNotesEditor.value = false
}

const confirmDelete = () => {
  showDeleteConfirm.value = true
  showDropdown.value = false
}

const deleteCalculation = () => {
  emit('delete', props.calculation)
  showDeleteConfirm.value = false
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.history-item {
  @apply w-full;
}

/* 下拉菜单动画 */
.history-item .absolute {
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
