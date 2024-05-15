require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    ganache: {
      url: "http://127.0.0.1:8545",
      accounts: {
        mnemonic: "year nose account leave power swamp warrior anger resource rent ten rich"
      }
    }
  }
};
