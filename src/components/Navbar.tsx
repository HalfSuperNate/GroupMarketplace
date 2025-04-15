import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESS, CHAIN_SCANNER } from '@/hooks/useReadContract';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      router.push(`/groups/`);
      return;
    }
  
    try {
      const res = await fetch(`/api/groupExists?name=${query}`);
      const data = await res.json();
  
      if (data.exists) {
        router.push(`/groups/${query}`);
      } else {
        router.push(`/contract/${query}`);
      }
    } catch (err) {
      console.error('Search failed', err);
    }
  
    setSearchQuery('');
  };

  return (
    <nav className={styles.nav}>
      <ul className={styles.navList}>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/actions/SetMetadata">Create</Link></li>
        <li><Link href="/actions/Token?tokenId=0">Search Token</Link></li>
        <li>
          <Link
            href={`${CHAIN_SCANNER}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contract
          </Link>
        </li>
        <li className={styles.searchWrapper}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search group or contract..."
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>⏎</button>
          </form>
        </li>
        <li className={styles.connectButtonWrapper}>
          <ConnectButton label="Connect" accountStatus="address" chainStatus="none" showBalance={false} />
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
