"use client";

import { useState } from "react";
import { useContract, NATIVE_TOKEN } from "../../hooks/useContract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Spinner } from "@chakra-ui/react";
import styles from "../../styles/Home.module.css";

const SetMetadata = () => {
  const { setMetadata, loading } = useContract();

  // ✅ State for form inputs
  const [metadataInput, setMetadataInput] = useState({
    group: "",
    batchSize: 1,
    startingNumber: 1,
    groupURI: "",
    appendNumberToGroupURI: 0,
    groupURIext: "",
    appendNumber: true,
    appendNumberToImage: true,
    imageExtension: ".png",
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
    attributes: "",
    creator: "",
    locked: false,
    price: "0",
  });

  // ✅ Handle changes for the MetadataInput struct
  const handleMetadataInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? Number(value) : value;
    setMetadataInput((prev) => ({ ...prev, [name]: newValue }));
  };

  // ✅ Handle changes for the Metadata struct
  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = name === "price" ? value : type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setMetadataStruct((prev) => ({ ...prev, [name]: newValue }));
  };

  // ✅ Build the final JSON array
  const buildMetadataArray = () => {
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
        metadata.attributes,
        metadata.creator,
        metadata.locked,
        metadata.price
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
          <h2>Metadata Input</h2>

          <label className={styles.label}>
            Group:
            <input className={styles.input} name="group" value={metadataInput.group} onChange={handleMetadataInputChange} />
          </label>

          <label className={styles.label}>
            Batch Size:
            <input className={styles.input} type="number" name="batchSize" value={metadataInput.batchSize} onChange={handleMetadataInputChange} />
          </label>

          <label className={styles.label}>
            Starting Number:
            <input className={styles.input} type="number" name="startingNumber" value={metadataInput.startingNumber} onChange={handleMetadataInputChange} />
          </label>

          <label className={styles.label}>
            Group URI:
            <input className={styles.input} name="groupURI" value={metadataInput.groupURI} onChange={handleMetadataInputChange} />
          </label>

          <label className={styles.label}>
            Append Number to Group URI (0/1):
            <input className={styles.input} type="number" name="appendNumberToGroupURI" value={metadataInput.appendNumberToGroupURI} onChange={handleMetadataInputChange} />
          </label>

          <label className={styles.label}>
            Group URI Extension:
            <input className={styles.input} name="groupURIext" value={metadataInput.groupURIext} onChange={handleMetadataInputChange} />
          </label>

          <label className={styles.label}>
            Image Extension:
            <input className={styles.input} name="imageExtension" value={metadataInput.imageExtension} onChange={handleMetadataInputChange} />
          </label>
        </div>

        {/* ✅ Metadata Struct Fields */}
        <div className={styles.form}>
          <h2>Metadata Struct</h2>

          <label className={styles.label}>
            Name:
            <input className={styles.input} name="name" value={metadata.name} onChange={handleMetadataChange} />
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
            Background Color:
            <input className={styles.input} name="backgroundColor" value={metadata.backgroundColor} onChange={handleMetadataChange} />
          </label>

          <label className={styles.label}>
            Attributes:
            <input className={styles.input} name="attributes" value={metadata.attributes} onChange={handleMetadataChange} />
          </label>

          <label className={styles.label}>
            Creator Address:
            <input className={styles.input} name="creator" value={metadata.creator} onChange={handleMetadataChange} />
          </label>

          <label className={styles.label}>
            Price ({NATIVE_TOKEN}):
            <input className={styles.input} name="price" value={metadata.price} onChange={handleMetadataChange} />
          </label>

          <label className={styles.label}>
            Locked:
            <input type="checkbox" name="locked" checked={metadata.locked} onChange={handleMetadataChange} />
          </label>
        </div>

        {/* ✅ JSON Preview */}
        <div className={styles.form}>
          <h2>JSON Preview</h2>
          <pre>{JSON.stringify(buildMetadataArray(), null, 2)}</pre>
        </div>

        <button className={styles.button} onClick={handleSubmit} disabled={loading}>
          {loading ? <Spinner size="sm" color="white" /> : "Set Metadata"}
        </button>
      </main>
    </div>
  );
};

export default SetMetadata;
