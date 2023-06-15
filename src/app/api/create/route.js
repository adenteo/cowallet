import { createScwTxn } from "../../../useractions";
export async function POST(request) {
    const { name, version, threshold, activeAddress, owners } =
        await request.json();
    const scwTxn = await createScwTxn(
        name,
        version,
        threshold,
        activeAddress,
        owners
    );
    const buffer = Buffer.from(scwTxn).toString("base64");
    return new Response(Buffer.from(scwTxn).toString("base64"));
}
