import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('IgnitePostAPI key #1 testing');
    if (!apiKey) {
      console.error('IgnitePost API key not found');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { postcardData } = await req.json();
    console.log('Received postcard data:', JSON.stringify(postcardData, null, 2));

    if (!postcardData) {
      return new Response(
        JSON.stringify({ error: 'Postcard data required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { userInfo, representative, senators, finalMessage, sendOption } = postcardData;

    // Parse user's street address into components
    const parseAddress = (fullAddress: string) => {
      // Simple parsing - assuming format: "123 Main St, City, State ZIP"
      const parts = fullAddress.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        const streetAddress = parts[0];
        const city = parts[1];
        const stateZipPart = parts[2];
        // Extract state and zip from "State ZIP" format
        const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
        if (stateZipMatch) {
          const state = stateZipMatch[1];
          const zip = stateZipMatch[2];
          return { streetAddress, city, state, zip };
        } else {
          // Try to split by space and take last part as zip
          const lastSpaceIndex = stateZipPart.lastIndexOf(' ');
          if (lastSpaceIndex > 0) {
            const state = stateZipPart.substring(0, lastSpaceIndex);
            const zip = stateZipPart.substring(lastSpaceIndex + 1);
            return { streetAddress, city, state, zip };
          }
        }
      }
      // Fallback - use the provided userInfo
      return {
        streetAddress: fullAddress,
        city: userInfo.city || '',
        state: userInfo.state || '',
        zip: userInfo.zipCode || ''
      };
    };

    const senderAddress = parseAddress(userInfo.streetAddress);

    // Function to create a postcard order
    const createPostcardOrder = async (recipient: any, message: string, recipientType: 'representative' | 'senator') => {
      const recipientName = recipientType === 'representative' 
        ? `Rep. ${recipient.name.split(' ').pop()}` 
        : `Sen. ${recipient.name.split(' ').pop()}`;

      // Use representative address from Geocodio data, or default Senate address for senators
      let recipientAddress;
      if (recipientType === 'representative' && recipient.address) {
        recipientAddress = {
          address_one: recipient.address,
          city: recipient.city,
          state: recipient.state,
          zip: recipient.district ? '20515' : '20510' // House vs Senate default
        };
      } else {
        // Default Senate address for senators without specific addresses
        recipientAddress = {
          address_one: 'U.S. Senate',
          city: 'Washington',
          state: 'DC',
          zip: '20510'
        };
      }

      const orderData = {
        font: 'kletzien', // Default font as specified
        message: message,
        image: 'white', // Use simple white background for professional appearance
        recipient_name: recipientName,
        recipient_address_one: recipientAddress.address_one,
        recipient_city: recipientAddress.city,
        recipient_state: recipientAddress.state,
        recipient_zip: recipientAddress.zip,
        sender_name: userInfo.fullName,
        sender_address_one: senderAddress.streetAddress,
        sender_city: senderAddress.city,
        sender_state: senderAddress.state,
        sender_zip: senderAddress.zip,
        uid: `${Date.now()}-${recipientType}-${recipient.id || 'unknown'}`,
        'metadata[recipient_type]': recipientType,
        'metadata[representative_id]': recipient.id || 'unknown'
      };

      console.log(`Creating ${recipientType} postcard order:`, JSON.stringify(orderData, null, 2));

      const response = await fetch('https://dashboard.ignitepost.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'X-TOKEN': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(orderData).toString()
      });

      const result = await response.json();
      console.log(`${recipientType} order response:`, JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(`Failed to create ${recipientType} postcard: ${JSON.stringify(result)}`);
      }

      return result;
    };

    const results = [];

    // Send to representative
    try {
      const repMessage = finalMessage.replace(/Rep\.\s+\w+/g, `Rep. ${representative.name.split(' ').pop()}`);
      const repResult = await createPostcardOrder(representative, repMessage, 'representative');
      results.push({
        type: 'representative',
        recipient: representative.name,
        orderId: repResult.id,
        status: 'success'
      });
    } catch (error) {
      console.error('Failed to send representative postcard:', error);
      results.push({
        type: 'representative',
        recipient: representative.name,
        status: 'error',
        error: error.message
      });
    }

    // Send to senators if triple package
    if (sendOption === 'triple' && senators && senators.length > 0) {
      for (const senator of senators) {
        try {
          const senMessage = finalMessage.replace(/Rep\.\s+\w+/g, `Sen. ${senator.name.split(' ').pop()}`);
          const senResult = await createPostcardOrder(senator, senMessage, 'senator');
          results.push({
            type: 'senator',
            recipient: senator.name,
            orderId: senResult.id,
            status: 'success'
          });
        } catch (error) {
          console.error(`Failed to send senator postcard to ${senator.name}:`, error);
          results.push({
            type: 'senator',
            recipient: senator.name,
            status: 'error',
            error: error.message
          });
        }
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`Postcard sending complete: ${successCount} successful, ${errorCount} failed`);

    return new Response(
      JSON.stringify({
        success: errorCount === 0,
        results,
        summary: {
          totalSent: successCount,
          totalFailed: errorCount,
          sendOption
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Postcard sending error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send postcards',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});