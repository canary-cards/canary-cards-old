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

    console.log('API Key found, making request to Google Places API')

    // Use the legacy Places API which provides full formatted addresses with zip codes
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:US&key=${apiKey}`
    
    // Add location bias if zip code is provided
    if (zipCode) {
      try {
        // Get coordinates for the zip code using Geocodio API for location bias
        const geocodioKey = Deno.env.get('GeoCodioKey')
        if (geocodioKey) {
          console.log('Getting coordinates for zip code:', zipCode)
          const geocodioResponse = await fetch(`https://api.geocod.io/v1.9/geocode?q=${zipCode}&api_key=${geocodioKey}`)
          const geocodioData = await geocodioResponse.json()
          
          if (geocodioData.results && geocodioData.results.length > 0) {
            const location = geocodioData.results[0].location
            console.log('Found coordinates:', location)
            url += `&location=${location.lat},${location.lng}&radius=12500`
          }
        }
      } catch (geocodioError) {
        console.warn('Failed to get coordinates for zip code:', geocodioError)
      }
    }

    console.log('API request URL:', url)

    const response = await fetch(url)
    const data = await response.json()
    
    console.log('API response:', { status: response.status, data })
    
    if (!response.ok) {
      console.error('API error:', data)
      throw new Error(`Google Places API error: ${response.status} - ${JSON.stringify(data)}`)
    }

    // The legacy API already returns the correct format with full descriptions
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