"use client";

import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from "react";
import { useContract, NATIVE_TOKEN } from "../../hooks/useContract";
import { useFetchGroupOwner, useFetchTokenGroup, useFetchMetadata } from "../../hooks/useReadContract";
import { Spinner } from "@chakra-ui/react";
import styles from "../../styles/Home.module.css";
import { parseEther } from 'viem'
import { useAccount } from "wagmi";
import Navbar from "@/components/Navbar";

interface Attribute {
  trait_type: string;
  value: string;
  display_type?: string; // Optional, since it can be undefined
}

const SetMetadata = () => {
  const { address } = useAccount();
  const { setMetadata, updateMetadata, loading } = useContract();

  const router = useRouter();
  const [tokenId, setTokenId] = useState<number | null>(null);
  const { metadata: tokenMetadata, loading: tokenLoading, error, refetchMetadata } = useFetchMetadata(tokenId ?? 0);

  // ✅: if tokenId is not null set this up to updateMetadata on that specific token
  // ✅: this can create a new group with token's metadata or add to existing group

  // ✅ State for form inputs
  const [metadataInput, setMetadataInput] = useState({
    group: "",
    batchSize: 1,
    startingNumber: 1,
    groupURI: "",
    appendNumberToGroupURI: 0,
    groupURIext: "",
    appendNumber: false,
    appendNumberToImage: false,
    imageExtension: "",
    appendNumberToAnim: false,
    animExtension: "",
  });

  const [metadata, setMetadataStruct] = useState({
    name: "",
    description: "",
    externalUrl: "",
    image: "",
    animationUrl: "",
    youtubeUrl: "",
    backgroundColor: "",
    attributes: "",  // This will store the stringified attributes JSON
    creator: "",
    locked: false,
    price: "0",
  });

  // Read tokenId from query on mount
  useEffect(() => {
    if (router.isReady && router.query.tokenId) {
      const queryTokenId = parseInt(router.query.tokenId as string);
      if (!isNaN(queryTokenId)) {
        setTokenId(queryTokenId);
        setMetadataStruct({
          ...metadata,
          name: tokenMetadata?.name || "",
          description: tokenMetadata?.description || "",
          externalUrl: tokenMetadata?.externalUrl || "",
          image: tokenMetadata?.image || "",
          animationUrl: tokenMetadata?.animationUrl || "",
          youtubeUrl: tokenMetadata?.youtubeUrl || "",
          backgroundColor: tokenMetadata?.backgroundColor || "",
          attributes: tokenMetadata?.attributes || "",
          creator: tokenMetadata?.creator || "",
          locked: tokenMetadata?.locked || false,
          price: "0",
        });

        if (tokenMetadata?.animationUrl.length == 0 && tokenMetadata?.youtubeUrl.length == 0) {
          setMediaType("none");
        } else {
          if (tokenMetadata?.animationUrl.length != 0) {
            setMediaType("animation");
          } else {
            setMediaType("youtube");
          }
        }

        if (tokenMetadata?.attributes) {
          if (tokenMetadata?.attributes.includes("[object Object]") || tokenMetadata?.attributes.includes('"attributes":}')) {
            setAttributes([]);
            return;
          }
          try {
            const parsed = JSON.parse(tokenMetadata.attributes);
            if (Array.isArray(parsed)) {
              const formattedAttributes: Attribute[] = parsed.map((attr: any) => ({
                trait_type: attr.trait_type || "",
                value: attr.value?.toString() || "",
                display_type: attr.display_type || undefined,
              }));
              setAttributes(formattedAttributes);
            } else {
              setAttributes([{ trait_type: "", value: "", display_type: undefined }]);
              console.log(attributes);
            }
          } catch (err) {
            console.error("Failed to parse attributes JSON:", err);
          }
        } else {
          if (attributes.length > 0) {
            removeAttribute(attributes.length);
            setAttributes([]);
          }
          console.log(attributes);
        }
      }
    }
  }, [router.isReady, router.query.tokenId, tokenId]);

  console.log("Token ID has been set: ", tokenId);

  // ✅ State for attributes (define the type properly)
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // ✅ New state to track the selected media type
  const [mediaType, setMediaType] = useState<"none" | "animation" | "youtube">("none");

  // Display Type options
  const displayTypes = [
    { label: "Number", value: "number" },
    { label: "Boost Number", value: "boost_number" },
    { label: "Boost Percentage", value: "boost_percentage" },
    { label: "Date", value: "date" },
    { label: "Value Only", value: "value_only" }
  ];

  // ✅ Handle changes for the MetadataInput struct
  const handleMetadataInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? Number(value) : value;
    setMetadataInput((prev) => ({ ...prev, [name]: newValue }));
  };

  // ✅ Handle changes for the Metadata struct
  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let newValue: string | boolean = value; // Define as string or boolean

    if (name === "price") {
      newValue = value; // No change for price
    } else if (type === "checkbox") {
      // For checkboxes, we store the checked status as a string
      newValue = (e.target as HTMLInputElement).checked;
    } else if (name === "backgroundColor" && type === "color") {
      // Remove the '#' from the color value
      newValue = value.slice(1);
    }

    setMetadataStruct((prev) => ({ ...prev, [name]: newValue }));
  }

  const [groupName, setGroupName] = useState('');
  const [isGroupAvailable, setIsGroupAvailable] = useState<boolean | null>(null);
  const [ownedGroup, setIsOwned] = useState<boolean | null>(null);
  // Destructure the result from the useFetchGroupOwner hook
  const { groupOwner, loading_c, error_c } = useFetchGroupOwner(groupName);
  const { tokenGroup, refetch_h } = useFetchTokenGroup(tokenId ?? 0);

  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value);
    setIsGroupAvailable(null);
  };

  const handleCheckGroup = () => {
    // If the groupName is an address (starts with "0x")
    if (groupName.startsWith("0x")) {
      if (groupName.toLowerCase() === address?.toLowerCase()) {
        setIsGroupAvailable(true);
        setIsOwned(true);
        setMetadataInput((prev) => ({
          ...prev,
          group: groupName,
        }));
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
      setMetadataInput((prev) => ({
        ...prev,
        group: groupName  // ✅ Set to true/false
      }));
    } else if (groupOwner === address) {  // Compare groupOwner with the user's address
      setIsGroupAvailable(true);
      setIsOwned(true);
      setMetadataInput((prev) => ({
        ...prev,
        group: groupName  // ✅ Set to true/false
      }));
    } else {
      setIsGroupAvailable(false);
      setIsOwned(false);
    }
  };

  const [isOnChain, setIsOnChain] = useState<boolean>(true);

  const handleToggleOnChain = () => {
    setIsOnChain((prevState) => !prevState);
  };

  const [removeMetadata, setRemoveMetadata] = useState<boolean>(false);

  const handleToggleRemoveMetadata = () => {
    setRemoveMetadata((prevState) => !prevState);
  };

  // Handles file selection and conversion to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Get the selected file
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file); // Convert to base64
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setMetadataStruct({ ...metadata, image: reader.result }); // Update metadata with base64 image
      }
    };
  };

  const [imageMode, setImageMode] = useState<"manual" | "upload">("manual");
  const handleImageMode = (mode: string) => {
    setMetadataStruct((prev) => ({ ...prev, image: '' }));
    if (mode === "upload") {
      setMetadataInput((prev) => ({ ...prev, appendNumberToImage: false, imageExtension: "" }));
      setImageMode("upload");
    } else {
      setImageMode("manual");
    }
  };

  {/* Determine Final Image Source */ }
  const getFinalImageSrc = () => {
    let finalImage = metadata.image;

    if (imageMode === "manual") {
      if (!finalImage) {
        return "/path-to-placeholder-image.png"; // Provide a valid placeholder image path
      }

      if (finalImage.startsWith("ipfs://")) {
        finalImage = finalImage.replace("ipfs://", "https://ipfs.io/ipfs/");
      }

      // Append number if the option is enabled
      if (metadataInput.appendNumberToImage) {
        finalImage += metadataInput.startingNumber || "";
      }

      // Append image extension if provided
      if (metadataInput.imageExtension) {
        finalImage += metadataInput.imageExtension;
      }
    }

    return finalImage || "https://dummyimage.com/300x300/ccc/000.png&text=No+Image"; // Default if the image is empty
  };

  // Function to remove the background color
  const handleRemoveBackgroundColor = () => {
    setMetadataStruct((prev) => ({ ...prev, backgroundColor: '' }));
  };

  const handleAttributeChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedAttributes = [...attributes];

    if (name === "value" && updatedAttributes[index].display_type === "date") {
      // Convert date to Unix timestamp immediately
      const date = new Date(value);
      const unixTimestamp = Math.floor(date.getTime() / 1000);
      updatedAttributes[index].value = unixTimestamp.toString();
    } else if (name === "display_type" && value === "value_only") {
      // Auto-clear trait_type for "value_only"
      updatedAttributes[index] = {
        ...updatedAttributes[index],
        trait_type: "",
        display_type: value,
      };
    } else {
      updatedAttributes[index] = {
        ...updatedAttributes[index],
        [name]: value,
      };
    }

    setAttributes(updatedAttributes);
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: "", value: "", display_type: undefined }]);
  };

  const removeAttribute = (index: number) => {
    const updatedAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(updatedAttributes);
  };

  // ✅ Use `useEffect` to update state when attributes change
  useEffect(() => {
    setMetadataStruct((prev) => ({
      ...prev,
      attributes: JSON.stringify(attributes.map(attribute => {
        if (attribute.display_type === "value_only") {
          return { value: attribute.value };
        }

        const isNumericType = ["number", "boost_number", "boost_percentage", "date"].includes(attribute.display_type || "");

        return {
          trait_type: attribute.trait_type,
          value: isNumericType ? Number(attribute.value) : attribute.value,
          ...(attribute.display_type ? { display_type: attribute.display_type } : {})
        };
      }))
    }));
  }, [attributes]);

  const buildMetadataArray = useCallback(() => {
    const updatedAttributes = attributes.map(attribute => {
      if (attribute.display_type === "value_only") {
        return { value: attribute.value }; // ✅ Omit trait_type and display_type for "value_only"
      }

      const isNumericType = ["number", "boost_number", "boost_percentage", "date"].includes(attribute.display_type || "");

      return {
        trait_type: attribute.trait_type,
        value: isNumericType ? Number(attribute.value) : attribute.value,  // ✅ Convert numbers properly
        ...(attribute.display_type ? { display_type: attribute.display_type } : {})
      };
    });

    //console.log("Updated Attributes:", JSON.stringify(updatedAttributes)); // ✅ Logs correct attributes

    // Explicitly type jsonArray
    const jsonArray: [
      string,
      number,
      number,
      string,
      number,
      string,
      (string | number | boolean)[],
      boolean,
      boolean,
      string,
      boolean,
      string
    ] = [
        metadataInput.group,
        metadataInput.batchSize,
        metadataInput.startingNumber,
        metadataInput.groupURI,
        metadataInput.appendNumberToGroupURI,
        metadataInput.groupURIext,
        [
          metadata.name,
          metadata.description,
          metadata.externalUrl,
          metadata.image,
          metadata.animationUrl,
          metadata.youtubeUrl,
          metadata.backgroundColor,
          JSON.stringify(updatedAttributes), // ✅ Stringified attributes stored correctly
          metadata.creator,
          String(metadata.locked), // Convert boolean locked to string
          parseEther(metadata.price).toString()
        ],
        metadataInput.appendNumber,
        metadataInput.appendNumberToImage,
        metadataInput.imageExtension,
        metadataInput.appendNumberToAnim,
        metadataInput.animExtension
      ];

    return tokenId === null ? jsonArray : jsonArray[6];
  }, [attributes, metadata, metadataInput]);

  // ✅ Handle submit
  const handleSubmit = async () => {
    const jsonArray = buildMetadataArray() as any;

    // Explicitly extract attributes as string
    const attributesString = (tokenId === null ? jsonArray[6][7] as string : jsonArray[7] as string);

    // console.log("Metadata Attributes (Before Sending):", attributesString);
    // console.log(jsonArray);

    try {
      if (tokenId === null) {
        await setMetadata(
          jsonArray[0] as string,
          jsonArray[1] as number,
          jsonArray[2] as number,
          jsonArray[3] as string,
          jsonArray[4] as number,
          jsonArray[5] as string,
          { ...metadata, attributes: attributesString }, // Correctly formatted attributes
          jsonArray[7] as boolean,
          jsonArray[8] as boolean,
          jsonArray[9] as string,
          jsonArray[10] as boolean,
          jsonArray[11] as string,
        );
      } else {
        //setMetadataStruct((prev) => ({ ...prev, creator: address as string, locked: false}));
        //console.log(metadata);
        await updateMetadata(
          tokenId,
          removeMetadata,
          { ...metadata, attributes: attributesString, creator: address as string, locked: false }, // Correctly formatted attributes
          async () => {
            console.log("Updated Token Metadata");
          }
        );
      }
    } catch (error) {
      console.error("Failed to fetch token group:", error);
    }

  };

  // State to manage dropdown visibility
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Function to toggle the visibility
  const toggleDropdown = () => {
    setIsDropdownVisible((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>Set Metadata</h1>

        {/* ✅ MetadataInput Fields */}
        {tokenId === null ? (
          <div className={styles.form}>
            <h2><strong>Group Details</strong></h2>

            <div>
              <label className={styles.label}>
                Group:
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
            </div>

            <label className={styles.label}>
              Batch Size:
              <input className={styles.input} type="number" name="batchSize" value={metadataInput.batchSize} min={1} onChange={handleMetadataInputChange} />
            </label>

            <label className={styles.label}>
              Starting Number:
              <input className={styles.input} type="number" name="startingNumber" value={metadataInput.startingNumber} onChange={handleMetadataInputChange} />
            </label>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={isOnChain}
                  onChange={handleToggleOnChain}
                />
                <strong>: Toggle On-Chain / Off-Chain</strong>
              </label>
              <p>{isOnChain ? '⛓️ On-Chain' : '💾 Off-Chain'}</p>
            </div>

            {!isOnChain ? (
              <div>
                <label className={styles.label}>
                  Group URI:
                  <input className={styles.input} name="groupURI" value={metadataInput.groupURI} onChange={handleMetadataInputChange} />
                </label>

                <label className={styles.label}>
                  Append Number to Group URI:
                  <input
                    className={styles.input}
                    type="checkbox"
                    name="appendNumberToGroupURI"
                    checked={metadataInput.appendNumberToGroupURI === 1}  // ✅ Check if it equals 1
                    onChange={(e) =>
                      setMetadataInput((prev) => ({
                        ...prev,
                        appendNumberToGroupURI: e.target.checked ? 1 : 0  // ✅ Toggle between 1 and 0
                      }))
                    }
                  />
                </label>

                <label className={styles.label}>
                  Group URI Extension:
                  <input className={styles.input} name="groupURIext" value={metadataInput.groupURIext} onChange={handleMetadataInputChange} />
                </label>

                <label className={styles.label}>
                  Creator Address:
                  <input className={styles.input} name="creator" value={metadata.creator} onChange={handleMetadataChange} />
                </label>

                <label className={styles.label}>
                  Price ({NATIVE_TOKEN}):
                  <input
                    className={styles.input}
                    name="price"
                    value={metadata.price}
                    onChange={handleMetadataChange}
                    type="number"
                    step="any" // Allows for decimal/floating-point numbers
                    min="0"   // Prevents negative values
                  />
                </label>
              </div>
            ) : (
              <></>
            )}
          </div>
        ) : (
          <div>
            <h2><strong>Token ID: {tokenId}</strong></h2>
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
            <br></br>
            <label>
              <input
                type="checkbox"
                checked={removeMetadata}
                onChange={handleToggleRemoveMetadata}
              />
              <strong>: Remove Metadata</strong>
            </label>
            <p>{removeMetadata ? 'Remove Metadata' : 'Set Metadata'}</p>
          </div>
        )}
        <br></br>

        {isOnChain && !removeMetadata ? (
          <div>
            {/* ✅ Metadata Struct Fields */}
            <div className={styles.form}>
              <h2><strong>Metadata</strong></h2>

              <label className={styles.label}>
                Name:
                <input className={styles.input} name="name" value={metadata.name} onChange={handleMetadataChange} />
              </label>

              <label className={styles.label}>
                Append #Number to Name:
                <input
                  className={styles.input}
                  type="checkbox"
                  name="appendNumberToImage"
                  checked={metadataInput.appendNumber}  // ✅ Checked if true
                  onChange={(e) =>
                    setMetadataInput((prev) => ({
                      ...prev,
                      appendNumber: e.target.checked  // ✅ Set to true/false
                    }))
                  }
                />
              </label>

              <label className={styles.label}>
                Description:
                <input className={styles.input} name="description" value={metadata.description} onChange={handleMetadataChange} />
              </label>

              <label className={styles.label}>
                External URL:
                <input className={styles.input} name="externalUrl" value={metadata.externalUrl} onChange={handleMetadataChange} />
              </label>

              {/* Image Selection Mode */}
              <div className={styles.radioGroup}>
                <label>
                  <input
                    type="radio"
                    name="imageMode"
                    value="manual"
                    checked={imageMode === "manual"}
                    onChange={() => handleImageMode("manual")}
                  />
                  Enter Image URI
                </label>
                <br></br>
                <label>
                  <input
                    type="radio"
                    name="imageMode"
                    value="upload"
                    checked={imageMode === "upload"}
                    onChange={() => handleImageMode("upload")}
                  />
                  Upload Image
                </label>
              </div>

              {/* Conditional Rendering Based on Selection */}
              {imageMode === "manual" ? (
                <>
                  {/* Manual Image URL Entry */}
                  <label className={styles.label}>
                    Image URI:
                    <input
                      className={styles.input}
                      name="image"
                      value={metadata.image}
                      onChange={handleMetadataChange}
                      placeholder="Image Path"
                    />
                  </label>

                  {/* Options only for Manual Input */}
                  <label className={styles.label}>
                    Append Number to Image:
                    <input
                      className={styles.input}
                      type="checkbox"
                      name="appendNumberToImage"
                      checked={metadataInput.appendNumberToImage}
                      onChange={(e) =>
                        setMetadataInput((prev) => ({
                          ...prev,
                          appendNumberToImage: e.target.checked
                        }))
                      }
                    />
                  </label>

                  <label className={styles.label}>
                    Image Extension:
                    <input
                      className={styles.input}
                      name="imageExtension"
                      value={metadataInput.imageExtension}
                      onChange={handleMetadataInputChange}
                    />
                  </label>
                </>
              ) : (
                // File Upload
                <label className={styles.label}>
                  Upload Image:
                  <input
                    className={styles.fileInput}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              )}

              {/* Preview Image if Available */}
              {metadata.image && (
                <div>
                  <p>Image Preview:</p>
                  <div
                    className={styles.previewContainer}
                    style={{ backgroundColor: metadata.backgroundColor ? `#${metadata.backgroundColor}` : "transparent" }}
                  >
                    <img
                      src={getFinalImageSrc()}
                      alt="Preview"
                      className={styles.imagePreview}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://dummyimage.com/300x300/${metadata.backgroundColor}/000.png&text=No+Image+Found`;
                      }}
                    />
                  </div>
                </div>
              )}

              <label className={styles.label}>
                Background Color:
                <p>{metadata.backgroundColor && `#${metadata.backgroundColor}`}</p>

                <input
                  className={styles.inputColor}
                  type="color"
                  name="backgroundColor"
                  value={metadata.backgroundColor && `#${metadata.backgroundColor}` || '#000000'}
                  onChange={handleMetadataChange}
                />
              </label>
              {/* Only show the remove button if backgroundColor is set */}
              {metadata.backgroundColor && (
                <button className={styles.attributesButton} type="button" onClick={handleRemoveBackgroundColor}>
                  ⊖ Remove BG Color
                </button>
              )}

              <div className={styles.radioGroup}>
                {/* ✅ Animation URL Option */}
                <label>
                  <input
                    type="radio"
                    name="mediaOption"
                    value="animation"
                    checked={mediaType === "animation"}
                    onChange={() => {
                      setMediaType("animation");
                      setMetadataStruct((prev) => ({
                        ...prev,
                        animationUrl: prev.animationUrl || "",   // Preserve animation URL
                        youtubeUrl: ""                         // Clear YouTube URL
                      }));
                    }}
                  />
                  Animation URL
                </label>
                <br></br>

                {/* ✅ YouTube URL Option */}
                <label>
                  <input
                    type="radio"
                    name="mediaOption"
                    value="youtube"
                    checked={mediaType === "youtube"}
                    onChange={() => {
                      setMediaType("youtube");
                      setMetadataStruct((prev) => ({
                        ...prev,
                        animationUrl: "",                      // Clear Animation URL
                        youtubeUrl: prev.youtubeUrl || ""      // Preserve YouTube URL
                      }));
                      // ✅ Clear animation settings
                      setMetadataInput((prev) => ({
                        ...prev,
                        appendNumberToAnim: false,
                        animExtension: ""
                      }));
                    }}
                  />
                  YouTube URL
                </label>
                <br></br>

                {/* ✅ None Option */}
                <label>
                  <input
                    type="radio"
                    name="mediaOption"
                    value="none"
                    checked={mediaType === "none"}
                    onChange={() => {
                      setMediaType("none");
                      setMetadataStruct((prev) => ({
                        ...prev,
                        animationUrl: "",
                        youtubeUrl: ""
                      }));
                      // ✅ Clear animation settings
                      setMetadataInput((prev) => ({
                        ...prev,
                        appendNumberToAnim: false,
                        animExtension: ""
                      }));
                    }}
                  />
                  Neither
                </label>
                <br></br>
              </div>

              {/* ✅ Conditionally render the corresponding input field */}
              {mediaType === "animation" && (
                <div className={styles.animationSection}>
                  {/* ✅ Animation URL */}
                  <label className={styles.label}>
                    Animation URL:
                    <input
                      className={styles.input}
                      name="animationUrl"
                      value={metadata.animationUrl}
                      onChange={(e) =>
                        setMetadataStruct((prev) => ({
                          ...prev,
                          animationUrl: e.target.value
                        }))
                      }
                    />
                  </label>

                  {/* ✅ Checkbox for appendNumberToAnim */}
                  <label className={styles.label}>
                    Append Number to Animation:
                    <input
                      type="checkbox"
                      checked={metadataInput.appendNumberToAnim}
                      onChange={(e) =>
                        setMetadataInput((prev) => ({
                          ...prev,
                          appendNumberToAnim: e.target.checked
                        }))
                      }
                    />
                  </label>

                  {/* ✅ Input field for animExtension */}
                  <label className={styles.label}>
                    Animation Extension:
                    <input
                      className={styles.input}
                      name="animExtension"
                      value={metadataInput.animExtension}
                      onChange={(e) =>
                        setMetadataInput((prev) => ({
                          ...prev,
                          animExtension: e.target.value
                        }))
                      }
                    />
                  </label>
                </div>
              )}

              {mediaType === "youtube" && (
                <label className={styles.label}>
                  YouTube URL:
                  <input
                    className={styles.input}
                    name="youtubeUrl"
                    value={metadata.youtubeUrl}
                    onChange={(e) =>
                      setMetadataStruct((prev) => ({
                        ...prev,
                        youtubeUrl: e.target.value
                      }))
                    }
                  />
                </label>
              )}

              <strong><h2>Attributes:</h2></strong>
              {/* ✅ Add Attribute Section */}
              <div className={styles.attributesContainer}>
                {/* Render input fields for each attribute */}
                <div className={styles.attributesContainer}>
                  {attributes.map((attribute, index) => (
                    <div key={index} className={styles.attributeItem}>

                      {/* ✅ Trait Type */}
                      <label className={styles.attributeItemLabel}>
                        Trait Type:
                        <input
                          className={styles.attributeItemInput}
                          name="trait_type"
                          value={attribute.trait_type}
                          onChange={(e) => handleAttributeChange(index, e)}
                          disabled={attribute.display_type === "value_only"} // Disable when "value_only"
                        />
                      </label>
                      <br></br>

                      {/* ✅ Value with Date Conversion */}
                      <label className={styles.attributeItemLabel}>
                        Value:
                        {attribute.display_type === "date" ? (
                          <input
                            type="date"
                            name="value"
                            value={
                              attribute.value
                                ? new Date(parseInt(attribute.value) * 1000).toISOString().split("T")[0] // Convert to yyyy-MM-dd format
                                : ""
                            }
                            onChange={(e) => handleAttributeChange(index, e)}
                          />
                        ) : (
                          <input
                            className={styles.attributeItemInput}
                            name="value"
                            value={attribute.value}
                            onChange={(e) => handleAttributeChange(index, e)}
                          />
                        )}
                      </label>
                      <br></br>

                      {/* ✅ Display Type */}
                      <label className={styles.attributeItemLabel}>
                        Display Type:
                        <select
                          name="display_type"
                          value={attribute.display_type || ""}
                          onChange={(e) => handleAttributeChange(index, e)}
                        >
                          <option value="">Select</option>
                          {displayTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      {/* ✅ Remove Button */}
                      <button className={styles.attributesRemoveButton} onClick={() => removeAttribute(index)}>
                        ⊖ Remove
                      </button>
                    </div>
                  ))}
                </div>
                <br></br>
                {/* Add button to add more attributes */}
                <button className={styles.attributesButton} onClick={addAttribute}>⊕ Add Attribute</button>
              </div>

              {tokenId === null ? (
                <label className={styles.label}>
                  Locked:
                  <input
                    type="checkbox"
                    name="locked"
                    checked={metadata.locked === true} // Ensure it's a boolean
                    onChange={handleMetadataChange}
                  />
                </label>
              ) : (
                <></>
              )}

            </div>
            <br></br>

            {tokenId === null ? (
              <div>
                <label className={styles.label}>
                  Creator Address:
                  <input className={styles.input} name="creator" value={metadata.creator} onChange={handleMetadataChange} />
                </label>

                <label className={styles.label}>
                  Price ({NATIVE_TOKEN}):
                  <input
                    className={styles.input}
                    name="price"
                    value={metadata.price}
                    onChange={handleMetadataChange}
                    type="number"
                    step="any" // Allows for decimal/floating-point numbers
                    min="0"   // Prevents negative values
                  />
                </label>
              </div>
            ) : (
              <></>
            )}

            <br></br>
          </div>
        ) : (
          <></>
        )}

        {/* ✅ JSON Preview */}
        <div>
          <button onClick={toggleDropdown} className={styles.toggleButton}>
            {isDropdownVisible ? 'Hide {JSON}' : '{JSON}'}
          </button>

          {isDropdownVisible && (
            <div className={styles.form}>
              <h2>JSON Preview</h2>
              <pre className={styles.jsonPreview}>
                {JSON.stringify(buildMetadataArray(), null, 2)}
              </pre>
            </div>
          )}
        </div>

        <button className={styles.button} onClick={handleSubmit} disabled={loading || (tokenId === null && !isGroupAvailable)}>
          {loading ? <Spinner size="sm" color="white" /> : "Set Metadata"}
        </button>
      </main>
    </div>
  );
};

export default SetMetadata;
