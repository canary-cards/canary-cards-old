import { supabase } from '@/integrations/supabase/client';

export interface GooglePlacesAddressPrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GooglePlacesResponse {
  predictions: GooglePlacesAddressPrediction[];
  status: string;
}

export async function searchAddressAutocomplete(query: string, zipCode?: string): Promise<GooglePlacesAddressPrediction[]> {
  if (query.length < 3) {
    return [];
  }

  try {
    const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
      body: {
        input: query,
        types: 'address',
        componentRestrictions: { country: 'us' },
        zipCode: zipCode // Pass the zip code for location restriction
      }
    });

    if (error) {
      throw new Error(`Supabase function error: ${error.message}`);
    }
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.predictions || [];
  } catch (error) {
    console.error('Google Places autocomplete error:', error);
    return [];
  }
}