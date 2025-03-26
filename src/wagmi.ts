import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, createConfig } from '@wagmi/core'
import {
  //arbitrum,
  //base,
  mainnet,
  //optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'GroupMarketplace',
  projectId: 'c0ad75559dfc6a5e76a0d1094c7c4b03',
  chains: [
    mainnet,
    polygon,
    //optimism,
    //arbitrum,
    //base,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
});

export const configB = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
