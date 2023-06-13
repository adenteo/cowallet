import { useState } from "react";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { getAlgodClient } from "../../clients";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

const AddOwnerPopup = ({ onAddOwner, owners, setIsAddOwnersPopupOpen }) => {
    const [address, setAddress] = useState("");
    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const handleAddOwner = async () => {
        if (address.trim() !== "" && isAddressValid) {
            setError(false);
            try {
                await algodClient.accountInformation(address).do();
            } catch (err) {
                console.log("error");
                setErrorMsg("Account does not exist.");
                setError(true);
                return;
            }
            if (owners.includes(address)) {
                setErrorMsg("Account already added as owner.");
                setError(true);
                return;
            }
            onAddOwner(address);
            setAddress("");
            setError(false);
        } else {
            setErrorMsg("Please enter a valid 58 character address.");
            setError(true);
        }
    };

    const isAddressValid = address.trim().length === 58;
    const validIndicator = isAddressValid
        ? "border-green-500"
        : "border-gray-300";

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-xl max-w-screen-xl">
                <AiOutlineCloseCircle
                    className="mx-auto m-2 text-2xl my-4 hover:text-gray-600 cursor-pointer"
                    onClick={() => {
                        setIsAddOwnersPopupOpen(false);
                    }}
                />
                <div className="flex flex-col">
                    <input
                        type="text"
                        className={`${validIndicator} rounded p-2 mb-2 px-4 py-2`}
                        placeholder="Enter address"
                        value={address}
                        maxLength={58}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>
                <button
                    className="bg-slate-800 px-4 py-2 text-base text-white hover:bg-slate-700 rounded my-2 w-full"
                    onClick={handleAddOwner}
                >
                    Add Owner
                </button>
                {error && (
                    <div className="text-red-500 text-xs">{errorMsg}</div>
                )}
                {owners.length > 0 && (
                    <div className="mt-4 max-w-xs">
                        <h2 className="font-bold">Owners:</h2>
                        <ul>
                            {owners.map((owner, index) => (
                                <li
                                    className="text-ellipsis overflow-hidden"
                                    key={index}
                                >
                                    {owner}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddOwnerPopup;
