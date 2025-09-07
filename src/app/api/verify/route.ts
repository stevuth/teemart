
import { NextResponse } from "next/server";
import { verifyAndProcessTransaction } from "@/app/actions/paystack";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  const redirectUrl = new URL('/verify-payment', req.url)

  if (!reference) {
    redirectUrl.searchParams.set('status', 'failed');
    redirectUrl.searchParams.set('error', 'No payment reference provided.');
    return NextResponse.redirect(redirectUrl);
  }

  const result = await verifyAndProcessTransaction(reference);

  if (result.success) {
      redirectUrl.searchParams.set('status', 'success');
      return NextResponse.redirect(redirectUrl);
  } else {
      redirectUrl.searchParams.set('status', 'failed');
      redirectUrl.searchParams.set('error', result.error || 'Verification failed.');
      return NextResponse.redirect(redirectUrl);
  }
}
