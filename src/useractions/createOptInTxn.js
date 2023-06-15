import algosdk from "algosdk";
import { getAlgodClient } from "../clients";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

const createOptInTxn = async (addr, appId) => {
    const acc = await algodClient.accountInformation(addr).do();
    const localStates = acc["apps-local-state"];

    const appLocalState = localStates.find((ls) => {
        return ls.id === appId;
    });

    // account has already opted into app
    if (appLocalState !== undefined) return;

    const suggestedParams = await algodClient.getTransactionParams().do();

    const appOptInTxn = algosdk.makeApplicationOptInTxnFromObject({
        from: addr,
        appIndex: appId,
        suggestedParams,
    });
    return appOptInTxn;
};
module.exports = {
    createOptInTxn,
};
