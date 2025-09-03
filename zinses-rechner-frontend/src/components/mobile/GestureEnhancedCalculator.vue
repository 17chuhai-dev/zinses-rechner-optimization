<!--
  手势增强计算器组件
  为移动端计算器添加手势支持，包括滑动、缩放、长按等交互
-->

<template>
  <div 
    ref="calculatorContainer"
    :class="containerClasses"
    :aria-label="ariaLabel"
  >
    <!-- 手势提示 -->
    <div v-if="showGestureHints" class="gesture-hints mb-4">
      <div class="hints-header flex items-center justify-between">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t('gestures.hints') }}
        </h4>
        <button
          @click="showGestureHints = false"
          class="close-hints-button"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
      
      <div class="hints-list grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
        <div
          v-for="hint in gestureHints"
          :key="hint.gesture"
          class="hint-item"
        >
          <component :is="hint.icon" class="w-4 h-4 text-blue-500" />
          <span class="hint-text">{{ hint.text }}</span>
        </div>
      </div>
    </div>

    <!-- 计算器主体 -->
    <div class="calculator-main">
      <!-- 输入区域 -->
      <div 
        ref="inputSection"
        class="input-section"
        :class="{ 'expanded': isInputExpanded }"
      >
        <div class="input-header flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('calculator.parameters') }}
          </h3>
          
          <div class="input-actions flex items-center space-x-2">
            <button
              @click="resetInputs"
              class="reset-button"
              :disabled="!hasInputValues"
            >
              <ArrowPathIcon class="w-4 h-4" />
            </button>
            
            <button
              @click="toggleInputExpansion"
              class="expand-button"
            >
              <component :is="isInputExpanded ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 输入字段 -->
        <div class="input-fields space-y-4">
          <div
            v-for="field in inputFields"
            :key="field.key"
            ref="inputFieldRefs"
            class="input-field-container"
            :data-field="field.key"
          >
            <label class="input-label">
              {{ field.label }}
            </label>
            
            <div class="input-wrapper">
              <input
                v-model="inputValues[field.key]"
                :type="field.type"
                :step="field.step"
                :min="field.min"
                :max="field.max"
                class="input-field"
                :placeholder="field.placeholder"
                @input="handleInputChange(field.key, $event)"
                @focus="handleInputFocus(field.key)"
                @blur="handleInputBlur(field.key)"
              />
              
              <div v-if="field.unit" class="input-unit">
                {{ field.unit }}
              </div>
            </div>
            
            <!-- 手势滑块 -->
            <div 
              v-if="field.showSlider"
              ref="sliderRefs"
              class="gesture-slider mt-2"
              :data-field="field.key"
            >
              <div class="slider-track">
                <div 
                  class="slider-fill"
                  :style="{ width: `${getSliderPercentage(field.key)}%` }"
                ></div>
                <div 
                  class="slider-thumb"
                  :style="{ left: `${getSliderPercentage(field.key)}%` }"
                ></div>
              </div>
              
              <div class="slider-labels flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                <span>{{ field.min }}</span>
                <span>{{ field.max }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 计算按钮 -->
      <div class="calculate-section my-6">
        <button
          ref="calculateButton"
          @click="performCalculation"
          :disabled="!isCalculationReady"
          class="calculate-button"
        >
          <CalculatorIcon class="w-5 h-5 mr-2" />
          {{ t('calculator.calculate') }}
        </button>
      </div>

      <!-- 结果区域 -->
      <div 
        v-if="calculationResult"
        ref="resultSection"
        class="result-section"
        :class="{ 'expanded': isResultExpanded }"
      >
        <div class="result-header flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('calculator.results') }}
          </h3>
          
          <div class="result-actions flex items-center space-x-2">
            <button
              @click="shareResult"
              class="share-button"
            >
              <ShareIcon class="w-4 h-4" />
            </button>
            
            <button
              @click="toggleResultExpansion"
              class="expand-button"
            >
              <component :is="isResultExpanded ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 结果内容 -->
        <div class="result-content">
          <div class="result-summary bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
            <div class="summary-item">
              <span class="summary-label">{{ t('calculator.totalInterest') }}</span>
              <span class="summary-value">{{ formatCurrency(calculationResult.totalInterest) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">{{ t('calculator.finalAmount') }}</span>
              <span class="summary-value">{{ formatCurrency(calculationResult.finalAmount) }}</span>
            </div>
          </div>

          <!-- 详细结果 -->
          <div v-if="isResultExpanded" class="result-details">
            <div class="details-grid grid grid-cols-2 gap-4">
              <div
                v-for="detail in calculationResult.details"
                :key="detail.key"
                class="detail-item"
              >
                <div class="detail-label">{{ detail.label }}</div>
                <div class="detail-value">{{ detail.value }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 手势反馈 -->
    <div 
      v-if="gesturefeedback.show"
      class="gesture-feedback"
      :class="gesturefeedback.type"
    >
      <component :is="gestureIcons[gesturefeedback.type]" class="w-6 h-6" />
      <span class="feedback-text">{{ gesturefeedback.message }}</span>
    </div>

    <!-- 触觉反馈指示器 -->
    <div 
      v-if="hapticFeedback.show"
      class="haptic-indicator"
      :class="hapticFeedback.intensity"
    >
      <div class="haptic-pulse"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import {
  XMarkIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalculatorIcon,
  ShareIcon,
  HandRaisedIcon,
  ArrowsPointingOutIcon,
  CursorArrowRaysIcon,
  ArrowLongRightIcon,
  MagnifyingGlassPlusIcon
} from '@heroicons/vue/24/outline'
import { useGestures } from '@/services/GestureManager'
import { useI18n } from '@/services/I18nService'
import type { GestureEvent, GestureType } from '@/services/GestureManager'

// Props
interface Props {
  initialValues?: Record<string, number>
  showHints?: boolean
  enableHapticFeedback?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHints: true,
  enableHapticFeedback: true
})

// 使用服务
const { addGestureListener, removeGestureListener, isSupported } = useGestures()
const { t } = useI18n()

// 模板引用
const calculatorContainer = ref<HTMLElement>()
const inputSection = ref<HTMLElement>()
const resultSection = ref<HTMLElement>()
const calculateButton = ref<HTMLElement>()
const inputFieldRefs = ref<HTMLElement[]>([])
const sliderRefs = ref<HTMLElement[]>([])

// 响应式状态
const showGestureHints = ref(props.showHints && isSupported.value)
const isInputExpanded = ref(true)
const isResultExpanded = ref(false)
const currentFocusedField = ref<string | null>(null)

// 输入值
const inputValues = reactive({
  principal: 10000,
  interestRate: 5,
  years: 10,
  compoundFrequency: 12
})

// 计算结果
const calculationResult = ref<any>(null)

// 手势反馈
const gesturefeedback = reactive({
  show: false,
  type: 'tap' as GestureType,
  message: ''
})

// 触觉反馈
const hapticFeedback = reactive({
  show: false,
  intensity: 'light' as 'light' | 'medium' | 'heavy'
})

// 输入字段配置
const inputFields = [
  {
    key: 'principal',
    label: t('calculator.principal'),
    type: 'number',
    step: 100,
    min: 100,
    max: 1000000,
    unit: '€',
    placeholder: '10.000',
    showSlider: true
  },
  {
    key: 'interestRate',
    label: t('calculator.interestRate'),
    type: 'number',
    step: 0.1,
    min: 0.1,
    max: 20,
    unit: '%',
    placeholder: '5.0',
    showSlider: true
  },
  {
    key: 'years',
    label: t('calculator.years'),
    type: 'number',
    step: 1,
    min: 1,
    max: 50,
    unit: t('calculator.yearsUnit'),
    placeholder: '10',
    showSlider: true
  },
  {
    key: 'compoundFrequency',
    label: t('calculator.compoundFrequency'),
    type: 'number',
    step: 1,
    min: 1,
    max: 365,
    unit: t('calculator.timesPerYear'),
    placeholder: '12',
    showSlider: false
  }
]

// 手势提示
const gestureHints = [
  {
    gesture: 'swipe',
    icon: ArrowLongRightIcon,
    text: t('gestures.swipeToNavigate')
  },
  {
    gesture: 'pinch',
    icon: MagnifyingGlassPlusIcon,
    text: t('gestures.pinchToZoom')
  },
  {
    gesture: 'long-press',
    icon: HandRaisedIcon,
    text: t('gestures.longPressForOptions')
  },
  {
    gesture: 'double-tap',
    icon: CursorArrowRaysIcon,
    text: t('gestures.doubleTapToExpand')
  }
]

// 手势图标
const gestureIcons = {
  tap: CursorArrowRaysIcon,
  'double-tap': CursorArrowRaysIcon,
  'long-press': HandRaisedIcon,
  swipe: ArrowLongRightIcon,
  pinch: ArrowsPointingOutIcon,
  pan: HandRaisedIcon,
  rotate: ArrowsPointingOutIcon
}

// 计算属性
const containerClasses = computed(() => [
  'gesture-enhanced-calculator',
  'bg-white',
  'dark:bg-gray-900',
  'rounded-lg',
  'p-6',
  'relative',
  'overflow-hidden',
  {
    'touch-enabled': isSupported.value,
    'gesture-active': gesturefeedback.show
  }
])

const ariaLabel = computed(() => {
  return `${t('calculator.title')}: ${isSupported.value ? t('gestures.touchEnabled') : t('gestures.touchDisabled')}`
})

const hasInputValues = computed(() => {
  return Object.values(inputValues).some(value => value > 0)
})

const isCalculationReady = computed(() => {
  return inputValues.principal > 0 && 
         inputValues.interestRate > 0 && 
         inputValues.years > 0 && 
         inputValues.compoundFrequency > 0
})

// 方法
const getSliderPercentage = (fieldKey: string): number => {
  const field = inputFields.find(f => f.key === fieldKey)
  if (!field) return 0

  const value = inputValues[fieldKey as keyof typeof inputValues]
  const range = field.max - field.min
  return ((value - field.min) / range) * 100
}

const handleInputChange = (fieldKey: string, event: Event): void => {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value) || 0
  
  inputValues[fieldKey as keyof typeof inputValues] = value
  
  // 触发触觉反馈
  if (props.enableHapticFeedback) {
    triggerHapticFeedback('light')
  }
}

const handleInputFocus = (fieldKey: string): void => {
  currentFocusedField.value = fieldKey
}

const handleInputBlur = (fieldKey: string): void => {
  if (currentFocusedField.value === fieldKey) {
    currentFocusedField.value = null
  }
}

const resetInputs = (): void => {
  Object.assign(inputValues, {
    principal: 10000,
    interestRate: 5,
    years: 10,
    compoundFrequency: 12
  })
  
  showGestureFeedback('tap', t('gestures.inputsReset'))
}

const toggleInputExpansion = (): void => {
  isInputExpanded.value = !isInputExpanded.value
  showGestureFeedback('tap', isInputExpanded.value ? t('gestures.expanded') : t('gestures.collapsed'))
}

const toggleResultExpansion = (): void => {
  isResultExpanded.value = !isResultExpanded.value
  showGestureFeedback('tap', isResultExpanded.value ? t('gestures.expanded') : t('gestures.collapsed'))
}

const performCalculation = (): void => {
  // 模拟计算
  const principal = inputValues.principal
  const rate = inputValues.interestRate / 100
  const time = inputValues.years
  const frequency = inputValues.compoundFrequency

  const finalAmount = principal * Math.pow(1 + rate / frequency, frequency * time)
  const totalInterest = finalAmount - principal

  calculationResult.value = {
    totalInterest,
    finalAmount,
    details: [
      { key: 'principal', label: t('calculator.principal'), value: formatCurrency(principal) },
      { key: 'rate', label: t('calculator.interestRate'), value: `${inputValues.interestRate}%` },
      { key: 'time', label: t('calculator.years'), value: `${time} ${t('calculator.yearsUnit')}` },
      { key: 'frequency', label: t('calculator.compoundFrequency'), value: `${frequency}x` },
      { key: 'effectiveRate', label: t('calculator.effectiveRate'), value: `${(Math.pow(1 + rate / frequency, frequency) - 1) * 100}%` }
    ]
  }

  showGestureFeedback('tap', t('gestures.calculationComplete'))
  
  if (props.enableHapticFeedback) {
    triggerHapticFeedback('medium')
  }
}

const shareResult = (): void => {
  if (navigator.share && calculationResult.value) {
    navigator.share({
      title: t('calculator.title'),
      text: `${t('calculator.totalInterest')}: ${formatCurrency(calculationResult.value.totalInterest)}`,
      url: window.location.href
    })
  }
  
  showGestureFeedback('tap', t('gestures.resultShared'))
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const showGestureFeedback = (type: GestureType, message: string): void => {
  gestureCallback.show = true
  gestureCallback.type = type
  gestureCallback.message = message

  setTimeout(() => {
    gestureCallback.show = false
  }, 2000)
}

const triggerHapticFeedback = (intensity: 'light' | 'medium' | 'heavy'): void => {
  if (!props.enableHapticFeedback) return

  // 使用Vibration API（如果支持）
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50]
    }
    navigator.vibrate(patterns[intensity])
  }

  // 显示视觉反馈
  hapticFeedback.show = true
  hapticFeedback.intensity = intensity

  setTimeout(() => {
    hapticFeedback.show = false
  }, 300)
}

