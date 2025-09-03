<!--
  键盘快捷键帮助组件
  显示所有可用的键盘快捷键和使用说明
-->

<template>
  <BaseDialog
    :open="isOpen"
    @close="$emit('close')"
    title="Tastenkürzel"
    size="lg"
    class="keyboard-shortcuts-help"
  >
    <div class="shortcuts-content">
      <!-- 搜索框 -->
      <div class="search-section mb-6">
        <BaseInput
          v-model="searchQuery"
          type="text"
          placeholder="Tastenkürzel suchen..."
          prefix-icon="search"
          class="w-full"
        />
      </div>

      <!-- 快捷键分类 -->
      <div class="categories-tabs mb-6">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="selectedCategory = category.id"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
          >
            <component :is="category.icon" class="w-4 h-4 inline mr-2" />
            {{ category.name }}
            <span class="ml-2 text-xs opacity-75">
              ({{ getCategoryShortcuts(category.id).length }})
            </span>
          </button>
        </div>
      </div>

      <!-- 快捷键列表 -->
      <div class="shortcuts-list space-y-4">
        <div
          v-for="category in visibleCategories"
          :key="category.id"
          class="category-section"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <component :is="category.icon" class="w-5 h-5 mr-2" />
            {{ category.name }}
          </h3>
          
          <div class="shortcuts-grid grid gap-3">
            <div
              v-for="shortcut in getCategoryShortcuts(category.id)"
              :key="getShortcutKey(shortcut)"
              :class="[
                'shortcut-item p-4 border rounded-lg transition-all duration-200',
                'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600',
                shortcut.enabled 
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60'
              ]"
            >
              <div class="flex items-center justify-between">
                <div class="shortcut-info flex-1">
                  <div class="shortcut-keys flex items-center mb-2">
                    <div class="key-combination flex items-center space-x-1">
                      <kbd
                        v-if="shortcut.ctrlKey"
                        class="key-badge"
                      >
                        {{ isMac ? '⌘' : 'Strg' }}
                      </kbd>
                      <kbd
                        v-if="shortcut.altKey"
                        class="key-badge"
                      >
                        {{ isMac ? '⌥' : 'Alt' }}
                      </kbd>
                      <kbd
                        v-if="shortcut.shiftKey"
                        class="key-badge"
                      >
                        {{ isMac ? '⇧' : 'Umschalt' }}
                      </kbd>
                      <kbd
                        v-if="shortcut.metaKey"
                        class="key-badge"
                      >
                        {{ isMac ? '⌘' : 'Win' }}
                      </kbd>
                      <span
                        v-if="hasModifiers(shortcut)"
                        class="text-gray-400 dark:text-gray-500 mx-1"
                      >
                        +
                      </span>
                      <kbd class="key-badge key-primary">
                        {{ formatKey(shortcut.key) }}
                      </kbd>
                    </div>
                  </div>
                  
                  <div class="shortcut-description">
                    <p class="text-sm text-gray-700 dark:text-gray-300">
                      {{ shortcut.description }}
                    </p>
                  </div>
                </div>
                
                <div class="shortcut-status ml-4">
                  <div
                    v-if="!shortcut.enabled"
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >
                    Deaktiviert
                  </div>
                  <button
                    v-else
                    @click="testShortcut(shortcut)"
                    class="test-button text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    title="Tastenkürzel testen"
                  >
                    Testen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="filteredShortcuts.length === 0"
        class="empty-state text-center py-12"
      >
        <MagnifyingGlassIcon class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Keine Tastenkürzel gefunden
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Versuchen Sie einen anderen Suchbegriff oder wählen Sie eine andere Kategorie.
        </p>
      </div>

      <!-- 帮助提示 -->
      <div class="help-tips mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          <InformationCircleIcon class="w-4 h-4 inline mr-1" />
          Tipps zur Verwendung
        </h4>
        <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Drücken Sie <kbd class="key-badge-small">Strg + K</kbd>, um diese Hilfe jederzeit zu öffnen</li>
          <li>• Verwenden Sie <kbd class="key-badge-small">Tab</kbd> und <kbd class="key-badge-small">Umschalt + Tab</kbd> zur Navigation</li>
          <li>• <kbd class="key-badge-small">Esc</kbd> schließt Dialoge und bricht Aktionen ab</li>
          <li>• Alle Tastenkürzel funktionieren auch bei aktiviertem Screenreader</li>
        </ul>
      </div>

      <!-- 自定义快捷键提示 -->
      <div class="customization-hint mt-4 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Möchten Sie eigene Tastenkürzel definieren? 
          <button
            @click="$emit('customize')"
            class="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Zu den Einstellungen
          </button>
        </p>
      </div>
    </div>

    <!-- 对话框操作 -->
    <template #actions>
      <div class="flex justify-between items-center w-full">
        <BaseButton
          variant="outline"
          @click="printShortcuts"
        >
          <PrinterIcon class="w-4 h-4 mr-2" />
          Drucken
        </BaseButton>
        
        <div class="space-x-3">
          <BaseButton
            variant="outline"
            @click="resetToDefaults"
          >
            Zurücksetzen
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="$emit('close')"
          >
            Schließen
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  MagnifyingGlassIcon,
  InformationCircleIcon,
  PrinterIcon,
  CommandLineIcon,
  CalculatorIcon,
  ArrowDownTrayIcon,
  CogIcon
} from '@heroicons/vue/24/outline'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useKeyboardNavigation } from '@/services/KeyboardNavigationService'
import type { ShortcutConfig } from '@/services/KeyboardNavigationService'

