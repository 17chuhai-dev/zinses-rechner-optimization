<!--
  添加预加载规则模态框组件
  提供创建新预加载规则的界面
-->

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框标题 -->
      <div class="modal-header">
        <h3 class="modal-title">
          {{ t('cache.addPreloadRule') }}
        </h3>
        <button
          @click="$emit('close')"
          class="close-button"
          :aria-label="t('common.close')"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="modal-content">
        <form @submit.prevent="submitRule">
          <!-- 规则名称 -->
          <div class="field-section mb-6">
            <label class="field-label" for="ruleName">
              {{ t('cache.ruleName') }}
            </label>
            <input
              id="ruleName"
              v-model="ruleName"
              type="text"
              class="field-input"
              :placeholder="t('cache.ruleNamePlaceholder')"
              maxlength="50"
              required
            />
            <div class="character-count">
              {{ ruleName.length }}/50
            </div>
          </div>

          <!-- 匹配模式 -->
          <div class="field-section mb-6">
            <label class="field-label" for="pattern">
              {{ t('cache.matchPattern') }}
            </label>
            <div class="pattern-input-group">
              <select v-model="patternType" class="pattern-type-select">
                <option value="string">{{ t('cache.stringPattern') }}</option>
                <option value="regex">{{ t('cache.regexPattern') }}</option>
              </select>
              <input
                id="pattern"
                v-model="pattern"
                type="text"
                class="pattern-input"
                :placeholder="getPatternPlaceholder()"
                required
              />
            </div>
            <p class="field-description">
              {{ getPatternDescription() }}
            </p>
          </div>

          <!-- 优先级 -->
          <div class="field-section mb-6">
            <label class="field-label">
              {{ t('cache.priority') }}: {{ priority }}
            </label>
            <input
              v-model.number="priority"
              type="range"
              min="1"
              max="10"
              class="priority-slider"
            />
            <div class="priority-labels flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
              <span>{{ t('cache.lowPriority') }}</span>
              <span>{{ t('cache.mediumPriority') }}</span>
              <span>{{ t('cache.highPriority') }}</span>
            </div>
            <p class="field-description">
              {{ getPriorityDescription(priority) }}
            </p>
          </div>

          <!-- 触发条件 -->
          <div class="field-section mb-6">
            <label class="field-label">
              {{ t('cache.triggerCondition') }}
            </label>
            <div class="condition-options space-y-3">
              <label
                v-for="condition in conditionOptions"
                :key="condition.value"
                class="condition-option-label"
              >
                <input
                  v-model="selectedConditions"
                  type="checkbox"
                  :value="condition.value"
                  class="condition-checkbox"
                />
                <div class="condition-content">
                  <span class="condition-title">{{ condition.title }}</span>
                  <span class="condition-description">{{ condition.description }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- 依赖项 -->
          <div class="field-section mb-6">
            <label class="field-label" for="dependencies">
              {{ t('cache.dependencies') }}
              <span class="optional-label">({{ t('common.optional') }})</span>
            </label>
            <div class="dependencies-input-group">
              <input
                v-model="newDependency"
                type="text"
                class="dependency-input"
                :placeholder="t('cache.dependencyPlaceholder')"
                @keydown.enter.prevent="addDependency"
              />
              <button
                type="button"
                @click="addDependency"
                :disabled="!newDependency.trim()"
                class="add-dependency-button"
              >
                <PlusIcon class="w-4 h-4" />
              </button>
            </div>
            
            <!-- 依赖项列表 -->
            <div v-if="dependencies.length > 0" class="dependencies-list mt-3">
              <div
                v-for="(dep, index) in dependencies"
                :key="index"
                class="dependency-item"
              >
                <span class="dependency-text">{{ dep }}</span>
                <button
                  type="button"
                  @click="removeDependency(index)"
                  class="remove-dependency-button"
                >
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </div>
            </div>
            
            <p class="field-description">
              {{ t('cache.dependenciesDescription') }}
            </p>
          </div>

          <!-- 加载器类型 -->
          <div class="field-section mb-6">
            <label class="field-label">
              {{ t('cache.loaderType') }}
            </label>
            <div class="loader-options grid grid-cols-1 md:grid-cols-2 gap-3">
              <label
                v-for="loader in loaderOptions"
                :key="loader.value"
                class="loader-option-label"
                :class="{ 'selected': loaderType === loader.value }"
              >
                <input
                  v-model="loaderType"
                  type="radio"
                  :value="loader.value"
                  class="loader-option-radio"
                />
                <div class="loader-option-content">
                  <component :is="loader.icon" class="w-5 h-5 text-blue-500" />
                  <div class="loader-option-text">
                    <div class="loader-option-title">{{ loader.title }}</div>
                    <div class="loader-option-description">{{ loader.description }}</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- 自定义加载器代码 -->
          <div v-if="loaderType === 'custom'" class="field-section mb-6">
            <label class="field-label" for="loaderCode">
              {{ t('cache.customLoaderCode') }}
            </label>
            <textarea
              id="loaderCode"
              v-model="loaderCode"
              class="loader-code-textarea"
              :placeholder="t('cache.loaderCodePlaceholder')"
              rows="6"
              maxlength="1000"
            ></textarea>
            <div class="character-count">
              {{ loaderCode.length }}/1000
            </div>
            <p class="field-description">
              {{ t('cache.loaderCodeDescription') }}
            </p>
          </div>

          <!-- 规则状态 -->
          <div class="field-section mb-6">
            <label class="rule-status-label">
              <input
                v-model="enabled"
                type="checkbox"
                class="rule-status-checkbox"
              />
              <span class="rule-status-text">{{ t('cache.enableRuleImmediately') }}</span>
            </label>
            <p class="field-description">
              {{ t('cache.enableRuleDescription') }}
            </p>
          </div>

          <!-- 提交按钮 -->
          <div class="modal-actions">
            <button
              type="button"
              @click="$emit('close')"
              class="cancel-button"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="!isValid"
              class="submit-button"
            >
              {{ t('cache.createRule') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  XMarkIcon, 
  PlusIcon,
  CubeIcon,
  CloudArrowDownIcon,
  CodeBracketIcon,
  GlobeAltIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'
import type { PreloadRule } from '@/services/AdvancedCacheManager'

// Emits
interface Emits {
  'close': []
  'submit': [rule: Omit<PreloadRule, 'id'>]
}

const emit = defineEmits<Emits>()

// 使用i18n
const { t } = useI18n()

// 响应式状态
const ruleName = ref('')
const patternType = ref<'string' | 'regex'>('string')
const pattern = ref('')
const priority = ref(5)
const selectedConditions = ref<string[]>(['always'])
const dependencies = ref<string[]>([])
const newDependency = ref('')
const loaderType = ref('calculation')
const loaderCode = ref('')
const enabled = ref(true)

// 条件选项
const conditionOptions = [
  {
    value: 'always',
    title: t('cache.alwaysCondition'),
    description: t('cache.alwaysConditionDescription')
  },
  {
    value: 'cache-miss',
    title: t('cache.cacheMissCondition'),
    description: t('cache.cacheMissConditionDescription')
  },
  {
    value: 'high-frequency',
    title: t('cache.highFrequencyCondition'),
    description: t('cache.highFrequencyConditionDescription')
  },
  {
    value: 'related-access',
    title: t('cache.relatedAccessCondition'),
    description: t('cache.relatedAccessConditionDescription')
  }
]

// 加载器选项
const loaderOptions = [
  {
    value: 'calculation',
    title: t('cache.calculationLoader'),
    description: t('cache.calculationLoaderDescription'),
    icon: CubeIcon
  },
  {
    value: 'api',
    title: t('cache.apiLoader'),
    description: t('cache.apiLoaderDescription'),
    icon: CloudArrowDownIcon
  },
  {
    value: 'static',
    title: t('cache.staticLoader'),
    description: t('cache.staticLoaderDescription'),
    icon: GlobeAltIcon
  },
  {
    value: 'custom',
    title: t('cache.customLoader'),
    description: t('cache.customLoaderDescription'),
    icon: CodeBracketIcon
  }
]

// 计算属性
const isValid = computed(() => {
  return ruleName.value.trim().length > 0 && 
         pattern.value.trim().length > 0 &&
         selectedConditions.value.length > 0 &&
         (loaderType.value !== 'custom' || loaderCode.value.trim().length > 0)
})

// 方法
const getPatternPlaceholder = (): string => {
  if (patternType.value === 'string') {
    return t('cache.stringPatternPlaceholder')
  } else {
    return t('cache.regexPatternPlaceholder')
  }
}

const getPatternDescription = (): string => {
  if (patternType.value === 'string') {
    return t('cache.stringPatternDescription')
  } else {
    return t('cache.regexPatternDescription')
  }
}

const getPriorityDescription = (priority: number): string => {
  if (priority <= 3) {
    return t('cache.lowPriorityDescription')
  } else if (priority <= 7) {
    return t('cache.mediumPriorityDescription')
  } else {
    return t('cache.highPriorityDescription')
  }
}

const addDependency = (): void => {
  const dep = newDependency.value.trim()
  if (dep && !dependencies.value.includes(dep)) {
    dependencies.value.push(dep)
    newDependency.value = ''
  }
}

const removeDependency = (index: number): void => {
  dependencies.value.splice(index, 1)
}

const handleOverlayClick = (): void => {
  emit('close')
}

const submitRule = (): void => {
  if (!isValid.value) return
  
  // 构建条件函数
  const conditionFunction = (context: any): boolean => {
    if (selectedConditions.value.includes('always')) {
      return true
    }
    
    let shouldPreload = false
    
    if (selectedConditions.value.includes('cache-miss')) {
      shouldPreload = shouldPreload || !context.cache?.has?.(context.contextKey)
    }
    
    if (selectedConditions.value.includes('high-frequency')) {
      // 模拟高频访问检测
      shouldPreload = shouldPreload || Math.random() > 0.7
    }
    
    if (selectedConditions.value.includes('related-access')) {
      // 模拟相关访问检测
      shouldPreload = shouldPreload || context.contextKey?.includes('calculation')
    }
    
    return shouldPreload
  }

  // 构建加载器函数
  const loaderFunction = async (key: string): Promise<any> => {
    switch (loaderType.value) {
      case 'calculation':
        // 模拟计算数据加载
        return { type: 'calculation', key, data: `calculated-${key}`, timestamp: Date.now() }
      
      case 'api':
        // 模拟API数据加载
        return { type: 'api', key, data: `api-${key}`, timestamp: Date.now() }
      
      case 'static':
        // 模拟静态数据加载
        return { type: 'static', key, data: `static-${key}`, timestamp: Date.now() }
      
      case 'custom':
        // 执行自定义代码（在实际应用中需要安全处理）
        try {
          const customFunction = new Function('key', loaderCode.value)
          return await customFunction(key)
        } catch (error) {
          console.error('Custom loader error:', error)
          return null
        }
      
      default:
        return null
    }
  }

  // 构建规则对象
  const rule: Omit<PreloadRule, 'id'> = {
    pattern: patternType.value === 'regex' ? new RegExp(pattern.value) : pattern.value,
    priority: priority.value,
    condition: conditionFunction,
    loader: loaderFunction,
    dependencies: [...dependencies.value],
    enabled: enabled.value
  }
  
  emit('submit', rule)
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-button {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors duration-200;
}

.modal-content {
  @apply p-6;
}

.field-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.field-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-2;
}

.optional-label {
  @apply text-xs text-gray-500 dark:text-gray-500 font-normal;
}

.field-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.pattern-input-group {
  @apply flex space-x-2;
}

.pattern-type-select {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.pattern-input {
  @apply flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.priority-slider {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer;
}

.priority-slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-blue-600 rounded-full cursor-pointer;
}

.condition-option-label {
  @apply flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200;
}

.condition-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5;
}

.condition-content {
  @apply flex-1;
}

.condition-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.condition-description {
  @apply block text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.dependencies-input-group {
  @apply flex space-x-2;
}

.dependency-input {
  @apply flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.add-dependency-button {
  @apply px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.dependencies-list {
  @apply flex flex-wrap gap-2;
}

.dependency-item {
  @apply flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm;
}

.dependency-text {
  @apply font-medium;
}

.remove-dependency-button {
  @apply text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 rounded-full p-0.5;
}

.loader-option-label {
  @apply relative p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600;
}

.loader-option-label.selected {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

.loader-option-radio {
  @apply absolute top-3 right-3 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2;
}

.loader-option-content {
  @apply flex items-start space-x-3;
}

.loader-option-text {
  @apply flex-1;
}

.loader-option-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.loader-option-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.loader-code-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm;
}

.rule-status-label {
  @apply flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200;
}

.rule-status-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.rule-status-text {
  @apply font-medium text-gray-900 dark:text-white;
}

.character-count {
  @apply text-xs text-gray-500 dark:text-gray-500 text-right mt-1;
}

.modal-actions {
  @apply flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.cancel-button {
  @apply px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

.submit-button {
  @apply px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .modal-container {
    @apply max-w-full m-2;
  }
  
  .loader-options {
    @apply grid-cols-1;
  }
  
  .pattern-input-group,
  .dependencies-input-group {
    @apply flex-col space-y-2 space-x-0;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .modal-container {
  @apply border-2 border-current;
}

/* 动画 */
.modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  animation: slideIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
