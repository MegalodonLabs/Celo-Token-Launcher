# Celo Token Launcher

A complete dApp for creating and managing ERC20 tokens on the Celo blockchain. Includes a powerful TokenFactory smart contract and a modern React frontend for seamless interaction with your custom tokens.

---

## 🏗️ Architecture Overview
![Architecture](https://iili.io/38sDfFn.png)

---

## 🧠 Project Description

- **TokenFactory Smart Contract**: Easily create custom tokens with advanced options:
  - Mintable, burnable, pausable, capped supply
  - Transfer ownership, renounce ownership
  - Whitelist/blacklist support
  - Fixed creation fee (2.5 CELO per token)
- **Frontend (React + Vite)**: Connects to the Celo blockchain for full token management:
  - Step-by-step token creation wizard
  - Automatic detection of token features (UI adapts to each token)
  - Token dashboard: view owner, total supply, name, symbol, and more
  - Safe fallback for tokens with missing or reverting functions
  - Upload a custom token icon via IPFS
- **Multi-token support**: Manage and view all tokens created with the factory
- **Renounce Ownership**: Securely relinquish admin rights when desired

---

## 🚦 Main Functions

- **createToken**: Deploy a new ERC20 token with custom options (mintable, burnable, pausable, capped, etc.)
- **mint**: Mint new tokens (if enabled)
- **burn**: Burn tokens (if enabled)
- **pause/unpause**: Pause or unpause all token transfers (if enabled)
- **addToWhitelist/removeFromWhitelist**: Manage addresses allowed to interact with the token
- **addToBlacklist/removeFromBlacklist**: Block specific addresses
- **transferOwnership**: Transfer token admin rights
- **renounceOwnership**: Relinquish all admin rights
- **getDeployedTokens**: List all tokens created by the factory

---

## 🔄 Data Flow

1. **User connects wallet** (MetaMask/Celo Extension)
2. **Frontend** detects connection and displays token creation form
3. **User submits token details** (name, symbol, supply, features, icon)
4. **Frontend** uploads icon to IPFS (if provided)
5. **Frontend** sends `createToken` transaction to TokenFactory contract
6. **Smart contract** deploys new ERC20 token and emits event
7. **Frontend** listens for event, fetches new token address, and displays dashboard
8. **User** can now mint, burn, pause, whitelist, blacklist, or renounce ownership via the dashboard

---

## 📝 Smart Contract Details

- **TokenFactory.sol**
  - Deploys new ERC20 tokens with customizable features
  - Enforces a fixed creation fee (2.5 CELO)
  - Emits `TokenCreated` event with token details
  - Tracks all deployed tokens

- **CustomToken.sol** (deployed by factory)
  - ERC20 standard with optional extensions:
    - Mintable, burnable, pausable, capped supply
    - Whitelist/blacklist logic
    - Ownership transfer and renounce
  - Emits events for all major actions (Mint, Burn, Pause, OwnershipTransferred, etc.)

---

## 🧰 Technologies Used

- **Solidity** (Hardhat) – Smart contracts
- **React** + **Vite** – Frontend
- **Ethers.js** – Blockchain interaction
- **IPFS** – Token icon uploads
- **Celo Blockchain** (Alfajores testnet)

---

## 📝 Getting Started (Local Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/celo-token-launcher.git
   cd celo-token-launcher
   ```
2. **Install dependencies** (run in both root and frontend if needed)
   ```bash
   npm install
   cd frontend
   npm install
   ```
3. **Run the backend (Hardhat, Celo testnet)**
   ```bash
   npx hardhat node
   # In another terminal, deploy contracts:
   npx hardhat run scripts/deploy.js --network alfajores
   ```
4. **Start the frontend**
   ```bash
   cd frontend
   npm run dev
   ```
5. **Connect your Celo wallet (testnet) and create tokens!**

---

## 🚀 Features

- Create ERC20 tokens with advanced options (mint, burn, pause, capped, whitelist, blacklist)
- Upload a custom token icon (IPFS)
- Pay a fixed creation fee in CELO
- View and manage all created tokens
- Owner, supply, name, symbol, and feature detection
- Safe UI for tokens with missing/reverting functions
- Renounce or transfer ownership

---

## 🗺️ Planned Features

- Ownership transfer to multisig/DAO
- Custom mint/burn fees
- Soulbound (non-transferable) tokens
- Home page with token showcase (like tkn.homes)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements

- [Celo](https://celo.org/)
- [Hardhat](https://hardhat.org/)
- [Vite](https://vitejs.dev/)
- [Ethers.js](https://docs.ethers.io/)
- [IPFS](https://ipfs.tech/)

---

## 📬 Contact

For questions, suggestions, or support, please open an issue or contact the maintainer. 