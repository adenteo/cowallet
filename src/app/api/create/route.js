import { NextResponse } from "next/server";
import { createScwTxnObject } from "../../../useractions";
export async function POST(request) {
    const { name, version, threshold, activeAddress, owners } =
        await request.json();
    const scwTxnObject = await createScwTxnObject(
        name,
        version,
        threshold,
        activeAddress,
        owners
    );
    return new Response(JSON.stringify(scwTxnObject));
}
