import { useRouter } from 'next/router';
import { useState, useEffect } from "react";
import { useAccount } from 'wagmi';
import { NATIVE_TOKEN } from "../hooks/useContract";
import { useFetchTokensInGroup, useFetchMetadata, useFetchIsMinted, useFetchTokenUri, useFetchListing, useFetchNextTokenId, useFetchGroupOwner } from '../hooks/useReadContract';
import styles from '../styles/Home.module.css';
import Navbar from "@/components/Navbar";
import { formatEther } from 'viem';
import { shuffleArray } from '@/utils/random';

const GroupDisplay = ({ groupName }: { groupName?: string }) => {
    const { address: connectedAddress } = useAccount();
    
    const router = useRouter();

    const { tokenIds, loading_e, error_e } = useFetchTokensInGroup(groupName || "");
    const { nextTokenId, loading_i, error_i } = useFetchNextTokenId();
    const { groupOwner, loading_c, error_c } = useFetchGroupOwner(groupName || "");
    const isGroupOwner = connectedAddress?.toLowerCase() === groupOwner?.toLowerCase();

    const [randomTokenIds, setRandomTokenIds] = useState<number[]>([]);
    const [showRandom, setShowRandom] = useState(false);

    useEffect(() => {
        if (!router.isReady) return;
        const noGroupProvided = !groupName;

        if (noGroupProvided && nextTokenId && typeof nextTokenId === 'bigint') {
            const maxId = Number(nextTokenId);
            const tokenRange = Array.from({ length: maxId }, (_, i) => i);
            const shuffled = shuffleArray(tokenRange).slice(0, 50);
            setRandomTokenIds(shuffled);
            setShowRandom(true);
        }
    }, [groupName, nextTokenId, router.isReady]);

    if (!groupName && !showRandom) return <p>Loading tokens...</p>;
    if (!showRandom && (loading_e || !tokenIds)) return <p>Loading tokens for group: {groupName}</p>;
    if (!showRandom && error_e) return <p>Error fetching group tokens</p>;

    return (
        <div className={styles.container}>
            <Navbar />
            <div className={styles.groupHeader}>
                <h1 className={styles.groupHeading}>
                    {showRandom ? "Random Group Marketplace Tokens" : groupName}
                </h1>

                {isGroupOwner && (
                    <button
                    className={styles.manageGroupButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/groups/manage?groupName=${groupName}`);
                    }}
                    >
                        Manage Group
                    </button>
                )}
            </div>
            <div className={styles.groupGrid}>
                {(showRandom ? randomTokenIds : tokenIds)?.map((tokenId) => (
                    <TokenCard key={tokenId} tokenId={tokenId} />
                ))}
            </div>
        </div>
    );
};

export default GroupDisplay;

const TokenCard = ({ tokenId }: { tokenId: number }) => {
    const { metadata } = useFetchMetadata(tokenId);
    const { isMinted } = useFetchIsMinted(tokenId);
    const { tokenURI } = useFetchTokenUri(tokenId);
    const { listing } = useFetchListing(tokenId);

    const now = Math.floor(Date.now() / 1000); // current Unix timestamp
    const isListedAndActive = !!(listing?.active && listing.expiration > now);
    const displayPrice = isMinted ? (isListedAndActive ? listing?.price : "No Active Sale" ) : metadata?.price;

    const [timeLeft, setTimeLeft] = useState("");

    const [jsonData, setJsonData] = useState<any>(null);
    const [fetchingJson, setFetchingJson] = useState<boolean>(false);
    const [jsonError, setJsonError] = useState<string | null>(null);

    const router = useRouter();

    const goToToken = (tokenId: number) => {
        router.push(`/actions/Token?tokenId=${tokenId}`);
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

    useEffect(() => {
        if (metadata?.image === "" && tokenURI) {
            fetchJsonData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metadata?.image, tokenURI]);

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

    const resolvePrice = (priceIn: bigint | undefined | string): string => {
        if (!priceIn || typeof priceIn === "string") return "";
        return formatEther(priceIn);
    };

    if (!metadata && !jsonData) return null;

    const getFinalImageSrc = () => {
        if (!tokenURI) return "/default-image.svg";
        if (metadata && metadata.image) {
            return resolveIPFS(metadata.image);
        }
        if (jsonData && jsonData.image) {
            return resolveIPFS(jsonData.image);
        }

        return "/default-image.svg";
    }

    const getFinalName = () => {
        if (!tokenURI) return `No Metadata Set For Token #${tokenId}`;
        if (metadata && metadata.name) {
            return metadata.name;
        }
        if (jsonData && jsonData.name) {
            return jsonData.name;
        }

        return `Token #${tokenId}`;
    }

    return (
        <div className={styles.groupCard} onClick={() => goToToken(tokenId)}>
            <img
                src={getFinalImageSrc()}
                alt={metadata?.name || jsonData?.name || ``}
                className={styles.groupImage}
                onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-image.svg"; // Fallback if URL fails
                }}
            />
            {jsonError && <p className={styles.error}>Error: {jsonError}</p>}
            <h2>{getFinalName()}</h2>
            {/* <p>{metadata?.description || jsonData?.description || "No description"}</p> */}
            <p>
                {isMinted
                    ? (isListedAndActive 
                        ? <>
                            {resolvePrice(displayPrice)} {NATIVE_TOKEN}<br />
                            {timeLeft}
                        </>
                        : displayPrice)
                    : `Mint: ${resolvePrice(metadata?.price)} ${NATIVE_TOKEN}`
                }
            </p>
        </div>
    );
};
