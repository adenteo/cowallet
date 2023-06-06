"use client";
import { useWallet } from "@txnlab/use-wallet";
import { useState, useEffect } from "react";
import algosdk from "algosdk";
import { getAlgodClient } from "../../../clients";
import { readGlobalState } from "../../../actions";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);
const contractData = require("../../../../artifacts/SmartContractWallet/contract.json");
const contract = new algosdk.ABIContract(contractData);

export default function Page({ params, searchParams }) {
    const appId = params.id;
    const appAddr = algosdk.getApplicationAddress(parseInt(appId));
    const [accInfo, setAccInfo] = useState(null);
    const [appInfo, setAppInfo] = useState(null);
    const {
        providers,
        activeAccount,
        isActive,
        isReady,
        activeAddress,
        signer,
        signTransactions,
        sendTransactions,
    } = useWallet();

    const handleSendAlgos = async () => {
        const suggestedParams = await algodClient.getTransactionParams().do();
        const commonParams = {
            appID: parseInt(appId),
            sender: activeAddress,
            suggestedParams,
            signer,
        };
        const trfAlgosAppCall = {
            method: contract.getMethodByName("send_algos"),
            appAccounts: [
                "L7ULOG442UZG46XLFOMZNPJ7GXWM3HP5LOZZFF3QI323JLS4CXHTEL6WQA",
            ],
            methodArgs: [parseInt(100000)],
            ...commonParams,
        };
        const atc = new algosdk.AtomicTransactionComposer();
        atc.addMethodCall(trfAlgosAppCall);
        const txnGrp = atc.buildGroup();
        const txnInfo = txnGrp[0].txn;
        const nameUint8Arr = new Uint8Array(Buffer.from("Txn2"));
        const txnInfoUint8Arr = new Uint8Array(Buffer.from(txnInfo.toString()));
        console.log(txnInfoUint8Arr);
        // add transaction to boxes
        const storeTxnAppCall = {
            method: contract.getMethodByName("add_txn"),
            methodArgs: ["Txn2", txnInfoUint8Arr],
            boxes: [{ appIndex: 0, name: nameUint8Arr }],
            ...commonParams,
        };
        const atc2 = new algosdk.AtomicTransactionComposer();
        atc2.addMethodCall(storeTxnAppCall);
        console.log(atc2);
        const txn = await atc2.execute(algodClient, 4);
        console.log(txn);
    };

    useEffect(() => {
        const getWalletInfo = async () => {
            const info = await algodClient.accountInformation(appAddr).do();
            setAccInfo(info);
            const appGlobalStatesDecodedObject = await readGlobalState(
                parseInt(appId)
            );
            console.log(appGlobalStatesDecodedObject);
            setAppInfo(appGlobalStatesDecodedObject);
            // setAppInfo(appGlobalStatesDecoded);
            // console.log(appInfo);
            // walletVersion = appInfo.find((obj) => obj.version);
            // console.log(walletVersion);
        };
        getWalletInfo();
    }, []);

    return (
        appInfo && (
            <section className="">
                <div className="bg-white m-8 rounded-lg">
                    <div className="px-2 pt-2 text-lg font-bold">
                        {appInfo.name}
                    </div>
                    <div className="px-2 text-xs">Wallet ID: {appId}</div>
                    <div className="px-2 text-xs">
                        Wallet Address: {appAddr}
                    </div>
                    <div className="px-2 text-xs">
                        Balance: {accInfo.amount}
                    </div>
                </div>
                <button onClick={handleSendAlgos}>Send algos</button>
            </section>
        )
    );
}
