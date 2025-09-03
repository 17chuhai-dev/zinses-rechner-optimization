<!--
  主题设置面板
  提供完整的主题配置选项，包括颜色方案、无障碍设置等
-->

<template>
  <div class="theme-settings-panel">
    <div class="space-y-6">
      <!-- 主题模式设置 -->
      <div class="theme-mode-section">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <PaintBrushIcon class="w-5 h-5 inline mr-2" />
          Erscheinungsbild
        </h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            v-for="option in themeOptions"
            :key="option.mode"
            @click="setTheme(option.mode)"
            :class="[
              'theme-option-card p-4 border-2 rounded-lg cursor-pointer transition-all duration-200',
              'hover:shadow-md hover:scale-105',
              currentMode === option.mode
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <div class="text-center">
              <component
                :is="option.icon"
                :class="[
                  'w-8 h-8 mx-auto mb-2',
                  currentMode === option.mode
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                ]"
              />
              <div class="font-medium text-gray-900 dark:text-white">
                {{ option.label }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ option.description }}
              </div>
            </div>
            <CheckCircleIcon
              v-if="currentMode === option.mode"
              class="w-5 h-5 text-blue-600 dark:text-blue-400 absolute top-2 right-2"
            />
          </div>
        </div>
      </div>

      <!-- 颜色方案设置 -->
      <div class="color-scheme-section">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <SwatchIcon class="w-5 h-5 inline mr-2" />
          Farbschema
        </h3>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            v-for="scheme in colorSchemes"
            :key="scheme.id"
            @click="setColorScheme(scheme.id)"
            :class="[
              'color-scheme-card p-3 border-2 rounded-lg cursor-pointer transition-all duration-200',
              'hover:shadow-md hover:scale-105',
              colorScheme === scheme.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <div class="text-center">
              <div class="flex justify-center mb-2">
                <div
                  v-for="color in scheme.colors"
                  :key="color"
                  class="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                  :style="{ backgroundColor: color }"
                ></div>
              </div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ scheme.name }}
              </div>
            </div>
            <CheckCircleIcon
              v-if="colorScheme === scheme.id"
              class="w-4 h-4 text-blue-600 dark:text-blue-400 absolute top-1 right-1"
            />
          </div>
        </div>
      </div>

      <!-- 自定义颜色 -->
      <div v-if="colorScheme === 'custom'" class="custom-colors-section">
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">
          Benutzerdefinierte Farben
        </h4>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="(colorKey, index) in customColorKeys"
            :key="colorKey"
            class="color-input-group"
          >
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ getColorLabel(colorKey) }}
            </label>
            <div class="flex items-center space-x-2">
              <input
                type="color"
                :value="customColors[colorKey] || defaultCustomColors[colorKey]"
                @input="updateCustomColor(colorKey, ($event.target as HTMLInputElement).value)"
                class="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
              />
              <BaseInput
                :value="customColors[colorKey] || defaultCustomColors[colorKey]"
                @input="updateCustomColor(colorKey, $event.target.value)"
                placeholder="#000000"
                class="flex-1"
              />
            </div>
          </div>
        </div>
        
        <div class="flex justify-end mt-4">
          <BaseButton
            variant="outline"
            size="sm"
            @click="resetCustomColors"
          >
            Zurücksetzen
          </BaseButton>
        </div>
      </div>

      <!-- 无障碍设置 -->
      <div class="accessibility-section">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <EyeIcon class="w-5 h-5 inline mr-2" />
          Barrierefreiheit
        </h3>
        
        <div class="space-y-4">
          <div class="accessibility-option">
            <label class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  Hoher Kontrast
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Erhöht den Kontrast für bessere Lesbarkeit
                </div>
              </div>
              <BaseToggle
                :checked="accessibilityOptions.highContrast"
                @change="updateAccessibility('highContrast', $event)"
              />
            </label>
          </div>
          
          <div class="accessibility-option">
            <label class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  Reduzierte Bewegung
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Reduziert Animationen und Übergänge
                </div>
              </div>
              <BaseToggle
                :checked="accessibilityOptions.reducedMotion"
                @change="updateAccessibility('reducedMotion', $event)"
              />
            </label>
          </div>
          
          <div class="accessibility-option">
            <label class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  Große Schrift
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Vergrößert die Schriftgröße für bessere Lesbarkeit
                </div>
              </div>
              <BaseToggle
                :checked="accessibilityOptions.largeText"
                @change="updateAccessibility('largeText', $event)"
              />
            </label>
          </div>
        </div>
      </div>

      <!-- 系统集成 -->
      <div class="system-integration-section">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <CogIcon class="w-5 h-5 inline mr-2" />
          System-Integration
        </h3>
        
        <div class="space-y-4">
          <div class="system-option">
            <label class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  Systemeinstellungen folgen
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Automatisch zwischen hell und dunkel wechseln
                </div>
              </div>
              <BaseToggle
                :checked="preferences.followSystem"
                @change="updatePreference('followSystem', $event)"
              />
            </label>
          </div>
          
          <div class="system-option">
            <label class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  Automatischer Wechsel
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Zu bestimmten Zeiten automatisch wechseln
                </div>
              </div>
              <BaseToggle
                :checked="preferences.autoSwitch"
                @change="updatePreference('autoSwitch', $event)"
              />
            </label>
          </div>
          
          <div v-if="preferences.autoSwitch" class="time-settings ml-4 space-y-3">
            <div class="time-input-group">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Heller Modus ab
              </label>
              <BaseInput
                type="time"
                :value="preferences.switchTime?.lightMode || '06:00'"
                @input="updateSwitchTime('lightMode', $event.target.value)"
              />
            </div>
            <div class="time-input-group">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dunkler Modus ab
              </label>
              <BaseInput
                type="time"
                :value="preferences.switchTime?.darkMode || '18:00'"
                @input="updateSwitchTime('darkMode', $event.target.value)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 预览区域 -->
      <div class="preview-section">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <EyeIcon class="w-5 h-5 inline mr-2" />
          Vorschau
        </h3>
        
        <div class="preview-card p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                Beispiel-Karte
              </h4>
              <BaseButton variant="primary" size="sm">
                Aktion
              </BaseButton>
            </div>
            <p class="text-gray-600 dark:text-gray-400">
              Dies ist ein Beispieltext, um zu zeigen, wie die gewählten Farben und Einstellungen aussehen.
            </p>
            <div class="flex space-x-2">
              <BaseButton variant="outline" size="sm">Abbrechen</BaseButton>
              <BaseButton variant="primary" size="sm">Speichern</BaseButton>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <BaseButton
          variant="outline"
          @click="resetToDefaults"
        >
          Standardwerte
        </BaseButton>
        <div class="space-x-2">
          <BaseButton
            variant="outline"
            @click="exportThemeConfig"
          >
            Exportieren
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="saveSettings"
          >
            Speichern
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  PaintBrushIcon,
  SwatchIcon,
  EyeIcon,
  CogIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseToggle from '@/components/ui/BaseToggle.vue'
