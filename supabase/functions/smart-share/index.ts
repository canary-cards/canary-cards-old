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
      return 'https://www.canary.cards';
    };

    const appUrl = getAppUrl();
    const shareContent = {
      title: 'Contact Your Representatives with Canary Cards',
      text: 'I just sent a real, handwritten postcard to my representative. It takes 2 minutes and actually gets read. Make your voice heard!',
      url: appUrl
    };

    // Create the appropriate HTML response based on device
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sharing Canary Cards</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #FEF4E9;
      margin: 0;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 8px 24px -8px rgba(47, 65, 86, 0.15);
      max-width: 400px;
      width: 100%;
    }
    .logo {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .title {
      color: #2F4156;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .message {
      color: #666;
      margin-bottom: 1.5rem;
    }
    .success {
      color: #10B981;
      font-weight: 500;
      margin-top: 1rem;
    }
    .error {
      color: #EF4444;
      margin-top: 1rem;
    }
    .fallback-options {
      margin-top: 1.5rem;
      display: none;
    }
    .fallback-btn {
      background: #2F4156;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      margin: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">📮</div>
    <h1 class="title">Opening Share Options...</h1>
    <p class="message">
      ${isMobile 
        ? 'Your share menu should open any moment with all your apps!'
        : 'Copying link to clipboard...'
      }
    </p>
    <div id="status"></div>
    
    <div id="fallback" class="fallback-options">
      <h3>Choose how to share:</h3>
      <a href="sms:?body=${encodeURIComponent(`I just sent a real, handwritten postcard to my representative! It takes 2 minutes and actually gets read. Join me: ${appUrl}`)}" class="fallback-btn">
        📱 Text Message
      </a>
      <a href="mailto:?subject=${encodeURIComponent('Join me in civic engagement!')}&body=${encodeURIComponent(`I just sent a handwritten postcard to my representative. Join me: ${appUrl}`)}" class="fallback-btn">
        ✉️ Email
      </a>
      <a href="${appUrl}" class="fallback-btn">
        🔗 Visit Site
      </a>
    </div>
  </div>

  <script>
    const isMobile = ${isMobile};
    const shareData = {
      title: '${shareContent.title}',
      text: '${shareContent.text}',
      url: '${shareContent.url}'
    };

    async function handleShare() {
      const statusEl = document.getElementById('status');
      const fallbackEl = document.getElementById('fallback');

      try {
        if (isMobile && navigator.share) {
          // Mobile: Use native share - this will show AirDrop, Messages, WhatsApp, etc.
          await navigator.share(shareData);
          statusEl.innerHTML = '<div class="success">✓ Thanks for sharing!</div>';
          
          // Redirect to app after short delay
          setTimeout(() => {
            window.location.href = '${appUrl}';
          }, 2000);
          
        } else if (navigator.clipboard) {
          // Desktop or fallback: Copy to clipboard
          await navigator.clipboard.writeText(shareData.url);
          statusEl.innerHTML = '<div class="success">✓ Link copied to clipboard!</div>';
          
          // Redirect after delay
          setTimeout(() => {
            window.location.href = '${appUrl}';
          }, 2000);
        } else {
          throw new Error('No sharing method available');
        }
      } catch (error) {
        console.log('Share failed, showing fallback options:', error);
        
        // Show fallback options if native share fails
        statusEl.innerHTML = '<div class="error">Choose how to share:</div>';
        fallbackEl.style.display = 'block';
      }
    }

    // Start sharing immediately when page loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleShare);
    } else {
      handleShare();
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
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