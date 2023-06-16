import algosdk from "algosdk";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { getAlgodClient } from "../clients";

const creator = algosdk.mnemonicToSecretKey(
    process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC
);
const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

console.log(creator);
console.log(process.env.NEXT_PUBLIC_NETWORK);
(async () => {
    const suggestedParams = await algodClient.getTransactionParams().do();
    const creator = algosdk.mnemonicToSecretKey(
        process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC
    );
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: creator.addr,
        to: "L5FE66M2UHHD6HC7YB3GHS5GBTCJGMBRZPNFMLSPVM2WYSTAMLWXRVTOSU",
        amount: 1e6,
        suggestedParams,
    });

    const signedTxn = paymentTxn.signTxn(creator.sk);
    // const { txn } = algosdk.decodeSignedTransaction(signedTxn);
    let tx = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction : " + tx.txId);
    console.log(await algodClient.status().do());
    // check results of very last txn
    let confirmedTxn = await algosdk.waitForConfirmation(
        algodClient,
        tx.txId,
        4
    );
    console.log(confirmedTxn);
})();
