
import { NextResponse } from "next/server";

// This route is deprecated and no longer used.
// The logic has been moved to client-side components calling server actions directly.
// See /verify-payment/page.tsx and /verify-verification-payment/page.tsx

export async function GET(req: Request) {
    const redirectUrl = new URL('/', req.url);
    redirectUrl.searchParams.set('error', 'deprecated_route');
    redirectUrl.searchParams.set('error_description', 'This verification endpoint is no longer in use.');
    return NextResponse.redirect(redirectUrl);
}
