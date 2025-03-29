import { useReadContract } from "wagmi";
import contractABI from "../contracts/GroupMarketplace.json";

const CONTRACT_ADDRESS = `0x0100a530469DB0Dd44c9Af210A465883668C7797`;

export interface Metadata {
  name: string;
  description: string;
  externalUrl: string;
  image: string;
  animationUrl: string;
  youtubeUrl: string;
  backgroundColor: string;
  attributes: string;       // JSON string or serialized array
  creator: `0x${string}`;   // Ensures valid Ethereum address type
  locked: boolean;
  price: bigint;            // Price is a uint256, use bigint to handle large numbers
}

// ✅ Custom hook for fetching metadata
export const useFetchMetadata = (tokenId: number) => {
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "tokenMetadata",       // ✅ Ensure you call the correct function
    args: [tokenId],
  });

  // Explicitly type result.data as a tuple
  const fullData = result.data as [
    string,  // name
    string,  // description
    string,  // externalUrl
    string,  // image
    string,  // animationUrl
    string,  // youtubeUrl
    string,  // backgroundColor
    string,  // attributes
    string,  // creator
    boolean, // locked
    bigint   // price (uint256, convert to BigInt)
  ];

  // Handle the metadata conversion manually
  const metadata: Metadata | null = fullData
    ? {
        name: fullData[0],
        description: fullData[1],
        externalUrl: fullData[2],
        image: fullData[3],
        animationUrl: fullData[4],
        youtubeUrl: fullData[5],
        backgroundColor: fullData[6],
        attributes: fullData[7],
        creator: fullData[8] as `0x${string}`, // Ensure it's a valid Ethereum address type
        locked: fullData[9],
        price: BigInt(fullData[10].toString()), // Convert the price to bigint
      }
    : null;

  //console.log("Fetched Metadata:", fullData);

  return {
    metadata,
    loading: result.isLoading,
    error: result.isError ? "Failed to fetch metadata" : null,
  };
};

export const useFetchMetadataSet = (tokenId: number) => {
    const result = useReadContract({
        abi: contractABI,
        address: CONTRACT_ADDRESS,
        functionName: "metadataSet",       // ✅ Ensure you call the correct function
        args: [tokenId],
    });

    // Explicitly type result.data as a boolean
    const onChain = result.data as
        boolean  // flag if metadata is false offChain or true onChain
    ;

    return {
        onChain,
        loading_a: result.isLoading,
        error_a: result.isError ? "Failed to fetch metadata set" : null,
    };
};

export const useFetchTokenUri = (tokenId: number) => {
    const result = useReadContract({
        abi: contractABI,
        address: CONTRACT_ADDRESS,
        functionName: "tokenURI",       // ✅ Ensure you call the correct function
        args: [tokenId],
    });

    // Explicitly type result.data as a boolean
    const tokenURI = result.data as
        string  // flag if metadata is false offChain or true onChain
    ;

    return {
        tokenURI,
        loading_b: result.isLoading,
        error_b: result.isError ? "Failed to fetch token uri" : null,
    };
};
