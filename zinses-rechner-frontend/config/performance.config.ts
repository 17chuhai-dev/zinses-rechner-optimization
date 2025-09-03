/**
 * 性能优化配置
 * 集中管理所有性能相关的配置选项
 */

// 代码分割配置
export const chunkSplitConfig = {
  // 核心框架包 - 最高优先级
  core: {
    vue: ['vue', '@vue/runtime-core', '@vue/runtime-dom', '@vue/reactivity'],
    router: ['vue-router'],
    store: ['pinia']
  },

  // UI组件包 - 按需加载
  ui: {
    headless: ['@headlessui/vue'],
    icons: ['@heroicons/vue'],
    styles: ['tailwindcss']
  },

  // 图表库包 - 懒加载
  charts: {
    core: ['chart.js', 'chartjs-adapter-date-fns'],
    vue: ['vue-chartjs'],
    three: ['three', '@three-ts/orbit-controls']
  },

  // 导出功能包 - 懒加载
  export: {
    pdf: ['jspdf', 'jspdf-autotable'],
    excel: ['xlsx', 'papaparse'],
    utils: ['html2canvas', 'file-saver']
  },

  // 工具库包
  utils: {
    date: ['date-fns'],
    functional: ['lodash-es', 'ramda'],
    http: ['axios', 'ky'],
    crypto: ['crypto-js', 'nanoid']
  },

  // 开发工具包 - 仅开发环境
  devtools: ['vite-plugin-vue-devtools', '@vue/devtools-api']
}

// 预构建优化配置
export const optimizeDepsConfig = {
  // 强制预构建的包
  include: [
    // 核心依赖
    'vue',
    'vue-router',
    'pinia',

    // UI组件
    '@headlessui/vue',
    '@heroicons/vue/24/outline',
    '@heroicons/vue/24/solid',

    // 常用工具
    'nanoid',
    'date-fns/format',
    'date-fns/parseISO',
    'date-fns/addDays',
    'date-fns/differenceInDays',
    'date-fns/startOfDay',
    'date-fns/endOfDay',

    // 小型工具库
    'crypto-js/md5',
    'crypto-js/sha256'
  ],

  // 排除预构建的包
  exclude: [
    // 大型库 - 使用动态导入
    'chart.js',
    'vue-chartjs',
    'three',
    'jspdf',
    'xlsx',
    'papaparse',
    'html2canvas',
    'file-saver',

    // 开发工具
    'vite-plugin-vue-devtools',
    '@vue/devtools-api',

    // 可选依赖
    'web-vitals',
    '@sentry/vue'
  ]
}

// 构建优化配置
export const buildOptimizationConfig = {
  // 目标浏览器 - 基于德语市场主流浏览器
  target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],

  // 代码分割阈值 - 优化后降低
  chunkSizeWarningLimit: 400, // KB (从500KB降低)

  // 内联资源阈值 - 优化小文件内联
  assetsInlineLimit: 8192, // bytes (从4096提升到8192)

  // Terser配置 - 优化压缩策略
  terserOptions: {
    compress: {
      // 移除console - 生产环境
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      // 优化选项 - 提升压缩效果
      passes: 3, // 增加到3次
      unsafe: false,
      unsafe_comps: false,
      unsafe_Function: false,
      unsafe_math: true, // 启用数学优化
      unsafe_symbols: false,
      unsafe_methods: false,
      unsafe_proto: false,
      unsafe_regexp: false,
      unsafe_undefined: false,
      // 移除未使用代码
      dead_code: true,
      unused: true,
      // 德语专注优化
      reduce_vars: true,
      reduce_funcs: true,
      collapse_vars: true,
      // 字符串优化
      join_vars: true,
      sequences: true
    },
    mangle: {
      safari10: true,
      properties: false,
      // 保留德语相关函数名
      reserved: ['t', 'i18n', 'de']
    },
    format: {
      comments: false,
      ascii_only: true,
      // 优化输出格式
      beautify: false,
      indent_level: 0
    }
  },

  // CSS优化
  cssCodeSplit: true,
  cssMinify: true
}

