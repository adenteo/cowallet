import algosdk from "algosdk";

const contractData = require("../../artifacts/SmartContractWallet/contract.json");
const contract = new algosdk.ABIContract(contractData);

const addOwners = async (algodClient, address, signer, owners, appId) => {
    const addOwnerMethod = algosdk.getMethodByName(
        contract.methods,
        "set_owner"
    );
    const suggestedParams = await algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer();
    owners.forEach(async (owner, index) => {
        atc.addMethodCall({
            suggestedParams,
            sender: address,
            signer,
            appID: parseInt(appId),
            method: addOwnerMethod,
            methodArgs: [index, owner],
        });
    });
    await atc.execute(algodClient, 4);
    console.log("done!");
};

module.exports = {
    addOwners,
};
