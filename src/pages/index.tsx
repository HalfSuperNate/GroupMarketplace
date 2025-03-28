import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Link from 'next/link';

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Group Marketplace</title>
        <meta content="Group Marketplace DApp" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <main className={styles.main}>
        <ConnectButton label="Connect" accountStatus="address" chainStatus="none" showBalance={false} />

        <h1 className={styles.title}>
          Welcome to <a href="https://www.rainbowkit.com" target="_blank">Group Marketplace</a>
        </h1>

        <p className={styles.description}>
          Create, browse, buy, sell, and manage NFTs
        </p>

        <div className={styles.grid}>
          <Link href="/actions/SetMetadata" legacyBehavior>
            <a target="_blank" rel="noopener noreferrer" className={styles.card}>
              <h2>Set Metadata &rarr;</h2>
              <p>Create metadata for your NFT group.</p>
            </a>
          </Link>

          <Link href="/actions/MintToken" legacyBehavior>
            <a target="_blank" rel="noopener noreferrer" className={styles.card}>
              <h2>Mint Token &rarr;</h2>
              <p>Mint a new token with metadata.</p>
            </a>
          </Link>

          <Link href="/actions/BuyToken" legacyBehavior>
            <a target="_blank" rel="noopener noreferrer" className={styles.card}>
              <h2>Buy Token &rarr;</h2>
              <p>Purchase an NFT listed for sale.</p>
            </a>
          </Link>

          <Link href="/actions/CancelListing" legacyBehavior>
            <a target="_blank" rel="noopener noreferrer" className={styles.card}>
              <h2>Cancel Listing &rarr;</h2>
              <p>Cancel an existing NFT listing.</p>
            </a>
          </Link>

          <Link href="/actions/MoveToken" legacyBehavior>
            <a target="_blank" rel="noopener noreferrer" className={styles.card}>
              <h2>Move Token &rarr;</h2>
              <p>Move a token to a different group.</p>
            </a>
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <a href="https://rainbow.me" rel="noopener noreferrer" target="_blank">
          Made with ❤️ by your frens at 🌈
        </a>
      </footer>
    </div>
  );
};

export default Home;
