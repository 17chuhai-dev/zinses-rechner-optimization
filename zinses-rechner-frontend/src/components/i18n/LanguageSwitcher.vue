<!--
  语言切换器组件
  提供语言选择界面，虽然目前只支持德语，但为未来扩展做好准备
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 下拉菜单模式 -->
    <div v-if="variant === 'dropdown'" class="language-dropdown">
      <button
        ref="dropdownButton"
        :class="buttonClasses"
        @click="toggleDropdown"
        @keydown="handleKeydown"
        :aria-expanded="isOpen"
        :aria-haspopup="true"
        :aria-label="buttonAriaLabel"
      >
        <span class="current-language">
          <span class="language-flag">{{ currentConfig.flag }}</span>
          <span v-if="showLanguageName" class="language-name">
            {{ showNativeName ? currentConfig.nativeName : currentConfig.name }}
          </span>
        </span>
        <ChevronDownIcon :class="['chevron-icon', { 'rotate-180': isOpen }]" />
      </button>

      <!-- 下拉菜单 -->
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownMenu"
          :class="menuClasses"
          role="menu"
          :aria-labelledby="dropdownButton?.id"
        >
          <button
            v-for="config in availableConfigs"
            :key="config.code"
            :class="getMenuItemClasses(config.code)"
            role="menuitem"
            @click="selectLanguage(config.code)"
            @keydown="handleMenuKeydown($event, config.code)"
            :aria-current="config.code === locale ? 'true' : 'false'"
          >
            <span class="language-flag">{{ config.flag }}</span>
            <span class="language-name">
              {{ showNativeName ? config.nativeName : config.name }}
            </span>
            <CheckIcon
              v-if="config.code === locale"
              class="w-4 h-4 text-green-600 dark:text-green-400"
            />
          </button>
        </div>
      </Transition>
    </div>

    <!-- 按钮组模式 -->
    <div v-else-if="variant === 'buttons'" class="language-buttons">
      <button
        v-for="config in availableConfigs"
        :key="config.code"
        :class="getButtonClasses(config.code)"
        @click="selectLanguage(config.code)"
        :aria-pressed="config.code === locale"
        :aria-label="`${t('common.switchTo')} ${config.nativeName}`"
        :title="config.nativeName"
      >
        <span class="language-flag">{{ config.flag }}</span>
        <span v-if="showLanguageName" class="language-name">
          {{ showNativeName ? config.nativeName : config.name }}
        </span>
      </button>
    </div>

    <!-- 标签页模式 -->
    <div v-else-if="variant === 'tabs'" class="language-tabs">
      <div class="tab-list" role="tablist" :aria-label="t('common.languageSelection')">
        <button
          v-for="config in availableConfigs"
          :key="config.code"
          :class="getTabClasses(config.code)"
          role="tab"
          :aria-selected="config.code === locale"
          :aria-controls="`panel-${config.code}`"
          @click="selectLanguage(config.code)"
        >
          <span class="language-flag">{{ config.flag }}</span>
          <span v-if="showLanguageName" class="language-name">
            {{ showNativeName ? config.nativeName : config.name }}
          </span>
        </button>
      </div>
    </div>

    <!-- 简单图标模式 -->
    <div v-else class="language-icon">
      <button
        :class="iconButtonClasses"
        @click="cycleLanguage"
        :aria-label="buttonAriaLabel"
        :title="currentConfig.nativeName"
      >
        <span class="language-flag">{{ currentConfig.flag }}</span>
      </button>
    </div>

    <!-- 加载指示器 -->
    <div v-if="isLoading" class="loading-indicator">
      <div class="loading-spinner"></div>
    </div>

    <!-- 屏幕阅读器文本 -->
    <span class="sr-only">
      {{ t('common.currentLanguage') }}: {{ currentConfig.nativeName }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronDownIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'
import type { SupportedLocale } from '@/services/I18nService'

// Props
interface Props {
  // 显示模式
  variant?: 'dropdown' | 'buttons' | 'tabs' | 'icon'
  
  // 显示选项
  showLanguageName?: boolean
  showNativeName?: boolean
  
  // 样式选项
  size?: 'sm' | 'md' | 'lg'
  position?: 'left' | 'right' | 'center'
  
  // 自定义样式
  customClasses?: string | string[]
  
  // 无障碍
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'dropdown',
  showLanguageName: true,
  showNativeName: true,
  size: 'md',
  position: 'left'
})

// 使用i18n服务
const {
  locale,
  availableLocales,
  isLoading,
  t,
  setLocale,
  getCurrentLocaleConfig,
  getAvailableLocaleConfigs
} = useI18n()

// 响应式状态
const isOpen = ref(false)
const dropdownButton = ref<HTMLButtonElement>()
const dropdownMenu = ref<HTMLDivElement>()

// 计算属性
const currentConfig = computed(() => getCurrentLocaleConfig())
const availableConfigs = computed(() => getAvailableLocaleConfigs())

