"use client";

import { BiWallet } from "react-icons/bi";
import { useWallet } from "@txnlab/use-wallet";
import { useState } from "react";
import Providers from "./components/providers";
import MainMenu from "./components/mainMenu";

export default function Home() {
    // const [signTransactions, sendTransactions] = useWallet();
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
            {/* <div>
                <form onSubmit={createWallet}>
                    <label>
                        Name:
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                        />
                    </label>
                    <br />
                    <label>
                        Version:
                        <input
                            type="text"
                            name="version"
                            value={formData.version}
                            onChange={handleInputChange}
                        />
                    </label>
                    <br />
                    <label>
                        Threshold:
                        <input
                            type="text"
                            name="threshold"
                            value={formData.threshold}
                            onChange={handleInputChange}
                        />
                    </label>
                    <br />
                    <label>
                        Owners:
                        <input
                            type="text"
                            name="owners"
                            value={formData.owners}
                            onChange={handleInputChange}
                        />
                    </label>
                    <br />
                    <button
                        onClick={createWallet}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                    >
                        <BiWallet className="fill-current w-4 h-4 mr-2" />
                        <span>Create Wallet</span>
                    </button>
                </form>
            </div> */}
        </main>
    );
}