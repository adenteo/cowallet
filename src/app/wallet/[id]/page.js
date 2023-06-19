"use client";
import { useWallet } from "@txnlab/use-wallet";
import { useState, useEffect, useContext, createContext } from "react";
import algosdk from "algosdk";
import { getAlgodClient } from "../../../clients";
import { readGlobalState } from "../../../actions";
import Transactions from "../../components/transactions";
import WalletContext from "@/app/components/walletContext";
import { MdCallReceived } from "react-icons/md";
import { BiSend, BiCopy } from "react-icons/bi";
import AddTransaction from "@/app/components/sendTransaction";
import ReceiveTransaction from "@/app/components/receiveTransaction";
import WalletInfo from "@/app/components/walletInfo";
import { Select, Option } from "@material-tailwind/react";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);
const contractData = require("../../../../artifacts/SmartContractWallet/contract.json");
const contract = new algosdk.ABIContract(contractData);

export default function Page({ params, searchParams }) {
    const {
        providers,
        activeAccount,
        isActive,
        isReady,
        activeAddress,
        signer,
        signTransactions,
        sendTransactions,
    } = useWallet();

    const [txns, setTxns] = useState([]);
    const [count, setCount] = useState(0);
    const [renderWallet, setRenderWallet] = useState(false);
    const [isCreateTxnPopupOpen, setIsCreateTxnPopupOpen] = useState(false);
    const [isReceiveTxnPopupOpen, setIsReceiveTxnPopupOpen] = useState(false);
    const [owners, setOwners] = useState([]);
    const [isShowWalletInfoPopupOpen, setIsShowWalletInfoPopupOpen] =
        useState(false);
    const [accInfo, setAccInfo] = useState(null);
    const [appInfo, setAppInfo] = useState(null);

    const appId = params.id;
    const appAddr = algosdk.getApplicationAddress(parseInt(appId));

    const handleWalletRender = () => {
        console.log("Re rendering wallet");
        setRenderWallet(!renderWallet);
    };

    // Fetch wallet information e.g. name, balance, address
    useEffect(() => {
        const getWalletInfo = async () => {
            console.log("Fetching wallet info");
            const info = await algodClient.accountInformation(appAddr).do();
            const appGlobalStateDecodedObject = await readGlobalState(
                parseInt(appId)
            );
            for (let i = 0; i < appGlobalStateDecodedObject.ownersCount; i++) {
                setOwners((prevOwners) => [
                    ...prevOwners,
                    appGlobalStateDecodedObject[i],
                ]);
            }
            setAccInfo(info);
            setAppInfo(appGlobalStateDecodedObject);
        };
        getWalletInfo();
    }, [renderWallet]);

    // Fetch current pending transactions from boxes
    useEffect(() => {
        const getBoxNames = async () => {
            const boxesResponse = await algodClient
                .getApplicationBoxes(parseInt(appId))
                .do();
            const appGlobalStateDecodedObject = await readGlobalState(
                parseInt(appId)
            );
            const txnsInfo = await Promise.all(
                boxesResponse.boxes.map(async (box) => {
                    const boxResponse = await algodClient
                        .getApplicationBoxByName(parseInt(appId), box.name)
                        .do();
                    const boxValue = boxResponse.value;
                    const minBalance =
                        2500 + 400 * (box.name.length + boxValue.length);
                    let signaturesCount = 0;
                    let signers = [];
                    boxValue
                        .slice(0, appGlobalStateDecodedObject.ownersCount)
                        .forEach((value, index) => {
                            if (value === 49) {
                                signaturesCount += 1;
                                signers.push(
                                    appGlobalStateDecodedObject[index]
                                );
                            }
                        });

                    const txnDecoded = algosdk.decodeUnsignedTransaction(
                        boxValue.slice(
                            appGlobalStateDecodedObject.ownersCount + 1
                        )
                    );
                    let txnType = boxValue
                        .slice(
                            appGlobalStateDecodedObject.ownersCount,
                            appGlobalStateDecodedObject.ownersCount + 1
                        )
                        .toString();
                    if (txnType === "48") {
                        txnType = "ALGO";
                    } else if (txnType === "49") {
                        txnType = "ASA";
                    } else {
                        txnType = "OPT-IN";
                    }
                    return {
                        name: Buffer.from(
                            boxResponse.name,
                            "base64"
                        ).toString(),
                        txn: txnDecoded,
                        txnType: txnType,
                        signatures: parseInt(signaturesCount),
                        signers: signers,
                        minBalance: minBalance,
                    };
                })
            );
            setTxns(txnsInfo);
        };
        getBoxNames();
    }, [count, renderWallet]);

    const firstFive = appAddr.substring(0, 5);
    const lastFive = appAddr.substring(appAddr.length - 5);
    const appAddrShort = `${firstFive}...${lastFive}`;

    return (
        <WalletContext.Provider value={{ handleWalletRender }}>
            {appInfo && (
                <section className="lg:flex lg:justify-evenly md:flex md:justify-evenly">
                    {isShowWalletInfoPopupOpen && (
                        <WalletInfo
                            setIsShowWalletInfoPopupOpen={
                                setIsShowWalletInfoPopupOpen
                            }
                            isShowWalletInfoPopupOpen={
                                isShowWalletInfoPopupOpen
                            }
                        />
                    )}
                    {isReceiveTxnPopupOpen && (
                        <ReceiveTransaction
                            receiver={appAddr}
                            setIsReceiveTxnPopupOpen={setIsReceiveTxnPopupOpen}
                        />
                    )}
                    {isCreateTxnPopupOpen && (
                        <AddTransaction
                            isCreateTxnPopupOpen={isCreateTxnPopupOpen}
                            setIsCreateTxnPopupOpen={setIsCreateTxnPopupOpen}
                            appId={appId}
                            appAddr={appAddr}
                            accInfo={accInfo}
                            handleWalletRender={handleWalletRender}
                        />
                    )}
                    <div className="bg-white rounded-lg mt-6 p-4 mx-auto max-w-xs text-center shadow-xl border-b-4 border-slate-700 lg:m-4 lg:min-h-[80vh] lg:max-h-[80vh] lg:flex lg:flex-col lg:justify-center lg:items-center lg:mt-12 lg:min-w-[20vw]">
                        {owners.includes(activeAddress) ? (
                            <div className="text-white bg-green-500 p-1 rounded-full lg:px-4">
                                Owner
                            </div>
                        ) : (
                            <div className="bg-red-500 text-white p-1 rounded-full lg:px-4">
                                Not owner
                            </div>
                        )}
                        <div className="pt-2 text-xl font-bold">
                            {appInfo.name}
                        </div>
                        <div className="px-2 text-xs overflow-hidden text-ellipsis text-stone-500 flex items-center justify-center">
                            {appAddrShort}
                            <BiCopy
                                onClick={() => {
                                    navigator.clipboard.writeText(appAddr);
                                }}
                                className="hover:text-stone-800 cursor-pointer"
                            />
                        </div>
                        <div className="text-xs text-stone-500">
                            ID: {appId}
                        </div>
                        <div className="text-xs text-stone-500">
                            Min Balance:{" "}
                            {parseInt(accInfo["min-balance"]) / 1e6}
                            {" ALGOs"}
                        </div>
                        <span className="text-xs text-stone-500 sm:mt-2">
                            Balance:
                        </span>
                        <div className="text-4xl font-bold">
                            {accInfo.amount / 1e6}
                        </div>
                        <span className="text-xs font-semibold">ALGOs</span>
                        <div
                            className={`flex justify-evenly pt-4 sm:flex-col ${
                                !owners.includes(activeAddress) && "hidden"
                            }`}
                        >
                            <div
                                className={`flex flex-col ${
                                    isReceiveTxnPopupOpen
                                        ? "hidden lg:block"
                                        : ""
                                }`}
                                onClick={() => {
                                    setIsReceiveTxnPopupOpen(true);
                                }}
                            >
                                <div className="rounded-full sm:rounded-md p-2.5 w-10 h-10 mx-auto bg-slate-800 text-white hover:scale-110">
                                    <MdCallReceived className="text-xl" />
                                </div>
                                <label className="text-xs cursor-pointer font-semibold lg:mt-2">
                                    Receive
                                </label>
                            </div>
                            <div
                                className={`flex flex-col ${
                                    isCreateTxnPopupOpen
                                        ? "hidden lg:block"
                                        : ""
                                }`}
                            >
                                <div
                                    onClick={() => {
                                        setIsCreateTxnPopupOpen(true);
                                    }}
                                    className="rounded-full sm:rounded-md p-2.5 w-10 h-10 mx-auto bg-slate-800 text-white hover:scale-110 lg:mt-4"
                                >
                                    <BiSend className="text-xl" />
                                </div>
                                <label className="text-xs cursor-pointer font-semibold lg:mt-2">
                                    Send
                                </label>
                            </div>
                        </div>
                    </div>
                    <Transactions
                        txns={txns}
                        appId={appId}
                        appInfo={appInfo}
                        owners={owners}
                    />
                </section>
            )}
        </WalletContext.Provider>
    );
}
