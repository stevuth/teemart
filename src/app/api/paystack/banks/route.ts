
import { NextResponse } from 'next/server';
import axios from 'axios';

const PAYSTACK_API_URL = 'https://api.paystack.co';

export async function GET() {
  const paystackSecretKey = process.env.PAYSTACK_LIVE_SECRET_KEY;
  console.log("PAYSTACK_LIVE_SECRET_KEY availability:", !!paystackSecretKey);

  if (!paystackSecretKey) {
    console.error("Paystack live secret key is not set in environment variables.");
    return NextResponse.json({ success: false, error: 'Server configuration error: Paystack key not found.' }, { status: 500 });
  }

  try {
    const response = await axios.get(`${PAYSTACK_API_URL}/bank`, {
        headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            "Content-Type": "application/json",
        },
        timeout: 10000 // 10-second timeout
    });
    
    if (response.data.status) {
        // De-duplicate the bank list based on the unique 'code' property.
        const uniqueBanks = Array.from(new Map(response.data.data.map((bank: any) => [bank.code, bank])).values());
        return NextResponse.json({ success: true, data: uniqueBanks as any[] });
    } else {
        console.error("Paystack API returned an error:", response.data.message);
        return NextResponse.json({ success: false, error: response.data.message }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Error fetching bank list from Paystack API route:", error.response?.data || error.message);
    // Provide more specific error details if available from Axios error object
    const errorMessage = error.response?.data?.message || 'An unexpected error occurred while contacting Paystack.';
    const statusCode = error.response?.status || 500;
    return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
  }
}
