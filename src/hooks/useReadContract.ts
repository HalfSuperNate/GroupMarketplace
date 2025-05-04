import { useReadContract } from "wagmi";
import { config } from '../wagmi';
import contractABI from "../contracts/GroupMarketplace.json";
import minimalERC721ABI from "../contracts/minimalERC721ABI.json";
import { Address } from "viem";

export const CONTRACT_ADDRESS = `0x0100a530469DB0Dd44c9Af210A465883668C7797`;
export const CHAIN_ID = config.chains[0].id;
export const CHAIN_SCANNER = config.chains.at(0)?.blockExplorers.default.url;

export const getMarketplaceAssetURL = (marketplace: string, chainId: number, contractAddress: Address, tokenId: number) => {
  switch (marketplace) {
    case 'opensea':
      switch (chainId) {
        case 1:
          return `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`;
        case 137:
          return `https://opensea.io/assets/matic/${contractAddress}/${tokenId}`;
        case 80002:
          return `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`;
        case 11155111:
          return `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${tokenId}`;
        default:
          return `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`;
      }
    case 'magiceden':
      switch (chainId) {
        case 1:
          return `https://magiceden.us/item-details/ethereum/${contractAddress}/${tokenId}`;
        case 137:
          return `https://magiceden.us/item-details/polygon/${contractAddress}/${tokenId}`;
        case 80002:
          return `#`;
        case 11155111:
          return `#`;
        default:
          return `https://magiceden.us/item-details/ethereum/${contractAddress}/${tokenId}`;
      }
    case 'rarible':
      switch (chainId) {
        case 1:
          return `https://rarible.com/token/${contractAddress}:${tokenId}`;
        case 137:
          return `https://rarible.com/token/polygon/${contractAddress}:${tokenId}`;
        case 80002:
          return `https://testnet.rarible.com/token/polygon/${contractAddress}:${tokenId}`;
        case 11155111:
          return `https://testnet.rarible.com/token/${contractAddress}:${tokenId}`;
        default:
          return `https://rarible.com/token/${contractAddress}:${tokenId}`;
      }
    case 'looksrare':
      switch (chainId) {
        case 1:
          return `https://looksrare.org/collections/${contractAddress}/${tokenId}`;
        case 137:
          return `#`;
        case 80002:
          return `#`;
        case 11155111:
          return `#`;
        default:
          return `https://looksrare.org/collections/${contractAddress}/${tokenId}`;
      }
    default:
      switch (chainId) {
        case 1:
          return `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`;
        case 137:
          return `https://opensea.io/assets/matic/${contractAddress}/${tokenId}`;
        case 80002:
          return `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`;
        case 11155111:
          return `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${tokenId}`;
        default:
          return `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`;
      }
  }
};

export const EMPTY_METADATA = {
  name: "",
  description: "",
  externalUrl: "",
  image: "",
  animationUrl: "",
  youtubeUrl: "",
  backgroundColor: "",
  attributes: "",
  creator: "0x0000000000000000000000000000000000000000",
  locked: false,
  price: BigInt(0),
};

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

export const EMPTY_LISTING = {
  price: BigInt(0),
  expiration: BigInt(0),
  active: false,
  creator: "0x0000000000000000000000000000000000000000",
};

export interface Listing {
  price: bigint;
  expiration: bigint;
  active: boolean;
  seller: `0x${string}`;
}

// 📄 Minimal External Contract Data Fetching
export const useGetOwnerOf = (contractAddress: Address, tokenId: number | undefined) => {
  const result = useReadContract({
    abi: minimalERC721ABI,
    address: contractAddress,
    functionName: 'ownerOf',
    args: tokenId !== undefined ? [tokenId] : [0], // Provide dummy fallback
    query: {
      enabled: tokenId !== undefined,
    },
  });

  return {
    tokenOwner: tokenId !== undefined ? (result.data as Address) : null,
    loading: result.isLoading,
    error: result.isError ? 'Failed to fetch token owner' : null,
  };
};

export const useGetTokenUri = (contractAddress: Address, tokenId: number | undefined) => {
  const result = useReadContract({
    abi: minimalERC721ABI,
    address: contractAddress,
    functionName: "tokenURI",       // ✅ Ensure you call the correct function
    args: tokenId !== undefined ? [tokenId] : [0],
    query: {
      enabled: tokenId !== undefined,
    },
  });

  return {
    tokenURI: tokenId !== undefined ? (result.data as string) : "",
    loading: result.isLoading,
    error: result.isError ? "Failed to fetch token uri" : null,
  };
};

