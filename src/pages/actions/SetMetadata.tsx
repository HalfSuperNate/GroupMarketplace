"use client";

import { useState } from "react";
import { useContract, NATIVE_TOKEN } from "../../hooks/useContract";
import { useFetchGroupOwner } from "../../hooks/useReadContract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Spinner } from "@chakra-ui/react";
import styles from "../../styles/Home.module.css";
import { parseEther } from 'viem'
import { useAccount } from "wagmi";

interface Attribute {
  trait_type: string;
  value: string;
  display_type?: string; // Optional, since it can be undefined
}

const SetMetadata = () => {
  const { address } = useAccount();
  const { setMetadata, loading } = useContract();

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
      newValue = (e.target as HTMLInputElement).checked.toString();
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

  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value);
    setIsGroupAvailable(null);
  };

  const handleCheckGroup = () => {
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

  const [isOnChain, setIsOnChain] = useState<boolean>(false);

  const handleToggleOnChain = () => {
    setIsOnChain((prevState) => !prevState);
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

  // ✅ Build the final JSON array
  const buildMetadataArray = () => {
    const updatedAttributes = attributes.map(attribute => {
      if (attribute.display_type === "value_only") {
        // ✅ Omit trait_type and display_type for "value_only"
        return { value: attribute.value };
      }
  
      // ✅ Ensure no quotes around numeric values for specific display types
      const isNumericType = ["number", "boost_number", "boost_percentage", "date"].includes(attribute.display_type || "");
      
      return {
        trait_type: attribute.trait_type,
        value: isNumericType ? Number(attribute.value) : attribute.value,  // Convert to number if applicable
        ...(attribute.display_type ? { display_type: attribute.display_type } : {})
      };
    });
  
    const jsonArray = [
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
        JSON.stringify(updatedAttributes, (_, value) =>
          typeof value === 'number' ? value : value
        ),  // Use stringified attributes here
        metadata.creator,
        metadata.locked,
        parseEther(metadata.price).toString()
      ],
      metadataInput.appendNumber,
      metadataInput.appendNumberToImage,
      metadataInput.imageExtension,
      metadataInput.appendNumberToAnim,
      metadataInput.animExtension
    ];
  
    return jsonArray;
  };  

  // ✅ Handle submit
  const handleSubmit = async () => {
    const jsonArray = buildMetadataArray();

    // Prepare parameters for contract call
    await setMetadata(
      jsonArray[0] as string,                     // group
      jsonArray[1] as number,                     // batchSize
      jsonArray[2] as number,                     // startingNumber
      jsonArray[3] as string,                     // groupURI
      jsonArray[4] as number,                     // appendNumberToGroupURI
      jsonArray[5] as string,                     // groupURIext
      metadata,                                   // Metadata struct
      jsonArray[7] as boolean,                    // appendNumber
      jsonArray[8] as boolean,                    // appendNumberToImage
      jsonArray[9] as string,                     // imageExtension
      jsonArray[10] as boolean,                   // appendNumberToAnim
      jsonArray[11] as string,                    // animExtension
    );
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Set Metadata</h1>

        {/* ✅ Connect Button */}
        <div className={styles.connectButton}>
          <ConnectButton label="Connect Wallet" accountStatus="address" chainStatus="none" />
        </div>

        {/* ✅ MetadataInput Fields */}
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
              <p>❌ The group name is taken.</p>
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
            <input className={styles.input} type="number" name="batchSize" value={metadataInput.batchSize} onChange={handleMetadataInputChange} />
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
        <br></br>
        
        {isOnChain ? (
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

              <label className={styles.label}>
                Image URI:
                <input className={styles.input} name="image" value={metadata.image} onChange={handleMetadataChange} />
              </label>

              <label className={styles.label}>
                Append Number to Image:
                <input
                  className={styles.input}
                  type="checkbox"
                  name="appendNumberToImage"
                  checked={metadataInput.appendNumberToImage}  // ✅ Checked if true
                  onChange={(e) =>
                    setMetadataInput((prev) => ({
                      ...prev,
                      appendNumberToImage: e.target.checked  // ✅ Set to true/false
                    }))
                  }
                />
              </label>

              <label className={styles.label}>
                Image Extension:
                <input className={styles.input} name="imageExtension" value={metadataInput.imageExtension} onChange={handleMetadataInputChange} />
              </label>

              <label className={styles.label}>
                Background Color:
                <p>{metadata.backgroundColor && `#${metadata.backgroundColor}`}</p>
                
                <input
                  className={styles.inputColor}
                  type="color"
                  name="backgroundColor"
                  value={`#${metadata.backgroundColor}`}
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

              <label className={styles.label}>
                Locked:
                <input type="checkbox" name="locked" checked={metadata.locked} onChange={handleMetadataChange} />
              </label>
            </div>
            <br></br>

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
            <br></br>
          </div>
        ) : (
          <></>
        )}

        {/* ✅ JSON Preview */}
        <div className={styles.form}>
          <h2>JSON Preview</h2>
          <pre className={styles.jsonPreview}>{JSON.stringify(buildMetadataArray(), null, 2)}</pre>
        </div>

        <button className={styles.button} onClick={handleSubmit} disabled={loading}>
          {loading ? <Spinner size="sm" color="white" /> : "Set Metadata"}
        </button>
      </main>
    </div>
  );
};

export default SetMetadata;
