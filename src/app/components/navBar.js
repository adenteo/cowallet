"use client";
import { useWallet } from "@txnlab/use-wallet";

export default function NavBar() {
    const { providers, isReady, isActive, activeAddress } = useWallet();

    return (
        <div className="flex max-w-screen-2xl bg-white">
            <h1>CoWallet</h1>
            <h1>{activeAddress}</h1>
        </div>
    );
}
