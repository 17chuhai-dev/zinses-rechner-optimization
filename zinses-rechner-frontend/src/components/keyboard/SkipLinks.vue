<!--
  跳转链接组件
  为键盘用户提供快速跳转到主要内容区域的链接
-->

<template>
  <nav class="skip-links" aria-label="Schnellnavigation">
    <ul class="skip-links-list">
      <li
        v-for="link in skipLinks"
        :key="link.id"
        class="skip-link-item"
      >
        <a
          :href="link.href"
          :class="[
            'skip-link',
            link.priority === 'high' ? 'skip-link-primary' : 'skip-link-secondary'
          ]"
          @click="handleSkipLinkClick(link, $event)"
          @keydown="handleKeydown($event)"
        >
          <component
            v-if="link.icon"
            :is="link.icon"
            class="skip-link-icon"
            aria-hidden="true"
          />
          {{ link.text }}
          <span v-if="link.shortcut" class="skip-link-shortcut">
            ({{ formatShortcut(link.shortcut) }})
          </span>
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  DocumentTextIcon,
  CalculatorIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  HomeIcon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'
import { useKeyboardNavigation } from '@/services/KeyboardNavigationService'

// 跳转链接配置接口
interface SkipLink {
  id: string
  text: string
  href: string
  target?: string
  priority: 'high' | 'medium' | 'low'
  icon?: any
  shortcut?: string
  condition?: () => boolean
}

// Props
interface Props {
  showIcons?: boolean
  showShortcuts?: boolean
  customLinks?: SkipLink[]
}

const props = withDefaults(defineProps<Props>(), {
  showIcons: true,
  showShortcuts: true,
  customLinks: () => []
})

// 使用键盘导航服务
const { jumpToElement, registerShortcut } = useKeyboardNavigation()

// 默认跳转链接
const defaultSkipLinks: SkipLink[] = [
  {
    id: 'main-content',
    text: 'Zum Hauptinhalt springen',
    href: '#main-content',
    target: '[role="main"], main, #main-content, .main-content',
    priority: 'high',
    icon: DocumentTextIcon,
    shortcut: 'Alt+1'
  },
  {
    id: 'calculator',
    text: 'Zum Rechner springen',
    href: '#calculator',
    target: '.calculator-form, #calculator, [data-calculator]',
    priority: 'high',
    icon: CalculatorIcon,
    shortcut: 'Alt+2',
    condition: () => !!document.querySelector('.calculator-form, #calculator, [data-calculator]')
  },
  {
    id: 'results',
    text: 'Zu den Ergebnissen springen',
    href: '#results',
    target: '.results-section, #results, [data-results]',
    priority: 'high',
    icon: ChartBarIcon,
    shortcut: 'Alt+3',
    condition: () => !!document.querySelector('.results-section, #results, [data-results]')
  },
  {
    id: 'navigation',
    text: 'Zur Navigation springen',
    href: '#navigation',
    target: 'nav, [role="navigation"], .navigation, #navigation',
    priority: 'medium',
    icon: HomeIcon,
    shortcut: 'Alt+N'
  },
  {
    id: 'search',
    text: 'Zur Suche springen',
    href: '#search',
    target: '[role="search"], .search, #search, input[type="search"]',
    priority: 'medium',
    icon: MagnifyingGlassIcon,
    shortcut: 'Alt+S',
    condition: () => !!document.querySelector('[role="search"], .search, #search, input[type="search"]')
  },
  {
    id: 'settings',
    text: 'Zu den Einstellungen springen',
    href: '#settings',
    target: '.settings, #settings, [data-settings]',
    priority: 'low',
    icon: Cog6ToothIcon,
    shortcut: 'Alt+E',
    condition: () => !!document.querySelector('.settings, #settings, [data-settings]')
  },
  {
    id: 'help',
    text: 'Zur Hilfe springen',
    href: '#help',
    target: '.help, #help, [data-help]',
    priority: 'low',
    icon: QuestionMarkCircleIcon,
    shortcut: 'Alt+H',
    condition: () => !!document.querySelector('.help, #help, [data-help]')
  }
]

// 计算属性
const skipLinks = computed(() => {
  const allLinks = [...defaultSkipLinks, ...props.customLinks]
  
  return allLinks
    .filter(link => !link.condition || link.condition())
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
})

// 方法
const handleSkipLinkClick = (link: SkipLink, event: Event) => {
  event.preventDefault()
  
  const targetElement = findTargetElement(link)
  if (targetElement) {
    // 设置焦点到目标元素
    jumpToElement(link.target || link.href.substring(1))
    
    // 滚动到目标元素
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
    
    // 添加临时高亮效果
    highlightElement(targetElement)
    
    // 触发自定义事件
    const skipEvent = new CustomEvent('skip-link-activated', {
      detail: { link, targetElement }
    })
    document.dispatchEvent(skipEvent)
  }
}

const findTargetElement = (link: SkipLink): HTMLElement | null => {
  if (link.target) {
    // 尝试多个选择器
    const selectors = link.target.split(', ')
    for (const selector of selectors) {
      const element = document.querySelector(selector.trim()) as HTMLElement
      if (element) return element
    }
  }
  
  // 回退到href
  const id = link.href.substring(1)
  return document.getElementById(id)
}

