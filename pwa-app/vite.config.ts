import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // ユーザー確認型の更新（プロンプト表示）
      includeAssets: ['houi.png', 'logo.jpg'],
      manifest: {
        name: '検NET現地調査アプリ',
        short_name: '検NET',
        description: '建物検査のための現地調査アプリケーション',
        theme_color: '#059669',
        background_color: '#064e3b',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['business', 'productivity'],
        lang: 'ja'
      },
      workbox: {
        // Service Worker設定
        // registerType: 'prompt' と併用する場合、clientsClaim/skipWaitingは
        // 設定しない（設定するとneedRefreshが発火せず更新プロンプトが出ない）
        cleanupOutdatedCaches: true, // 古いキャッシュを自動削除
        
        // キャッシュ戦略
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // アプリシェル（HTML/JS/CSS）- キャッシュ優先
            urlPattern: /^https:\/\/.*\.(js|css|html)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-shell',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30日
              }
            }
          },
          {
            // 画像 - キャッシュ優先
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30日
              }
            }
          },
          {
            // フォント - キャッシュ優先
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
              }
            }
          }
        ],
        // オフラインフォールバック
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/]
      },
      devOptions: {
        enabled: true // 開発時もService Workerを有効化
      }
    })
  ],
  server: {
    proxy: {
      // /api/* へのリクエストをExpressサーバーに転送
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
