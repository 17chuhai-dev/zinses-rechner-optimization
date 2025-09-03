<!--
  主题切换组件
  提供简洁的主题切换按钮，支持浅色/暗色/自动模式
-->

<template>
  <div class="theme-toggle">
    <!-- 简单切换按钮 -->
    <BaseButton
      v-if="variant === 'simple'"
      :variant="buttonVariant"
      :size="size"
      @click="toggleTheme"
      :title="getToggleTitle()"
      class="theme-toggle-button"
    >
      <component
        :is="getCurrentIcon()"
        :class="iconClass"
      />
      <span v-if="showLabel" class="ml-2">
        {{ getCurrentLabel() }}
      </span>
    </BaseButton>

    <!-- 下拉菜单切换 -->
    <BaseDropdown
      v-else-if="variant === 'dropdown'"
      :placement="dropdownPlacement"
      class="theme-toggle-dropdown"
    >
      <template #trigger>
        <BaseButton
          :variant="buttonVariant"
          :size="size"
          :title="getToggleTitle()"
        >
          <component
            :is="getCurrentIcon()"
            :class="iconClass"
          />
          <span v-if="showLabel" class="ml-2">
            {{ getCurrentLabel() }}
          </span>
          <ChevronDownIcon class="w-4 h-4 ml-1" />
        </BaseButton>
      </template>

      <template #content>
        <div class="theme-options py-1">
          <button
            v-for="option in themeOptions"
            :key="option.mode"
            @click="setTheme(option.mode)"
            :class="[
              'flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
              currentMode === option.mode ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
            ]"
          >
            <component
              :is="option.icon"
              class="w-4 h-4 mr-3"
            />
            <div>
              <div class="font-medium">{{ option.label }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ option.description }}
              </div>
            </div>
            <CheckIcon
              v-if="currentMode === option.mode"
              class="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400"
            />
          </button>
        </div>
      </template>
    </BaseDropdown>

    <!-- 分段控制器 -->
    <div
      v-else-if="variant === 'segmented'"
      class="theme-toggle-segmented inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1"
    >
      <button
        v-for="option in themeOptions"
        :key="option.mode"
        @click="setTheme(option.mode)"
        :class="[
          'flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
          currentMode === option.mode
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        ]"
        :title="option.description"
      >
        <component
          :is="option.icon"
          class="w-4 h-4"
          :class="showLabel ? 'mr-2' : ''"
        />
        <span v-if="showLabel">{{ option.label }}</span>
      </button>
    </div>

    <!-- 滑动开关 -->
    <div
      v-else-if="variant === 'switch'"
      class="theme-toggle-switch flex items-center"
    >
      <SunIcon class="w-4 h-4 text-yellow-500 mr-3" />
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          :checked="isDark"
          @change="toggleTheme"
          class="sr-only"
        />
        <div :class="[
          'w-11 h-6 rounded-full transition-colors duration-200 ease-in-out',
          isDark ? 'bg-blue-600' : 'bg-gray-300'
        ]">
          <div :class="[
            'w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out',
            isDark ? 'translate-x-5' : 'translate-x-0'
          ]"></div>
        </div>
      </label>
      <MoonIcon class="w-4 h-4 text-blue-500 ml-3" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDropdown from '@/components/ui/BaseDropdown.vue'
import { useTheme } from '@/services/ThemeService'
import type { ThemeMode } from '@/services/ThemeService'

// Props
interface Props {
  variant?: 'simple' | 'dropdown' | 'segmented' | 'switch'
  size?: 'sm' | 'md' | 'lg'
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  showLabel?: boolean
  dropdownPlacement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'simple',
  size: 'md',
  buttonVariant: 'ghost',
  showLabel: false,
  dropdownPlacement: 'bottom-end'
})

// 使用主题服务
const {
  currentMode,
  effectiveMode,
  isDark,
  setThemeMode,
  toggleDarkMode
} = useTheme()

// 主题选项
const themeOptions = [
  {
    mode: 'light' as ThemeMode,
    label: 'Hell',
    description: 'Heller Modus für bessere Lesbarkeit bei Tag',
    icon: SunIcon
  },
  {
    mode: 'dark' as ThemeMode,
    label: 'Dunkel',
    description: 'Dunkler Modus schont die Augen bei Nacht',
    icon: MoonIcon
  },
  {
    mode: 'auto' as ThemeMode,
    label: 'Automatisch',
    description: 'Folgt den Systemeinstellungen',
    icon: ComputerDesktopIcon
  }
]

