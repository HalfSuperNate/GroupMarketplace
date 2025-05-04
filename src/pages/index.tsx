// import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import Navbar from "@/components/Navbar";

//🔳 TO DO: set up storage option link page with details of each option.

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Navbar />
      <Head>
        <title>Group Marketplace</title>
        <meta content="Group Marketplace DApp" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <main className={styles.main}>
        {/* <ConnectButton label="Connect" accountStatus="address" chainStatus="none" showBalance={false} /> */}

        <h1 className={styles.title}>
          Welcome to <a href="https://amoy.polygonscan.com/address/0x0100a530469db0dd44c9af210a465883668c7797" target="_blank">Group Marketplace</a>
        </h1>

        <p className={styles.description}>
          Create, browse, buy, sell, and manage NFTs
          <br></br>on<br></br>
          Group Marketplace
        </p>

        <div className={styles.grid}>
          <Link href="/actions/SetMetadata" legacyBehavior>
            <a className={styles.card}>
              <h2>Create &rarr;</h2>
              <p>Setup new tokens for your group or make a new group.</p>
            </a>
          </Link>

          <Link href="/actions/Token?tokenId=0" legacyBehavior>
            <a className={styles.card}>
              <h2>Token Actions &rarr;</h2>
              <p>Mint, Buy, View Details & More for created tokens.</p>
            </a>
          </Link>

          <Link href="/groups/" legacyBehavior>
            <a className={styles.card}>
              <h2>Browse &rarr;</h2>
              <p>Take a look at what&apos;s on Group Market. 👁️〰️👁️</p>
            </a>
          </Link>

          <Link href="/actions/Storage" legacyBehavior>
            <a className={styles.card}>
              <h2>Storage &rarr;</h2>
              <p>Data storage is necessary for all NFT projects. Take a look at some options.</p>
            </a>
          </Link>

        </div>
      </main>

      <footer className={styles.footer}>
        <a href="https://n8kportfolio.vercel.app/" rel="noopener noreferrer" target="_blank">
          Made with ❤️ 🐸
        </a>
      </footer>
    </div>
  );
};

export default Home;
