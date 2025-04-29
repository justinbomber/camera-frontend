"use client"

import H265Player from '@/components/H265Player'

export default function H265DemoPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">H.265 播放器示例</h1>
      <H265Player 
        videoUrl="https://h265webjs.org/videos/big_buck_bunny_265.mp4"
        width={960}
        height={540}
      />
    </div>
  )
} 