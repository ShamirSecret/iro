'use client'

import React, { ReactNode } from 'react'

import { WagmiProvider, type Config } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { cookieStorage, createStorage } from '@wagmi/core'

// 从环境变量读取 Reown Cloud 项目 ID
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID
if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID 未定义')
}

// 支持的网络列表
// @ts-ignore: 强制忽略网络类型不匹配
const networks = [mainnet, arbitrum] as any

// 初始化 Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
})
const wagmiConfig = wagmiAdapter.wagmiConfig

// React Query 客户端
const queryClient = new QueryClient()

// 创建 AppKit Modal
// @ts-ignore: 强制忽略 AppKitModal 类型错误
const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: mainnet,
  metadata: {
    name: 'PicWe DApp',
    description: 'Distributor Platform',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    icons: ['https://your-domain.com/icon.png'],
  },
}) as unknown as ReactNode

export function AppKitProvider({ children }: { children: ReactNode }) {
  // cookieToInitialState 需要读取 cookie，可根据需求添加
  return (
    <WagmiProvider config={wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        {children}
        {appKitModal}
      </QueryClientProvider>
    </WagmiProvider>
  )
} 