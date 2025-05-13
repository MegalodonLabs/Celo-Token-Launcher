import { useBalance } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { useState, useEffect } from 'react';
import { useAccount, useContractWrite, usePublicClient, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { handleAppError } from "../utils/errorHandler";

/* global BigInt */
// Temporary address - needs to be updated with the correct address
const TOKEN_FACTORY_ADDRESS = '0xA573c33E2aa2Cb2FC30Fd3a27ABaDF38f248DEc1';
const CREATION_FEE_CELO = "2.5"; // Fee in CELO (for display)
const CREATION_FEE_WEI = parseEther(CREATION_FEE_CELO); // Fee in wei (1 CELO = 10^18 wei, for transactions)

const TOKEN_FACTORY_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "symbol", "type": "string" },
      { "internalType": "uint256", "name": "initialSupply", "type": "uint256" },
      { "internalType": "bool", "name": "isMintable", "type": "bool" },
      { "internalType": "bool", "name": "isBurnable", "type": "bool" }
    ],
    "name": "createToken",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "tokenAddress", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "symbol", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "initialSupply", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "isMintable", "type": "bool" },
      { "indexed": false, "internalType": "bool", "name": "isBurnable", "type": "bool" }
    ],
    "name": "TokenCreated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getDeployedTokens",
    "outputs": [
      { "internalType": "address[]", "name": "", "type": "address[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creationFee",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeReceiver",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function TokenForm() {
  const { isConnected, address } = useAccount();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address,
  });
  const hasEnoughBalance = balanceData?.value && balanceData.value >= CREATION_FEE_WEI;  
  const publicClient = usePublicClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [supply, setSupply] = useState('');
  const [isMintable, setIsMintable] = useState(false);
  const [isBurnable, setIsBurnable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTokenAddress, setCreatedTokenAddress] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isContractVerified, setIsContractVerified] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1: Form, 2: Review, 3: Success

  // Checks if the contract is deployed and valid
  useEffect(() => {
    const verifyContract = async () => {
      try {
        const code = await publicClient.getBytecode({
          address: TOKEN_FACTORY_ADDRESS
        });
        setIsContractVerified(code !== '0x');
      } catch (error) {
        console.error('Error verifying contract:', error);
        setIsContractVerified(false);
      }
    };

    if (isConnected) {
      verifyContract();
    }
  }, [isConnected, publicClient]);

  // Centralized transaction error handler
  function handleTxError(error) {
    handleAppError(error, "TokenForm: token creation transaction");
  }

  const { 
    write: createToken,
    data: txData,
    error: writeError,
    isError: isWriteError,
    reset: resetWrite
  } = useContractWrite({
    address: TOKEN_FACTORY_ADDRESS,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'createToken',
    onError: (error) => {
      setIsSubmitting(false);
      handleTxError(error);
    },
  });

  const { 
    isLoading: isWaitingForTx,
    isSuccess: isTxSuccess,
    error: txError,
    isError: isTxError
  } = useWaitForTransaction({
    hash: txData?.hash,
    onSuccess: (receipt) => {
      setIsSubmitting(false);
      const logs = receipt.logs;
      let tokenAddress = null;
      const tokenCreatedEvent = logs.find(log => {
        const eventSignature = keccak256(toBytes("TokenCreated(address,string,string,uint256,bool,bool)"));
        return log.topics[0] === eventSignature;
      });
      if (tokenCreatedEvent) {
        try {
          tokenAddress = tokenCreatedEvent.topics[1];
          tokenAddress = '0x' + tokenAddress.slice(26);
          setCreatedTokenAddress(tokenAddress);
          setFormStep(3);
          toast.success("Token created successfully!", {
            position: "top-center",
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored"
          });
          setTimeout(() => {
            toast.info("Your token is ready for use!", {
              position: "bottom-center",
              autoClose: 5000,
              theme: "colored"
            });
          }, 500);
          setTimeout(() => {
            toast.info("Access the dashboard to manage your token", {
              position: "top-right",
              autoClose: 5000,
              theme: "colored"
            });
            setTimeout(() => {
              navigate(`/token/${tokenAddress}?created=true`);
            }, 2000);
          }, 1500);
        } catch (error) {
          console.error('Error extracting token address:', error);
          toast.error("Error processing token address", {
            position: "top-right",
            autoClose: 5000,
            theme: "colored"
          });
        }
      } else {
        console.error('TokenCreated event not found in logs');
        toast.error("Unable to find token creation event in logs", {
          position: "top-right",
          autoClose: 5000,
          theme: "colored"
        });
      }
    },
    onError: (error) => {
      setIsSubmitting(false);
      console.error('Transaction error:', error);
      toast.error(`Transaction error: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        theme: "colored"
      });
    },
  });

  // Efeito para resetar o estado de submissão se houver erro
  useEffect(() => {
    if ((isWriteError && writeError) || (isTxError && txError)) {
      setIsSubmitting(false);
      toast.error("Transaction error occurred. Please try again.", {
        position: "top-center",
        autoClose: 5000,
        theme: "colored"
      });
    }
  }, [isWriteError, writeError, isTxError, txError]);
  
  // Efeito para monitorar o estado da transação e timeout
  useEffect(() => {
    let timeoutId;
    
    if (isSubmitting) {
      timeoutId = setTimeout(() => {
        if (!isWaitingForTx && !isTxSuccess) {
          setIsSubmitting(false);
          resetWrite();
          toast.error("Timeout exceeded. Please try again.", {
            position: "top-center",
            autoClose: 5000,
            theme: "colored"
          });
        }
      }, 30000); // 30 seconds of timeout
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isSubmitting, isWaitingForTx, isTxSuccess, resetWrite]);

  const handleSubmit = async () => {
    if (!isContractVerified) {
      setErrorMessage("The token factory contract is not verified. Please ensure you are connected to the Celo Alfajores network.");
      return;
    }
    if (!hasEnoughBalance) {
      setErrorMessage(`Insufficient balance. You need at least ${CREATION_FEE_CELO} CELO to create a token.`);
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      createToken({
        args: [name, symbol, BigInt(supply) * BigInt(10**18), isMintable, isBurnable],
        value: CREATION_FEE_WEI
      });
    } catch (error) {
      handleTxError(error);
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setName(value);
    } else if (name === "symbol") {
      setSymbol(value.toUpperCase());
    } else if (name === "supply") {
      if (/^\d*$/.test(value)) {
        setSupply(value);
      }
    } else if (name === "isMintable") {
      setIsMintable(e.target.checked);
    } else if (name === "isBurnable") {
      setIsBurnable(e.target.checked);
    }
  };

  const addToMetaMask = async () => {
    if (window.ethereum) {
      try {
        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: createdTokenAddress,
              symbol: symbol,
              decimals: 18,
              image: 'https://via.placeholder.com/32',
            },
          },
        });
        if (wasAdded) {
          toast.success(" Token added to MetaMask!", {
            position: "top-right",
            autoClose: 5000,
          });
        } else {
          toast.info(" Token addition request was canceled.", {
            position: "top-right",
            autoClose: 5000,
          });
        }
      } catch (error) {
        console.error("Error adding token:", error);
        const errorMessage = error?.message || "Request was canceled or failed.";
        toast.error(` ${errorMessage}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    }
  };

  const renderFormHeader = () => {
    return (
      <>
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create New Token</h2>
            {isConnected && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Connected as:</span>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium truncate max-w-[150px]">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
            )}
          </div>
          
          {isConnected && !createdTokenAddress && (
            <div className="relative">
              <div className="flex justify-between mb-2">
                <div className={`flex flex-col items-center ${formStep >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${formStep >= 1 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'} mb-1`}>
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <span className="text-xs">Details</span>
                </div>
                
                <div className={`flex flex-col items-center ${formStep >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${formStep >= 2 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'} mb-1`}>
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <span className="text-xs">Review</span>
                </div>
                
                <div className={`flex flex-col items-center ${formStep >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${formStep >= 3 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'} mb-1`}>
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <span className="text-xs">Success</span>
                </div>
              </div>
              
              <div className="absolute top-5 left-0 right-0 flex justify-center z-0">
                <div className="h-0.5 w-full bg-gray-200">
                  <div 
                    className="h-0.5 bg-indigo-600 transition-all duration-300" 
                    style={{ width: formStep === 1 ? '0%' : formStep === 2 ? '50%' : '100%' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderFormStep1 = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={(e) => { e.preventDefault(); setFormStep(2); }} className="space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {!isContractVerified && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>Attention: Unable to verify token factory contract. Please ensure you are connected to the Celo Alfajores network.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={handleChange}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Ex: My Token"
              />
            </div>

            <div>
              <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={symbol}
                onChange={handleChange}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Ex: MTK"
              />
            </div>
          </div>

          <div>
            <label htmlFor="supply" className="block text-sm font-medium text-gray-700 mb-1">Initial Supply</label>
            <input
              type="number"
              id="supply"
              name="supply"
              value={supply}
              onChange={handleChange}
              required
              min="1"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Ex: 1000000"
            />
            <p className="mt-1 text-sm text-gray-500">The supply will be multiplied by 10^18 in the contract.</p>
          </div>

          <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
            <h3 className="text-md font-medium text-indigo-800 mb-3">Token Resources</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    id="mintable" 
                    checked={isMintable}
                    onChange={() => setIsMintable(!isMintable)}
                    className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-indigo-500 focus:outline-none duration-200 ease-in"
                  />
                  <label 
                    htmlFor="mintable" 
                    className={`block h-6 overflow-hidden rounded-full cursor-pointer ${isMintable ? 'bg-indigo-300' : 'bg-gray-300'} duration-200 ease-in`}
                  ></label>
                </div>
                <label htmlFor="mintable" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-medium">Mintable Token</span> - Allows creating new tokens after
                </label>
              </div>
              
              <div className="flex items-center">
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    id="burnable" 
                    checked={isBurnable}
                    onChange={() => setIsBurnable(!isBurnable)}
                    className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-indigo-500 focus:outline-none duration-200 ease-in"
                  />
                  <label 
                    htmlFor="burnable" 
                    className={`block h-6 overflow-hidden rounded-full cursor-pointer ${isBurnable ? 'bg-indigo-300' : 'bg-gray-300'} duration-200 ease-in`}
                  ></label>
                </div>
                <label htmlFor="burnable" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-medium">Burnable Token</span> - Allows burning tokens
                </label>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium text-gray-700">Creation Fee</h3>
              <span className="text-lg font-bold text-indigo-600">{CREATION_FEE_CELO} CELO</span>
            </div>
            
            {isBalanceLoading ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading balance...</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Your balance:</span>
                <span className={`text-sm font-medium ${hasEnoughBalance ? 'text-green-600' : 'text-red-600'}`}>
                  {balanceData ? parseFloat(balanceData.formatted).toFixed(4) : '0'} {balanceData?.symbol}
                </span>
              </div>
            )}
            
            {!hasEnoughBalance && (
              <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600">
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Insufficient balance to pay creation fee. You need at least {CREATION_FEE_CELO} CELO.
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!hasEnoughBalance || !isContractVerified || !name || !symbol || !supply}
              className={`w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${!hasEnoughBalance || !isContractVerified || !name || !symbol || !supply ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
            >
              Next Step
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderFormStep2 = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Token Review</h3>
            <button 
              onClick={() => setFormStep(1)} 
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Edit details
            </button>
          </div>
          
          <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-xl font-bold text-gray-800">{name}</h4>
                <p className="text-indigo-600 font-medium">{symbol}</p>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg border border-indigo-200 text-right">
                <p className="text-xs text-gray-500">Total Supply</p>
                <p className="text-lg font-bold text-gray-800">{supply} {symbol}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Resources</p>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${isMintable ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"} mr-2 text-xs`}>
                      {isMintable ? "✓" : "×"}
                    </span>
                    <span className="text-sm">Mintable</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${isBurnable ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"} mr-2 text-xs`}>
                      {isBurnable ? "✓" : "×"}
                    </span>
                    <span className="text-sm">Burnable</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Creation Fee</p>
                <p className="text-lg font-medium text-indigo-600">{CREATION_FEE_CELO} CELO</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>After confirming, you will need to approve the transaction in your wallet and pay the creation fee of {CREATION_FEE_CELO} CELO.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              onClick={() => setFormStep(1)}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Token...
                </div>
              ) : 'Confirm and Create Token'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFormStep3 = () => {
    return (
      <div className="mt-8 bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-lg border border-green-200 shadow-md">
        <div className="flex items-center justify-center mb-6 text-center">
          <div className="bg-green-100 p-3 rounded-full mr-3">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-green-800">Token Created Successfully! 🎉</h3>
        </div>
        
        <div className="bg-white p-5 rounded-lg border border-green-200 shadow-sm mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 text-lg border-b pb-2 border-green-100">Token Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Name</p>
              <p className="font-medium text-gray-900">{name}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Symbol</p>
              <p className="font-medium text-gray-900">{symbol}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Initial Supply</p>
              <p className="font-medium text-gray-900">{supply} {symbol}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Supply</p>
              <p className="font-medium text-gray-900">{supply},000000000000000000 {symbol}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-green-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Resources:</p>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${isMintable ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"} mr-2`}>
                  {isMintable ? "✓" : "×"}
                </span>
                <span>Mintable</span>
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${isBurnable ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"} mr-2`}>
                  {isBurnable ? "✓" : "×"}
                </span>
                <span>Burnable</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg border border-green-200 shadow-sm mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Contract Address</h4>
          <div className="flex items-center p-2 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm break-all flex-1 font-mono">{createdTokenAddress}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdTokenAddress);
                toast.info("Address copied!", { position: "bottom-center", autoClose: 2000 });
              }}
              className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              title="Copy address"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={addToMetaMask}
            className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center space-x-2 transition-colors"
          >
            <img src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" alt="MetaMask" className="h-5 w-5" />
            <span className="font-medium">Add to MetaMask</span>
          </button>
          <a
            href={`https://alfajores.celoscan.io/token/${createdTokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="font-medium">View on Explorer</span>
          </a>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <h4 className="font-semibold text-indigo-800 mb-1">Access Token Dashboard</h4>
            <p className="text-sm text-indigo-600">Manage your token, create mints, and configure additional options</p>
          </div>
          <button
            onClick={() => navigate(`/token/${createdTokenAddress}?created=true`)}
            className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center space-x-2 transition-colors shadow-md"
          >
            <span>Access Dashboard</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {isConnected && (
        <>
          {renderFormHeader()}
          
          {!createdTokenAddress && formStep === 1 && renderFormStep1()}
          
          {!createdTokenAddress && formStep === 2 && renderFormStep2()}
          
          {!createdTokenAddress && formStep === 3 && renderFormStep3()}
        </>
      )}
    </div>
  );
}

export default TokenForm;
