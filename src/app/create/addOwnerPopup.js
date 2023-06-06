import { useState } from "react";
import { AiOutlineCloseCircle } from "react-icons/ai";
const AddOwnerPopup = ({ onAddOwner, owners, setIsPopupOpen }) => {
    const [address, setAddress] = useState("");
    const [error, setError] = useState(false);

    const handleAddOwner = () => {
        if (address.trim() !== "" && isAddressValid) {
            onAddOwner(address);
            setAddress("");
            setError(false);
        } else {
            setError(true);
        }
    };

    const isAddressValid = address.trim().length === 58;
    const validIndicator = isAddressValid
        ? "border-green-500"
        : "border-gray-300";

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-4 rounded max-w-screen-xl">
                <AiOutlineCloseCircle
                    className="mx-auto m-2 text-2xl my-4 hover:text-gray-600"
                    onClick={() => {
                        setIsPopupOpen(false);
                    }}
                />
                <input
                    type="text"
                    className={`border rounded p-2 mb-2 px-4 py-2 ${validIndicator}`}
                    placeholder="Enter address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ outline: "none" }}
                />
                <button
                    className="bg-slate-800 px-4 py-2 ml-3 text-base text-white hover:bg-slate-700 lg:mb-10 rounded"
                    onClick={handleAddOwner}
                >
                    Add Owner
                </button>
                {error && !isAddressValid && (
                    <div className="text-red-500 text-xs">
                        Please enter a valid 58 character address.
                    </div>
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