// Props
interface Props {
  isOpen: boolean
}

defineProps<Props>()

// Emits
defineEmits<{
  close: []
  customize: []
}>()

// 使用键盘导航服务
const { getShortcuts, getShortcutsByCategory } = useKeyboardNavigation()

// 响应式数据
const searchQuery = ref('')
const selectedCategory = ref<string>('all')

// 检测操作系统
const isMac = computed(() => {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
})

// 快捷键分类
const categories = [
  {
    id: 'all',
    name: 'Alle',
    icon: CommandLineIcon
  },
  {
    id: 'navigation',
    name: 'Navigation',
    icon: CommandLineIcon
  },
  {
    id: 'calculation',
    name: 'Berechnung',
    icon: CalculatorIcon
  },
  {
    id: 'export',
    name: 'Export',
    icon: ArrowDownTrayIcon
  },
  {
    id: 'general',
    name: 'Allgemein',
    icon: CogIcon
  }
]

// 计算属性
const allShortcuts = computed(() => getShortcuts())

const filteredShortcuts = computed(() => {
  let shortcuts = allShortcuts.value

  // 按类别筛选
  if (selectedCategory.value !== 'all') {
    shortcuts = getShortcutsByCategory(selectedCategory.value as ShortcutConfig['category'])
  }

  // 按搜索查询筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    shortcuts = shortcuts.filter(shortcut =>
      shortcut.description.toLowerCase().includes(query) ||
      shortcut.key.toLowerCase().includes(query) ||
      getShortcutKey(shortcut).toLowerCase().includes(query)
    )
  }

  return shortcuts
})

const visibleCategories = computed(() => {
  if (selectedCategory.value === 'all') {
    return categories.slice(1) // 排除 'all' 类别
  } else {
    return categories.filter(cat => cat.id === selectedCategory.value)
  }
})

// 方法
const getCategoryShortcuts = (categoryId: string) => {
  if (categoryId === 'all') {
    return filteredShortcuts.value
  }
  return filteredShortcuts.value.filter(shortcut => shortcut.category === categoryId)
}

const getShortcutKey = (shortcut: ShortcutConfig): string => {
  const modifiers = []
  if (shortcut.ctrlKey) modifiers.push('Ctrl')
  if (shortcut.altKey) modifiers.push('Alt')
  if (shortcut.shiftKey) modifiers.push('Shift')
  if (shortcut.metaKey) modifiers.push('Meta')
  
  return [...modifiers, shortcut.key].join('+')
}

const hasModifiers = (shortcut: ShortcutConfig): boolean => {
  return !!(shortcut.ctrlKey || shortcut.altKey || shortcut.shiftKey || shortcut.metaKey)
}

const formatKey = (key: string): string => {
  const keyMap: Record<string, string> = {
    'Enter': 'Eingabe',
    'Escape': 'Esc',
    'Tab': 'Tab',
    'Space': 'Leertaste',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Home': 'Pos1',
    'End': 'Ende',
    'PageUp': 'Bild↑',
    'PageDown': 'Bild↓',
    'Delete': 'Entf',
    'Backspace': '⌫'
  }
  
  return keyMap[key] || key.toUpperCase()
}

