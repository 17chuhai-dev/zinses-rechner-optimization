<!--
  语言切换器组件
  提供用户友好的语言切换界面，支持实时切换和偏好保存
-->

<template>
  <div class="language-switcher">
    <!-- 下拉菜单版本 -->
    <div v-if="variant === 'dropdown'" class="dropdown-switcher">
      <button
        type="button"
        class="switcher-trigger"
        :class="{ 'switcher-open': isOpen }"
        @click="toggleDropdown"
        :aria-label="t('common.selectLanguage')"
      >
        <div class="current-language">
          <span class="language-flag">{{ currentConfig.flag }}</span>
          <span v-if="showLabel" class="language-name">{{ currentConfig.nativeName }}</span>
        </div>
        <svg
          class="dropdown-icon"
          :class="{ 'rotate-180': isOpen }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <Transition name="dropdown">
        <div v-if="isOpen" class="dropdown-menu">
          <button
            v-for="config in availableConfigs"
            :key="config.code"
            type="button"
            class="language-option"
            :class="{ 'language-active': config.code === locale }"
            @click="selectLanguage(config.code)"
          >
            <span class="language-flag">{{ config.flag }}</span>
            <div class="language-info">
              <span class="language-native">{{ config.nativeName }}</span>
              <span class="language-english">{{ config.name }}</span>
            </div>
            <svg
              v-if="config.code === locale"
              class="check-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </Transition>
    </div>
    
    <!-- 按钮组版本 -->
    <div v-else-if="variant === 'buttons'" class="button-group-switcher">
      <div class="button-group">
        <button
          v-for="config in availableConfigs"
          :key="config.code"
          type="button"
          class="language-button"
          :class="{ 'language-active': config.code === locale }"
          @click="selectLanguage(config.code)"
          :title="config.nativeName"
        >
          <span class="language-flag">{{ config.flag }}</span>
          <span v-if="showLabel" class="language-code">{{ config.code.toUpperCase() }}</span>
        </button>
      </div>
    </div>
    
    <!-- 标签页版本 -->
    <div v-else-if="variant === 'tabs'" class="tabs-switcher">
      <div class="tabs-container">
        <button
          v-for="config in availableConfigs"
          :key="config.code"
          type="button"
          class="tab-button"
          :class="{ 'tab-active': config.code === locale }"
          @click="selectLanguage(config.code)"
        >
          <span class="language-flag">{{ config.flag }}</span>
          <span class="language-name">{{ config.nativeName }}</span>
        </button>
      </div>
    </div>
    
    <!-- 紧凑版本 -->
    <div v-else class="compact-switcher">
      <button
        type="button"
        class="compact-trigger"
        @click="cycleLanguage"
        :title="`${t('common.currentLanguage')}: ${currentConfig.nativeName}`"
      >
        <span class="language-flag">{{ currentConfig.flag }}</span>
        <span class="language-code">{{ locale.toUpperCase() }}</span>
      </button>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/services/I18nService'
import type { SupportedLocale } from '@/services/I18nService'

interface Props {
  variant?: 'dropdown' | 'buttons' | 'tabs' | 'compact'
  showLabel?: boolean
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'dropdown',
  showLabel: true,
  size: 'medium'
})

// 使用i18n服务
const { locale, availableLocales, isLoading, t, setLocale, getAvailableLocaleConfigs } = useI18n()

// 响应式数据
const isOpen = ref(false)

// 计算属性
const availableConfigs = computed(() => getAvailableLocaleConfigs())
const currentConfig = computed(() => availableConfigs.value.find(config => config.code === locale.value)!)

// 方法
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectLanguage = async (newLocale: SupportedLocale) => {
  if (newLocale === locale.value) {
    isOpen.value = false
    return
  }
  
  try {
    await setLocale(newLocale)
    isOpen.value = false
    
    // 触发自定义事件
    emit('language-changed', newLocale)
  } catch (error) {
    console.error('切换语言失败:', error)
  }
}

const cycleLanguage = async () => {
  const currentIndex = availableLocales.value.indexOf(locale.value)
  const nextIndex = (currentIndex + 1) % availableLocales.value.length
  const nextLocale = availableLocales.value[nextIndex]
  
  await selectLanguage(nextLocale)
}

