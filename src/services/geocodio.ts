const GEOCODIO_API_KEY = '6656cff3963f38cf8398fc7dc38368dc968cdf6';

export interface GeocodioRepresentative {
  name: string;
  role: string;
  party: string;
  district?: string;
  office: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  contact?: {
    url?: string;
    phone?: string;
  };
}

export interface GeocodioResponse {
  input: {
    address_components: {
      zip: string;
    };
  };
  results: Array<{
    fields: {
      congressional_districts: Array<{
        name: string;
        district_number: number;
      }>;
      state_legislative_districts: {
        house: Array<{
          name: string;
          district_number: string;
        }>;
        senate: Array<{
          name: string; 
          district_number: string;
        }>;
      };
    };
  }>;
}

export async function lookupRepresentatives(zipCode: string) {
  try {
    const response = await fetch(
      `https://api.geocod.io/v1.7/geocode?q=${zipCode}&fields=cd,stateleg&api_key=${GEOCODIO_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch representatives');
    }
    
    const data: GeocodioResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No results found for this zip code');
    }
    
    const result = data.results[0];
    const representatives: Array<{
      id: string;
      name: string;
      district?: string;
      city: string;
      state: string;
      type: string;
    }> = [];
    
    // Congressional Districts
    if (result.fields?.congressional_districts) {
      result.fields.congressional_districts.forEach((cd, index) => {
        representatives.push({
          id: `cd-${index}`,
          name: `Representative - ${cd.name}`,
          district: `District ${cd.district_number}`,
          city: 'Washington',
          state: 'DC',
          type: 'congressional'
        });
      });
    }
    
    return representatives;
  } catch (error) {
    console.error('Geocodio API error:', error);
    throw new Error('Unable to lookup representatives. Please try again.');
  }
}

export async function validateAddress(address: string) {
  try {
    const response = await fetch(
      `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(address)}&api_key=${GEOCODIO_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to validate address');
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('Address not found');
    }
    
    const result = data.results[0];
    return {
      formatted: result.formatted_address,
      components: result.address_components,
      accuracy: result.accuracy
    };
  } catch (error) {
    console.error('Address validation error:', error);
    throw new Error('Unable to validate address');
  }
}