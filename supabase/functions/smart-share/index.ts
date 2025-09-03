import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ref = url.searchParams.get('ref') || 'direct';
    const orderNumber = url.searchParams.get('order') || '';
    
    // Get user agent to detect mobile vs desktop
    const userAgent = req.headers.get('user-agent') || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Get app URL for sharing
    const getAppUrl = () => {
      const frontendUrl = Deno.env.get('FRONTEND_URL');
      if (frontendUrl) return frontendUrl;
      return 'https://canary.cards'; // Remove www prefix
    };

    const appUrl = getAppUrl();
    
    // Instead of serving HTML, redirect to the React app's share route
    const shareUrl = `${appUrl}/share?ref=${encodeURIComponent(ref)}&order=${encodeURIComponent(orderNumber)}`;
    
    console.log('Redirecting to share URL:', shareUrl);
    console.log('User agent:', userAgent);
    
    return new Response(null, {
      status: 302,
      headers: {
        "Location": shareUrl,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

  } catch (error: any) {
    console.error("Error in smart-share function:", error);
    
    // Return a simple fallback page
    const fallbackHtml = `<!DOCTYPE html>
<html>
<head><title>Share Canary Cards</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 2rem;">
  <h1>Share Canary Cards</h1>
  <p>Help others contact their representatives!</p>
  <a href="https://www.canary.cards" style="background: #2F4156; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px;">
    Visit Canary Cards
  </a>
</body>
</html>`;
    
    return new Response(fallbackHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }
};

serve(handler);