const testShortcut = async (shortcut: ShortcutConfig) => {
  try {
    await shortcut.action()
    // 显示成功提示
    console.log(`Shortcut ${getShortcutKey(shortcut)} executed successfully`)
  } catch (error) {
    console.error(`Failed to execute shortcut ${getShortcutKey(shortcut)}:`, error)
  }
}

const printShortcuts = () => {
  const printContent = generatePrintContent()
  const printWindow = window.open('', '_blank')
  
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }
}

const generatePrintContent = (): string => {
  const shortcuts = filteredShortcuts.value
  
  let content = `
    <html>
      <head>
        <title>Zinses-Rechner Tastenkürzel</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #666; margin-top: 30px; }
          .shortcut { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
          .keys { font-weight: bold; color: #3b82f6; }
          .description { margin-top: 5px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>Zinses-Rechner Tastenkürzel</h1>
  `
  
  const categorizedShortcuts = categories.slice(1).reduce((acc, category) => {
    const categoryShortcuts = shortcuts.filter(s => s.category === category.id)
    if (categoryShortcuts.length > 0) {
      acc[category.name] = categoryShortcuts
    }
    return acc
  }, {} as Record<string, ShortcutConfig[]>)
  
  Object.entries(categorizedShortcuts).forEach(([categoryName, categoryShortcuts]) => {
    content += `<h2>${categoryName}</h2>`
    categoryShortcuts.forEach(shortcut => {
      content += `
        <div class="shortcut">
          <div class="keys">${getShortcutKey(shortcut)}</div>
          <div class="description">${shortcut.description}</div>
        </div>
      `
    })
  })
  
  content += `
      </body>
    </html>
  `
  
  return content
}

const resetToDefaults = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
}

// 生命周期
onMounted(() => {
  // 组件挂载时可以执行一些初始化操作
})
</script>

<style scoped>
.keyboard-shortcuts-help {
  @apply max-w-4xl;
}

.shortcuts-grid {
  @apply grid-cols-1;
}

@media (min-width: 768px) {
  .shortcuts-grid {
    @apply grid-cols-2;
  }
}

.shortcut-item {
  @apply transition-all duration-200;
}

.shortcut-item:hover {
  @apply transform -translate-y-1;
}

.key-badge {
  @apply inline-flex items-center px-2 py-1 text-xs font-mono font-semibold;
  @apply bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200;
  @apply border border-gray-300 dark:border-gray-600 rounded;
  @apply shadow-sm;
}

.key-primary {
  @apply bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200;
  @apply border-blue-300 dark:border-blue-600;
}

.key-badge-small {
  @apply inline-flex items-center px-1.5 py-0.5 text-xs font-mono font-medium;
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300;
  @apply border border-gray-300 dark:border-gray-600 rounded;
}

.test-button {
  @apply transition-colors duration-200;
}

.test-button:hover {
  @apply underline;
}

/* 无障碍增强 */
.shortcut-item:focus-within {
  @apply ring-2 ring-blue-500 ring-offset-2;
}

:global(.theme-dark) .shortcut-item:focus-within {
  @apply ring-offset-gray-900;
}

/* 高对比度支持 */
:global(.high-contrast) .key-badge {
  @apply border-2 border-current;
}

/* 大字体支持 */
:global(.large-text) .shortcuts-content {
  @apply text-base;
}

:global(.large-text) .key-badge {
  @apply text-sm px-3 py-1.5;
}

/* 打印样式 */
@media print {
  .shortcuts-content {
    @apply text-black bg-white;
  }
  
  .shortcut-item {
    @apply border-gray-400 bg-white;
    break-inside: avoid;
  }
  
  .key-badge {
    @apply bg-gray-200 text-black border-gray-400;
  }
}

/* 动画效果 */
.shortcut-item {
  @apply transition-all duration-200 ease-in-out;
}

.shortcut-item:hover .key-badge {
  @apply transform scale-105;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .categories-tabs {
    @apply overflow-x-auto;
  }
  
  .categories-tabs .flex {
    @apply flex-nowrap;
  }
  
  .shortcuts-grid {
    @apply grid-cols-1;
  }
}
</style>
