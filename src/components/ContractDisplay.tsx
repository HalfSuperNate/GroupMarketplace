import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useGetName, useGetSymbol, useGetTotalSupply } from "@/hooks/useReadContract"; // adjust path if needed
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
  //const { totalSupply } = useGetTotalSupply(contractAddress);

  const ITEMS_PER_PAGE = 20;
  const [page, setPage] = useState(0);

  const { tokenData, totalSupply, loading } = useFetchContractTokens(contractAddress, page, ITEMS_PER_PAGE);
  console.log(totalSupply);
  const totalPages = totalSupply ? Math.ceil(Number(totalSupply) / ITEMS_PER_PAGE) : 0;

  const paginatedData = tokenData.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages - 1));

  return (
    <div className={styles.container}>
      <Navbar />
      <h1 className={styles.title}>
        {contractName ? `${contractName} (${contractSymbol})` : "Loading Contract Info..."}
      </h1>

      {loading ? (
        <p>Loading tokens...</p>
      ) : (
        <div className={styles.grid}>
          {tokenData.map(({ tokenId, tokenUri, owner }) => (
            <div key={tokenId} className={styles.card}>
              <p className={styles.tokenId}>ID #{tokenId}</p>
              <TokenMetadataDisplay tokenURI={tokenUri} />
              <p className={styles.owner}>Owner: {shortenAddress(owner)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className={styles.pagination}>
        <button onClick={handlePrev} disabled={page === 0}>← Prev</button>
        <span>Page {page + 1} of {totalPages}</span>
        <button onClick={handleNext} disabled={page + 1 >= totalPages}>Next →</button>
      </div>
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

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!jsonData) return <p>Loading metadata...</p>;

  return (
    <div>
      {jsonData.image && (
        <Image
          src={jsonData.image.replace("ipfs://", "https://ipfs.io/ipfs/")}
          alt={jsonData.name || "Token Image"}
          width={200}
          height={200}
        />
      )}
      <h3>{jsonData.name || "Unnamed Token"}</h3>
      {/* <p>{jsonData.description || "No description available."}</p> */}
    </div>
  );
};


