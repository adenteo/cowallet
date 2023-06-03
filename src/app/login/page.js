"use client";
import { BiWallet } from "react-icons/bi";
import { useWallet } from "@txnlab/use-wallet";
import { useState } from "react";

export default function LoginPage() {
    const { providers, activeAccount, isActive, isReady } = useWallet();
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="bg-white p-10 rounded-lg">
                <h1 className="text-3xl font-bold">
                    CoWallet
                    <BiWallet className="mx-auto text-4xl" />
                </h1>
                {activeAccount ? (
                    <div>
                        <div className="bg-slate-800 p-5 rounded-xl my-4 font-semibold text-white hover:bg-slate-600">
                            Create Wallet
                        </div>
                        <div className="bg-slate-800 p-5 rounded-xl my-4 font-semibold text-white hover:bg-slate-600">
                            Load Wallet
                        </div>
                    </div>
                ) : (
                    <div></div>
                )}
            </div>
        </div>
    );
}
