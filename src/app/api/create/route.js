import { NextResponse } from "next/server";
import { createScwTxn } from "../../../useractions";
import algosdk from "algosdk";
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
    console.log(scwTxn);
    const buffer = Buffer.from(scwTxn).toString("base64");
    return new Response(Buffer.from(scwTxn).toString("base64"));
}
