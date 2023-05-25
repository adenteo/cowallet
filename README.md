# Multisig Smart Contract Wallet

## Overview
As multisig signing capabilities are not widely implemented on web3 wallets on Algorand, we can potentially create a smart contract wallet (SCW) that implements this funcationlity.

Create a Dapp that allows end users to manage a multisig SCW that authorizes transactions from it.

## Application Details

### Smart Wallet Contract

#### Core Features

1. Store Algos and ASAs
2. Issue Algos and ASAs, subjected to the required number of owners approval
3. Owners need to opt into this contract to use it

#### Required Information

1. Wallet name
2. Contract version number (e.g. v1.0)
3. List of owner addresses (max 10)
4. Required number of signers (min 1, max 10)

#### Pending transactions

1. Allow any SCW owner to create pending transactions to send Algos or Assets from the SCW.
2. You can use boxes to store pending transactions when sending Algos or Assets from the smart contract wallet. 
3. You should also track the signing status for each pending transaction. 
4. Any owner can execute this pending transaction once the number of required signers are met. 
5. Remove the box once the transaction has been executed to reduce minimum balance requirement (MBR).

### Application Frontend

These are the required functionalities for the Dapp

1. Users can create SCW.
2. Users can load their SCW.
3. Users to opt into their SCW if necessary.
4. Users can view a list of pending transactions.
5. Users can sign pending transactions.
6. Users can execute pending transactions.

## Testing

Write test cases to demostrate the successful flow and negative tests to demostrate if the necesssary checks are in place.

## Deployment

Include documentation on how to deploy the smart contracts and how to set up the application frontend locally.

## Assesment Criteria

[https://docs.google.com/document/d/1Kpb3Bid3JXKFGh_SwP8iVPpry2T-t8j5BBqLAP87FeE/edit?usp=sharing](https://docs.google.com/document/d/1Kpb3Bid3JXKFGh_SwP8iVPpry2T-t8j5BBqLAP87FeE/edit?usp=sharing)
