import algosdk from "algosdk";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { getAlgodClient } from "../clients";

const creator = algosdk.mnemonicToSecretKey(
    process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC
);
const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

(async () => {
    const suggestedParams = await algodClient.getTransactionParams().do();

    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: creator.addr,
        to: "C4QEEOUXSGX2JISLNDYS2GMNA3R22UW7U43OFLUQHTBIOYK7BYQ7FB3BTM",
        amount: 1000000,
        suggestedParams,
    });

    const signedTxn = paymentTxn.signTxn(creator.sk);
    // const { txn } = algosdk.decodeSignedTransaction(signedTxn);
    let tx = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction : " + tx.txId);

    // check results of very last txn
    let confirmedTxn = await algosdk.waitForConfirmation(
        algodClient,
        tx.txID,
        4
    );
})();