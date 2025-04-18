import { useEffect, useState } from "react";
import { readContract } from '@wagmi/core';
import minimalERC721ABI from "../contracts/minimalERC721ABI.json";
import { config } from "@/wagmi";

export const useFetchContractTokens = (
    contractAddress: `0x${string}` | undefined,
    page: number = 0,
    limit: number = 20
) => {
    const [tokenData, setTokenData] = useState<any[]>([]);
    const [totalSupply, setTotalSupply] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [realTokenCount, setRealTokenCount] = useState<number>(0);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        const fetchTokens = async () => {
            if (!contractAddress) return;
            setLoading(true);

            let estimatedSupply = 0;

            try {
                // Attempt to fetch totalSupply
                const total = await readContract(config, {
                    address: contractAddress,
                    abi: minimalERC721ABI,
                    functionName: "totalSupply",
                }) as bigint;

                estimatedSupply = Number(total);
                setTotalSupply(estimatedSupply);
            } catch (err) {
                console.warn("totalSupply() not available, estimating...");

                // Fallback: estimate totalSupply by probing in chunks
                const step = 100;
                let tokenId = 0;
                let foundTokens = true;

                while (foundTokens) {
                    const results = await Promise.all(
                        Array.from({ length: step }, (_, i) => tokenId + i).map(async (id) => {
                            try {
                                await readContract(config, {
                                    address: contractAddress,
                                    abi: minimalERC721ABI,
                                    functionName: "tokenURI",
                                    args: [BigInt(id)],
                                });
                                return true;
                            } catch {
                                return false;
                            }
                        })
                    );

                    const validCount = results.filter(Boolean).length;
                    if (validCount === 0) {
                        foundTokens = false;
                    } else {
                        tokenId += step;
                    }
                }

                estimatedSupply = tokenId;
                // If nothing was found, make sure totalSupply is 0
                if (estimatedSupply === 0) {
                    setTokenData([]); // Ensure it's clear
                }
                setTotalSupply(estimatedSupply);
            }

            const startIndex = page * limit;
            const endIndex = Math.min(startIndex + limit * 5, estimatedSupply); // overfetch to skip blanks
            const results: any[] = [];

            for (let tokenId = startIndex; tokenId < endIndex && results.length < limit; tokenId++) {
                try {
                    const [tokenURI, tokenOwner] = await Promise.all([
                        readContract(config, {
                            address: contractAddress,
                            abi: minimalERC721ABI,
                            functionName: "tokenURI",
                            args: [BigInt(tokenId)],
                        }),
                        readContract(config, {
                            address: contractAddress,
                            abi: minimalERC721ABI,
                            functionName: "ownerOf",
                            args: [BigInt(tokenId)],
                        }),
                    ]);

                    if (tokenURI && tokenOwner) {
                        results.push({
                            tokenId,
                            tokenUri: tokenURI,
                            owner: tokenOwner,
                        });
                    }
                } catch (e) {
                    console.warn(`Token ${tokenId} fetch failed`, e);
                }
            }

            setTokenData(results);
            setRealTokenCount(estimatedSupply);
            setHasMore(endIndex < estimatedSupply);
            setLoading(false);
        };

        fetchTokens();
    }, [contractAddress, page, limit]);

    return {
        tokenData,
        totalSupply,
        loading,
        realTokenCount,
        hasMore,
    };
};
