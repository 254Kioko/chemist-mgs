import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LowStockAlert {
  medicineName: string;
  quantity: number;
  adminPhone: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const africasTalkingApiKey = Deno.env.get('AFRICAS_TALKING_API_KEY');
    const africasTalkingUsername = 'sandbox'; // Use 'sandbox' for testing, replace with your username for production

    if (!africasTalkingApiKey) {
      throw new Error('AFRICAS_TALKING_API_KEY not configured');
    }

    const { medicineName, quantity, adminPhone }: LowStockAlert = await req.json();

    console.log(`Sending low stock alert for ${medicineName} (${quantity} left) to ${adminPhone}`);

    const message = `LOW STOCK ALERT: ${medicineName} is running low with only ${quantity} unit(s) remaining. Please restock soon.`;

    // Send SMS using Africa's Talking API
    const smsResponse = await fetch('https://api.sandbox.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': africasTalkingApiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        username: africasTalkingUsername,
        to: adminPhone,
        message: message,
      }),
    });

    const smsData = await smsResponse.json();
    console.log('Africa\'s Talking API response:', smsData);

    if (!smsResponse.ok) {
      throw new Error(`SMS API error: ${JSON.stringify(smsData)}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Low stock alert sent successfully',
        smsResponse: smsData 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-low-stock-alert function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
