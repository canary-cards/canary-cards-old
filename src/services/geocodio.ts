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
      address?: string;
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
              type: 'representative',
              address: rep.contact?.address
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

export async function lookupRepresentativesAndSenators(zipCode: string) {
  try {
    const response = await fetch(
      `https://api.geocod.io/v1.9/geocode?q=${zipCode}&fields=cd&api_key=${GEOCODIO_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch representatives and senators');
    }
    
    const data: GeocodioResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No results found for this zip code');
    }
    
    const result = data.results[0];
    const allLegislators: Array<{
      id: string;
      name: string;
      district?: string;
      city: string;
      state: string;
      photo?: string;
      party: string;
      type: string;
      address?: string;
    }> = [];
    
    // Extract all legislators (representatives and senators)
    if (result.fields?.congressional_districts) {
      result.fields.congressional_districts.forEach((cd) => {
        cd.current_legislators.forEach((legislator, index) => {
          allLegislators.push({
            id: `${legislator.type}-${cd.district_number || result.address_components.state}-${index}`,
            name: `${legislator.bio.first_name} ${legislator.bio.last_name}`,
            district: legislator.type === 'representative' ? 
              (cd.district_number === 0 ? 'At Large' : `District ${cd.district_number}`) : 
              undefined,
            city: result.address_components.city,
            state: result.address_components.state,
            photo: legislator.bio.photo_url,
            party: legislator.bio.party,
            type: legislator.type,
            address: legislator.contact?.address
          });
        });
      });
    }
    
    const representatives = allLegislators.filter(leg => leg.type === 'representative');
    const senators = allLegislators.filter(leg => leg.type === 'senator');
    
    return { representatives, senators };
  } catch (error) {
    console.error('Geocodio API error:', error);
    throw new Error('Unable to lookup representatives and senators. Please try again.');
  }
}


// Address search functions removed - now using Google Places API
// See src/services/googlePlaces.ts for address autocomplete functionality