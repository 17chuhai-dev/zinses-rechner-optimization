<template>
  <div class="developer-portal">
    <!-- 头部 -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div class="container mx-auto px-4 py-16">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">
            Zinses-Rechner API
          </h1>
          <p class="text-xl md:text-2xl mb-8 opacity-90">
            Integrieren Sie leistungsstarke Finanzberechnungen in Ihre Anwendungen
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              @click="scrollToSection('getting-started')"
              class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Erste Schritte
            </button>
            <button
              @click="scrollToSection('api-reference')"
              class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              API-Referenz
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导航 -->
    <nav class="bg-white border-b sticky top-0 z-10">
      <div class="container mx-auto px-4">
        <div class="flex space-x-8 overflow-x-auto">
          <button
            v-for="section in sections"
            :key="section.id"
            @click="activeSection = section.id"
            :class="[
              'py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
              activeSection === section.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ section.name }}
          </button>
        </div>
      </div>
    </nav>

    <!-- 内容区域 -->
    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- 侧边栏 -->
        <div class="lg:col-span-1">
          <div class="sticky top-24">
            <div class="bg-white rounded-lg shadow-sm border p-6">
              <h3 class="font-semibold text-gray-900 mb-4">快速导航</h3>
              <nav class="space-y-2">
                <a
                  v-for="section in sections"
                  :key="section.id"
                  @click="activeSection = section.id"
                  :class="[
                    'block px-3 py-2 rounded-md text-sm cursor-pointer transition-colors',
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  ]"
                >
                  {{ section.name }}
                </a>
              </nav>
            </div>

            <!-- API状态 -->
            <div class="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <h3 class="font-semibold text-gray-900 mb-4">API状态</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">状态</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <div class="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
                    正常运行
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">版本</span>
                  <span class="text-sm font-medium text-gray-900">v1.0.0</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">响应时间</span>
                  <span class="text-sm font-medium text-gray-900">< 100ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 主内容 -->
        <div class="lg:col-span-3">
          <!-- 概述 -->
          <section v-show="activeSection === 'overview'" id="overview">
            <div class="bg-white rounded-lg shadow-sm border p-8">
              <h2 class="text-3xl font-bold text-gray-900 mb-6">API概述</h2>
              
              <div class="prose max-w-none">
                <p class="text-lg text-gray-600 mb-6">
                  Zinses-Rechner API提供了一套完整的RESTful接口，让您可以轻松地将我们的金融计算功能集成到您的应用程序中。
                </p>

                <h3 class="text-xl font-semibold text-gray-900 mb-4">主要功能</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div class="border rounded-lg p-6">
                    <div class="flex items-center mb-3">
                      <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                        </svg>
                      </div>
                      <h4 class="font-semibold text-gray-900">金融计算器</h4>
                    </div>
                    <p class="text-gray-600 text-sm">
                      复利计算、贷款计算、房贷计算等多种金融工具
                    </p>
                  </div>

                  <div class="border rounded-lg p-6">
                    <div class="flex items-center mb-3">
                      <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <h4 class="font-semibold text-gray-900">DSGVO合规</h4>
                    </div>
                    <p class="text-gray-600 text-sm">
                      完全符合欧盟数据保护法规，保护用户隐私
                    </p>
                  </div>

                  <div class="border rounded-lg p-6">
                    <div class="flex items-center mb-3">
                      <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                        </svg>
                      </div>
                      <h4 class="font-semibold text-gray-900">实时数据</h4>
                    </div>
                    <p class="text-gray-600 text-sm">
                      实时计算结果，支持复杂的金融场景分析
                    </p>
                  </div>

                  <div class="border rounded-lg p-6">
                    <div class="flex items-center mb-3">
                      <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fill-rule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 1a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <h4 class="font-semibold text-gray-900">详细报告</h4>
                    </div>
                    <p class="text-gray-600 text-sm">
                      生成详细的计算报告和可视化图表
                    </p>
                  </div>
                </div>

                <h3 class="text-xl font-semibold text-gray-900 mb-4">技术规格</h3>
                <ul class="list-disc list-inside space-y-2 text-gray-600">
                  <li>RESTful API设计，支持JSON格式</li>
                  <li>JWT认证和API密钥认证</li>
                  <li>Rate limiting保护</li>
                  <li>OpenAPI 3.0规范</li>
                  <li>HTTPS加密传输</li>
                  <li>多语言SDK支持</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- 快速开始 -->
          <section v-show="activeSection === 'getting-started'" id="getting-started">
            <div class="bg-white rounded-lg shadow-sm border p-8">
              <h2 class="text-3xl font-bold text-gray-900 mb-6">快速开始</h2>
              
              <div class="space-y-8">
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-4">1. 获取API密钥</h3>
                  <p class="text-gray-600 mb-4">
                    首先，您需要注册账户并获取API密钥：
                  </p>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <code class="text-sm">
                      curl -X POST https://api.zinses-rechner.de/v1/auth/register \<br>
                      &nbsp;&nbsp;-H "Content-Type: application/json" \<br>
                      &nbsp;&nbsp;-d '{"email": "your@email.com", "password": "your-password"}'
                    </code>
                  </div>
                </div>

                <div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-4">2. 进行第一次API调用</h3>
                  <p class="text-gray-600 mb-4">
                    使用您的API密钥进行复利计算：
                  </p>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <code class="text-sm">
                      curl -X POST https://api.zinses-rechner.de/v1/calculators/compound-interest/calculate \<br>
                      &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" \<br>
                      &nbsp;&nbsp;-H "Content-Type: application/json" \<br>
                      &nbsp;&nbsp;-d '{<br>
                      &nbsp;&nbsp;&nbsp;&nbsp;"input": {<br>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"principal": 10000,<br>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"monthlyPayment": 200,<br>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"annualRate": 5.5,<br>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"years": 20<br>
                      &nbsp;&nbsp;&nbsp;&nbsp;}<br>
                      &nbsp;&nbsp;}'
                    </code>
                  </div>
                </div>

                <div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-4">3. 处理响应</h3>
                  <p class="text-gray-600 mb-4">
                    API将返回详细的计算结果：
                  </p>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <code class="text-sm">
                      {<br>
                      &nbsp;&nbsp;"data": {<br>
                      &nbsp;&nbsp;&nbsp;&nbsp;"finalAmount": 89206.77,<br>
                      &nbsp;&nbsp;&nbsp;&nbsp;"totalInterest": 31206.77,<br>
                      &nbsp;&nbsp;&nbsp;&nbsp;"totalContributions": 58000,<br>
                      &nbsp;&nbsp;&nbsp;&nbsp;"effectiveRate": 5.5,<br>
                      &nbsp;&nbsp;&nbsp;&nbsp;"yearlyBreakdown": [...]<br>
                      &nbsp;&nbsp;},<br>
                      &nbsp;&nbsp;"status": 200,<br>
                      &nbsp;&nbsp;"success": true<br>
                      }
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- API参考 -->
          <section v-show="activeSection === 'api-reference'" id="api-reference">
            <div class="bg-white rounded-lg shadow-sm border p-8">
              <h2 class="text-3xl font-bold text-gray-900 mb-6">API参考</h2>
              
              <div class="space-y-8">
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-4">基础URL</h3>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <code class="text-sm font-mono">https://api.zinses-rechner.de/v1</code>
                  </div>
                </div>

                <div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-4">认证</h3>
                  <p class="text-gray-600 mb-4">
                    所有API请求都需要在请求头中包含认证信息：
                  </p>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <code class="text-sm">Authorization: Bearer YOUR_API_KEY</code>
                  </div>
                </div>

                <div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-4">端点列表</h3>
                  <div class="space-y-4">
                    <div class="border rounded-lg p-4">
                      <div class="flex items-center mb-2">
                        <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mr-3">POST</span>
                        <code class="text-sm font-mono">/calculators/compound-interest/calculate</code>
                      </div>
                      <p class="text-gray-600 text-sm">复利计算</p>
                    </div>

                    <div class="border rounded-lg p-4">
                      <div class="flex items-center mb-2">
                        <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mr-3">POST</span>
                        <code class="text-sm font-mono">/calculators/loan/calculate</code>
                      </div>
                      <p class="text-gray-600 text-sm">贷款计算</p>
                    </div>

                    <div class="border rounded-lg p-4">
                      <div class="flex items-center mb-2">
                        <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mr-3">POST</span>
                        <code class="text-sm font-mono">/calculators/mortgage/calculate</code>
                      </div>
                      <p class="text-gray-600 text-sm">房贷计算</p>
                    </div>

                    <div class="border rounded-lg p-4">
                      <div class="flex items-center mb-2">
                        <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-3">GET</span>
                        <code class="text-sm font-mono">/calculators/history</code>
                      </div>
                      <p class="text-gray-600 text-sm">获取计算历史</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- SDK和示例 -->
          <section v-show="activeSection === 'sdks'" id="sdks">
            <div class="bg-white rounded-lg shadow-sm border p-8">
              <h2 class="text-3xl font-bold text-gray-900 mb-6">SDK和示例</h2>
              
              <div class="space-y-8">
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-4">官方SDK</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="border rounded-lg p-4 text-center">
                      <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <span class="text-yellow-600 font-bold">JS</span>
                      </div>
                      <h4 class="font-semibold text-gray-900 mb-2">JavaScript/Node.js</h4>
                      <p class="text-sm text-gray-600 mb-3">npm install zinses-rechner-sdk</p>
                      <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        查看文档 →
                      </button>
                    </div>

                    <div class="border rounded-lg p-4 text-center">
                      <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <span class="text-blue-600 font-bold">PY</span>
                      </div>
                      <h4 class="font-semibold text-gray-900 mb-2">Python</h4>
                      <p class="text-sm text-gray-600 mb-3">pip install zinses-rechner</p>
                      <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        查看文档 →
                      </button>
                    </div>

                    <div class="border rounded-lg p-4 text-center">
                      <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <span class="text-red-600 font-bold">PHP</span>
                      </div>
                      <h4 class="font-semibold text-gray-900 mb-2">PHP</h4>
                      <p class="text-sm text-gray-600 mb-3">composer require zinses-rechner/sdk</p>
                      <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        查看文档 →
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-4">代码示例</h3>
                  <div class="space-y-4">
                    <div>
                      <h4 class="font-medium text-gray-900 mb-2">JavaScript示例</h4>
                      <div class="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                        <pre><code class="text-sm">import { ZinsesRechnerAPI } from 'zinses-rechner-sdk';

const api = new ZinsesRechnerAPI('YOUR_API_KEY');

const result = await api.compoundInterest.calculate({
  principal: 10000,
  monthlyPayment: 200,
  annualRate: 5.5,
  years: 20
});

console.log('Final Amount:', result.finalAmount);</code></pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 响应式数据
const activeSection = ref('overview')

// 导航部分
const sections = [
  { id: 'overview', name: '概述' },
  { id: 'getting-started', name: '快速开始' },
  { id: 'api-reference', name: 'API参考' },
  { id: 'sdks', name: 'SDK和示例' }
]

// 方法
const scrollToSection = (sectionId: string) => {
  activeSection.value = sectionId
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

// 页面元数据
onMounted(() => {
  document.title = 'API文档 - Zinses-Rechner'
})
</script>

<style scoped>
.developer-portal {
  min-height: 100vh;
  background-color: #f9fafb;
}

.prose {
  line-height: 1.7;
}

.prose h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.prose p {
  margin-bottom: 1rem;
}

.prose ul {
  margin-bottom: 1.5rem;
}

.prose li {
  margin-bottom: 0.5rem;
}

code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.4;
}

pre code {
  display: block;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 滚动条样式 */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
