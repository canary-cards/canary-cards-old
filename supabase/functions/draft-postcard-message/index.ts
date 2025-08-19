import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('anthropickey');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function getCurrentDate() {
  return new Date().toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

serve(async (req) => {
  console.log('Edge function called - draft-postcard-message');
  console.log('Request method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const requestBody = await req.json();
    console.log('Request received:', JSON.stringify(requestBody, null, 2));
    
    const { concerns, personalImpact, representative, zipCode } = requestBody;
    
    if (!anthropicApiKey) {
      console.error('Anthropic API key is missing');
      return new Response(JSON.stringify({
        error: 'Anthropic API key not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!concerns || !representative) {
      console.error('Missing required fields');
      return new Response(JSON.stringify({
        error: 'Missing required fields: concerns or representative'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extract representative details
    const lastName = representative.name.split(' ').pop();
    const titlePrefix = representative.type?.toLowerCase() === 'representative' ? 'Rep.' : 'Sen.';
    const currentDate = getCurrentDate();
    
    console.log(`Generating postcard for ${titlePrefix} ${lastName} on ${currentDate}`);
    
    // Enhanced system prompt with date awareness and source requirements
    const systemPrompt = `Enhanced Congressional Postcard Generator System Prompt

CRITICAL CONSTRAINTS
TARGET: 280 CHARACTERS | ACCEPTABLE: 270-290 | HARD MAX: 295
MUST INCLUDE NEWLINE AFTER GREETING
You generate impactful congressional postcards using ~280 characters for optimal effectiveness.

CONSTITUENT LOCATION
- Zip Code: ${zipCode || 'Not provided'}
- Use this to understand the constituent's location for relevant local context and district-specific impacts.

DATE AWARENESS
- Current date: ${currentDate}
- Always use this date to determine what legislation/policies are already in effect vs. upcoming.
- Only reference events/bills from the past 1–2 months (≈60 days).
- If an upcoming vote, markup, or hearing is scheduled within the next 14–21 days, explicitly tie the postcard ask to it.

REQUIRED FORMAT (include newline):
"${titlePrefix} ${lastName},
[Personal stake]. [Specific impact]. [Current context/bill if found]. [Direct ask]."

STRICT RULES
- Target 280 characters (270–290 acceptable range, hard max 295).
- MUST include newline after "${titlePrefix} ${lastName},"
- Use contractions always.
- Include specific details/numbers when possible.
- Direct action verbs.
- Single spaces only.
- If bill found: include identifier in "HR123" or "S.954" format.

PERSONAL STAKE GUIDANCE
The "personal stake" can be a short phrase (e.g., "As a nurse," "As a parent," "As a renter") or a short sentence, but keep it concise (<30 characters preferred).

SOURCE SELECTION RULES
- Include at least 1 source from congress.gov or govtrack.us.
- Include at least 1 source from Axios, Politico, or Washington Post.
- Do not use think tanks, unions, or advocacy sources alone. They may be included only if paired with an allowed source.
- Only include sources published within the last 60 days.
- If a highly relevant source is older than 60 days, include it only if paired with a corroborating <60-day source.

NATIONAL CONTEXT RULE
- Before drafting, check if a dominant national policy shift (e.g., agency closure, major department change) occurred in the last 60 days.
- If yes and relevant to the user's issue, include it in the postcard. If not, skip.

UPCOMING VOTE RULE
- Always check congress.gov and govtrack.us calendars.
- If a relevant vote/markup/hearing is scheduled in the next 14–21 days, explicitly tie the postcard's direct ask to that vote.
- If none, proceed with the strongest current federal issue framing.

PROCESS
1. Look up current date and ensure timeline accuracy.
2. Search priority sources for recent federal developments (since ~60 days ago).
3. Identify the most timely/actionable federal angle with regional relevance.
4. Check for dominant national policy context (include only if primary driver).
5. Check for upcoming votes (14–21 day window); if found, anchor the ask to the vote.
6. Write complete message targeting 280 chars with accurate timeline references.
7. Count characters including newline.
8. Adjust if outside 270–290 range.

REQUIRED OUTPUT FORMAT
Postcard text (with required newline after greeting)

Sources Used:
- [Description of key information gathered] | [URL] | +[data point count]
- [Description of key information gathered] | [URL] | +[data point count]
(2–3 sources required; 2 is acceptable, 3 if useful)

Output ONLY the postcard text with newline and sources as specified above, nothing else.`;

    // Build user message with graceful handling of missing personalImpact
    const userMessage = personalImpact 
      ? `Write a ~280 character postcard (270-290 range) about:
**Concern:** ${concerns}
**Personal Impact:** ${personalImpact}

Current date: ${currentDate}
Include a newline after the greeting. Search for current developments and include sources. Output the postcard text and sources as specified.`
      : `Write a ~280 character postcard (270-290 range) about:
**Concern:** ${concerns}

Current date: ${currentDate}
The constituent cares deeply about this issue. Include a newline after the greeting. Search for current developments and include sources. Output the postcard text and sources as specified.`;

    // Initial request with web search
    let requestPayload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      temperature: 0.2,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search"
        }
      ],
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    };
    
    let response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestPayload)
    });
    
    let data;
    let needsRetry = false;
    
    if (response.ok) {
      data = await response.json();
      
      // Check if response contains only tool_use blocks without text content
      const blocks = Array.isArray(data.content) ? data.content : [];
      const hasTextContent = blocks.some(b => b && b.type === 'text' && typeof b.text === 'string' && b.text.trim());
      const hasOnlyToolUse = blocks.length > 0 && blocks.every(b => b && b.type === 'tool_use');
      
      if (hasOnlyToolUse || !hasTextContent) {
        console.log('Response contains only tool use or no text content, retrying without tools');
        needsRetry = true;
      }
    } else if (response.status >= 400 && response.status < 500) {
      console.log('Web search unavailable, retrying without tools');
      needsRetry = true;
    }
    
    // Retry without tools if needed
    if (needsRetry) {
      delete requestPayload.tools;
      
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (response.ok) {
        data = await response.json();
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error: ${response.status}`, errorText);
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
    }
    
    // Extract message and sources from response
    let fullResponse = '';
    try {
      const blocks = Array.isArray(data.content) ? data.content : [];
      fullResponse = blocks
        .filter(b => b && b.type === 'text' && typeof b.text === 'string')
        .map(b => b.text)
        .join(' ')
        .trim();
    } catch (e) {
      console.error('Error parsing response:', e);
    }
    
    if (!fullResponse) {
      console.error('No message in response:', JSON.stringify(data));
      throw new Error('No message generated');
    }
    
    // Parse message and sources
    const sourcesIndex = fullResponse.indexOf('Sources Used:');
    let draftMessage = '';
    let sources = [];
    
    if (sourcesIndex !== -1) {
      draftMessage = fullResponse.substring(0, sourcesIndex).trim();
      const sourcesText = fullResponse.substring(sourcesIndex + 'Sources Used:'.length).trim();
      
      // Parse sources from the response
      const sourceLines = sourcesText.split('\n').filter(line => line.trim().startsWith('-'));
      sources = sourceLines.map(line => {
        const cleanLine = line.replace(/^-\s*/, '').trim();
        const parts = cleanLine.split(' | ');
        if (parts.length >= 2) {
          const description = parts[0];
          const url = parts[1];
          const dataPointMatch = parts[2]?.match(/\+(\d+)/);
          const dataPointCount = dataPointMatch ? parseInt(dataPointMatch[1]) : 0;
          
          return {
            description,
            url,
            dataPointCount
          };
        }
        return null;
      }).filter(Boolean);
    } else {
      draftMessage = fullResponse;
    }
    
    // Clean up formatting of the message (preserve newlines)
    draftMessage = draftMessage
      .replace(/```[\s\S]*?```/g, '')  // Remove code blocks
      .replace(/^["'`]|["'`]$/g, '')   // Remove wrapper quotes
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic
      .replace(/[ \t]+/g, ' ')         // Single spaces but preserve newlines
      .trim();
    
    // STRICT enforcement of character limits (270-290 optimal, 295 max)
    if (draftMessage.length > 295) {
      console.log(`Message too long (${draftMessage.length} chars), requesting shorter version`);
      
      // Request a shorter version from Claude
      const shortenPayload = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        temperature: 0.2,
        system: 'Rewrite this message to be 280-290 characters. Keep the core message, impact, and ask. Must include newline after greeting.',
        messages: [
          {
            role: 'user',
            content: `Adjust to 280-290 chars (currently ${draftMessage.length}):
"${draftMessage}"

Keep newline after greeting. Output only the adjusted message.`
          }
        ]
      };
      
      const shortenResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(shortenPayload)
      });
      
      if (shortenResponse.ok) {
        const shortenData = await shortenResponse.json();
        const shortened = shortenData.content
          ?.filter(b => b?.type === 'text')
          ?.map(b => b.text)
          ?.join(' ')
          ?.trim();
        
        if (shortened && shortened.length <= 295) {
          draftMessage = shortened
            .replace(/^["'`]|["'`]$/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/[ \t]+/g, ' ')
            .trim();
        }
      }
    }
    
    // If too short, request expansion
    if (draftMessage.length < 270) {
      console.log(`Message too short (${draftMessage.length} chars), requesting expanded version`);
      
      const expandPayload = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        temperature: 0.2,
        system: 'Expand this message to 280 characters by adding specific details, statistics, or urgency. Keep the newline after greeting.',
        messages: [
          {
            role: 'user',
            content: `Expand to ~280 chars (currently ${draftMessage.length}):
"${draftMessage}"

Add details to reach 280 chars. Keep newline after greeting. Output only the expanded message.`
          }
        ]
      };
      
      const expandResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(expandPayload)
      });
      
      if (expandResponse.ok) {
        const expandData = await expandResponse.json();
        const expanded = expandData.content
          ?.filter(b => b?.type === 'text')
          ?.map(b => b.text)
          ?.join(' ')
          ?.trim();
        
        if (expanded && expanded.length >= 270 && expanded.length <= 295) {
          draftMessage = expanded
            .replace(/^["'`]|["'`]$/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/[ \t]+/g, ' ')
            .trim();
        }
      }
    }
    
    console.log(`Final message (${draftMessage.length} chars):`, draftMessage);
    console.log('Sources found:', sources);
    
    return new Response(JSON.stringify({ 
      draftMessage,
      sources 
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error in function:', error);
    return new Response(JSON.stringify({
      error: `Generation failed: ${error.message}`
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});