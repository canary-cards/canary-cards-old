import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

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

    if (!perplexityApiKey) {
      console.error('Perplexity API key is missing');
      return new Response(JSON.stringify({ error: 'Perplexity API key not configured' }), {
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

## Your Process:

1. **Search for relevant current political news**: Look for recent developments related to the user's issue:
   * Executive actions or agency decisions
   * Budget proposals or appropriations  
   * Recent political announcements or policy changes
   * Committee hearings or votes scheduled
   * Major political developments affecting the issue

2. **Search for relevant federal legislation**: Use web_search to find current federal bills related to the user's primary concern:
   * congress.gov for federal bills
   * govtrack.us for bill tracking
   * Recent news sources for bill updates and numbers
   
   Look for bills currently in committee, recently introduced, scheduled for votes, or recently passed/failed.

3. **Search for district/state-specific impacts of federal issues**: Use the zip code ${zipCode || 'provided'} to find their city and state, and then use that information to find:
   * How federal legislation/policy specifically affects their state/region
   * State-specific statistics, projects, or programs that would be impacted
   * Federal funding that flows to their state for relevant programs
   * Economic impacts of federal policy on their region
   * How national issues manifest differently in their specific area

4. **Choose the most timely and actionable federal angle**: Prioritize based on:
   * **Federal bills with clear regional impact**: National legislation that would particularly affect their area
   * **Actionability**: What can their federal representative actually influence
   * If there is a relevant federal bill, include the specific bill number and actions needed
   * Immediacy and political momentum
   * Clear action the representative can take
   * Current political relevance
   * Direct impact on the constituent's concerns

5. **Generate the postcard message**: Create a single postcard message that:
   * Starts with "${titlePrefix} ${lastName}," then newline
   * Maximum 300 characters total
   * **Uses the most relevant current federal development** with regional impact when applicable
   * Uses professional tone while preserving the user's voice
   * Focuses on personal impact and how federal policy affects people in their situation
   * Contains a clear, specific call to action
   * If referencing legislation, include only one specific federal bill number when found (format: "I urge you to support/oppose [Bill Number: Title]")
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

    // Generate the postcard using the comprehensive prompt
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-reasoning',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Generate a postcard message based on:

**Primary Concern:** "${concerns}"
**Personal Impact:** "${personalImpact}"
**Representative:** ${representative.name} (${representative.type})
${zipCode ? `**Zip Code:** ${zipCode}` : ''}

Follow the process outlined in the system prompt and provide ONLY the final postcard message text of 300 characters or less.`
          }
        ],
        max_tokens: 400,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error: ${response.status}`, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    let draftMessage = data.choices[0]?.message?.content || '';
    
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