"use client";
import { BiWallet } from "react-icons/bi";
import { useRouter } from "next/navigation";
import { getNetworkCredentials } from "../../clients";
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

export default async function MainMenu({
    showProviders,
    setShowProviders,
    setCurrentStep,
}) {
    const router = useRouter();
    const { providers, activeAccount, isActive, isReady, activeAddress } =
        useWallet();
    const connectWallet = () => {
        setShowProviders(!showProviders);
    };

    const createWallet = () => {
        router.push("/create");
    };
    return (
        <div className="flex flex-col items-center justify-center h-[94vh]">
            <div className="bg-white p-10 rounded-lg">
                <h1 className="text-3xl font-bold text-center">
                    CoWallet
                    <BiWallet className="mx-auto text-4xl" />
                </h1>
                {isReady && isActive ? (
                    <div>
                        <div
                            onClick={createWallet}
                            className="bg-slate-800 p-5 rounded-xl my-4 font-semibold text-white hover:bg-slate-600 hover:scale-105"
                        >
                            Create CoWallet
                        </div>
                        <div
                            onClick={() => {
                                setCurrentStep({ loadWallet: 1 });
                            }}
                            className="bg-slate-800 p-5 rounded-xl my-4 font-semibold text-white hover:bg-slate-600 hover:scale-105"
                        >
                            Load CoWallet
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={connectWallet}
                        className="bg-slate-800 p-5 rounded-xl my-4 font-semibold text-white hover:bg-slate-600"
                    >
                        Connect Wallet
                    </div>
                )}
            </div>
        </div>
    );
}
