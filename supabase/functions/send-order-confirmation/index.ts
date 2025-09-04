import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { OrderConfirmationEmail } from './_templates/order-confirmation.tsx';

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
  sendOption: 'single' | 'double' | 'triple';
  orderResults: Array<{
    type: string;
    recipient: string;
    orderId: string;
    status: string;
  }>;
  finalMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInfo, representative, senators, sendOption, orderResults, finalMessage }: OrderConfirmationRequest = await req.json();

    console.log('Sending order confirmation email to:', userInfo.email);

    if (!userInfo.email) {
      console.log('No email provided, skipping email confirmation');
      return new Response(JSON.stringify({ message: 'No email provided' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get app URL for sharing - use canary.cards as primary domain
    const getAppUrl = () => {
      return 'https://canary.cards';
    };

    // Generate unique share URL
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const shareUrl = `${getAppUrl()}/share?ref=${uniqueId}&order=${uniqueId.slice(-8).toUpperCase()}`;

    // Initialize Supabase client to fetch logo
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Try to get logo from direct URL first, then fallback to storage
    let logoUrl = '';
    
    // First priority: Direct EMAIL_LOGO_URL from environment
    const emailLogoUrl = Deno.env.get('EMAIL_LOGO_URL');
    if (emailLogoUrl) {
      try {
        // Validate the URL by making a HEAD request
        const response = await fetch(emailLogoUrl, { method: 'HEAD' });
        if (response.ok) {
          logoUrl = emailLogoUrl;
          console.log('Using direct EMAIL_LOGO_URL:', logoUrl);
        } else {
          console.log('EMAIL_LOGO_URL validation failed:', response.status);
        }
      } catch (error) {
        console.log('EMAIL_LOGO_URL validation error:', error);
      }
    }
    
    // Fallback: Try to get logo from Supabase Storage
    if (!logoUrl) {
      try {
        console.log('Attempting to fetch files from Email logo bucket...');
        const { data: files, error } = await supabase.storage
          .from('Email logo bucket')
          .list('', {
            limit: 100,
            offset: 0
          });

        console.log('Storage response:', { files, error });

        if (!error && files && files.length > 0) {
          console.log('Found files:', files.map(f => f.name));
          
          // Look for PNG files containing 'logo' or 'canary', or use the first PNG
          const logoFile = files.find(file => 
            file.name.toLowerCase().endsWith('.png') && 
            (file.name.toLowerCase().includes('logo') || file.name.toLowerCase().includes('canary'))
          ) || files.find(file => file.name.toLowerCase().endsWith('.png'));

          if (logoFile) {
            const { data: { publicUrl } } = supabase.storage
              .from('Email logo bucket')
              .getPublicUrl(logoFile.name);
            logoUrl = publicUrl;
            console.log('Using logo from storage:', logoUrl);
          } else {
            console.log('No PNG files found in bucket');
          }
        } else {
          console.log('Storage error or no files:', error);
        }
      } catch (storageError) {
        console.log('Failed to fetch logo from storage:', storageError);
      }
    }

    // Fallback to SVG if storage fetch fails
    if (!logoUrl) {
      logoUrl = 'https://www.canary.cards/postallogov1.svg';
      console.log('Using fallback SVG logo');
    }

    const successfulOrders = orderResults.filter(order => order.status === 'success');
    
    // Format representative data for email template
    const nameParts = representative.name.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const representativeData = {
      ...representative,
      lastName
    };
    
    // Render React Email template
    const emailHtml = await renderAsync(
      React.createElement(OrderConfirmationEmail, {
        userName: userInfo.fullName,
        representative: representativeData,
        orderResults: orderResults,
        finalMessage: finalMessage,
        logoUrl: logoUrl,
        shareUrl: shareUrl,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Canary Cards <hello@canary.cards>",
      to: [userInfo.email],
      subject: `Your postcard to Rep. ${representativeData.lastName} is on its way!`,
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