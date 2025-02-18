import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000, // 增加chunk大小警告限制到1000kb
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url))
      },
      external: ['pdfjs-dist/build/pdf.worker.min.js'],
      output: {
        manualChunks(id) {
          // 只按模块分割视图代码
          if (id.includes('/src/views/')) {
            const matches = id.match(/\/src\/views\/([^/]+)/)
            if (matches) {
              return `view-${matches[1]}`
            }
          }
          // 让Vite自动处理node_modules的分割
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  },
  plugins: [
    vue(),
    {
      name: 'json-files',
      configureServer(server) {
        // 监听文件变化并更新文件列表
        const updateFileList = async () => {
          const { generateFileList } = await import('./scripts/generate-file-list')
          generateFileList()
        }

        // 在服务器启动时生成文件列表
        updateFileList()

        // 监听文件变化
        server.watcher.on('add', (path) => {
          if (path.includes('/public/item_CN/') || path.includes('/public/item_EN/')) {
            updateFileList()
          }
        })

        server.watcher.on('change', (path) => {
          if (path.includes('/public/item_CN/') || path.includes('/public/item_EN/')) {
            updateFileList()
          }
        })

        server.watcher.on('unlink', (path) => {
          if (path.includes('/public/item_CN/') || path.includes('/public/item_EN/')) {
            updateFileList()
          }
        })
      },
      async closeBundle() {
        // 在构建完成后生成文件列表
        const { generateFileList } = await import('./scripts/generate-file-list')
        generateFileList()
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  root: process.cwd(),
  base: './',
  server: {
    port: 8080,
    fs: {
      // 允许为项目根目录提供服务
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
    hmr: true
  }
})
