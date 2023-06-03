"use client";
import "./globals.css";
import { Inter, Montserrat } from "next/font/google";
import {
    reconnectProviders,
    initializeProviders,
    WalletProvider,
    PROVIDER_ID,
} from "@txnlab/use-wallet";
import { useEffect } from "react";
import { getNetworkCredentials } from "../clients";
import NavBar from "./components/navBar";

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

const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata = {
    title: "Create Next App",
    description: "Generated by create next app",
};

export default function RootLayout({ children }) {
    useEffect(() => {
        console.log("reconnecting");
        reconnectProviders(walletProviders);
    }, []);
    return (
        <html lang="en">
            <WalletProvider value={walletProviders}>
                <body className={montserrat.className}>
                    <NavBar />
                    {children}
                </body>
            </WalletProvider>
        </html>
    );
}
