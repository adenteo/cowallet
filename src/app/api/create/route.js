import { NextResponse } from "next/server";
import { createScwTxn } from "../../../useractions";

export async function POST(request) {
    const { name, version, threshold, owners } = await request.json();
    const owners2 = [
        "I5LYS46CGPBBBTMTUDVKEL5UKSTSBLUGHSYTYVCIUJ3ZEUO4JAS5PK3MJU",
        "BBQRYLDHXI5VE5DMY3A3YMY5NW7TO7ON3ME6OWQMR5F4XONBJYAY4D2ERU",
        "L7ULOG442UZG46XLFOMZNPJ7GXWM3HP5LOZZFF3QI323JLS4CXHTEL6WQA",
    ];
    const scwTxn = await createScwTxn(
        "BBQRYLDHXI5VE5DMY3A3YMY5NW7TO7ON3ME6OWQMR5F4XONBJYAY4D2ERU",
        name,
        version,
        threshold,
        owners2
    );
    // console.log(scwTxn);
    return new NextResponse("HELLO");
}