// 手势处理器
const handleGesture = (event: GestureEvent): void => {
  const { type, target, deltaX, deltaY, scale, direction } = event

  switch (type) {
    case 'swipe':
      handleSwipeGesture(direction!, target)
      break
    
    case 'pinch':
      handlePinchGesture(scale, target)
      break
    
    case 'long-press':
      handleLongPressGesture(target)
      break
    
    case 'double-tap':
      handleDoubleTapGesture(target)
      break
    
    case 'pan':
      handlePanGesture(deltaX, deltaY, target)
      break
  }
}

const handleSwipeGesture = (direction: string, target: HTMLElement): void => {
  if (direction === 'up' && !isInputExpanded.value) {
    toggleInputExpansion()
  } else if (direction === 'down' && isInputExpanded.value) {
    toggleInputExpansion()
  } else if (direction === 'left' || direction === 'right') {
    // 切换到下一个/上一个输入字段
    const currentIndex = inputFields.findIndex(f => f.key === currentFocusedField.value)
    if (currentIndex !== -1) {
      const nextIndex = direction === 'right' 
        ? (currentIndex + 1) % inputFields.length
        : (currentIndex - 1 + inputFields.length) % inputFields.length
      
      const nextField = inputFieldRefs.value.find(el => 
        el.dataset.field === inputFields[nextIndex].key
      )
      
      if (nextField) {
        const input = nextField.querySelector('input')
        input?.focus()
      }
    }
  }
  
  showGestureFeedback('swipe', t(`gestures.swipe${direction.charAt(0).toUpperCase() + direction.slice(1)}`))
}

