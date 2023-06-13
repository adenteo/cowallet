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
def sign_txn(name: abi.String,*,output: abi.String):
    index = isOwner(Txn.sender())
    status = App.box_extract(name.get(), index - Int(1), Int(1))
    return Seq([
        Assert(index),
        Assert(status == Bytes("0")),
        App.box_replace(name.get(), index - Int(1), Bytes("1")),
        output.set(Concat(Txn.sender(), Bytes(" signed transaction "), name.get()))
    ])


@app.external
def add_txn(name: abi.String, txn: abi.String,*,output: abi.String):
    index = isOwner(Txn.sender())
    return Seq([
        Assert(index),
        App.box_put(name.get(), Concat(Substring(Bytes("0000000000"), Int(0), app.state.ownersCount.get()), txn.get())),
        App.box_replace(name.get(), index - Int(1), Bytes("1")), # Set txn creator's signing status to signed.
        output.set("Added txn to box storage")
    ])

@app.external
def remove_txn(name: abi.String):
    return Seq([
        Assert(isOwner(Txn.sender())),
        Assert(App.box_delete(name.get()))
    ])

# Checks if sender is owner. Returns 1-based index of owner in the reserved global state values if exists
@Subroutine(TealType.uint64)
def isOwner(sender):
    totalOwners = ScratchVar(TealType.uint64)
    i = ScratchVar(TealType.uint64)
    return Seq([
        totalOwners.store(app.state.ownersCount.get()),
        For(i.store(Int(0)), i.load() < totalOwners.load(), i.store(i.load() + Int(1))).Do(
            If(app.state.owners[Itob(i.load())] == sender).Then(Return(i.load() + Int(1))),
        ),
        Return(Int(0))
    ])


@Subroutine(TealType.uint64)
def hasMetSignaturesThreshold(boxName):
    totalOwners = ScratchVar(TealType.uint64)
    signaturesCount = ScratchVar(TealType.uint64)
    i = ScratchVar(TealType.uint64)
    return Seq([
        totalOwners.store(app.state.ownersCount.get()),
        signaturesCount.store(Int(0)),
        For(i.store(Int(0)), i.load() < totalOwners.load(), i.store(i.load() + Int(1))).Do(
            If(App.box_extract(boxName, i.load(), Int(1)) == Bytes("1")).Then(
                signaturesCount.store(signaturesCount.load() + Int(1))
            )
        ),
        If(signaturesCount.load() >= app.state.threshold).Then(Return(Int(1))).Else(Return(Int(0)))
    ])



if __name__ == "__main__":
    app.build().export(f"./artifacts/{APP_NAME}")

