"use client";
import { useWallet } from "@txnlab/use-wallet";
import { useState, useEffect, useContext, createContext } from "react";
import algosdk from "algosdk";
import { getAlgodClient } from "../../../clients";
import { readGlobalState } from "../../../actions";
import Transactions from "../../components/transactions";
import WalletContext from "@/app/components/walletContext";
const { v4: uuidv4 } = require("uuid");

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);
const contractData = require("../../../../artifacts/SmartContractWallet/contract.json");
const contract = new algosdk.ABIContract(contractData);

export default function Page({ params, searchParams }) {
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

    const [txns, setTxns] = useState([]);
    const [count, setCount] = useState(0);
    const [renderWallet, setRenderWallet] = useState(false);
    const [accInfo, setAccInfo] = useState(null);
    const [appInfo, setAppInfo] = useState(null);

    const appId = params.id;
    const appAddr = algosdk.getApplicationAddress(parseInt(appId));

    const handleWalletRender = () => {
        console.log("Re rendering wallet");
        setRenderWallet(!renderWallet);
    };

    const handleSendAlgos = async (appId, activeAddress, signer) => {
        // Create payment app call transaction
        const transactionId = uuidv4(); // Initialise txn uuid
        const atc = new algosdk.AtomicTransactionComposer();
        const suggestedParams = await algodClient.getTransactionParams().do();
        const commonParams = {
            appID: appId,
            sender: activeAddress,
            suggestedParams,
            signer,
        };
        const trfAlgosAppCall = {
            method: contract.getMethodByName("send_algos"),
            appAccounts: [
                "L7ULOG442UZG46XLFOMZNPJ7GXWM3HP5LOZZFF3QI323JLS4CXHTEL6WQA",
            ],
            methodArgs: [parseInt(100000), transactionId],
            ...commonParams,
        };
        atc.addMethodCall(trfAlgosAppCall);
        const txnGrp = atc.buildGroup();
        const txn = txnGrp[0].txn;

        const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
        const txnNameUint8Arr = new Uint8Array(Buffer.from(transactionId));

        // Make app call to store transaction in boxes
        const storeTxnAppCall = {
            method: contract.getMethodByName("add_txn"),
            methodArgs: [transactionId, encodedTxn],
            boxes: [{ appIndex: 0, name: txnNameUint8Arr }],
            ...commonParams,
        };
        const atc2 = new algosdk.AtomicTransactionComposer();
        atc2.addMethodCall(storeTxnAppCall);
        const result = await atc2.execute(algodClient, 4);
    };

    // Fetch wallet information e.g. name, balance, address
    useEffect(() => {
        const getWalletInfo = async () => {
            console.log("Fetching wallet info");
            const info = await algodClient.accountInformation(appAddr).do();
            const appGlobalStateDecodedObject = await readGlobalState(
                parseInt(appId)
            );
            setAccInfo(info);
            setAppInfo(appGlobalStateDecodedObject);
        };
        getWalletInfo();
    }, [renderWallet]);

    // Fetch current pending transactions from boxes
    useEffect(() => {
        const getBoxNames = async () => {
            const boxesResponse = await algodClient
                .getApplicationBoxes(parseInt(appId))
                .do();
            const txnsInfo = await Promise.all(
                boxesResponse.boxes.map(async (box) => {
                    const boxResponse = await algodClient
                        .getApplicationBoxByName(parseInt(appId), box.name)
                        .do();
                    const boxValue = boxResponse.value;
                    console.log(boxValue);
                    const signaturesCount = parseInt(
                        boxValue.slice(7, 8)
                    ).toString();
                    const txnDecoded = algosdk.decodeUnsignedTransaction(
                        boxValue.slice(8)
                    );
                    return {
                        name: Buffer.from(
                            boxResponse.name,
                            "base64"
                        ).toString(),
                        txn: txnDecoded,
                        signatures: parseInt(signaturesCount),
                    };
                })
            );
            setTxns(txnsInfo);
        };
        getBoxNames();
    }, [count, renderWallet]);

    return (
        <WalletContext.Provider value={{ handleWalletRender }}>
            {appInfo && (
                <section>
                    <div className="bg-white m-8 rounded-lg p-4">
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
                    <button
                        onClick={() => {
                            console.log(renderWallet);
                        }}
                    >
                        Test
                    </button>
                    <button
                        onClick={async () => {
                            await handleSendAlgos(
                                parseInt(appId),
                                activeAddress,
                                signer
                            );
                            setCount((prevCount) => prevCount + 1);
                        }}
                    >
                        Send algos
                    </button>
                    <Transactions txns={txns} appId={appId} appInfo={appInfo} />
                </section>
            )}
        </WalletContext.Provider>
    );
}
