import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import algosdk from "algosdk";
import { getBasicProgramBytes } from "../src/algorand";
import { getAlgodClient } from "../src/clients";
import { readGlobalState } from "../src/actions";
import { fundAccount } from "../src/actions/fundAccount";
import * as dotenv from "dotenv";
import { createOptInTxn } from "../src/useractions/createOptInTxn";
const { v4: uuidv4 } = require("uuid");
dotenv.config({ path: "./.env.local" });
const smartWalletContract = require("../artifacts/SmartContractWallet/contract.json");

const contract = new algosdk.ABIContract(smartWalletContract);

// use chai-as-promise library
chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect;

const creator = algosdk.mnemonicToSecretKey(
    process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC
);

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

const submitScwTxn = async (
    name,
    version,
    threshold,
    activeAddress,
    owners
) => {
    const suggestedParams = await algodClient.getTransactionParams().do();
    // programs
    const approvalProgram = await getBasicProgramBytes(
        "../../artifacts/SmartContractWallet/approval.teal"
    );
    const clearProgram = await getBasicProgramBytes(
        "../../artifacts/SmartContractWallet/clear.teal"
    );

    const numGlobalInts = 3;
    const numGlobalByteSlices = owners.length + 1;
    const numLocalInts = 0;
    const numLocalByteSlices = 1;
    const createMethodSelector = algosdk
        .getMethodByName(contract.methods, "create")
        .getSelector();

    let mergedOwners = new Uint8Array(32 * owners.length);
    let offset = 0;
    owners.forEach((owner) => {
        const ownerUint8 = algosdk.decodeAddress(owner);
        mergedOwners.set(ownerUint8.publicKey, offset);
        offset += 32;
    });

    const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
        from: activeAddress,
        approvalProgram,
        clearProgram,
        numGlobalByteSlices,
        numGlobalInts,
        numLocalByteSlices,
        numLocalInts,
        suggestedParams,
        appArgs: [
            createMethodSelector,
            new algosdk.ABIStringType().encode(name),
            new algosdk.ABIByteType().encode(parseInt(version)),
            new algosdk.ABIByteType().encode(parseInt(threshold)),
            new algosdk.ABIByteType().encode(parseInt(owners.length)),
        ],
        note: mergedOwners,
    });

    const signedTxn = appCreateTxn.signTxn(creator.sk);
    let tx = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction : " + tx.txId);
    let result = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);
    return result["application-index"];
};

const sendAlgosTxn = async (appId, sender, signer, receiver, amount) => {
    const transactionId = uuidv4();
    const txnNameUint8Arr = new Uint8Array(Buffer.from(transactionId));
    const atc = new algosdk.AtomicTransactionComposer();
    const suggestedParams = await algodClient.getTransactionParams().do();
    const commonParams = {
        appID: parseInt(appId),
        sender,
        suggestedParams,
        signer,
    };
    const trfAlgosAppCall = {
        method: contract.getMethodByName("send_algos"),
        appAccounts: [receiver],
        methodArgs: [parseInt(amount * 1e6), transactionId],
        ...commonParams,
    };
    atc.addMethodCall(trfAlgosAppCall);
    const txnGrp = atc.buildGroup();
    const txn = txnGrp[0].txn;

    const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
    const txnType = "0";
    const storeTxnAppCall = {
        method: contract.getMethodByName("add_txn"),
        methodArgs: [transactionId, encodedTxn, txnType],
        boxes: [{ appIndex: 0, name: txnNameUint8Arr }],
        ...commonParams,
    };
    const atc2 = new algosdk.AtomicTransactionComposer();
    atc2.addMethodCall(storeTxnAppCall);
    const result = await atc2.execute(algodClient, 4);
    return { result: result, boxName: transactionId };
};

const sendASATxn = async (appId, sender, signer, receiver, amount, assetId) => {
    const transactionId = uuidv4();
    const txnNameUint8Arr = new Uint8Array(Buffer.from(transactionId));
    const atc = new algosdk.AtomicTransactionComposer();
    const suggestedParams = await algodClient.getTransactionParams().do();
    const commonParams = {
        appID: parseInt(appId),
        sender,
        suggestedParams,
        signer,
    };
    const sendASAMethod = algosdk.getMethodByName(contract.methods, "send_ASA");
    atc.addMethodCall({
        suggestedParams,
        sender,
        signer,
        appID: parseInt(appId),
        method: sendASAMethod,
        methodArgs: [parseInt(amount), transactionId],
        appAccounts: [receiver],
        appForeignAssets: [parseInt(assetId)],
    });
    const txnGrp = atc.buildGroup();
    const txn = txnGrp[0].txn;

    const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
    const txnType = "0";
    const storeTxnAppCall = {
        method: contract.getMethodByName("add_txn"),
        methodArgs: [transactionId, encodedTxn, txnType],
        boxes: [{ appIndex: 0, name: txnNameUint8Arr }],
        ...commonParams,
    };
    const atc2 = new algosdk.AtomicTransactionComposer();
    atc2.addMethodCall(storeTxnAppCall);
    const result = await atc2.execute(algodClient, 4);
    return { result: result, boxName: transactionId };
};

