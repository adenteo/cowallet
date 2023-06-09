"use client";
import { BiWallet } from "react-icons/bi";
import { useWallet } from "@txnlab/use-wallet";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoIosAddCircleOutline, IoIosArrowBack } from "react-icons/io";
import AddOwnerPopup from "./addOwnerPopup";
import algosdk, { isTransactionWithSigner, signTransaction } from "algosdk";
import { getAlgodClient } from "../../clients";

import { addOwners } from "../../useractions/addOwners";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

export default function CreateWallet() {
    const router = useRouter();
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
    useEffect(() => {
        if (isReady && activeAddress && owners.length === 0) {
            setOwners([activeAddress]);
        }
    });
    const [owners, setOwners] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleAddOwner = (address) => {
        setOwners([...owners, address]);
    };

    const [formData, setFormData] = useState({
        version: "",
        name: "",
        threshold: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
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
            const signedTxn = await signTransactions([
                Buffer.from(txn, "base64"),
            ]);
            const result = await sendTransactions(signedTxn, 4);
            const appId = result["application-index"];
            console.log(result);
            console.log(appId);
            await addOwners(algodClient, activeAddress, signer, owners, appId);
            router.push("/wallet/" + appId);
        } catch (error) {
            console.error("Error:", error);
        }
        setFormData({
            version: "",
            name: "",
            threshold: "",
        });
        setOwners([activeAddress]);
    };

    return (
        <div className="flex flex-col items-center justify-center h-[94vh] max-h-[94vh]">
            {isPopupOpen && (
                <AddOwnerPopup
                    owners={owners}
                    onAddOwner={handleAddOwner}
                    setIsPopupOpen={setIsPopupOpen}
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
                        onSubmit={handleSubmit}
                        className="mx-auto max-w-xs lg:max-w-sm"
                    >
                        <div className="text-center my-3">Name of wallet</div>
                        <input
                            type="text"
                            name="name"
                            className="w-full rounded border border-gray-300 px-4 py-2"
                            placeholder="Enter name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                        <div className="text-center my-3">Version</div>
                        <label>
                            <input
                                type="number"
                                min={1}
                                name="version"
                                placeholder="Enter version"
                                className="w-full rounded border border-gray-300 px-4 py-2"
                                value={formData.version}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <br />
                        <div className="text-center my-3">
                            Signing threshold
                        </div>
                        <input
                            type="number"
                            min={1}
                            max={owners.length}
                            className="w-full rounded border border-gray-300 px-4 py-2"
                            name="threshold"
                            placeholder="Enter threshold"
                            value={formData.threshold}
                            onChange={handleInputChange}
                            required
                        />
                        <br />
                        <div className="text-center my-3">Owners</div>
                        <div
                            onClick={() => setIsPopupOpen(true)}
                            className="rounded bg-green-500 px-4 py-2 text-base text-white hover:bg-green-700"
                        >
                            Add owners (Max: 10)
                        </div>
                        <div className="text-center text-xs mt-1">
                            {owners.length} / 10
                        </div>
                        <div className="mt-4 flex justify-center">
                            <button
                                type="submit"
                                className="rounded bg-slate-800 px-4 py-2 text-base text-white hover:bg-slate-700"
                            >
                                Create Wallet
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
