import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useGetName, useGetSymbol, CHAIN_ID, CHAIN_SCANNER, getMarketplaceAssetURL } from "@/hooks/useReadContract"; // adjust path if needed
import styles from '../styles/Home.module.css'; // reuse your existing grid/card styles
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { useFetchContractTokens } from "@/hooks/useFetchContractTokens";
import { Address } from "viem";

const shortenAddress = (addr: Address) => {
  if (!addr) return "Unknown";
  return addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
};

const ContractDisplay = () => {
  const router = useRouter();
  const contractAddress = router.query.address as `0x${string}`;

  const { contractName } = useGetName(contractAddress);
  const { contractSymbol } = useGetSymbol(contractAddress);

  const ITEMS_PER_PAGE = 20;
  const [page, setPage] = useState(0);

  const { tokenData, totalSupply, loading, realTokenCount, hasMore } = useFetchContractTokens(contractAddress, page, ITEMS_PER_PAGE);
  //console.log(totalSupply);
  {!loading && tokenData.length === 0 && (
    <div>No tokens found for this contract.</div>
  )}
  
  const totalPages = Math.ceil(realTokenCount / ITEMS_PER_PAGE);

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNext = () => {
    console.log("Current page:", page, "Total pages:", totalPages);
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  useEffect(() => {
    if (!loading && tokenData.length === 0 && page > 0) {
      setPage(prev => Math.max(0, prev - 1));
    }
  }, [tokenData, loading]);

  const goToTokenPage = (marketplace: string, tokenId: number) => {
    const url = getMarketplaceAssetURL(marketplace, CHAIN_ID, contractAddress, tokenId);
    window.open(url, "_blank");
  };

  const goToContractPage = () => {
    const url = `${CHAIN_SCANNER}/address/${contractAddress}`;
    window.open(url, "_blank");
  };

  // console.log("Estimated supply:", realTokenCount);
  // console.log("Current page:", page, "Total pages:", totalPages);
  
  return (
    <div className={styles.container}>
      <Navbar />
      <h1 className={styles.groupHeading}>
        {contractName ? `${contractName} (${contractSymbol})` : "Loading Contract Info..."}
        <p className={styles.groupHeadingSmallLink} onClick={() => goToContractPage()}>Contract: {contractAddress}</p>
      </h1>
  
      {loading ? (
        <p>Loading tokens...</p>
      ) : tokenData.length === 0 ? (
        <div>No tokens found for this contract.</div>
      ) : (
        <div className={styles.groupGrid}>
          {tokenData.map(({ tokenId, tokenUri, owner }) => (
            <div key={tokenId} className={styles.groupContractCard}>
              <p className={styles.tokenId}>ID #{tokenId}</p>
              <TokenMetadataDisplay tokenURI={tokenUri} />
              <p className={styles.owner}>Owner: {shortenAddress(owner)}</p>

              <div className={styles.marketLinks}>
                <button
                  onClick={() => goToTokenPage("opensea", tokenId)}
                  title="OpenSea"
                >
                  <Image src="/opensea.svg" alt="OpenSea" width={24} height={24} />
                </button>
                <button
                  onClick={() => goToTokenPage("rarible", tokenId)}
                  title="Rarible"
                >
                  <Image src="/rarible.svg" alt="Rarible" width={24} height={24} />
                </button>
                <button
                  onClick={() => goToTokenPage("looksrare", tokenId)}
                  title="LooksRare"
                >
                  <Image src="/looksrare.svg" alt="LooksRare" width={24} height={24} />
                </button>
                <button
                  onClick={() => goToTokenPage("magiceden", tokenId)}
                  title="Magic Eden"
                >
                  <Image src="/magiceden.svg" alt="Magic Eden" width={24} height={24} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
  
      {/* Pagination Controls */}
      {totalPages > 1 && tokenData.length > 0 && (
        <div className={styles.pagination}>
          {page > 0 && (
            <button onClick={handlePrev}>
              ← Prev
            </button>
          )}
          <span>Page {page + 1}</span>
          {page < totalPages - 1 && (
            <button
              onClick={handleNext}
              disabled={loading}
            >
              Next →
            </button>
          )}
        </div>
      )}

    </div>
  );  
};

export default ContractDisplay;

const TokenMetadataDisplay = ({ tokenURI }: { tokenURI: string }) => {
  const [error, setError] = useState<string | null>(null);

  const [jsonData, setJsonData] = useState<any>(null);
  const [fetchingJson, setFetchingJson] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // ✅ Improved Base64 decoding with padding and error handling
  const decodeBase64Json = (base64: string): any | null => {
    let decoded = '';
    try {
      // Ensure base64 padding is correct
      const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

      // Decode base64
      decoded = atob(paddedBase64);

      // Find the "attributes" field and replace anything following it with "attributes": []
      const attributesIndex = decoded.indexOf('"attributes":');
      if (attributesIndex !== -1 && decoded.includes("[object Object]") || decoded.includes('"attributes":}')) {
        // Cut everything after "attributes" and replace it with []
        decoded = decoded.substring(0, attributesIndex + 13) + ' []}';
      }

      // Attempt to parse as JSON
      const parsedJson = JSON.parse(decoded);

      // Ensure `attributes` exists and is an array
      if (!parsedJson.hasOwnProperty("attributes") || parsedJson.attributes === undefined) {
        console.warn("Warning: Missing `attributes` field, defaulting to an empty array.");
        parsedJson.attributes = []; // Default to empty array
      } else if (!Array.isArray(parsedJson.attributes)) {
        console.warn("Warning: `attributes` field is not an array. Converting to an array.");
        parsedJson.attributes = [parsedJson.attributes]; // Wrap in an array if it's a single object
      }

      return parsedJson;
    } catch (error) {
      console.error("Failed to decode base64 metadata:", error);

      if (error instanceof SyntaxError) {
        console.error("Invalid JSON format:", decoded);
      }

      return null;
    }
  };

  // ✅ IPFS to HTTP resolution function
  const resolveIPFS = (uri: string): string => {
    if (!uri) return "";
    if (uri.startsWith("ipfs://")) {
      const ipfsHash = uri.replace("ipfs://", "");
      return `https://ipfs.io/ipfs/${ipfsHash}`;
    }
    return uri; // If it's already HTTP, return as is
  };

  const fetchJsonData = async () => {
    if (!tokenURI) {
      setJsonError("No token URI found.");
      return;
    }

    setFetchingJson(true);
    setJsonError(null);

    // ✅ Handle Base64-encoded on-chain metadata
    if (tokenURI.startsWith("data:application/json;base64,")) {
      //console.log("On-chain Base64 detected");
      const base64Data = tokenURI.split(",")[1];

      const decodedJson = decodeBase64Json(base64Data);
      if (decodedJson) {
        // Resolve IPFS image if present
        if (decodedJson.image) {
          decodedJson.image = resolveIPFS(decodedJson.image);
        }
        setJsonData(decodedJson);
      } else {
        setJsonError("Failed to decode on-chain metadata.");
      }

      setFetchingJson(false);
      return;
    }

    // ✅ Handle Off-Chain IPFS or HTTP metadata
    const resolvedUri = resolveIPFS(tokenURI);

    try {
      const response = await fetch(resolvedUri);

      if (!response.ok) {
        // Handle 404 separately
        if (response.status === 404) {
          setJsonError("Metadata not found (404).");
        } else {
          setJsonError(`Failed to fetch metadata: ${response.status}`);
        }
        setJsonData(null);
        return;
      }

      const json = await response.json();

      // ✅ Resolve IPFS image link
      if (json.image) {
        json.image = resolveIPFS(json.image);
      }

      setJsonData(json);
    } catch (err: any) {
      console.error("Error fetching JSON data:", err);
      setJsonError(`Failed to load JSON metadata: ${err.message}`);
      setJsonData(null);
    } finally {
      setFetchingJson(false);
    }
  };

  useEffect(() => {
    if (tokenURI) {
      fetchJsonData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenURI]);

  const getFinalImageSrc = () => {
    if (jsonData && jsonData.image) {
      //console.log("Image OK");
      return resolveIPFS(jsonData.image);
    }
    //console.log("Image NOT OK");
    return "/default-image.svg";
  }

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className={styles.groupImageContainer}>
      <img
        className={styles.groupImage}
        src={getFinalImageSrc()}
        alt={jsonData?.name || "Token Image"}
        loading="lazy"
        width={200}
        height={200}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/default-image.svg";
        }}
      />
      <h3>{jsonData?.name || (jsonData === null ? "Metadata Not Found" : "Unnamed Token")}</h3>
    </div>
  );
};


