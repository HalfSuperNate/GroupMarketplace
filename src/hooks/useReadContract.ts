import { useReadContract } from "wagmi";
import contractABI from "../contracts/GroupMarketplace.json";

const CONTRACT_ADDRESS = `0x70261103D4dBC11A178F71475D2824Ad1a9d6972`;

export const useReadMarketplace = () => {

  // ✅ Function to read metadata with dynamic tokenId
  const fetchMetadata = (tokenId: number) => {
    return useReadContract({
      abi: contractABI,
      address: CONTRACT_ADDRESS,
      functionName: "getMetadata",
      args: [tokenId],
    });
  };

  // ✅ Function to read token owner dynamically
  const fetchOwner = (tokenId: number) => {
    return useReadContract({
      abi: contractABI,
      address: CONTRACT_ADDRESS,
      functionName: "ownerOf",
      args: [tokenId],
    });
  };

  // ✅ Function to read token price dynamically
  const fetchPrice = (tokenId: number) => {
    return useReadContract({
      abi: contractABI,
      address: CONTRACT_ADDRESS,
      functionName: "getTokenPrice",
      args: [tokenId],
    });
  };

  return {
    fetchMetadata,
    fetchOwner,
    fetchPrice,
  };
};
