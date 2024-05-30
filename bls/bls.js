const mcl = require('mcl-wasm')
const { ethers } = require("ethers");
const { ui8a2hex, bi2hex } = require("./utils")

let G1, G2;

// modulus for the underlying field F_p of the elliptic curve
const FP_MODULUS =
    21888242871839275222246405745257275088696311157297823662689037894645226208583n;
// modulus for the underlying field F_r of the elliptic curve
const FR_MODULUS =
    21888242871839275222246405745257275088548364400416034343698204186575808495617n;

const FIELD_ORDER = hex2bi('0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47');

async function init() {
  // await mcl.init(mcl.BN254);
  await mcl.init(mcl.BN_SNARK1);
  mcl.setETHserialization(true);
  mcl.setMapToMode(0);

  G1 = g1();
  G2 = g2();
}

/**
 * 
 * @param {number} n - Number of bytes 
 * @returns {string}
 */
function randHex(n) {
  return ethers.hexlify(ethers.randomBytes(n));
}

function hex2bi(hexString) {
  // Check for invalid input (empty string or characters other than 0-9a-fA-F)
  if (!ethers.isHexString(hexString)) {
    throw new Error(`Invalid hex string format ${hexString}`);
  }

  // Remove the optional "0x" prefix (case-insensitive)
  hexString = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

  // Convert the hex string to a BigInt
  return BigInt(`0x${hexString}`);
}

function createFp(a) {
  if(!ethers.isHexString(a))
    throw `invalid hex passed to createFp`
  const p = new mcl.Fp();
  p.setStr(a);
  return p
}

function createFp2(a, b) {
  if(!ethers.isHexString(a) || !ethers.isHexString(b))
    throw `invalid hex passed to createFp`
  const fp2_a = new mcl.Fp();
  const fp2_b = new mcl.Fp();
  fp2_a.setStr(a);
  fp2_b.setStr(b);
  const fp2 = new mcl.Fp2();
  fp2.set_a(fp2_a);
  fp2.set_b(fp2_b);
  return fp2;
}

function g1() {
  const p = new mcl.G1();
  p.setX(createFp("0x01"));
  p.setY(createFp("0x02"));
  p.setZ(createFp("0x01"));
  return p;
}

function g2() {
  p = new mcl.G2();
  p.setX(createFp2('0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed', '0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2'));
  p.setY(createFp2('0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa', '0x090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b'));
  p.setZ(createFp2('0x01', '0x00'));
  return p;
}

function createKeyPair(_secret=undefined) {
  const secret = createFr(_secret);
  const pubG1 = mcl.mul(G1, secret);
  pubG1.normalize();
  const pubG2 = mcl.mul(G2, secret);
  pubG2.normalize();
  return { pubG1, pubG2, secret };
}

/**
 * 
 * @param {hex} value - hex value 
 * @returns {Fr element}
 */
function createFr(value=undefined) {
  let fr = new mcl.Fr();
  if(value) {
    if(!ethers.isHexString(value))
      throw `invalid hex value passed to newFr`;
    fr.setStr(value);
  }
  else {
    const r = randHex(64);
    fr.setHashOf(r);
  }
  return fr;
}

function signShort(message, keyPair) {
  // Hash the message using SHA-256 (replace with your preferred hashing function)
  const hash = hashToG1(message);

  // Create BLS signature
  const signature = mcl.mul(hash, keyPair.secret);
  signature.normalize()

  return signature;
}

function verifyShort(message, signature, pubG2) {
  const hash = hashToG1(message);
  const p1 = mcl.pairing(signature, G2);
  const p2 = mcl.pairing(hash, pubG2);
  return p1.isEqual(p2);
}

function aggregateSigns(signs, pubG2s) {
  let sign = signs[0]
  let pubG2 = pubG2s[0]
  for(let i=1 ; i<signs.length ; i++) {
    pubG2 = mcl.add(pubG2, pubG2s[i]);
    sign = mcl.add(sign, signs[i]);
  }
  return {sign, pubG2}
}

function aggregatePoints(points) {
  let agg = points[0]
  for(let i=1 ; i<points.length ; i++) {
    agg = mcl.add(agg, points[i]);
  }
  agg.normalize();
  return agg
}

/**
 * 
 * @param {Hex} _x 
 * @returns {G1}
 */
function hashToG1(_x) {
  let beta = 0n;
  let y = 0n;

  let x = hex2bi(_x) % FP_MODULUS;

  while (true) {
      [beta, y] = findYFromX(x);

      // y^2 == beta
      if( beta == ((y * y) % FP_MODULUS) ) {
          return G1Point(x, y);
      }

      x = (x + 1n) % FP_MODULUS;
  }
  return G1Point(0n, 0n);
}

function addmod(a, b, m) {
  return (a + b) % m
}

function mulmod(a, b, m) {
  return (a * b) % m
}

function expmod(a, b, m) {
  let result = 1n;
  let base = a;
  let _b = b;

  while (_b > 0n) {
    // Check the least significant bit (LSB) of b
    if (_b & 1n) {
      result = (result * base) % m;
    }
    // Right shift b by 1 (effectively dividing by 2, discarding the remainder)
    _b >>= 1n;
    // Square the base for the next iteration (efficient for repeated multiplication)
    base = (base * base) % m;
  }

  return result;
}

function findYFromX(x) {
  // beta = (x^3 + b) % p
  let beta = addmod(mulmod(mulmod(x, x, FP_MODULUS), x, FP_MODULUS), 3n, FP_MODULUS);

  // y^2 = x^3 + b
  // this acts like: y = sqrt(beta) = beta^((p+1) / 4)
  let y = expmod(beta, hex2bi("0xc19139cb84c680a6e14116da060561765e05aa45a1c72a34f082305b61f3f52"), FP_MODULUS);

  return [beta, y];
}


function G1Point(x, y) {
  const p = new mcl.G1();
  p.setX(createFp(bi2hex(x)));
  p.setY(createFp(bi2hex(y)));
  p.setZ(createFp("0x01"));
  return p;
}

function g1ToArgs(pointG1) {
  return {
    X: ui8a2hex(pointG1.getX().serialize().reverse()),
    Y: ui8a2hex(pointG1.getY().serialize().reverse()),
  }
}

function g2ToArgs(pointG2) {
  return {
    X: [
      ui8a2hex(pointG2.getX().get_b().serialize().reverse()),
      ui8a2hex(pointG2.getX().get_a().serialize().reverse()),
    ],
    Y: [
      ui8a2hex(pointG2.getY().get_b().serialize().reverse()),
      ui8a2hex(pointG2.getY().get_a().serialize().reverse()),
    ],
  }
}

module.exports = {
  init,
  g1,
  g2,
  hashToG1,
  createFr,
  createKeyPair,
  signShort,
  verifyShort,
  expmod,
  g1ToArgs,
  g2ToArgs,
  aggregatePoints,
}
