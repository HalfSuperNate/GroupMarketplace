import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useContract, NATIVE_TOKEN } from "../../hooks/useContract";
import { useFetchGroupOwner, useFetchCreatorFeeMax, useFetchCreatorFee, useFetchGroupURI } from "../../hooks/useReadContract";
import styles from "../../styles/Home.module.css";
import Navbar from "@/components/Navbar";
import { Spinner } from "@chakra-ui/react";
import { Address, isAddress } from "viem";

const ManageGroup = () => {
    const router = useRouter();
    const { address } = useAccount();
    const { setCreatorFee, setGroupURI, setNewGroupOwner, setGroupRestrictions, loading: isLoading } = useContract();
    const { groupName } = router.query as { groupName?: string };
    const { groupOwner, refetch: refetch_c } = useFetchGroupOwner(groupName || "");
    const { creatorFeeMax } = useFetchCreatorFeeMax();
    const { data: creatorFee, refetch: refetch_l } = useFetchCreatorFee(groupName || "");
    const { groupURI, refetch: refetch_m } = useFetchGroupURI(groupName || "");

    const [owner, setOwner] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    const [creatorFeeInput, setCreatorFeeInput] = useState<string>("");
    const [creatorFeeBasisPoints, setCreatorFeeBasisPoints] = useState<number | null>(null);
    const maxCreatorFeeBasisPoints = (parseInt(creatorFeeMax?.toString()));

    const [prefix, setPrefix] = useState("");
    const [appendTokenId, setAppendTokenId] = useState(true);
    const [suffix, setSuffix] = useState("");
    const [exampleTokenId, setExampleTokenId] = useState("1");

    const [isSettingFee, setIsSettingFee] = useState(false);
    const [isSettingURI, setIsSettingURI] = useState(false);
    const [isSettingNewGroupOwner, setIsSettingNewGroupOwner] = useState(false);

    const [newOwnerInput, setNewOwnerInput] = useState<string>("");

    const [restrictionInput, setRestrictionInput] = useState("");
    const [restrictedAddresses, setRestrictedAddresses] = useState<Address[]>([]);
    const [isRestrictionMode, setIsRestrictionMode] = useState(true);
    const [isLoadingRestrictions, setIsLoadingRestrictions] = useState(false);


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
        if (!groupName || !isOwner || creatorFeeBasisPoints === null) return;
    
        setIsSettingFee(true);
        try {
            await setCreatorFee(groupName, BigInt(creatorFeeBasisPoints), async () => {
                const updated = await refetch_l();
                console.log("Refetched result:", updated.data?.toString());
            });
        } catch (err) {
            console.error("Failed to set creator fee:", err);
        } finally {
            setIsSettingFee(false);
        }
    };    
      
    const handleSetURI = async () => {
        if (groupName === undefined || !isOwner) return;
    
        setIsSettingURI(true);
        try {
            await setGroupURI(groupName, [prefix, appendTokenId ? "Y" : "", suffix], async () => {
                const updated = await refetch_m();
                console.log("Refetched URIs:", updated);
            });
        } catch (err) {
            console.error("Failed to update URI:", err);
        } finally {
            setIsSettingURI(false);
        }
    };    

    const handleSetNewGroupOwner = async () => {
        if (groupName === undefined || !isOwner || !newOwnerInput) return;
        if (!isAddress(newOwnerInput)) {
            alert("Invalid Ethereum address");
            return;
        }
    
        const confirmation = window.prompt(
            `You are about to transfer ownership of group "${groupName}" to:\n\n${newOwnerInput}\n\nIf this is correct, type "accept" to confirm.`
        );
    
        if (confirmation?.toLowerCase() !== "accept") {
            console.log("Group ownership transfer canceled by user.");
            return;
        }
    
        setIsSettingNewGroupOwner(true);
        try {
            await setNewGroupOwner(groupName, newOwnerInput as Address, async () => {
                const updated = await refetch_c();
                console.log("Refetched group owner:", updated);
            });
        } catch (err) {
            console.error("Failed to update new group owner:", err);
        } finally {
            setIsSettingNewGroupOwner(false);
        }
    }; 

    const handleSetGroupRestrictions = async () => {
        if (groupName === undefined || !isOwner) return;
        if (restrictedAddresses.length === 0) return;
      
        setIsLoadingRestrictions(true);
        try {
          await setGroupRestrictions(groupName, restrictedAddresses, isRestrictionMode);
          console.log(`Restrictions ${isRestrictionMode ? "enabled" : "disabled"} for:`, restrictedAddresses);
        } catch (err) {
          console.error("Failed to set group restrictions", err);
        } finally {
          setIsLoadingRestrictions(false);
        }
    };

    const handleAddAddress = () => {
        if (!isAddress(restrictionInput)) {
          alert("Invalid Ethereum address");
          return;
        }
      
        if (!restrictedAddresses.includes(restrictionInput as Address)) {
          setRestrictedAddresses(prev => [...prev, restrictionInput as Address]);
          setRestrictionInput("");
        }
    };
      
    // 🔳 TO DO: if group owner is on this page give the option to:

    // updateGroupRestrictions
      
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
                    {isSettingFee ? (
                        <p>Updating creator fee...<Spinner size="sm" color="white" /></p>
                    ) : (
                        <p>Current Creator Fee: {(parseInt(creatorFee?.toString() || "0") / 100)}%</p>
                    )}
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
                        creatorFeeBasisPoints > maxCreatorFeeBasisPoints ||
                        isLoading
                    }
                    >
                        {isSettingFee ? "Setting fee..." : "Set Creator Fee"}
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
                    {isSettingURI ? (
                        <p>Updating URI...<Spinner size="sm" color="white" /></p>
                    ) : (
                        <p>{`Current URI: ${groupURI[0]}${groupURI[1] != "" ? (exampleTokenId ? exampleTokenId : 1) : ""}${groupURI[2]}`}</p>
                    )}
                    <button 
                        className={styles.groupManageButton}
                        onClick={handleSetURI}
                        disabled={isLoading}
                    >
                        {isSettingURI ? "Setting URI..." : "Update URI"}
                    </button>
                </div>

                <div className={styles.groupManageSection}>
                    <h2>Manage Group Restrictions</h2>

                    {/* Input + Add Button */}
                    <input
                        type="text"
                        placeholder="Enter address"
                        className={styles.groupManageInput}
                        value={restrictionInput}
                        onChange={(e) => setRestrictionInput(e.target.value)}
                    />
                    <button
                        className={styles.groupManageButton}
                        onClick={handleAddAddress}
                    >
                        ⊕ Address
                    </button>

                    {/* Global restriction mode toggle */}
                    <label className={styles.restrictionToggle}>
                        <input
                        type="checkbox"
                        checked={isRestrictionMode}
                        onChange={(e) => setIsRestrictionMode(e.target.checked)}
                        />
                        {isRestrictionMode ? ": Set Restrictions" : ": Remove Restrictions"} For These Addresses
                    </label>

                    {/* Display address list with remove buttons */}
                    <ul className={styles.restrictionList}>
                        {restrictedAddresses.map((addr, index) => (
                        <li key={index} className={styles.restrictionItem}>
                            <span>{addr}</span>
                            <button
                            className={styles.groupManageButton}
                            onClick={() => {
                                setRestrictedAddresses(prev => prev.filter((_, i) => i !== index));
                            }}
                            >
                            {`⊖`}
                            </button>
                        </li>
                        ))}
                    </ul>

                    {/* Submit */}
                    <button
                        className={styles.groupManageButton}
                        onClick={handleSetGroupRestrictions}
                        disabled={isLoading}
                    >
                        {isLoadingRestrictions ? "Setting Restrictions..." : "Set Group Restrictions"}
                    </button>
                </div>

                <div className={styles.groupManageSection}>
                    <h2>Transfer Group Ownership</h2>
                    <input 
                        type="text" 
                        placeholder="New owner address" 
                        className={styles.groupManageInput} 
                        value={newOwnerInput}
                        onChange={(e) => setNewOwnerInput(e.target.value)}
                    />
                    {isSettingNewGroupOwner ? (
                        <p>Updating Group Owner...<Spinner size="sm" color="white" /></p>
                    ) : (
                        <p>{`Current Owner: ${groupOwner}`}</p>
                    )}
                    <button 
                        className={styles.groupManageButton}
                        onClick={handleSetNewGroupOwner}
                        disabled={isLoading}
                    >
                        {isSettingNewGroupOwner ? "Setting New Group Owner..." : "Transfer Ownership"}
                    </button>
                </div>
            </div>
        </div>

    );
};

export default ManageGroup;
