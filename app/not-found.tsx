import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h2 className="text-6xl font-bold mb-4">404</h2>
      <p className="text-xl mb-8">此頁面無法找到。</p>
      <Link href="/" className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors">
        返回首頁
      </Link>
    </div>
  )
} 