const containerClasses = computed(() => {
  const classes = ['language-switcher', 'relative']
  
  // 位置
  if (props.position === 'right') {
    classes.push('text-right')
  } else if (props.position === 'center') {
    classes.push('text-center')
  }
  
  // 自定义类
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  return classes
})

const buttonClasses = computed(() => {
  const classes = [
    'language-button',
    'flex',
    'items-center',
    'space-x-2',
    'px-3',
    'py-2',
    'text-sm',
    'font-medium',
    'text-gray-700',
    'dark:text-gray-300',
    'bg-white',
    'dark:bg-gray-800',
    'border',
    'border-gray-300',
    'dark:border-gray-600',
    'rounded-md',
    'hover:bg-gray-50',
    'dark:hover:bg-gray-700',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'focus:border-blue-500',
    'transition-colors',
    'duration-200'
  ]
  
  // 大小
  const sizeMap = {
    sm: ['text-xs', 'px-2', 'py-1'],
    md: ['text-sm', 'px-3', 'py-2'],
    lg: ['text-base', 'px-4', 'py-3']
  }
  classes.push(...sizeMap[props.size])
  
  return classes
})

const menuClasses = computed(() => {
  const classes = [
    'language-menu',
    'absolute',
    'z-50',
    'mt-1',
    'w-48',
    'bg-white',
    'dark:bg-gray-800',
    'border',
    'border-gray-300',
    'dark:border-gray-600',
    'rounded-md',
    'shadow-lg',
    'py-1',
    'max-h-60',
    'overflow-auto'
  ]
  
  // 位置
  if (props.position === 'right') {
    classes.push('right-0')
  } else {
    classes.push('left-0')
  }
  
  return classes
})

const iconButtonClasses = computed(() => {
  const classes = [
    'icon-button',
    'flex',
    'items-center',
    'justify-center',
    'w-10',
    'h-10',
    'text-lg',
    'bg-white',
    'dark:bg-gray-800',
    'border',
    'border-gray-300',
    'dark:border-gray-600',
    'rounded-full',
    'hover:bg-gray-50',
    'dark:hover:bg-gray-700',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'transition-colors',
    'duration-200'
  ]
  
  return classes
})

const ariaLabel = computed(() => {
  return props.ariaLabel || t('common.languageSelection')
})

const buttonAriaLabel = computed(() => {
  if (props.variant === 'dropdown') {
    return `${t('common.currentLanguage')}: ${currentConfig.value.nativeName}. ${t('common.clickToChange')}`
  } else {
    return `${t('common.switchLanguage')}: ${currentConfig.value.nativeName}`
  }
})

// 方法
const getMenuItemClasses = (langCode: SupportedLocale): string[] => {
  const classes = [
    'menu-item',
    'flex',
    'items-center',
    'justify-between',
    'w-full',
    'px-4',
    'py-2',
    'text-sm',
    'text-left',
    'hover:bg-gray-100',
    'dark:hover:bg-gray-700',
    'focus:outline-none',
    'focus:bg-gray-100',
    'dark:focus:bg-gray-700',
    'transition-colors',
    'duration-150'
  ]
  
  if (langCode === locale.value) {
    classes.push('bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-700', 'dark:text-blue-300')
  } else {
    classes.push('text-gray-900', 'dark:text-gray-100')
  }
  
  return classes
}

const getButtonClasses = (langCode: SupportedLocale): string[] => {
  const classes = [
    'language-button',
    'flex',
    'items-center',
    'space-x-2',
    'px-3',
    'py-2',
    'text-sm',
    'font-medium',
    'border',
    'rounded-md',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500'
  ]
  
  if (langCode === locale.value) {
    classes.push(
      'bg-blue-600',
      'text-white',
      'border-blue-600',
      'hover:bg-blue-700'
    )
  } else {
    classes.push(
      'bg-white',
      'dark:bg-gray-800',
      'text-gray-700',
      'dark:text-gray-300',
      'border-gray-300',
      'dark:border-gray-600',
      'hover:bg-gray-50',
      'dark:hover:bg-gray-700'
    )
  }
  
  return classes
}

const getTabClasses = (langCode: SupportedLocale): string[] => {
  const classes = [
    'tab-button',
    'flex',
    'items-center',
    'space-x-2',
    'px-4',
    'py-2',
    'text-sm',
    'font-medium',
    'border-b-2',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500'
  ]
  
  if (langCode === locale.value) {
    classes.push(
      'text-blue-600',
      'dark:text-blue-400',
      'border-blue-600',
      'dark:border-blue-400'
    )
  } else {
    classes.push(
      'text-gray-500',
      'dark:text-gray-400',
      'border-transparent',
      'hover:text-gray-700',
      'dark:hover:text-gray-300',
      'hover:border-gray-300',
      'dark:hover:border-gray-600'
    )
  }
  
  return classes
}

const toggleDropdown = (): void => {
  isOpen.value = !isOpen.value
  
  if (isOpen.value) {
    nextTick(() => {
      // 聚焦到第一个菜单项
      const firstItem = dropdownMenu.value?.querySelector('[role="menuitem"]') as HTMLElement
      firstItem?.focus()
    })
  }
}

