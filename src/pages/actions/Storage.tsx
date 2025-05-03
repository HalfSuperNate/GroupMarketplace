import React from "react";
import Link from "next/link";
import styles from "../../styles/Home.module.css";
import Navbar from "@/components/Navbar";

const Storage = () => {
  return (
    <div className={styles.storageContainer}>
      <Navbar />
      <div className={styles.storageContent}>
        <h1 className={styles.storageHeading}>🔐 NFT Storage:<br></br> Decentralized Options Overview</h1>

        <p className={styles.storageParagraph}>
          When storing NFTs, it's crucial to ensure both metadata and media are securely and permanently accessible. The following are
          popular decentralized storage solutions based on the article{" "}
          <a
            href="https://metaversal.banklesshq.com/p/nft-storage"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.storageLink}
          >
            "NFT Storage: Comparing IPFS, Filecoin, and Arweave" by William M. Peaster
          </a>.
        </p>

        <section className={styles.storageSection}>
          <h2 className={styles.storageSubheading}>1. IPFS (InterPlanetary File System)</h2>
          <p className={styles.storageParagraph}>
            IPFS is a peer-to-peer distributed file system using content-addressing to identify and secure data.
          </p>
          <ul className={styles.storageList}>
            <li>Decentralized & content-addressed</li>
            <li>Requires pinning to ensure persistence</li>
            <li>
              Pinning services:
              <ul className={styles.storageListNested}>
                <li>
                  <Link href="https://pinata.cloud" target="_blank" className={styles.storageLink}>
                    Pinata
                  </Link>
                </li>
                <li>
                  <Link href="https://nft.storage" target="_blank" className={styles.storageLink}>
                    NFT.Storage
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <section className={styles.storageSection}>
          <h2 className={styles.storageSubheading}>2. Filecoin</h2>
          <p className={styles.storageParagraph}>
            Filecoin is a decentralized storage network with incentives for long-term storage, often used with IPFS.
          </p>
          <ul className={styles.storageList}>
            <li>Incentivized storage via storage deals</li>
            <li>Integrated with IPFS retrieval mechanisms</li>
            <li>Backs services like NFT.Storage</li>
          </ul>
        </section>

        <section className={styles.storageSection}>
          <h2 className={styles.storageSubheading}>3. Arweave</h2>
          <p className={styles.storageParagraph}>
            Arweave offers permanent, blockchain-based storage with a one-time payment model.
          </p>
          <ul className={styles.storageList}>
            <li>Immutable & permanent once uploaded</li>
            <li>Powered by the Permaweb</li>
            <li>
              Learn more:
              <Link href="https://www.arweave.org" target="_blank" className={styles.storageLink}>
                Arweave.org
              </Link>
            </li>
          </ul>
        </section>

        <section className={styles.storageSection}>
            <h2 className={styles.storageSubheading}>4. Filebase</h2>
            <p className={styles.storageParagraph}>
                Filebase is a Web3-compatible cloud storage provider that offers an easy-to-use interface for uploading files to decentralized networks like IPFS, Sia, and Storj.
            </p>
            <ul className={styles.storageList}>
                <li>Bridges Web2 cloud UX with Web3 decentralized networks</li>
                <li>Supports pinning to IPFS with S3-compatible APIs</li>
                <li>Good for developers seeking hybrid or transitionary storage solutions</li>
                <li>
                Explore more:
                <Link href="https://filebase.com" target="_blank" className={styles.storageLink}>
                    Filebase.com
                </Link>
                </li>
            </ul>
        </section>


        <section className={styles.storageSection}>
          <h2 className={styles.storageSubheading}>🧭 Choosing the Right Solution</h2>
          <ul className={styles.storageList}>
            <li>Use Arweave for long-term permanence</li>
            <li>Use IPFS + Pinata for flexible updates</li>
            <li>Use NFT.Storage (one time fee per gig), developer-friendly access</li>
            <li>Use Filebase for cloud-like UX with decentralized backend</li>
          </ul>
        </section>

        <p className={styles.storageCitation}>
            Source: <em>"NFT Storage: Comparing IPFS, Filecoin, and Arweave"</em> by William M. Peaster, published via{" "}
            <a
                href="https://metaversal.banklesshq.com/p/nft-storage"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.storageLink}
            >
                Metaversal by BanklessHQ
            </a>. <br></br>
            Filebase details were added separately.
        </p>
      </div>
    </div>
  );
};

export default Storage;
