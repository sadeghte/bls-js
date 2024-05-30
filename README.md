# BLS Signature Library

Sign & verify messages using BLS signature to be verified on the ethereum smart contracts.

# Contract Deployment
``` bash
// deploy contract
$ npm run deploy

// verify deployed contract
$ ADDRESS=<contract-address> npm run verify
```

# Simple Example
``` js
const bls = require("../bls/bls.js") 

const keyPair = bls.createKeyPair();
const message = hashStr('sample test to sign')

const signature = bls.signShort(message, keyPair)
const verified = bls.verifyShort(message, signature, keyPair.pubG2)
```

# Aggregation Example
``` js
const bls = require("../bls/bls.js")       

const keyPair1 = bls.createKeyPair();
const keyPair2 = bls.createKeyPair();

// define message
const message = hashStr('sample message to sign')

// sign the message with keyPairs
const sign1 = bls.signShort(message, keyPair1)
const sign2 = bls.signShort(message, keyPair2)

// check aggregated signature
const verified = bls.verifyShort(
  message, 
  bls.aggregatePoints([sign1, sign2]), 
  bls.aggregatePoints([keyPair1.pubG2, keyPair2.pubG2])
)
```

# Unit Test
``` bash
$ npm run test
```

# Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.

# License
This project is licensed under the MIT License.

# Disclaimer
This library is provided "as is", without warranty of any kind. Use at your own risk.