"use client";

import { useState, useEffect } from 'react';
import { useContract, NATIVE_TOKEN } from '../../hooks/useContract';
import { useReadMarketplace } from "../../hooks/useReadContract";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Spinner } from "@chakra-ui/react"; 
import styles from "../../styles/Home.module.css";

const MintToken = () => {
  const { fetchPrice } = useReadMarketplace();
  const { mintToken, loading } = useContract();

  const [tokenId, setTokenId] = useState<number>(0);
  const [price, setPrice] = useState<string | null>(null);  // Store fetched price
  const [fetchingPrice, setFetchingPrice] = useState<boolean>(false);  // Price loading state

  // ✅ Fetch price dynamically when tokenId changes
  useEffect(() => {
    const fetchTokenPrice = async () => {
      if (tokenId > 0) {
        setFetchingPrice(true);
        try {
          const result = fetchPrice(tokenId);
          if (result && result.data) {
            setPrice(result.data.toString());
          } else {
            setPrice("N/A");
          }
        } catch (error) {
          console.error("Error fetching price:", error);
          setPrice("N/A");
        } finally {
          setFetchingPrice(false);
        }
      } else {
        setPrice(null);
      }
    };

    fetchTokenPrice();
  }, [tokenId]);

  const handleMint = async () => {
    if (!tokenId || !price || price === "N/A") return;
    await mintToken(tokenId, price);
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* ✅ Title */}
        <h1 className={styles.title}>Mint Token</h1>

        {/* ✅ Connect Button */}
        <div className={styles.connectButton}>
          <ConnectButton label="Connect Wallet" accountStatus="address" chainStatus="none" />
        </div>

        {/* ✅ Form */}
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

          {/* ✅ Displaying Dynamic Price */}
          <label className={styles.label}>
            Price ({NATIVE_TOKEN}):
            {fetchingPrice ? (
              <Spinner size="sm" color="blue.500" />
            ) : (
              <span>{price ? `${price} ETH` : "N/A"}</span>
            )}
          </label>

          <button
            className={styles.button}
            onClick={handleMint}
            disabled={loading || fetchingPrice || !price || price === "N/A"}
          >
            {loading ? (
              <Spinner size="sm" color="white" />
            ) : (
              "Mint Token"
            )}
          </button>
        </div>

        {/* ✅ Displaying Loading Message */}
        {loading && (
          <p className={styles.warning}>Transaction is processing...</p>
        )}
      </main>
    </div>
  );
};

export default MintToken;
