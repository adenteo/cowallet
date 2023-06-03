import algosdk, { ABIStringType, ABITupleType } from "algosdk";
import { getAlgodClient } from "../clients";
import { getBasicProgramBytes } from "../algorand/index";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);
const creator = algosdk.mnemonicToSecretKey(
    process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC
);
const contractData = require("../../artifacts/SmartContractWallet/contract.json");
const contract = new algosdk.ABIContract(contractData);

const createScwTxn = async (creatorAddr, name, version, threshold, owners) => {
    const suggestedParams = await algodClient.getTransactionParams().do();
    // programs
    const approvalProgram = await getBasicProgramBytes(
        "../../../../../artifacts/SmartContractWallet/approval.teal"
    );
    const clearProgram = await getBasicProgramBytes(
        "../../../../../artifacts/SmartContractWallet/clear.teal"
    );

    const numGlobalInts = 3;
    const numGlobalByteSlices = owners.length + 1;
    const numLocalInts = 0;
    const numLocalByteSlices = 0;
    const createMethodSelector = algosdk
        .getMethodByName(contract.methods, "create")
        .getSelector();

    // atc.addMethodCall();
    const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
        from: creatorAddr,
        approvalProgram,
        clearProgram,
        numGlobalByteSlices,
        numGlobalInts,
        numLocalByteSlices,
        numLocalInts,
        suggestedParams,
        // appArgs: [
        //     createMethodSelector,
        //     new algosdk.ABIStringType().encode(name),
        //     new algosdk.ABIByteType().encode(parseInt(version)),
        //     new algosdk.ABIByteType().encode(parseInt(threshold)),
        // ],
        appArgs: [
            createMethodSelector,
            new algosdk.ABIStringType().encode(name),
            new algosdk.ABIByteType().encode(parseInt(version)),
            new algosdk.ABIByteType().encode(parseInt(threshold)),
        ],
    });

    // Sign and send
    await algodClient.sendRawTransaction(appCreateTxn.signTxn(creator.sk)).do();
    const result = await algosdk.waitForConfirmation(
        algodClient,
        appCreateTxn.txID().toString(),
        3
    );
    // Grab app id from confirmed transaction result
    const appId = result["application-index"];
    console.log(`Created app with index: ${appId}`);
    const addOwnerMethod = algosdk.getMethodByName(
        contract.methods,
        "set_owner"
    );
    // console.log(addOwnerMethod);
    // const atc = new algosdk.AtomicTransactionComposer();
    owners.forEach(async (owner, index) => {
        const atc = new algosdk.AtomicTransactionComposer();
        const suggestedParams = await algodClient.getTransactionParams().do();
        atc.addMethodCall({
            suggestedParams,
            sender: creator.addr,
            signer: async (unsignedTxns) =>
                unsignedTxns.map((t) => t.signTxn(creator.sk)),
            appID: parseInt(appId),
            method: addOwnerMethod,
            methodArgs: [index, owner],
        });
        await atc.execute(algodClient, 4);
    });
    // await atc.execute(algodClient, 10);
    console.log("done!");
    // return appCreateTxn;
};

module.exports = {
    createScwTxn,
};
