// import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';

const ERC20_ABI = [
  { name: 'name', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { name: 'symbol', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { name: 'totalSupply', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'decimals', type: 'function', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
];

const TokenDetails = () => {
  const { tokenAddress } = useParams();
  const publicClient = usePublicClient();

  const [tokenInfo, setTokenInfo] = useState({
    name: '',
    symbol: '',
    supply: '',
    decimals: 18,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const [name, symbol, totalSupply, decimals] = await Promise.all([
          publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'name' }),
          publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'symbol' }),
          publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'totalSupply' }),
          publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals' }),
        ]);

        setTokenInfo({
          name,
          symbol,
          supply: formatEther(totalSupply),
          decimals,
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching token:', error);
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [publicClient, tokenAddress]);

  const addToMetaMask = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals,
            image: 'https://via.placeholder.com/32',
          },
        },
      });
    } catch (err) {
      console.error('Error adding to MetaMask:', err);
    }
  };

  if (loading) return <p className="text-gray-600 mt-4">Loading token information...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 border rounded-lg bg-white shadow">
      <h2 className="text-2xl font-bold mb-4">Token Details</h2>

      <div className="space-y-2">
        <div><strong>🪪 Name:</strong> {tokenInfo.name}</div>
        <div><strong>💱 Symbol:</strong> {tokenInfo.symbol}</div>
        <div><strong>🧮 Total supply:</strong> {tokenInfo.supply}</div>
        <div className="break-all"><strong>📜 Address:</strong> {tokenAddress}</div>
      </div>

      <button
        onClick={addToMetaMask}
        className="mt-6 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
      >
        ➕ Add to MetaMask
      </button>
    </div>
  );
};

export default TokenDetails;
