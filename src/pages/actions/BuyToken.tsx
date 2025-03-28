import { useState } from 'react';
import { useContract, NATIVE_TOKEN } from '../../hooks/useContract';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const BuyToken = () => {
    const { buyToken, loading } = useContract();
    const [tokenId, setTokenId] = useState<number>(0);
    const [price, setPrice] = useState<string>("0");
  
    const handleBuy = async () => {
      if (!tokenId || !price) return;
      await buyToken(tokenId, price);
    };
  
    return (
      <div style={{ padding: '20px' }}>
        <h1>Buy Token</h1>
        <ConnectButton label="Connect Wallet" accountStatus="address" chainStatus="none" />
        <div style={{ margin: '20px 0' }}>
          <label>Token ID: </label>
          <input
            type="number"
            value={tokenId}
            onChange={(e) => setTokenId(Number(e.target.value))}
          />
        </div>
  
        <div style={{ margin: '20px 0' }}>
          <label>Price ({NATIVE_TOKEN}): </label>
          {/* Read Contract to setPrice(e.target.value) and display price here */}
        </div>
  
        <button onClick={handleBuy} disabled={loading} style={{ cursor: 'pointer' }}>
          {loading ? "Buying..." : "Buy Token"}
        </button>
      </div>
    );
  };
  
  export default BuyToken;
  