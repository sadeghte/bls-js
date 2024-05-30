// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import {BN254} from "./libraries/BN254.sol";

contract BLSSignatureChecker {
    using BN254 for BN254.G1Point;

    // gas cost of multiplying 2 pairings
    uint256 internal constant PAIRING_EQUALITY_CHECK_GAS = 120000;

    function verifySignature(
        bytes32 msgHash,
        BN254.G1Point memory apkG1, // is the aggregate G1 pubkey of all partners
        BN254.G2Point memory apkG2, // is the aggregate G2 pubkey of all signers
        BN254.G1Point memory sigma, // is the aggregate G1 signature of all signers
        BN254.G1Point[] memory nonSignerPubkeys // is the G1 pubkeys of all nonsigners
    ) public view returns(bool pairingSuccessful, bool siganatureIsValid) {
        BN254.G1Point memory apk = BN254.G1Point(0, 0);
        for (uint256 j = 0; j < nonSignerPubkeys.length; j++) {
            apk = apk.plus(nonSignerPubkeys[j]);
        }
        apk = apk.negate();
        apk = apk.plus(apkG1);

        return trySignatureAndApkVerification(msgHash, apk, apkG2, sigma);
    }

    /**
     * trySignatureAndApkVerification verifies a BLS aggregate signature and the veracity of a calculated G1 Public key
     * @param msgHash is the hash being signed
     * @param apk is the claimed G1 public key
     * @param apkG2 is provided G2 public key
     * @param sigma is the G1 point signature
     * @return pairingSuccessful is true if the pairing precompile call was successful
     * @return siganatureIsValid is true if the signature is valid
     */
    function trySignatureAndApkVerification(
        bytes32 msgHash,
        BN254.G1Point memory apk,
        BN254.G2Point memory apkG2,
        BN254.G1Point memory sigma
    ) public view returns(bool pairingSuccessful, bool siganatureIsValid) {
        // gamma = keccak256(abi.encodePacked(msgHash, apk, apkG2, sigma))
        uint256 gamma = uint256(keccak256(abi.encodePacked(msgHash, apk.X, apk.Y, apkG2.X[0], apkG2.X[1], apkG2.Y[0], apkG2.Y[1], sigma.X, sigma.Y))) % BN254.FR_MODULUS;
        // verify the signature
        (pairingSuccessful, siganatureIsValid) = BN254.safePairing(
            // signature
            sigma.plus(apk.scalar_mul(gamma)),
            // negative G2 generator
            BN254.negGeneratorG2(),
            // message hash
            BN254.hashToG1(msgHash).plus(BN254.generatorG1().scalar_mul(gamma)),
            // publicKey in G2
            apkG2,
            PAIRING_EQUALITY_CHECK_GAS
        );
    }
}
