from beaker import *
from pyteal import *
import base64



class ScwState:
    name = GlobalStateValue(
        stack_type=TealType.bytes,
        default=Bytes(""),
        descr="Name of smart contract wallet"
    )
    version = GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Smart wallet contract version number"
    )
    owners = ReservedGlobalStateValue(
        stack_type=TealType.bytes,
        max_keys=10,
        descr="An owner's public address"
    )
    threshold = GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Signing threshold of smart contract wallet"
    )
    ownersCount = GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Number of owners in smart contract wallet"
    )
    


APP_NAME = "SmartContractWallet"
app = Application(APP_NAME, state=ScwState())


@app.create
def create(name: abi.String, version: abi.Uint64, threshold: abi.Uint64, *, output: abi.String):
    return Seq(
        app.initialize_global_state(),
        app.state.name.set(name.get()),
        app.state.version.set(version.get()),
        app.state.threshold.set(threshold.get()),
        output.set("Created smart contract wallet."),
    )

@app.external
def set_owner(index: abi.Uint64, address: abi.Address, *, output: abi.String):
    return Seq(app.state.owners[index].set(address.get()),
               app.state.ownersCount.set(app.state.ownersCount.get() + Int(1)),
               output.set(Concat(Bytes("Added "), address.get(), Bytes(" as owner."))))


@app.opt_in(bare=True)
def opt_in():
    return Seq(
        Assert(isOwner(Txn.sender())), 
        app.initialize_local_state())



@app.external
def send_algos(amount: abi.Uint64, boxName: abi.String, *, output: abi.String):
    return Seq(
        Assert(isOwner(Txn.sender())),
        Assert(hasMetSignaturesThreshold(boxName.get())),
        InnerTxnBuilder.Begin(),
          InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: amount.get(),
                TxnField.receiver: Txn.accounts[1]
            }
        ),
        InnerTxnBuilder.Submit(),
        output.set("Submitted ALGOs transfer txn.")
    )

@app.external
def sign_txn(name: abi.String,*,output: abi.Uint64):
    currentSignaturesCount = App.box_extract(name.get(), Int(0), Int(8))
    newSignaturesCount = Btoi(currentSignaturesCount) + Int(1)
    return Seq([
        Assert(isOwner(Txn.sender())),
        App.box_replace(name.get(),Int(0), Itob(newSignaturesCount)),
        output.set(newSignaturesCount)
    ])


@app.external
def add_txn(name: abi.String, txn: abi.String,*,output: abi.String):
    return Seq([
        Assert(isOwner(Txn.sender())),
        App.box_put(name.get(), Concat(Itob(Int(1)), txn.get())), # First byte will be number of current signatures
        output.set("Added txn to box storage")
    ])

@app.external
def remove_txn(name: abi.String):
    return Seq([
        Assert(isOwner(Txn.sender())),
        Assert(App.box_delete(name.get()))
    ])

@Subroutine(TealType.uint64)
def isOwner(sender):
    totalOwners = ScratchVar(TealType.uint64)
    i = ScratchVar(TealType.uint64)
    return Seq([
        totalOwners.store(app.state.ownersCount.get()),
        For(i.store(Int(0)), i.load() < totalOwners.load(), i.store(i.load() + Int(1))).Do(
            If(app.state.owners[Itob(i.load())] == sender).Then(Return(Int(1))),
        ),
        Return(Int(0))
    ])
    
@Subroutine(TealType.uint64)
def hasMetSignaturesThreshold(boxName):
    signaturesCount = App.box_extract(boxName, Int(0), Int(8))
    return Seq([
        If((Btoi(signaturesCount)) >= app.state.threshold).Then(Return(Int(1))).Else(Return(Int(0)))
    ])



if __name__ == "__main__":
    app.build().export(f"./artifacts/{APP_NAME}")

