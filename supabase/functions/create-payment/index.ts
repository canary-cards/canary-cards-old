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
    const { sendOption, email, fullName } = await req.json();
    
    if (!sendOption || !email) {
      throw new Error("Missing required fields: sendOption and email");
    }

    // Parse full name into first and last name for Stripe
    let firstName = "";
    let lastName = "";
    if (fullName) {
      const nameParts = fullName.trim().split(" ");
      firstName = nameParts[0] || "";
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
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

    // Create or update Stripe customer with name information
    let customerId;
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      // Update existing customer with name and billing details if provided
      if (fullName && (!customers.data[0].name || customers.data[0].name !== fullName)) {
        await stripe.customers.update(customerId, { 
          name: fullName,
          metadata: { full_name: fullName }
        });
      }
    } else {
      // Always create new customer, with or without name
      const customer = await stripe.customers.create({
        email,
        name: fullName || undefined, // Let Stripe handle empty names gracefully
        metadata: { full_name: fullName || "" }
      });
      customerId = customer.id;
    }

    // Create embedded checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      payment_method_types: ['card', 'link'],
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
      ui_mode: "embedded",
      return_url: `${req.headers.get("origin")}/payment-return?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        send_option: sendOption,
        user_email: email,
        user_full_name: fullName || ""
      }
    });

    console.log("Created Stripe embedded session:", session.id, "for", email, "option:", sendOption);

    return new Response(JSON.stringify({ 
      client_secret: session.client_secret,
      session_id: session.id 
    }), {
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