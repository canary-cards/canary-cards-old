import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeliveryNotificationRequest {
  postcardId: number;
  recipientName: string;
  recipientAddress: string;
  senderName: string;
  senderAddress: string;
  senderCity: string;
  senderState: string;
  message: string;
  sentAt: string;
  userEmail?: string;
  recipientType?: string;
  representativeId?: string;
  uid?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      postcardId, 
      recipientName, 
      recipientAddress, 
      senderName, 
      senderAddress,
      senderCity,
      senderState,
      message, 
      sentAt, 
      userEmail, 
      recipientType,
      representativeId,
      uid 
    }: DeliveryNotificationRequest = await req.json();

    console.log('Processing delivery notification for postcard:', postcardId);
    console.log('Recipient:', recipientName);
    console.log('Sender:', senderName);
    console.log('User email:', userEmail);

    // If no user email provided, we can't send the notification
    if (!userEmail) {
      console.log('No user email available, cannot send delivery notification');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No user email available for delivery notification' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Format the sent date for display
    const sentDate = new Date(sentAt);
    const formattedDate = sentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create the delivery notification email with new brand design
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your postcard has been delivered!</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Spectral:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
            
            body {
              margin: 0;
              padding: 20px 0;
              background-color: hsl(32, 73%, 95%); /* Cream background */
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
            }
            
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: hsl(32, 73%, 95%); /* Cream background */
            }
            
            .card {
              background-color: white;
              border-radius: 0.875rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              padding: 20px;
              margin-bottom: 24px;
            }
            
            .header-card {
              text-align: center;
              padding: 24px 20px;
            }
            
            .logo {
              width: 48px;
              height: auto;
              margin: 0 auto 20px;
              display: block;
            }
            
            .title {
              font-family: 'Spectral', serif;
              font-size: 32px;
              font-weight: 700;
              color: hsl(213, 31%, 23%); /* Ink Blue */
              margin: 0 0 8px 0;
              line-height: 1.2;
            }
            
            .subtitle {
              font-family: 'Inter', sans-serif;
              font-size: 18px;
              color: hsl(11, 33%, 49%); /* Brick Red */
              margin: 0;
              font-weight: 500;
            }
            
            .delivery-details-card {
              padding: 20px;
            }
            
            .eyebrow {
              font-family: 'Inter', sans-serif;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: hsl(11, 33%, 49%); /* Brick Red */
              margin: 0 0 16px 0;
            }
            
            .delivery-item {
              padding: 12px 0;
              border-bottom: 1px solid hsl(32, 26%, 87%); /* Divider */
            }
            
            .delivery-item:last-child {
              border-bottom: none;
            }
            
            .delivery-label {
              font-family: 'Inter', sans-serif;
              font-size: 14px;
              font-weight: 600;
              color: hsl(0, 0%, 13%); /* Neutral */
              margin: 0 0 4px 0;
            }
            
            .delivery-value {
              font-family: 'Inter', sans-serif;
              font-size: 16px;
              color: hsl(0, 0%, 13%); /* Neutral */
              margin: 0;
            }
            
            .message-card {
              padding: 20px;
            }
            
            .message-content {
              background-color: hsl(32, 73%, 97%);
              border-radius: 8px;
              padding: 16px;
              border-left: 3px solid hsl(11, 33%, 49%); /* Brick Red */
              font-style: italic;
              color: hsl(0, 0%, 13%); /* Neutral */
              margin-top: 12px;
            }
            
            .impact-card {
              padding: 20px;
            }
            
            .impact-text {
              font-family: 'Inter', sans-serif;
              font-size: 16px;
              color: hsl(0, 0%, 13%); /* Neutral */
              margin: 0 0 16px 0;
              line-height: 1.6;
            }
            
            .cta-card {
              padding: 20px;
              text-align: center;
            }
            
            .button-container {
              display: flex;
              flex-direction: column;
              gap: 12px;
              align-items: center;
            }
            
            .share-button {
              background-color: hsl(47, 100%, 65%); /* Canary Yellow */
              color: hsl(213, 31%, 23%); /* Ink Blue */
              border: 2px solid hsl(213, 31%, 23%); /* Ink Blue border */
              padding: 14px 32px;
              border-radius: 8px;
              text-decoration: none;
              font-family: 'Inter', sans-serif;
              font-weight: 600;
              font-size: 16px;
              display: inline-block;
              width: 200px;
              box-sizing: border-box;
            }
            
            .home-button {
              background-color: hsl(213, 31%, 23%); /* Ink Blue */
              color: white;
              border: 2px solid hsl(213, 31%, 23%); /* Ink Blue */
              padding: 14px 32px;
              border-radius: 8px;
              text-decoration: none;
              font-family: 'Inter', sans-serif;
              font-weight: 600;
              font-size: 16px;
              display: inline-block;
              width: 200px;
              box-sizing: border-box;
            }
            
            .footer-text {
              font-family: 'Inter', sans-serif;
              font-size: 14px;
              color: hsl(0, 0%, 45%);
              text-align: center;
              margin: 24px 0 0 0;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header Card -->
            <div class="card header-card">
              <img src="https://canary.cards/postallogov1.svg" alt="Canary Cards" class="logo" />
              <h1 class="title">Your postcard has been delivered!</h1>
              <p class="subtitle">Democracy in action — your voice reached its destination.</p>
            </div>
            
            <!-- Delivery Details Card -->
            <div class="card delivery-details-card">
              <div class="eyebrow">Delivery details</div>
              
              <div class="delivery-item">
                <div class="delivery-label">Delivered to</div>
                <div class="delivery-value">${recipientName}</div>
              </div>
              
              <div class="delivery-item">
                <div class="delivery-label">Office address</div>
                <div class="delivery-value">${recipientAddress}</div>
              </div>
              
              <div class="delivery-item">
                <div class="delivery-label">Delivered on</div>
                <div class="delivery-value">${formattedDate}</div>
              </div>
              
              <div class="delivery-item">
                <div class="delivery-label">Postcard ID</div>
                <div class="delivery-value">#${postcardId}</div>
              </div>
            </div>
            
            <!-- Message Card -->
            <div class="card message-card">
              <div class="eyebrow">Your message</div>
              <div class="message-content">"${message}"</div>
            </div>
            
            <!-- Impact Card -->
            <div class="card impact-card">
              <p class="impact-text">Your card landed on their desk — not their spam folder.</p>
              <p class="impact-text">You're one of hundreds of voices reaching your representatives today.</p>
            </div>
            
            <!-- CTA Card -->
            <div class="card cta-card">
              <div class="button-container">
                <a href="https://canary.cards/share?type=delivery&postcard=${postcardId}" class="share-button">Share Your Impact</a>
                <a href="https://canary.cards/" class="home-button">Send Another Card</a>
              </div>
            </div>
            
            <p class="footer-text">
              This delivery confirmation was sent by Canary Cards.<br>
              Making democracy more accessible, one postcard at a time.
            </p>
          </div>
        </body>
      </html>
    `;

    console.log('Sending delivery notification email to:', userEmail);

    const emailResponse = await resend.emails.send({
      from: "Canary Cards <noreply@resend.dev>",
      to: [userEmail],
      subject: `📬 Your Postcard to ${recipientName} Has Been Delivered!`,
      html: emailHtml,
    });

    console.log("Delivery notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      postcardId,
      recipientName 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-delivery-notification function:", error);
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