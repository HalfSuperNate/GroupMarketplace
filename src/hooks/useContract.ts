import { useState } from "react";
import { parseEther, BaseError, ContractFunctionRevertedError, Address } from "viem"; 
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

  // ✅ Safe Write Contract helper
  const safeWriteContract = async ({
    functionName,
    args,
    value,
  }: {
    functionName: string;
    args: any[];
    value?: bigint;
  }) => {
    try {
      const tx = await writeContract(config, {
        abi: contractABI,
        address: CONTRACT_ADDRESS,
        functionName,
        args,
        ...(value !== undefined ? { value } : {}),
      }).catch((err) => {
        if (err instanceof BaseError) {
          const revertError = err.walk((err) => err instanceof ContractFunctionRevertedError);
          if (revertError instanceof ContractFunctionRevertedError) {
            const errorName = revertError.data?.errorName ?? "";
            console.log("Revert error name:", errorName);
          }
        }
        showToast("Transaction canceled.", "info");
      });
  
      return tx;
    } catch (err: any) {
      console.error(`writeContract error in ${functionName}:`, err);
  
      const isUserRejection =
        err?.code === 4001 ||
        err?.message?.toLowerCase().includes("user denied") ||
        err?.message?.toLowerCase().includes("user rejected");
  
      if (isUserRejection) {
        showToast("Transaction canceled by user.", "info");
        return null;
      }
  
      throw err;
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
    animExtension: string,
    onSuccess?: () => void
  ) => {
    try {
      return await handleTransaction(
        () => safeWriteContract({
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
        "Failed to set metadata",
        onSuccess
      );
    } catch (error) {
      console.error("Error setting metadata:", error);
    }
  };

  // Update Token Metadata
  const updateMetadata = async (
    tokenId: number,
    removeMetadata: boolean,
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
    onSuccess?: () => void
  ) => {
    try {
      return await handleTransaction(
        () => safeWriteContract({
            functionName: "updateMetadata",
            args: [
              tokenId,                        // uint256 token ID
              removeMetadata,                 // bool flag to remove metadata
              [
                metadata.name,                // string name
                metadata.description,         // string description
                metadata.externalUrl,         // string externalUrl
                metadata.image,               // string image
                metadata.animationUrl,        // string animationUrl
                metadata.youtubeUrl,          // string youtubeUrl
                metadata.backgroundColor,     // string backgroundColor
                metadata.attributes,          // string attributes (encoded JSON string)
                metadata.creator,             // address creator      *** ignored ***
                metadata.locked,              // bool locked          *** ignored ***
                parseEther(metadata.price)    // uint256 price in wei *** ignored ***
              ]
            ],
          }),
        "Token Metadata updated successfully!",
        "Failed to update token metadata",
        onSuccess
      );
    } catch (error) {
      console.error("Error setting token metadata:", error);
    }
  };

  // Mint Token
  const mintToken = async (tokenId: number, price: bigint, onSuccess?: () => void) => {
    if (tokenId === null || price === undefined) return;
    return await handleTransaction(
      () => safeWriteContract({
        functionName: "mint",
        args: [tokenId],
        value: price,
      }),
      "Token minted successfully!",
      "Failed to mint token",
      onSuccess
    );
  };

  // List Token
  const listToken = async (tokenId: number, price: bigint, duration: bigint, onSuccess?: () => void) => {
    if (tokenId === null || price === undefined) return;
    return await handleTransaction(
      () => safeWriteContract({
          functionName: "listTokenForSale",
          args: [tokenId, price, duration],
      }),
      "Token listed successfully!",
      "Failed to list token",
      onSuccess
    );
  };

  // Buy Token
  const buyToken = async (tokenId: number, price: bigint, onSuccess?: () => void) => {
    if (tokenId === null || price === undefined) return;
    return await handleTransaction(
      () => safeWriteContract({
        functionName: "buyToken",
        args: [tokenId],
        value: price, // will be passed if defined
      }),
      "Token purchased successfully!",
      "Failed to buy token",
      onSuccess
    );
  };

  // Cancel Listing
  const cancelListing = async (tokenId: number, onSuccess?: () => void) => {
    return await handleTransaction(
      () => safeWriteContract({
        functionName: "cancelTokenListing",
        args: [tokenId],
      }),
      "Listing canceled successfully!",
      "Failed to cancel listing",
      onSuccess
    );
  };

  // Move Token to Group
  const moveTokenToGroup = async (tokenId: number, newGroup: string, price: bigint, onSuccess?: () => void) => {
    return await handleTransaction(
      () => safeWriteContract({
        functionName: "moveTokenToGroup",
        args: [tokenId, newGroup],
        value: price,
      }),
      "Token moved to new group successfully!",
      "Failed to move token to group",
      onSuccess
    );
  };

  // Set Creator Fee (Royalty)
  const setCreatorFee = async (groupName: string, fee: bigint, onSuccess?: () => void) => {
    return await handleTransaction(
      () => safeWriteContract({
        functionName: "setCreatorFee",
        args: [groupName, fee]
      }),
      "Creator fee set!",
      "Failed to set fee",
      onSuccess
    );
  };     

  // Set Group URI
  const setGroupURI = async (
    groupName: string,
    prefixAppendNumSuffix: [string, string, string],
    onSuccess?: () => void
  ) => {
    return await handleTransaction(
      () => safeWriteContract({
        functionName: "setGroupURI",
        args: [groupName, prefixAppendNumSuffix]
      }),
      "URI set for group successfully!",
      "Failed to set URI for group",
      onSuccess
    );
  };

  // Set New Group Owner
  const setNewGroupOwner = async (
    groupName: string,
    newAddress: Address,
    onSuccess?: () => void
  ) => {
    return await handleTransaction(
      () => safeWriteContract({
        functionName: "updateGroupOwner",
        args: [groupName, newAddress]
      }),
      "New group owner set successfully!",
      "Failed to set new owner for group",
      onSuccess
    );
  };

  // Set Group Restrictions
  const setGroupRestrictions = async (
    groupName: string,
    addresses: Address[],
    restricted: boolean,
    onSuccess?: () => void
  ) => {
    return await handleTransaction(
      () => safeWriteContract({
        functionName: "updateGroupRestrictions",
        args: [groupName, addresses, restricted]
      }),
      "New group restrictions set successfully!",
      "Failed to set restrictions for group",
      onSuccess
    );
  };

  return {
    loading,
    setMetadata,
    updateMetadata,
    mintToken,
    listToken,
    buyToken,
    cancelListing,
    moveTokenToGroup,
    setCreatorFee,
    setGroupURI,
    setNewGroupOwner,
    setGroupRestrictions,
    txHash,
  };
};
