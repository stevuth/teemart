// /src/pages/api/paystack/banks.ts

import type { NextApiRequest, NextApiResponse } from "next";
import axios from 'axios';

const PAYSTACK_API_URL = 'https://api.paystack.co';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const paystackSecretKey = process.env.PAYSTACK_LIVE_SECRET_KEY;

  if (!paystackSecretKey) {
    console.error("Paystack live secret key is not set in environment variables.");
    return res.status(500).json({ success: false, error: 'Server configuration error: Paystack key not found.' });
  }

  try {
    const response = await axios.get(`${PAYSTACK_API_URL}/bank`, {
        headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            "Content-Type": "application/json",
        }
    });
    
    if (response.data.status) {
        // De-duplicate the bank list based on the unique 'code' property.
        const uniqueBanks = Array.from(new Map(response.data.data.map((bank: any) => [bank.code, bank])).values());
        return res.status(200).json({ success: true, data: uniqueBanks as any[] });
    } else {
        return res.status(400).json({ success: false, error: response.data.message });
    }

  } catch (error: any) {
    console.error("Error fetching bank list from Paystack API route:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ success: false, error: 'Could not retrieve bank list from Paystack.' });
  }
}
