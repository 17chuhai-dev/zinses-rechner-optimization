
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'

import App from './App.vue'

/**
 * 异步启动应用
 */
async function startApp() {
  try {
    console.log('🚀 启动Zinses Rechner应用...')

    // 创建Vue应用
    const app = createApp(App)

    // 配置插件
    app.use(createPinia())
    app.use(router)

    // 全局错误处理
    app.config.errorHandler = (err, instance, info) => {
      console.error('Vue应用错误:', err, info)
    }

    // 挂载应用
    app.mount('#app')

    console.log('✅ Zinses Rechner应用启动成功!')

  } catch (error) {
    console.error('❌ 应用启动失败:', error)

    // 显示错误信息给用户
    const appDiv = document.getElementById('app')
    if (appDiv) {
      appDiv.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
          <h1 style="color: #e74c3c;">应用启动失败</h1>
          <p>正在修复中，请稍后刷新页面重试...</p>
          <button onclick="location.reload()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
            刷新页面
          </button>
          <details style="margin-top: 20px; text-align: left;">
            <summary>技术详情</summary>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px;">
${error instanceof Error ? error.message : String(error)}
${error instanceof Error && error.stack ? error.stack : ''}
            </pre>
          </details>
        </div>
      `
    }
  }
}

// 启动应用
startApp()

// 启动应用
startApp()

// 开发环境调试信息
if (import.meta.env.DEV) {
  console.log('🔧 开发模式已启用')
}
