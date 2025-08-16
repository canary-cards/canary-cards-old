import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('anthropickey');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!concerns || !personalImpact || !representative) {
      console.error('Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing required fields: concerns, personalImpact, or representative' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract representative details
    const lastName = representative.name.split(' ').pop();
    const titlePrefix = representative.type?.toLowerCase() === 'representative' ? 'Rep.' : 'Sen.';
    
    console.log(`Generating postcard for ${titlePrefix} ${lastName}`);

    // Create the comprehensive system prompt from user requirements
    const systemPrompt = `# Congressional Postcard Generator System Prompt

You are an AI that generates personalized congressional postcards. When a user submits their concerns and personal impact along with their congressional district information, you will create an effective postcard message.

## CRITICAL: Use web search to verify current information

**MANDATORY**: Use the web_search tool to:
1. **Search for current federal legislation** related to the user's concerns
2. **Search for recent political developments** and policy changes
3. **Verify any bill numbers or legislation** before including them
4. **Find district/state-specific impacts** using zip code ${zipCode || 'provided'}

## Your Process:

1. **Use web_search for current political news**: Look for recent developments related to the user's issue:
   * Executive actions or agency decisions
   * Budget proposals or appropriations  
   * Recent political announcements or policy changes
   * Committee hearings or votes scheduled
   * Major political developments affecting the issue

2. **Use web_search for federal legislation**: Find current federal bills related to the user's primary concern:
   * Search for bills currently in Congress on this topic
   * Verify bill numbers and titles are accurate
   * Check bill status (introduced, passed, failed, etc.)
   * Only reference bills you can confirm through web search

3. **Use web_search for district/state-specific impacts**: Use the zip code to find their location and search for:
   * How federal legislation/policy specifically affects their state/region
   * State-specific statistics, projects, or programs that would be impacted
   * Federal funding that flows to their state for relevant programs
   * Economic impacts of federal policy on their region
   * How national issues manifest differently in their specific area

4. **Choose the most timely and actionable federal angle**: Prioritize based on:
   * **Federal bills with clear regional impact**: National legislation that would particularly affect their area
   * **Actionability**: What can their federal representative actually influence
   * **ABSOLUTE RULE: Only reference specific bills verified through web_search**
   * Immediacy and political momentum
   * Clear action the representative can take
   * Current political relevance
   * Direct impact on the constituent's concerns

5. **Generate the postcard message**: Create a single postcard message that:
   * Starts with "${titlePrefix} ${lastName}," then newline
   * Maximum 300 characters total
   * **Uses verified current federal developments** with regional impact when applicable
   * Uses professional tone while preserving the user's voice
   * Focuses on personal impact and how federal policy affects people in their situation
   * Contains a clear, specific call to action
   * **ABSOLUTE RULE: NEVER invent or fabricate bill numbers** - only reference legislation verified through web_search
   * If web search finds no specific bills, focus on general policy areas and broader legislative priorities
   * **Does not include location references** (district, state, city) as these will be in the return address

## Content Guidelines:
* Lead with personal connection to the issue
* **Reference the most timely and actionable federal development** with regional impact when available
* **Focus on federal policy impact**: How national legislation or policy affects people in similar situations
* If bill recently passed/failed, reference that status and next steps
* Emphasize how federal policy affects the user's concerns
* Use the user's own language and concerns where possible
* Make it single-issue focused
* Ensure readability in 5-6 seconds
* **Avoid personal location references** (e.g., "as a person from Louisville") but regional/policy references are acceptable (e.g., "Utah's public lands," "our district's funding")

## Output:
Provide only the final postcard message text. Do not include character counts, explanations, or additional commentary - just the postcard content ready to send. OUTPUT ONLY THE POSTCARD MESSAGE of 300 characters or less

## Example Structure:
"${titlePrefix} ${lastName},
As a [user's situation], I'm concerned about [specific issue]. [Personal impact statement]. [Reference to federal development - include bill number when available, e.g., "Please support/oppose H.R. 123: [Title]"]. [Policy impact on user's situation]. Please [clear ask]."`;

    // Generate the postcard using Anthropic Claude with web search
    let webSearchUsed = false;
    let webSearchAvailable = true;
    
    const requestPayload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
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
          content: `Generate a postcard message based on:

**Primary Concern:** "${concerns}"
**Personal Impact:** "${personalImpact}"
**Representative:** ${representative.name} (${representative.type})
${zipCode ? `**Zip Code:** ${zipCode}` : ''}

Use web_search to verify current information before including any specific legislation or bill numbers. Follow the process outlined in the system prompt and provide ONLY the final postcard message text of 300 characters or less.`
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
      body: JSON.stringify(requestPayload),
    });

    // Graceful fallback if tools are unavailable
    if (!response.ok && response.status >= 400 && response.status < 500) {
      console.log('Web search tools unavailable, retrying without tools');
      webSearchAvailable = false;
      
      const fallbackPayload = { ...requestPayload };
      delete fallbackPayload.tools;
      
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(fallbackPayload),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error: ${response.status}`, errorText);
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Check if web search was used
    if (webSearchAvailable && Array.isArray(data.content)) {
      webSearchUsed = data.content.some((block: any) => 
        block && block.type === 'tool_use' && block.name === 'web_search'
      );
    }
    
    // Extract content from Anthropic response format
    let draftMessage = '';
    try {
      const blocks = Array.isArray(data.content) ? data.content : [];
      draftMessage = blocks
        .filter((b: any) => b && b.type === 'text' && typeof b.text === 'string')
        .map((b: any) => b.text)
        .join(' ')
        .trim();
    } catch (e) {
      console.error('Error parsing Anthropic response content:', e);
    }

    if (!draftMessage) {
      console.error('Unexpected Anthropic response format:', JSON.stringify(data));
      throw new Error('Unexpected response format from Anthropic API');
    }
    
    // Clean up the message
    draftMessage = draftMessage
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/^["'`]|["'`]$/g, '') // Remove quotes at start/end
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .trim();

    // Ensure it doesn't exceed 300 characters
    if (draftMessage.length > 300) {
      console.log(`Message too long (${draftMessage.length} chars), truncating to 300`);
      draftMessage = draftMessage.substring(0, 297).trim() + '...';
    }

    console.log(`Generated message (${draftMessage.length} chars):`, draftMessage);
    console.log(`Web search used: ${webSearchUsed}, Web search available: ${webSearchAvailable}, Model: claude-sonnet-4-20250514, Zip: ${zipCode || 'none'}, Rep: ${representative.name}`);

    return new Response(JSON.stringify({ draftMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in draft-postcard-message function:', error);
    return new Response(JSON.stringify({ 
      error: `Draft message generation failed: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});