export const useGetName = (contractAddress: Address) => {
  const result = useReadContract({
    abi: minimalERC721ABI,
    address: contractAddress,
    functionName: "name",       // ✅ Ensure you call the correct function
  });

  const contractName = result.data as
    string
    ;

  return {
    contractName,
    loading: result.isLoading,
    error: result.isError ? "Failed to fetch contract name" : null,
  };
};

export const useGetSymbol = (contractAddress: Address) => {
  const result = useReadContract({
    abi: minimalERC721ABI,
    address: contractAddress,
    functionName: "symbol",       // ✅ Ensure you call the correct function
  });

  const contractSymbol = result.data as
    string
    ;

  return {
    contractSymbol,
    loading: result.isLoading,
    error: result.isError ? "Failed to fetch contract symbol" : null,
  };
};

export const useGetTotalSupply = (contractAddress: Address) => {
  const result = useReadContract({
    abi: minimalERC721ABI,
    address: contractAddress,
    functionName: "totalSupply",       // ✅ Ensure you call the correct function
  });

  const totalSupply = result.data as
    number
    ;

  return {
    totalSupply,
    loading: result.isLoading,
    error: result.isError ? "Failed to fetch contract symbol" : null,
  };
};
// ^**********************^ END SECTION ^**********************^

// ✅ Custom hook for fetching metadata
export const useFetchMetadata = (tokenId: number | undefined) => {
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "tokenMetadata",
    args: tokenId !== undefined ? [tokenId] : [0], // Dummy fallback tokenId
    query: {
      enabled: tokenId !== undefined, // Only run query if tokenId is defined
    },
  });

  const fullData = result.data as
    | [
        string, string, string, string, string,
        string, string, string, string,
        boolean, bigint
      ]
    | undefined;

  const metadata = fullData
    ? {
        name: fullData[0],
        description: fullData[1],
        externalUrl: fullData[2],
        image: fullData[3],
        animationUrl: fullData[4],
        youtubeUrl: fullData[5],
        backgroundColor: fullData[6],
        attributes: fullData[7],
        creator: fullData[8] as `0x${string}`,
        locked: fullData[9],
        price: BigInt(fullData[10].toString()),
      }
    : EMPTY_METADATA;

  return {
    metadata,
    loading: result.isLoading,
    error: result.isError ? "Failed to fetch metadata" : null,
    refetch: result.refetch,
  };
};

export const useFetchMetadataSet = (tokenId: number | undefined) => {
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "metadataSet",       // ✅ Ensure you call the correct function
    args: tokenId !== undefined ? [tokenId] : [0],
    query: {
      enabled: tokenId !== undefined, // Only run query if tokenId is defined
    },
  });

  return {
    onChain: tokenId !== undefined ? (result.data as boolean) : false,
    loading_a: result.isLoading,
    error_a: result.isError ? "Failed to fetch metadata set" : null,
  };
};

export const useFetchTokenUri = (tokenId: number | undefined) => {
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "tokenURI",       // ✅ Ensure you call the correct function
    args: tokenId !== undefined ? [tokenId] : [0],
    query: {
      enabled: tokenId !== undefined, // Only run query if tokenId is defined
    },
  });

  return {
    tokenURI: tokenId !== undefined ? (result.data as string) : "",
    loading_b: result.isLoading,
    error_b: result.isError ? "Failed to fetch token uri" : null,
  };
};

export const useFetchGroupOwner = (groupName: string) => {
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "groupOwners",       // ✅ Ensure you call the correct function
    args: [groupName],
  });

  const groupOwner = result.data as
    Address
    ;

  return {
    groupOwner,
    loading_c: result.isLoading,
    error_c: result.isError ? "Failed to fetch group owner" : null,
    refetch: result.refetch,
  };
};

export const useFetchIsMinted = (tokenId: number | undefined) => {
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "isMinted",       // ✅ Ensure you call the correct function
    args: tokenId !== undefined ? [tokenId] : [0],
    query: {
      enabled: tokenId !== undefined, // Only run query if tokenId is defined
    },
  });

  return {
    isMinted: tokenId !== undefined ? (result.data as boolean) : false,
    loading_d: result.isLoading,
    error_d: result.isError ? "Failed to fetch is minted flag" : null,
    refetch: result.refetch,
  };
};

