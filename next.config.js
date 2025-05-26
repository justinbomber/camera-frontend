/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 添加配置以允許來自其他IP地址的訪問
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, Cache-Control, Pragma',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
        ],
      },
    ]
  },
  // 移除錯誤的重定向配置，讓Next.js正常處理路由
  // 不需要手動重定向，讓 app/page.tsx 處理根路由邏輯
  // 啟用獨立輸出模式，這是Docker部署所需要的
  output: 'standalone',
  // 修改webpack配置
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    // 修正 externals 配置格式
    if (!isServer) {
      config.externals = {
        ...(config.externals || {}),
        'h265web.js': 'H265webjs'
      }
    }

    // 添加wasm文件加載器
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    })

    return config
  },
}

module.exports = nextConfig 