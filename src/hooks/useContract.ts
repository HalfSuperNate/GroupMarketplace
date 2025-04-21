import { useState } from "react";
import { parseEther, BaseError, ContractFunctionRevertedError } from "viem"; 
import { config } from '../wagmi';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { writeContract, waitForTransactionReceipt, simulateContract } from '@wagmi/core'
import { toaster } from "../components/ui/toaster";
import contractABI from "../contracts/GroupMarketplace.json";

const CONTRACT_ADDRESS = `0x0100a530469DB0Dd44c9Af210A465883668C7797`;
export const NATIVE_TOKEN = "POL";

export const useContract = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

 // const { writeContract } = useWriteContract();
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
    errorMessage: string,
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      const result = await contractCall();
      console.log("contractCall result:", result);

      // ✅ If result is null, it means transaction was cancelled — just return silently
      if (!result) {
        console.log("Transaction cancelled by user.");
        return;
      }

      if (result.result === undefined) {
        console.log("Undefined result: Transaction Attempt");
      }
  
      // Handle both string and object returns
      const txHash = typeof result === "string" ? result : result?.hash;
  
      if (!txHash) {
        throw new Error("Transaction was not created properly.");
      }
  
      setTxHash(txHash);
  
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
      });
  
      if (receipt.status === "success") {
        showToast(successMessage, "success");
        if (onSuccess) onSuccess();
      }
  
      console.log("Tx submitted:", txHash);
      console.log("Waiting for confirmation...");
    } catch (error: any) {
      console.error("Transaction error:", error);
  
      if (error?.code === 4001 || error?.message?.includes("User rejected")) {
        showToast("Transaction canceled.", "info");
      } else {
        showToast(errorMessage || error.message || "Unknown error", "error");
      }
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
          await writeContract(config, {
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
        await writeContract(config,{
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
        await writeContract(config,{
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
        await writeContract(config,{
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
        await writeContract(config,{
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "cancelTokenListing",
          args: [tokenId],
        }),
      "Listing canceled successfully!",
      "Failed to cancel listing"
    );
  };

  // Move Token to Group
  const moveTokenToGroup = async (tokenId: number, newGroup: string, price: bigint) => {
    await handleTransaction(
      async () =>
        await writeContract(config,{
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "moveTokenToGroup",
          args: [tokenId, newGroup],
          value: price,
        }),
      "Token moved to new group successfully!",
      "Failed to move token to group"
    );
  };

  const setCreatorFee = async (groupName: string, fee: bigint, onSuccess?: () => void) => {
    return await handleTransaction(
      async () => {
        try {
          const tx = await writeContract(config, {
            abi: contractABI,
            address: CONTRACT_ADDRESS,
            functionName: "setCreatorFee",
            args: [groupName, fee],
          }).catch((err) => {
            if (err instanceof BaseError) {
              const revertError = err.walk(err => err instanceof ContractFunctionRevertedError);
              if (revertError instanceof ContractFunctionRevertedError) {
                const errorName = revertError.data?.errorName ?? '';
                // do something with `errorName`
                console.log(errorName);
              }
            }
            showToast("Transaction canceled.", "info");
          });
          return tx;
        } catch (err: any) {
          console.error("writeContract error caught in wrapper:", err);
  
          const isUserRejection =
            err?.code === 4001 || // MetaMask
            err?.message?.toLowerCase().includes("user denied") ||
            err?.message?.toLowerCase().includes("user rejected");
  
          if (isUserRejection) {
            showToast("Transaction canceled by user.", "info");
            return null; // 👈 prevent rethrow and let handleTransaction skip it
          }
  
          throw err; // otherwise, bubble up the actual error
        }
      },
      "Creator fee set!",
      "Failed to set fee",
      onSuccess
    );
  };     

  // Set Group URI
  const setGroupURI = async (groupName: string, prefixAppendNumSuffix: [string,string,string]) => {
    await handleTransaction(
      async () =>
        await writeContract(config,{
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "setGroupURI",
          args: [groupName, prefixAppendNumSuffix],
        }),
      "URI set for group successfully!",
      "Failed to set URI for group"
    );
  };

  return {
    loading,
    setMetadata,
    mintToken,
    listToken,
    buyToken,
    cancelListing,
    moveTokenToGroup,
    setCreatorFee,
    setGroupURI,
    txHash,
  };
};