export const useFetchTokensInGroup = (groupName: string) => {
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "getTokensByGroup",
    args: [groupName],
  });

  const tokenIds = result.data as number[];

  return {
    tokenIds,
    loading_e: result.isLoading,
    error_e: result.isError ? "Failed to fetch token IDs in group" : null,
  };
};

export const useFetchListing = (tokenId: number | undefined) => {
  if (tokenId === undefined) {
    return { listing: null, loading_f: false, error_f: null, refetch_f: async () => null };
  }

  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "listings",
    args: tokenId !== undefined ? [tokenId] : [0],
    query: {
      enabled: tokenId !== undefined, // Only run query if tokenId is defined
    },
  });

  const fullData = result.data as [bigint, bigint, boolean, string] | undefined;

  const listing: Listing | null = fullData
    ? {
        price: BigInt(fullData[0].toString()),
        expiration: BigInt(fullData[1].toString()),
        active: fullData[2],
        seller: fullData[3] as `0x${string}`,
      }
    : null;

  return {
    listing: tokenId !== undefined ? listing : EMPTY_LISTING,
    loading_f: result.isLoading,
    error_f: result.isError ? "Failed to fetch listing" : null,
    refetch_f: result.refetch,
  };
};

export const useFetchTokenOwner = (tokenId: number | undefined) => {
  if (tokenId === undefined) {
    return { tokenOwner: null, loading_g: false, error_g: null };
  }
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "ownerOf",       // ✅ Ensure you call the correct function
    args: tokenId !== undefined ? [tokenId] : [0],
    query: {
      enabled: tokenId !== undefined, // Only run query if tokenId is defined
    },
  });

  return {
    tokenOwner: tokenId !== undefined ? (result.data as Address) : "0x0000000000000000000000000000000000000000",
    loading_g: result.isLoading,
    error_g: result.isError ? "Failed to fetch token owner" : null,
  };
};

export const useFetchTokenGroup = (tokenId: number | undefined) => {
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "tokenGroup",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined, // disables call if undefined
    },
  });

  const tokenGroup = result.data as string;

  return {
    tokenGroup,
    loading_h: result.isLoading,
    error_h: result.isError ? "Failed to fetch token group" : null,
    refetch_h: result.refetch,
  };
};

export const useFetchNextTokenId = () => {
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "nextTokenId",       // ✅ Ensure you call the correct function
  });

  const nextTokenId = result.data as
    number
    ;

  return {
    nextTokenId,
    loading_i: result.isLoading,
    error_i: result.isError ? "Failed to fetch next token ID" : null,
  };
};

export const useFetchNewGroupPrice = () => {
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "newGroupFee",       // ✅ Ensure you call the correct function
  });

  const newGroupFee = result.data as
    bigint
    ;

  return {
    newGroupFee,
    loading_j: result.isLoading,
    error_j: result.isError ? "Failed to fetch new group fee" : null,
  };
};

export const useFetchCreatorFeeMax = () => {
  const result = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "creatorFeeMax",       // ✅ Ensure you call the correct function
  });

  const creatorFeeMax = result.data as
    bigint
    ;

  return {
    creatorFeeMax,
    loading_k: result.isLoading,
    error_k: result.isError ? "Failed to fetch creator fee max" : null,
  };
};

export const useFetchCreatorFee = (groupName: string) => {
  return useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "creatorFees",       // ✅ Ensure you call the correct function
    args: [groupName],
  });
};

export const useFetchGroupURI = (groupName: string) => {
  const result_A = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "groupURI",
    args: [groupName, 0],
  });

  const result_B = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "groupURI",
    args: [groupName, 1],
  });

  const result_C = useReadContract({
    abi: contractABI,
    address: CONTRACT_ADDRESS,
    functionName: "groupURI",
    args: [groupName, 2],
  });

  const loading_m =
    result_A.isLoading || result_B.isLoading || result_C.isLoading;

  const error_m =
    result_A.isError || result_B.isError || result_C.isError
      ? "Failed to fetch group URI"
      : null;

  const groupURI = [
    result_A.data as string,
    result_B.data as string,
    result_C.data as string,
  ];

  const refetch = async () => {
    const [a, b, c] = await Promise.all([
      result_A.refetch(),
      result_B.refetch(),
      result_C.refetch(),
    ]);

    return [a.data, b.data, c.data];
  };

  return {
    groupURI,
    loading_m,
    error_m,
    refetch,
  };
};