const sendOptInTxn = async (appId, sender, signer, assetId) => {
    const transactionId = uuidv4();
    console.log(transactionId);
    const txnNameUint8Arr = new Uint8Array(Buffer.from(transactionId));
    const atc = new algosdk.AtomicTransactionComposer();
    const suggestedParams = await algodClient.getTransactionParams().do();
    const commonParams = {
        appID: parseInt(appId),
        sender,
        suggestedParams,
        signer,
    };
    const optInMethod = algosdk.getMethodByName(contract.methods, "opt_in_ASA");
    atc.addMethodCall({
        suggestedParams,
        sender,
        signer,
        appID: parseInt(appId),
        method: optInMethod,
        methodArgs: [transactionId],
        appForeignAssets: [parseInt(assetId)],
    });

    const txnGrp = atc.buildGroup();
    const txn = txnGrp[0].txn;
    const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
    const txnType = "2";
    const storeTxnAppCall = {
        method: contract.getMethodByName("add_txn"),
        methodArgs: [transactionId, encodedTxn, txnType],
        boxes: [{ appIndex: 0, name: txnNameUint8Arr }],
        ...commonParams,
    };
    const atc2 = new algosdk.AtomicTransactionComposer();
    atc2.addMethodCall(storeTxnAppCall);
    const result = await atc2.execute(algodClient, 4);
    return { result: result, boxName: transactionId };
};

const handleSignTxn = async (appId, sender, signer, name) => {
    const atc = new algosdk.AtomicTransactionComposer();
    const suggestedParams = await algodClient.getTransactionParams().do();
    const commonParams = {
        appID: parseInt(appId),
        sender,
        suggestedParams,
        signer,
    };
    const signTxnAppCall = {
        method: contract.getMethodByName("sign_txn"),
        methodArgs: [name],
        boxes: [{ appIndex: 0, name: new Uint8Array(Buffer.from(name)) }],
        ...commonParams,
    };
    atc.addMethodCall(signTxnAppCall);
    const optInTxn = await createOptInTxn(sender, parseInt(appId));
    if (optInTxn) {
        console.log("Adding Opt-in txn.");
        atc.addTransaction({ txn: optInTxn, signer });
    }
    const result = await atc.execute(algodClient, 4);
};
// START OF TESTS

