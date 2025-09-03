
<template>
  <div id="app" style="min-height: 100vh; background-color: #f9fafb;">
    <header style="background-color: #2563eb; color: white; padding: 1rem;">
      <h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">Zinses Rechner - 测试版本</h1>
    </header>

    <main style="max-width: 1200px; margin: 0 auto; padding: 1rem;">
      <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 1.5rem;">
        <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">应用状态检查</h2>

        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; align-items: center;">
            <span style="width: 1rem; height: 1rem; background-color: #10b981; border-radius: 50%; margin-right: 0.5rem;"></span>
            <span>Vue.js 应用已加载</span>
          </div>

          <div style="display: flex; align-items: center;">
            <span style="width: 1rem; height: 1rem; background-color: #10b981; border-radius: 50%; margin-right: 0.5rem;"></span>
            <span>基础样式正常</span>
          </div>

          <div style="display: flex; align-items: center;">
            <span style="width: 1rem; height: 1rem; background-color: #10b981; border-radius: 50%; margin-right: 0.5rem;"></span>
            <span>基础功能可用</span>
          </div>
        </div>

        <div style="margin-top: 1.5rem;">
          <button
            @click="testFunction"
            style="background-color: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;"
            @mouseover="$event.target.style.backgroundColor = '#2563eb'"
            @mouseout="$event.target.style.backgroundColor = '#3b82f6'"
          >
            测试按钮
          </button>

          <p v-if="testMessage" style="margin-top: 0.5rem; color: #059669;">
            {{ testMessage }}
          </p>
        </div>

        <div style="margin-top: 1.5rem; font-size: 0.875rem; color: #6b7280;">
          <p>构建时间: {{ buildTime }}</p>
          <p>版本: 测试版本 v1.0</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const testMessage = ref('')
const buildTime = ref(new Date().toLocaleString())

const testFunction = () => {
  testMessage.value = '✅ JavaScript 功能正常工作！'
  console.log('测试按钮被点击')
}

onMounted(() => {
  console.log('✅ App.vue 组件已挂载')
})
</script>

<style>
/* 确保基础样式可用 */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
