const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const bls = require("../bls/bls.js") 
const { hashStr } = require("../bls/utils.js")


describe("BLSSignatureChecker", function () {
  before(async function () {
    await bls.init();
  })
  
  async function deployBLSSignatureChecker() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const BLSSignatureChecker = await ethers.getContractFactory("BLSSignatureChecker");
    const blsSignatureChecker = await BLSSignatureChecker.deploy();
    // await blsSignatureChecker.deployed();

    return { blsSignatureChecker, owner, otherAccount };
  }

  describe("Deployment", function () {

    it("Sign & verify should work", async function () {
      const keyPair = bls.createKeyPair("0x123456");
      const message1 = hashStr('sample test to sign')
      const message2 = hashStr('secound sample test to sign')

      const signature = bls.signShort(message1, keyPair)
      const verified1 = bls.verifyShort(message1, signature, keyPair.pubG2)
      const verified2 = bls.verifyShort(message2, signature, keyPair.pubG2)

      expect(verified1).to.equal(true, "Correct message shoud be verified");
      expect(verified2).to.equal(false, "Wrong message should not be verified");
    });

    it("Signature aggregation should work", async function () {
      // initialize secrets
      const keyPair1 = bls.createKeyPair("0x1234");
      const keyPair2 = bls.createKeyPair("0x5678");

      // define message
      const message = hashStr('sample test to sign')

      // sign the message with keyPairs
      const sign1 = bls.signShort(message, keyPair1)
      const sign2 = bls.signShort(message, keyPair2)

      // check aggregated signature
      const verified = bls.verifyShort(
        message, 
        bls.aggregatePoints([sign1, sign2]), 
        bls.aggregatePoints([keyPair1.pubG2, keyPair2.pubG2])
      )

      expect(verified).to.equal(true, "Aggregated signature should be verified");
    })

    it("Simple signature should verify by contract", async function () {
      const { blsSignatureChecker, owner } = await loadFixture(deployBLSSignatureChecker);

      // const keyPair = bls.createKeyPair("0x123456");
      const keyPair = bls.createKeyPair();
      const message = hashStr('sample test to sign')

      const signature = bls.signShort(message, keyPair)

      // Call the trySignatureAndApkVerification function of the contract
      const [pairingSuccessful, siganatureIsValid] = await blsSignatureChecker.trySignatureAndApkVerification(
        message,
        bls.g1ToArgs(keyPair.pubG1),
        bls.g2ToArgs(keyPair.pubG2),
        bls.g1ToArgs(signature),
      );

      expect(siganatureIsValid).to.equal(true, "Signature is not valid");
      expect(pairingSuccessful).to.equal(true, "Pairing not done successfully");
    })

    it("Aggregated signature should verify by contract", async function () {
      const { blsSignatureChecker, owner } = await loadFixture(deployBLSSignatureChecker);

      // const keyPair = bls.createKeyPair("0x123456");
      const keyPair1 = bls.createKeyPair();
      const keyPair2 = bls.createKeyPair();
      const message = hashStr('sample test to sign')

      const sign1 = bls.signShort(message, keyPair1)
      const sign2 = bls.signShort(message, keyPair2)

      const totalSig = bls.aggregatePoints([sign1, sign2]);
      const aggG1 = bls.aggregatePoints([keyPair1.pubG1, keyPair2.pubG1]);
      const aggG2 = bls.aggregatePoints([keyPair1.pubG2, keyPair2.pubG2]);

      // Call the trySignatureAndApkVerification function of the contract
      const [pairingSuccessful, siganatureIsValid] = await blsSignatureChecker.trySignatureAndApkVerification(
        message,
        bls.g1ToArgs(aggG1),
        bls.g2ToArgs(aggG2),
        bls.g1ToArgs(totalSig),
      );

      expect(siganatureIsValid).to.equal(true, "Signature is not valid");
      expect(pairingSuccessful).to.equal(true, "Pairing not done successfully");
    })

    it("Missing partner should be handle by contract", async function () {
      const { blsSignatureChecker, owner } = await loadFixture(deployBLSSignatureChecker);

      // const keyPair = bls.createKeyPair("0x123456");
      const keyPair1 = bls.createKeyPair();
      const keyPair2 = bls.createKeyPair();
      // missing partner
      const keyPair3 = bls.createKeyPair();

      const message = hashStr('sample test to sign')

      const sign1 = bls.signShort(message, keyPair1)
      const sign2 = bls.signShort(message, keyPair2)

      const totalSig = bls.aggregatePoints([sign1, sign2]);

      // Call the trySignatureAndApkVerification function of the contract
      const [pairingSuccessful, siganatureIsValid] = await blsSignatureChecker.verifySignature(
        message,
        bls.g1ToArgs(
          bls.aggregatePoints([keyPair1.pubG1, keyPair2.pubG1, keyPair3.pubG1])
        ),
        bls.g2ToArgs(
          bls.aggregatePoints([keyPair1.pubG2, keyPair2.pubG2])
        ),
        bls.g1ToArgs(totalSig),
        [
          bls.g1ToArgs(keyPair3.pubG1)
        ],
      );

      expect(siganatureIsValid).to.equal(true, "Signature is not valid");
      expect(pairingSuccessful).to.equal(true, "Pairing not done successfully");
    })
  });
});
