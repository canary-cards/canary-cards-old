import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const handler = async (req)=>{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { postcardId, recipientName, recipientAddress, senderName, senderAddress, senderCity, senderState, message, sentAt, userEmail, recipientType, representativeId, uid } = await req.json();
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
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    // Calculate expected delivery date (9 days from now)
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 9);
    const formattedExpectedDate = expectedDeliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    // Extract rep title and last name from recipientName
    const repTitleAndLastName = recipientName; // This should already be in format "Rep. Johnson" or "Sen. Smith"
    
    // Create the mailed notification email with new brand design
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your postcard is on its way</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Spectral:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
              /* Email-safe CSS reset */
              body, table, td, p, h1, h2, h3 {
                  margin: 0;
                  padding: 0;
                  border: 0;
                  font-size: 100%;
                  font: inherit;
                  vertical-align: baseline;
              }
              
              body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background-color: #FEF4E9;
                  color: #222222;
                  line-height: 1.6;
                  margin: 0;
                  padding: 0;
                  -webkit-text-size-adjust: 100%;
                  -ms-text-size-adjust: 100%;
              }
              
              .email-container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #FEF4E9;
                  padding: 40px 20px;
              }
              
              .hero-title {
                  font-family: 'Spectral', Georgia, serif;
                  font-weight: 700;
                  font-size: 32px;
                  line-height: 1.2;
                  color: #2F4156;
                  text-align: center;
                  margin: 0 0 20px 0;
              }
              
              .hero-icon {
                  display: block;
                  margin: 0 auto 30px auto;
                  width: 120px;
                  height: auto;
              }
              
              .email-card {
                  background-color: #FFFFFF;
                  border-radius: 14px;
                  border: 1px solid #E8DECF;
                  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
                  margin-bottom: 20px;
                  padding: 32px;
              }
              
              .body-text {
                  font-family: 'Inter', sans-serif;
                  font-size: 16px;
                  line-height: 1.6;
                  color: #222222;
                  margin: 0 0 16px 0;
              }
              
              .body-text:last-child {
                  margin-bottom: 0;
              }
              
              .body-text strong {
                  font-weight: 600;
                  color: #2F4156;
              }
              
              .card-title {
                  font-family: 'Inter', sans-serif;
                  font-weight: 600;
                  font-size: 20px;
                  color: #B25549;
                  margin: 0 0 20px 0;
              }
              
              .cta-section {
                  margin-top: 24px;
              }
              
              .primary-cta {
                  background-color: #FFD44D;
                  border: 2px solid #2F4156;
                  border-radius: 12px;
                  padding: 16px 24px;
                  text-align: center;
                  text-decoration: none;
                  display: block;
                  margin-bottom: 16px;
                  transition: background-color 0.2s ease;
              }
              
              .primary-cta:hover {
                  background-color: #FFD041;
              }
              
              .primary-cta-text {
                  font-family: 'Inter', sans-serif;
                  font-weight: 600;
                  font-size: 18px;
                  color: #2F4156;
                  margin: 0;
              }
              
              .secondary-cta {
                  background-color: transparent;
                  border: 2px solid #B25549;
                  border-radius: 12px;
                  padding: 12px 24px;
                  text-align: center;
                  text-decoration: none;
                  display: block;
              }
              
              .secondary-cta:hover {
                  background-color: #F7EDEA;
              }
              
              .secondary-cta-text {
                  font-family: 'Inter', sans-serif;
                  font-weight: 500;
                  font-size: 16px;
                  color: #B25549;
                  margin: 0;
              }
              
              .postcard-content {
                  background-color: #FFFFFF;
                  border-radius: 8px;
                  padding: 20px;
                  font-family: 'Inter', sans-serif;
                  font-size: 14px;
                  line-height: 1.5;
                  color: #222222;
                  border: 1px solid #E8DECF;
              }
              
              /* Mobile responsiveness */
              @media screen and (max-width: 480px) {
                  .email-container {
                      padding: 20px 12px;
                  }
                  
                  .hero-title {
                      font-size: 28px;
                  }
                  
                  .email-card {
                      padding: 20px;
                  }
                  
                  .hero-icon {
                      width: 100px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <!-- Header Outside Card -->
              <h1 class="hero-title">Your Postcard Is In The Mail!</h1>
              
              <!-- Hero Icon -->
              <img src="https://canary.cards/postallogov1.svg" alt="Canary delivering postcard" class="hero-icon">
              
              <!-- Main Content Card -->
              <div class="email-card">
                  <h2 class="card-title">Done! Your Postcard Is On Its Way To D.C.</h2>
                  
                  <p style="font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 500; color: #222222; margin: 0 0 20px 0;">
                      Expected delivery date: <strong>${formattedExpectedDate}</strong>
                  </p>
                  
                  <p class="body-text">
                      We wrote your message with a real ballpoint pen on premium cardstock, stamped it first-class, and sent it to ${repTitleAndLastName}.
                  </p>
                  
                  <p class="body-text">
                      Congressional mailrooms do a quick security screen—then your card moves upstairs. Unlike a package, postcards don't come with tracking. But they arrive faster than letters, and they get read.
                  </p>
              </div>
              
              <!-- Thanks Card -->
              <div class="email-card">
                  <h2 class="card-title">Thanks For Speaking Up</h2>
                  
                  <p class="body-text">
                      Research shows that just 50 handwritten postcards can influence a member's vote. <em>— 2019 Congressional Management Foundation Study</em>
                  </p>
                  
                  <div class="cta-section">
                      <a href="#" class="primary-cta">
                          <p class="primary-cta-text">Share Canary Cards</p>
                      </a>
                      
                      <a href="https://www.canary.cards" class="secondary-cta">
                          <p class="secondary-cta-text">Write Another Postcard</p>
                      </a>
                  </div>
              </div>
              
              <!-- Share Card -->
              <div class="email-card">
                  <h2 style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 24px; color: #2F4156; margin: 0 0 8px 0;">Movements Grow One Friend At A Time</h2>
                  
                  <p class="body-text">
                      Invite a friend to send their own postcard—together, we're impossible to ignore.
                  </p>
                  
                  <div class="cta-section">
                      <a href="#" class="primary-cta">
                          <p class="primary-cta-text">Share Canary Cards</p>
                      </a>
                      
                      <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #5A646E; margin: 8px 0 20px 0; text-align: center;">Your share today could help another postcard land next week.</p>
                      
                      <a href="https://www.canary.cards" class="secondary-cta">
                          <p class="secondary-cta-text">Write Another Postcard</p>
                      </a>
                  </div>
              </div>
              
              <!-- Postcard Message Card -->
              <div class="email-card">
                  <h2 style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 20px; color: #2F4156; margin: 0 0 20px 0;">Your Message To ${repTitleAndLastName}</h2>
                  
                  <div class="postcard-content">
                      ${message}
                  </div>
              </div>
              
              <!-- Team Message Card -->
              <div class="email-card">
                  <p style="font-family: 'Inter', sans-serif; font-size: 16px; color: #222222; margin: 0 0 16px 0;">
                      Thanks for raising your voice. We're proud to stand with you.
                  </p>
                  <p style="font-family: 'Inter', sans-serif; font-size: 16px; color: #222222; margin: 0;">
                      —The Canary Cards Team
                  </p>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #E8DECF;">
                  <div style="display: flex; justify-content: center; gap: 40px; flex-wrap: wrap;">
                      <a href="#" style="font-family: 'Inter', sans-serif; font-size: 14px; color: #5A646E; text-decoration: none;">Support</a>
                      <a href="#" style="font-family: 'Inter', sans-serif; font-size: 14px; color: #5A646E; text-decoration: none;">Privacy</a>
                      <a href="#" style="font-family: 'Inter', sans-serif; font-size: 14px; color: #5A646E; text-decoration: none;">Unsubscribe</a>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
    
    console.log('Sending mailed notification email to:', userEmail);
    const emailResponse = await resend.emails.send({
      from: "Canary Cards <hello@canary.cards>",
      to: [
        userEmail
      ],
      subject: `Your postcard to ${repTitleAndLastName} is on its way`,
      html: emailHtml,
      text: `We've written and mailed your postcard.`
    });
    // Enhanced logging for debugging email delivery issues
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      console.error("Error details:", {
        statusCode: emailResponse.error.statusCode,
        message: emailResponse.error.message,
        userEmail,
        postcardId
      });
    } else {
      console.log("Mailed notification email sent successfully:", emailResponse);
    }
    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.data?.id,
      postcardId,
      recipientName
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error in send-delivery-notification function:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};
serve(handler);