describe("Success Tests", function () {
    let appId;
    let appAddr;
    let appInfo;
    let appGlobalStateDecodedObject;
    const owner1 = algosdk.generateAccount();
    const owner2 = algosdk.generateAccount();
    const owner1Signer = algosdk.makeBasicAccountTransactionSigner(owner1);
    const owner2Signer = algosdk.makeBasicAccountTransactionSigner(owner2);
    const assetId = 124;

    this.beforeAll(async () => {
        // Deploy Smart Wallet Contract with 3 owners and signing threshold of 2.
        const owners = [creator.addr, owner1.addr, owner2.addr];
        appId = await submitScwTxn("wallet", "1", "1", creator.addr, owners);
        appAddr = algosdk.getApplicationAddress(parseInt(appId));
        console.log("Deployed Smart Contract Wallet: " + appId);
        // Fund wallet and owners
        await fundAccount(appAddr, 1e6);
        await fundAccount(owner1.addr, 1e6);
        await fundAccount(owner2.addr, 1e6);
        appInfo = await algodClient.accountInformation(appAddr).do();
        appGlobalStateDecodedObject = await readGlobalState(parseInt(appId));
    });

    // it("Successfully deploy and fund smart wallet contract", async () => {
    //     assert.isDefined(appId);
    //     assert.equal(appInfo.amount, 1e6);
    // });

    // it("Successfully initialised wallet with owners and other global states", async () => {
    //     assert.equal(appGlobalStateDecodedObject.name, "wallet"); //name
    //     assert.equal(appGlobalStateDecodedObject.ownersCount, "3"); //ownersCount
    //     assert.equal(appGlobalStateDecodedObject.threshold, "2"); //name
    //     assert.equal(appGlobalStateDecodedObject.version, "1"); //version
    //     assert.equal(appGlobalStateDecodedObject[0], creator.addr); //creator
    //     assert.equal(appGlobalStateDecodedObject[1], owner1.addr); //owner1
    //     assert.equal(appGlobalStateDecodedObject[2], owner2.addr); //owner2
    // });

    // it("Wallet can successfully opt in and receive ASAs", async() => {
    // const suggestedParams = await algodClient.getTransactionParams().do();
    // const signer = algosdk.makeBasicAccountTransactionSigner(creator);
    // const optInMethod = algosdk.getMethodByName(
    //     contract.methods,
    //     "opt_in_ASA"
    // );
    // const atc = new algosdk.AtomicTransactionComposer();
    // atc.addMethodCall({
    //     suggestedParams,
    //     sender: creator.addr,
    //     signer,
    //     appID: parseInt(appId),
    //     method: optInMethod,
    //     methodArgs: [transactionId],
    //     appForeignAssets: [parseInt(optInAssetId)],
    // });
    // })

    // it("Owner can successfully add send algos transaction to box storage", async () => {
    //     const signer = algosdk.makeBasicAccountTransactionSigner(creator);
    //     const receiver = algosdk.generateAccount();
    //     const { result, boxName } = await sendAlgosTxn(
    //         appId,
    //         creator.addr,
    //         signer,
    //         receiver.addr,
    //         0.1
    //     );
    //     const returnValue = result.methodResults[0].returnValue;
    //     console.log(returnValue);
    //     assert.isDefined(result.methodResults[0].txID);
    //     const boxes = await algodClient
    //         .getApplicationBoxes(parseInt(appId))
    //         .do();
    //     const savedBoxName = new TextDecoder().decode(boxes.boxes[0].name);
    //     assert.equal(boxName, savedBoxName);
    // });

    // it("Owner can successfully add send ASA transaction to box storage", async () => {
    //     const signer = algosdk.makeBasicAccountTransactionSigner(creator);
    //     const receiver = algosdk.generateAccount();
    //     const { result, boxName } = await sendASATxn(
    //         appId,
    //         creator.addr,
    //         signer,
    //         receiver.addr,
    //         0.1,
    //     );
    //     const returnValue = result.methodResults[0].returnValue;
    //     console.log(returnValue);
    //     assert.isDefined(result.methodResults[0].txID);
    //     const boxes = await algodClient
    //         .getApplicationBoxes(parseInt(appId))
    //         .do();
    //     const savedBoxName = new TextDecoder().decode(boxes.boxes[0].name);
    //     assert.equal(boxName, savedBoxName);
    // });

    // it("Owner can successfully add send opt in transaction to box storage", async () => {
    //     const signer = algosdk.makeBasicAccountTransactionSigner(creator);
    //     const { result, boxName } = await sendOptInTxn(
    //         appId,
    //         creator.addr,
    //         signer,
    //         assetId
    //     );
    //     const returnValue = result.methodResults[0].returnValue;
    //     console.log(returnValue);
    //     assert.isDefined(result.methodResults[0].txID);
    //     const boxes = await algodClient
    //         .getApplicationBoxes(parseInt(appId))
    //         .do();
    //     const savedBoxName = new TextDecoder().decode(boxes.boxes[0].name);
    //     assert.equal(boxName, savedBoxName);
    // });

    // it("Owner can successfully sign pending transactions created by other owners in box storage", async () => {
    //     const signer = algosdk.makeBasicAccountTransactionSigner(creator);
    //     // Create pending transaction with creator
    //     const { result, boxName } = await sendOptInTxn(
    //         appId,
    //         creator.addr,
    //         signer,
    //         assetId
    //     );
    //     const boxResponseBefore = await algodClient
    //         .getApplicationBoxByName(parseInt(appId), boxName)
    //         .do();
    //     const boxValueBefore = boxResponseBefore.value;
    //     let initialSigners = [];
    //     boxValueBefore
    //         .slice(0, appGlobalStateDecodedObject.ownersCount)
    //         .forEach((value, index) => {
    //             if (value === 49) {
    //                 initialSigners.push(appGlobalStateDecodedObject[index]);
    //             }
    //         });
    //     // Sign with another owner
    //     await handleSignTxn(appId, owner1.addr, owner1Signer, boxName);
    //     const boxResponseAfter = await algodClient
    //         .getApplicationBoxByName(parseInt(appId), boxName)
    //         .do();
    //     const boxValueAfter = boxResponseAfter.value;
    //     let afterSigners = [];
    //     boxValueAfter
    //         .slice(0, appGlobalStateDecodedObject.ownersCount)
    //         .forEach((value, index) => {
    //             if (value === 49) {
    //                 afterSigners.push(appGlobalStateDecodedObject[index]);
    //             }
    //         });
    //     assert.equal(afterSigners.length - initialSigners.length, 1);
    // });

    it("Smart Contract Wallet can successfully opt into asset", async () => {
        // Create opt in transaction
        const signer = algosdk.makeBasicAccountTransactionSigner(creator);
        const { result, boxName } = await sendOptInTxn(
            appId,
            creator.addr,
            signer,
            assetId
        );
        console.log(appId);
        console.log(boxName);
        const boxResponse = await algodClient
            .getApplicationBoxByName(parseInt(appId), boxName)
            .do();
        const boxValue = boxResponse.value;
        const txnDecoded = algosdk.decodeUnsignedTransaction(
            boxValue.slice(appGlobalStateDecodedObject.ownersCount + 1)
        );
        // Sign transaction with another owner to meet threshold
        // await handleSignTxn(appId, owner1.addr, owner1Signer, boxName);
        // Execute transaction
        const atc = new algosdk.AtomicTransactionComposer();
        atc.addTransaction({ txn: txnDecoded, signer });
        const txnResult = await atc.execute(algodClient, 4);
        console.log(txnResult);
    });

    //owner can create send algos
    //owner can create send asa
    //owner can create send opt in
    //box saved aft creating txn
    //owner can sign
    //owner can execute
    //box removed aft execution
});
