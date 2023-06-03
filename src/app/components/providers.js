"use client";
import React from "react";
import { useWallet } from "@txnlab/use-wallet";

export default function Providers() {
    const { providers, activeAccount } = useWallet();

    // Map through the providers.
    // Render account information and "connect", "set active", and "disconnect" buttons.
    // Finally, map through the `accounts` property to render a dropdown for each connected account.
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white rounded-lg mx-auto max-w-xs max-h-96 my-auto lg:max-w-md">
            <h1 className="font-bold">Choose a provider</h1>
            {providers?.map((provider) => (
                <div
                    key={"provider-" + provider.metadata.id}
                    className="text-white w-3/4 p-3 rounded-lg my-2 bg-slate-800 hover:bg-slate-600"
                    onClick={provider.connect}
                >
                    <h4 className="flex">
                        <img
                            className="rounded-lg mr-5"
                            width={30}
                            height={30}
                            alt=""
                            src={provider.metadata.icon}
                        />
                        <div>
                            <div className="font-semibold">
                                {provider.metadata.name}
                            </div>
                            {/* <div> {provider.isActive && "active"}</div> */}
                        </div>
                    </h4>
                    <div className="">
                        {/* <button
                            onClick={provider.connect}
                            disabled={provider.isConnected}
                        >
                            Connect
                        </button> */}
                        {/* <button
                            onClick={provider.disconnect}
                            disabled={!provider.isConnected}
                        >
                            Disconnect
                        </button> */}
                        {/* <button
                            onClick={provider.setActiveProvider}
                            disabled={
                                !provider.isConnected || provider.isActive
                            }
                        >
                            Set Active
                        </button> */}
                        {/* <div>
                            {provider.isActive && provider.accounts.length && (
                                <select
                                    value={activeAccount?.address}
                                    onChange={(e) =>
                                        provider.setActiveAccount(
                                            e.target.value
                                        )
                                    }
                                >
                                    {provider.accounts.map((account) => (
                                        <option
                                            key={account.address}
                                            value={account.address}
                                        >
                                            {account.address}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div> */}
                    </div>
                </div>
            ))}
        </div>
    );
}
