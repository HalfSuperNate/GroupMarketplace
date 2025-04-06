"use client";

import { useRouter } from 'next/router';
import { useState, useEffect } from "react";
import { useContract, NATIVE_TOKEN } from "../../hooks/useContract";
import { useFetchMetadata, useFetchMetadataSet, useFetchTokenUri, useFetchIsMinted, useFetchListing } from "../../hooks/useReadContract";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Spinner } from "@chakra-ui/react";
import styles from "../../styles/Home.module.css";
import { formatEther } from "viem";
import Navbar from "@/components/Navbar";

const MintToken = () => {
  const { mintToken, loading: minting } = useContract();
  const router = useRouter();
  const [tokenId, setTokenId] = useState<number | null>(null);

  // Read tokenId from query on mount
  useEffect(() => {
    if (router.isReady && router.query.tokenId) {
      const queryTokenId = parseInt(router.query.tokenId as string);
      if (!isNaN(queryTokenId)) {
        setTokenId(queryTokenId);
      }
    }
  }, [router.isReady, router.query.tokenId]);

  const { metadata, loading, error } = useFetchMetadata(tokenId ?? 0);
  const { onChain, loading_a, error_a } = useFetchMetadataSet(tokenId ?? 0);
  const { tokenURI, loading_b, error_b } = useFetchTokenUri(tokenId ?? 0);
  const { isMinted, loading_d, error_d } = useFetchIsMinted(tokenId ?? 0);
  const { listing, loading_f, error_f } = useFetchListing(tokenId ?? 0);

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

  // ✅ Fetch external or on-chain JSON metadata
  useEffect(() => {
    const fetchJsonData = async () => {
      // 🧼 Reset previous state before fetching
      setJsonData(null);
      setJsonError(null);
  
      if (!tokenURI) {
        setJsonError("No token URI found.");
        return;
      }
  
      setFetchingJson(true);
  
      // ✅ Handle Base64-encoded on-chain metadata
      if (tokenURI.startsWith("data:application/json;base64,")) {
        console.log("On-chain Base64 detected");
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
          if (response.status === 404) {
            setJsonError("Metadata not found (404).");
          } else {
            setJsonError(`Failed to fetch metadata: ${response.status}`);
          }
          return;
        }
  
        const json = await response.json();
  
        if (json.image) {
          json.image = resolveIPFS(json.image);
        }
  
        setJsonData(json);
      } catch (err: any) {
        console.error("Error fetching JSON data:", err);
        setJsonError(`Failed to load JSON metadata: ${err.message}`);
      } finally {
        setFetchingJson(false);
      }
    };
  
    fetchJsonData();
  }, [tokenURI, tokenId]); // include tokenId to ensure reset when switching
  

  const handleMint = async () => {
    if (tokenId === null || tokenId < 0 || !metadata || metadata.price === undefined) return;
    const priceInWei = metadata?.price || 0n;
    await mintToken(tokenId, priceInWei);
  };

  if (tokenId === null) {
    setTokenId(parseInt(router.query.tokenId as string));
    return (
      <div className={styles.container}>
        <Navbar />
        <main className={styles.main}>
          <Spinner size="lg" color="blue.500" />
          <p>Loading token ID...</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>Mint Token</h1>

        {/* <div className={styles.connectButton}>
          <ConnectButton label="Connect Wallet" accountStatus="address" chainStatus="none" />
        </div> */}

        <div className={styles.form}>
          <label className={styles.label}>
            Token ID:
            <input
              className={styles.input}
              type="number"
              value={tokenId ?? ''}
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
                    {metadata.price !== undefined ? ` ${formatEther(metadata.price)} ${NATIVE_TOKEN}` : " N/A"}
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
                    {metadata.price !== undefined ? ` ${formatEther(metadata.price)} ${NATIVE_TOKEN}` : " N/A"}
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
                  <a href={jsonData.image} target="_blank" rel="noopener noreferrer">
                    <img
                      src={jsonData.image}
                      alt={jsonData.name}
                      className={styles.image}
                      style={{ maxWidth: "200px", borderRadius: "8px" }}
                    />
                  </a>
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
                          <strong>{attr.trait_type ? `${attr.trait_type}:` : ''} {displayValue}</strong>
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
