import { useRouter } from 'next/router';
import { useState, useEffect } from "react";
import { NATIVE_TOKEN } from "../../hooks/useContract";
import { useFetchTokensInGroup, useFetchMetadata, useFetchIsMinted, useFetchTokenUri } from '../../hooks/useReadContract';
import styles from '../../styles/Home.module.css';
import Navbar from "@/components/Navbar";
import { formatEther } from 'viem';

const GroupPage = () => {
    const router = useRouter();
    const { groupName } = router.query as { groupName: string };

    const { tokenIds, loading_e, error_e } = useFetchTokensInGroup(groupName);

    if (loading_e) return <p>Loading tokens for group: {groupName}</p>;
    if (error_e || !tokenIds) return <p>Error fetching group tokens</p>;

    return (
        <div className={styles.container}>
            <Navbar />
            <h1 className={styles.groupHeading}>{groupName}</h1>
            <div className={styles.groupGrid}>
                {tokenIds.map((tokenId) => (
                    <TokenCard key={tokenId} tokenId={tokenId} />
                ))}
            </div>
        </div>
    );
};

export default GroupPage;

const TokenCard = ({ tokenId }: { tokenId: number }) => {
    const { metadata } = useFetchMetadata(tokenId);
    const { isMinted } = useFetchIsMinted(tokenId);
    const { tokenURI } = useFetchTokenUri(tokenId);

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

    const resolvePrice = (priceIn: bigint | undefined): string => {
        if (!priceIn) return "";
        return formatEther(priceIn);
    };

    if (!metadata && !jsonData) return null;

    return (
        <div className={styles.groupCard} onClick={() => goToToken(tokenId)}>
            {jsonError && <p className={styles.error}>Error: {jsonError}</p>}
            {(metadata?.image || jsonData?.image) && (
                <img
                    src={resolveIPFS(metadata?.image || jsonData?.image)}
                    alt={metadata?.name || jsonData?.name || `Token #${tokenId}`}
                    className={styles.groupImage}
                />
            )}
            <h2>{metadata?.name || jsonData?.name || `Token #${tokenId}`}</h2>
            {/* <p>{metadata?.description || jsonData?.description || "No description"}</p> */}
            <p>
                {isMinted
                    ? `Already minted`
                    : `Price: ${resolvePrice(metadata?.price)} ${NATIVE_TOKEN}`}
            </p>
        </div>
    );
};
