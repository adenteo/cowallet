"use client";
import { Fragment, useContext, useState } from "react";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { GoAlert } from "react-icons/go";
import {
    Accordion,
    AccordionHeader,
    AccordionBody,
    Alert,
    Button,
    Typography,
} from "@material-tailwind/react";
import algosdk, { decodeUint64 } from "algosdk";
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
    const [signTxnSuccessAlertOpen, setSignTxnSuccessAlertOpen] =
        useState(false);
    const [signTxnFailureAlertOpen, setSignTxnFailureAlertOpen] =
        useState(false);
    const [executeTxnSuccessAlertOpen, setExecuteTxnSuccessAlertOpen] =
        useState(false);
    const [executeTxnFailureAlertOpen, setExecuteTxnFailureAlertOpen] =
        useState(false);
    const { activeAddress, signer } = useWallet();

    const handleOpen = (value) => {
        setOpen(open === value ? 0 : value);
    };

    const handleExecution = async (txn, name) => {
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
        try {
            const result = await atc.execute(algodClient, 4);
        } catch (err) {
            console.log(err);
            setExecuteTxnFailureAlertOpen(true);
            return;
        }
        setExecuteTxnSuccessAlertOpen(true);
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
        try {
            const result = await atc.execute(algodClient, 4);
            setSignTxnSuccessAlertOpen(true);
        } catch (err) {
            setSignTxnFailureAlertOpen(true);
            return;
        }

        handleWalletRender();
    };

    return (
        <Fragment>
            {txns.map((txn, index) => (
                <Accordion
                    key={index + 1}
                    open={open === index + 1}
                    icon={<Icon id={index + 1} open={open} />}
                    className="static border-b-2 border-slate-300 p-3"
                >
                    <AccordionHeader
                        onClick={() => handleOpen(index + 1)}
                        className="text-xs justify-evenly font-bold"
                    >
                        <div>{txn.txn.name}</div>
                        <div>
                            Signatures: {txn.signatures} of {appInfo.threshold}{" "}
                        </div>
                        {txn.signatures >= appInfo.threshold ? (
                            <span className="flex w-3 h-3 bg-green-500 rounded-full"></span>
                        ) : (
                            <span className="flex w-3 h-3 bg-red-500 rounded-full"></span>
                        )}
                    </AccordionHeader>
                    <AccordionBody className="text-xs p-4">
                        <h1 className="font-bold text-base mb-2">
                            Transaction Details:
                        </h1>
                        <div className="flex">
                            <label className="font-semibold">Sender:</label>
                            <span className="overflow-hidden text-ellipsis ml-1">
                                {algosdk.encodeAddress(txn.txn.from.publicKey)}
                            </span>
                        </div>
                        <div className="flex">
                            <label className="font-semibold">Receiver:</label>
                            <span className="overflow-hidden text-ellipsis ml-1">
                                {algosdk.encodeAddress(
                                    txn.txn.appAccounts[0].publicKey
                                )}
                            </span>
                        </div>
                        <div className="flex">
                            <label className="font-semibold">Amount:</label>
                            <span className="overflow-hidden text-ellipsis ml-1">
                                {decodeUint64(txn.txn.appArgs[1]) / 1e6} ALGOs
                            </span>
                        </div>
                        <div className="flex">
                            <label className="font-semibold">Fee:</label>
                            <span className="overflow-hidden text-ellipsis ml-1">
                                {txn.txn.fee / 1e6}
                                {" ALGOs"}
                            </span>
                        </div>
                        <div className="flex">
                            <label className="font-semibold">
                                First round:
                            </label>
                            <span className="overflow-hidden text-ellipsis ml-1">
                                {txn.txn.firstRound}
                            </span>
                        </div>
                        <div className="flex">
                            <label className="font-semibold">Last round:</label>
                            <span className="overflow-hidden text-ellipsis ml-1">
                                {txn.txn.lastRound}
                            </span>
                        </div>
                        <div>
                            {txn.signatures >= appInfo.threshold ? (
                                <button
                                    onClick={async () => {
                                        await handleExecution(
                                            txn.txn,
                                            txn.name
                                        );
                                    }}
                                    className="bg-green-600 p-3 rounded-md text-white mt-2"
                                >
                                    Execute Transaction
                                </button>
                            ) : txn.signers.includes(activeAddress) ? (
                                <button
                                    disabled
                                    className="bg-slate-500 p-3 rounded-md text-white mt-2"
                                >
                                    Transaction signed
                                </button>
                            ) : (
                                <button
                                    onClick={async () => {
                                        await handleSignTxn(txn.name);
                                    }}
                                    className="bg-slate-800 p-3 rounded-md text-white mt-2 hover:scale-105"
                                >
                                    Sign Transaction
                                </button>
                            )}
                        </div>
                    </AccordionBody>
                </Accordion>
            ))}
            {/* ALERT CONTENTS */}
            <Alert
                className="absolute bg-red-700 bottom-20 p-4 w-4/5 left-[10%]"
                variant="gradient"
                color="red"
                open={signTxnFailureAlertOpen}
                icon={<GoAlert className="h-6 w-6 mr-2" />}
                action={
                    <Button
                        variant="text"
                        color="white"
                        size="sm"
                        className="!absolute top-3 right-3"
                        onClick={() => setSignTxnFailureAlertOpen(false)}
                    >
                        Close
                    </Button>
                }
            >
                Failed to sign transaction. Please try again.
            </Alert>
            <Alert
                className="absolute bg-red-700 bottom-20 p-4 w-4/5 left-[10%]"
                variant="gradient"
                color="red"
                open={executeTxnFailureAlertOpen}
                icon={<GoAlert className="h-6 w-6 mr-2" />}
                action={
                    <Button
                        variant="text"
                        color="white"
                        size="sm"
                        className="!absolute top-3 right-3"
                        onClick={() => setExecuteTxnFailureAlertOpen(false)}
                    >
                        Close
                    </Button>
                }
            >
                Failed to execute transaction. Please try again.
            </Alert>
            <Alert
                open={signTxnSuccessAlertOpen}
                color="green"
                className="absolute bg-green-500 bottom-20 p-2 w-4/5 left-[10%]"
                icon={<AiOutlineCheckCircle className="mt-px h-6 w-6 mr-2" />}
                action={
                    <Button
                        variant="text"
                        color="white"
                        size="sm"
                        className="!absolute top-3 right-3"
                        onClick={() => setSignTxnSuccessAlertOpen(false)}
                    >
                        Close
                    </Button>
                }
            >
                <Typography variant="h5" color="white">
                    Success
                </Typography>
                <Typography color="white" className="mt-2 font-normal">
                    Successfully signed transaction.
                </Typography>
            </Alert>
            <Alert
                open={executeTxnSuccessAlertOpen}
                color="green"
                className="absolute bg-green-500 bottom-20 p-2 w-4/5 left-[10%]"
                icon={<AiOutlineCheckCircle className="mt-px h-6 w-6 mr-2" />}
                action={
                    <Button
                        variant="text"
                        color="white"
                        size="sm"
                        className="!absolute top-3 right-3"
                        onClick={() => setExecuteTxnSuccessAlertOpen(false)}
                    >
                        Close
                    </Button>
                }
            >
                <Typography variant="h5" color="white">
                    Success
                </Typography>
                <Typography color="white" className="mt-2 font-normal">
                    Successfully executed transaction.
                </Typography>
            </Alert>
        </Fragment>
    );
}
