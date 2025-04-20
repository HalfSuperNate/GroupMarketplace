import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useContract, NATIVE_TOKEN } from "../../hooks/useContract";
import { useFetchGroupOwner, useFetchCreatorFeeMax, useFetchCreatorFee, useFetchGroupURI } from "../../hooks/useReadContract";
import styles from "../../styles/Home.module.css";
import Navbar from "@/components/Navbar";

const ManageGroup = () => {
    const router = useRouter();
    const { address } = useAccount();
    const { setCreatorFee, setGroupURI, loading: isLoading } = useContract();
    const { groupName } = router.query as { groupName?: string };
    const { groupOwner, loading_c, error_c } = useFetchGroupOwner(groupName || "");
    const { creatorFeeMax, loading_k, error_k } = useFetchCreatorFeeMax();
    const { creatorFee, loading_l, error_l } = useFetchCreatorFee(groupName || "");
    const { groupURI, loading_m, error_m } = useFetchGroupURI(groupName || "");

    const [owner, setOwner] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    const [creatorFeeInput, setCreatorFeeInput] = useState<string>("");
    const [creatorFeeBasisPoints, setCreatorFeeBasisPoints] = useState<number | null>(null);
    const maxCreatorFeeBasisPoints = (parseInt(creatorFeeMax?.toString()));

    const [prefix, setPrefix] = useState("");
    const [appendTokenId, setAppendTokenId] = useState(true);
    const [suffix, setSuffix] = useState("");
    const [exampleTokenId, setExampleTokenId] = useState("1");

    const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Allow only numbers with max 1 decimal place
        if (/^\d*\.?\d{0,1}$/.test(value)) {
            setCreatorFeeInput(value);

            const feeNumber = parseFloat(value);
            if (!isNaN(feeNumber)) {
                const basisPoints = Math.round(feeNumber * 100);
                setCreatorFeeBasisPoints(basisPoints); // always set it
            }
        }
    };

    useEffect(() => {
        if (!groupOwner || !address) return;
        setOwner(groupOwner);
        setIsOwner(groupOwner.toLowerCase() === address.toLowerCase());
    }, [groupOwner, address]);

    const handleSetCreatorFee = async () => {
        if (groupName === undefined || !isOwner || !creatorFeeBasisPoints) return;

        // Set Creator Fee
        await setCreatorFee(groupName, BigInt(creatorFeeBasisPoints));
        return;
    };

    const handleSetURI = async () => {
        if (groupName === undefined || !isOwner) return;

        // Set Group URI
        await setGroupURI(groupName, [prefix, appendTokenId ? "Y" : "", suffix]);
        return;
    };

    if (!groupName) {
        return (
            <div className={styles.container}>
                <Navbar />
                <div className={styles.groupManageContainer}>Missing group name.</div>;
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className={styles.container}>
                <Navbar />
                <div className={styles.groupManageContainer}>Access denied. You are not the owner of this group.</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Navbar />
            <div className={styles.groupManageContainer}>
                <h1 className={styles.title}>
                    {`Manage Group: `}
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            router.push(`/groups/${groupName.trim()}`);
                        }}
                    >
                        {groupName}
                    </a>
                </h1>

                <div className={styles.groupManageSection}>
                    <h2>Set Creator Fee %</h2>
                    <input
                        type="text"
                        placeholder="e.g. 2.5"
                        value={creatorFeeInput}
                        onChange={handleFeeChange}
                        className={styles.groupManageInput}
                    />
                    <p>Basis Points: {creatorFeeBasisPoints ?? "—"}</p>
                    <p>Max: {(maxCreatorFeeBasisPoints / 100)}%</p>
                    <p>Current Creator Fee: {(parseInt(creatorFee?.toString()) / 100)}%</p>
                    {creatorFeeBasisPoints !== null && creatorFeeBasisPoints > maxCreatorFeeBasisPoints && (
                        <p className={styles.warning}>
                            Fee too high. Max allowed is {(maxCreatorFeeBasisPoints / 100).toFixed(1)}%
                        </p>
                    )}

                    <button
                    className={styles.groupManageButton}
                    onClick={handleSetCreatorFee}
                    disabled={
                        creatorFeeBasisPoints === null ||
                        creatorFeeBasisPoints > maxCreatorFeeBasisPoints
                    }
                    >
                    Update Fee
                    </button>
                </div>

                <div className={styles.groupManageSection}>
                    <h2>Update Group URI</h2>

                    <label className={styles.groupManageLabel}>Prefix</label>
                    <input
                        type="text"
                        placeholder="https://example.com/metadata/ or ipfs://CID/"
                        className={styles.groupManageInput}
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                    />

                    <label className={styles.groupManageCheckbox}>
                        <input
                        type="checkbox"
                        checked={appendTokenId}
                        onChange={(e) => setAppendTokenId(e.target.checked)}
                        />
                        Append token ID after prefix
                    </label>

                    {appendTokenId && (
                        <div>
                        <label className={styles.groupManageLabel}>Example Token ID</label>
                        <input
                            type="text"
                            placeholder="e.g. 1"
                            className={styles.groupManageInput}
                            value={exampleTokenId}
                            onChange={(e) => setExampleTokenId(e.target.value)}
                        />
                        </div>
                    )}

                    <label className={styles.groupManageLabel}>Suffix</label>
                    <input
                        type="text"
                        placeholder=".json"
                        className={styles.groupManageInput}
                        value={suffix}
                        onChange={(e) => setSuffix(e.target.value)}
                    />

                    <p className={styles.groupManageNote}>
                        Example URI: {prefix}{appendTokenId ? exampleTokenId : ""}{suffix}
                    </p>
                    <p>{`Current URI: ${groupURI[0]}${groupURI[1] && appendTokenId ? exampleTokenId ? exampleTokenId : 1 : ""}${groupURI[2]}`}</p>

                    <button 
                        className={styles.groupManageButton}
                        onClick={handleSetURI}
                    >
                        Update URI
                    </button>
                </div>

                <div className={styles.groupManageSection}>
                    <h2>Transfer Ownership</h2>
                    <input type="text" placeholder="New owner address" className={styles.groupManageInput} />
                    <button className={styles.groupManageButton}>Transfer Ownership</button>
                </div>
            </div>
        </div>

    );
};

export default ManageGroup;
