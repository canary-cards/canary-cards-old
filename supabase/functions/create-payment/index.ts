import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { sendOption, email } = await req.json();
    
    if (!sendOption || !email) {
      throw new Error("Missing required fields: sendOption and email");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("stripe secret key") || "", {
      apiVersion: "2023-10-16",
    });

    // Set pricing based on send option
    const pricing = {
      single: { amount: 499, name: "Single Postcard" },
      triple: { amount: 1199, name: "Triple Postcard Package" }
    };

    const selectedPricing = pricing[sendOption as keyof typeof pricing];
    if (!selectedPricing) {
      throw new Error("Invalid send option");
    }

    // Create checkout session with Apple Pay and Google Pay enabled
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['card', 'apple_pay', 'google_pay'],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: selectedPricing.name,
              description: `Civic postcard delivery to your representative`
            },
            unit_amount: selectedPricing.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        send_option: sendOption,
        user_email: email
      }
    });

    console.log("Created Stripe session:", session.id, "for", email, "option:", sendOption);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});