import algosdk from "algosdk";
import { getAlgodClient } from "../clients";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

const readGlobalState = async (appId) => {
    const app = await algodClient.getApplicationByID(appId).do();

    // global state is a key value array
    const globalState = app.params["global-state"];
    const textDecoder = new TextDecoder();
    const gsmap = new Map();
    globalState.forEach((item) => {
        // decode from base64 and utf8
        const formattedKey = textDecoder.decode(
            Buffer.from(item.key, "base64")
        );

        let formattedValue;
        if (item.value.type === 1) {
            formattedValue = textDecoder.decode(
                Buffer.from(item.value.bytes, "base64")
            );
        } else {
            formattedValue = item.value.uint;
        }

        gsmap.set(formattedKey, formattedValue);
    });

    return gsmap;
};

module.exports = {
    readGlobalState,
};
