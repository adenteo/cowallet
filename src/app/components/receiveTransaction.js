"use client";
import QRCode from "qrcode.react";
import { AiOutlineClose, AiOutlineCopy } from "react-icons/ai";

export default function ReceiveTransaction({
    receiver,
    setIsReceiveTxnPopupOpen,
}) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-md lg:max-w-sm overflow-hidden">
                <AiOutlineClose
                    className="mx-auto m-2 text-xl hover:text-gray-800 cursor-pointer text-gray-600"
                    onClick={() => {
                        setIsReceiveTxnPopupOpen(false);
                    }}
                />
                <div>
                    Scan the QR code below to send ALGOs and assets to your
                    CoWallet.
                </div>
                <div className="text-xs my-2 text-slate-800">
                    To receive ASA, please make sure to opt in by sending an
                    opt-in transaction.
                </div>
                <div className="flex justify-center items-center p-2 text-ellipsis">
                    <QRCode size={300} value={receiver} />
                </div>
                <div
                    onClick={() => {
                        navigator.clipboard.writeText(receiver);
                    }}
                    className="flex justify-center items-center hover:text-stone-500 cursor-pointer"
                >
                    <AiOutlineCopy className="mx-1" />
                    Copy address
                </div>
            </div>
        </div>
    );
}
