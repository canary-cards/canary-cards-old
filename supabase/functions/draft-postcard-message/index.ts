import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Edge function called - draft-postcard-message');
  console.log('OpenAI API Key exists:', !!openAIApiKey);
  console.log('Request method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { userInput, repName, userInfo } = requestBody;

    if (!openAIApiKey) {
      console.error('OpenAI API key is missing');
      throw new Error('OpenAI API key not configured');
    }

    if (!userInput || !repName) {
      console.error('Missing required fields:', { userInput: !!userInput, repName: !!repName, userInfo: !!userInfo });
      throw new Error('Missing required fields: userInput or repName');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are helping someone write a personalized postcard message to their elected representative. The message should be:
            
            - Professional but personal in tone
            - Specific to their concerns, not generic
            - Between 150-300 characters (postcard space is limited)
            - Written from their personal perspective and experience
            - Actionable - asking for specific policy support or action
            - Respectful and constructive
            
            Format the message as a proper postcard with:
            Dear Rep. [Representative Last Name],
            
            [Personal message based on their input]
            
            Sincerely, [Use the actual sender's full name and city from their address]
            
            IMPORTANT: Do NOT use placeholders like [First Name] or [City]. Use the actual sender information provided. Extract the city name from their street address.
            
            Do not include any address information in the postcard.
            
            Make each message unique and personalized based on the specific concerns they share. Avoid generic templates.`
          },
          {
            role: 'user',
            content: `Please write a postcard message based on these concerns: "${userInput}"
            
            Representative: ${repName}
            ${userInfo?.fullName ? `Sender name: ${userInfo.fullName}` : 'Sender name: [To be filled in later]'}
            ${userInfo?.streetAddress ? `Location: ${userInfo.streetAddress}` : 'Location: [To be filled in later]'}
            
            Make it personal and specific to their concerns. ${userInfo?.fullName ? 'Use the actual sender name and extract the city from their address for the signature.' : 'Use placeholder "[Your Name]" and "[Your City]" for the signature since sender info is not yet available.'}`
          }
        ],
        temperature: 0.8, // Higher temperature for more creative/varied responses
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const draftMessage = data.choices[0].message.content;

    console.log('Generated draft message for user input:', userInput);

    return new Response(JSON.stringify({ draftMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in draft-postcard-message function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});