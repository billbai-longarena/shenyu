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
        // 开发环境中的文件列表API
        server.middlewares.use('/json-files-list.json', (req, res) => {
          try {
            const itemCNDir = path.resolve(process.cwd(), 'public/item_CN')
            const files = fs.readdirSync(itemCNDir)
            const jsonFiles = files
              .filter(file => file.endsWith('.json'))
              .map(file => ({
                filename: file,
                encodedFilename: `item_CN/${encodeURIComponent(file)}`
              }))

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(jsonFiles, null, 2))
          } catch (error) {
            console.error('Error reading public directory:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to read directory' }))
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
