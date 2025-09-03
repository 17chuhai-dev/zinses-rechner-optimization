import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { resolve } from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import compression from 'vite-plugin-compression'
import { createHtmlPlugin } from 'vite-plugin-html'
import { splitVendorChunkPlugin } from 'vite'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  const isBuild = command === 'build'

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            // 生产环境移除注释和空白
            comments: !isProduction,
            whitespace: isProduction ? 'condense' : 'preserve'
          }
        }
      }),

      // 开发工具 - 仅开发环境（暂时禁用以避免配置问题）
      // ...(isProduction ? [] : [vueDevTools()]),

      // PWA配置
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24小时
                }
              }
            }
          ]
        },
        manifest: {
          name: 'Zinses Rechner',
          short_name: 'ZinsesRechner',
          description: 'Professional German Financial Calculator',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),

      // HTML处理插件
      createHtmlPlugin({
        minify: isProduction,
        inject: {
          data: {
            title: env.VITE_APP_TITLE || 'Zinses Rechner',
            description: env.VITE_APP_DESCRIPTION || 'Professional German Financial Calculator'
          }
        }
      }),

      // 代码分割插件
      splitVendorChunkPlugin(),

      // 传统浏览器支持
      isProduction && legacy({
        targets: ['defaults', 'not IE 11']
      }),

      // Gzip压缩
      ...(isProduction ? [compression({
        algorithm: 'gzip',
        ext: '.gz'
      })] : []),

      // Brotli压缩
      ...(isProduction ? [compression({
        algorithm: 'brotliCompress',
        ext: '.br'
      })] : []),

      // 构建分析器
      ...(process.env.ANALYZE ? [visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap'
      })] : [])
    ],
  resolve: {
    // 减少文件系统调用
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    // 别名配置
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url))
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
    build: {
      // 生产环境优化
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      minify: isProduction ? 'terser' : false,
      sourcemap: isProduction ? 'hidden' : true,
      cssCodeSplit: true,
      cssMinify: isProduction,

      // 构建性能优化
      reportCompressedSize: isProduction,
      chunkSizeWarningLimit: 500, // 降低警告阈值
      assetsInlineLimit: 4096,

      // 输出目录清理
      emptyOutDir: true,

      // Terser配置
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
          passes: 2
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false
        }
      } : {},

      // 并行构建优化
      rollupOptions: {
        // 并行处理
        maxParallelFileOps: 5,
        // 缓存优化
        cache: true,
        output: {
          // 代码分割优化 - Core Web Vitals优化
          manualChunks: (id) => {
            // 核心框架 - 最高优先级，最小化初始包
            if (id.includes('vue') && !id.includes('vue-chart') && !id.includes('vue-router')) {
              return 'vue'
            }
            if (id.includes('vue-router')) {
              return 'router'
            }
            if (id.includes('pinia')) {
              return 'store'
            }

            // UI框架 - 按需加载
            if (id.includes('@headlessui')) {
              return 'ui-headless'
            }
            if (id.includes('@heroicons')) {
              return 'ui-icons'
            }
            if (id.includes('tailwindcss')) {
              return 'ui-styles'
            }

            // 图表库 - 懒加载（大型库）
            if (id.includes('chart.js')) {
              return 'charts-core'
            }
            if (id.includes('vue-chartjs') || id.includes('chartjs-')) {
              return 'charts-vue'
            }
            if (id.includes('three') || id.includes('@three-ts')) {
              return 'charts-3d'
            }

            // 导出功能 - 懒加载（大型库）
            if (id.includes('jspdf')) {
              return 'export-pdf'
            }
            if (id.includes('xlsx') || id.includes('papaparse')) {
              return 'export-excel'
            }
            if (id.includes('html2canvas') || id.includes('file-saver')) {
              return 'export-utils'
            }

            // 工具库 - 按功能分割
            if (id.includes('date-fns')) {
              return 'utils-date'
            }
            if (id.includes('lodash') || id.includes('ramda')) {
              return 'utils-functional'
            }
            if (id.includes('axios') || id.includes('ky')) {
              return 'utils-http'
            }

            // 德语本地化 - 优化后的单一语言包
            if (id.includes('vue-i18n') || id.includes('@intlify')) {
              return 'de'
            }

            // 第三方库 - 通用分组
            if (id.includes('node_modules')) {
              // 小型工具库合并
              if (id.includes('nanoid') || id.includes('uuid') || id.includes('crypto-js')) {
                return 'vendor-libs'
              }
              // 计算器相关库
              if (id.includes('decimal.js') || id.includes('big.js')) {
                return 'math-libs'
              }
              return 'vendor-libs'
            }

            // 应用代码 - 按功能分割
            if (id.includes('/src/views/')) {
              if (id.includes('/calculator/')) return 'pages-calculator'
              if (id.includes('/admin/')) return 'pages-admin'
              if (id.includes('/user/')) return 'pages-user'
              return 'pages-common'
            }
            if (id.includes('/src/components/')) {
              if (id.includes('/calculator/')) return 'components-calculator'
              if (id.includes('/charts/')) return 'components-charts'
              if (id.includes('/admin/')) return 'components-admin'
              if (id.includes('/ui/')) return 'components-ui'
              return 'components-common'
            }
            if (id.includes('/src/services/')) {
              return 'services'
            }
            if (id.includes('/src/composables/')) {
              return 'composables'
            }
          },

          // 文件命名策略
          chunkFileNames: isProduction
            ? 'assets/js/[name]-[hash].js'
            : 'assets/js/[name].js',
          entryFileNames: isProduction
            ? 'assets/js/[name]-[hash].js'
            : 'assets/js/[name].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || []
            const ext = info[info.length - 1]

            if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
              return 'assets/fonts/[name]-[hash].[ext]'
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name || '')) {
              return 'assets/images/[name]-[hash].[ext]'
            }
            if (ext === 'css') {
              return 'assets/css/[name]-[hash].[ext]'
            }
            return 'assets/[name]-[hash].[ext]'
          }
        }
      },

      // 性能优化配置已在上面定义
    },
  server: {
    port: 5173,
    host: true,
    // 预热文件 - 提升开发体验
    warmup: {
      clientFiles: [
        './src/main.ts',
        './src/App.vue',
        './src/router/index.ts',
        './src/stores/index.ts',
        './src/services/I18nService.ts'
      ]
    },
    // API代理配置
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
    preview: {
      port: 4173,
      host: true,
    },

    // 预构建优化 - Core Web Vitals优化
    optimizeDeps: {
      include: [
        // 核心依赖 - 预构建以提升FCP
        'vue',
        'vue-router',
        'pinia',
        '@headlessui/vue',
        '@heroicons/vue/24/outline',
        '@heroicons/vue/24/solid',
        // 常用工具库
        'nanoid',
        'date-fns/format',
        'date-fns/parseISO',
        'date-fns/addDays',
        'date-fns/differenceInDays',
        'date-fns/startOfDay',
        'date-fns/endOfDay',
        // 加密工具
        'crypto-js/md5',
        'crypto-js/sha256'
      ],
      exclude: [
        // 排除大型库，使用动态导入优化LCP
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
        // 可选依赖
        'web-vitals',
        '@sentry/vue'
      ],
      // 强制预构建
      force: false,
      // 预构建缓存目录
      cacheDir: 'node_modules/.vite',
      // 预构建并发数
      esbuildOptions: {
        target: 'es2020'
      }
    },

    // 性能优化配置
    esbuild: {
      // 生产环境移除console和debugger
      drop: isProduction ? ['console', 'debugger'] : [],
      // 压缩标识符
      minifyIdentifiers: isProduction,
      // 压缩语法
      minifySyntax: isProduction,
      // 压缩空白
      minifyWhitespace: isProduction,
      // 目标环境
      target: 'es2020',
      // 法律注释
      legalComments: 'none'
    },



    // 实验性功能 - 提升性能
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          // 为JS文件添加预加载提示
          return { runtime: `window.__assetsPath("${filename}")` }
        }
        return { relative: true }
      }
    }
  }
})
