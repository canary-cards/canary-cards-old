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

    // Create the delivery notification email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Postcard Has Been Delivered!</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
            .content { padding: 32px 24px; }
            .success-icon { text-align: center; margin-bottom: 24px; }
            .success-icon div { width: 64px; height: 64px; background-color: #10b981; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
            .success-icon svg { width: 32px; height: 32px; color: white; }
            .delivery-details { background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #10b981; }
            .delivery-details h3 { margin: 0 0 16px 0; color: #065f46; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; align-items: flex-start; }
            .detail-label { font-weight: 600; color: #374151; flex: 0 0 30%; }
            .detail-value { color: #1f2937; flex: 1; text-align: left; }
            .message-preview { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .message-preview h4 { margin: 0 0 12px 0; color: #374151; font-size: 16px; }
            .message-text { color: #6b7280; font-style: italic; line-height: 1.5; }
            .impact-section { background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 24px 0; }
            .impact-section h4 { margin: 0 0 12px 0; color: #1e40af; }
            .impact-section p { margin: 0; color: #374151; line-height: 1.6; }
            .footer { background-color: #f8fafc; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
            .cta-button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📮 InkImpact</h1>
              <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">Your postcard has been delivered!</p>
            </div>
            
            <div class="content">
              <div class="success-icon">
                <div>
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </div>
              
              <h2 style="text-align: center; color: #1f2937; margin: 0 0 16px 0;">📬 Your Postcard Has Been Delivered!</h2>
              <p style="text-align: center; color: #6b7280; font-size: 16px; margin: 0 0 32px 0;">
                Great news, ${senderName}! Your postcard has been successfully delivered to ${recipientName}'s office.
              </p>
              
              <div class="delivery-details">
                <h3>✅ Delivery Confirmation</h3>
                <div class="detail-row">
                  <span class="detail-label">Delivered to:</span>
                  <span class="detail-value">${recipientName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Office Address:</span>
                  <span class="detail-value">${recipientAddress}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Delivered on:</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Postcard ID:</span>
                  <span class="detail-value">#${postcardId}</span>
                </div>
              </div>
              
              <div class="message-preview">
                <h4>📝 Your Message:</h4>
                <div class="message-text">"${message}"</div>
              </div>
              
              <div class="impact-section">
                <h4>🎯 Your Impact</h4>
                <p>
                  Your postcard is now in ${recipientName}'s office where it will be read and logged by their staff. 
                  Physical mail like postcards carries significant weight in political offices and helps demonstrate 
                  constituent engagement on important issues.
                </p>
              </div>
              
              <p style="color: #374151; line-height: 1.6; text-align: center;">
                Thank you for making your voice heard! Your participation in democracy matters.
              </p>
              
              <div style="text-align: center;">
                <a href="https://inkimpact.com" class="cta-button">Send Another Postcard</a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 24px;">
                Want to maximize your impact? Consider sharing InkImpact with friends and family to help amplify citizen voices.
              </p>
            </div>
            
            <div class="footer">
              <p>This delivery confirmation was sent by InkImpact.</p>
              <p>© 2024 InkImpact. Making democracy more accessible, one postcard at a time.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log('Sending delivery notification email to:', userEmail);

    const emailResponse = await resend.emails.send({
      from: "InkImpact <noreply@resend.dev>",
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