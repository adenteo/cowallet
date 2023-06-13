"use client";
import { useState } from "react";
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

const { v4: uuidv4 } = require("uuid");

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);
const contractData = require("../../../artifacts/SmartContractWallet/contract.json");
const contract = new algosdk.ABIContract(contractData);

export default function AddTransaction({
    isCreateTxnPopupOpen,
    setIsCreateTxnPopupOpen,
    appId,
    handleWalletRender,
}) {
    const [selectedTxnOption, setSelectedTxnOption] = useState("ALGO");
    const [receiver, setReceiver] = useState("");
    const [amount, setAmount] = useState(0);
    const [openPopover, setOpenPopover] = useState(false);
    const [step, setStep] = useState("Details");
    const triggers = {
        onMouseEnter: () => setOpenPopover(true),
        onMouseLeave: () => setOpenPopover(false),
    };

    const { activeAddress, signer } = useWallet();

    const handleOptionChange = (event) => {
        setSelectedTxnOption(event.target.value);
    };

    const handleAddTxn = async (event) => {
        event.preventDefault();
        setIsCreateTxnPopupOpen(false);
        // Create payment app call transaction
        const transactionId = uuidv4(); // Initialise txn uuid. There's probably other ways to ensure unique names and save fees with shorter names.
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
            methodArgs: [parseInt(amount), transactionId],
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
        handleWalletRender();
    };

    return step === "Details" ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-md">
                <AiOutlineClose
                    className="mx-auto m-2 text-xl hover:text-gray-800 cursor-pointer text-gray-600"
                    onClick={() => {
                        setIsCreateTxnPopupOpen(false);
                    }}
                />
                <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
                    <li className="flex md:w-full items-center text-blue-600 dark:text-blue-500 sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block dark:after:border-gray-700">
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
                    onSubmit={() => {
                        setStep("Confirmation");
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
                    </div>
                    <h2 className="text-xl font-bold pt-4 flex items-center">
                        Amount
                        <span className="text-xs font-normal pl-1">
                            (microAlgos)
                        </span>
                    </h2>
                    <input
                        type="number"
                        id="amount"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-800 focus:border-state-800 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="microAlgos"
                        onChange={(e) => {
                            setAmount(e.target.value);
                        }}
                        min="0"
                        required
                    ></input>
                    <h2 className="text-xl font-bold pt-4">Receiver</h2>
                    <input
                        type="text"
                        id="receiver"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-800 focus:border-state-800 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Public address"
                        maxLength={58}
                        onChange={(e) => {
                            setReceiver(e.target.value);
                        }}
                        required
                    ></input>
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
                <h2 className="text-xl font-bold pt-4 flex items-center">
                    Amount
                    <span className="text-xs font-normal pl-1">
                        (microAlgos)
                    </span>
                </h2>
                <div className="p-2 underline underline-offset-4">
                    {amount} microAlgos
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
