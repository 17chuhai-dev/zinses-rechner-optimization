
import { createApp } from 'vue'
import App from './App-simple.vue'

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
    appDiv.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #e74c3c;">应用加载失败</h1>
        <p>正在修复中，请稍后再试...</p>
        <details style="margin-top: 20px; text-align: left;">
          <summary>技术详情</summary>
          <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto;">
${error.message}
${error.stack}
          </pre>
        </details>
      </div>
    `
  }
}
