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
        ],
        accounts: owners,
    });
    const decodedAppCreateTxn = algosdk.encodeUnsignedTransaction(appCreateTxn);
    return decodedAppCreateTxn;
};

module.exports = {
    createScwTxn,
};
