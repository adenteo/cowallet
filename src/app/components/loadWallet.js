"use client";

import { IoIosArrowBack } from "react-icons/io";
import { BiWallet } from "react-icons/bi";
import { useState } from "react";
import { getAlgodClient } from "../../clients";
import { useRouter } from "next/navigation";
import { AiOutlineLoading } from "react-icons/ai";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

export default function LoadWallet({ setCurrentStep }) {
    const [id, setId] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Handle form submission with the entered data
        if (id) {
            try {
                setErrorMsg("");
                const app = await algodClient
                    .getApplicationByID(parseInt(id))
                    .do();
                router.push("/wallet/" + app.id);
            } catch (err) {
                console.log(err);
                setErrorMsg("Invalid wallet ID. Please try again.");
                setLoading(false);
                return;
            }
        }
    };
    return (
        <div className="flex items-center justify-center h-[90vh]">
            <div className="bg-white p-8 rounded-md">
                <label
                    onClick={() => {
                        setCurrentStep({ mainMenu: 1 });
                    }}
                    className="flex cursor-pointer justify-center text-gray-600"
                >
                    <IoIosArrowBack className="text-2xl"></IoIosArrowBack>
                    Back
                </label>
                <h1 className="text-3xl font-bold text-center my-2">
                    Load wallet
                    <BiWallet className="mx-auto text-4xl" />
                </h1>
                <div className="text-xs text-stone-500 text-center">
                    Enter wallet ID
                </div>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>
                            <input
                                className="mx-2 my-4 rounded-md"
                                type="number"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                placeholder="Wallet ID"
                            />
                        </label>
                    </div>
                    {errorMsg && (
                        <div className="text-xs text-red-500 text-center">
                            {errorMsg}
                        </div>
                    )}
                    <button
                        className="my-4 bg-slate-800 rounded-md p-3 px-5 text-white flex justify-center mx-auto"
                        type="submit"
                    >
                        {!loading ? (
                            "Load Wallet"
                        ) : (
                            <div>
                                <AiOutlineLoading className="animate-spin" />
                            </div>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
