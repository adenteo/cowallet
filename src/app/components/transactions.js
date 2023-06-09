import TxnsAccordion from "./txnsAccordion";

export default function Transactions({ txns, appId, appInfo }) {
    return (
        txns && (
            <div className="bg-white m-8">
                <TxnsAccordion txns={txns} appId={appId} appInfo={appInfo} />
            </div>
        )
    );
}
