import { useEffect, useState } from "react";
import { readContract } from '@wagmi/core';
import minimalERC721ABI from "../contracts/minimalERC721ABI.json";
import { getContract } from "viem";
import { config } from "@/wagmi"; // Adjust path if needed

export const useFetchContractTokens = (
    contractAddress: `0x${string}` | undefined,
    page: number = 0,
    limit: number = 20
) => {
    const [tokenData, setTokenData] = useState<any[]>([]);
    const [totalSupply, setTotalSupply] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTokens = async () => {
            if (!contractAddress) return [];
            setLoading(true);
            try {
                // Get totalSupply first
                const total = await readContract(config, {
                    address: contractAddress,
                    abi: minimalERC721ABI,
                    functionName: "totalSupply",
                }) as bigint;
                setTotalSupply(Number(total));

                const startIndex = page * limit;
                const endIndex = Math.min(startIndex + limit * 5, Number(total)); // overfetch to skip blanks
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
                        // Token might not exist
                        console.warn(`Token ${tokenId} fetch failed`, e);
                    }
                }

                setTokenData(results);
            } catch (err) {
                console.error("Failed to fetch totalSupply or token data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTokens();
    }, [contractAddress, page, limit]);

    return {
        tokenData,
        totalSupply,
        loading,
    };
};
