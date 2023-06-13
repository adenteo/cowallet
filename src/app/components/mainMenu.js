"use client";
import { BiWallet } from "react-icons/bi";
import { useWallet } from "@txnlab/use-wallet";
import { useRouter } from "next/navigation";

export default function MainMenu({
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
        console.log("Creating wallet");
        router.push("/create");
    };
    return (
        <div className="flex flex-col items-center justify-center h-[94vh]">
            <div className="bg-white p-10 rounded-lg">
                <h1 className="text-3xl font-bold text-center">
                    CoWallet
                    <BiWallet className="mx-auto text-4xl" />
                </h1>
                {isActive ? (
                    <div>
                        <div
                            onClick={createWallet}
                            className="bg-slate-800 p-5 rounded-xl my-4 font-semibold text-white hover:bg-slate-600 hover:scale-105"
                        >
                            Create CoWallet
                        </div>
                        <div className="bg-slate-800 p-5 rounded-xl my-4 font-semibold text-white hover:bg-slate-600 hover:scale-105">
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
