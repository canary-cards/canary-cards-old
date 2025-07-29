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
    const { input, types = 'address', componentRestrictions, zipCode } = await req.json()
    
    console.log('Received request:', { input, types, componentRestrictions, zipCode })

    const apiKey = Deno.env.get('Google Places Api')
    if (!apiKey) {
      console.error('Google Places API key not found')
      throw new Error('Google Places API key not found')
    }

    console.log('API Key found, making request to new Google Places API')

    // Use the new Places API (New) with correct field structure
    const url = 'https://places.googleapis.com/v1/places:autocomplete'
    
    // Build the request body with zip code location bias if provided
    const requestBody: any = {
      input: zipCode ? `${input}, ${zipCode}` : input, // Include zip code in the query for better relevance
      includedPrimaryTypes: ['street_address'],
      regionCode: componentRestrictions?.country || 'US'
    }

    // If zip code is provided, add location bias to prioritize results in that area
    if (zipCode) {
      // Use the zip code as a location bias to prioritize nearby results
      requestBody.input = `${input}, ${zipCode}`
      requestBody.locationBias = {
        rectangle: {
          low: { latitude: 0, longitude: 0 }, // Will be ignored due to zip code in input
          high: { latitude: 0, longitude: 0 }  // Will be ignored due to zip code in input
        }
      }
    }

    console.log('New API request body:', requestBody)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
      },
      body: JSON.stringify(requestBody)
    })
    
    const data = await response.json()
    console.log('New API response:', { status: response.status, data })
    
    if (!response.ok) {
      console.error('New API error:', data)
      throw new Error(`Google Places API error: ${response.status} - ${JSON.stringify(data)}`)
    }

    // Transform the new API response to match the expected format
    const transformedData = {
      predictions: data.suggestions?.map((suggestion: any) => ({
        place_id: suggestion.placePrediction?.place || `temp_${Date.now()}_${Math.random()}`,
        description: suggestion.placePrediction?.text?.text || suggestion.description || '',
        structured_formatting: {
          main_text: suggestion.placePrediction?.structuredFormat?.mainText?.text || suggestion.placePrediction?.text?.text || '',
          secondary_text: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || ''
        }
      })) || [],
      status: 'OK'
    }

    console.log('Final response data:', transformedData)

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