// 服务器配置
export const serverConfig = {
  // 开发服务器
  dev: {
    port: 5173,
    host: true,
    strictPort: false,
    open: false,
    cors: true,
    // 预热文件
    warmup: {
      clientFiles: [
        './src/main.ts',
        './src/App.vue',
        './src/router/index.ts',
        './src/stores/index.ts'
      ]
    }
  },

  // 预览服务器
  preview: {
    port: 4173,
    host: true,
    strictPort: false,
    open: false,
    cors: true
  }
}

// 缓存配置
export const cacheConfig = {
  // 依赖缓存
  deps: {
    cacheDir: 'node_modules/.vite',
    force: false
  },

  // 构建缓存
  build: {
    // 启用持久化缓存
    cache: true,
    // 缓存目录
    cacheDir: '.vite-cache'
  }
}

// 性能预算配置
export const performanceBudgetConfig = {
  // 包大小限制
  budgets: [
    {
      type: 'initial',
      maximumWarning: '500kb',
      maximumError: '1mb'
    },
    {
      type: 'anyComponentStyle',
      maximumWarning: '50kb',
      maximumError: '100kb'
    },
    {
      type: 'any',
      maximumWarning: '200kb',
      maximumError: '400kb'
    }
  ],

  // Core Web Vitals目标
  webVitals: {
    fcp: 1.5, // First Contentful Paint (秒)
    lcp: 2.5, // Largest Contentful Paint (秒)
    fid: 100, // First Input Delay (毫秒)
    cls: 0.1, // Cumulative Layout Shift
    ttfb: 600 // Time to First Byte (毫秒)
  }
}

// 懒加载配置
export const lazyLoadingConfig = {
  // 路由懒加载
  routes: {
    // 预加载策略
    preloadStrategy: 'hover', // 'hover' | 'visible' | 'none'
    // 预加载延迟
    preloadDelay: 200,
    // 块预取
    chunkPrefetch: true
  },

  // 组件懒加载
  components: {
    // 大型组件
    heavy: [
      'ChartComponent',
      'ExportPanel',
      'AdminDashboard',
      'AdvancedCalculator'
    ],
    // 条件加载组件
    conditional: [
      'UserProfile',
      'Settings',
      'HelpCenter'
    ]
  },

  // 图片懒加载
  images: {
    // 占位符
    placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
    // 加载阈值
    threshold: 0.1,
    // 根边距
    rootMargin: '50px'
  }
}

// 压缩配置
export const compressionConfig = {
  // Gzip压缩
  gzip: {
    algorithm: 'gzip',
    ext: '.gz',
    threshold: 1024,
    compressionOptions: {
      level: 9
    }
  },

  // Brotli压缩
  brotli: {
    algorithm: 'brotliCompress',
    ext: '.br',
    threshold: 1024,
    compressionOptions: {
      params: {
        [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11
      }
    }
  }
}

// PWA配置
export const pwaConfig = {
  registerType: 'autoUpdate',
  workbox: {
    // 缓存文件模式
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    // 忽略文件
    globIgnores: ['**/node_modules/**/*'],
    // 运行时缓存
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 // 24小时
          },
          cacheKeyWillBeUsed: async ({ request }) => {
            return `${request.url}?v=${Date.now()}`
          }
        }
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
          }
        }
      }
    ],
    // 跳过等待
    skipWaiting: true,
    // 客户端声明
    clientsClaim: true
  }
}

// 开发优化配置
export const devOptimizationConfig = {
  // HMR配置
  hmr: {
    port: 24678,
    overlay: true
  },

  // 源码映射
  sourcemap: true,

  // 清除控制台
  clearScreen: false,

  // 日志级别
  logLevel: 'info'
}