import { useTheme } from '@/services/ThemeService'
import type { ThemeMode, ColorScheme } from '@/services/ThemeService'

// 使用主题服务
const {
  currentMode,
  colorScheme,
  setThemeMode,
  setColorScheme,
  setCustomColors,
  setAccessibilityOptions,
  getConfig
} = useTheme()

// 响应式数据
const config = computed(() => getConfig())
const customColors = ref(config.value.customColors || {})
const accessibilityOptions = ref(config.value.accessibility)
const preferences = ref(config.value.preferences)

// 主题选项
const themeOptions = [
  {
    mode: 'light' as ThemeMode,
    label: 'Hell',
    description: 'Heller Modus',
    icon: SunIcon
  },
  {
    mode: 'dark' as ThemeMode,
    label: 'Dunkel',
    description: 'Dunkler Modus',
    icon: MoonIcon
  },
  {
    mode: 'auto' as ThemeMode,
    label: 'Automatisch',
    description: 'Folgt System',
    icon: ComputerDesktopIcon
  }
]

// 颜色方案
const colorSchemes = [
  {
    id: 'default' as ColorScheme,
    name: 'Standard',
    colors: ['#3b82f6', '#1e40af', '#06b6d4']
  },
  {
    id: 'blue' as ColorScheme,
    name: 'Blau',
    colors: ['#3b82f6', '#1d4ed8', '#1e3a8a']
  },
  {
    id: 'green' as ColorScheme,
    name: 'Grün',
    colors: ['#10b981', '#059669', '#047857']
  },
  {
    id: 'purple' as ColorScheme,
    name: 'Lila',
    colors: ['#8b5cf6', '#7c3aed', '#6d28d9']
  },
  {
    id: 'orange' as ColorScheme,
    name: 'Orange',
    colors: ['#f59e0b', '#d97706', '#b45309']
  },
  {
    id: 'red' as ColorScheme,
    name: 'Rot',
    colors: ['#ef4444', '#dc2626', '#b91c1c']
  },
  {
    id: 'custom' as ColorScheme,
    name: 'Benutzerdefiniert',
    colors: ['#6366f1', '#4f46e5', '#4338ca']
  }
]

