"use client";

import { useState } from "react";
import { useContract, NATIVE_TOKEN } from "../../hooks/useContract";
import { useFetchMetadata, useFetchMetadataSet, useFetchTokenUri } from "../../hooks/useReadContract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Spinner } from "@chakra-ui/react";
import styles from "../../styles/Home.module.css";
import { formatEther } from 'viem'

const MintToken = () => {
  const { mintToken, loading: minting } = useContract();
  const [tokenId, setTokenId] = useState<number>(0);

  const { metadata, loading, error } = useFetchMetadata(tokenId);
  const { onChain, loading_a, error_a } = useFetchMetadataSet(tokenId);
  const { tokenURI, loading_b, error_b } = useFetchTokenUri(tokenId);
  console.log(tokenURI);

  const handleMint = async () => {
    if (tokenId < 0 || !metadata || metadata.price === undefined) return;

    // ✅ Use optional chaining and fallback value
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

          {/* ✅ Displaying metadata or loading indicator */}
          {loading ? (
            <div className={styles.metadata}>
              <Spinner size="sm" color="blue.500" />
              <p>Loading metadata...</p>
            </div>
          ) : error ? (
            <p className={styles.warning}>Error: {error}</p>
          ) : metadata ? (
            <div className={styles.metadata}>
              {onChain ? 
                <div className={styles.metadata}>
                  <p className={styles.truncate}><strong>Metadata: </strong> <a href={tokenURI} target="_blank" rel="noopener noreferrer">⛓️ On Chain</a></p>
                  <p><strong>Name:</strong> {metadata.name}</p>
                  <p><strong>Description:</strong> {metadata.description}</p>
                  <p><strong>Creator:</strong> {metadata.creator}</p>
                  <p><strong>Locked:</strong> {metadata.locked ? "Yes" : "No"}</p>
                  <p><strong>Background:</strong> {metadata.backgroundColor || "N/A"}</p>
                  <p><strong>Attributes:</strong> {metadata.attributes || "None"}</p>
                  <p>
                    <strong>Price: </strong> 
                    {metadata.price !== undefined ? `${formatEther(metadata.price)} ${NATIVE_TOKEN}` : " N/A"}
                  </p>
                </div>
                : 
                <div className={styles.metadata}>
                  <p className={styles.truncate}><strong>Metadata: </strong> <a className={styles.padLink} href={tokenURI} target="_blank" rel="external noopener noreferrer">💾 Off Chain</a></p>
                  <p><strong>Creator:</strong> {metadata.creator}</p>
                  <p>
                    <strong>Price: </strong> 
                    {metadata.price !== undefined ? `${formatEther(metadata.price)} ${NATIVE_TOKEN}` : " N/A"}
                  </p>
                </div>
              }
              
            </div>
          ) : (
            <p>No metadata found for ID: {tokenId}</p>
          )}

          <button
            className={styles.button}
            onClick={handleMint}
            disabled={minting || !metadata || metadata?.price === undefined}
          >
            {minting ? (
              <Spinner size="sm" color="white" />
            ) : (
              "Mint Token"
            )}
          </button>
        </div>

        {minting && (
          <p className={styles.warning}>Transaction is processing...</p>
        )}
      </main>
    </div>
  );
};

export default MintToken;
