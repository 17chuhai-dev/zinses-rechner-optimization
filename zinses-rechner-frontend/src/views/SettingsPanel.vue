<template>
  <div class="settings-panel">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- 页面标题 -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Einstellungen
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-300">
            Passen Sie Ihre Präferenzen und Einstellungen an
          </p>
        </div>

        <!-- 设置选项卡 -->
        <div class="flex flex-wrap gap-4 mb-8 justify-center">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-6 py-3 rounded-lg font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
          >
            {{ tab.name }}
          </button>
        </div>

        <!-- 通用设置 -->
        <div v-if="activeTab === 'general'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 class="text-xl font-semibold mb-6">通用设置</h3>

          <div class="space-y-6">
            <!-- 货币设置 -->
            <div>
              <label class="block text-sm font-medium mb-2">默认货币</label>
              <select v-model="settings.currency" class="w-full max-w-xs p-2 border rounded-lg">
                <option value="EUR">Euro (€)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="CHF">Swiss Franc (CHF)</option>
              </select>
            </div>

            <!-- 数字格式 -->
            <div>
              <label class="block text-sm font-medium mb-2">数字格式</label>
              <select v-model="settings.numberFormat" class="w-full max-w-xs p-2 border rounded-lg">
                <option value="de">德式 (1.234,56)</option>
                <option value="en">英式 (1,234.56)</option>
                <option value="fr">法式 (1 234,56)</option>
              </select>
            </div>

            <!-- 时区设置 -->
            <div>
              <label class="block text-sm font-medium mb-2">时区</label>
              <select v-model="settings.timezone" class="w-full max-w-xs p-2 border rounded-lg">
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 外观设置 -->
        <div v-if="activeTab === 'appearance'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 class="text-xl font-semibold mb-6">外观设置</h3>

          <div class="space-y-6">
            <!-- 主题设置 -->
            <div>
              <label class="block text-sm font-medium mb-2">主题</label>
              <div class="flex space-x-4">
                <label class="flex items-center">
                  <input
                    type="radio"
                    v-model="settings.theme"
                    value="light"
                    class="mr-2"
                  >
                  浅色
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    v-model="settings.theme"
                    value="dark"
                    class="mr-2"
                  >
                  深色
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    v-model="settings.theme"
                    value="auto"
                    class="mr-2"
                  >
                  自动
                </label>
              </div>
            </div>

            <!-- 字体大小 -->
            <div>
              <label class="block text-sm font-medium mb-2">字体大小</label>
              <select v-model="settings.fontSize" class="w-full max-w-xs p-2 border rounded-lg">
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>

            <!-- 动画效果 -->
            <div>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.animations"
                  class="mr-2"
                >
                启用动画效果
              </label>
            </div>

            <!-- 高对比度 -->
            <div>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.highContrast"
                  class="mr-2"
                >
                高对比度模式
              </label>
            </div>
          </div>
        </div>

        <!-- 计算设置 -->
        <div v-if="activeTab === 'calculation'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 class="text-xl font-semibold mb-6">计算设置</h3>

          <div class="space-y-6">
            <!-- 默认利率 -->
            <div>
              <label class="block text-sm font-medium mb-2">默认利率 (%)</label>
              <input
                type="number"
                v-model.number="settings.defaultInterestRate"
                step="0.1"
                min="0"
                max="20"
                class="w-full max-w-xs p-2 border rounded-lg"
              >
            </div>

            <!-- 计算精度 -->
            <div>
              <label class="block text-sm font-medium mb-2">计算精度（小数位）</label>
              <select v-model="settings.precision" class="w-full max-w-xs p-2 border rounded-lg">
                <option value="2">2位</option>
                <option value="4">4位</option>
                <option value="6">6位</option>
              </select>
            </div>

            <!-- 自动保存 -->
            <div>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.autoSave"
                  class="mr-2"
                >
                自动保存计算结果
              </label>
            </div>

            <!-- 历史记录 -->
            <div>
              <label class="block text-sm font-medium mb-2">保留历史记录（天）</label>
              <select v-model="settings.historyDays" class="w-full max-w-xs p-2 border rounded-lg">
                <option value="7">7天</option>
                <option value="30">30天</option>
                <option value="90">90天</option>
                <option value="365">1年</option>
                <option value="-1">永久</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 隐私设置 -->
        <div v-if="activeTab === 'privacy'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 class="text-xl font-semibold mb-6">隐私设置</h3>

          <div class="space-y-6">
            <!-- 数据收集 -->
            <div>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.analytics"
                  class="mr-2"
                >
                允许匿名使用统计
              </label>
              <p class="text-sm text-gray-500 mt-1">
                帮助我们改进产品，不会收集个人信息
              </p>
            </div>

            <!-- Cookie设置 -->
            <div>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.cookies"
                  class="mr-2"
                >
                接受功能性Cookie
              </label>
              <p class="text-sm text-gray-500 mt-1">
                用于保存您的设置和偏好
              </p>
            </div>

            <!-- 数据导出 -->
            <div>
              <h4 class="font-medium mb-2">数据管理</h4>
              <div class="flex space-x-4">
                <button
                  @click="exportData"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  导出数据
                </button>
                <button
                  @click="deleteData"
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  删除所有数据
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="flex justify-center space-x-4">
          <button
            @click="saveSettings"
            class="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            保存设置
          </button>
          <button
            @click="resetSettings"
            class="px-8 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            重置为默认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// 选项卡配置
const tabs = [
  { id: 'general', name: '通用' },
  { id: 'appearance', name: '外观' },
  { id: 'calculation', name: '计算' },
  { id: 'privacy', name: '隐私' }
]

const activeTab = ref('general')

// 设置数据
const settings = reactive({
  // 通用设置
  currency: 'EUR',
  numberFormat: 'de',
  timezone: 'Europe/Berlin',

  // 外观设置
  theme: 'auto',
  fontSize: 'medium',
  animations: true,
  highContrast: false,

  // 计算设置
  defaultInterestRate: 3.0,
  precision: 2,
  autoSave: true,
  historyDays: 30,

  // 隐私设置
  analytics: false,
  cookies: true
})

// 方法
const saveSettings = () => {
  // 保存设置到localStorage或发送到服务器
  localStorage.setItem('user-settings', JSON.stringify(settings))
  console.log('设置已保存', settings)
}

const resetSettings = () => {
  // 重置为默认设置
  Object.assign(settings, {
    currency: 'EUR',
    numberFormat: 'de',
    timezone: 'Europe/Berlin',
    theme: 'auto',
    fontSize: 'medium',
    animations: true,
    highContrast: false,
    defaultInterestRate: 3.0,
    precision: 2,
    autoSave: true,
    historyDays: 30,
    analytics: false,
    cookies: true
  })
}

const exportData = () => {
  // 导出用户数据
  console.log('导出数据')
}

const deleteData = () => {
  // 删除所有用户数据
  if (confirm('确定要删除所有数据吗？此操作不可撤销。')) {
    console.log('删除所有数据')
  }
}

// 初始化时加载保存的设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('user-settings')
    if (saved) {
      Object.assign(settings, JSON.parse(saved))
    }
  } catch (error) {
    console.warn('无法加载设置:', error)
  }
}

// 组件挂载时加载设置
loadSettings()
</script>

<style scoped>
.settings-panel {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
</style>
