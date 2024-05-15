const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const bls = require("../bls/bls.js") 
const { hashStr, ui8a2hex, bi2hex, hex2ui8a } = require("../bls/utils.js")


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













    // it("Should be deployed", async function () {
    //   const { blsSignatureChecker, owner } = await loadFixture(deployBLSSignatureChecker);

    //   // Generate BLS key pair
    //   const secretKey = bls.SecretKey.fromKeygen();
    //   // const publicKey = bls.getPublicKey(privateKey);
    //   const apk = secretKey.toPublicKey();
    //   const apkG2 = secretKey

    //   // Sign a message
    //   const message = new TextEncoder().encode('Your message here');
    //   const signature = BLS.AugSchemeMPL.sign(privateKey, message);

    //   // Prepare the data for verification
    //   // console.log("======================", ethers);
    //   const messageHash = ethers.keccak256(message);
    //   console.log("==============", {signature, messageHash})

    //   // Call the trySignatureAndApkVerification function of the contract
    //   const tx = await blsSignatureChecker.trySignatureAndApkVerification(
    //     messageHash,
    //     apk,
    //     apkG2,
    //     signature
    //   );

    //   // Wait for the transaction to be mined
    //   const receipt = await tx.wait();
    //   expect(receipt.status).to.equal(1);
    // });

    // it("Should set the right owner", async function () {
    //   const { lock, owner } = await loadFixture(deployOneYearLockFixture);

    //   expect(await lock.owner()).to.equal(owner.address);
    // });

    // it("Should receive and store the funds to lock", async function () {
    //   const { lock, lockedAmount } = await loadFixture(
    //     deployOneYearLockFixture
    //   );

    //   expect(await ethers.provider.getBalance(lock.target)).to.equal(
    //     lockedAmount
    //   );
    // });

    // it("Should fail if the unlockTime is not in the future", async function () {
    //   // We don't use the fixture here because we want a different deployment
    //   const latestTime = await time.latest();
    //   const Lock = await ethers.getContractFactory("Lock");
    //   await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
    //     "Unlock time should be in the future"
    //   );
    // });
  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