// 计算属性
const iconClass = computed(() => {
  const baseClass = 'transition-transform duration-200'
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[props.size]
  
  return `${baseClass} ${sizeClass}`
})

// 方法
const getCurrentIcon = () => {
  const option = themeOptions.find(opt => opt.mode === currentMode.value)
  return option?.icon || SunIcon
}

const getCurrentLabel = () => {
  const option = themeOptions.find(opt => opt.mode === currentMode.value)
  return option?.label || 'Thema'
}

const getToggleTitle = () => {
  if (currentMode.value === 'auto') {
    return `Automatischer Modus (aktuell: ${effectiveMode.value === 'dark' ? 'dunkel' : 'hell'})`
  }
  return `Zu ${effectiveMode.value === 'dark' ? 'hellem' : 'dunklem'} Modus wechseln`
}

const toggleTheme = () => {
  if (props.variant === 'switch') {
    // 滑动开关只在浅色和暗色之间切换
    toggleDarkMode()
  } else {
    // 其他变体循环切换所有模式
    const currentIndex = themeOptions.findIndex(opt => opt.mode === currentMode.value)
    const nextIndex = (currentIndex + 1) % themeOptions.length
    setThemeMode(themeOptions[nextIndex].mode)
  }
}

const setTheme = (mode: ThemeMode) => {
  setThemeMode(mode)
}
</script>

<style scoped>
.theme-toggle-button {
  @apply transition-all duration-200;
}

.theme-toggle-button:hover {
  @apply transform scale-105;
}

.theme-toggle-segmented button {
  @apply relative;
}

.theme-toggle-segmented button::before {
  @apply absolute inset-0 rounded-md transition-all duration-200 opacity-0;
  content: '';
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1));
}

.theme-toggle-segmented button:hover::before {
  @apply opacity-100;
}

.theme-toggle-switch input:focus + div {
  @apply ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900;
}

/* 主题过渡动画 */
:global(.theme-transitioning) * {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
}

/* 高对比度支持 */
:global(.high-contrast) .theme-toggle-button {
  @apply border-2 border-current;
}

/* 减少动画支持 */
:global(.reduced-motion) .theme-toggle-button,
:global(.reduced-motion) .theme-toggle-segmented button {
  @apply transition-none;
}

:global(.reduced-motion) .theme-toggle-switch div {
  @apply transition-none;
}

/* 大字体支持 */
:global(.large-text) .theme-toggle-segmented {
  @apply text-base;
}

:global(.large-text) .theme-options {
  @apply text-base;
}

/* 暗色模式特定样式 */
:global(.theme-dark) .theme-toggle-dropdown {
  @apply text-white;
}

:global(.theme-dark) .theme-options {
  @apply bg-gray-800 border-gray-700;
}

:global(.theme-dark) .theme-options button:hover {
  @apply bg-gray-700;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .theme-toggle-segmented {
    @apply text-xs;
  }
  
  .theme-toggle-segmented button {
    @apply px-2 py-1;
  }
}

/* 键盘导航支持 */
.theme-toggle-button:focus,
.theme-toggle-segmented button:focus,
.theme-options button:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

:global(.theme-dark) .theme-toggle-button:focus,
:global(.theme-dark) .theme-toggle-segmented button:focus,
:global(.theme-dark) .theme-options button:focus {
  @apply ring-offset-gray-900;
}

/* 动画效果 */
@keyframes theme-switch {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg); }
}

.theme-toggle-button:active .iconClass {
  animation: theme-switch 0.6s ease-in-out;
}

/* 无障碍增强 */
@media (prefers-reduced-motion: reduce) {
  .theme-toggle-button:active .iconClass {
    animation: none;
  }
}

/* 工具提示样式 */
.theme-toggle-button[title]:hover::after {
  content: attr(title);
  @apply absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded whitespace-nowrap z-50;
}

:global(.theme-dark) .theme-toggle-button[title]:hover::after {
  @apply bg-gray-100 text-gray-900;
}
</style>
