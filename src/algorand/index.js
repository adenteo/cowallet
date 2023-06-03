import algosdk from "algosdk";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { getAlgodClient } from "../clients/index";
dotenv.config({ path: "./.env.local" });

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

const submitToNetwork = async (signedTxns) => {
    // send txn
    const response = await algodClient.sendRawTransaction(signedTxns).do();

    // Wait for transaction to be confirmed
    const confirmation = await algosdk.waitForConfirmation(
        algodClient,
        response.txId,
        4
    );

    return {
        response,
        confirmation,
    };
};

const fundAccount = async (fromAccount, to, amount) => {
    let suggestedParams = await algodClient.getTransactionParams().do();

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: fromAccount.addr,
        to,
        amount,
        suggestedParams,
    });

    const signedTxn = txn.signTxn(fromAccount.sk);
    return await submitToNetwork(signedTxn);
};

const getBasicProgramBytes = async (relativeFilePath) => {
    // Read file for Teal code
    const filePath = path.join(__dirname, relativeFilePath);
    const data = fs.readFileSync(filePath);

    // use algod to compile the program
    const compiledProgram = await algodClient.compile(data).do();
    return new Uint8Array(Buffer.from(compiledProgram.result, "base64"));
};

const getMethodByName = (methodName, appName) => {
    // Read in the local contract.json file
    const source = path.join(
        __dirname,
        `../../artifacts/${appName}/contract.json`
    );
    const buff = fs.readFileSync(source);

    // Parse the json file into an object, pass it to create an ABIContract object
    const contract = new algosdk.ABIContract(JSON.parse(buff.toString()));

    const method = contract.methods.find((mt) => mt.name === methodName);

    if (method === undefined) throw Error("Method undefined: " + method);

    return method;
};

const makeATCCall = async (txns) => {
    // create atomic transaction composer
    const atc = new algosdk.AtomicTransactionComposer();

    // add calls to atc
    txns.forEach((txn) => {
        if (txn.method !== undefined) {
            atc.addMethodCall(txn);
        } else {
            atc.addTransaction(txn);
        }
    });

    // execute
    const result = await atc.execute(algodClient, 10);

    return result;
};

module.exports = {
    getMethodByName,
    getBasicProgramBytes,
    makeATCCall,
    fundAccount,
    submitToNetwork,
};