const handlePinchGesture = (scale: number, target: HTMLElement): void => {
  // 缩放字体大小或调整输入值
  if (target.closest('.input-field-container')) {
    const fieldElement = target.closest('.input-field-container') as HTMLElement
    const fieldKey = fieldElement.dataset.field
    
    if (fieldKey && currentFocusedField.value === fieldKey) {
      const field = inputFields.find(f => f.key === fieldKey)
      if (field) {
        const currentValue = inputValues[fieldKey as keyof typeof inputValues]
        const scaleFactor = (scale - 1) * 0.1 + 1
        const newValue = Math.max(field.min, Math.min(field.max, currentValue * scaleFactor))
        
        inputValues[fieldKey as keyof typeof inputValues] = Math.round(newValue * 100) / 100
        showGestureFeedback('pinch', t('gestures.valueAdjusted'))
      }
    }
  }
}

const handleLongPressGesture = (target: HTMLElement): void => {
  if (target.closest('.input-field-container')) {
    // 显示输入字段选项
    showGestureFeedback('long-press', t('gestures.fieldOptions'))
  } else if (target.closest('.calculate-button')) {
    // 显示计算选项
    showGestureFeedback('long-press', t('gestures.calculationOptions'))
  }
}

const handleDoubleTapGesture = (target: HTMLElement): void => {
  if (target.closest('.input-section')) {
    toggleInputExpansion()
  } else if (target.closest('.result-section')) {
    toggleResultExpansion()
  } else if (target.closest('.calculate-button')) {
    performCalculation()
  }
  
  showGestureFeedback('double-tap', t('gestures.doubleTapAction'))
}

