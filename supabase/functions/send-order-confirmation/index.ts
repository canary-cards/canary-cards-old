import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  userInfo: {
    fullName: string;
    email: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  };
  representative: {
    name: string;
    state: string;
    party: string;
    type: string;
  };
  senators?: Array<{
    name: string;
    state: string;
    party: string;
  }>;
  sendOption: 'single' | 'triple';
  orderResults: Array<{
    type: string;
    recipient: string;
    orderId: string;
    status: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInfo, representative, senators, sendOption, orderResults }: OrderConfirmationRequest = await req.json();

    console.log('Sending order confirmation email to:', userInfo.email);

    if (!userInfo.email) {
      console.log('No email provided, skipping email confirmation');
      return new Response(JSON.stringify({ message: 'No email provided' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const successfulOrders = orderResults.filter(order => order.status === 'success');
    const recipientList = successfulOrders.map(order => order.recipient).join(', ');
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Postcard Order Confirmation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px 24px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
            .content { padding: 32px 24px; }
            .success-icon { text-align: center; margin-bottom: 24px; }
            .success-icon div { width: 64px; height: 64px; background-color: #10b981; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
            .success-icon svg { width: 32px; height: 32px; color: white; }
            .order-details { background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0; }
            .order-details h3 { margin: 0 0 16px 0; color: #1f2937; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .detail-label { font-weight: 600; color: #6b7280; }
            .detail-value { color: #1f2937; }
            .timeline { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; }
            .timeline h4 { margin: 0 0 12px 0; color: #1e40af; }
            .timeline ul { margin: 0; padding-left: 20px; color: #374151; }
            .footer { background-color: #f8fafc; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📮 Canary Cards</h1>
              <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Your voice delivered to your representatives</p>
            </div>
            
            <div class="content">
              <div class="success-icon">
                <div>
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </div>
              
              <h2 style="text-align: center; color: #1f2937; margin: 0 0 16px 0;">Your Postcard Has Been Ordered!</h2>
              <p style="text-align: center; color: #6b7280; font-size: 16px; margin: 0 0 32px 0;">
                Hi ${userInfo.fullName}, we've successfully placed your postcard order. Your message will be delivered to your elected representatives.
              </p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Recipients:</span>
                  <span class="detail-value">${recipientList}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Send Option:</span>
                  <span class="detail-value">${sendOption === 'triple' ? 'Triple Package (Rep + 2 Senators)' : 'Single Postcard'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Postcards Sent:</span>
                  <span class="detail-value">${successfulOrders.length}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">From:</span>
                  <span class="detail-value">${userInfo.fullName}, ${userInfo.city}, ${userInfo.state}</span>
                </div>
              </div>
              
              <div class="timeline">
                <h4>📅 What happens next?</h4>
                <ul>
                  <li><strong>Today:</strong> Your postcard order has been submitted and is being processed</li>
                  <li><strong>1-2 business days:</strong> Your postcard will be printed with your personalized message</li>
                  <li><strong>3-5 business days:</strong> Your postcard will be delivered to your representative's office</li>
                  <li><strong>Ongoing:</strong> Your representative's staff will log and consider your message</li>
                </ul>
              </div>
              
              <p style="color: #374151; line-height: 1.6;">
                Thank you for making your voice heard! Your postcard will be delivered directly to ${representative.name}'s office${sendOption === 'triple' ? ' and your senators\' offices' : ''} where it will be read and considered by their staff.
              </p>
              
              <p style="color: #374151; line-height: 1.6;">
                Want to send another postcard on a different issue? <a href="https://canarycards.com" style="color: #3b82f6; text-decoration: none;">Visit Canary Cards</a> to create a new message.
              </p>
            </div>
            
            <div class="footer">
              <p>This email was sent to confirm your postcard order with Canary Cards.</p>
              <p>© 2024 Canary Cards. Making democracy more accessible, one postcard at a time.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Canary Cards <hello@canarycards.com>",
      to: [userInfo.email],
      subject: `Your Postcard to ${representative.name} Has Been Ordered!`,
      html: emailHtml,
    });

    console.log("Order confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);