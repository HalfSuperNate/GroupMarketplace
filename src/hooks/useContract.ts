import { useState } from "react";
import { parseEther } from "viem"; // Viem helper for ether conversion
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { toaster } from "../components/ui/toaster"
import contractABI from '../contracts/GroupMarketplace.json';

const CONTRACT_ADDRESS = `0x${"70261103D4dBC11A178F71475D2824Ad1a9d6972"}`;

export const useContract = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null); // Store transaction hash

  // ✅ Toast function
  const showToast = (description: string, type: "success" | "error" | "info" | "warning") => {
    toaster.create({
      description,
      type,
      duration: 4000,
      dismissible: true,
    });
  };

  // ✅ Wagmi hooks
  const { writeContract } = useWriteContract();
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  // 🛠️ Handle Transaction Execution
  const handleTransaction = async (
    callback: () => void, // Execute the synchronous contract write
    successMessage: string,
    errorMessage: string
  ) => {
    try {
      setLoading(true);
      callback(); // Execute the contract interaction synchronously
      showToast("Transaction sent. Waiting for confirmation...", "info");
    } catch (error: any) {
      console.error(error);
      showToast(errorMessage || `Error: ${error.message}`, "error");
      setLoading(false);
    }
  };

  // ✅ Handle Transaction Confirmation
  const checkTransactionStatus = () => {
    if (isSuccess) {
      showToast("Transaction confirmed!", "success");
      setLoading(false);
    } else if (isError) {
      showToast("Transaction failed.", "error");
      setLoading(false);
    }
  };

  // ✅ Helper function to extract the latest transaction hash
  const fetchTransactionHash = async () => {
    const provider = window.ethereum; 
    if (provider && address) {
      const txs = await provider.request({
        method: "eth_getBlockByNumber",
        params: ["latest", true],
      });

      if (txs?.transactions?.length > 0) {
        const latestTx = txs.transactions.find((tx: any) => tx.from === address);
        if (latestTx) {
          setTxHash(latestTx.hash); 
        }
      }
    }
  };

  // ✅ Set Metadata
  const setMetadata = async (
    group: string,
    batchSize: number,
    name: string,
    image: string,
    price: string
  ) => {
    const priceInWei = parseEther(price);

    await handleTransaction(
      () => {
        writeContract({
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "setMetadata",
          args: [
            {
              group,
              batchSize,
              name,
              image,
              price: priceInWei,
              appendNumber: false,
              appendNumberToImage: false,
              appendNumberToAnim: false,
              imageExtension: "",
              animExtension: "",
              startingNumber: 1,
              externalUrl: "",
              youtubeUrl: "",
              animationUrl: "",
              backgroundColor: "",
              attributes: [],
            },
          ],
          value: priceInWei,
        });
      },
      "Metadata set successfully!",
      "Failed to set metadata"
    );

    // Manually fetch the transaction hash
    await fetchTransactionHash();
  };

  // ✅ Mint Token
  const mintToken = async (tokenId: number, price: string) => {
    const priceInWei = parseEther(price);

    await handleTransaction(
      () => {
        writeContract({
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "mint",
          args: [tokenId],
          value: priceInWei,
        });
      },
      "Token minted successfully!",
      "Failed to mint token"
    );

    await fetchTransactionHash();
  };

  // ✅ Buy Token
  const buyToken = async (tokenId: number, price: string) => {
    const priceInWei = parseEther(price);

    await handleTransaction(
      () => {
        writeContract({
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "buyToken",
          args: [tokenId],
          value: priceInWei,
        });
      },
      "Token purchased successfully!",
      "Failed to buy token"
    );

    await fetchTransactionHash();
  };

  // ✅ Cancel Listing
  const cancelListing = async (tokenId: number) => {
    await handleTransaction(
      () => {
        writeContract({
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "cancelListing",
          args: [tokenId],
        });
      },
      "Listing canceled successfully!",
      "Failed to cancel listing"
    );

    await fetchTransactionHash();
  };

  // ✅ Move Token to Group
  const moveTokenToGroup = async (tokenId: number, newGroup: string) => {
    await handleTransaction(
      () => {
        writeContract({
          abi: contractABI,
          address: CONTRACT_ADDRESS,
          functionName: "moveTokenToGroup",
          args: [tokenId, newGroup],
        });
      },
      "Token moved to new group successfully!",
      "Failed to move token to group"
    );

    await fetchTransactionHash();
  };

  // Check transaction status on changes
  if (txHash) {
    checkTransactionStatus();
  }

  return {
    loading: loading || isLoading,
    setMetadata,
    mintToken,
    buyToken,
    cancelListing,
    moveTokenToGroup,
    txHash,
  };
};