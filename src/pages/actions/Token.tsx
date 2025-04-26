"use client";

import { useRouter } from 'next/router';
import { useState, useEffect } from "react";
import { useContract, NATIVE_TOKEN } from "../../hooks/useContract";
import { useFetchMetadata, useFetchMetadataSet, useFetchTokenUri, useFetchIsMinted, useFetchListing, useFetchTokenOwner, useFetchTokenGroup, useFetchGroupOwner, useFetchNewGroupPrice } from "../../hooks/useReadContract";
import { Spinner } from "@chakra-ui/react";
import styles from "../../styles/Home.module.css";
import { formatEther, parseEther } from "viem";
import Navbar from "@/components/Navbar";
import { useAccount } from "wagmi";
import Link from "next/link";

const TokenAction = () => {
  const { address } = useAccount();
  const { mintToken, listToken, cancelListing, buyToken, moveTokenToGroup, setLockMetadata, loading: isLoading } = useContract();
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

  const { metadata, loading, error, refetchMetadata } = useFetchMetadata(tokenId ?? 0);
  const { onChain, loading_a, error_a } = useFetchMetadataSet(tokenId ?? 0);
  const { tokenURI, loading_b, error_b } = useFetchTokenUri(tokenId ?? 0);
  const { isMinted, loading_d, error_d } = useFetchIsMinted(tokenId ?? 0);
  const { listing, loading_f, error_f, refetch_f } = useFetchListing(tokenId ?? 0);
  const { tokenOwner, loading_g, error_g } = useFetchTokenOwner(tokenId ?? 0);
  const isTokenOwner = address === tokenOwner || false;
  const isTokenCreator = address === metadata?.creator || false;
  const isLocked = metadata?.locked || false;
  const { tokenGroup, loading_h, error_h, refetch_h } = useFetchTokenGroup(tokenId ?? 0);

  const now = Math.floor(Date.now() / 1000); // current Unix timestamp
  const isListedAndActive = !!(listing?.active && listing.expiration > now);
  const displayPrice = isMinted ? listing?.price : metadata?.price;

  const { newGroupFee, loading_j, error_j } = useFetchNewGroupPrice();

  const [inputSalePrice, setInputSalePrice] = useState<number>(0);
  const [inputDate, setInputDate] = useState<string>("");
  const [inputHour, setInputHour] = useState<number>(0);
  const [inputMinute, setInputMinute] = useState<number>(0);
  const [inputSecond, setInputSecond] = useState<number>(0);
  const [inputExpiration, setInputExpiration] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState("");

  const [jsonData, setJsonData] = useState<any>(null);
  const [fetchingJson, setFetchingJson] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [groupName, setGroupName] = useState('');
  const [isGroupAvailable, setIsGroupAvailable] = useState<boolean | null>(null);
  const [ownedGroup, setIsOwned] = useState<boolean | null>(null);
  // Destructure the result from the useFetchGroupOwner hook
  const { groupOwner, loading_c, error_c } = useFetchGroupOwner(groupName);

  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value);
    setIsGroupAvailable(null);
  };

  const handleCheckGroup = () => {
    // If the groupName is an address (starts with "0x")
    if (groupName.startsWith("0x") || groupName.startsWith("0X")) {
      if (groupName.toLowerCase() === address?.toLowerCase()) {
        setIsGroupAvailable(true);
        setIsOwned(true);
      } else {
        // An address, but not the user's
        setIsGroupAvailable(false);
        setIsOwned(false);
      }
      return; // Skip further groupOwner logic
    }
    // Check if the group is available by the contract check
    if (groupOwner === '0x0000000000000000000000000000000000000000') {
      setIsGroupAvailable(true);
      setIsOwned(false);
    } else if (groupOwner === address) {  // Compare groupOwner with the user's address
      setIsGroupAvailable(true);
      setIsOwned(true);
    } else {
      setIsGroupAvailable(false);
      setIsOwned(false);
    }
  };

  // ✅ Handle submit move token
  const handleSubmitMoveToken = async () => {
    if (tokenId === null || groupName === '') return;
    let price = 0n;

    if (isGroupAvailable && !ownedGroup) {
      price = newGroupFee;
    }
  
    try {
      await moveTokenToGroup(
        tokenId, 
        groupName, 
        price,
      async () => {
        const updated = await refetch_h();
        console.log("Refetched token group:", updated);
      });
    } catch (error) {
      console.error("Failed to fetch token group:", error);
    }
  };

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

  // Update expiration when date/time changes
  useEffect(() => {
    if (!inputDate) return;
  
    const [year, month, day] = inputDate.split("-").map(Number);
    const expirationDate = new Date(year, month - 1, day, inputHour, inputMinute, inputSecond);
    const expirationUnix = Math.floor(expirationDate.getTime() / 1000);
    setInputExpiration(expirationUnix);
  }, [inputDate, inputHour, inputMinute, inputSecond]);

  const handleCancel = async () => {
    if (tokenId === null || tokenId < 0 || !isListedAndActive) return;

    // Cancel Sale
    try {
      await cancelListing(tokenId, async () => {
        const updated = await refetch_f();
        console.log("Refetched listing:", updated);
      });
    } catch (error) {
      console.error("Failed to cancel listing:", error);
    }
    return;
  };

  const handleLockMetadata = async () => {
    if (tokenId === null || tokenId < 0 || isLocked) return;

    // Lock Metadata
    try {
      await setLockMetadata(tokenId, async () => {
        if (refetchMetadata) {
          const updated = await refetchMetadata();
          console.log("Refetched is locked", updated);
        }
      });
    } catch (error) {
      console.error("Failed to lock metadata:", error);
    }
    return;
  };

  const handlePurchase = async () => {
    if (tokenId === null || tokenId < 0 || !displayPrice) return;
    if (!isMinted) {
      // Mint Token
      try {
        await mintToken(tokenId, displayPrice, async () => {
          const updated = await refetch_f();
          console.log("Refetched listing:", updated);
        });
      } catch (error) {
        console.error("Failed to mint token:", error);
      }
      return;
    }
    if (isListedAndActive) {
      // Buy Token
      try {
        await buyToken(tokenId, displayPrice, async () => {
          const updated = await refetch_f();
          console.log("Refetched listing:", updated);
        });
      } catch (error) {
        console.error("Failed to buy token:", error);
      }
      return;
    }
  };

  const getTimeLeft = (expiration: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = expiration - now;
  
    if (diff <= 0) return "Expired";
  
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
  
    return `${hours}h ${minutes}m ${seconds}s`;
  };  

  useEffect(() => {
    if (!isListedAndActive || !listing?.expiration) return;
  
    const expiration = parseInt(listing.expiration.toString());
  
    const update = () => {
      setTimeLeft(getTimeLeft(expiration));
    };
  
    update(); // Run once on mount
  
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isListedAndActive, listing?.expiration]);

  const handleListForSale = async (sellPrice: number, expiration: number) => {
    const currentUnix = Math.floor(Date.now() / 1000);
    if (expiration <= currentUnix) {
      console.warn("Expiration time must be in the future.");
      return;
    }
  
    const duration = BigInt(expiration - currentUnix);
    if (tokenId === null || tokenId < 0 || !sellPrice || isListedAndActive || duration <= 0n) return;
    const setPrice = parseEther(sellPrice.toString());
    try {
      await listToken(tokenId, setPrice, duration, async () => {
        const updated = await refetch_f();
        console.log("Refetched listing:", updated);
      });
    } catch (error) {
      console.error("Failed to list token:", error);
    }
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
        <h1 className={styles.title}>Token Details</h1>

        <div className={styles.form}>
          <label className={styles.label}>
            <strong>Token ID:</strong>
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
          ) : metadata && tokenURI ? (
            <div className={styles.metadata}>
              {onChain ? (
                <div className={styles.metadata}>
                  <p>
                    <strong>Group:</strong>{' '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/groups/${tokenGroup.trim()}`);
                      }}
                    >
                      {tokenGroup}
                    </a>
                  </p>
                  <p className={styles.truncate}>
                    <strong>Metadata:</strong> 
                    <a href={tokenURI} target="_blank" rel="noopener noreferrer">⛓️ On Chain</a>
                  </p>
                  <p><strong>Creator:</strong> {metadata.creator}</p>
                  <p><strong>Locked:</strong> {metadata.locked ? "Yes" : "No"}</p>
                  <p>
                    {isMinted ? 
                      isListedAndActive ? 
                        <>
                          <strong>Time Left:</strong> {` ${timeLeft}`}
                          <br></br>
                          <strong>Sale Price:</strong>
                        </>
                        : 
                        displayPrice !== undefined && displayPrice > 0 ? 
                        <strong>Last Price:</strong>
                        :
                        <></>
                      : 
                      <strong>Mint Price:</strong> 
                    }
                    {displayPrice !== undefined && displayPrice > 0 ? ` ${formatEther(displayPrice)} ${NATIVE_TOKEN}` : ""}
                  </p>
                </div>
              ) : (
                <div className={styles.metadata}>
                  <p>
                    <strong>Group:</strong>{' '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/groups/${tokenGroup.trim()}`);
                      }}
                    >
                      {tokenGroup}
                    </a>
                  </p>
                  <p className={styles.truncate}>
                    <strong>Metadata:</strong> 
                    <a className={styles.padLink} href={tokenURI} target="_blank" rel="external noopener noreferrer">💾 Off Chain</a>
                  </p>
                  <p><strong>Creator:</strong> {metadata.creator}</p>
                  <p><strong>Locked:</strong> {metadata.locked ? "Yes" : "No"}</p>
                  <p>
                    {isMinted ? 
                      isListedAndActive ? 
                        <>
                          <strong>Sale Expires In:</strong> {` ${timeLeft}`}
                          <br></br>
                          <strong>Sale Price:</strong>
                        </>
                        :  
                        displayPrice !== undefined && displayPrice > 0 ? 
                        <strong>Last Price:</strong>
                        :
                        <></>
                      : 
                      <strong>Mint Price:</strong> 
                    }
                    {displayPrice !== undefined && displayPrice > 0 ? ` ${formatEther(displayPrice)} ${NATIVE_TOKEN}` : ""}
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
                <div>
                  <p className={styles.warning}>Error: {jsonError}</p>
                  <img
                    src={"/default-image.svg"}
                    alt={"error"}
                    className={styles.image}
                    style={{ maxWidth: "200px", borderRadius: "2px" }}
                  />
                </div>
              ) : jsonData ? (
                <div className={styles.groupImageContainer}>
                  <h3>📝 JSON Metadata</h3>
                  <a href={jsonData.image} target="_blank" rel="noopener noreferrer">
                    <img
                      src={jsonData.image ? jsonData.image : "/default-image.svg"}
                      alt={jsonData.name}
                      className={styles.groupImage}
                      style={{ maxWidth: "200px" }}
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
            metadata?.creator != "0x0000000000000000000000000000000000000000" ? 
              <div>
                <p>
                  <strong>Group:</strong>{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/groups/${tokenGroup.trim()}`);
                    }}
                  >
                    {tokenGroup}
                  </a>
                </p>
                {isTokenCreator ? (
                  <Link href={`/actions/SetMetadata?tokenId=${tokenId}`} passHref>
                    <p style={{ cursor: "pointer" }}>
                      No metadata found for ID: {tokenId}
                    </p>
                    <p style={{ cursor: "pointer" }}>
                      <span style={{ cursor: "pointer", color: 'lightblue', textDecoration: "underline" }}>Click here</span>{` `}to set metadata for this token
                    </p>
                  </Link>
                ) : (
                  <p>
                    No metadata found for ID: {tokenId}
                  </p>
                )}
              </div>
            :
              <p>
                ERROR:<br></br>
                Token ID: {tokenId}<br></br>
                NOT FOUND
              </p>
          )}

          {/* ✅ Display Minting or Buying button */}
          <button
            className={styles.button}
            onClick={handlePurchase}
            disabled={
              isLoading || !metadata || !tokenURI || metadata?.price === undefined ||
              (isMinted && (!isListedAndActive || displayPrice === undefined))
            }
          >
            {isLoading ? (
              <Spinner size="sm" color="white" />
            ) : !isMinted && displayPrice !== undefined ? (
              `Mint Token ${formatEther(displayPrice)} ${NATIVE_TOKEN}`
            ) : isListedAndActive && displayPrice !== undefined ? (
              `Buy Token ${formatEther(displayPrice)} ${NATIVE_TOKEN}`
            ) : (
              "No Active Sale"
            )}
          </button>
          
          {isTokenCreator && !isLocked ? (
            <div className={styles.metadataActions}>
              <div className={styles.metadataLinkSection}>
                <Link href={`/actions/SetMetadata?tokenId=${tokenId}`} passHref>
                  <p className={styles.editLink}>
                    ✏️ Edit Metadata for ID: {tokenId}
                  </p>
                </Link>
              </div>
            
              <hr className={styles.divider} />
            
              <div className={styles.metadataButtonSection}>
                <button
                  className={styles.button}
                  onClick={handleLockMetadata}
                  disabled={isLoading || !metadata || !tokenURI || isLocked}
                >
                  {isLoading ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    "Click to Lock Metadata 🔒"
                  )}
                </button>
              </div>
            </div>
          ):(<></>)}
          
          {/* ✅ Display Cancel Listing Options if token owner */}
          {isTokenOwner && isListedAndActive ? (
            <div className={styles.form}>
              <hr></hr>
              <h1 className={styles.title}>Cancel Sale</h1>
              <button
                className={styles.button}
                onClick={handleCancel}
                disabled={
                  isLoading || !isListedAndActive
                }
              >
                {isLoading ? (
                  <Spinner size="sm" color="white" />
                ) : isListedAndActive ? (
                  `Cancel Sale`
                ) : (
                  "No Active Sale"
                )}
              </button>
            </div>
          ) : (
            <></>
          )}
          
          {/* ✅ Display Listing Options if token owner */}
          {isTokenOwner && isMinted ? (
            <div className={styles.form}>
              <hr></hr>
              <h1 className={styles.title}>Sell Token</h1>
              <label className={styles.label}>
                <strong>Sale Price ({NATIVE_TOKEN}):</strong>
                <input
                  className={styles.input}
                  type="number"
                  value={inputSalePrice}
                  onChange={(e) => setInputSalePrice(Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </label>
              <div className={styles.expirationInputs}>
                <label className={styles.label}>
                  <strong>Expiration Date:</strong>
                  <input
                    className={styles.input}
                    type="date"
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                  />
                </label>
                
                <div className={styles.digitalClockWrapper}>
                  <label className={styles.label}>
                    <strong>Expiration Time:</strong>
                    <div className={styles.clockInputs}>
                      <input
                        className={styles.clockInput}
                        type="number"
                        value={inputHour}
                        onChange={(e) => setInputHour(Number(e.target.value))}
                        min={0}
                        max={23}
                        placeholder="HH"
                      />
                      <span>:</span>
                      <input
                        className={styles.clockInput}
                        type="number"
                        value={inputMinute}
                        onChange={(e) => setInputMinute(Number(e.target.value))}
                        min={0}
                        max={59}
                        placeholder="MM"
                      />
                      <span>:</span>
                      <input
                        className={styles.clockInput}
                        type="number"
                        value={inputSecond}
                        onChange={(e) => setInputSecond(Number(e.target.value))}
                        min={0}
                        max={59}
                        placeholder="SS"
                      />
                    </div>
                  </label>
                </div>

                {inputExpiration > Math.floor(Date.now() / 1000) ? (
                  <p>
                    <strong>UNIX:</strong> {inputExpiration}
                    <br></br>
                    <br></br>
                    <strong>Expires At:</strong>{" "}
                    <br></br>
                    {new Date(inputExpiration * 1000).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                ) : (
                  <p style={{ color: "red" }}><strong>Invalid expiration time (must be in the future)</strong></p>
                )}
              </div>

              <button
                className={styles.button}
                onClick={() => handleListForSale(inputSalePrice, inputExpiration)}
                disabled={
                  inputExpiration <= now ||
                  inputSalePrice <= 0 ||
                  isListedAndActive
                }
              >
                List Token For Sale
              </button>
            </div>
          ) : (
            <></>
          )}

          {/* ✅ Display Move token to group options */}
          {isTokenCreator && !isLocked ? (
            <div className={styles.form}>
              <hr></hr>
              <h1 className={styles.title}>Move Token To Group</h1>
              <label className={styles.label}>
                Group (existing or new):
                <input
                  className={styles.input}
                  name="group"
                  value={groupName}
                  onChange={handleGroupChange}
                />
              </label>

              {/* Conditional rendering based on the group availability status */}
              {loading_c && <p>Loading...</p>}
              {error_c && <p style={{ color: 'red' }}>{error_c}</p>}
              {isGroupAvailable === null ? (
                <p>Please check if the group is available.</p>
              ) : isGroupAvailable ? (
                ownedGroup ? (
                  <p>✅ You Own This Group!</p>
                ) : (
                  <p>✅ The group name is available!</p>
                )
              ) : (
                  <p>❌ The group name is taken or invalid.</p>
              )}

              <button 
                className={styles.attributesButton}
                type="button" 
                onClick={handleCheckGroup} 
                disabled={!groupName} // Disable if group name is empty
              >
                Check Group
              </button>
              <button className={styles.button} onClick={handleSubmitMoveToken} disabled={loading || !isGroupAvailable}>
                {loading ? <Spinner size="sm" color="white" /> : "Move Token"}
              </button>
            </div>
          ) : (
            <></>
          )}

        </div>
      </main>
    </div>
  );
};

export default TokenAction;
