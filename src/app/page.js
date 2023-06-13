"use client";

import { BiWallet } from "react-icons/bi";
import { useWallet } from "@txnlab/use-wallet";
import { useState } from "react";
import Providers from "./components/providers";
import MainMenu from "./components/mainMenu";

export default function Home() {
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
            {showProviders && !isActive && <Providers />}
        </main>
    );
}
