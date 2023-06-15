import algosdk from "algosdk";
import { getAlgodClient } from "../clients";
import { getBasicProgramBytes } from "../algorand/index";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);
const contractData = require("../../artifacts/SmartContractWallet/contract.json");
const contract = new algosdk.ABIContract(contractData);

const createScwTxn = async (
    name,
    version,
    threshold,
    activeAddress,
    owners
) => {
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
    const decodedAppCreateTxn = algosdk.encodeUnsignedTransaction(appCreateTxn);
    return decodedAppCreateTxn;
};

module.exports = {
    createScwTxn,
};
