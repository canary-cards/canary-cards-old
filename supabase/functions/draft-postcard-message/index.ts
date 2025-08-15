import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function searchWeb(query: string): Promise<string> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
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
      console.error('Perplexity API error:', response.status);
      return '';
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error in web search:', error);
    return '';
  }
}

serve(async (req) => {
  console.log('Edge function called - draft-postcard-message [UPDATED VERSION]');
  console.log('Perplexity API Key exists:', !!perplexityApiKey);
  console.log('Request method:', req.method);
  console.log('Function version: 2.0 - Using Perplexity API');

  // Handle CORS preflight requests
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
    const repType = representative.type; // 'representative' or 'senator'
    const district = representative.district;
    const city = representative.city;
    const state = representative.state;
    const lastName = repName.split(' ').pop();
    
    // Normalize the type for proper addressing
    const isRepresentative = repType && repType.toLowerCase() === 'representative';
    const titlePrefix = isRepresentative ? 'Rep.' : 'Sen.';
    
    console.log('Representative details:', { repName, repType, district, city, state, titlePrefix });

    // Perform web searches for current information
    console.log('Starting web searches...');
    
    const searchQueries = [
      `current federal legislation bills 2024 2025 related to "${concerns}" congress.gov govtrack`,
      `recent political news developments "${concerns}" federal policy executive actions`,
      `"${state}" district ${district || ''} federal funding impact "${concerns}" state specific programs`
    ];

    const searchResults = await Promise.all(
      searchQueries.map(query => searchWeb(query))
    );

    console.log('Web search completed, generating postcard...');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are an AI that generates personalized congressional postcards. When a user submits their concerns and personal impact along with their congressional district information, you will create an effective postcard message.

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

3. **Search for district/state-specific impacts of federal issues**: Use the user's district and state information to find:
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
   * Starts with "${titlePrefix} ${lastName}," 
   * Maximum 250 characters total
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

## Examples of Federal Impact Integration:
* **Federal bill with regional relevance**: "Please oppose H.R. 123, which would open Utah's public lands to drilling..."
* **Federal funding impact**: "Federal cuts to [program] would eliminate funding for programs in our district..."
* **Federal policy impact**: "The new EPA rules would particularly impact [industry/environment] workers like me..."
* **Federal program relevance**: "As someone who benefits from [federal program], I urge you to protect this funding..."

## Prioritization Logic:
1. **Federal legislation with clear regional impact** = Highest priority
2. **Federal policy/news with personal relevance** = High priority  
3. **General federal issue** = Use when no specific regional angle exists

## Output:
Provide only the final postcard message text. Do not include character counts, explanations, or additional commentary - just the postcard content ready to send.

## Example Structure:
"${titlePrefix} ${lastName}, As a [user's situation], I'm concerned about [specific issue]. [Personal impact statement]. [Reference to federal development - include bill number when available, e.g., "Please support/oppose H.R. 123: [Title]"]. [Policy impact on user's situation]. Please [clear ask]."

Here is the current research context from web searches:

**Recent Federal Legislation and Political News:**
${searchResults[0]}

**Current Political Developments:**
${searchResults[1]}

**State/District Specific Federal Impact:**
${searchResults[2]}`
          },
          {
            role: 'user',
            content: `Generate a postcard message based on:

**Primary Concern:** "${concerns}"

**Personal Impact:** "${personalImpact}"

**Representative:** ${repName} (${titlePrefix.replace('.', '')})
**District:** ${district ? `District ${district.replace('District ', '')}` : 'Statewide'}
**Location:** ${city}, ${state}

Use the web search context above to find the most current and actionable federal angle. Generate only the postcard message text - no explanations or character counts.`
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
        return_images: false,
        return_related_questions: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const draftMessage = data.choices[0].message.content;

    console.log('Generated draft message for concerns:', concerns);

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