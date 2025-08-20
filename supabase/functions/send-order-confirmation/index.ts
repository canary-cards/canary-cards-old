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
          <title>Order Confirmed — Your Voice Is Heard</title>
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
            
            /* Brand Colors - Accessible Email-Safe Versions */
            .bg-primary { background-color: #2F4156 !important; }
            .bg-secondary { background-color: #B25549 !important; } 
            .bg-tertiary { background-color: #FFD44D !important; }
            .bg-cream { background-color: #FEF4E9 !important; }
            .bg-white { background-color: #ffffff !important; }
            .bg-muted { background-color: #E8DECF !important; }
            .bg-success { background-color: #3FA556 !important; }
            
            .text-primary { color: #2F4156 !important; }
            .text-secondary { color: #B25549 !important; }
            .text-tertiary { color: #FFD44D !important; }
            .text-white { color: #ffffff !important; }
            .text-neutral { color: #222222 !important; }
            .text-muted { color: #9A9289 !important; }
            .text-success { color: #3FA556 !important; }
            
            /* Typography */
            .font-spectral { font-family: 'Spectral', Georgia, 'Times New Roman', serif !important; }
            .font-inter { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
            
            /* Utility Classes */
            .w-full { width: 100% !important; }
            .text-center { text-align: center !important; }
            .text-left { text-align: left !important; }
            .rounded { border-radius: 0.75rem !important; }
            .rounded-lg { border-radius: 0.75rem !important; }
            .shadow { box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08) !important; }
            .border-muted { border: 1px solid #E8DECF !important; }
            
            /* Mobile Responsive */
            @media only screen and (max-width: 600px) {
              .mobile-hidden { display: none !important; }
              .mobile-full { width: 100% !important; max-width: 100% !important; }
              .mobile-padding { padding: 20px !important; }
              .mobile-text-sm { font-size: 14px !important; }
              .mobile-h2 { font-size: 20px !important; }
              .mobile-stack { display: block !important; width: 100% !important; }
            }
            
            /* Dark Mode Support */
            @media (prefers-color-scheme: dark) {
              .dark-bg { background-color: #1a202c !important; }
              .dark-text { color: #e2e8f0 !important; }
            }
          </style>
        </head>
        <body class="bg-cream" style="margin: 0; padding: 0; width: 100%; min-width: 100%; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; background-color: #FEF4E9;">
          
          <!-- Email Container -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="w-full" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #FEF4E9;">
            <tr>
              <td style="padding: 32px 20px;">
                
                <!-- Header Section -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="w-full bg-primary rounded-lg shadow" style="width: 100%; background-color: #2F4156; border-radius: 0.75rem; box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08); margin-bottom: 32px;">
                  <tr>
                    <td class="bg-primary" style="background-color: #2F4156; padding: 32px; text-align: center; border-radius: 0.75rem;">
                      <!-- Canary Icon Stamp -->
                       <!-- Canary Brand Icon -->
                       <div style="width: 56px; height: 56px; background-color: #FFD44D; border: 2px solid #2F4156; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                         <svg width="32" height="32" viewBox="0 0 375 375" xmlns="http://www.w3.org/2000/svg" style="color: #2F4156;">
                           <g>
                             <g clip-rule="nonzero">
                               <g transform="matrix(0.433649,0,0,0.434028,4.340282,0)">
                                 <path d="M844 0H0v844h844V0zM422 622c-110.5 0-200-89.5-200-200s89.5-200 200-200 200 89.5 200 200-89.5 200-200 200z" fill="currentColor"/>
                                 <circle cx="372" cy="322" r="25" fill="currentColor"/>
                                 <circle cx="472" cy="322" r="25" fill="currentColor"/>
                                 <path d="M372 422h100c13.8 0 25 11.2 25 25s-11.2 25-25 25H372c-13.8 0-25-11.2-25-25s11.2-25 25-25z" fill="currentColor"/>
                               </g>
                             </g>
                           </g>
                         </svg>
                       </div>
                      <h1 class="font-spectral text-white" style="font-family: 'Spectral', Georgia, 'Times New Roman', serif; color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2;">
                        Your Message Is On Its Way!
                      </h1>
                    </td>
                  </tr>
                </table>
                
                <!-- Order Details Card -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="w-full bg-white rounded-lg shadow" style="width: 100%; background-color: #ffffff; border-radius: 0.75rem; box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08); margin-bottom: 32px;">
                  <tr>
                    <td style="padding: 24px;">
                      
                      <!-- Order Number & Status -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 16px;">
                        <tr>
                          <td style="vertical-align: top;">
                             <h2 class="font-spectral text-primary" style="font-family: 'Spectral', Georgia, 'Times New Roman', serif; color: #2F4156; margin: 0; font-size: 20px; font-weight: 600;">
                               Order #${successfulOrders[0]?.orderId || 'PENDING'}
                             </h2>
                          </td>
                          <td style="text-align: right; vertical-align: top;">
                            <span style="background-color: #3FA556; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                              ✓ Confirmed
                            </span>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Recipients -->
                      <div style="margin-bottom: 16px;">
                        <div class="font-inter text-secondary" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #B25549; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                          RECIPIENTS
                        </div>
                        <div class="font-inter text-primary" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2F4156; font-size: 16px; font-weight: 400;">
                          ${recipientList}
                        </div>
                      </div>
                      
                      <!-- Next Step -->
                      <div>
                        <div class="font-inter text-secondary" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #B25549; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                          NEXT STEP
                        </div>
                        <div class="font-inter text-neutral" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222222; font-size: 16px; line-height: 1.5;">
                          We'll email you once your card is in the mail.
                        </div>
                      </div>
                      
                    </td>
                  </tr>
                </table>
                
                <!-- Why This Matters Card -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="w-full bg-white rounded-lg shadow" style="width: 100%; background-color: #ffffff; border-radius: 0.75rem; box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08); margin-bottom: 32px;">
                  <tr>
                    <td style="padding: 24px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                        <tr>
                          <td style="width: 32px; vertical-align: top; padding-right: 12px;">
                            <!-- Mail Icon -->
                            <div style="width: 24px; height: 24px; color: #2F4156; font-size: 18px;">
                              ✉️
                            </div>
                          </td>
                          <td>
                            <h3 class="font-inter text-secondary" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #B25549; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">
                              Why This Matters
                            </h3>
                            <p class="font-inter text-neutral" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222222; margin: 0 0 12px 0; font-size: 16px; line-height: 1.6;">
                              Handwritten postcards bypass security and land directly on congressional desks—unlike emails and petitions. That means your voice is noticed sooner.
                            </p>
                            <p class="font-inter text-muted" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #9A9289; margin: 0; font-size: 14px; line-height: 1.5;">
                              <em>Research shows handwritten advocacy receives 3x more attention than digital communications.</em>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Reassurance Card -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="w-full bg-white rounded-lg shadow" style="width: 100%; background-color: #ffffff; border-radius: 0.75rem; box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08); margin-bottom: 32px;">
                  <tr>
                    <td style="padding: 24px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                        <tr>
                           <td style="width: 32px; vertical-align: top; padding-right: 12px;">
                             <!-- Check Circle Icon -->
                             <div style="width: 24px; height: 24px; background-color: #3FA556; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                               <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                 <path d="M16.667 5L7.5 14.167 3.333 10" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                               </svg>
                             </div>
                           </td>
                          <td class="font-inter text-neutral" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222222; font-size: 16px; line-height: 1.6;">
                            We'll update you as soon as your card is in the mail. Until then, know that your effort—combined with thousands of others—helps amplify real issues.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Share Card -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="w-full bg-white rounded-lg shadow" style="width: 100%; background-color: #ffffff; border-radius: 0.75rem; box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08); margin-bottom: 32px;">
                  <tr>
                    <td style="padding: 24px;">
                       <h3 class="font-inter text-primary" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2F4156; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                         Want to share?
                       </h3>
                      <p class="font-inter text-muted" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #9A9289; margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">
                        When you share your action, you help build a community of engaged citizens.
                      </p>
                       <!-- Share Button -->
                       <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                         <tr>
                           <td style="background-color: #FFD44D; border-radius: 0.75rem; padding: 12px 20px;">
                             <a href="https://canary.cards" class="font-inter text-primary" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2F4156; text-decoration: none; font-weight: 600; font-size: 14px;">
                               Share with a friend
                             </a>
                           </td>
                         </tr>
                       </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Footer -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="w-full bg-white rounded-lg shadow" style="width: 100%; background-color: #ffffff; border-radius: 0.75rem; box-shadow: 0 4px 12px rgba(47, 65, 86, 0.08);">
                  <tr>
                    <td style="padding: 24px; text-align: center;">
                       <p class="font-inter text-neutral" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222222; margin: 0 0 12px 0; font-size: 14px; line-height: 1.5;">
                         You're a <strong class="text-primary" style="color: #2F4156;">verified constituent of ${userInfo.city}</strong>. That means your message will be prioritized by your elected officials.
                       </p>
                      
                      <!-- Footer Links -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 16px auto 0;">
                        <tr>
                          <td style="padding: 0 8px;">
                            <a href="https://canarycards.com/privacy" class="text-primary" style="color: #2F4156; text-decoration: none; font-size: 12px;">Privacy</a>
                          </td>
                          <td style="padding: 0 8px; color: #9A9289;">|</td>
                          <td style="padding: 0 8px;">
                            <a href="https://canarycards.com/help" class="text-primary" style="color: #2F4156; text-decoration: none; font-size: 12px;">Help</a>
                          </td>
                          <td style="padding: 0 8px; color: #9A9289;">|</td>
                          <td style="padding: 0 8px;">
                            <a href="https://canarycards.com" class="text-primary" style="color: #2F4156; text-decoration: none; font-size: 12px;">CanaryCards.com</a>
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