import algosdk from "algosdk";
import { getAlgodClient } from "../clients";

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

const readGlobalState = async (appId) => {
    const app = await algodClient.getApplicationByID(appId).do();
    // global state is a key value array
    const globalState = app.params["global-state"];
    console.log(globalState);
    const globalStateDecoded = globalState.map((state) => {
        let decodedKey = Buffer.from(state.key, "base64").toString();
        const decodedValue =
            state.value.type == 1
                ? decodedKey == "name"
                    ? Buffer.from(state.value.bytes, "base64").toString()
                    : algosdk.encodeAddress(
                          Buffer.from(state.value.bytes, "base64")
                      )
                : state.value.uint;
        if (
            Buffer.from(state.key, "base64").toString("hex").slice(0, 27) ==
            "6f776e657273000000000000000" // Key is an owner
        ) {
            decodedKey = parseInt(
                Buffer.from(state.key, "base64").toString("hex").slice(27, 28)
            );
        }
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
