import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useFetchGroupOwner, useFetchCreatorFeeMax } from "../../hooks/useReadContract";
import styles from "../../styles/Home.module.css";
import Navbar from "@/components/Navbar";

const ManageGroup = () => {
    const router = useRouter();
    const { address } = useAccount();
    const { groupName } = router.query as { groupName?: string };
    const { groupOwner, loading_c, error_c } = useFetchGroupOwner(groupName || "");
    const { creatorFeeMax, loading_k, error_k } = useFetchCreatorFeeMax();

    const [owner, setOwner] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    const [creatorFeeInput, setCreatorFeeInput] = useState<string>("");
    const [creatorFeeBasisPoints, setCreatorFeeBasisPoints] = useState<number | null>(null);
    const maxCreatorFeeBasisPoints = (parseInt(creatorFeeMax.toString()));

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
                    {creatorFeeBasisPoints !== null && creatorFeeBasisPoints > maxCreatorFeeBasisPoints && (
                        <p className={styles.warning}>
                            Fee too high. Max allowed is {(maxCreatorFeeBasisPoints / 100).toFixed(1)}%
                        </p>
                    )}

                    <button
                    className={styles.groupManageButton}
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
                    <input type="text" placeholder="New metadata URI" className={styles.groupManageInput} />
                    <button className={styles.groupManageButton}>Update URI</button>
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
