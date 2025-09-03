#!/usr/bin/env node

/**
 * 调试构建问题
 * 创建一个最小化的测试版本
 */

import fs from 'fs';
import path from 'path';

// 创建一个简化的main.ts用于测试
function createSimpleMain() {
  const simpleMainContent = `
import { createApp } from 'vue'
import App from './App.vue'

console.log('🚀 Starting simple Zinses Rechner...')

try {
  const app = createApp(App)
  
  // 简单的错误处理
  app.config.errorHandler = (err, vm, info) => {
    console.error('Vue Error:', err)
    console.error('Component:', vm)
    console.error('Info:', info)
  }
  
  app.mount('#app')
  console.log('✅ App mounted successfully')
} catch (error) {
  console.error('❌ Failed to mount app:', error)
  
  // 显示错误信息给用户
  const appDiv = document.getElementById('app')
  if (appDiv) {
    appDiv.innerHTML = \`
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #e74c3c;">应用加载失败</h1>
        <p>正在修复中，请稍后再试...</p>
        <details style="margin-top: 20px; text-align: left;">
          <summary>技术详情</summary>
          <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto;">
\${error.message}
\${error.stack}
          </pre>
        </details>
      </div>
    \`
  }
}
`;

  fs.writeFileSync(path.join(process.cwd(), 'src/main-simple.ts'), simpleMainContent);
  console.log('✅ 创建简化的main-simple.ts');
}

// 创建一个简化的App.vue
function createSimpleApp() {
  const simpleAppContent = `
<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <header class="bg-blue-600 text-white p-4">
      <h1 class="text-2xl font-bold">Zinses Rechner - 测试版本</h1>
    </header>
    
    <main class="container mx-auto p-4">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">应用状态检查</h2>
        
        <div class="space-y-2">
          <div class="flex items-center">
            <span class="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>Vue.js 应用已加载</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>Tailwind CSS 样式正常</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>基础功能可用</span>
          </div>
        </div>
        
        <div class="mt-6">
          <button 
            @click="testFunction"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            测试按钮
          </button>
          
          <p v-if="testMessage" class="mt-2 text-green-600">
            {{ testMessage }}
          </p>
        </div>
        
        <div class="mt-6 text-sm text-gray-600">
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
`;

  fs.writeFileSync(path.join(process.cwd(), 'src/App-simple.vue'), simpleAppContent);
  console.log('✅ 创建简化的App-simple.vue');
}

// 创建简化的vite配置
function createSimpleViteConfig() {
  const simpleViteConfig = `
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  build: {
    outDir: 'dist-simple',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index-simple.html')
      }
    }
  },
  
  server: {
    port: 5174
  }
})
`;

  fs.writeFileSync(path.join(process.cwd(), 'vite-simple.config.ts'), simpleViteConfig);
  console.log('✅ 创建简化的vite-simple.config.ts');
}

// 创建简化的HTML文件
function createSimpleHTML() {
  const simpleHTML = `
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zinses Rechner - 测试版本</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main-simple.ts"></script>
  </body>
</html>
`;

  fs.writeFileSync(path.join(process.cwd(), 'index-simple.html'), simpleHTML);
  console.log('✅ 创建简化的index-simple.html');
}

// 创建简化的package.json脚本
function addSimpleScripts() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    'dev:simple': 'vite --config vite-simple.config.ts',
    'build:simple': 'vite build --config vite-simple.config.ts',
    'deploy:simple': 'npm run build:simple && export CLOUDFLARE_EMAIL="yigetech@gmail.com" && export CLOUDFLARE_API_KEY="d70a07155b7e29ba4c0fe1ac05e976fe6852f" && npx wrangler pages deploy dist-simple --project-name=zinses-rechner-test'
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ 添加简化版本的npm脚本');
}

async function createDebugVersion() {
  console.log('🔧 创建调试版本...\n');
  
  try {
    createSimpleMain();
    createSimpleApp();
    createSimpleViteConfig();
    createSimpleHTML();
    addSimpleScripts();
    
    console.log('\n🎉 调试版本创建完成！');
    console.log('📝 使用方法：');
    console.log('1. 本地测试: npm run dev:simple');
    console.log('2. 构建测试: npm run build:simple');
    console.log('3. 部署测试: npm run deploy:simple');
    console.log('\n这个简化版本将帮助我们诊断问题所在。');
    
  } catch (error) {
    console.error('❌ 创建调试版本失败:', error.message);
  }
}

createDebugVersion();
