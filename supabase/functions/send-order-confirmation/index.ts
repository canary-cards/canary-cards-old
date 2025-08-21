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
          <title>Your postcard is on the way</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style>
            /* Email Client Reset */
            body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; border: 0; line-height: 100%; outline: none; text-decoration: none; }
            table { border-collapse: collapse !important; }
            body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; }
            
            /* Brand Colors - HSL Values from Design System */
            .bg-cream { background-color: #FEF4E9 !important; }
            .bg-white { background-color: #ffffff !important; }
            .bg-ink-blue { background-color: #2F4156 !important; }
            .bg-brick-red { background-color: #B25549 !important; }
            .bg-canary-yellow { background-color: #FFD44D !important; }
            .bg-muted { background-color: #E8DECF !important; }
            
            .text-ink-blue { color: #2F4156 !important; }
            .text-brick-red { color: #B25549 !important; }
            .text-neutral { color: #222222 !important; }
            .text-white { color: #ffffff !important; }
            .text-muted { color: #9A9289 !important; }
            
            /* Typography */
            .font-spectral { font-family: 'Spectral', Georgia, 'Times New Roman', serif !important; }
            .font-inter { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
            
            /* Utility Classes */
            .w-full { width: 100% !important; }
            .text-center { text-align: center !important; }
            .text-left { text-align: left !important; }
            .rounded { border-radius: 0.875rem !important; }
            .shadow { box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08) !important; }
            .border-muted { border-top: 1px solid #E8DECF !important; }
            
            /* Mobile Responsive */
            @media only screen and (max-width: 600px) {
              .mobile-padding { padding: 16px !important; }
              .mobile-text-sm { font-size: 14px !important; }
              .mobile-h1 { font-size: 24px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; width: 100%; min-width: 100%; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FEF4E9;">
          
          <!-- Email Container -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #FEF4E9;">
            <tr>
              <td style="padding: 24px 20px;">
                
                <!-- 1. Header Card -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #ffffff; border-radius: 0.875rem; box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08); margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 20px; text-align: center;">
                      <!-- Canary Logo -->
                      <img src="https://canary.cards/postallogov1.svg" alt="Canary Cards" style="width: 48px; height: auto; margin: 0 auto 16px; display: block;">
                      
                      <!-- Title -->
                      <h1 style="font-family: 'Spectral', Georgia, 'Times New Roman', serif; color: #2F4156; margin: 0 0 8px 0; font-size: 28px; font-weight: 700; line-height: 1.2;">
                        Your postcard is on the way
                      </h1>
                      
                      <!-- Subtitle -->
                      <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #B25549; margin: 0; font-size: 16px; font-weight: 400;">
                        We'll notify you when it's mailed.
                      </p>
                    </td>
                  </tr>
                </table>
                
                <!-- 2. Order Details Card -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #ffffff; border-radius: 0.875rem; box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08); margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 20px;">
                      <!-- Eyebrow -->
                      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #B25549; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                        ORDER DETAILS
                      </div>
                      
                      <!-- Recipients -->
                      <div style="margin-bottom: 16px;">
                        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222222; font-size: 16px; font-weight: 500; margin-bottom: 4px;">
                          Recipients
                        </div>
                        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222222; font-size: 14px; line-height: 1.5;">
                          ${recipientList}
                        </div>
                      </div>
                      
                      <!-- Divider -->
                      <div style="border-top: 1px solid #E8DECF; margin: 16px 0;"></div>
                      
                      <!-- Postcard Preview -->
                      <div>
                        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222222; font-size: 16px; font-weight: 500; margin-bottom: 4px;">
                          Message Preview
                        </div>
                        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222222; font-size: 14px; line-height: 1.5; font-style: italic;">
                          "Your voice on ${representative.type} ${representative.name}'s desk..."
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
                
                <!-- 3. Next Steps / Reassurance Card -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #ffffff; border-radius: 0.875rem; box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08); margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 20px;">
                      <!-- Reassuring line -->
                      <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222222; margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; font-weight: 500;">
                        Your card lands on their desk — not their spam folder.
                      </p>
                      
                      <!-- Impact note -->
                      <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222222; margin: 0; font-size: 16px; line-height: 1.6;">
                        You're one of hundreds of voices reaching your representatives today.
                      </p>
                    </td>
                  </tr>
                </table>
                
                <!-- 4. CTA Card -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #ffffff; border-radius: 0.875rem; box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08);">
                  <tr>
                    <td style="padding: 20px; text-align: center;">
                      
                      <!-- Share Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 12px;">
                        <tr>
                          <td style="background-color: #FFD44D; border: 1px solid #2F4156; border-radius: 0.875rem; padding: 12px 24px;">
                            <a href="https://canary.cards" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2F4156; text-decoration: none; font-weight: 600; font-size: 16px;">
                              Share with friends
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Home Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                        <tr>
                          <td style="background-color: #2F4156; border-radius: 0.875rem; padding: 12px 24px;">
                            <a href="https://canary.cards" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                              Back to Home
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                </table>
                
              </td>
            </tr>
          </table>
          
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Canary Cards <hello@canary.cards>",
      to: [userInfo.email],
      subject: `Your postcard is on the way`,
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