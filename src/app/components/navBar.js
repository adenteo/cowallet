"use client";
import { useWallet } from "@txnlab/use-wallet";
import { useState, useEffect } from "react";
import TruncatedAddress from "./truncatedAddress";
import Providers from "../components/providers";

export default function NavBar() {
    const { providers, isReady, isActive, activeAddress, activeAccount } =
        useWallet();
    const [showDropdown, setShowDropdown] = useState(false);
    return (
        <nav className="flex justify-between max-w-screen-2xl h-[6vh] bg-slate-800 text-white">
            <h1 className="max-w-sm m-2 font-bold">CoWallet</h1>
            {isActive && (
                <TruncatedAddress
                    text={activeAddress ? activeAddress : ""}
                    maxLength={5}
                    showDropdown={showDropdown}
                    setShowDropdown={setShowDropdown}
                />
            )}
            {/* <Providers /> */}
            {/* <div className="bg-white absolute top-[6vh] right-0 text-black p-2 px-4 rounded font-semibold text-xs">
                <span>Disconnect</span>
            </div> */}
            {/* {showDropdown && (
                <div className="bg-white absolute top-[6vh] right-0 text-black p-2 px-4 rounded font-semibold text-xs">
                    <span>Disconnect</span>
                </div>
            )} */}
            {showDropdown && (
                <div className="bg-white absolute top-[6vh] right-0 text-black p-4 px-4 rounded font-semibold text-xs py-2 border-b-4 border-slate-800 shadow-lg shadow-slate-500/50">
                    {providers?.map(
                        (provider) =>
                            provider.isActive && (
                                <div
                                    key={"provider-" + provider.metadata.id}
                                    className="text-center"
                                >
                                    <span className="border-b-2 p-1 rounded-md border-black">
                                        {provider.metadata.name}
                                    </span>
                                    <div className="p-2">
                                        {provider.isActive &&
                                            provider.accounts.length && (
                                                <select
                                                    value={
                                                        activeAccount?.address
                                                    }
                                                    onChange={(e) =>
                                                        provider.setActiveAccount(
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    {provider.accounts.map(
                                                        (account) => (
                                                            <option
                                                                key={
                                                                    account.address
                                                                }
                                                                value={
                                                                    account.address
                                                                }
                                                            >
                                                                {
                                                                    account.address
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            )}
                                    </div>
                                    <div
                                        onClick={() => {
                                            provider.disconnect();
                                            setShowDropdown(false);
                                        }}
                                        className="border rounded p-2 bg-slate-800 text-white hover:bg-slate-500"
                                    >
                                        Disconnect
                                    </div>
                                </div>
                            )
                    )}
                </div>
            )}
        </nav>
    );
}
