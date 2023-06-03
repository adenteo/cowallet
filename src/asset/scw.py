from beaker import *
from pyteal import *

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
    transactionsCount = GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Number of pending transactions in smart contract wallet"
    )
    


APP_NAME = "SmartContractWallet"
app = Application(APP_NAME, state=ScwState())

def isOwner():
    encoded = app.state.owners.get()
    decoded = Base64Decode(encoded)
    array = list(decoded)
    return True

@app.create
def create(name: abi.String, version: abi.Uint64, threshold: abi.Uint64, *, output: abi.String):
    return Seq(
        app.initialize_global_state(),
        app.state.name.set(name.get()),
        app.state.version.set(version.get()),
        app.state.threshold.set(threshold.get()),
        app.state.transactionsCount.set(Int(0)),
        output.set("Created smart contract wallet!")
    )

@app.external
def set_owner(index: abi.Uint64, address: abi.String, *, output: abi.String):
    return Seq(app.state.owners[index].set(address.get()),
               output.set("Set owner!"))
# @app.external
# def opt_in(*, output: abi.String):
#     return Seq(
#         Assert(Txn.sender() == app.state.owners[1].get()),
#         InnerTxnBuilder.Begin(),
#         InnerTxnBuilder.SetFields(
#             {
#                 TxnField.type_enum: TxnType.AssetTransfer,
#                 TxnField.asset_amount: Int(0),
#                 TxnField.asset_receiver: Global.current_application_address(),
#                 TxnField.xfer_asset: Txn.assets[0],
#             }
#         ),
#         InnerTxnBuilder.Submit(),
#         output.set("Opted into smart wallet contract!")
#     )


if __name__ == "__main__":
    app.build().export(f"./artifacts/{APP_NAME}")

