<template>
  <div class="user-profile">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- 页面标题 -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Benutzerprofil
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-300">
            Verwalten Sie Ihre persönlichen Informationen und Einstellungen
          </p>
        </div>

        <!-- 用户信息卡片 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div class="flex items-center space-x-6 mb-6">
            <!-- 头像 -->
            <div class="relative">
              <div class="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {{ getInitials(userProfile.name) }}
              </div>
              <button
                @click="changeAvatar"
                class="absolute bottom-0 right-0 bg-gray-600 text-white rounded-full p-2 hover:bg-gray-700 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
              </button>
            </div>

            <!-- 基本信息 -->
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ userProfile.name }}</h2>
              <p class="text-gray-600 dark:text-gray-300">{{ userProfile.email }}</p>
              <p class="text-sm text-gray-500">Mitglied seit {{ userProfile.joinDate }}</p>
            </div>

            <!-- 状态徽章 -->
            <div class="text-right">
              <span
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium',
                  userProfile.status === 'premium' 
                    ? 'bg-gold-100 text-gold-800' 
                    : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ userProfile.status === 'premium' ? 'Premium' : 'Standard' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 选项卡 -->
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

        <!-- 个人信息编辑 -->
        <div v-if="activeTab === 'personal'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 class="text-xl font-semibold mb-6">个人信息</h3>
          
          <form @submit.prevent="savePersonalInfo" class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium mb-2">姓名</label>
                <input
                  type="text"
                  v-model="editProfile.name"
                  class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">邮箱</label>
                <input
                  type="email"
                  v-model="editProfile.email"
                  class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium mb-2">电话</label>
                <input
                  type="tel"
                  v-model="editProfile.phone"
                  class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">生日</label>
                <input
                  type="date"
                  v-model="editProfile.birthday"
                  class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">地址</label>
              <textarea
                v-model="editProfile.address"
                rows="3"
                class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="输入您的地址"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">个人简介</label>
              <textarea
                v-model="editProfile.bio"
                rows="4"
                class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="介绍一下您自己"
              ></textarea>
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存更改
              </button>
            </div>
          </form>
        </div>

        <!-- 安全设置 -->
        <div v-if="activeTab === 'security'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 class="text-xl font-semibold mb-6">安全设置</h3>
          
          <div class="space-y-6">
            <!-- 修改密码 -->
            <div class="border-b pb-6">
              <h4 class="font-medium mb-4">修改密码</h4>
              <form @submit.prevent="changePassword" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">当前密码</label>
                  <input
                    type="password"
                    v-model="passwordForm.current"
                    class="w-full max-w-md p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">新密码</label>
                  <input
                    type="password"
                    v-model="passwordForm.new"
                    class="w-full max-w-md p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">确认新密码</label>
                  <input
                    type="password"
                    v-model="passwordForm.confirm"
                    class="w-full max-w-md p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                </div>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  更新密码
                </button>
              </form>
            </div>

            <!-- 两步验证 -->
            <div class="border-b pb-6">
              <h4 class="font-medium mb-4">两步验证</h4>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">为您的账户添加额外的安全保护</p>
                </div>
                <button
                  @click="toggleTwoFactor"
                  :class="[
                    'px-4 py-2 rounded-lg transition-colors',
                    userProfile.twoFactorEnabled
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  ]"
                >
                  {{ userProfile.twoFactorEnabled ? '禁用' : '启用' }}
                </button>
              </div>
            </div>

            <!-- 登录历史 -->
            <div>
              <h4 class="font-medium mb-4">最近登录</h4>
              <div class="space-y-3">
                <div
                  v-for="login in loginHistory"
                  :key="login.id"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <div class="font-medium">{{ login.location }}</div>
                    <div class="text-sm text-gray-500">{{ login.device }} • {{ login.date }}</div>
                  </div>
                  <div class="text-sm text-gray-500">{{ login.ip }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 偏好设置 -->
        <div v-if="activeTab === 'preferences'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 class="text-xl font-semibold mb-6">偏好设置</h3>
          
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium mb-2">语言</label>
              <select v-model="preferences.language" class="w-full max-w-xs p-2 border rounded-lg">
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">时区</label>
              <select v-model="preferences.timezone" class="w-full max-w-xs p-2 border rounded-lg">
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">通知设置</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="preferences.emailNotifications"
                    class="mr-2"
                  >
                  邮件通知
                </label>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="preferences.pushNotifications"
                    class="mr-2"
                  >
                  推送通知
                </label>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="preferences.marketingEmails"
                    class="mr-2"
                  >
                  营销邮件
                </label>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                @click="savePreferences"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存偏好
              </button>
            </div>
          </div>
        </div>

        <!-- 账户管理 -->
        <div v-if="activeTab === 'account'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-6">账户管理</h3>
          
          <div class="space-y-6">
            <!-- 数据导出 -->
            <div class="border-b pb-6">
              <h4 class="font-medium mb-4">数据导出</h4>
              <p class="text-sm text-gray-600 mb-4">下载您的所有数据副本</p>
              <button
                @click="exportData"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                导出数据
              </button>
            </div>

            <!-- 账户删除 -->
            <div>
              <h4 class="font-medium mb-4 text-red-600">删除账户</h4>
              <p class="text-sm text-gray-600 mb-4">
                永久删除您的账户和所有相关数据。此操作不可撤销。
              </p>
              <button
                @click="deleteAccount"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                删除账户
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// 选项卡配置
const tabs = [
  { id: 'personal', name: '个人信息' },
  { id: 'security', name: '安全' },
  { id: 'preferences', name: '偏好' },
  { id: 'account', name: '账户' }
]

const activeTab = ref('personal')

// 用户资料
const userProfile = reactive({
  name: 'Max Mustermann',
  email: 'max.mustermann@example.com',
  phone: '+49 123 456 789',
  birthday: '1990-01-01',
  address: 'Musterstraße 123, 12345 Berlin',
  bio: 'Finanzexperte mit 10 Jahren Erfahrung',
  joinDate: '2023-01-15',
  status: 'premium',
  twoFactorEnabled: false
})

// 编辑资料
const editProfile = reactive({ ...userProfile })

// 密码表单
const passwordForm = reactive({
  current: '',
  new: '',
  confirm: ''
})

// 偏好设置
const preferences = reactive({
  language: 'de',
  timezone: 'Europe/Berlin',
  emailNotifications: true,
  pushNotifications: false,
  marketingEmails: false
})

// 登录历史
const loginHistory = ref([
  {
    id: '1',
    location: 'Berlin, Deutschland',
    device: 'Chrome auf Windows',
    date: '2024-01-15 14:30',
    ip: '192.168.1.1'
  },
  {
    id: '2',
    location: 'München, Deutschland',
    device: 'Safari auf iPhone',
    date: '2024-01-14 09:15',
    ip: '192.168.1.2'
  }
])

// 方法
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const changeAvatar = () => {
  console.log('更换头像')
}

const savePersonalInfo = () => {
  Object.assign(userProfile, editProfile)
  console.log('保存个人信息', userProfile)
}

const changePassword = () => {
  if (passwordForm.new !== passwordForm.confirm) {
    alert('新密码和确认密码不匹配')
    return
  }
  console.log('修改密码')
  // 重置表单
  Object.assign(passwordForm, { current: '', new: '', confirm: '' })
}

const toggleTwoFactor = () => {
  userProfile.twoFactorEnabled = !userProfile.twoFactorEnabled
  console.log('两步验证:', userProfile.twoFactorEnabled)
}

const savePreferences = () => {
  console.log('保存偏好设置', preferences)
}

const exportData = () => {
  console.log('导出数据')
}

const deleteAccount = () => {
  if (confirm('确定要删除账户吗？此操作不可撤销。')) {
    console.log('删除账户')
  }
}
</script>

<style scoped>
.user-profile {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bg-gold-100 {
  background-color: #fef3c7;
}

.text-gold-800 {
  color: #92400e;
}
</style>
