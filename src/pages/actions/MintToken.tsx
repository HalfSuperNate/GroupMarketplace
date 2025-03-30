"use client";

import { useState, useEffect } from "react";
import { useContract, NATIVE_TOKEN } from "../../hooks/useContract";
import { useFetchMetadata, useFetchMetadataSet, useFetchTokenUri } from "../../hooks/useReadContract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Spinner } from "@chakra-ui/react";
import styles from "../../styles/Home.module.css";
import { formatEther } from "viem";

const MintToken = () => {
  const { mintToken, loading: minting } = useContract();
  const [tokenId, setTokenId] = useState<number>(0);

  const { metadata, loading, error } = useFetchMetadata(tokenId);
  const { onChain, loading_a, error_a } = useFetchMetadataSet(tokenId);
  const { tokenURI, loading_b, error_b } = useFetchTokenUri(tokenId);

  const [jsonData, setJsonData] = useState<any>(null);
  const [fetchingJson, setFetchingJson] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // ✅ Improved Base64 decoding with padding and error handling
  const decodeBase64Json = (base64: string): any | null => {
    try {
      const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const decoded = atob(paddedBase64);
      return JSON.parse(decoded);
    } catch (error) {
      console.error("Failed to decode base64 metadata:", error);
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
    return uri;  // If it's already HTTP, return as is
  };

  // ✅ Fetch external or on-chain JSON metadata with 404 handling
  useEffect(() => {
    const fetchJsonData = async () => {
      if (!tokenURI) {
        setJsonError("No token URI found.");
        setJsonData(null);
        return;
      }

      setFetchingJson(true);
      setJsonError(null);

      // ✅ Handle Base64-encoded on-chain metadata
      if (tokenURI.startsWith("data:application/json;base64,")) {
        const base64Data = tokenURI.split(",")[1];
        const decodedJson = decodeBase64Json(base64Data);

        if (decodedJson) {
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
            throw new Error(`Metadata not found (404).`);
          } else {
            throw new Error(`Failed to fetch metadata: ${response.status}`);
          }
        }

        const json = await response.json();

        if (json.image) {
          json.image = resolveIPFS(json.image);
        }

        setJsonData(json);
      } catch (err: any) {
        console.error("Error fetching JSON data:", err);
        setJsonError(`Failed to load metadata: ${err.message}`);
        setJsonData(null);
      } finally {
        setFetchingJson(false);
      }
    };

    fetchJsonData();
  }, [tokenURI]);

  const handleMint = async () => {
    if (tokenId < 0 || !metadata || metadata.price === undefined) return;
    const priceInWei = metadata?.price || 0n;
    await mintToken(tokenId, priceInWei);
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Mint Token</h1>

        <div className={styles.connectButton}>
          <ConnectButton label="Connect Wallet" accountStatus="address" chainStatus="none" />
        </div>

        <div className={styles.form}>
          <label className={styles.label}>
            Token ID:
            <input
              className={styles.input}
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(Number(e.target.value))}
              min={0}
            />
          </label>

          {/* ✅ Displaying metadata */}
          {loading || loading_a || loading_b ? (
            <div className={styles.metadata}>
              <Spinner size="sm" color="blue.500" />
              <p>Loading metadata...</p>
            </div>
          ) : error || error_a || error_b ? (
            <p className={styles.warning}>Error: {error || error_a || error_b}</p>
          ) : metadata || jsonData ? (
            <div className={styles.metadata}>
              <p className={styles.truncate}>
                <strong>Metadata:</strong>
                <a href={tokenURI} target="_blank" rel="noopener noreferrer">
                  {onChain ? "⛓️ On Chain" : "💾 Off Chain"}
                </a>
              </p>

              {/* ✅ Display shared fields */}
              <p><strong>Name:</strong> {jsonData?.name || metadata?.name}</p>
              <p><strong>Description:</strong> {jsonData?.description || metadata?.description}</p>
              <p><strong>Creator:</strong> {jsonData?.creator || metadata?.creator}</p>
              <p><strong>Background:</strong> {jsonData?.background_color || metadata?.backgroundColor || "N/A"}</p>

              {jsonData?.attributes && jsonData.attributes.length > 0 ? (
                <div>
                  <strong>Attributes:</strong>
                  {jsonData.attributes.map((attr: any, index: number) => (
                    <p key={index}>{attr.trait_type}: {attr.value}</p>
                  ))}
                </div>
              ) : (
                <p><strong>Attributes:</strong> {metadata?.attributes || "None"}</p>
              )}

              <p>
                <strong>Price:</strong> 
                {metadata?.price !== undefined ? `${formatEther(metadata.price)} ${NATIVE_TOKEN}` : "N/A"}
              </p>

              {/* ✅ Display image */}
              {jsonData?.image ? (
                <img
                  src={jsonData.image}
                  alt={jsonData?.name || "NFT Image"}
                  className={styles.image}
                  style={{ maxWidth: "200px", borderRadius: "8px" }}
                />
              ) : (
                <p>No image available</p>
              )}
            </div>
          ) : (
            <p className={styles.warning}>Metadata not found for ID: {tokenId}</p>
          )}

          {/* ✅ Error handling */}
          {fetchingJson && (
            <div>
              <Spinner size="sm" color="blue.500" />
              <p>Loading metadata...</p>
            </div>
          )}

          {jsonError && (
            <p className={styles.warning}>Error: {jsonError}</p>
          )}

          <button
            className={styles.button}
            onClick={handleMint}
            disabled={minting || !metadata || metadata?.price === undefined}
          >
            {minting ? <Spinner size="sm" color="white" /> : "Mint Token"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default MintToken;
