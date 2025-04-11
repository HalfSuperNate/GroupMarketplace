import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar = () => {
  const [searchGroup, setSearchGroup] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/groups/${searchGroup.trim()}`);
    setSearchGroup(''); // Optional: clear after search
  };

  return (
    <nav className={styles.nav}>
      <ul className={styles.navList}>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/actions/SetMetadata">Create</Link></li>
        <li><Link href="/actions/Token?tokenId=0">Search Token</Link></li>
        <li>
          <Link
            href="https://amoy.polygonscan.com/address/0x0100a530469db0dd44c9af210a465883668c7797"
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
              value={searchGroup}
              onChange={(e) => setSearchGroup(e.target.value)}
              placeholder="Search group..."
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
