import { useState } from "react";
import { parseEther } from "viem"; 
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { toaster } from "../components/ui/toaster";
import contractABI from "../contracts/GroupMarketplace.json";

const CONTRACT_ADDRESS = `0x0100a530469DB0Dd44c9Af210A465883668C7797`;
export const NATIVE_TOKEN = "POL";

export const useContract = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContract } = useWriteContract();
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  // ✅ Toast helper
  const showToast = (
    description: string,
    type: "success" | "error" | "info" | "warning"
  ) => {
    toaster.create({
      description,
      type,
      duration: 4000,
      closable: true,
    });
  };

  // ✅ Unified transaction handler
  const handleTransaction = async (
    contractCall: () => Promise<any>,
    successMessage: string,
    errorMessage: string
  ) => {
    try {
      setLoading(true);

      const result = await contractCall(); // Execute contract call
      if (result && result.hash) {
        setTxHash(result.hash); // Store the transaction hash immediately
        showToast("Transaction sent. Waiting for confirmation...", "info");

        // Wait for confirmation
        const receipt = await result.wait();
        if (receipt?.status === "success") {
          showToast(successMessage, "success");
        } else {
          showToast("Transaction failed.", "error");
        }
      }
    } catch (error: any) {
      console.error("Transaction error:", error);
      showToast(errorMessage || `Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Contract Actions

  // Set Metadata
  const setMetadata = async (
    group: string,
    batchSize: number,
    startingNumber: number,
    groupURI: string,
    appendNumberToGroupURI: number,
    groupURIext: string,
    metadata: {
      name: string;
      description: string;
      externalUrl: string;
      image: string;
      animationUrl: string;
      youtubeUrl: string;
      backgroundColor: string;
      attributes: string;
      creator: string;
      locked: boolean;
      price: string;
    },
    appendNumber: boolean,
    appendNumberToImage: boolean,
    imageExtension: string,
    appendNumberToAnim: boolean,
    animExtension: string
  ) => {
    try {
  
      await handleTransaction(
        async () =>
          await writeContract({
            abi: contractABI,
            address: CONTRACT_ADDRESS,
            functionName: "setMetadata",
            args: [[
              group,                         // string group
              batchSize,                      // uint256 batchSize
              startingNumber,                 // uint256 startingNumber
              groupURI,                       // string groupURI
              appendNumberToGroupURI,         // uint8 appendNumberToGroupURI
              groupURIext,                    // string groupURIext
              [
                metadata.name,                // string name
                metadata.description,         // string description
                metadata.externalUrl,         // string externalUrl
                metadata.image,               // string image
                metadata.animationUrl,        // string animationUrl
                metadata.youtubeUrl,          // string youtubeUrl
                metadata.backgroundColor,     // string backgroundColor
                metadata.attributes,          // string attributes (encoded JSON string)
                metadata.creator,             // address creator
                metadata.locked,              // bool locked
                parseEther(metadata.price)    // uint256 price in wei
              ],
              appendNumber,                   // bool appendNumber
              appendNumberToImage,            // bool appendNumberToImage
              imageExtension,                 // string imageExtension
              appendNumberToAnim,             // bool appendNumberToAnim
              animExtension                   // string animExtension
            ]],
            value: parseEther(((0.00005 * batchSize) + 0.0005).toString()),
          }),
        "Metadata set successfully!",
        "Failed to set metadata"
      );
    } catch (error) {
      console.error("Error setting metadata:", error);
    }
  };

  // Mint Token
  const mintToken = async (tokenId: number, price: bigint) => {
    if (tokenId === null || price === undefined) return;
    await handleTransaction(
      async () =>
        await writeContract({
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "mint",
          args: [tokenId],
          value: price,
        }),
      "Token minted successfully!",
      "Failed to mint token"
    );
  };

  // List Token
  const listToken = async (tokenId: number, price: bigint, duration: bigint) => {
    if (tokenId === null || price === undefined) return;
    await handleTransaction(
      async () =>
        await writeContract({
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "listTokenForSale",
          args: [tokenId, price, duration],
        }),
      "Token listed successfully!",
      "Failed to list token"
    );
  };

  // Buy Token
  const buyToken = async (tokenId: number, price: bigint) => {
    if (tokenId === null || price === undefined) return;
    await handleTransaction(
      async () =>
        await writeContract({
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "buyToken",
          args: [tokenId],
          value: price,
        }),
      "Token purchased successfully!",
      "Failed to buy token"
    );
  };

  // Cancel Listing
  const cancelListing = async (tokenId: number) => {
    await handleTransaction(
      async () =>
        await writeContract({
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "cancelListing",
          args: [tokenId],
        }),
      "Listing canceled successfully!",
      "Failed to cancel listing"
    );
  };

  // Move Token to Group
  const moveTokenToGroup = async (tokenId: number, newGroup: string) => {
    await handleTransaction(
      async () =>
        await writeContract({
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "moveTokenToGroup",
          args: [tokenId, newGroup],
        }),
      "Token moved to new group successfully!",
      "Failed to move token to group"
    );
  };

  return {
    loading: loading || isLoading,
    setMetadata,
    mintToken,
    listToken,
    buyToken,
    cancelListing,
    moveTokenToGroup,
    txHash,
  };
};
