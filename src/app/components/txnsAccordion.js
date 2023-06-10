"use client";
import { Fragment, useContext, useState } from "react";
import {
    Accordion,
    AccordionHeader,
    AccordionBody,
} from "@material-tailwind/react";
import algosdk from "algosdk";
import { useWallet } from "@txnlab/use-wallet";
import { getAlgodClient } from "../../clients";
import WalletContext from "./walletContext";

const contractData = require("../../../artifacts/SmartContractWallet/contract.json");
const contract = new algosdk.ABIContract(contractData);

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

function Icon({ id, open }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`${
                id === open ? "rotate-180" : ""
            } h-5 w-5 transition-transform`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
            />
        </svg>
    );
}

export default function TxnsAccordion({ txns, appId, appInfo }) {
    const { handleWalletRender } = useContext(WalletContext);
    const [open, setOpen] = useState(0);
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

    const handleOpen = (value) => {
        setOpen(open === value ? 0 : value);
    };

    const handleExecution = async (txn, name) => {
        console.log("executing txn");
        const atc = new algosdk.AtomicTransactionComposer();
        atc.addTransaction({ txn, signer });
        // const result = await atc.execute(algodClient, 4);
        const suggestedParams = await algodClient.getTransactionParams().do();
        const commonParams = {
            appID: parseInt(appId),
            sender: activeAddress,
            suggestedParams,
            signer,
        };
        const removeTxnAppCall = {
            method: contract.getMethodByName("remove_txn"),
            methodArgs: [name],
            boxes: [{ appIndex: 0, name: new Uint8Array(Buffer.from(name)) }],
            ...commonParams,
        };
        atc.addMethodCall(removeTxnAppCall);
        const result = await atc.execute(algodClient, 4);
        handleWalletRender(); //Re-render wallet info
    };

    const handleSignTxn = async (name) => {
        const atc = new algosdk.AtomicTransactionComposer();
        // const result = await atc.execute(algodClient, 4);
        const suggestedParams = await algodClient.getTransactionParams().do();
        const commonParams = {
            appID: parseInt(appId),
            sender: activeAddress,
            suggestedParams,
            signer,
        };
        const signTxnAppCall = {
            method: contract.getMethodByName("sign_txn"),
            methodArgs: [name],
            boxes: [{ appIndex: 0, name: new Uint8Array(Buffer.from(name)) }],
            ...commonParams,
        };
        atc.addMethodCall(signTxnAppCall);
        const result = await atc.execute(algodClient, 4);
        handleWalletRender();
    };

    return (
        <Fragment>
            {txns.map((txn, index) => (
                <Accordion
                    key={index + 1}
                    open={open === index + 1}
                    icon={<Icon id={index + 1} open={open} />}
                >
                    <AccordionHeader onClick={() => handleOpen(index + 1)}>
                        <div>{txn.name}</div>
                        <div>
                            Signatures: {txn.signatures} out of{" "}
                            {appInfo.threshold}{" "}
                        </div>
                        {txn.signatures >= appInfo.threshold ? (
                            <span className="flex w-3 h-3 bg-green-500 rounded-full"></span>
                        ) : (
                            <span className="flex w-3 h-3 bg-red-500 rounded-full"></span>
                        )}
                    </AccordionHeader>
                    <AccordionBody>
                        {algosdk.encodeAddress(txn.txn.from.publicKey)}
                    </AccordionBody>
                    <button
                        className="mx-2"
                        onClick={async () => {
                            await handleExecution(txn.txn, txn.name);
                        }}
                    >
                        Execute Transaction
                    </button>
                    <button
                        onClick={async () => {
                            await handleSignTxn(txn.name);
                        }}
                    >
                        Sign Transaction
                    </button>
                </Accordion>
            ))}
        </Fragment>
    );
}
