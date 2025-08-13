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
    const { placeId } = await req.json()
    
    console.log('Received place details request for:', placeId)

    const apiKey = Deno.env.get('Google Places Api')
    if (!apiKey) {
      console.error('Google Places API key not found')
      throw new Error('Google Places API key not found')
    }

    console.log('API Key found, making request to Google Places Details API')

    // Use the new Places API for details
    const url = `https://places.googleapis.com/v1/places/${placeId}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'addressComponents,formattedAddress'
      }
    })
    
    const data = await response.json()
    console.log('Places Details API response:', { status: response.status, data })
    
    if (!response.ok) {
      console.error('Places Details API error:', data)
      throw new Error(`Google Places Details API error: ${response.status} - ${JSON.stringify(data)}`)
    }

    // Extract address components
    const addressComponents = data.addressComponents || []
    
    let streetNumber = ''
    let route = ''
    let city = ''
    let state = ''
    let zipCode = ''
    
    addressComponents.forEach((component: any) => {
      const types = component.types || []
      
      if (types.includes('street_number')) {
        streetNumber = component.longText || component.shortText || ''
      } else if (types.includes('route')) {
        route = component.longText || component.shortText || ''
      } else if (types.includes('locality')) {
        city = component.longText || component.shortText || ''
      } else if (types.includes('administrative_area_level_1')) {
        state = component.shortText || component.longText || ''
      } else if (types.includes('postal_code')) {
        zipCode = component.longText || component.shortText || ''
      }
    })

    // Construct full street address
    const streetAddress = [streetNumber, route].filter(Boolean).join(' ')

    const transformedData = {
      streetAddress,
      city,
      state,
      zipCode,
      formattedAddress: data.formattedAddress || ''
    }

    console.log('Final address details:', transformedData)

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
        streetAddress: '',
        city: '',
        state: '',
        zipCode: ''
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