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
    
    console.log('Received request:', { input, types, componentRestrictions })

    const apiKey = Deno.env.get('Google Places Api')
    if (!apiKey) {
      console.error('Google Places API key not found')
      throw new Error('Google Places API key not found')
    }

    console.log('API Key found, making request to Google Places API')

    // Try the legacy API first since it might be enabled
    const legacyUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
    legacyUrl.searchParams.set('input', input)
    legacyUrl.searchParams.set('types', 'address')
    legacyUrl.searchParams.set('key', apiKey)
    
    if (componentRestrictions?.country) {
      legacyUrl.searchParams.set('components', `country:${componentRestrictions.country}`)
    }

    console.log('Trying legacy API:', legacyUrl.toString())
    
    let response = await fetch(legacyUrl.toString())
    let data = await response.json()
    
    console.log('Legacy API response:', { status: response.status, data })

    // If legacy API fails with REQUEST_DENIED, try the new API
    if (data.status === 'REQUEST_DENIED') {
      console.log('Legacy API denied, trying new Places API')
      
      const newApiUrl = 'https://places.googleapis.com/v1/places:autocomplete'
      
      const requestBody = {
        input: input,
        includedPrimaryTypes: ['street_address'],
        locationRestriction: {
          countryCode: componentRestrictions?.country || 'US'
        }
      }

      console.log('New API request body:', requestBody)

      response = await fetch(newApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey
        },
        body: JSON.stringify(requestBody)
      })
      
      data = await response.json()
      console.log('New API response:', { status: response.status, data })
      
      if (!response.ok) {
        console.error('New API error:', data)
        throw new Error(`Google Places API error: ${response.status} - ${JSON.stringify(data)}`)
      }

      // Transform the new API response to match the expected format
      data = {
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
    }

    console.log('Final response data:', data)

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        predictions: [],
        status: 'ERROR'
      }),
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