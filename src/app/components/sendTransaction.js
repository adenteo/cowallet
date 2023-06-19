"use client";
import { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { useWallet } from "@txnlab/use-wallet";
import { getAlgodClient } from "../../clients";
import algosdk from "algosdk";
import {
    Popover,
    PopoverHandler,
    PopoverContent,
    Button,
} from "@material-tailwind/react";
import { createOptInTxn } from "../../useractions/createOptInTxn";

const { v4: uuidv4 } = require("uuid");

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);
const contractData = require("../../../artifacts/SmartContractWallet/contract.json");
const contract = new algosdk.ABIContract(contractData);

export default function AddTransaction({
    isCreateTxnPopupOpen,
    setIsCreateTxnPopupOpen,
    appId,
    appAddr,
    accInfo,
    handleWalletRender,
}) {
    const [selectedTxnOption, setSelectedTxnOption] = useState("ALGO");
    const [maxAmount, setMaxAmount] = useState(accInfo.amount / 1e6);
    const [assetsDetails, setAssetsDetails] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState("");
    const [optInAssetId, setOptInAssetId] = useState("");
    const [receiver, setReceiver] = useState("");
    const [receiverMsg, setReceiverMsg] = useState("");
    const [optInErrorMsg, setOptInErrorMsg] = useState("");
    const [amount, setAmount] = useState("");
    const [openPopover, setOpenPopover] = useState(false);
    const [step, setStep] = useState("Details");
    const [loading, setLoading] = useState(false);
    const triggers = {
        onMouseEnter: () => setOpenPopover(true),
        onMouseLeave: () => setOpenPopover(false),
    };

    const { activeAddress, signer } = useWallet();

    const isOptedIn = async (addr, assetId) => {
        const acc = await algodClient.accountInformation(addr).do();
        const holdingAssets = acc["assets"];
        const holdingAsset = holdingAssets.find((asset) => {
            return asset["asset-id"] == assetId;
        });
        // Already opted into asset
        if (holdingAsset !== undefined) return true;
        return false;
    };

    const conductTransactionChecks = async () => {
        if (selectedTxnOption === "OPT-IN") {
            //If opting-in, check if wallet is already opted-in to asset.
            const hasOptedIn = await isOptedIn(appAddr, optInAssetId);
            if (hasOptedIn) {
                setOptInErrorMsg("Wallet already opted into asset.");
                return;
            }
        }
        if (selectedTxnOption === "ASA") {
            //If sending ASA, check if receiver is already opted-in to asset.
            const hasOptedIn = await isOptedIn(receiver, selectedAsset.id);
            if (!hasOptedIn) {
                setReceiverMsg("Receiver is not opted into asset.");
                return;
            }
        }
        try {
            await algodClient.accountInformation(receiver).do();
        } catch (err) {
            setReceiverMsg("Account does not exist.");
            return;
        }
        setStep("Confirmation");
    };

    const handleOptionChange = (event) => {
        setReceiver("");
        setAmount("");
        setOptInAssetId("");
        setReceiverMsg("");
        setOptInErrorMsg("");
        if (event.target.value === "OPT-IN") {
            setReceiver(appAddr);
            setAmount(0);
        } else {
            setReceiver("");
            setAmount("");
            setSelectedAsset("");
        }
        if (event.target.value === "ALGO") {
            setMaxAmount(accInfo.amount / 1e6);
        } else {
            setMaxAmount(-1);
        }
        setSelectedTxnOption(event.target.value);
    };

    const handleAssetChange = (event) => {
        const asset = assetsDetails[event.target.selectedIndex - 1];
        if (asset) {
            setSelectedAsset(asset);
            setMaxAmount(asset.amount);
        } else {
            setSelectedAsset("");
            setMaxAmount(-1);
        }
    };

    const handleSendAlgosTxn = async (transactionId) => {
        // Create payment app call transaction
        const atc = new algosdk.AtomicTransactionComposer();
        const suggestedParams = await algodClient.getTransactionParams().do();
        const commonParams = {
            appID: parseInt(appId),
            sender: activeAddress,
            suggestedParams,
            signer,
        };
        const trfAlgosAppCall = {
            method: contract.getMethodByName("send_algos"),
            appAccounts: [receiver],
            methodArgs: [parseInt(amount * 1e6), transactionId],
            ...commonParams,
        };
        atc.addMethodCall(trfAlgosAppCall);
        const txnGrp = atc.buildGroup();
        const txn = txnGrp[0].txn;

        const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
        return encodedTxn;
    };

    const handleSendASATxn = async (transactionId) => {
        // Opt In and send
        const suggestedParams = await algodClient.getTransactionParams().do();
        const sendASAMethod = algosdk.getMethodByName(
            contract.methods,
            "send_ASA"
        );
        const atc = new algosdk.AtomicTransactionComposer();
        atc.addMethodCall({
            suggestedParams,
            sender: activeAddress,
            signer,
            appID: parseInt(appId),
            method: sendASAMethod,
            methodArgs: [parseInt(amount), transactionId],
            appAccounts: [receiver],
            appForeignAssets: [parseInt(selectedAsset.id)],
        });
        const txnGrp = atc.buildGroup();
        const txn = txnGrp[0].txn;

        const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
        return encodedTxn;
    };

    const handleOptInTxn = async (transactionId) => {
        const suggestedParams = await algodClient.getTransactionParams().do();
        const optInMethod = algosdk.getMethodByName(
            contract.methods,
            "opt_in_ASA"
        );
        const atc = new algosdk.AtomicTransactionComposer();
        atc.addMethodCall({
            suggestedParams,
            sender: activeAddress,
            signer,
            appID: parseInt(appId),
            method: optInMethod,
            methodArgs: [transactionId],
            appForeignAssets: [parseInt(optInAssetId)],
        });
        const txnGrp = atc.buildGroup();
        const txn = txnGrp[0].txn;

        const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
        return encodedTxn;
    };

    const handleAddTxn = async (event) => {
        event.preventDefault();
        setIsCreateTxnPopupOpen(false);
        let encodedTxn;
        const transactionId = uuidv4(); // Initialise txn uuid. There's probably other ways to ensure unique names and save fees with shorter names.
        const txnNameUint8Arr = new Uint8Array(Buffer.from(transactionId));
        const suggestedParams = await algodClient.getTransactionParams().do();
        const commonParams = {
            appID: parseInt(appId),
            sender: activeAddress,
            suggestedParams,
            signer,
        };
        let txnType; // 0: ALGO, 1: ASA, 2: OPT-IN
        if (selectedTxnOption === "ALGO") {
            encodedTxn = await handleSendAlgosTxn(transactionId);
            txnType = "0";
        } else if (selectedTxnOption === "ASA") {
            encodedTxn = await handleSendASATxn(transactionId);
            txnType = "1";
        } else {
            // OPT-IN txn
            encodedTxn = await handleOptInTxn(transactionId);
            txnType = "2";
        }
        // Make app call to store transaction in boxes
        const storeTxnAppCall = {
            method: contract.getMethodByName("add_txn"),
            methodArgs: [transactionId, encodedTxn, txnType],
            boxes: [{ appIndex: 0, name: txnNameUint8Arr }],
            ...commonParams,
        };
        const atc = new algosdk.AtomicTransactionComposer();
        const optInTxn = await createOptInTxn(activeAddress, parseInt(appId));
        if (optInTxn) {
            atc.addTransaction({ txn: optInTxn, signer });
        }
        atc.addMethodCall(storeTxnAppCall);
        const result = await atc.execute(algodClient, 4);
        handleWalletRender();
    };

    const assets = accInfo.assets;

    useEffect(() => {
        const fetchData = async () => {
            if (selectedTxnOption === "ASA" && assets) {
                const assetPromises = assets.map(async (asset) => {
                    const assetDetail = await algodClient
                        .getAssetByID(asset["asset-id"])
                        .do();
                    const name = assetDetail.params.name;
                    const unitName = assetDetail.params["unit-name"];
                    return {
                        id: asset["asset-id"],
                        name: name,
                        unitName: unitName,
                        amount: asset["amount"],
                    };
                });

                const processedAssets = await Promise.all(assetPromises);
                setAssetsDetails(processedAssets);
            }
        };

        fetchData();
    }, [selectedTxnOption]);

    return loading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-gray-200 p-8 rounded-md animate-pulse"></div>
        </div>
    ) : step === "Details" ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-md">
                <AiOutlineClose
                    className="mx-auto m-2 text-xl hover:text-gray-800 cursor-pointer text-gray-600"
                    onClick={() => {
                        setIsCreateTxnPopupOpen(false);
                    }}
                />
                <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base justify-center">
                    <li className="flex items-center text-blue-600 dark:text-blue-500 after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block dark:after:border-gray-700">
                        <span className="flex items-center after:content-['/'] after:mx-2 after:text-gray-200 dark:after:text-gray-500">
                            <svg
                                aria-hidden="true"
                                className="w-4 h-4 mr-2 sm:w-5 sm:h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                ></path>
                            </svg>
                            Details
                        </span>
                    </li>
                    <li className="flex items-center">Confirmation</li>
                </ol>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await conductTransactionChecks();
                    }}
                >
                    <h2 className="text-xl font-bold pt-4">Transaction type</h2>
                    <div className="flex items-center mt-2">
                        <label className="mr-2 font-semibold p-2 flex items-center justify-center">
                            <input
                                type="radio"
                                name="option"
                                value="ALGO"
                                checked={selectedTxnOption === "ALGO"}
                                onChange={handleOptionChange}
                                className="mr-1"
                            />
                            ALGO
                        </label>
                        <label className="font-semibold p-2 flex items-center justify-center">
                            <input
                                type="radio"
                                name="option"
                                value="ASA"
                                checked={selectedTxnOption === "ASA"}
                                onChange={handleOptionChange}
                                className="mr-1"
                            />
                            <Popover
                                open={openPopover}
                                handler={setOpenPopover}
                            >
                                <PopoverHandler {...triggers}>
                                    <div>ASA*</div>
                                </PopoverHandler>
                                <PopoverContent
                                    {...triggers}
                                    className="text-xs bg-blue-100"
                                >
                                    Algorand Standard Assets
                                </PopoverContent>
                            </Popover>
                        </label>
                        <label className="mr-2 font-semibold p-2 flex items-center justify-center">
                            <input
                                type="radio"
                                name="option"
                                value="OPT-IN"
                                checked={selectedTxnOption === "OPT-IN"}
                                onChange={handleOptionChange}
                                className="mr-1"
                            />
                            Opt-in
                        </label>
                    </div>
                    {selectedTxnOption === "ASA" && (
                        <div>
                            <select
                                className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                value={selectedAsset}
                                onChange={handleAssetChange}
                                required
                            >
                                <option value="">Select an asset</option>
                                {assetsDetails.map((asset, index) => (
                                    <option key={index} value={asset}>
                                        {asset.name}
                                        {" - "}
                                        {asset.id}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {selectedTxnOption === "OPT-IN" && (
                        <div>
                            <h2 className="text-xl font-bold pt-4">Asset ID</h2>
                            <input
                                type="number"
                                id="assetId"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-800 focus:border-state-800 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Asset ID"
                                onChange={(e) => {
                                    setOptInAssetId(e.target.value);
                                }}
                                min="0"
                                value={optInAssetId}
                                required
                            ></input>
                            {optInErrorMsg && (
                                <span className="text-xs text-red-500">
                                    {optInErrorMsg}
                                </span>
                            )}
                        </div>
                    )}
                    <h2 className="text-xl font-bold pt-4 flex items-center">
                        Amount
                        <span className="text-xs font-normal pl-1">
                            {selectedTxnOption === "ALGO" && "(ALGO)"}
                        </span>
                    </h2>
                    <input
                        type="number"
                        id="amount"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-800 focus:border-state-800 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder={
                            selectedTxnOption == "ASA"
                                ? selectedAsset
                                    ? selectedAsset["unitName"]
                                    : "Amount"
                                : "ALGO"
                        }
                        onChange={(e) => {
                            setAmount(e.target.value);
                        }}
                        max={maxAmount}
                        required
                        disabled={selectedTxnOption === "OPT-IN"}
                        value={amount}
                    ></input>
                    {maxAmount >= 0 && (
                        <span className="text-xs">Balance: {maxAmount}</span>
                    )}
                    <h2 className="text-xl font-bold pt-4">Receiver</h2>
                    <input
                        type="text"
                        id="receiver"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-800 focus:border-state-800 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Public address"
                        minLength={58}
                        maxLength={58}
                        onChange={(e) => {
                            setReceiver(e.target.value);
                        }}
                        required
                        disabled={selectedTxnOption === "OPT-IN"}
                        value={receiver}
                    ></input>
                    {receiverMsg && (
                        <div className="text-xs text-red-500 mt-1">
                            {receiverMsg}
                        </div>
                    )}
                    <button
                        className="mt-6 px-4 py-2 text-white bg-slate-800 rounded w-full text-center"
                        type="submit"
                    >
                        Confirm transaction
                    </button>
                </form>
            </div>
        </div>
    ) : (
        // Confirm Transaction
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-md">
                <AiOutlineClose
                    className="mx-auto m-2 text-xl hover:text-gray-800 cursor-pointer text-gray-600"
                    onClick={() => {
                        setIsCreateTxnPopupOpen(false);
                    }}
                />
                <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
                    <li className="flex md:w-full items-center dark:text-blue-500 sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block dark:after:border-gray-700">
                        <span className="flex items-center after:content-['/'] after:mx-2 after:text-gray-200 dark:after:text-gray-500">
                            Details
                        </span>
                    </li>
                    <li className="flex items-center text-blue-600">
                        <svg
                            aria-hidden="true"
                            className="w-4 h-4 mr-2 sm:w-5 sm:h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            ></path>
                        </svg>
                        Confirmation
                    </li>
                </ol>
                <h2 className="text-xl font-bold pt-4">Transaction type</h2>
                <div className="flex items-center mt-2">
                    <label className="mr-2 p-2 flex items-center justify-center underline underline-offset-4">
                        {selectedTxnOption}
                    </label>
                </div>
                {selectedTxnOption === "ASA" && (
                    <div>
                        <h2 className="text-xl font-bold pt-4 flex items-center">
                            Asset
                        </h2>
                        <div className="p-2 underline underline-offset-4">
                            {selectedAsset.name}
                            {" - "}
                            {selectedAsset.id}
                        </div>
                    </div>
                )}
                {selectedTxnOption === "OPT-IN" && (
                    <h2 className="text-xl font-bold pt-4 flex items-center">
                        Asset ID
                    </h2>
                )}
                {selectedTxnOption === "OPT-IN" && (
                    <div className="p-2 underline underline-offset-4">
                        {optInAssetId}
                    </div>
                )}
                <h2 className="text-xl font-bold pt-4 flex items-center">
                    Amount
                    <span className="text-xs font-normal pl-1">
                        {selectedTxnOption === "ALGO" && "(ALGO)"}
                    </span>
                </h2>
                <div className="p-2 underline underline-offset-4">
                    {amount} {selectedTxnOption === "ALGO" && "ALGO"}
                    {selectedTxnOption === "ASA" && selectedAsset.unitName}
                </div>
                <h2 className="text-xl font-bold pt-4">Receiver</h2>
                <div className="p-2 underline underline-offset-4 max-w-[30vh] overflow-hidden text-ellipsis">
                    {receiver}
                </div>
                <button
                    className="mt-6 px-4 py-2 text-white bg-slate-800 rounded w-full"
                    onClick={handleAddTxn}
                >
                    Submit
                </button>
            </div>
        </div>
    );
}
