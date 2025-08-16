import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function searchWeb(query: string, fallbackModel: boolean = false): Promise<string> {
  try {
    const model = fallbackModel ? 'sonar' : 'sonar-reasoning';
    console.log(`Using search model: ${model}`);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant. Provide current, accurate information in a concise format. Focus on the most relevant and recent developments.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 500,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error: ${response.status}`, errorText);
      
      if (response.status === 400 && !fallbackModel && errorText.includes('Invalid model')) {
        console.log('Retrying with fallback model...');
        return searchWeb(query, true);
      }
      
      return '';
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error in web search:', error);
    return '';
  }
}

function sanitizeMessageBody(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/^["'`]|["'`]$/g, '') // Remove quotes at start/end
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
    .replace(/^\s*[-*]\s*/gm, '') // Remove bullet points
    .replace(/\n\s*\n/g, ' ') // Replace multiple newlines with space
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

serve(async (req) => {
  console.log('Edge function called - draft-postcard-message [SIMPLIFIED VERSION]');
  console.log('Perplexity API Key exists:', !!perplexityApiKey);
  console.log('Request method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { concerns, personalImpact, representative } = requestBody;

    if (!perplexityApiKey) {
      console.error('Perplexity API key is missing');
      return new Response(JSON.stringify({ error: 'Perplexity API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!concerns || !personalImpact || !representative) {
      console.error('Missing required fields:', { concerns: !!concerns, personalImpact: !!personalImpact, representative: !!representative });
      return new Response(JSON.stringify({ error: 'Missing required fields: concerns, personalImpact, or representative' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract representative details
    const repName = representative.name;
    const repType = representative.type;
    const district = representative.district;
    const city = representative.city;
    const state = representative.state;
    const lastName = repName.split(' ').pop();
    
    const isRepresentative = repType && repType.toLowerCase() === 'representative';
    const titlePrefix = isRepresentative ? 'Rep.' : 'Sen.';
    
    console.log('Representative details:', { repName, repType, district, city, state, titlePrefix });

    const districtNumber = district?.replace(/District\s*/i, '') || '';
    
    console.log('Starting web searches...');
    
    const searchQueries = [
      `current federal legislation bills 2024 2025 related to "${concerns}" congress.gov govtrack`,
      `recent political news developments "${concerns}" federal policy executive actions`,
      `"${state}" district ${districtNumber} federal funding impact "${concerns}" state specific programs`
    ];

    const searchResults = await Promise.all(
      searchQueries.map(query => searchWeb(query))
    );

    console.log('Web search completed, generating postcard...');

    async function generateMessageBody(fallbackModel: boolean = false): Promise<string> {
      const model = fallbackModel ? 'sonar' : 'sonar-reasoning';
      console.log(`Using generation model: ${model}`);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: `You are a congressional postcard writer. Generate ONLY the message body for a postcard to a representative.

DO NOT include the salutation (Rep./Sen. Name). DO NOT include any explanations, reasoning, or meta-commentary.

Requirements:
- Maximum 250 characters for the message body only
- Professional but personal tone
- Include specific federal action when relevant (bill numbers, etc.)
- Clear call to action
- Reference personal impact from user input
- Use current federal developments from research context

Generate ONLY the message body text. No salutation, no explanations.

Research Context:
**Recent Federal Legislation:** ${searchResults[0]}
**Political Developments:** ${searchResults[1]}
**State/District Impact:** ${searchResults[2]}`
            },
            {
              role: 'user',
              content: `Generate the message body for:

**Primary Concern:** "${concerns}"
**Personal Impact:** "${personalImpact}"

Generate ONLY the message body - no salutation, no explanations. Maximum 250 characters.`
            }
          ],
          temperature: 0.3,
          max_tokens: 300,
          stop: ["\n\n", "Rep.", "Sen.", "Dear"],
          return_images: false,
          return_related_questions: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Perplexity API error: ${response.status}`, errorText);
        
        if (response.status === 400 && !fallbackModel && errorText.includes('Invalid model')) {
          console.log('Retrying generation with fallback model...');
          return generateMessageBody(true);
        }
        
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }

    // Generate message body
    let messageBody = await generateMessageBody();
    
    // Sanitize and clean the message body
    messageBody = sanitizeMessageBody(messageBody);
    
    // Split on first newline if present and take only first part
    messageBody = messageBody.split('\n')[0];
    
    // Ensure message body doesn't exceed 250 characters
    if (messageBody.length > 250) {
      console.log(`Message body too long (${messageBody.length} chars), truncating to 250`);
      messageBody = messageBody.substring(0, 247).trim() + '...';
    }
    
    // Compose final message with salutation
    const salutation = `${titlePrefix} ${lastName},`;
    const fullMessage = `${salutation} ${messageBody}`;
    
    // Final check for 300 character limit
    let draftMessage = fullMessage;
    if (draftMessage.length > 300) {
      console.log(`Full message too long (${draftMessage.length} chars), adjusting...`);
      const availableSpace = 300 - salutation.length - 1; // -1 for space
      const truncatedBody = messageBody.substring(0, availableSpace - 3).trim() + '...';
      draftMessage = `${salutation} ${truncatedBody}`;
    }

    console.log('Generated draft message for concerns:', concerns);
    console.log(`Final message length: ${draftMessage.length} characters`);

    return new Response(JSON.stringify({ draftMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in draft-postcard-message function:', error);
    return new Response(JSON.stringify({ 
      error: `Draft message generation failed: ${error.message}`,
      details: error.toString() 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});