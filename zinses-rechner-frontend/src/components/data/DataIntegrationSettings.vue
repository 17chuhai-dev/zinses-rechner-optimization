<!--
  数据集成设置组件
  配置实时数据源、更新频率、API密钥等
-->

<template>
  <div class="data-integration-settings">
    <!-- 设置标题 -->
    <div class="settings-header mb-6">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">
        {{ t('data.integrationSettings') }}
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {{ t('data.integrationSettingsDescription') }}
      </p>
    </div>

    <!-- 设置表单 -->
    <form @submit.prevent="saveSettings" class="settings-form space-y-8">
      <!-- 数据源配置 -->
      <div class="data-sources-section">
        <h4 class="section-title">{{ t('data.dataSources') }}</h4>
        <p class="section-description">{{ t('data.dataSourcesDescription') }}</p>
        
        <div class="sources-grid grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <!-- 欧洲央行 -->
          <div class="source-card">
            <div class="source-header">
              <div class="source-info">
                <img src="/images/logos/ecb-logo.png" alt="ECB" class="w-8 h-8" />
                <div class="source-details">
                  <h5 class="source-name">{{ t('data.europeanCentralBank') }}</h5>
                  <p class="source-description">{{ t('data.ecbApiDescription') }}</p>
                </div>
              </div>
              <div class="source-toggle">
                <input
                  v-model="settings.dataSources.ecb.enabled"
                  type="checkbox"
                  class="toggle-input"
                />
              </div>
            </div>
            
            <div v-if="settings.dataSources.ecb.enabled" class="source-config mt-4">
              <div class="config-field">
                <label class="config-label">{{ t('data.updateInterval') }}</label>
                <select v-model="settings.dataSources.ecb.interval" class="config-select">
                  <option value="30000">30 {{ t('data.seconds') }}</option>
                  <option value="60000">1 {{ t('data.minute') }}</option>
                  <option value="300000">5 {{ t('data.minutes') }}</option>
                  <option value="900000">15 {{ t('data.minutes') }}</option>
                </select>
              </div>
              
              <div class="config-field">
                <label class="config-label">{{ t('data.dataTypes') }}</label>
                <div class="checkbox-group">
                  <label class="checkbox-option">
                    <input
                      v-model="settings.dataSources.ecb.dataTypes"
                      type="checkbox"
                      value="interest_rate"
                      class="checkbox-input"
                    />
                    <span class="checkbox-text">{{ t('data.interestRates') }}</span>
                  </label>
                  <label class="checkbox-option">
                    <input
                      v-model="settings.dataSources.ecb.dataTypes"
                      type="checkbox"
                      value="exchange_rate"
                      class="checkbox-input"
                    />
                    <span class="checkbox-text">{{ t('data.exchangeRates') }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 德国央行 -->
          <div class="source-card">
            <div class="source-header">
              <div class="source-info">
                <img src="/images/logos/bundesbank-logo.png" alt="Bundesbank" class="w-8 h-8" />
                <div class="source-details">
                  <h5 class="source-name">{{ t('data.deutscheBundesbank') }}</h5>
                  <p class="source-description">{{ t('data.bundesbankApiDescription') }}</p>
                </div>
              </div>
              <div class="source-toggle">
                <input
                  v-model="settings.dataSources.bundesbank.enabled"
                  type="checkbox"
                  class="toggle-input"
                />
              </div>
            </div>
            
            <div v-if="settings.dataSources.bundesbank.enabled" class="source-config mt-4">
              <div class="config-field">
                <label class="config-label">{{ t('data.updateInterval') }}</label>
                <select v-model="settings.dataSources.bundesbank.interval" class="config-select">
                  <option value="60000">1 {{ t('data.minute') }}</option>
                  <option value="300000">5 {{ t('data.minutes') }}</option>
                  <option value="900000">15 {{ t('data.minutes') }}</option>
                  <option value="3600000">1 {{ t('data.hour') }}</option>
                </select>
              </div>
              
              <div class="config-field">
                <label class="config-label">{{ t('data.dataTypes') }}</label>
                <div class="checkbox-group">
                  <label class="checkbox-option">
                    <input
                      v-model="settings.dataSources.bundesbank.dataTypes"
                      type="checkbox"
                      value="bond_yield"
                      class="checkbox-input"
                    />
                    <span class="checkbox-text">{{ t('data.bondYields') }}</span>
                  </label>
                  <label class="checkbox-option">
                    <input
                      v-model="settings.dataSources.bundesbank.dataTypes"
                      type="checkbox"
                      value="inflation_rate"
                      class="checkbox-input"
                    />
                    <span class="checkbox-text">{{ t('data.inflationRates') }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Yahoo Finance -->
          <div class="source-card">
            <div class="source-header">
              <div class="source-info">
                <img src="/images/logos/yahoo-logo.png" alt="Yahoo Finance" class="w-8 h-8" />
                <div class="source-details">
                  <h5 class="source-name">{{ t('data.yahooFinance') }}</h5>
                  <p class="source-description">{{ t('data.yahooApiDescription') }}</p>
                </div>
              </div>
              <div class="source-toggle">
                <input
                  v-model="settings.dataSources.yahoo.enabled"
                  type="checkbox"
                  class="toggle-input"
                />
              </div>
            </div>
            
            <div v-if="settings.dataSources.yahoo.enabled" class="source-config mt-4">
              <div class="config-field">
                <label class="config-label">{{ t('data.updateInterval') }}</label>
                <select v-model="settings.dataSources.yahoo.interval" class="config-select">
                  <option value="5000">5 {{ t('data.seconds') }}</option>
                  <option value="15000">15 {{ t('data.seconds') }}</option>
                  <option value="30000">30 {{ t('data.seconds') }}</option>
                  <option value="60000">1 {{ t('data.minute') }}</option>
                </select>
              </div>
              
              <div class="config-field">
                <label class="config-label">{{ t('data.dataTypes') }}</label>
                <div class="checkbox-group">
                  <label class="checkbox-option">
                    <input
                      v-model="settings.dataSources.yahoo.dataTypes"
                      type="checkbox"
                      value="stock_price"
                      class="checkbox-input"
                    />
                    <span class="checkbox-text">{{ t('data.stockPrices') }}</span>
                  </label>
                  <label class="checkbox-option">
                    <input
                      v-model="settings.dataSources.yahoo.dataTypes"
                      type="checkbox"
                      value="exchange_rate"
                      class="checkbox-input"
                    />
                    <span class="checkbox-text">{{ t('data.exchangeRates') }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Fixer.io -->
          <div class="source-card">
            <div class="source-header">
              <div class="source-info">
                <img src="/images/logos/fixer-logo.png" alt="Fixer.io" class="w-8 h-8" />
                <div class="source-details">
                  <h5 class="source-name">{{ t('data.fixerIO') }}</h5>
                  <p class="source-description">{{ t('data.fixerApiDescription') }}</p>
                </div>
              </div>
              <div class="source-toggle">
                <input
                  v-model="settings.dataSources.fixer.enabled"
                  type="checkbox"
                  class="toggle-input"
                />
              </div>
            </div>
            
            <div v-if="settings.dataSources.fixer.enabled" class="source-config mt-4">
              <div class="config-field">
                <label class="config-label">{{ t('data.apiKey') }}</label>
                <div class="api-key-input">
                  <input
                    v-model="settings.dataSources.fixer.apiKey"
                    :type="showApiKey ? 'text' : 'password'"
                    class="config-input"
                    :placeholder="t('data.enterApiKey')"
                  />
                  <button
                    type="button"
                    @click="showApiKey = !showApiKey"
                    class="api-key-toggle"
                  >
                    <EyeIcon v-if="!showApiKey" class="w-4 h-4" />
                    <EyeSlashIcon v-else class="w-4 h-4" />
                  </button>
                </div>
                <p class="config-hint">{{ t('data.fixerApiKeyHint') }}</p>
              </div>
              
              <div class="config-field">
                <label class="config-label">{{ t('data.updateInterval') }}</label>
                <select v-model="settings.dataSources.fixer.interval" class="config-select">
                  <option value="10000">10 {{ t('data.seconds') }}</option>
                  <option value="30000">30 {{ t('data.seconds') }}</option>
                  <option value="60000">1 {{ t('data.minute') }}</option>
                  <option value="300000">5 {{ t('data.minutes') }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 缓存设置 -->
      <div class="cache-settings-section">
        <h4 class="section-title">{{ t('data.cacheSettings') }}</h4>
        <p class="section-description">{{ t('data.cacheSettingsDescription') }}</p>
        
        <div class="cache-config grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div class="config-field">
            <label class="config-label">{{ t('data.cacheSize') }}</label>
            <select v-model="settings.cache.maxSize" class="config-select">
              <option value="500">500 {{ t('data.entries') }}</option>
              <option value="1000">1000 {{ t('data.entries') }}</option>
              <option value="2000">2000 {{ t('data.entries') }}</option>
              <option value="5000">5000 {{ t('data.entries') }}</option>
            </select>
          </div>
          
          <div class="config-field">
            <label class="config-label">{{ t('data.cacheTTL') }}</label>
            <select v-model="settings.cache.ttl" class="config-select">
              <option value="60000">1 {{ t('data.minute') }}</option>
              <option value="300000">5 {{ t('data.minutes') }}</option>
              <option value="900000">15 {{ t('data.minutes') }}</option>
              <option value="3600000">1 {{ t('data.hour') }}</option>
            </select>
          </div>
          
          <div class="config-field">
            <label class="checkbox-option">
              <input
                v-model="settings.cache.enabled"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">{{ t('data.enableCache') }}</span>
            </label>
          </div>
          
          <div class="config-field">
            <label class="checkbox-option">
              <input
                v-model="settings.cache.persistToStorage"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">{{ t('data.persistCache') }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 通知设置 -->
      <div class="notification-settings-section">
        <h4 class="section-title">{{ t('data.notificationSettings') }}</h4>
        <p class="section-description">{{ t('data.notificationSettingsDescription') }}</p>
        
        <div class="notification-config space-y-4 mt-4">
          <label class="checkbox-option">
            <input
              v-model="settings.notifications.dataUpdates"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-text">{{ t('data.notifyDataUpdates') }}</span>
          </label>
          
          <label class="checkbox-option">
            <input
              v-model="settings.notifications.connectionIssues"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-text">{{ t('data.notifyConnectionIssues') }}</span>
          </label>
          
          <label class="checkbox-option">
            <input
              v-model="settings.notifications.significantChanges"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-text">{{ t('data.notifySignificantChanges') }}</span>
          </label>
          
          <div class="config-field">
            <label class="config-label">{{ t('data.changeThreshold') }}</label>
            <div class="threshold-input">
              <input
                v-model.number="settings.notifications.changeThreshold"
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                class="config-input"
              />
              <span class="threshold-unit">%</span>
            </div>
            <p class="config-hint">{{ t('data.changeThresholdHint') }}</p>
          </div>
        </div>
      </div>

      <!-- 高级设置 -->
      <div class="advanced-settings-section">
        <div class="advanced-header">
          <h4 class="section-title">{{ t('data.advancedSettings') }}</h4>
          <button
            type="button"
            @click="showAdvanced = !showAdvanced"
            class="advanced-toggle"
          >
            <ChevronDownIcon 
              :class="{ 'rotate-180': showAdvanced }"
              class="w-4 h-4 transition-transform duration-200"
            />
            {{ showAdvanced ? t('data.hideAdvanced') : t('data.showAdvanced') }}
          </button>
        </div>
        
        <div v-if="showAdvanced" class="advanced-config space-y-4 mt-4">
          <div class="config-field">
            <label class="config-label">{{ t('data.requestTimeout') }}</label>
            <div class="timeout-input">
              <input
                v-model.number="settings.advanced.requestTimeout"
                type="number"
                min="1000"
                max="30000"
                step="1000"
                class="config-input"
              />
              <span class="timeout-unit">ms</span>
            </div>
          </div>
          
          <div class="config-field">
            <label class="config-label">{{ t('data.maxRetries') }}</label>
            <select v-model="settings.advanced.maxRetries" class="config-select">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
            </select>
          </div>
          
          <div class="config-field">
            <label class="config-label">{{ t('data.rateLimitBuffer') }}</label>
            <div class="buffer-input">
              <input
                v-model.number="settings.advanced.rateLimitBuffer"
                type="number"
                min="10"
                max="90"
                step="10"
                class="config-input"
              />
              <span class="buffer-unit">%</span>
            </div>
            <p class="config-hint">{{ t('data.rateLimitBufferHint') }}</p>
          </div>
          
          <label class="checkbox-option">
            <input
              v-model="settings.advanced.enableDebugLogging"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-text">{{ t('data.enableDebugLogging') }}</span>
          </label>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <div class="actions-left">
          <button
            type="button"
            @click="resetToDefaults"
            class="reset-button"
          >
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            {{ t('data.resetToDefaults') }}
          </button>
          
          <button
            type="button"
            @click="testConnections"
            :disabled="isTesting"
            class="test-button"
          >
            <SignalIcon v-if="!isTesting" class="w-4 h-4 mr-2" />
            <ArrowPathIcon v-else class="w-4 h-4 mr-2 animate-spin" />
            {{ isTesting ? t('data.testing') : t('data.testConnections') }}
          </button>
        </div>
        
        <div class="actions-right">
          <button
            type="button"
            @click="$emit('cancel')"
            class="cancel-button"
          >
            {{ t('data.cancel') }}
          </button>
          
          <button
            type="submit"
            :disabled="isSaving"
            class="save-button"
          >
            <CheckIcon v-if="!isSaving" class="w-4 h-4 mr-2" />
            <ArrowPathIcon v-else class="w-4 h-4 mr-2 animate-spin" />
            {{ isSaving ? t('data.saving') : t('data.saveSettings') }}
          </button>
        </div>
      </div>
    </form>

    <!-- 测试结果 -->
    <div v-if="testResults.length > 0" class="test-results mt-6">
      <h4 class="results-title">{{ t('data.connectionTestResults') }}</h4>
      <div class="results-list space-y-2 mt-3">
        <div
          v-for="result in testResults"
          :key="result.source"
          class="result-item"
          :class="result.success ? 'success' : 'error'"
        >
          <div class="result-icon">
            <CheckCircleIcon v-if="result.success" class="w-5 h-5 text-green-500" />
            <XCircleIcon v-else class="w-5 h-5 text-red-500" />
          </div>
          <div class="result-content">
            <div class="result-source">{{ result.source }}</div>
            <div class="result-message">{{ result.message }}</div>
            <div v-if="result.responseTime" class="result-time">
              {{ t('data.responseTime') }}: {{ result.responseTime }}ms
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  SignalIcon,
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'

// Emits
interface Emits {
  'settings-saved': [settings: any]
  'cancel': []
}

const emit = defineEmits<Emits>()

// 使用服务
const { t } = useI18n()

// 响应式状态
const showApiKey = ref(false)
const showAdvanced = ref(false)
const isSaving = ref(false)
const isTesting = ref(false)

// 设置数据
const settings = reactive({
  dataSources: {
    ecb: {
      enabled: true,
      interval: 60000,
      dataTypes: ['interest_rate', 'exchange_rate']
    },
    bundesbank: {
      enabled: true,
      interval: 300000,
      dataTypes: ['bond_yield', 'inflation_rate']
    },
    yahoo: {
      enabled: true,
      interval: 15000,
      dataTypes: ['stock_price']
    },
    fixer: {
      enabled: false,
      apiKey: '',
      interval: 30000,
      dataTypes: ['exchange_rate']
    }
  },
  cache: {
    enabled: true,
    maxSize: 1000,
    ttl: 300000,
    persistToStorage: true
  },
  notifications: {
    dataUpdates: false,
    connectionIssues: true,
    significantChanges: true,
    changeThreshold: 1.0
  },
  advanced: {
    requestTimeout: 10000,
    maxRetries: 3,
    rateLimitBuffer: 20,
    enableDebugLogging: false
  }
})

// 测试结果
const testResults = ref<Array<{
  source: string
  success: boolean
  message: string
  responseTime?: number
}>>([])

// 方法
const saveSettings = async (): Promise<void> => {
  isSaving.value = true
  
  try {
    // 模拟保存设置
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    emit('settings-saved', { ...settings })
    console.log('✅ Settings saved successfully')
  } catch (error) {
    console.error('❌ Failed to save settings:', error)
  } finally {
    isSaving.value = false
  }
}

const resetToDefaults = (): void => {
  if (confirm(t('data.confirmResetSettings'))) {
    // 重置为默认值
    Object.assign(settings, getDefaultSettings())
  }
}

const testConnections = async (): Promise<void> => {
  isTesting.value = true
  testResults.value = []
  
  try {
    const sources = Object.entries(settings.dataSources)
      .filter(([_, config]) => config.enabled)
    
    for (const [sourceName, config] of sources) {
      const startTime = Date.now()
      
      try {
        // 模拟API测试
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
        
        const responseTime = Date.now() - startTime
        const success = Math.random() > 0.2 // 80% 成功率
        
        testResults.value.push({
          source: sourceName.toUpperCase(),
          success,
          message: success 
            ? t('data.connectionSuccessful')
            : t('data.connectionFailed'),
          responseTime: success ? responseTime : undefined
        })
      } catch (error) {
        testResults.value.push({
          source: sourceName.toUpperCase(),
          success: false,
          message: t('data.connectionError')
        })
      }
    }
  } finally {
    isTesting.value = false
  }
}

const getDefaultSettings = () => {
  return {
    dataSources: {
      ecb: {
        enabled: true,
        interval: 60000,
        dataTypes: ['interest_rate', 'exchange_rate']
      },
      bundesbank: {
        enabled: true,
        interval: 300000,
        dataTypes: ['bond_yield', 'inflation_rate']
      },
      yahoo: {
        enabled: true,
        interval: 15000,
        dataTypes: ['stock_price']
      },
      fixer: {
        enabled: false,
        apiKey: '',
        interval: 30000,
        dataTypes: ['exchange_rate']
      }
    },
    cache: {
      enabled: true,
      maxSize: 1000,
      ttl: 300000,
      persistToStorage: true
    },
    notifications: {
      dataUpdates: false,
      connectionIssues: true,
      significantChanges: true,
      changeThreshold: 1.0
    },
    advanced: {
      requestTimeout: 10000,
      maxRetries: 3,
      rateLimitBuffer: 20,
      enableDebugLogging: false
    }
  }
}

// 生命周期
onMounted(() => {
  // 加载保存的设置
  const savedSettings = localStorage.getItem('data-integration-settings')
  if (savedSettings) {
    try {
      Object.assign(settings, JSON.parse(savedSettings))
    } catch (error) {
      console.error('Failed to load saved settings:', error)
    }
  }
})
</script>

<style scoped>
.data-integration-settings {
  @apply max-w-4xl mx-auto;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.section-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.source-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700;
}

.source-header {
  @apply flex items-center justify-between;
}

.source-info {
  @apply flex items-center space-x-3;
}

.source-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.source-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.toggle-input {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.config-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.config-input,
.config-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.config-hint {
  @apply text-xs text-gray-500 dark:text-gray-500 mt-1;
}

.checkbox-option {
  @apply flex items-center space-x-2 cursor-pointer;
}

.checkbox-input {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.checkbox-text {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.checkbox-group {
  @apply space-y-2;
}

.api-key-input {
  @apply relative;
}

.api-key-toggle {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300;
}

.threshold-input,
.timeout-input,
.buffer-input {
  @apply flex items-center space-x-2;
}

.threshold-unit,
.timeout-unit,
.buffer-unit {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.advanced-header {
  @apply flex items-center justify-between;
}

.advanced-toggle {
  @apply flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300;
}

.form-actions {
  @apply flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700;
}

.actions-left,
.actions-right {
  @apply flex items-center space-x-3;
}

.reset-button,
.test-button,
.cancel-button,
.save-button {
  @apply flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.reset-button {
  @apply text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500;
}

.test-button {
  @apply text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-blue-500;
}

.cancel-button {
  @apply text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500;
}

.save-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:ring-blue-500;
}

.test-results {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4;
}

.results-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.result-item {
  @apply flex items-start space-x-3 p-3 rounded-md;
}

.result-item.success {
  @apply bg-green-50 dark:bg-green-900/20;
}

.result-item.error {
  @apply bg-red-50 dark:bg-red-900/20;
}

.result-source {
  @apply font-medium text-gray-900 dark:text-white;
}

.result-message {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.result-time {
  @apply text-xs text-gray-500 dark:text-gray-500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sources-grid {
    @apply grid-cols-1;
  }
  
  .cache-config {
    @apply grid-cols-1;
  }
  
  .form-actions {
    @apply flex-col space-y-3;
  }
  
  .actions-left,
  .actions-right {
    @apply w-full justify-center;
  }
}
</style>
