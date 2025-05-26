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
  // 修改重定向配置
  async redirects() {
    return [
      // 將根目錄重定向到 /mainpage
      {
        source: '/',
        destination: '/mainpage',
        permanent: true,
      },
      // 將所有不是 mainpage 的路徑重定向到 404 頁面
      {
        source: '/:path((?!mainpage).*)',
        destination: '/not-found',
        permanent: false,
      },
    ]
  },
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