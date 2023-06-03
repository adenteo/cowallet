"use client";
import { BiWallet } from "react-icons/bi";
import { useWallet } from "@txnlab/use-wallet";
import { useState } from "react";
import { useRouter } from "next/router";
import { IoIosAddCircleOutline, IoIosArrowBack } from "react-icons/io";

export default function CreateWallet({
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
    const [fields, setFields] = useState([{ value: "" }]);
    const [formData, setFormData] = useState({
        version: "",
        name: "",
        threshold: "",
    });
    const createWallet = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            const result = await response.text();
            console.log(result);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleChange = (index, event) => {
        const values = [...fields];
        values[index].value = event.target.value;
        setFields(values);
    };

    const handleAddField = () => {
        const values = [...fields];
        values.push({ value: "" });
        setFields(values);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log(formData);
        console.log(fields);
        try {
            const response = await fetch("/api/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            const result = await response.text();
            console.log(result);
        } catch (error) {
            console.error("Error:", error);
        }
        setFormData({
            version: "",
            name: "",
            threshold: "",
        });
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="max-w-xs overflow-auto">{activeAddress}</div>
            <div className="bg-white p-10 rounded-lg">
                <label
                    onClick={() => {
                        setCurrentStep({ mainMenu: 1 });
                        router.back();
                    }}
                    className="flex cursor-pointer justify-center text-gray-600"
                >
                    <IoIosArrowBack className="text-2xl"></IoIosArrowBack>
                    Back
                </label>
                <h1 className="text-3xl font-bold text-center my-2">
                    Create wallet
                    <BiWallet className="mx-auto text-4xl" />
                </h1>
                <div className="my-3">
                    <form
                        onSubmit={handleSubmit}
                        className="mx-auto max-w-xs lg:max-w-sm"
                    >
                        <div className="text-center my-3">Name of wallet</div>
                        <input
                            type="text"
                            name="name"
                            className="w-full rounded border border-gray-300 px-4 py-2"
                            placeholder="Enter name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                        <div className="text-center my-3">Version</div>
                        <label>
                            <input
                                type="text"
                                name="version"
                                placeholder="Enter version"
                                className="w-full rounded border border-gray-300 px-4 py-2"
                                value={formData.version}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <br />
                        <div className="text-center my-3">
                            Signing threshold
                        </div>
                        <input
                            type="text"
                            className="w-full rounded border border-gray-300 px-4 py-2"
                            name="threshold"
                            placeholder="Enter threshold"
                            value={formData.threshold}
                            onChange={handleInputChange}
                            required
                        />
                        <br />
                        <div className="text-center my-3">
                            Add owners (Max: 10)
                        </div>
                        {fields.map((field, index) => (
                            <div className="mb-4" key={index}>
                                <input
                                    type="text"
                                    className="w-full rounded border border-gray-300 px-4 py-2"
                                    placeholder="Enter public address"
                                    value={field.value}
                                    onChange={(event) =>
                                        handleChange(index, event)
                                    }
                                    required
                                />
                            </div>
                        ))}
                        <div className="flex justify-end">
                            <IoIosAddCircleOutline
                                className="cursor-pointer text-2xl hover:text-slate-600"
                                onClick={handleAddField}
                            />
                        </div>
                        <div className="mt-4 flex justify-center">
                            <button
                                type="submit"
                                className="rounded bg-slate-800 px-4 py-2 text-base text-white hover:bg-slate-700 lg:mb-10"
                            >
                                Next
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