const selectLanguage = async (langCode: SupportedLocale): Promise<void> => {
  if (langCode === locale.value) {
    isOpen.value = false
    return
  }
  
  try {
    await setLocale(langCode)
    isOpen.value = false
    
    // 通知语言变更
    const event = new CustomEvent('language-changed', {
      detail: { locale: langCode }
    })
    window.dispatchEvent(event)
  } catch (error) {
    console.error('Failed to change language:', error)
  }
}

const cycleLanguage = (): void => {
  const currentIndex = availableLocales.value.indexOf(locale.value)
  const nextIndex = (currentIndex + 1) % availableLocales.value.length
  const nextLocale = availableLocales.value[nextIndex]
  
  selectLanguage(nextLocale)
}

const handleKeydown = (event: KeyboardEvent): void => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      toggleDropdown()
      break
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault()
        isOpen.value = false
        dropdownButton.value?.focus()
      }
      break
    case 'ArrowDown':
      if (!isOpen.value) {
        event.preventDefault()
        toggleDropdown()
      }
      break
  }
}

const handleMenuKeydown = (event: KeyboardEvent, langCode: SupportedLocale): void => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectLanguage(langCode)
      break
    case 'Escape':
      event.preventDefault()
      isOpen.value = false
      dropdownButton.value?.focus()
      break
    case 'ArrowDown':
      event.preventDefault()
      focusNextMenuItem(event.target as HTMLElement)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusPreviousMenuItem(event.target as HTMLElement)
      break
  }
}

const focusNextMenuItem = (currentItem: HTMLElement): void => {
  const menuItems = Array.from(dropdownMenu.value?.querySelectorAll('[role="menuitem"]') || [])
  const currentIndex = menuItems.indexOf(currentItem)
  const nextIndex = (currentIndex + 1) % menuItems.length
  ;(menuItems[nextIndex] as HTMLElement)?.focus()
}

const focusPreviousMenuItem = (currentItem: HTMLElement): void => {
  const menuItems = Array.from(dropdownMenu.value?.querySelectorAll('[role="menuitem"]') || [])
  const currentIndex = menuItems.indexOf(currentItem)
  const previousIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1
  ;(menuItems[previousIndex] as HTMLElement)?.focus()
}

const handleClickOutside = (event: Event): void => {
  const target = event.target as HTMLElement
  if (!dropdownButton.value?.contains(target) && !dropdownMenu.value?.contains(target)) {
    isOpen.value = false
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.language-switcher {
  @apply inline-block;
}

.current-language {
  @apply flex items-center space-x-2;
}

.language-flag {
  @apply text-lg leading-none;
}

.language-name {
  @apply truncate;
}

.chevron-icon {
  @apply w-4 h-4 transition-transform duration-200;
}

.language-buttons {
  @apply flex space-x-2;
}

.language-tabs {
  @apply border-b border-gray-200 dark:border-gray-700;
}

.tab-list {
  @apply flex space-x-8;
}

.loading-indicator {
  @apply absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75 rounded-md;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin;
}

/* 屏幕阅读器专用 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 下拉菜单过渡动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* 高对比度模式支持 */
:global(.high-contrast) .language-button {
  @apply border-2 border-current;
}

:global(.high-contrast) .language-menu {
  @apply border-2 border-current;
}

/* 大字体模式支持 */
:global(.large-text) .language-switcher {
  @apply text-lg;
}

:global(.large-text) .language-flag {
  @apply text-xl;
}

/* 减少动画模式支持 */
:global(.reduced-motion) .chevron-icon,
:global(.reduced-motion) .loading-spinner {
  @apply transition-none animate-none;
}

/* 暗色模式支持 */
:global(.theme-dark) .language-button {
  @apply bg-gray-800 border-gray-600 text-gray-300;
}

:global(.theme-dark) .language-menu {
  @apply bg-gray-800 border-gray-600;
}

/* 打印样式 */
@media print {
  .language-switcher {
    @apply hidden;
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .language-buttons {
    @apply flex-col space-x-0 space-y-2;
  }
  
  .tab-list {
    @apply space-x-4;
  }
  
  .language-menu {
    @apply w-full;
  }
}

/* 动画性能优化 */
.chevron-icon {
  will-change: transform;
}

.dropdown-enter-active,
.dropdown-leave-active {
  will-change: opacity, transform;
}

/* 无障碍增强 */
.language-button:focus,
.menu-item:focus,
.tab-button:focus,
.icon-button:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

:global(.theme-dark) .language-button:focus,
:global(.theme-dark) .menu-item:focus,
:global(.theme-dark) .tab-button:focus,
:global(.theme-dark) .icon-button:focus {
  @apply ring-offset-gray-900;
}

/* RTL支持 */
:global([dir="rtl"]) .current-language {
  @apply flex-row-reverse;
}

:global([dir="rtl"]) .language-menu {
  @apply right-auto left-0;
}

:global([dir="rtl"]) .chevron-icon {
  @apply rotate-180;
}

:global([dir="rtl"]) .chevron-icon.rotate-180 {
  @apply rotate-0;
}
</style>
