
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

  css: {
    postcss: false // 禁用PostCSS
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