const highlightElement = (element: HTMLElement) => {
  // 添加高亮类
  element.classList.add('skip-target-highlight')
  
  // 2秒后移除高亮
  setTimeout(() => {
    element.classList.remove('skip-target-highlight')
  }, 2000)
}

const handleKeydown = (event: KeyboardEvent) => {
  // 处理特殊键盘事件
  if (event.key === 'Enter' || event.key === ' ') {
    // Enter和空格键激活链接
    event.preventDefault()
    ;(event.target as HTMLElement).click()
  }
}

const formatShortcut = (shortcut: string): string => {
  // 格式化快捷键显示
  return shortcut.replace(/Alt\+/g, 'Alt + ')
                .replace(/Ctrl\+/g, 'Strg + ')
                .replace(/Shift\+/g, 'Umschalt + ')
}

// 注册快捷键
const registerSkipLinkShortcuts = () => {
  skipLinks.value.forEach(link => {
    if (link.shortcut) {
      const [modifier, key] = link.shortcut.split('+')
      
      registerShortcut({
        key: key,
        altKey: modifier === 'Alt',
        ctrlKey: modifier === 'Ctrl',
        shiftKey: modifier === 'Shift',
        description: link.text,
        action: () => {
          const targetElement = findTargetElement(link)
          if (targetElement) {
            jumpToElement(link.target || link.href.substring(1))
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
            highlightElement(targetElement)
          }
        },
        category: 'navigation'
      })
    }
  })
}

// 生命周期
onMounted(() => {
  registerSkipLinkShortcuts()
})
</script>

<style scoped>
.skip-links {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9999;
}

.skip-links-list {
  @apply list-none m-0 p-0;
}

.skip-link-item {
  @apply m-0 p-0;
}

.skip-link {
  @apply absolute left-0 top-0 px-4 py-2 text-sm font-medium;
  @apply bg-blue-600 text-white border-2 border-blue-700 rounded-br-md;
  @apply transform -translate-y-full transition-transform duration-200;
  @apply focus:translate-y-0 focus:outline-none;
  @apply flex items-center space-x-2;
  @apply shadow-lg;
  
  /* 确保在所有元素之上 */
  z-index: 10000;
}

.skip-link:focus {
  @apply translate-y-0;
}

.skip-link-primary {
  @apply bg-blue-600 border-blue-700;
}

.skip-link-secondary {
  @apply bg-gray-600 border-gray-700;
}

.skip-link-icon {
  @apply w-4 h-4 flex-shrink-0;
}

.skip-link-shortcut {
  @apply text-xs opacity-75 ml-2;
}

/* 高对比度模式支持 */
:global(.high-contrast) .skip-link {
  @apply border-4 border-current;
  filter: contrast(2);
}

/* 大字体模式支持 */
:global(.large-text) .skip-link {
  @apply text-base px-6 py-3;
}

/* 减少动画模式支持 */
:global(.reduced-motion) .skip-link {
  @apply transition-none;
}

/* 跳转目标高亮效果 */
:global(.skip-target-highlight) {
  @apply ring-4 ring-blue-500 ring-opacity-50;
  animation: skip-highlight 2s ease-out;
}

@keyframes skip-highlight {
  0% {
    @apply ring-opacity-100;
    transform: scale(1.02);
  }
  100% {
    @apply ring-opacity-0;
    transform: scale(1);
  }
}

/* 暗色模式支持 */
:global(.theme-dark) .skip-link {
  @apply bg-blue-500 border-blue-400 text-white;
}

:global(.theme-dark) .skip-link-secondary {
  @apply bg-gray-700 border-gray-600;
}

/* 打印时隐藏 */
@media print {
  .skip-links {
    @apply hidden;
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .skip-link {
    @apply text-xs px-3 py-1.5;
  }
  
  .skip-link-icon {
    @apply w-3 h-3;
  }
}

/* 键盘导航增强 */
.skip-link:focus-visible {
  @apply ring-2 ring-white ring-offset-2 ring-offset-blue-600;
}

/* 无障碍增强 */
@media (prefers-reduced-motion: reduce) {
  .skip-link {
    @apply transition-none;
  }
  
  :global(.skip-target-highlight) {
    animation: none;
    @apply ring-4 ring-blue-500 ring-opacity-50;
  }
}

/* 确保跳转链接在所有情况下都可见 */
.skip-link:focus,
.skip-link:active {
  @apply translate-y-0 opacity-100;
  clip: auto;
  height: auto;
  width: auto;
  overflow: visible;
}

/* 多个跳转链接的布局 */
.skip-link-item:nth-child(n+2) .skip-link {
  @apply ml-0;
  left: 0;
}

.skip-link-item:nth-child(2) .skip-link:focus {
  top: 2.5rem;
}

.skip-link-item:nth-child(3) .skip-link:focus {
  top: 5rem;
}

.skip-link-item:nth-child(4) .skip-link:focus {
  top: 7.5rem;
}

.skip-link-item:nth-child(5) .skip-link:focus {
  top: 10rem;
}

/* 确保跳转链接不会被其他元素遮挡 */
.skip-link {
  position: fixed !important;
}
</style>
