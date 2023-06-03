Initialise smart contract that will hold algos and assets.

Functions in smart contract wallet

-   can receive algos and assets from owners

-   Send algos (Opted in function) innerTxn payment type (assert signatures is enough)
-   Send FTs/NFTs (Opted in function) innerTxn assetTrf type (assert signatures is enough)
-   Opt in

Boxes to store txns,
When threshold signatures is reached, any owner can make the sendAlgos/sendNFTs/sendFTs app call with their signature. Just execute() it.

When you make these app calls, you'll pass in parameters from the txn (from box array). The parameters of the txn include:

amount of ALGOS/ASA
receiver
number of signatures acquired

FRONTEND:

1. User define information about wallet.

-   wallet name
-   contract version
-   list of owners
-   required no. of signers

Once click create, initialise global state with name, owners, version, threshhold signature

ALL functions in smart contract will check if sender equal multisig address

Flow of work

1. Write up python file for contract first. Creation function should receive number of owners associated.
