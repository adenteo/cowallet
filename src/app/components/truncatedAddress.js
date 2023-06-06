import { IoIosSettings } from "react-icons/io";

const TruncatedAddress = ({
    text,
    maxLength,
    showDropdown,
    setShowDropdown,
}) => {
    const truncatedText = `${text.substring(0, maxLength)}...${text.substring(
        text.length - maxLength
    )}`;

    return (
        <div
            onClick={() => {
                setShowDropdown(!showDropdown);
            }}
            className="truncate m-1.5 px-2 border rounded text-xs p-1.5 hover:bg-slate-500 cursor-pointer flex"
        >
            <IoIosSettings className="m-0.5" />
            {truncatedText}
        </div>
    );
};

export default TruncatedAddress;
