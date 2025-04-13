// pages/api/groupExists.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http } from 'viem';
import { polygonAmoy } from 'viem/chains';
import contractABI from '@/contracts/GroupMarketplace.json';
import { CONTRACT_ADDRESS } from '@/hooks/useReadContract';

const client = createPublicClient({
  chain: polygonAmoy,
  transport: http(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.query;

  if (typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid group name' });
  }

  try {
    const tokenIds = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'getTokensByGroup',
      args: [name],
    });

    const exists = Array.isArray(tokenIds) && tokenIds.length > 0;

    res.status(200).json({ exists });
  } catch (err) {
    console.error('Error checking group existence:', err);
    res.status(200).json({ exists: false });
  }
}
