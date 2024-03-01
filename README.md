# PAYHUA SDK

This repository contains a JavaScript module providing utility functions for interacting with a smart contract deployed on various Ethereum-like networks.
The module includes functions for encoding and decoding subscription information, retrieving user-specific data, and handling transfer events.

## Features

- **setChain(_chainID):** Initialize the chain and set up the Ethereum provider and contract.
- **encodeSubscription(_networkId, _boss, _token, _cost, _initdays):** Encode subscription information and provide a hash/link for verification.
- **decodeSubscription(_hash):** Decode a subscription hash and retrieve subscription information.
- **getUserTokenData(_token, _user):** Retrieve user-specific token data, including balance and allowance.
- **getTransfers(startBlock, endBlock):** Retrieve transfer events within a specified block range.

## Usage
   ```
   npm install payhua/sdk
  ```
