"use client";

import { BiWallet } from "react-icons/bi";
import { useEffect, useState } from "react";
import Providers from "./components/providers";
import MainMenu from "./components/mainMenu";
import LoadWallet from "./components/loadWallet";
import { getNetworkCredentials } from "../clients";
import {
    reconnectProviders,
    initializeProviders,
    PROVIDER_ID,
    useWallet,
} from "@txnlab/use-wallet";

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const cred = getNetworkCredentials(network);

const walletProviders = initializeProviders(
    [
        PROVIDER_ID.WALLETCONNECT,
        PROVIDER_ID.PERA,
        PROVIDER_ID.DEFLY,
        PROVIDER_ID.KMD,
    ],
    {
        network: network.toLowerCase(), //betanet, testnet, mainnet, sandnet
        nodeServer: cred.algod.address || "",
        nodeToken: cred.algod.token || "",
        nodePort: cred.algod.port || "",
    }
);

export default async function Home() {
    const { providers, isReady, isActive, activeAddress } = useWallet();
    const [showProviders, setShowProviders] = useState(false);
    /**
     * Main Steps:
     * 1. mainMenu
     * 2. createWallet
     * 3. loadWallet
     */
    const [currentStep, setCurrentStep] = useState({ mainMenu: 1 });

    return (
        <main>
            {Object.keys(currentStep)[0] === "mainMenu" && (
                <MainMenu
                    showProviders={showProviders}
                    setShowProviders={setShowProviders}
                    setCurrentStep={setCurrentStep}
                />
            )}
            {Object.keys(currentStep)[0] === "loadWallet" && (
                <LoadWallet setCurrentStep={setCurrentStep} />
            )}
            {showProviders && !isActive && <Providers />}
        </main>
    );
}
