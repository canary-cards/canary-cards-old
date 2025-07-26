const GEOCODIO_API_KEY = '6656cff3963f38cf8398fc7dc38368dc968cdf6';

export interface GeocodioResponse {
  input: {
    address_components: {
      zip: string;
    };
  };
  results: Array<{
    address_components: {
      city: string;
      state: string;
      zip: string;
    };
    fields: {
      congressional_districts: Array<{
        name: string;
        district_number: number;
        current_legislators: Array<{
          type: string;
          bio: {
            first_name: string;
            last_name: string;
            party: string;
            photo_url?: string;
          };
          contact: {
            url?: string;
            phone?: string;
            address?: string;
          };
        }>;
      }>;
    };
  }>;
}

export async function lookupRepresentatives(zipCode: string) {
  try {
    const response = await fetch(
      `https://api.geocod.io/v1.9/geocode?q=${zipCode}&fields=cd&api_key=${GEOCODIO_API_KEY}`
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
      photo?: string;
      party: string;
      type: string;
    }> = [];
    
    // Extract House Representatives only
    if (result.fields?.congressional_districts) {
      result.fields.congressional_districts.forEach((cd) => {
        cd.current_legislators
          .filter(legislator => legislator.type === 'representative')
          .forEach((rep, index) => {
            representatives.push({
              id: `rep-${cd.district_number}-${index}`,
              name: `${rep.bio.first_name} ${rep.bio.last_name}`,
              district: cd.district_number === 0 ? 'At Large' : `District ${cd.district_number}`,
              city: result.address_components.city,
              state: result.address_components.state,
              photo: rep.bio.photo_url,
              party: rep.bio.party,
              type: 'representative'
            });
          });
      });
    }
    
    return representatives;
  } catch (error) {
    console.error('Geocodio API error:', error);
    throw new Error('Unable to lookup representatives. Please try again.');
  }
}

export async function lookupSenators(state: string) {
  try {
    const response = await fetch(
      `https://api.geocod.io/v1.9/geocode?q=${state}&fields=cd&api_key=${GEOCODIO_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch senators');
    }
    
    const data: GeocodioResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No results found for this state');
    }
    
    const result = data.results[0];
    const senators: Array<{
      id: string;
      name: string;
      city: string;
      state: string;
      photo?: string;
      party: string;
      type: string;
    }> = [];
    
    // Extract Senators only
    if (result.fields?.congressional_districts) {
      result.fields.congressional_districts.forEach((cd) => {
        cd.current_legislators
          .filter(legislator => legislator.type === 'senator')
          .forEach((senator, index) => {
            senators.push({
              id: `senator-${result.address_components.state}-${index}`,
              name: `${senator.bio.first_name} ${senator.bio.last_name}`,
              city: result.address_components.city,
              state: result.address_components.state,
              photo: senator.bio.photo_url,
              party: senator.bio.party,
              type: 'senator'
            });
          });
      });
    }
    
    return senators;
  } catch (error) {
    console.error('Geocodio API error:', error);
    throw new Error('Unable to lookup senators. Please try again.');
  }
}

export async function searchAddresses(query: string, zipCode?: string) {
  try {
    const searchQuery = zipCode ? `${query}, ${zipCode}` : query;
    const response = await fetch(
      `https://api.geocod.io/v1.9/geocode?q=${encodeURIComponent(searchQuery)}&limit=5&api_key=${GEOCODIO_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to search addresses');
    }
    
    const data = await response.json();
    
    if (!data.results) {
      return [];
    }
    
    return data.results.map((result: any) => ({
      formatted_address: result.formatted_address,
      components: result.address_components
    }));
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
}

export async function validateAddress(address: string) {
  try {
    const response = await fetch(
      `https://api.geocod.io/v1.9/geocode?q=${encodeURIComponent(address)}&api_key=${GEOCODIO_API_KEY}`
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