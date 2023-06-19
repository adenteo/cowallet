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
    console.log("Wallet creation transaction : " + tx.txId);
    let result = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);
    return result["application-index"];
};

const sendAlgosTxn = async (
    appId,
    sender,
    signer,
    receiver,
    amount,
    shouldOptIn
) => {
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
        boxes: [{ appIndex: 0, name: txnNameUint8Arr }],
        ...commonParams,
    };
    atc.addMethodCall(trfAlgosAppCall);
    const txnGrp = atc.buildGroup();
    const txn = txnGrp[0].txn;
    const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
    const txnType = "0";
    // Make app call to store send algos txn
    const storeTxnAppCall = {
        method: contract.getMethodByName("add_txn"),
        methodArgs: [transactionId, encodedTxn, txnType],
        boxes: [{ appIndex: 0, name: txnNameUint8Arr }],
        ...commonParams,
    };
    const atc2 = new algosdk.AtomicTransactionComposer();
    const optInTxn = await createOptInTxn(sender, parseInt(appId));
    if (optInTxn && shouldOptIn) {
        console.log("Adding Opt-in txn.");
        atc2.addTransaction({ txn: optInTxn, signer });
    }
    atc2.addMethodCall(storeTxnAppCall);
    const result = await atc2.execute(algodClient, 4);
    return { result: result, boxName: transactionId };
};

const sendASATxn = async (
    appId,
    sender,
    signer,
    receiver,
    amount,
    assetId,
    shouldOptIn
) => {
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
    const optInTxn = await createOptInTxn(sender, parseInt(appId));
    if (optInTxn && shouldOptIn) {
        console.log("Adding Opt-in txn.");
        atc2.addTransaction({ txn: optInTxn, signer });
    }
    atc2.addMethodCall(storeTxnAppCall);
    const result = await atc2.execute(algodClient, 4);
    return { result: result, boxName: transactionId };
};

