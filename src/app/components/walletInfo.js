"use client";
import { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { useWallet } from "@txnlab/use-wallet";
import { getAlgodClient } from "../../clients";
import algosdk from "algosdk";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);
const contractData = require("../../../artifacts/SmartContractWallet/contract.json");
const contract = new algosdk.ABIContract(contractData);

export default function WalletInfo({setIsShowWalletInfoPopupOpen, isShowWalletInfoPopupOpen}) {
    const { activeAddress, signer } = useWallet();

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-md">
                <AiOutlineClose
                    className="mx-auto m-2 text-xl hover:text-gray-800 cursor-pointer text-gray-600"
                    onClick={() => {
                        setIsShowWalletInfoPopupOpen(false);
                    }}
                />
            </div>
        </div>
    );
}
