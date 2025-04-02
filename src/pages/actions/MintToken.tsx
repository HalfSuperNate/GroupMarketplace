"use client";

import { useState, useEffect } from "react";
import { useContract, NATIVE_TOKEN } from "../../hooks/useContract";
import { useFetchMetadata, useFetchMetadataSet, useFetchTokenUri, useFetchIsMinted } from "../../hooks/useReadContract";
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
  const { isMinted, loading_d, error_d } = useFetchIsMinted(tokenId);

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
  
      // Attempt to parse as JSON
      const parsedJson = JSON.parse(decoded);
  
      // If parsing succeeds, return the parsed object
      return parsedJson;
    } catch (error) {
      // If an error occurs (invalid base64 or JSON), log it and return null
      console.error("Failed to decode base64 metadata:", error);
  
      // Specifically handling invalid JSON errors
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

  // ✅ Fetch external or on-chain JSON metadata
  useEffect(() => {
    const fetchJsonData = async () => {
      if (!tokenURI) {
        setJsonError("No token URI found.");
        return;
      }

      setFetchingJson(true);
      setJsonError(null);

      // ✅ Handle Base64-encoded on-chain metadata
      if (tokenURI.startsWith("data:application/json;base64,")) {
        console.log("On-chain Base64 detected");
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
          {loading ? (
            <div className={styles.metadata}>
              <Spinner size="sm" color="blue.500" />
              <p>Loading metadata...</p>
            </div>
          ) : error ? (
            <p className={styles.warning}>Error: {error}</p>
          ) : metadata ? (
            <div className={styles.metadata}>
              {onChain ? (
                <div className={styles.metadata}>
                  <p className={styles.truncate}>
                    <strong>Metadata:</strong> 
                    <a href={tokenURI} target="_blank" rel="noopener noreferrer">⛓️ On Chain</a>
                  </p>
                  {/* <p><strong>Name:</strong> {metadata.name}</p> */}
                  {/* <p><strong>Description:</strong> {metadata.description}</p> */}
                  <p><strong>Creator:</strong> {metadata.creator}</p>
                  <p><strong>Locked:</strong> {metadata.locked ? "Yes" : "No"}</p>
                  {/* <p><strong>Background:</strong> {metadata.backgroundColor || "N/A"}</p> */}
                  {/* <p><strong>Attributes:</strong> {metadata.attributes || "None"}</p> */}
                  <p>
                    <strong>Price:</strong> 
                    {metadata.price !== undefined ? `${formatEther(metadata.price)} ${NATIVE_TOKEN}` : " N/A"}
                  </p>
                </div>
              ) : (
                <div className={styles.metadata}>
                  <p className={styles.truncate}>
                    <strong>Metadata:</strong> 
                    <a className={styles.padLink} href={tokenURI} target="_blank" rel="external noopener noreferrer">💾 Off Chain</a>
                  </p>
                  <p><strong>Creator:</strong> {metadata.creator}</p>
                  <p>
                    <strong>Price:</strong> 
                    {metadata.price !== undefined ? `${formatEther(metadata.price)} ${NATIVE_TOKEN}` : " N/A"}
                  </p>
                </div>
              )}

              {/* ✅ Displaying external and on-chain JSON data */}
              {fetchingJson ? (
                <div>
                  <Spinner size="sm" color="blue.500" />
                  <p>Loading JSON metadata...</p>
                </div>
              ) : jsonError ? (
                <p className={styles.warning}>Error: {jsonError}</p>
              ) : jsonData ? (
                <div className={styles.jsonData}>
                  <h3>📝 JSON Metadata</h3>
                  <img
                    src={jsonData.image}
                    alt={jsonData.name}
                    className={styles.image}
                    style={{ maxWidth: "200px", borderRadius: "8px" }}
                  />
                  <p><strong>Name:</strong> {jsonData.name}</p>
                  <p><strong>Description:</strong> {jsonData.description}</p>
                  {jsonData.external_url && (
                    <p><strong>External URL:</strong> <a href={jsonData.external_url} target="_blank" rel="noopener noreferrer">{jsonData.external_url}</a></p>
                  )}
                  {jsonData.animation_url && (
                    <p><strong>Animation URL:</strong> <a href={jsonData.animation_url} target="_blank" rel="noopener noreferrer">{jsonData.animation_url}</a></p>
                  )}
                  {jsonData.youtube_url && (
                    <p><strong>YouTube URL:</strong> <a href={jsonData.youtube_url} target="_blank" rel="noopener noreferrer">{jsonData.youtube_url}</a></p>
                  )}
                  {jsonData.attributes && Array.isArray(jsonData.attributes) && jsonData.attributes.length > 0 ? (
                    jsonData.attributes.map((attr: any, index: number) => {
                      // Ensure each attribute is an object and has 'trait_type' or can be 'value only'
                      if (typeof attr !== 'object' || (!attr.trait_type && !attr.value) || (attr.trait_type && typeof attr.trait_type !== 'string')) {
                        return (
                          <p key={index} className={styles.warning}>
                            Invalid attribute format at index {index}. Expected object with "trait_type" (string) and "value" (string or number).
                          </p>
                        );
                      }

                      // If the attribute has a value but no trait_type, handle as "value only"
                      const displayValue = typeof attr.value === 'number' ? attr.value.toString() : attr.value;

                      return (
                        <p key={index}>
                          <strong>{attr.trait_type ? attr.trait_type : ''} {displayValue}</strong>
                        </p>
                      );
                    })
                  ) : (
                    <p>No valid attributes found or attributes are malformed.</p>
                  )}
                </div>
              ) : (
                <p>No metadata found.</p>
              )}
            </div>
          ) : (
            <p>No metadata found for ID: {tokenId}</p>
          )}

          <button
            className={styles.button}
            onClick={handleMint}
            disabled={isMinted || minting || !metadata || metadata?.price === undefined}
          >
            {minting ? <Spinner size="sm" color="white" /> : 
            !isMinted ? "Mint Token" : "Already Minted"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default MintToken;
