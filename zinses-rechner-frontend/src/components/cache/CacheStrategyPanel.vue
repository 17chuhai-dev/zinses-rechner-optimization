<!--
  缓存策略配置面板组件
  提供高级缓存策略的配置和监控界面
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('cache.strategyPanel') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('cache.strategyDescription') }}
          </p>
        </div>
        
        <div class="header-actions flex items-center space-x-2">
          <div class="cache-status flex items-center space-x-2">
            <div :class="getStatusIndicatorClasses()"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ isEnabled ? t('cache.enabled') : t('cache.disabled') }}
            </span>
          </div>
          
          <button
            @click="toggleCache"
            :class="getToggleButtonClasses()"
          >
            <component :is="isEnabled ? PauseIcon : PlayIcon" class="w-4 h-4 mr-2" />
            {{ isEnabled ? t('cache.disable') : t('cache.enable') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 缓存统计概览 -->
    <div class="cache-overview mb-6">
      <div class="overview-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 缓存命中率 -->
        <div class="stat-card">
          <div class="stat-header">
            <ChartBarIcon class="w-5 h-5 text-green-500" />
            <span class="stat-title">{{ t('cache.hitRate') }}</span>
          </div>
          <div class="stat-value">
            {{ formatPercentage(stats.hitRate) }}
          </div>
          <div class="stat-change" :class="getChangeClasses(getHitRateChange())">
            {{ getChangeText(getHitRateChange()) }}
          </div>
        </div>
        
        <!-- 缓存大小 -->
        <div class="stat-card">
          <div class="stat-header">
            <ServerIcon class="w-5 h-5 text-blue-500" />
            <span class="stat-title">{{ t('cache.totalSize') }}</span>
          </div>
          <div class="stat-value">
            {{ formatFileSize(stats.totalSize) }}
          </div>
          <div class="stat-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill bg-blue-500"
                :style="{ width: `${stats.memoryUsage}%` }"
              ></div>
            </div>
            <span class="progress-text">{{ formatPercentage(stats.memoryUsage) }}</span>
          </div>
        </div>
        
        <!-- 缓存项数 -->
        <div class="stat-card">
          <div class="stat-header">
            <CubeIcon class="w-5 h-5 text-purple-500" />
            <span class="stat-title">{{ t('cache.totalItems') }}</span>
          </div>
          <div class="stat-value">
            {{ stats.totalItems.toLocaleString() }}
          </div>
          <div class="stat-meta text-xs text-gray-500 dark:text-gray-500">
            {{ t('cache.averageAccessTime') }}: {{ formatDuration(stats.averageAccessTime) }}
          </div>
        </div>
        
        <!-- 预加载状态 -->
        <div class="stat-card">
          <div class="stat-header">
            <ArrowDownTrayIcon class="w-5 h-5 text-orange-500" />
            <span class="stat-title">{{ t('cache.preloading') }}</span>
          </div>
          <div class="stat-value">
            {{ stats.preloadCount.toLocaleString() }}
          </div>
          <div class="stat-status">
            <div v-if="isPreloading" class="flex items-center text-orange-600 dark:text-orange-400">
              <ArrowPathIcon class="w-3 h-3 mr-1 animate-spin" />
              {{ t('cache.preloadingActive') }}
            </div>
            <div v-else class="text-gray-600 dark:text-gray-400">
              {{ t('cache.preloadingIdle') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 缓存策略配置 -->
    <div class="strategy-config mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('cache.strategyConfiguration') }}
      </h4>
      
      <div class="config-form bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div class="config-grid grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 缓存策略 -->
          <div class="config-field">
            <label class="config-label">{{ t('cache.cacheStrategy') }}</label>
            <select v-model="localConfig.strategy" class="config-select">
              <option value="lru">{{ t('cache.lru') }} (LRU)</option>
              <option value="lfu">{{ t('cache.lfu') }} (LFU)</option>
              <option value="fifo">{{ t('cache.fifo') }} (FIFO)</option>
              <option value="ttl">{{ t('cache.ttl') }} (TTL)</option>
              <option value="adaptive">{{ t('cache.adaptive') }}</option>
            </select>
            <p class="config-description">{{ getStrategyDescription(localConfig.strategy) }}</p>
          </div>
          
          <!-- 最大缓存大小 -->
          <div class="config-field">
            <label class="config-label">{{ t('cache.maxSize') }} (MB)</label>
            <input
              v-model.number="localConfig.maxSize"
              type="number"
              min="1"
              max="500"
              class="config-input"
            />
            <p class="config-description">{{ t('cache.maxSizeDescription') }}</p>
          </div>
          
          <!-- 最大缓存项数 -->
          <div class="config-field">
            <label class="config-label">{{ t('cache.maxItems') }}</label>
            <input
              v-model.number="localConfig.maxItems"
              type="number"
              min="100"
              max="10000"
              step="100"
              class="config-input"
            />
            <p class="config-description">{{ t('cache.maxItemsDescription') }}</p>
          </div>
          
          <!-- 默认TTL -->
          <div class="config-field">
            <label class="config-label">{{ t('cache.defaultTTL') }} ({{ t('cache.minutes') }})</label>
            <input
              v-model.number="ttlMinutes"
              type="number"
              min="1"
              max="1440"
              class="config-input"
            />
            <p class="config-description">{{ t('cache.defaultTTLDescription') }}</p>
          </div>
        </div>
        
        <!-- 高级选项 -->
        <div class="advanced-options mt-6">
          <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
            {{ t('cache.advancedOptions') }}
          </h5>
          
          <div class="options-grid grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="option-label">
              <input
                v-model="localConfig.enablePreloading"
                type="checkbox"
                class="option-checkbox"
              />
              <span class="option-text">{{ t('cache.enablePreloading') }}</span>
              <span class="option-description">{{ t('cache.preloadingDescription') }}</span>
            </label>
            
            <label class="option-label">
              <input
                v-model="localConfig.enableCompression"
                type="checkbox"
                class="option-checkbox"
              />
              <span class="option-text">{{ t('cache.enableCompression') }}</span>
              <span class="option-description">{{ t('cache.compressionDescription') }}</span>
            </label>
            
            <label class="option-label">
              <input
                v-model="localConfig.enablePersistence"
                type="checkbox"
                class="option-checkbox"
              />
              <span class="option-text">{{ t('cache.enablePersistence') }}</span>
              <span class="option-description">{{ t('cache.persistenceDescription') }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 预加载规则管理 -->
    <div v-if="localConfig.enablePreloading" class="preload-rules mb-6">
      <div class="rules-header flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          {{ t('cache.preloadRules') }}
        </h4>
        <button
          @click="showAddRuleModal = true"
          class="add-rule-button"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          {{ t('cache.addRule') }}
        </button>
      </div>
      
      <div class="rules-list space-y-3">
        <div
          v-for="rule in preloadRules"
          :key="rule.id"
          class="rule-item"
        >
          <div class="rule-content flex items-center justify-between">
            <div class="rule-info">
              <div class="rule-name font-medium text-gray-900 dark:text-white">
                {{ rule.id }}
              </div>
              <div class="rule-pattern text-sm text-gray-600 dark:text-gray-400">
                {{ t('cache.pattern') }}: {{ rule.pattern }}
              </div>
              <div class="rule-meta text-xs text-gray-500 dark:text-gray-500">
                {{ t('cache.priority') }}: {{ rule.priority }} • 
                {{ rule.enabled ? t('cache.enabled') : t('cache.disabled') }}
              </div>
            </div>
            
            <div class="rule-actions flex items-center space-x-2">
              <button
                @click="toggleRule(rule.id)"
                :class="getRuleToggleClasses(rule.enabled)"
              >
                {{ rule.enabled ? t('cache.disable') : t('cache.enable') }}
              </button>
              <button
                @click="removeRule(rule.id)"
                class="remove-rule-button"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="preloadRules.length === 0" class="empty-rules text-center py-8">
          <CubeTransparentIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ t('cache.noRules') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ t('cache.noRulesDescription') }}
          </p>
          <button
            @click="showAddRuleModal = true"
            class="add-first-rule-button"
          >
            {{ t('cache.addFirstRule') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 缓存操作 -->
    <div class="cache-actions mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('cache.cacheOperations') }}
      </h4>
      
      <div class="actions-grid grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          @click="triggerPreload"
          :disabled="!localConfig.enablePreloading || isPreloading"
          class="action-button preload-button"
        >
          <component :is="isPreloading ? ArrowPathIcon : RocketLaunchIcon" 
                    :class="['w-4 h-4 mr-2', { 'animate-spin': isPreloading }]" />
          {{ t('cache.triggerPreload') }}
        </button>
        
        <button
          @click="clearCache"
          class="action-button clear-button"
        >
          <TrashIcon class="w-4 h-4 mr-2" />
          {{ t('cache.clearCache') }}
        </button>
        
        <button
          @click="exportCacheData"
          class="action-button export-button"
        >
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          {{ t('cache.exportData') }}
        </button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-actions flex items-center justify-between">
      <div class="action-info">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('cache.lastUpdate') }}: {{ formatTimestamp(new Date()) }}
        </span>
      </div>
      
      <div class="main-actions flex items-center space-x-3">
        <button
          @click="resetToDefaults"
          class="reset-button"
        >
          <ArrowUturnLeftIcon class="w-4 h-4 mr-2" />
          {{ t('cache.resetDefaults') }}
        </button>
        
        <button
          @click="applyConfig"
          :disabled="!hasConfigChanges"
          class="apply-button"
        >
          <CheckIcon class="w-4 h-4 mr-2" />
          {{ t('cache.applyChanges') }}
        </button>
      </div>
    </div>

    <!-- 添加规则模态框 -->
    <AddPreloadRuleModal
      v-if="showAddRuleModal"
      @close="showAddRuleModal = false"
      @submit="handleAddRule"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import {
  ChartBarIcon,
  ServerIcon,
  CubeIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  RocketLaunchIcon,
  ArrowUturnLeftIcon,
  CheckIcon,
  CubeTransparentIcon
} from '@heroicons/vue/24/outline'
import AddPreloadRuleModal from './AddPreloadRuleModal.vue'
import { useAdvancedCache } from '@/services/AdvancedCacheManager'
import { useI18n } from '@/services/I18nService'
import { saveAs } from '../utils/file-saver-mock'
import type { CacheConfig, CacheStrategy, PreloadRule } from '@/services/AdvancedCacheManager'

// Props
interface Props {
  showTitle?: boolean
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true
})

// 使用服务
const {
  stats,
  isEnabled,
  isPreloading,
  updateConfig,
  triggerPreload,
  clear,
  exportCache,
  addPreloadRule,
  removePreloadRule
} = useAdvancedCache()

const { t } = useI18n()

// 响应式状态
const showAddRuleModal = ref(false)
const preloadRules = ref<PreloadRule[]>([])

// 本地配置
const localConfig = reactive<CacheConfig>({
  maxSize: 50,
  maxItems: 1000,
  defaultTTL: 30 * 60 * 1000,
  strategy: 'adaptive',
  enablePreloading: true,
  enableCompression: true,
  enablePersistence: true,
  cleanupInterval: 5 * 60 * 1000,
  preloadThreshold: 0.8
})

const originalConfig = ref<CacheConfig>({ ...localConfig })

// TTL分钟数（用于界面显示）
const ttlMinutes = computed({
  get: () => Math.round(localConfig.defaultTTL / (60 * 1000)),
  set: (value: number) => {
    localConfig.defaultTTL = value * 60 * 1000
  }
})

// 计算属性
const containerClasses = computed(() => {
  const classes = ['cache-strategy-panel', 'bg-white', 'dark:bg-gray-900', 'rounded-lg', 'p-6']
  
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  return classes
})

const ariaLabel = computed(() => {
  return `${t('cache.strategyPanel')}: ${stats.totalItems} ${t('cache.items')}, ${formatPercentage(stats.hitRate)} ${t('cache.hitRate')}`
})

const hasConfigChanges = computed(() => {
  return JSON.stringify(localConfig) !== JSON.stringify(originalConfig.value)
})

// 方法
const getStatusIndicatorClasses = (): string[] => {
  const classes = ['w-2', 'h-2', 'rounded-full']
  
  if (isEnabled.value) {
    classes.push('bg-green-500', 'animate-pulse')
  } else {
    classes.push('bg-gray-400')
  }
  
  return classes
}

const getToggleButtonClasses = (): string[] => {
  const classes = [
    'toggle-button',
    'flex',
    'items-center',
    'px-3',
    'py-2',
    'text-sm',
    'font-medium',
    'rounded-md',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2'
  ]
  
  if (isEnabled.value) {
    classes.push(
      'text-red-600',
      'hover:bg-red-50',
      'dark:hover:bg-red-900/20',
      'focus:ring-red-500'
    )
  } else {
    classes.push(
      'text-green-600',
      'hover:bg-green-50',
      'dark:hover:bg-green-900/20',
      'focus:ring-green-500'
    )
  }
  
  return classes
}

const getChangeClasses = (change: number): string[] => {
  const classes = ['text-xs', 'font-medium']
  
  if (change > 0) classes.push('text-green-600', 'dark:text-green-400')
  else if (change < 0) classes.push('text-red-600', 'dark:text-red-400')
  else classes.push('text-gray-600', 'dark:text-gray-400')
  
  return classes
}

const getChangeText = (change: number): string => {
  if (change === 0) return '—'
  const prefix = change > 0 ? '+' : ''
  return `${prefix}${change.toFixed(1)}%`
}

const getRuleToggleClasses = (enabled: boolean): string[] => {
  const classes = ['rule-toggle', 'px-2', 'py-1', 'text-xs', 'font-medium', 'rounded']
  
  if (enabled) {
    classes.push('text-red-600', 'hover:bg-red-50', 'dark:hover:bg-red-900/20')
  } else {
    classes.push('text-green-600', 'hover:bg-green-50', 'dark:hover:bg-green-900/20')
  }
  
  return classes
}

const getStrategyDescription = (strategy: CacheStrategy): string => {
  const descriptions: Record<CacheStrategy, string> = {
    lru: t('cache.lruDescription'),
    lfu: t('cache.lfuDescription'),
    fifo: t('cache.fifoDescription'),
    ttl: t('cache.ttlDescription'),
    adaptive: t('cache.adaptiveDescription')
  }
  return descriptions[strategy]
}

// 格式化函数
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDuration = (ms: number): string => {
  if (ms < 1) return '<1ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const formatTimestamp = (date: Date): string => {
  return date.toLocaleString('de-DE')
}

// 变化计算（模拟）
const getHitRateChange = (): number => Math.random() * 10 - 5

// 操作方法
const toggleCache = (): void => {
  // 切换缓存启用状态的逻辑
  console.log('Toggle cache:', !isEnabled.value)
}

const clearCache = async (): Promise<void> => {
  if (confirm(t('cache.confirmClear'))) {
    await clear()
    console.log('Cache cleared')
  }
}

const exportCacheData = (): void => {
  const data = exportCache()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const filename = `cache-data-${new Date().toISOString().slice(0, 10)}.json`
  saveAs(blob, filename)
}

const applyConfig = (): void => {
  updateConfig(localConfig)
  originalConfig.value = { ...localConfig }
  console.log('Cache config applied')
}

const resetToDefaults = (): void => {
  if (confirm(t('cache.confirmReset'))) {
    Object.assign(localConfig, {
      maxSize: 50,
      maxItems: 1000,
      defaultTTL: 30 * 60 * 1000,
      strategy: 'adaptive' as CacheStrategy,
      enablePreloading: true,
      enableCompression: true,
      enablePersistence: true,
      cleanupInterval: 5 * 60 * 1000,
      preloadThreshold: 0.8
    })
  }
}

const handleAddRule = (rule: Omit<PreloadRule, 'id'>): void => {
  const newRule: PreloadRule = {
    ...rule,
    id: `rule-${Date.now()}`
  }
  
  addPreloadRule(newRule)
  preloadRules.value.push(newRule)
  showAddRuleModal.value = false
}

const toggleRule = (ruleId: string): void => {
  const rule = preloadRules.value.find(r => r.id === ruleId)
  if (rule) {
    rule.enabled = !rule.enabled
    // 更新规则状态
    removePreloadRule(ruleId)
    addPreloadRule(rule)
  }
}

const removeRule = (ruleId: string): void => {
  if (confirm(t('cache.confirmRemoveRule'))) {
    removePreloadRule(ruleId)
    const index = preloadRules.value.findIndex(r => r.id === ruleId)
    if (index > -1) {
      preloadRules.value.splice(index, 1)
    }
  }
}

// 生命周期
onMounted(() => {
  // 初始化预加载规则
  preloadRules.value = [
    {
      id: 'calculation-results',
      pattern: /^calculation:/,
      priority: 8,
      condition: () => true,
      loader: async (key: string) => {
        // 模拟加载逻辑
        return `preloaded-${key}`
      },
      dependencies: [],
      enabled: true
    }
  ]
})

// 监听配置变化
watch(
  () => localConfig,
  () => {
    // 配置变化时的处理逻辑
  },
  { deep: true }
)
</script>

<style scoped>
.cache-strategy-panel {
  @apply max-w-6xl mx-auto;
}

.stat-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm;
}

.stat-header {
  @apply flex items-center space-x-2 mb-2;
}

.stat-title {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.stat-progress {
  @apply mt-2;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full transition-all duration-300;
}

.progress-text {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.config-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.config-select,
.config-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.config-description {
  @apply text-xs text-gray-500 dark:text-gray-500 mt-1;
}

.option-label {
  @apply flex flex-col p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200;
}

.option-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.option-text {
  @apply font-medium text-gray-900 dark:text-white mt-2;
}

.option-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.rule-item {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700;
}

.add-rule-button,
.add-first-rule-button {
  @apply flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.action-button {
  @apply flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.preload-button {
  @apply text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 focus:ring-orange-500;
}

.clear-button {
  @apply text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 focus:ring-red-500;
}

.export-button {
  @apply text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 focus:ring-blue-500;
}

.reset-button {
  @apply text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500;
}

.apply-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.remove-rule-button {
  @apply p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md;
}

button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .overview-grid {
    @apply grid-cols-1;
  }
  
  .config-grid {
    @apply grid-cols-1;
  }
  
  .actions-grid {
    @apply grid-cols-1;
  }
  
  .panel-actions {
    @apply flex-col space-y-3;
  }
  
  .main-actions {
    @apply w-full justify-between;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .stat-card {
  @apply border-2 border-current;
}

/* 暗色模式支持 */
:global(.theme-dark) .stat-card {
  @apply bg-gray-800 border-gray-600;
}

/* 打印样式 */
@media print {
  .panel-actions,
  .header-actions {
    @apply hidden;
  }
}
</style>
