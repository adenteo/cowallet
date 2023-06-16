import TxnsAccordion from "./txnsAccordion";

export default function Transactions({ txns, appId, appInfo, owners }) {
    return (
        <div className="bg-white mt-2 m-8 rounded-md min-h-[50vh] max-h-[50vh] lg:min-h-[80vh] lg:max-h-[80vh] flex flex-col items-center lg:mt-12 lg:min-w-[60vw] overflow-y-scroll scrollbar-hide border-b-4 border-slate-800">
            {txns.length == 0 && (
                <div className="my-auto mx-auto text-center">
                    You have no pending transactions.
                </div>
            )}
            <TxnsAccordion
                txns={txns}
                appId={appId}
                appInfo={appInfo}
                owners={owners}
            />
        </div>
    );
}
