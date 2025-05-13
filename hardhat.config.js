require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: ["6fb471c15010a3c154f3b64892820d79356a4c27fa7c34616e193df7603cc0c0"]
    }
  }
};
