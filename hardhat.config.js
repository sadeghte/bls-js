require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  etherscan: {
    apiKey: "<api-key>"
  },
  networks: {
    ganache: {
      url: "http://127.0.0.1:8545",
      accounts: {
        mnemonic: "..."
      }
    },
    "bnb-test": {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: {
        mnemonic: "..."
      }
    }
  }
};
