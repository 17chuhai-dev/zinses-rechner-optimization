<template>
  <div class="collaboration-panel">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-6xl mx-auto">
        <!-- 页面标题 -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Collaboration Tools
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-300">
            Teilen und bearbeiten Sie Berechnungen gemeinsam mit anderen
          </p>
        </div>

        <!-- 功能选项卡 -->
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

        <!-- 共享计算 -->
        <div v-if="activeTab === 'share'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 class="text-xl font-semibold mb-6">计算共享</h3>
          
          <div class="grid md:grid-cols-2 gap-8">
            <!-- 创建共享链接 -->
            <div>
              <h4 class="font-medium mb-4">创建共享链接</h4>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">权限设置</label>
                  <select v-model="shareSettings.permission" class="w-full p-2 border rounded-lg">
                    <option value="view">仅查看</option>
                    <option value="edit">可编辑</option>
                    <option value="comment">可评论</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">有效期</label>
                  <select v-model="shareSettings.expiry" class="w-full p-2 border rounded-lg">
                    <option value="1d">1天</option>
                    <option value="7d">7天</option>
                    <option value="30d">30天</option>
                    <option value="never">永不过期</option>
                  </select>
                </div>
                <button
                  @click="createShareLink"
                  class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  生成共享链接
                </button>
              </div>
            </div>

            <!-- 已共享的计算 -->
            <div>
              <h4 class="font-medium mb-4">已共享的计算</h4>
              <div class="space-y-3">
                <div
                  v-for="item in sharedCalculations"
                  :key="item.id"
                  class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-medium">{{ item.name }}</div>
                      <div class="text-sm text-gray-500">{{ item.sharedWith }} 人 • {{ item.permission }}</div>
                    </div>
                    <button
                      @click="copyShareLink(item)"
                      class="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      复制链接
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 实时协作 -->
        <div v-if="activeTab === 'realtime'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 class="text-xl font-semibold mb-6">实时协作</h3>
          
          <div class="grid md:grid-cols-3 gap-6">
            <!-- 在线用户 -->
            <div>
              <h4 class="font-medium mb-4">在线用户 ({{ onlineUsers.length }})</h4>
              <div class="space-y-2">
                <div
                  v-for="user in onlineUsers"
                  :key="user.id"
                  class="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: user.color }"
                  ></div>
                  <span class="text-sm">{{ user.name }}</span>
                  <span v-if="user.isEditing" class="text-xs text-green-600">编辑中</span>
                </div>
              </div>
            </div>

            <!-- 活动日志 -->
            <div class="md:col-span-2">
              <h4 class="font-medium mb-4">活动日志</h4>
              <div class="max-h-64 overflow-y-auto space-y-2">
                <div
                  v-for="activity in activities"
                  :key="activity.id"
                  class="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                >
                  <span class="font-medium">{{ activity.user }}</span>
                  {{ activity.action }}
                  <span class="text-gray-500 ml-2">{{ activity.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 评论系统 -->
        <div v-if="activeTab === 'comments'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 class="text-xl font-semibold mb-6">评论与讨论</h3>
          
          <div class="grid md:grid-cols-2 gap-8">
            <!-- 添加评论 -->
            <div>
              <h4 class="font-medium mb-4">添加评论</h4>
              <div class="space-y-4">
                <textarea
                  v-model="newComment.text"
                  placeholder="输入您的评论..."
                  class="w-full p-3 border rounded-lg resize-none"
                  rows="4"
                ></textarea>
                <div class="flex justify-between items-center">
                  <select v-model="newComment.type" class="p-2 border rounded">
                    <option value="general">一般评论</option>
                    <option value="suggestion">建议</option>
                    <option value="question">问题</option>
                  </select>
                  <button
                    @click="addComment"
                    :disabled="!newComment.text.trim()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    发布评论
                  </button>
                </div>
              </div>
            </div>

            <!-- 评论列表 -->
            <div>
              <h4 class="font-medium mb-4">评论 ({{ comments.length }})</h4>
              <div class="max-h-96 overflow-y-auto space-y-4">
                <div
                  v-for="comment in comments"
                  :key="comment.id"
                  class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div class="flex justify-between items-start mb-2">
                    <div class="font-medium">{{ comment.author }}</div>
                    <div class="text-xs text-gray-500">{{ comment.time }}</div>
                  </div>
                  <p class="text-sm mb-2">{{ comment.text }}</p>
                  <div class="flex items-center space-x-4 text-xs">
                    <span
                      :class="[
                        'px-2 py-1 rounded',
                        comment.type === 'suggestion' ? 'bg-green-100 text-green-800' :
                        comment.type === 'question' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      ]"
                    >
                      {{ comment.type }}
                    </span>
                    <button class="text-blue-600 hover:text-blue-700">回复</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 版本控制 -->
        <div v-if="activeTab === 'versions'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-6">版本历史</h3>
          
          <div class="space-y-4">
            <div
              v-for="version in versions"
              :key="version.id"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <div class="font-medium">版本 {{ version.version }}</div>
                <div class="text-sm text-gray-500">
                  {{ version.author }} • {{ version.date }} • {{ version.changes }}
                </div>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="previewVersion(version)"
                  class="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  预览
                </button>
                <button
                  @click="restoreVersion(version)"
                  class="px-3 py-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                >
                  恢复
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 选项卡配置
const tabs = [
  { id: 'share', name: '共享' },
  { id: 'realtime', name: '实时协作' },
  { id: 'comments', name: '评论' },
  { id: 'versions', name: '版本' }
]

const activeTab = ref('share')

// 共享设置
const shareSettings = ref({
  permission: 'view',
  expiry: '7d'
})

// 已共享的计算
const sharedCalculations = ref([
  {
    id: '1',
    name: '复利计算 - 退休规划',
    sharedWith: 3,
    permission: '可编辑'
  },
  {
    id: '2',
    name: '贷款计算 - 房屋贷款',
    sharedWith: 1,
    permission: '仅查看'
  }
])

// 在线用户
const onlineUsers = ref([
  { id: '1', name: 'Max Müller', color: '#3b82f6', isEditing: true },
  { id: '2', name: 'Anna Schmidt', color: '#10b981', isEditing: false },
  { id: '3', name: 'Tom Weber', color: '#f59e0b', isEditing: false }
])

// 活动日志
const activities = ref([
  { id: '1', user: 'Max Müller', action: '修改了利率参数', time: '2分钟前' },
  { id: '2', user: 'Anna Schmidt', action: '添加了评论', time: '5分钟前' },
  { id: '3', user: 'Tom Weber', action: '创建了新版本', time: '10分钟前' }
])

// 评论
const newComment = ref({
  text: '',
  type: 'general'
})

const comments = ref([
  {
    id: '1',
    author: 'Anna Schmidt',
    text: '这个利率设置看起来有点高，建议调整到3.5%',
    type: 'suggestion',
    time: '1小时前'
  },
  {
    id: '2',
    author: 'Tom Weber',
    text: '计算结果是否考虑了通胀因素？',
    type: 'question',
    time: '2小时前'
  }
])

// 版本历史
const versions = ref([
  {
    id: '1',
    version: '1.3',
    author: 'Max Müller',
    date: '2024-01-15 14:30',
    changes: '调整利率参数'
  },
  {
    id: '2',
    version: '1.2',
    author: 'Anna Schmidt',
    date: '2024-01-15 10:15',
    changes: '添加税收计算'
  },
  {
    id: '3',
    version: '1.1',
    author: 'Tom Weber',
    date: '2024-01-14 16:45',
    changes: '初始版本'
  }
])

// 方法
const createShareLink = () => {
  console.log('创建共享链接', shareSettings.value)
}

const copyShareLink = (item: any) => {
  console.log('复制共享链接', item)
}

const addComment = () => {
  if (newComment.value.text.trim()) {
    comments.value.unshift({
      id: Date.now().toString(),
      author: '当前用户',
      text: newComment.value.text,
      type: newComment.value.type,
      time: '刚刚'
    })
    newComment.value.text = ''
  }
}

const previewVersion = (version: any) => {
  console.log('预览版本', version)
}

const restoreVersion = (version: any) => {
  console.log('恢复版本', version)
}
</script>

<style scoped>
.collaboration-panel {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