const handlePanGesture = (deltaX: number, deltaY: number, target: HTMLElement): void => {
  // 处理滑块拖拽
  const sliderElement = target.closest('.gesture-slider') as HTMLElement
  if (sliderElement) {
    const fieldKey = sliderElement.dataset.field
    const field = inputFields.find(f => f.key === fieldKey)
    
    if (field) {
      const rect = sliderElement.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(1, deltaX / rect.width))
      const newValue = field.min + (field.max - field.min) * percentage
      
      inputValues[fieldKey as keyof typeof inputValues] = Math.round(newValue * 100) / 100
      showGestureFeedback('pan', t('gestures.sliderAdjusted'))
    }
  }
}

// 生命周期
onMounted(async () => {
  await nextTick()
  
  if (isSupported.value && calculatorContainer.value) {
    // 添加手势监听器
    addGestureListener(
      calculatorContainer.value,
      ['swipe', 'pinch', 'long-press', 'double-tap', 'pan'],
      handleGesture,
      {
        swipeThreshold: 30,
        longPressTimeout: 600,
        pinchThreshold: 0.1
      }
    )
  }
})

onUnmounted(() => {
  if (calculatorContainer.value) {
    removeGestureListener(calculatorContainer.value)
  }
})
</script>

<style scoped>
.gesture-enhanced-calculator {
  @apply transition-all duration-300;
}