const closeDropdown = (event: Event) => {
  if (!(event.target as Element).closest('.dropdown-switcher')) {
    isOpen.value = false
  }
}

// 事件
const emit = defineEmits<{
  'language-changed': [locale: SupportedLocale]
}>()

// 生命周期
onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.language-switcher {
  @apply relative;
}

/* 下拉菜单样式 */
.dropdown-switcher {
  @apply relative;
}

.switcher-trigger {
  @apply flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 
         border border-gray-300 dark:border-gray-600 rounded-lg
         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
         focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.switcher-trigger.switcher-open {
  @apply ring-2 ring-blue-500;
}

.current-language {
  @apply flex items-center space-x-2;
}

.language-flag {
  @apply text-lg;
}

.language-name {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.dropdown-icon {
  @apply w-4 h-4 text-gray-500 transition-transform duration-200;
}

.dropdown-menu {
  @apply absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 
         border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg
         py-1 z-50 max-h-60 overflow-y-auto;
}

.language-option {
  @apply w-full flex items-center space-x-3 px-3 py-2 text-left
         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.language-option.language-active {
  @apply bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300;
}

.language-info {
  @apply flex-1 flex flex-col;
}

.language-native {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.language-english {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.check-icon {
  @apply w-4 h-4 text-blue-600 dark:text-blue-400;
}

/* 按钮组样式 */
.button-group-switcher {
  @apply inline-flex;
}

.button-group {
  @apply flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1;
}

.language-button {
  @apply flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors
         text-sm font-medium text-gray-600 dark:text-gray-400
         hover:text-gray-900 dark:hover:text-white;
}

.language-button.language-active {
  @apply bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm;
}

.language-code {
  @apply text-xs font-bold;
}

/* 标签页样式 */
.tabs-switcher {
  @apply w-full;
}

.tabs-container {
  @apply flex border-b border-gray-200 dark:border-gray-700;
}

.tab-button {
  @apply flex items-center space-x-2 px-4 py-2 border-b-2 border-transparent
         text-sm font-medium text-gray-500 dark:text-gray-400
         hover:text-gray-700 dark:hover:text-gray-300
         hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
}

.tab-button.tab-active {
  @apply border-blue-500 text-blue-600 dark:text-blue-400;
}

/* 紧凑样式 */
.compact-switcher {
  @apply inline-flex;
}

.compact-trigger {
  @apply flex items-center space-x-1 px-2 py-1 rounded-md
         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
         text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors;
}

/* 加载状态 */
.loading-overlay {
  @apply absolute inset-0 bg-white/50 dark:bg-gray-800/50 
         flex items-center justify-center rounded-lg;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin;
}

/* 过渡动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  @apply transition-all duration-200;
}

.dropdown-enter-from,
.dropdown-leave-to {
  @apply opacity-0 transform scale-95;
}

.dropdown-enter-to,
.dropdown-leave-from {
  @apply opacity-100 transform scale-100;
}

/* 尺寸变体 */
.language-switcher[data-size="small"] .switcher-trigger {
  @apply px-2 py-1 text-sm;
}

.language-switcher[data-size="small"] .language-flag {
  @apply text-base;
}

.language-switcher[data-size="large"] .switcher-trigger {
  @apply px-4 py-3 text-base;
}

.language-switcher[data-size="large"] .language-flag {
  @apply text-xl;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .dropdown-menu {
    @apply w-40;
  }
  
  .language-english {
    @apply hidden;
  }
  
  .tabs-container {
    @apply overflow-x-auto;
  }
  
  .tab-button {
    @apply whitespace-nowrap;
  }
}

/* 深色模式优化 */
@media (prefers-color-scheme: dark) {
  .switcher-trigger {
    @apply border-gray-600 bg-gray-800;
  }
  
  .dropdown-menu {
    @apply bg-gray-800 border-gray-700;
  }
  
  .language-option.language-active {
    @apply bg-blue-900/30;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .switcher-trigger {
    @apply border-2 border-gray-900 dark:border-white;
  }
  
  .language-option.language-active {
    @apply bg-blue-600 text-white;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .dropdown-icon,
  .dropdown-enter-active,
  .dropdown-leave-active,
  .language-button,
  .tab-button,
  .compact-trigger {
    @apply transition-none;
  }
  
  .loading-spinner {
    @apply animate-none;
  }
}
</style>
