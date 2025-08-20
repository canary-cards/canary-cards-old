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
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Your Postcard Order Confirmation - Canary Cards</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            /* Email Client Reset */
            body { margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; background-color: #f9f7f4; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
            
            /* Brand Colors (converted from HSL) */
            :root {
              --primary: #3a4b5c;        /* hsl(212 29% 26%) */
              --secondary: #b85c47;      /* hsl(7 45% 42%) */
              --accent: #f4d03f;         /* hsl(46 100% 65%) */
              --background: #f9f7f4;     /* hsl(35 85% 96%) */
              --muted: #e8ddd4;          /* hsl(36 35% 86%) */
              --rust: #e67e52;           /* hsl(12 76% 61%) */
            }
            
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(58, 75, 92, 0.08); }
            
            /* Header with Canary Cards branding */
            .header { 
              background: linear-gradient(135deg, #3a4b5c 0%, #b85c47 100%); 
              padding: 40px 32px; 
              text-align: center; 
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
              opacity: 0.3;
            }
            .header h1 { 
              font-family: 'Spectral', Georgia, serif; 
              color: #ffffff; 
              margin: 0; 
              font-size: 32px; 
              font-weight: 700; 
              position: relative; 
              z-index: 1;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header p { 
              font-family: 'Inter', sans-serif;
              color: rgba(255, 255, 255, 0.9); 
              margin: 8px 0 0 0; 
              font-size: 16px; 
              font-weight: 500;
              position: relative; 
              z-index: 1;
            }
            
            .content { padding: 40px 32px; }
            
            /* Success Icon with Canary Theme */
            .success-icon { text-align: center; margin-bottom: 32px; }
            .success-icon div { 
              width: 80px; 
              height: 80px; 
              background: linear-gradient(135deg, #f4d03f, #e67e52); 
              border-radius: 50%; 
              margin: 0 auto; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              box-shadow: 0 8px 20px rgba(244, 208, 63, 0.3);
              animation: pulse 2s infinite;
            }
            .success-icon svg { width: 40px; height: 40px; color: #3a4b5c; }
            
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            
            .headline { 
              font-family: 'Spectral', Georgia, serif; 
              text-align: center; 
              color: #3a4b5c; 
              margin: 0 0 16px 0; 
              font-size: 28px; 
              font-weight: 700; 
              line-height: 1.3;
            }
            
            .subheadline { 
              font-family: 'Inter', sans-serif;
              text-align: center; 
              color: #6b7280; 
              font-size: 18px; 
              margin: 0 0 40px 0; 
              line-height: 1.6;
              font-weight: 400;
            }
            
            /* Order Details Card */
            .order-details { 
              background: linear-gradient(135deg, #f9f7f4, #e8ddd4); 
              border-radius: 20px; 
              padding: 32px; 
              margin: 32px 0; 
              border: 1px solid rgba(232, 221, 212, 0.5);
              box-shadow: 0 4px 12px rgba(58, 75, 92, 0.05);
            }
            .order-details h3 { 
              font-family: 'Spectral', Georgia, serif;
              margin: 0 0 24px 0; 
              color: #3a4b5c; 
              font-size: 20px;
              font-weight: 600;
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 16px 0; 
              align-items: center;
              padding-bottom: 12px;
              border-bottom: 1px solid rgba(232, 221, 212, 0.3);
            }
            .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
            .detail-label { 
              font-family: 'Inter', sans-serif;
              font-weight: 600; 
              color: #3a4b5c; 
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .detail-value { 
              font-family: 'Inter', sans-serif;
              color: #3a4b5c; 
              font-weight: 500;
              text-align: right;
              max-width: 60%;
            }
            
            /* Timeline Section */
            .timeline { 
              background: linear-gradient(135deg, rgba(244, 208, 63, 0.1), rgba(230, 126, 82, 0.1)); 
              border-left: 6px solid #f4d03f; 
              border-radius: 0 16px 16px 0;
              padding: 24px 28px; 
              margin: 32px 0; 
              position: relative;
            }
            .timeline::before {
              content: '🕐';
              position: absolute;
              left: -15px;
              top: 20px;
              background: #f4d03f;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
            }
            .timeline h4 { 
              font-family: 'Spectral', Georgia, serif;
              margin: 0 0 16px 0; 
              color: #3a4b5c; 
              font-size: 18px;
              font-weight: 600;
            }
            .timeline ul { 
              font-family: 'Inter', sans-serif;
              margin: 0; 
              padding-left: 20px; 
              color: #3a4b5c; 
              font-size: 15px;
              line-height: 1.7;
            }
            .timeline li { margin-bottom: 8px; }
            .timeline li strong { color: #b85c47; font-weight: 600; }
            
            /* Body Text */
            .body-text { 
              font-family: 'Inter', sans-serif;
              color: #3a4b5c; 
              line-height: 1.7; 
              font-size: 16px; 
              margin: 24px 0;
            }
            
            /* CTA Link */
            .cta-link { 
              color: #b85c47; 
              text-decoration: none; 
              font-weight: 600;
              border-bottom: 2px solid transparent;
              transition: border-color 0.2s ease;
            }
            .cta-link:hover { border-bottom-color: #b85c47; }
            
            /* Footer */
            .footer { 
              background: linear-gradient(135deg, #f9f7f4, #e8ddd4); 
              padding: 32px 24px; 
              text-align: center; 
              border-top: 1px solid rgba(232, 221, 212, 0.5);
            }
            .footer p { 
              font-family: 'Inter', sans-serif;
              color: #6b7280; 
              font-size: 14px; 
              margin: 8px 0;
              line-height: 1.5;
            }
            
            /* Mobile Responsive */
            @media (max-width: 600px) {
              .container { margin: 0; border-radius: 0; }
              .header { padding: 32px 24px; }
              .content { padding: 32px 24px; }
              .order-details { padding: 24px; }
              .timeline { padding: 20px 24px; }
              .headline { font-size: 24px; }
              .detail-row { flex-direction: column; align-items: flex-start; gap: 8px; }
              .detail-value { text-align: left; max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐤 Canary Cards</h1>
              <p>Your voice delivered to your representatives</p>
            </div>
            
            <div class="content">
              <div class="success-icon">
                <div>
                  <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </div>
              
              <h2 class="headline">Your Postcard Has Been Ordered!</h2>
              <p class="subheadline">
                Hi ${userInfo.fullName}, we've successfully placed your postcard order. Your message will be delivered to your elected representatives.
              </p>
              
              <div class="order-details">
                <h3>Order Summary</h3>
                <div class="detail-row">
                  <span class="detail-label">Recipients</span>
                  <span class="detail-value">${recipientList}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Package Type</span>
                  <span class="detail-value">${sendOption === 'triple' ? 'Triple Package (Rep + 2 Senators)' : 'Single Postcard'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Postcards Sent</span>
                  <span class="detail-value">${successfulOrders.length}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">From</span>
                  <span class="detail-value">${userInfo.fullName}<br>${userInfo.city}, ${userInfo.state}</span>
                </div>
              </div>
              
              <div class="timeline">
                <h4>What happens next?</h4>
                <ul>
                  <li><strong>Today:</strong> Your postcard order has been submitted and is being processed</li>
                  <li><strong>1-2 business days:</strong> Your postcard will be printed with your personalized message</li>
                  <li><strong>3-5 business days:</strong> Your postcard will be delivered to your representative's office</li>
                  <li><strong>Ongoing:</strong> Your representative's staff will log and consider your message</li>
                </ul>
              </div>
              
              <p class="body-text">
                Thank you for making your voice heard! Your postcard will be delivered directly to ${representative.name}'s office${sendOption === 'triple' ? ' and your senators\' offices' : ''} where it will be read and considered by their staff.
              </p>
              
              <p class="body-text">
                Want to send another postcard on a different issue? <a href="https://canary.cards" class="cta-link">Visit Canary Cards</a> to create a new message and continue making your voice heard.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Canary Cards</strong> — Making democracy more accessible, one postcard at a time.</p>
              <p>This email was sent to confirm your postcard order. If you have any questions, please don't hesitate to reach out.</p>
              <p style="color: #9ca3af; font-size: 12px;">© 2024 Canary Cards. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Canary Cards <hello@canary.cards>",
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