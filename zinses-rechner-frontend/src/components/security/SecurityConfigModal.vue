<!--
  安全配置模态框组件
  提供安全策略配置界面
-->

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框标题 -->
      <div class="modal-header">
        <h3 class="modal-title">
          {{ t('security.securityConfiguration') }}
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
        <form @submit.prevent="submitConfig">
          <!-- 基础安全设置 -->
          <div class="config-section mb-6">
            <h4 class="section-title">{{ t('security.basicSettings') }}</h4>
            
            <div class="settings-grid space-y-4">
              <label class="setting-label">
                <input
                  v-model="localConfig.enableCSP"
                  type="checkbox"
                  class="setting-checkbox"
                />
                <div class="setting-content">
                  <span class="setting-title">{{ t('security.enableCSP') }}</span>
                  <span class="setting-description">{{ t('security.cspDescription') }}</span>
                </div>
              </label>
              
              <label class="setting-label">
                <input
                  v-model="localConfig.enableXSSProtection"
                  type="checkbox"
                  class="setting-checkbox"
                />
                <div class="setting-content">
                  <span class="setting-title">{{ t('security.enableXSSProtection') }}</span>
                  <span class="setting-description">{{ t('security.xssProtectionDescription') }}</span>
                </div>
              </label>
              
              <label class="setting-label">
                <input
                  v-model="localConfig.enableInputValidation"
                  type="checkbox"
                  class="setting-checkbox"
                />
                <div class="setting-content">
                  <span class="setting-title">{{ t('security.enableInputValidation') }}</span>
                  <span class="setting-description">{{ t('security.inputValidationDescription') }}</span>
                </div>
              </label>
              
              <label class="setting-label">
                <input
                  v-model="localConfig.enableContentFiltering"
                  type="checkbox"
                  class="setting-checkbox"
                />
                <div class="setting-content">
                  <span class="setting-title">{{ t('security.enableContentFiltering') }}</span>
                  <span class="setting-description">{{ t('security.contentFilteringDescription') }}</span>
                </div>
              </label>
              
              <label class="setting-label">
                <input
                  v-model="localConfig.enableSecureHeaders"
                  type="checkbox"
                  class="setting-checkbox"
                />
                <div class="setting-content">
                  <span class="setting-title">{{ t('security.enableSecureHeaders') }}</span>
                  <span class="setting-description">{{ t('security.secureHeadersDescription') }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- 速率限制设置 -->
          <div class="config-section mb-6">
            <h4 class="section-title">{{ t('security.rateLimiting') }}</h4>
            
            <div class="rate-limit-settings">
              <label class="setting-label">
                <input
                  v-model="localConfig.enableRateLimiting"
                  type="checkbox"
                  class="setting-checkbox"
                />
                <div class="setting-content">
                  <span class="setting-title">{{ t('security.enableRateLimiting') }}</span>
                  <span class="setting-description">{{ t('security.rateLimitingDescription') }}</span>
                </div>
              </label>
              
              <div v-if="localConfig.enableRateLimiting" class="rate-limit-config mt-4">
                <label class="config-field-label">
                  {{ t('security.maxRequestsPerMinute') }}
                </label>
                <input
                  v-model.number="localConfig.maxRequestsPerMinute"
                  type="number"
                  min="1"
                  max="1000"
                  class="config-input"
                />
                <p class="config-field-description">
                  {{ t('security.maxRequestsDescription') }}
                </p>
              </div>
            </div>
          </div>

          <!-- 文件上传设置 -->
          <div class="config-section mb-6">
            <h4 class="section-title">{{ t('security.fileUploadSettings') }}</h4>
            
            <div class="file-upload-settings space-y-4">
              <div class="config-field">
                <label class="config-field-label">
                  {{ t('security.maxFileSize') }} (MB)
                </label>
                <input
                  v-model.number="localConfig.maxFileSize"
                  type="number"
                  min="1"
                  max="100"
                  class="config-input"
                />
                <p class="config-field-description">
                  {{ t('security.maxFileSizeDescription') }}
                </p>
              </div>
              
              <div class="config-field">
                <label class="config-field-label">
                  {{ t('security.allowedFileTypes') }}
                </label>
                <div class="file-types-list">
                  <label
                    v-for="fileType in availableFileTypes"
                    :key="fileType.value"
                    class="file-type-label"
                  >
                    <input
                      v-model="localConfig.allowedFileTypes"
                      type="checkbox"
                      :value="fileType.value"
                      class="file-type-checkbox"
                    />
                    <span class="file-type-text">{{ fileType.label }}</span>
                  </label>
                </div>
                <p class="config-field-description">
                  {{ t('security.allowedFileTypesDescription') }}
                </p>
              </div>
            </div>
          </div>

          <!-- 域名黑名单 -->
          <div class="config-section mb-6">
            <h4 class="section-title">{{ t('security.blockedDomains') }}</h4>
            
            <div class="blocked-domains-settings">
              <div class="domain-input-group">
                <input
                  v-model="newBlockedDomain"
                  type="text"
                  class="domain-input"
                  :placeholder="t('security.domainPlaceholder')"
                  @keydown.enter.prevent="addBlockedDomain"
                />
                <button
                  type="button"
                  @click="addBlockedDomain"
                  :disabled="!newBlockedDomain.trim()"
                  class="add-domain-button"
                >
                  <PlusIcon class="w-4 h-4" />
                </button>
              </div>
              
              <!-- 域名列表 -->
              <div v-if="localConfig.blockedDomains.length > 0" class="domains-list mt-3">
                <div
                  v-for="(domain, index) in localConfig.blockedDomains"
                  :key="index"
                  class="domain-item"
                >
                  <span class="domain-text">{{ domain }}</span>
                  <button
                    type="button"
                    @click="removeBlockedDomain(index)"
                    class="remove-domain-button"
                  >
                    <XMarkIcon class="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <p class="config-field-description">
                {{ t('security.blockedDomainsDescription') }}
              </p>
            </div>
          </div>

          <!-- 安全级别预设 -->
          <div class="config-section mb-6">
            <h4 class="section-title">{{ t('security.securityPresets') }}</h4>
            
            <div class="presets-grid grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                v-for="preset in securityPresets"
                :key="preset.id"
                type="button"
                @click="applyPreset(preset)"
                :class="getPresetButtonClasses(preset.level)"
              >
                <component :is="preset.icon" class="w-5 h-5 mb-2" />
                <div class="preset-title">{{ preset.title }}</div>
                <div class="preset-description">{{ preset.description }}</div>
              </button>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="modal-actions">
            <button
              type="button"
              @click="resetToDefaults"
              class="reset-button"
            >
              {{ t('security.resetDefaults') }}
            </button>
            
            <div class="action-buttons">
              <button
                type="button"
                @click="$emit('close')"
                class="cancel-button"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="!hasChanges"
                class="submit-button"
              >
                {{ t('security.applySettings') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { 
  XMarkIcon, 
  PlusIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  FireIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'
import type { SecurityConfig } from '@/services/SecurityManager'

// Emits
interface Emits {
  'close': []
  'update': [config: Partial<SecurityConfig>]
}

const emit = defineEmits<Emits>()

// 使用i18n
const { t } = useI18n()

// 响应式状态
const newBlockedDomain = ref('')

// 本地配置
const localConfig = reactive<SecurityConfig>({
  enableCSP: true,
  enableXSSProtection: true,
  enableInputValidation: true,
  enableContentFiltering: true,
  enableSecureHeaders: true,
  enableRateLimiting: true,
  maxRequestsPerMinute: 60,
  blockedDomains: [],
  allowedFileTypes: [
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'application/pdf',
    'text/csv',
    'application/json'
  ],
  maxFileSize: 10
})

const originalConfig = ref<SecurityConfig>({ ...localConfig })

// 可用文件类型
const availableFileTypes = [
  { value: 'image/png', label: 'PNG Images' },
  { value: 'image/jpeg', label: 'JPEG Images' },
  { value: 'image/svg+xml', label: 'SVG Images' },
  { value: 'application/pdf', label: 'PDF Documents' },
  { value: 'text/csv', label: 'CSV Files' },
  { value: 'application/json', label: 'JSON Files' },
  { value: 'text/plain', label: 'Text Files' },
  { value: 'application/zip', label: 'ZIP Archives' }
]

// 安全级别预设
const securityPresets = [
  {
    id: 'low',
    level: 'low',
    title: t('security.lowSecurity'),
    description: t('security.lowSecurityDescription'),
    icon: ShieldCheckIcon,
    config: {
      enableCSP: false,
      enableXSSProtection: true,
      enableInputValidation: true,
      enableContentFiltering: false,
      enableSecureHeaders: true,
      enableRateLimiting: false,
      maxRequestsPerMinute: 120,
      maxFileSize: 20
    }
  },
  {
    id: 'medium',
    level: 'medium',
    title: t('security.mediumSecurity'),
    description: t('security.mediumSecurityDescription'),
    icon: ShieldExclamationIcon,
    config: {
      enableCSP: true,
      enableXSSProtection: true,
      enableInputValidation: true,
      enableContentFiltering: true,
      enableSecureHeaders: true,
      enableRateLimiting: true,
      maxRequestsPerMinute: 60,
      maxFileSize: 10
    }
  },
  {
    id: 'high',
    level: 'high',
    title: t('security.highSecurity'),
    description: t('security.highSecurityDescription'),
    icon: FireIcon,
    config: {
      enableCSP: true,
      enableXSSProtection: true,
      enableInputValidation: true,
      enableContentFiltering: true,
      enableSecureHeaders: true,
      enableRateLimiting: true,
      maxRequestsPerMinute: 30,
      maxFileSize: 5
    }
  }
]

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(localConfig) !== JSON.stringify(originalConfig.value)
})

// 方法
const getPresetButtonClasses = (level: string): string[] => {
  const classes = [
    'preset-button',
    'flex',
    'flex-col',
    'items-center',
    'p-4',
    'border',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'hover:shadow-md',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2'
  ]
  
  switch (level) {
    case 'low':
      classes.push(
        'border-green-200',
        'hover:border-green-300',
        'hover:bg-green-50',
        'dark:border-green-800',
        'dark:hover:bg-green-900/20',
        'focus:ring-green-500'
      )
      break
    case 'medium':
      classes.push(
        'border-yellow-200',
        'hover:border-yellow-300',
        'hover:bg-yellow-50',
        'dark:border-yellow-800',
        'dark:hover:bg-yellow-900/20',
        'focus:ring-yellow-500'
      )
      break
    case 'high':
      classes.push(
        'border-red-200',
        'hover:border-red-300',
        'hover:bg-red-50',
        'dark:border-red-800',
        'dark:hover:bg-red-900/20',
        'focus:ring-red-500'
      )
      break
    default:
      classes.push(
        'border-gray-200',
        'hover:border-gray-300',
        'hover:bg-gray-50',
        'dark:border-gray-700',
        'dark:hover:bg-gray-800',
        'focus:ring-gray-500'
      )
  }
  
  return classes
}

const addBlockedDomain = (): void => {
  const domain = newBlockedDomain.value.trim().toLowerCase()
  if (domain && !localConfig.blockedDomains.includes(domain)) {
    localConfig.blockedDomains.push(domain)
    newBlockedDomain.value = ''
  }
}

const removeBlockedDomain = (index: number): void => {
  localConfig.blockedDomains.splice(index, 1)
}

const applyPreset = (preset: any): void => {
  Object.assign(localConfig, preset.config)
}

const resetToDefaults = (): void => {
  if (confirm(t('security.confirmReset'))) {
    Object.assign(localConfig, {
      enableCSP: true,
      enableXSSProtection: true,
      enableInputValidation: true,
      enableContentFiltering: true,
      enableSecureHeaders: true,
      enableRateLimiting: true,
      maxRequestsPerMinute: 60,
      blockedDomains: [],
      allowedFileTypes: [
        'image/png',
        'image/jpeg',
        'image/svg+xml',
        'application/pdf',
        'text/csv',
        'application/json'
      ],
      maxFileSize: 10
    })
  }
}

const handleOverlayClick = (): void => {
  emit('close')
}

const submitConfig = (): void => {
  if (!hasChanges.value) return
  
  emit('update', { ...localConfig })
}

// 生命周期
onMounted(() => {
  // 可以从props或服务中加载当前配置
  originalConfig.value = { ...localConfig }
})
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto;
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

.section-title {
  @apply text-md font-medium text-gray-900 dark:text-white mb-4;
}

.setting-label {
  @apply flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200;
}

.setting-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5;
}

.setting-content {
  @apply flex-1;
}

.setting-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.setting-description {
  @apply block text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.config-field-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.config-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.config-field-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-2;
}

.file-types-list {
  @apply grid grid-cols-2 md:grid-cols-3 gap-2 mt-2;
}

.file-type-label {
  @apply flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer;
}

.file-type-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.file-type-text {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.domain-input-group {
  @apply flex space-x-2;
}

.domain-input {
  @apply flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.add-domain-button {
  @apply px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.domains-list {
  @apply flex flex-wrap gap-2;
}

.domain-item {
  @apply flex items-center space-x-2 px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-full text-sm;
}

.domain-text {
  @apply font-medium;
}

.remove-domain-button {
  @apply text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 rounded-full p-0.5;
}

.preset-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.preset-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1 text-center;
}

.modal-actions {
  @apply flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700;
}

.action-buttons {
  @apply flex items-center space-x-3;
}

.reset-button {
  @apply px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500;
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
  
  .presets-grid {
    @apply grid-cols-1;
  }
  
  .file-types-list {
    @apply grid-cols-1;
  }
  
  .modal-actions {
    @apply flex-col space-y-3;
  }
  
  .action-buttons {
    @apply w-full justify-between;
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
