# Zinses Rechner - 故障排除指南

本文档提供了德国利息计算器常见问题的诊断和解决方案。

## 目录

- [开发环境问题](#开发环境问题)
- [构建和部署问题](#构建和部署问题)
- [运行时错误](#运行时错误)
- [性能问题](#性能问题)
- [网络和API问题](#网络和api问题)
- [浏览器兼容性问题](#浏览器兼容性问题)
- [安全相关问题](#安全相关问题)
- [诊断工具](#诊断工具)

## 开发环境问题

### 问题1: 开发服务器启动失败

**症状**: `npm run dev` 命令失败

**可能原因**:
- Node.js版本不兼容
- 端口被占用
- 依赖包缺失或损坏

**解决方案**:

```bash
# 1. 检查Node.js版本
node --version
# 确保版本 >= 18.0.0

# 2. 检查端口占用
lsof -ti:5173
# 如果有进程占用，终止它
kill -9 $(lsof -ti:5173)

# 3. 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 4. 使用不同端口启动
npm run dev -- --port 3000
```

### 问题2: 热重载不工作

**症状**: 修改代码后页面不自动刷新

**解决方案**:

```bash
# 1. 检查文件监听限制（Linux/macOS）
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 2. 重启开发服务器
npm run dev

# 3. 检查防火墙设置
# 确保5173端口未被阻止
```

### 问题3: TypeScript类型错误

**症状**: 大量TypeScript编译错误

**解决方案**:

```bash
# 1. 更新TypeScript和相关类型定义
npm update typescript @types/node

# 2. 重新生成类型定义
npm run type-check

# 3. 清理TypeScript缓存
rm -rf .tsbuildinfo
npx tsc --build --clean

# 4. 检查tsconfig.json配置
cat tsconfig.json
```

## 构建和部署问题

### 问题4: 构建失败

**症状**: `npm run build` 命令失败

**常见错误和解决方案**:

#### 内存不足错误
```bash
# 错误: JavaScript heap out of memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### 依赖解析错误
```bash
# 清理依赖并重新安装
rm -rf node_modules package-lock.json
npm ci
npm run build
```

#### 环境变量问题
```bash
# 检查环境变量
printenv | grep VITE_

# 验证.env文件
cat .env.production
```

### 问题5: 构建产物过大

**症状**: 构建后的文件体积过大

**解决方案**:

```bash
# 1. 分析包大小
npm run build:analyze

# 2. 检查未使用的依赖
npx depcheck

# 3. 启用代码分割
# 在vite.config.ts中配置manualChunks

# 4. 优化图片资源
npm run optimize:images
```

### 问题6: 部署后白屏

**症状**: 部署后页面显示空白

**诊断步骤**:

```bash
# 1. 检查浏览器控制台错误
# 打开开发者工具查看Console和Network标签

# 2. 检查资源路径
# 确保base URL配置正确

# 3. 检查服务器配置
# 确保SPA路由配置正确

# 4. 验证构建产物
ls -la dist/
cat dist/index.html
```

**解决方案**:

```nginx
# Nginx SPA配置
location / {
    try_files $uri $uri/ /index.html;
}
```

## 运行时错误

### 问题7: JavaScript运行时错误

**症状**: 控制台显示JavaScript错误

**常见错误类型**:

#### 模块加载失败
```javascript
// 错误: Failed to resolve module specifier
// 解决: 检查import路径
import { Component } from '@/components/Component.vue'
```

#### 异步操作错误
```javascript
// 错误: Unhandled promise rejection
// 解决: 添加错误处理
try {
  const data = await apiCall()
} catch (error) {
  console.error('API call failed:', error)
}
```

#### 响应式数据错误
```javascript
// 错误: Cannot read property of undefined
// 解决: 添加安全检查
const value = computed(() => data.value?.property ?? 'default')
```

### 问题8: 内存泄漏

**症状**: 页面使用时间长后变慢

**解决方案**:

```javascript
// 1. 清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 2. 清理定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

// 3. 清理观察器
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
```

## 性能问题

### 问题9: 页面加载缓慢

**诊断工具**:

```bash
# 1. 运行Lighthouse审计
npm run lighthouse

# 2. 分析网络请求
# 使用浏览器开发者工具Network标签

# 3. 检查包大小
npm run build:stats
```

**优化方案**:

```javascript
// 1. 懒加载路由
const Home = () => import('@/views/HomePage.vue')

// 2. 图片懒加载
<img loading="lazy" src="image.jpg" alt="description">

// 3. 代码分割
const HeavyComponent = defineAsyncComponent(() => 
  import('@/components/HeavyComponent.vue')
)
```

### 问题10: 计算性能问题

**症状**: 复杂计算导致页面卡顿

**解决方案**:

```javascript
// 1. 使用Web Workers
const worker = new Worker('/workers/calculation-worker.js')
worker.postMessage({ data: calculationData })

// 2. 防抖处理
import { debounce } from 'lodash-es'
const debouncedCalculation = debounce(calculate, 300)

// 3. 分批处理
const processInBatches = async (data, batchSize = 100) => {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    await processBatch(batch)
    await new Promise(resolve => setTimeout(resolve, 0)) // 让出控制权
  }
}
```

## 网络和API问题

### 问题11: API请求失败

**症状**: 网络请求返回错误

**诊断步骤**:

```bash
# 1. 检查API端点
curl -I https://api.zinses-rechner.de/health

# 2. 检查CORS配置
# 查看浏览器控制台CORS错误

# 3. 验证API密钥
echo $VITE_ECB_API_KEY
```

**解决方案**:

```javascript
// 1. 添加重试机制
const apiCallWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

// 2. 添加超时处理
const fetchWithTimeout = (url, options, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ])
}
```

### 问题12: 跨域问题

**症状**: CORS错误阻止API调用

**解决方案**:

```javascript
// vite.config.ts - 开发环境代理
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.ecb.europa.eu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

```nginx
# 生产环境Nginx代理
location /api/ {
    proxy_pass https://api.ecb.europa.eu/;
    proxy_set_header Host api.ecb.europa.eu;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_ssl_server_name on;
}
```

## 浏览器兼容性问题

### 问题13: 旧浏览器不支持

**症状**: 在旧版浏览器中功能异常

**解决方案**:

```bash
# 1. 添加浏览器兼容性插件
npm install --save-dev @vitejs/plugin-legacy

# 2. 配置polyfills
# vite.config.ts
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ]
})
```

### 问题14: Safari特定问题

**常见Safari问题**:

```javascript
// 1. 日期解析问题
// 错误: new Date('2023-01-01')
// 正确: new Date('2023/01/01')

// 2. 模块导入问题
// 使用动态导入时添加.js扩展名

// 3. CSS兼容性
/* 添加Safari前缀 */
.element {
  -webkit-appearance: none;
  appearance: none;
}
```

## 安全相关问题

### 问题15: CSP违规

**症状**: 控制台显示CSP错误

**解决方案**:

```javascript
// 1. 更新CSP策略
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'"

// 2. 使用nonce
const nonce = generateNonce()
const csp = `script-src 'self' 'nonce-${nonce}'`

// 3. 避免内联脚本
// 将内联JavaScript移到外部文件
```

### 问题16: 敏感信息泄露

**检查清单**:

```bash
# 1. 检查构建产物中的敏感信息
grep -r "password\|secret\|key" dist/

# 2. 验证环境变量
printenv | grep -v VITE_ | grep -i secret

# 3. 检查源码映射
ls -la dist/*.map
# 生产环境应该删除或保护源码映射文件
```

## 诊断工具

### 系统诊断脚本

```bash
#!/bin/bash
# scripts/diagnose.sh

echo "🔍 系统诊断报告"
echo "=================="

echo "📋 基本信息:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "操作系统: $(uname -a)"

echo -e "\n📦 项目信息:"
echo "项目目录: $(pwd)"
echo "包管理器: $(ls package-lock.json yarn.lock pnpm-lock.yaml 2>/dev/null | head -1)"

echo -e "\n🔧 依赖检查:"
npm ls --depth=0 2>/dev/null | head -10

echo -e "\n🌐 网络检查:"
ping -c 1 google.com > /dev/null && echo "✅ 网络连接正常" || echo "❌ 网络连接异常"

echo -e "\n💾 磁盘空间:"
df -h . | tail -1

echo -e "\n🔍 端口检查:"
lsof -ti:5173 > /dev/null && echo "❌ 端口5173被占用" || echo "✅ 端口5173可用"

echo -e "\n📊 内存使用:"
free -h 2>/dev/null || vm_stat | head -5
```

### 性能监控脚本

```bash
#!/bin/bash
# scripts/performance-check.sh

echo "⚡ 性能检查"
echo "============"

# 构建时间测试
echo "🔨 构建性能测试:"
time npm run build > /dev/null 2>&1

# 包大小分析
echo -e "\n📦 包大小分析:"
du -sh dist/
find dist/ -name "*.js" -exec du -sh {} \; | sort -hr | head -5

# 依赖大小分析
echo -e "\n📚 依赖大小分析:"
npx cost-of-modules --no-install | head -10
```

### 健康检查脚本

```bash
#!/bin/bash
# scripts/health-check.sh

URL=${1:-"http://localhost:5173"}
echo "🏥 健康检查: $URL"

# HTTP状态检查
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL)
if [ $STATUS -eq 200 ]; then
    echo "✅ HTTP状态: $STATUS (正常)"
else
    echo "❌ HTTP状态: $STATUS (异常)"
    exit 1
fi

# 响应时间检查
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" $URL)
echo "⏱️  响应时间: ${RESPONSE_TIME}s"

# 内容检查
CONTENT=$(curl -s $URL | grep -o "<title>.*</title>")
echo "📄 页面标题: $CONTENT"

echo "🎉 健康检查完成"
```

## 获取帮助

### 日志收集

```bash
# 收集诊断信息
./scripts/diagnose.sh > diagnostic-report.txt
./scripts/health-check.sh >> diagnostic-report.txt

# 收集错误日志
npm run dev 2>&1 | tee dev-error.log
```

### 问题报告模板

```markdown
## 问题描述
[简要描述遇到的问题]

## 环境信息
- Node.js版本: 
- npm版本: 
- 操作系统: 
- 浏览器: 

## 重现步骤
1. 
2. 
3. 

## 预期行为
[描述期望的正确行为]

## 实际行为
[描述实际发生的情况]

## 错误信息
```
[粘贴完整的错误信息]
```

## 附加信息
[任何其他相关信息]
```

### 联系支持

- **GitHub Issues**: [问题报告](https://github.com/your-org/zinses-rechner/issues)
- **技术支持**: tech-support@zinses-rechner.de
- **社区论坛**: [讨论区](https://community.zinses-rechner.de)
- **文档**: [完整文档](https://docs.zinses-rechner.de)

---

**提示**: 在寻求帮助之前，请先运行诊断脚本并收集相关日志信息，这将有助于更快地解决问题。