// 自定义颜色键
const customColorKeys = ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'info']

// 默认自定义颜色
const defaultCustomColors = {
  primary: '#3b82f6',
  secondary: '#1e40af',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6'
}

// 方法
const setTheme = (mode: ThemeMode) => {
  setThemeMode(mode)
}

const updateCustomColor = (key: string, value: string) => {
  customColors.value[key] = value
  setCustomColors(customColors.value)
}

const resetCustomColors = () => {
  customColors.value = { ...defaultCustomColors }
  setCustomColors(customColors.value)
}

const updateAccessibility = (key: string, value: boolean) => {
  accessibilityOptions.value[key] = value
  setAccessibilityOptions(accessibilityOptions.value)
}

const updatePreference = (key: string, value: boolean) => {
  preferences.value[key] = value
  // 这里应该保存到主题服务
}

const updateSwitchTime = (period: 'lightMode' | 'darkMode', time: string) => {
  if (!preferences.value.switchTime) {
    preferences.value.switchTime = { lightMode: '06:00', darkMode: '18:00' }
  }
  preferences.value.switchTime[period] = time
}

const getColorLabel = (key: string): string => {
  const labels = {
    primary: 'Primärfarbe',
    secondary: 'Sekundärfarbe',
    accent: 'Akzentfarbe',
    success: 'Erfolg',
    warning: 'Warnung',
    error: 'Fehler',
    info: 'Information'
  }
  return labels[key] || key
}

const resetToDefaults = () => {
  setThemeMode('auto')
  setColorScheme('default')
  resetCustomColors()
  setAccessibilityOptions({
    highContrast: false,
    reducedMotion: false,
    largeText: false
  })
}

const exportThemeConfig = () => {
  const configToExport = {
    mode: currentMode.value,
    colorScheme: colorScheme.value,
    customColors: customColors.value,
    accessibility: accessibilityOptions.value,
    preferences: preferences.value
  }
  
  const blob = new Blob([JSON.stringify(configToExport, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'theme-config.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const saveSettings = () => {
  // 设置会自动保存，这里可以显示确认消息
  console.log('Theme settings saved')
}
</script>

<style scoped>
.theme-option-card,
.color-scheme-card {
  @apply relative;
}

.theme-option-card:hover,
.color-scheme-card:hover {
  @apply transform scale-105;
}

.accessibility-option,
.system-option {
  @apply p-3 border border-gray-200 dark:border-gray-700 rounded-lg;
}

.preview-card {
  @apply transition-all duration-300;
}

.color-input-group input[type="color"] {
  @apply appearance-none border-0 cursor-pointer;
}

.color-input-group input[type="color"]::-webkit-color-swatch-wrapper {
  @apply p-0 border-0 rounded;
}

.color-input-group input[type="color"]::-webkit-color-swatch {
  @apply border-0 rounded;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .theme-settings-panel {
    @apply px-4;
  }
  
  .grid.grid-cols-1.sm\\:grid-cols-3 {
    @apply grid-cols-1;
  }
  
  .grid.grid-cols-2.sm\\:grid-cols-3.lg\\:grid-cols-6 {
    @apply grid-cols-2;
  }
}

/* 无障碍增强 */
.theme-option-card:focus,
.color-scheme-card:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

:global(.theme-dark) .theme-option-card:focus,
:global(.theme-dark) .color-scheme-card:focus {
  @apply ring-offset-gray-900;
}

/* 高对比度支持 */
:global(.high-contrast) .theme-option-card,
:global(.high-contrast) .color-scheme-card {
  @apply border-4;
}

/* 大字体支持 */
:global(.large-text) .theme-settings-panel {
  @apply text-lg;
}

:global(.large-text) .theme-settings-panel h3 {
  @apply text-xl;
}

:global(.large-text) .theme-settings-panel h4 {
  @apply text-lg;
}
</style>
