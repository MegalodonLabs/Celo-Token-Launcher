/* global BigInt */
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { handleAppError } from "../utils/errorHandler";
import qs from "qs";
import { readContract } from 'wagmi/actions';

// Short ABI for CustomToken (adjust as needed)
const CUSTOM_TOKEN_ABI = [
  { "inputs": [], "name": "name", "outputs": [{ "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "symbol", "outputs": [{ "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "totalSupply", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "decimals", "outputs": [{ "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{ "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "isMintable", "outputs": [{ "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "isBurnable", "outputs": [{ "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "paused", "outputs": [{ "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "isWhitelistEnabled", "outputs": [{ "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "whitelist", "outputs": [{ "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "blacklist", "outputs": [{ "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "bool", "name": "enabled", "type": "bool" }], "name": "setWhitelistEnabled", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "addToWhitelist", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "removeFromWhitelist", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "addToBlacklist", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "removeFromBlacklist", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "unpause", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  {
    "inputs": [],
    "name": "getWhitelist",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBlacklist",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function TokenDashboard() {
  const { address: tokenAddress } = useParams();
  const { address: userAddress } = useAccount();
  const location = useLocation();
  const [showCreatedMsg, setShowCreatedMsg] = useState(false);

  // States for token data
  const [tokenData, setTokenData] = useState({});
  const [loading, setLoading] = useState(true);
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");

  // STATES FOR LISTS
  const [whitelist, setWhitelist] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [whitelistSupported, setWhitelistSupported] = useState(true);
  const [blacklistSupported, setBlacklistSupported] = useState(true);

  // Read basic token data
  const { data: name } = useContractRead({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "name" });
  const { data: symbol } = useContractRead({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "symbol" });
  const { data: totalSupply } = useContractRead({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "totalSupply" });
  const { data: decimals } = useContractRead({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "decimals" });
  const { data: owner } = useContractRead({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "owner" });
  const { data: isMintable } = useContractRead({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "isMintable" });
  const { data: isBurnable } = useContractRead({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "isBurnable" });
  const { data: paused } = useContractRead({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "paused" });
  const { data: isWhitelistEnabled } = useContractRead({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "isWhitelistEnabled" });

  // Utility for Celoscan Alfajores
  const explorerUrl = tokenAddress
    ? `https://alfajores.celoscan.io/token/${tokenAddress}`
    : null;

  // New states for whitelist/blacklist/pause
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [blacklistAddress, setBlacklistAddress] = useState("");

  useEffect(() => {
    setTokenData({
      name: name || "-",
      symbol: symbol || "-",
      totalSupply: totalSupply || 0n,
      decimals: decimals || 18,
      owner: owner || "-",
      isMintable: !!isMintable,
      isBurnable: !!isBurnable,
    });
    setLoading(false);
    // Detect creation flag in query string
    const params = qs.parse(location.search, { ignoreQueryPrefix: true });
    if (params.created) {
      setShowCreatedMsg(true);
      // Remove the message after a few seconds
      setTimeout(() => setShowCreatedMsg(false), 7000);
    }
  }, [name, symbol, totalSupply, decimals, owner, isMintable, isBurnable, location.search]);

  // Helper to detect missing or reverted ABI function
  function isAbiFunctionMissing(err) {
    if (!err) return false;
    const msg = (err.message || '').toLowerCase();
    return (
      msg.includes('function selector was not recognized') ||
      msg.includes('is not a function') ||
      msg.includes('does not exist') ||
      msg.includes('execution reverted') ||
      msg.includes('reverted') ||
      (err.name && (
        err.name === 'ContractFunctionExecutionError' || 
        err.name === 'ContractFunctionRevertedError'
      ))
    );
  }

  // Function to fetch contract lists with detailed logs
  const fetchLists = async () => {
    if (!tokenAddress) return;
    setLoadingLists(true);
    
    // Whitelist
    try {
      const whitelistResult = await readContract({
        address: tokenAddress,
        abi: CUSTOM_TOKEN_ABI,
        functionName: "getWhitelist",
      });
      setWhitelistSupported(true);
      setWhitelist(whitelistResult);
    } catch (err) {
      setWhitelistSupported(false);
      setWhitelist([]);
      if (!isAbiFunctionMissing(err)) {
        toast.error("Error fetching contract whitelist.");
      }
    }
    
    // Blacklist
    try {
      const blacklistResult = await readContract({
        address: tokenAddress,
        abi: CUSTOM_TOKEN_ABI,
        functionName: "getBlacklist",
      });
      setBlacklistSupported(true);
      setBlacklist(blacklistResult);
    } catch (err) {
      setBlacklistSupported(false);
      setBlacklist([]);
      if (!isAbiFunctionMissing(err)) {
        toast.error("Error fetching contract blacklist.");
      }
    }
    
    setLoadingLists(false);
  };

  // Update lists on dashboard load and after changes
  useEffect(() => {
    fetchLists();
    // eslint-disable-next-line
  }, [tokenAddress]);

  // Update lists after add/remove
  const refreshListsAfter = async (fn) => {
    await fn();
    fetchLists();
  };

  // Toast helpers
  const showTxToast = (pendingMsg, successMsg, errorMsg, fn) => async (...args) => {
    let toastId = null;
    try {
      toastId = toast.info(pendingMsg, { autoClose: false, closeOnClick: false });
      const tx = await fn(...args);
      // If the function returns a transaction object (wagmi v1+), wait for confirmation
      if (tx?.hash && tx?.wait) {
        await tx.wait();
      }
      toast.update(toastId, { render: successMsg, type: "success", autoClose: 4000, isLoading: false });
      return tx;
    } catch (error) {
      // Special handling for user rejection in Metamask
      const isRejected = error?.message?.toLowerCase().includes("user rejected") || error?.message?.toLowerCase().includes("user denied");
      toast.update(toastId, {
        render: isRejected ? "Transaction cancelled by user." : errorMsg + (error?.message ? `: ${error.message}` : ""),
        type: "error",
        autoClose: 5000,
        isLoading: false
      });
      // Do not propagate error to avoid breaking the screen
      return;
    }
  };

  // Mint
  const { writeAsync: mintToken, isLoading: minting } = useContractWrite({
    address: tokenAddress,
    abi: CUSTOM_TOKEN_ABI,
    functionName: "mint",
    onError: (error) => handleAppError(error, "TokenDashboard: mint"),
  });

  // Burn
  const { writeAsync: burnToken, isLoading: burning } = useContractWrite({
    address: tokenAddress,
    abi: CUSTOM_TOKEN_ABI,
    functionName: "burn",
    onError: (error) => handleAppError(error, "TokenDashboard: burn"),
  });

  // Write hooks
  const { writeAsync: pauseToken, isLoading: pausing } = useContractWrite({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "pause" });
  const { writeAsync: unpauseToken, isLoading: unpausing } = useContractWrite({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "unpause" });
  const { writeAsync: addToWhitelist } = useContractWrite({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "addToWhitelist" });
  const { writeAsync: removeFromWhitelist } = useContractWrite({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "removeFromWhitelist" });
  const { writeAsync: addToBlacklist } = useContractWrite({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "addToBlacklist" });
  const { writeAsync: removeFromBlacklist } = useContractWrite({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "removeFromBlacklist" });
  const { writeAsync: setWhitelistEnabled, isLoading: togglingWhitelist } = useContractWrite({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "setWhitelistEnabled" });
  const { writeAsync: renounceOwnership, isLoading: renouncingOwnership } = useContractWrite({ address: tokenAddress, abi: CUSTOM_TOKEN_ABI, functionName: "renounceOwnership" });
  const [showRenounceConfirm, setShowRenounceConfirm] = useState(false);

  // Handlers
  const handleMint = async (e) => {
    e.preventDefault();
    if (!mintAmount || isNaN(mintAmount) || Number(mintAmount) <= 0) {
      toast.error("Enter a valid amount to mint tokens.");
      return;
    }
    setMintAmount("");
    await showTxToast(
      "Sending mint transaction...",
      "Tokens minted successfully!",
      "Error minting tokens",
      async () => mintToken({ args: [userAddress, BigInt(mintAmount) * 10n ** BigInt(tokenData.decimals)] })
    )();
  };

  const handleBurn = async (e) => {
    e.preventDefault();
    if (!burnAmount || isNaN(burnAmount) || Number(burnAmount) <= 0) {
      toast.error("Enter a valid amount to burn tokens.");
      return;
    }
    setBurnAmount("");
    await showTxToast(
      "Sending burn transaction...",
      "Tokens burned successfully!",
      "Error burning tokens",
      async () => burnToken({ args: [BigInt(burnAmount) * 10n ** BigInt(tokenData.decimals)] })
    )();
  };

  // Permissions
  const isOwner = userAddress && tokenData.owner && userAddress.toLowerCase() === tokenData.owner.toLowerCase();

  // Add/remove whitelist with detailed logs
  const handleAddToWhitelist = async (e) => {
    e.preventDefault();
    if (!whitelistAddress) {
      toast.error("Enter a valid address to add to whitelist.");
      return;
    }
    
    setWhitelistAddress("");
    
    try {
      const toastId = toast.info("Adding to whitelist...", { autoClose: false });
      const tx = await addToWhitelist({ args: [whitelistAddress] });
      
      if (tx?.hash) {
        toast.update(toastId, { 
          render: "Successfully added to whitelist!", 
          type: "success", 
          autoClose: 4000,
          isLoading: false
        });
        
        // Reload lists after a short delay to allow blockchain update
        setTimeout(() => {
          fetchLists();
        }, 2000);
      }
    } catch (err) {
      toast.error("Error adding to whitelist: " + (err?.message || "Unknown error"));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6 mt-8">
      <ToastContainer position="top-right" autoClose={4000} />
      <h2 className="text-xl font-bold mb-4">Token Dashboard</h2>
      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mb-4 text-indigo-600 hover:underline break-all"
        >
          View on Celoscan
        </a>
      )}
      {showCreatedMsg && (
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-green-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800">Token created successfully! 🎉</h3>
              <p className="text-sm text-green-700">Your token is ready to use. You can manage it through this dashboard.</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs font-mono break-all text-green-800 bg-green-50 p-2 rounded border border-green-100">
              {tokenAddress}
            </p>
          </div>
        </div>
      )}
      {loading ? (
        <div>Loading token data...</div>
      ) : (
        <>
          <div className="mb-4 space-y-1">
            <div><strong>Name:</strong> {tokenData.name}</div>
            <div><strong>Symbol:</strong> {tokenData.symbol}</div>
            <div><strong>Supply:</strong> {String(tokenData.totalSupply / 10n ** BigInt(tokenData.decimals))}</div>
            <div><strong>Owner:</strong> <span className="break-all">{tokenData.owner}</span></div>
            <div className="flex gap-2 mt-2">
              <span className={tokenData.isMintable ? "text-green-600" : "text-gray-400"}>{tokenData.isMintable ? "✓ Mintable" : "× Mintable"}</span>
              <span className={tokenData.isBurnable ? "text-green-600" : "text-gray-400"}>{tokenData.isBurnable ? "✓ Burnable" : "× Burnable"}</span>
            </div>
          </div>

          {/* Mint Section */}
          {tokenData.isMintable && isOwner && (
            <form onSubmit={handleMint} className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Mint Tokens</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={mintAmount}
                  onChange={e => setMintAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-32 border rounded p-1"
                  disabled={minting}
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700" disabled={minting}>
                  {minting ? "Minting..." : "Mint"}
                </button>
              </div>
            </form>
          )}

          {/* Burn Section */}
          {tokenData.isBurnable && (
            <form onSubmit={handleBurn} className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Burn Tokens</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={burnAmount}
                  onChange={e => setBurnAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-32 border rounded p-1"
                  disabled={burning}
                />
                <button type="submit" className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700" disabled={burning}>
                  {burning ? "Burning..." : "Burn"}
                </button>
              </div>
            </form>
          )}

          {/* --- NEW FUNCTIONS: PAUSE, WHITELIST, BLACKLIST --- */}
          {isOwner && (
            <div className="mb-4 border-t pt-4 mt-4">
              <div className="mb-4 font-semibold text-gray-700 text-lg">Advanced Administration</div>
              {/* Pause/Unpause */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 mb-4">
                <span>Status: {paused ? <span className="text-red-600 font-semibold">Paused</span> : <span className="text-green-600 font-semibold">Active</span>}</span>
                {paused ? (
                  <button onClick={showTxToast(
                    "Sending unpause transaction...",
                    "Token unpaused successfully!",
                    "Error unpausing token",
                    async () => await unpauseToken()
                  )} className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600 font-medium transition"
                    disabled={unpausing || pausing}
                  >{unpausing ? "Unpausing..." : "Unpause"}</button>
                ) : (
                  <button onClick={showTxToast(
                    "Sending pause transaction...",
                    "Token paused successfully!",
                    "Error pausing token",
                    async () => await pauseToken()
                  )} className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600 font-medium transition"
                    disabled={pausing || unpausing}
                  >{pausing ? "Pausing..." : "Pause"}</button>
                )}
              </div>
              {/* Whitelist toggle */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 mb-4">
                <span>Whitelist: {isWhitelistEnabled ? <span className="text-green-600 font-semibold">Enabled</span> : <span className="text-gray-400">Disabled</span>}</span>
                <button
                  onClick={showTxToast(
                    `Sending transaction to ${isWhitelistEnabled ? "disable" : "enable"} whitelist...`,
                    `Whitelist ${!isWhitelistEnabled ? "enabled" : "disabled"} successfully!`,
                    `Error ${isWhitelistEnabled ? "disabling" : "enabling"} whitelist`,
                    async () => await setWhitelistEnabled({ args: [!isWhitelistEnabled] })
                  )}
                  className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 font-medium transition"
                  disabled={togglingWhitelist}
                >
                  {togglingWhitelist ? (isWhitelistEnabled ? "Disabling..." : "Enabling...") : (isWhitelistEnabled ? "Disable" : "Enable")}
                </button>
              </div>
              {/* Renounce Ownership */}
              <div className="flex flex-col gap-2 mb-4">
                <button
                  className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 font-bold transition"
                  disabled={renouncingOwnership}
                  onClick={() => setShowRenounceConfirm(true)}
                >
                  {renouncingOwnership ? "Renouncing..." : "Renounce Ownership"}
                </button>
                {showRenounceConfirm && (
                  <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded shadow-lg p-6 max-w-sm w-full border">
                      <div className="font-bold text-lg text-red-700 mb-2">Attention!</div>
                      <p className="mb-4 text-gray-700">This action is <span className='font-bold'>irreversible</span>.<br/>You will permanently lose administrative control of this token.<br/>Are you sure you want to continue?</p>
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-4 py-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
                          onClick={() => setShowRenounceConfirm(false)}
                        >Cancel</button>
                        <button
                          className="px-4 py-1 rounded bg-red-700 hover:bg-red-800 text-white font-bold"
                          onClick={async () => {
                            setShowRenounceConfirm(false);
                            await showTxToast(
                              "Sending transaction to renounce ownership...",
                              "Ownership renounced successfully!",
                              "Error renouncing ownership",
                              async () => await renounceOwnership()
                            )();
                          }}
                        >Confirm</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Add/Remove Whitelist */}
              <form
                onSubmit={handleAddToWhitelist}
                className="flex flex-col sm:flex-row gap-2 mb-4"
              >
                <input
                  type="text"
                  placeholder="Address to whitelist"
                  value={whitelistAddress}
                  onChange={e => setWhitelistAddress(e.target.value)}
                  className="flex-1 border rounded p-2"
                />
                <div className="flex gap-2">
                  <button type="submit"
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-medium transition">
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!whitelistAddress) {
                        toast.error("Enter a valid address to remove from whitelist.");
                        return;
                      }
                      setWhitelistAddress("");
                      await refreshListsAfter(() => showTxToast(
                        "Removing from whitelist...",
                        "Successfully removed from whitelist!",
                        "Error removing from whitelist",
                        async () => removeFromWhitelist({ args: [whitelistAddress] })
                      )());
                    }}
                    className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 font-medium transition"
                  >Remove</button>
                </div>
              </form>
              {/* Whitelist visual list */}
              <div className="mt-2">
                <div className="font-semibold mb-1">Whitelisted Addresses:</div>
                {!whitelistSupported ? (
                  <div className="text-gray-400 text-xs italic">This token does not support whitelist listing.</div>
                ) : loadingLists ? (
                  <div className="text-gray-400 text-sm">Loading...</div>
                ) : whitelist.length === 0 ? (
                  <div className="text-gray-400 text-sm">No addresses in whitelist.</div>
                ) : (
                  <ul className="text-xs bg-gray-50 rounded p-2 max-h-32 overflow-auto border border-gray-200">
                    {whitelist.map((addr, idx) => (
                      <li key={addr + idx} className="break-all">{addr}</li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Add/Remove Blacklist */}
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!blacklistAddress) {
                    toast.error("Enter a valid address to add to blacklist.");
                    return;
                  }
                  setBlacklistAddress("");
                  await refreshListsAfter(() => showTxToast(
                    "Adding to blacklist...",
                    "Successfully added to blacklist!",
                    "Error adding to blacklist",
                    async () => addToBlacklist({ args: [blacklistAddress] })
                  )());
                }}
                className="flex flex-col sm:flex-row gap-2 mb-2"
              >
                <input
                  type="text"
                  placeholder="Address to blacklist"
                  value={blacklistAddress}
                  onChange={e => setBlacklistAddress(e.target.value)}
                  className="flex-1 border rounded p-2"
                />
                <div className="flex gap-2">
                  <button type="submit"
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-medium transition">
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!blacklistAddress) {
                        toast.error("Enter a valid address to remove from blacklist.");
                        return;
                      }
                      setBlacklistAddress("");
                      await refreshListsAfter(() => showTxToast(
                        "Removing from blacklist...",
                        "Successfully removed from blacklist!",
                        "Error removing from blacklist",
                        async () => removeFromBlacklist({ args: [blacklistAddress] })
                      )());
                    }}
                    className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 font-medium transition"
                  >Remove</button>
                </div>
              </form>
              {/* Blacklist visual list */}
              <div className="mt-2">
                <div className="font-semibold mb-1">Blacklisted Addresses:</div>
                {!blacklistSupported ? (
                  <div className="text-gray-400 text-xs italic">This token does not support blacklist listing.</div>
                ) : loadingLists ? (
                  <div className="text-gray-400 text-sm">Loading...</div>
                ) : blacklist.length === 0 ? (
                  <div className="text-gray-400 text-sm">No addresses in blacklist.</div>
                ) : (
                  <ul className="text-xs bg-gray-50 rounded p-2 max-h-32 overflow-auto border border-gray-200">
                    {blacklist.map((addr, idx) => (
                      <li key={addr + idx} className="break-all">{addr}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