const sendOptInTxn = async (appId, sender, signer, assetId, shouldOptIn) => {
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
    const optInMethod = algosdk.getMethodByName(contract.methods, "opt_in_ASA");
    atc.addMethodCall({
        suggestedParams,
        sender,
        signer,
        appID: parseInt(appId),
        method: optInMethod,
        methodArgs: [transactionId],
        appForeignAssets: [parseInt(assetId)],
        boxes: [{ appIndex: 0, name: txnNameUint8Arr }],
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
    const optInTxn = await createOptInTxn(sender, parseInt(appId));
    if (optInTxn && shouldOptIn) {
        console.log("Adding Opt-in txn.");
        atc2.addTransaction({ txn: optInTxn, signer });
    }
    atc2.addMethodCall(storeTxnAppCall);
    const result = await atc2.execute(algodClient, 4);
    return { result: result, boxName: transactionId };
};

const handleSignTxn = async (appId, sender, signer, name, shouldOptIn) => {
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
    const optInTxn = await createOptInTxn(sender, parseInt(appId));
    if (optInTxn && shouldOptIn) {
        console.log("Adding Opt-in txn.");
        atc.addTransaction({ txn: optInTxn, signer });
    }
    atc.addMethodCall(signTxnAppCall);
    const result = await atc.execute(algodClient, 4);
};

const isOptedIn = async (addr, assetId) => {
    const acc = await algodClient.accountInformation(addr).do();
    const holdingAssets = acc["assets"];
    const holdingAsset = holdingAssets.find((asset) => {
        return asset["asset-id"] == assetId;
    });
    // Already opted into asset
    if (holdingAsset !== undefined) return true;
    return false;
};

// START OF TESTS

describe("Negative Tests", function () {
    let appId;
    let appAddr;
    let appInfo;
    let appGlobalStateDecodedObject;
    const owner1 = algosdk.generateAccount();
    const owner2 = algosdk.generateAccount();
    const owner1Signer = algosdk.makeBasicAccountTransactionSigner(owner1);
    const owner2Signer = algosdk.makeBasicAccountTransactionSigner(owner2);
    const signer = algosdk.makeBasicAccountTransactionSigner(creator);
    const nonOwner = algosdk.generateAccount();
    const nonOwnerSigner = algosdk.makeBasicAccountTransactionSigner(nonOwner);
    const assetId = 124;

    this.beforeAll(async () => {
        // Deploy Smart Wallet Contract with 3 owners and signing threshold of 2.
        const owners = [creator.addr, owner1.addr, owner2.addr];
        appId = await submitScwTxn("wallet", "1", "2", creator.addr, owners);
        appAddr = algosdk.getApplicationAddress(parseInt(appId));
        console.log("Deployed Smart Contract Wallet: " + appId);
        // Fund wallet and owners
        await fundAccount(appAddr, 5e6);
        await fundAccount(owner1.addr, 1e6);
        await fundAccount(owner2.addr, 1e6);
        await fundAccount(nonOwner.addr, 1e6);
        appInfo = await algodClient.accountInformation(appAddr).do();
        appGlobalStateDecodedObject = await readGlobalState(parseInt(appId));
    });

    it("Non-owner cannot add send algos transaction to box storage", async () => {
        const receiver = algosdk.generateAccount();
        await expect(
            sendAlgosTxn(
                appId,
                nonOwner.addr,
                nonOwnerSigner,
                receiver.addr,
                0.1,
                true
            )
        ).to.be.rejectedWith(Error);
    });

    it("Non-owner cannot add send ASA transaction to box storage", async () => {
        const receiver = algosdk.generateAccount();
        await expect(
            sendASATxn(
                appId,
                nonOwner.addr,
                nonOwnerSigner,
                receiver.addr,
                0.1,
                assetId,
                true
            )
        ).to.be.rejectedWith(Error);
    });

    it("Non-owner cannot add OPT-IN transaction to box storage", async () => {
        await expect(
            sendOptInTxn(appId, nonOwner.addr, nonOwnerSigner, assetId, true)
        ).to.be.rejectedWith(Error);
    });

    it("Owner not opted into wallet cannot add send algos transaction to box storage", async () => {
        const receiver = algosdk.generateAccount();
        await expect(
            sendAlgosTxn(appId, creator.addr, signer, receiver.addr, 0.1, false)
        ).to.be.rejectedWith(Error);
    });

    it("Owner not opted into wallet cannot add send ASA transaction to box storage", async () => {
        const receiver = algosdk.generateAccount();
        await expect(
            sendASATxn(
                appId,
                creator.addr,
                signer,
                receiver.addr,
                1,
                assetId,
                false
            )
        ).to.be.rejectedWith(Error);
    });

    it("Owner not opted into wallet cannot add OPT-IN transaction to box storage", async () => {
        await expect(
            sendOptInTxn(appId, creator.addr, signer, assetId, false)
        ).to.be.rejectedWith(Error);
    });

    it("Non owner cannot successfully sign pending transactions created by other owners in box storage", async () => {
        const signer = algosdk.makeBasicAccountTransactionSigner(creator);
        // Create pending transaction with creator
        const { result, boxName } = await sendOptInTxn(
            appId,
            creator.addr,
            signer,
            assetId,
            true
        );
        const boxResponseBefore = await algodClient
            .getApplicationBoxByName(parseInt(appId), boxName)
            .do();
        const boxValueBefore = boxResponseBefore.value;
        let initialSigners = [];
        boxValueBefore
            .slice(0, appGlobalStateDecodedObject.ownersCount)
            .forEach((value, index) => {
                if (value === 49) {
                    initialSigners.push(appGlobalStateDecodedObject[index]);
                }
            });
        // Sign with non-owner
        await expect(
            handleSignTxn(appId, nonOwner.addr, nonOwnerSigner, boxName, true)
        ).to.be.rejectedWith(Error);
    });

    it("Non owner cannot successfully execute pending transactions created by other owners in box storage", async () => {
        const signer = algosdk.makeBasicAccountTransactionSigner(creator);
        // Create pending transaction with creator
        const { result, boxName } = await sendOptInTxn(
            appId,
            creator.addr,
            signer,
            assetId,
            true
        );
        const boxResponse = await algodClient
            .getApplicationBoxByName(parseInt(appId), boxName)
            .do();
        const boxValue = boxResponse.value;
        const txnDecoded = algosdk.decodeUnsignedTransaction(
            boxValue.slice(appGlobalStateDecodedObject.ownersCount + 1)
        );
        // Sign with another owner to meet threshold
        await handleSignTxn(appId, owner1.addr, owner1Signer, boxName, true);
        // Execute transaction with non-owner
        const atc = new algosdk.AtomicTransactionComposer();
        atc.addTransaction({ txn: txnDecoded, signer: nonOwnerSigner });
        await expect(atc.execute(algodClient, 4)).to.be.rejectedWith(Error);
    });

    it("Non opted-in owner cannot successfully execute pending transactions created by other owners in box storage", async () => {
        const signer = algosdk.makeBasicAccountTransactionSigner(creator);
        // Create pending transaction with creator
        const { result, boxName } = await sendOptInTxn(
            appId,
            creator.addr,
            signer,
            assetId,
            true
        );
        const boxResponse = await algodClient
            .getApplicationBoxByName(parseInt(appId), boxName)
            .do();
        const boxValue = boxResponse.value;
        const txnDecoded = algosdk.decodeUnsignedTransaction(
            boxValue.slice(appGlobalStateDecodedObject.ownersCount + 1)
        );
        // Sign with another owner to meet threshold
        await handleSignTxn(appId, owner1.addr, owner1Signer, boxName, true);
        // Execute transaction with non-opted-in owner
        const atc = new algosdk.AtomicTransactionComposer();
        atc.addTransaction({ txn: txnDecoded, owner2Signer });
        await expect(atc.execute(algodClient, 4)).to.be.rejectedWith(Error);
    });
});
