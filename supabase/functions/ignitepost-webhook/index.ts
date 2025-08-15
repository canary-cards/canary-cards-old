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
    console.log('=== IgnitePost Webhook Received ===');
    console.log('Method:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    // Only process POST requests
    if (req.method !== 'POST') {
      console.log('Non-POST request received, ignoring');
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Parse the webhook payload
    const webhookData = await req.json();
    console.log('Webhook payload:', JSON.stringify(webhookData, null, 2));

    // Extract key information from the webhook
    const {
      order_id,
      order_status,
      event_type,
      metadata,
      timestamp,
      // Add other fields that IgnitePost might send
    } = webhookData;

    console.log('=== Extracted Information ===');
    console.log('Order ID:', order_id);
    console.log('Order Status:', order_status);
    console.log('Event Type:', event_type);
    console.log('Metadata:', metadata);
    console.log('Timestamp:', timestamp);

    // Check if this is an order placed notification
    if (event_type === 'order.placed' || order_status === 'placed') {
      console.log('🎉 ORDER PLACED notification detected');
      
      // Extract user information from metadata if available
      if (metadata) {
        console.log('User UID from metadata:', metadata.uid);
        console.log('User email from metadata:', metadata.userEmail);
        console.log('Representative from metadata:', metadata.representative);
        console.log('Send option from metadata:', metadata.sendOption);
      }
      
      // TODO: In future, trigger order placed email notification
      console.log('TODO: Send order placed confirmation email');
    }

    // Check if this is a delivery notification
    if (event_type === 'order.delivered' || order_status === 'delivered' || event_type === 'delivery.post_office') {
      console.log('📮 DELIVERY notification detected');
      
      // Extract user information from metadata if available
      if (metadata) {
        console.log('User UID from metadata:', metadata.uid);
        console.log('User email from metadata:', metadata.userEmail);
      }
      
      // TODO: In future, trigger delivery notification email
      console.log('TODO: Send delivery notification email');
    }

    // Log any other event types for debugging
    if (event_type && !['order.placed', 'order.delivered', 'delivery.post_office'].includes(event_type)) {
      console.log('ℹ️ Unknown event type received:', event_type);
    }

    console.log('=== Webhook Processing Complete ===');

    // Return success response to IgnitePost
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook received and processed',
        order_id: order_id 
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to process webhook',
        message: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});