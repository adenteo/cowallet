import TxnsAccordion from "./txnsAccordion";

export default function Transactions({ txns, appId, appInfo, owners }) {
    return txns.length >= 1 ? (
        <div className="bg-white mt-10 m-8 rounded-md min-h-[50vh] max-h-[50vh] lg:min-h-[80vh] lg:max-h-[80vh] lg:flex lg:flex-col lg:items-center lg:mt-12 lg:min-w-[60vw] overflow-y-scroll scrollbar-hide border-b-4 border-slate-800">
            <TxnsAccordion
                txns={txns}
                appId={appId}
                appInfo={appInfo}
                owners={owners}
            />
        </div>
    ) : (
        <div className="bg-white mt-10 m-8 rounded-md min-h-[50vh] max-h-[50vh] lg:min-h-[80vh] lg:max-h-[80vh] lg:mt-12 lg:min-w-[60vw] border-b-4 border-slate-800 flex items-center justify-center">
            <span>You have no pending transactions</span>
        </div>
    );
}
