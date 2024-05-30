
const { ethers } = require("hardhat");

const hex2ui8a = hexString => new Uint8Array(hexString.replace("0x","").match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const ui8a2hex = array => "0x"+Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");

const bi2hex = bigIntValue => `0x${bigIntValue.toString(16)}`

const hashStr = str => {
  return ethers.keccak256(Buffer.from(str))
  // const strHash = ethers.keccak256(Buffer.from(str))
  // return hex2ui8a(strHash);
}

module.exports = {
  hex2ui8a,
  ui8a2hex,
  bi2hex,
  hashStr,
}