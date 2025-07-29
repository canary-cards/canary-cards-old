import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { input, types = 'address', componentRestrictions } = await req.json()

    const apiKey = Deno.env.get('Google Places Api')
    if (!apiKey) {
      throw new Error('Google Places API key not found')
    }

    // Use the new Places API (New) endpoint for autocomplete suggestions
    const url = 'https://places.googleapis.com/v1/places:autocomplete'
    
    const requestBody = {
      input: input,
      includedPrimaryTypes: ['street_address'],
      locationRestriction: {
        countryCode: componentRestrictions?.country || 'US'
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()

    // Transform the new API response to match the expected format
    const transformedData = {
      predictions: data.suggestions?.map((suggestion: any) => ({
        place_id: suggestion.placePrediction?.place || suggestion.place_id,
        description: suggestion.placePrediction?.text?.text || suggestion.description,
        structured_formatting: {
          main_text: suggestion.placePrediction?.structuredFormat?.mainText?.text || suggestion.structured_formatting?.main_text || '',
          secondary_text: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || suggestion.structured_formatting?.secondary_text || ''
        }
      })) || [],
      status: 'OK'
    }

    return new Response(
      JSON.stringify(transformedData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})