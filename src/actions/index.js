import algosdk from "algosdk";
import { getAlgodClient } from "../clients";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

const readGlobalState = async (appId) => {
    const app = await algodClient.getApplicationByID(appId).do();

    // global state is a key value array
    const globalState = app.params["global-state"];
    const globalStateDecoded = globalState.map((state) => {
        const decodedKey = Buffer.from(state.key, "base64").toString();
        const decodedValue =
            state.value.type == 1
                ? Buffer.from(state.value.bytes, "base64").toString()
                : state.value.uint;
        return { [decodedKey]: decodedValue };
    });
    const appGlobalStateDecodedObject = globalStateDecoded.reduce(
        (acc, obj) => {
            return { ...acc, ...obj };
        },
        {}
    );
    return appGlobalStateDecodedObject;
};

module.exports = {
    readGlobalState,
};