.gesture-enhanced-calculator.touch-enabled {
  @apply border-2 border-blue-200 dark:border-blue-800;
}

.gesture-enhanced-calculator.gesture-active {
  @apply shadow-lg transform scale-[1.02];
}

.gesture-hints {
  @apply bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800;
}

.close-hints-button {
  @apply p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded;
}

.hint-item {
  @apply flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400;
}

.input-section {
  @apply transition-all duration-300 overflow-hidden;
}

.input-section:not(.expanded) {
  @apply max-h-20;
}

.input-section.expanded {
  @apply max-h-none;
}

.input-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.input-wrapper {
  @apply relative;
}

.input-field {
  @apply w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200;
}

.input-unit {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-500;
}

.gesture-slider {
  @apply relative cursor-pointer;
}

.slider-track {
  @apply relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full;
}

.slider-fill {
  @apply h-full bg-blue-500 rounded-full transition-all duration-200;
}

.slider-thumb {
  @apply absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md transition-all duration-200;
}

.calculate-button {
  @apply w-full flex items-center justify-center px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95;
}

.result-section {
  @apply transition-all duration-300 overflow-hidden;
}

.result-section:not(.expanded) .result-details {
  @apply hidden;
}

.result-summary {
  @apply space-y-2;
}

.summary-item {
  @apply flex items-center justify-between;
}

.summary-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.summary-value {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.detail-item {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-3;
}

.detail-label {
  @apply text-xs text-gray-500 dark:text-gray-500 mb-1;
}

.detail-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.gesture-feedback {
  @apply fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full shadow-lg z-50 transition-all duration-300;
}

.gesture-feedback.tap {
  @apply bg-blue-600;
}

.gesture-feedback.swipe {
  @apply bg-green-600;
}

.gesture-feedback.pinch {
  @apply bg-purple-600;
}

.gesture-feedback.long-press {
  @apply bg-orange-600;
}

.haptic-indicator {
  @apply fixed top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-50;
}

.haptic-indicator.light {
  @apply bg-blue-200 dark:bg-blue-800;
}

.haptic-indicator.medium {
  @apply bg-yellow-200 dark:bg-yellow-800;
}

.haptic-indicator.heavy {
  @apply bg-red-200 dark:bg-red-800;
}

.haptic-pulse {
  @apply w-4 h-4 bg-current rounded-full animate-pulse;
}

.reset-button,
.expand-button,
.share-button {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors duration-200;
}

/* 触摸优化 */
@media (hover: none) and (pointer: coarse) {
  .input-field {
    @apply text-base; /* 防止iOS缩放 */
  }
  
  .calculate-button {
    @apply min-h-[44px]; /* iOS推荐的最小触摸目标 */
  }
  
  .gesture-slider {
    @apply min-h-[44px] flex items-center;
  }
}

/* 动画 */
@keyframes gestureRipple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.gesture-enhanced-calculator.gesture-active::before {
  content: '';
  @apply absolute inset-0 bg-blue-500 rounded-lg pointer-events-none;
  animation: gestureRipple 0.6s ease-out;
  opacity: 0.1;
}

/* 高对比度模式支持 */
:global(.high-contrast) .gesture-enhanced-calculator {
  @apply border-4 border-current;
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .gesture-enhanced-calculator,
  .input-section,
  .result-section,
  .slider-fill,
  .slider-thumb,
  .calculate-button {
    @apply transition-none;
  }
}
</style>
