import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import algosdk from "algosdk";
import { getAlgodClient } from "../src/clients";
import { readGlobalState } from "../src/actions";
import { getBasicProgramBytes } from "../src/algorand";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
const smartWalletContract = require("../artifacts/SmartContractWallet/contract.json");

const contract = new algosdk.ABIContract(smartWalletContract);

// use chai-as-promise library
chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect;

const creator = algosdk.mnemonicToSecretKey(
    process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC
);

const algodClient = getAlgodClient(process.env.NEXT_PUBLIC_NETWORK);

const submitScwTxn = async (
    name,
    version,
    threshold,
    activeAddress,
    owners
) => {
    const suggestedParams = await algodClient.getTransactionParams().do();
    // programs
    const approvalProgram = await getBasicProgramBytes(
        "../../artifacts/SmartContractWallet/approval.teal"
    );
    const clearProgram = await getBasicProgramBytes(
        "../../artifacts/SmartContractWallet/clear.teal"
    );

    const numGlobalInts = 3;
    const numGlobalByteSlices = owners.length + 1;
    const numLocalInts = 0;
    const numLocalByteSlices = 1;
    const createMethodSelector = algosdk
        .getMethodByName(contract.methods, "create")
        .getSelector();

    let mergedOwners = new Uint8Array(32 * owners.length);
    let offset = 0;
    owners.forEach((owner) => {
        const ownerUint8 = algosdk.decodeAddress(owner);
        mergedOwners.set(ownerUint8.publicKey, offset);
        offset += 32;
    });

    const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
        from: activeAddress,
        approvalProgram,
        clearProgram,
        numGlobalByteSlices,
        numGlobalInts,
        numLocalByteSlices,
        numLocalInts,
        suggestedParams,
        appArgs: [
            createMethodSelector,
            new algosdk.ABIStringType().encode(name),
            new algosdk.ABIByteType().encode(parseInt(version)),
            new algosdk.ABIByteType().encode(parseInt(threshold)),
            new algosdk.ABIByteType().encode(parseInt(owners.length)),
        ],
        note: mergedOwners,
    });

    const signedTxn = appCreateTxn.signTxn(creator.sk);
    let tx = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction : " + tx.txId);
    let result = await algosdk.waitForConfirmation(algodClient, tx.txID, 4);
    return result["application-index"];
};

describe("Success Tests", function () {
    let appId;
    // Deploy Smart Wallet Contract with 3 owners and signing threshold of 2.
    this.beforeEach(async () => {
        const owners = [
            creator.addr,
            "I5LYS46CGPBBBTMTUDVKEL5UKSTSBLUGHSYTYVCIUJ3ZEUO4JAS5PK3MJU",
            "5XNG74B6IMI34TVO6C72R2IUTZV5JZDNNDKSAQ4YR45DC7Y6ZKLL6NAY4Q",
        ];
        appId = await submitScwTxn("wallet", "1", "2", creator.addr, owners);
        console.log(appId);
    });

    it("Successfully deploy and fund smart wallet contract", async () => {
        assert.isDefined(appId);
    });

    // const globalStates = await readGlobalState()
    //owners are saved to global state
    //owner can create send algos
    //owner can create send asa
    //owner can create send opt in
    //box saved aft creating txn
    //owner can sign
    //owner can execute
    //box removed aft execution
});
