import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaleNotification {
  saleNumber: string;
  totalAmount: number;
  cashierName: string;
  items: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { saleNumber, totalAmount, cashierName, items }: SaleNotification = await req.json();
    
    const apiKey = Deno.env.get('AFRICAS_TALKING_API_KEY');
    const username = 'sandbox'; // Change to your username in production
    
    if (!apiKey) {
      throw new Error('AFRICAS_TALKING_API_KEY is not set');
    }

    const message = `New Sale Alert!\nSale: ${saleNumber}\nCashier: ${cashierName}\nItems: ${items}\nTotal: KES ${totalAmount.toFixed(2)}\nTime: ${new Date().toLocaleString()}`;
    
    const response = await fetch('https://api.sandbox.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        'username': username,
        'to': '+254742048000',
        'message': message
      })
    });

    const data = await response.json();
    console.log('SMS sent:', data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});