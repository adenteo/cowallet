"use client";
import { BiWallet } from "react-icons/bi";
import { AiOutlineLoading } from "react-icons/ai";
import {
    reconnectProviders,
    initializeProviders,
    PROVIDER_ID,
    useWallet,
} from "@txnlab/use-wallet";
import { GoAlert } from "react-icons/go";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoIosArrowBack } from "react-icons/io";
import AddOwnerPopup from "./addOwnerPopup";
import { getAlgodClient, getNetworkCredentials } from "../../clients";
import algosdk from "algosdk";
import {
    Button,
    Popover,
    PopoverHandler,
    PopoverContent,
    Alert,
} from "@material-tailwind/react";

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const cred = getNetworkCredentials(network);

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

export default function CreateWallet() {
    const router = useRouter();
    const {
        isReady,
        activeAddress,
        signer,
        signTransactions,
        sendTransactions,
    } = useWallet();
    useEffect(() => {
        if (isReady && activeAddress && owners.length === 0) {
            setOwners([activeAddress]);
        }
    });
    const [owners, setOwners] = useState([]);
    const [isAddOwnersPopupOpen, setIsAddOwnersPopupOpen] = useState(false);
    const [step, setStep] = useState("Details");
    const [buttonMsg, setButtonMsg] = useState("Create Wallet");
    const [buttonLoading, setButtonLoading] = useState(false);
    const [createWalletFailure, setCreateWalletFailure] = useState(false);

    const onAddOwner = (address) => {
        setOwners([...owners, address]);
    };

    const [formData, setFormData] = useState({
        version: "",
        name: "",
        threshold: "",
        fundingAmt: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const fundWallet = async (appAddr) => {
        const suggestedParams = await algodClient.getTransactionParams().do();
        const fundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: activeAddress,
            to: appAddr,
            amount: parseInt(formData.fundingAmt) * 1e6,
            suggestedParams,
        });
        const signedFundingTxn = await signTransactions([
            algosdk.encodeUnsignedTransaction(fundingTxn),
        ]);
        await sendTransactions(signedFundingTxn, 4);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            formData["owners"] = owners;
            formData["activeAddress"] = activeAddress;
            const response = await fetch("/api/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            const txn = await response.text();
            setButtonMsg("Creating wallet...");
            setButtonLoading(true);
            const signedTxn = await signTransactions([
                Buffer.from(txn, "base64"),
            ]);
            try {
                const result = await sendTransactions(signedTxn, 4);
                const appId = result["application-index"];
                const appAddr = algosdk.getApplicationAddress(parseInt(appId));
                // Fund wallet with algos
                setButtonMsg("Funding wallet...");
                await fundWallet(appAddr);
                setButtonMsg("Redirecting...");
                router.push("/wallet/" + appId);
            } catch (err) {
                setCreateWalletFailure(true);
                setButtonMsg("Create Wallet");
                setButtonLoading(false);
                console.log(err);
                return;
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };
    return step === "Details" ? (
        <div className="flex flex-col items-center justify-center h-[94vh] max-h-[94vh]">
            {isAddOwnersPopupOpen && (
                <AddOwnerPopup
                    owners={owners}
                    onAddOwner={onAddOwner}
                    setIsAddOwnersPopupOpen={setIsAddOwnersPopupOpen}
                />
            )}
            <div className="bg-white p-10 rounded-lg max-h-[88vh]">
                <label
                    onClick={() => {
                        router.back();
                    }}
                    className="flex cursor-pointer justify-center text-gray-600"
                >
                    <IoIosArrowBack className="text-2xl"></IoIosArrowBack>
                    Back
                </label>
                <h1 className="text-3xl font-bold text-center my-2">
                    Create wallet
                    <BiWallet className="mx-auto text-4xl" />
                </h1>
                <div className="my-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setStep("Confirmation");
                        }}
                        className="mx-auto w-xs lg:w-sm"
                    >
                        <div className="text-center my-3 font-semibold">
                            Name of wallet
                        </div>
                        <input
                            type="text"
                            name="name"
                            className="w-full rounded border border-gray-300 px-4 py-2"
                            placeholder="Enter name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                        <div className="flex">
                            <div className="w-1/2 flex flex-col mr-2">
                                <div className="text-center my-3 font-semibold">
                                    Version
                                </div>
                                <input
                                    type="number"
                                    min={1}
                                    name="version"
                                    placeholder="Enter version"
                                    className="rounded border border-gray-300 py-2 w-full"
                                    value={formData.version}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="w-1/2 flex flex-col justify-center">
                                <div className="text-center my-3 font-semibold">
                                    Signing threshold
                                </div>
                                <input
                                    type="number"
                                    min={1}
                                    max={owners.length}
                                    className="rounded border border-gray-300 py-2 w-full"
                                    name="threshold"
                                    placeholder="Enter threshold"
                                    value={formData.threshold}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="text-center my-3 font-semibold">
                            Owners
                        </div>
                        <div
                            onClick={() => setIsAddOwnersPopupOpen(true)}
                            className="rounded bg-green-500 px-4 py-2 text-base text-white hover:bg-green-600"
                        >
                            Add owners (Max: 10)
                        </div>
                        <div className="text-center text-xs mt-1">
                            {owners.length} / 10
                        </div>
                        <div className="text-center my-3 font-semibold">
                            Funding amount (ALGO)
                        </div>
                        <input
                            type="number"
                            min={0}
                            className="w-full rounded border border-gray-300 px-4 py-2"
                            name="fundingAmt"
                            placeholder="Enter amount"
                            value={formData.fundingAmt}
                            onChange={handleInputChange}
                            required
                        />
                        <div className="mt-4 w-full">
                            <button
                                type="submit"
                                className="rounded bg-slate-800 w-full px-4 py-2 text-base text-white hover:bg-slate-700 hover:scale-105"
                            >
                                Confirm Details
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    ) : (
        <div className="flex flex-col items-center justify-center h-[94vh] max-h-[94vh]">
            <Alert
                className="absolute bg-red-700 bottom-20 p-4 w-4/5 left-[10%]"
                variant="gradient"
                color="red"
                open={createWalletFailure}
                icon={<GoAlert className="h-6 w-6 mr-2" />}
                action={
                    <Button
                        variant="text"
                        color="white"
                        size="sm"
                        className="!absolute top-10 right-3 lg:top-3"
                        onClick={() => setCreateWalletFailure(false)}
                    >
                        Close
                    </Button>
                }
            >
                Failed to create wallet. Please ensure your account is
                sufficiently funded.
            </Alert>
            {isAddOwnersPopupOpen && (
                <AddOwnerPopup
                    owners={owners}
                    onAddOwner={onAddOwner}
                    setIsAddOwnersPopupOpen={setIsAddOwnersPopupOpen}
                />
            )}
            <div className="bg-white p-10 rounded-lg max-h-[88vh]">
                <label
                    onClick={() => {
                        setStep("Details");
                    }}
                    className="flex cursor-pointer justify-center text-gray-600"
                >
                    <IoIosArrowBack className="text-2xl"></IoIosArrowBack>
                    Back
                </label>
                <h1 className="text-3xl font-bold text-center my-2">
                    Confirm details
                    <BiWallet className="mx-auto text-4xl" />
                </h1>
                <div className="my-3">
                    <form className="mx-auto w-xs lg:w-sm">
                        <div className="my-2 font-semibold flex justify-between items-center">
                            Name of wallet:{" "}
                            <span className="font-bold underline underline-offset-4 text-center">
                                {formData.name}
                            </span>
                        </div>
                        <div className="my-2 font-semibold flex justify-between items-center">
                            Version:{" "}
                            <span className="font-bold underline underline-offset-4 text-center">
                                {formData.version}
                            </span>
                        </div>
                        <div className="my-2 font-semibold flex justify-between items-center">
                            Signing threshold:{" "}
                            <span className="font-bold underline underline-offset-4 text-center">
                                {formData.threshold}
                            </span>
                        </div>
                        <div className="my-2 font-semibold flex justify-between items-center">
                            No. of owners:{" "}
                            <span className="font-bold underline underline-offset-4 text-center">
                                {owners.length}
                            </span>
                        </div>
                        <div className="my-2 font-semibold flex justify-between items-center">
                            Funding amount:{" "}
                            <span className="font-bold underline underline-offset-4 text-center">
                                {formData.fundingAmt}
                                {" ALGO"}
                            </span>
                        </div>
                        <Popover
                            animate={{
                                mount: { scale: 1, y: 0 },
                                unmount: { scale: 0, y: 25 },
                            }}
                        >
                            <PopoverHandler>
                                <Button className="bg-slate-800 mt-4 rounded-md py-2 font-normal block w-full text-base">
                                    View Owners
                                </Button>
                            </PopoverHandler>
                            <PopoverContent className="bg-slate-800 border-none">
                                {owners.map((owner, index) => (
                                    <div
                                        className="text-xs text-white"
                                        key={index}
                                    >
                                        {owner.substring(0, 10)}
                                        {"..."}
                                        {owner.substring(owner.length - 10)}
                                    </div>
                                ))}
                            </PopoverContent>
                        </Popover>
                        <div className="mt-4 w-full">
                            <button
                                onClick={handleSubmit}
                                className="rounded-md bg-green-500 w-full px-4 py-2 text-base text-white hover:bg-green-700 hover:scale-105 flex justify-center items-center"
                            >
                                {buttonMsg}
                                {buttonLoading && (
                                    <AiOutlineLoading className="ml-2 animate-spin" />
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
