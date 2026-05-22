type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GooglePlacePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
};

type GooglePlaceResult = {
  formatted_address?: string;
  address_components?: GoogleAddressComponent[];
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
  name?: string;
};

type GoogleAutocompleteService = {
  getPlacePredictions: (
    request: {
      input: string;
      componentRestrictions?: { country: string | string[] };
      types?: string[];
    },
    callback: (
      predictions: GooglePlacePrediction[] | null,
      status: string,
    ) => void,
  ) => void;
};

type GooglePlacesService = {
  getDetails: (
    request: {
      placeId: string;
      fields: string[];
    },
    callback: (place: GooglePlaceResult | null, status: string) => void,
  ) => void;
};

type GoogleGeocoder = {
  geocode: (
    request: {
      location: {
        lat: number;
        lng: number;
      };
    },
    callback: (results: GooglePlaceResult[] | null, status: string) => void,
  ) => void;
};

type GoogleMapsApi = {
  maps: {
    Geocoder: new () => GoogleGeocoder;
    places: {
      PlacesServiceStatus: Record<string, string>;
      AutocompleteService: new () => GoogleAutocompleteService;
      PlacesService: new (attrContainer: Element) => GooglePlacesService;
    };
  };
};

export type AddressSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type AddressSelection = {
  formattedAddress: string;
  streetName: string;
  lga: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  selectedText: string;
};

let googleMapsPromise: Promise<GoogleMapsApi | null> | null = null;

function getGoogleMapsApi(): GoogleMapsApi | null {
  if (!import.meta.client) {
    return null;
  }

  const maybeGoogle = (window as typeof window & { google?: GoogleMapsApi }).google;
  if (!maybeGoogle?.maps?.places) {
    return null;
  }

  return maybeGoogle;
}

function loadGoogleMapsScript(apiKey: string) {
  return new Promise<GoogleMapsApi | null>((resolve, reject) => {
    const existingApi = getGoogleMapsApi();
    if (existingApi) {
      resolve(existingApi);
      return;
    }

    const existingScript = document.getElementById('google-maps-places-sdk') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(getGoogleMapsApi()), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Google Maps failed to load')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-places-sdk';
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.onload = () => resolve(getGoogleMapsApi());
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });
}

export async function loadGoogleMapsPlaces(apiKey: string) {
  if (!import.meta.client || !apiKey) {
    return null;
  }

  if (!googleMapsPromise) {
    googleMapsPromise = loadGoogleMapsScript(apiKey).catch((error) => {
      googleMapsPromise = null;
      throw error;
    });
  }

  return googleMapsPromise;
}

export async function getAddressSuggestions(
  apiKey: string,
  query: string,
  countryCode = 'ng',
) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [] as AddressSuggestion[];
  }

  const googleMaps = await loadGoogleMapsPlaces(apiKey);
  if (!googleMaps) {
    return [] as AddressSuggestion[];
  }

  const service = new googleMaps.maps.places.AutocompleteService();

  return await new Promise<AddressSuggestion[]>((resolve) => {
    service.getPlacePredictions(
      {
        input: trimmedQuery,
        componentRestrictions: { country: countryCode },
        types: ['address'],
      },
      (predictions, status) => {
        if (
          !predictions?.length ||
          status !== googleMaps.maps.places.PlacesServiceStatus.OK
        ) {
          resolve([]);
          return;
        }

        resolve(
          predictions.map((prediction) => ({
            placeId: prediction.place_id,
            description: prediction.description,
            mainText:
              prediction.structured_formatting?.main_text ?? prediction.description,
            secondaryText: prediction.structured_formatting?.secondary_text ?? '',
          })),
        );
      },
    );
  });
}

export async function getAddressSelection(apiKey: string, placeId: string) {
  const googleMaps = await loadGoogleMapsPlaces(apiKey);
  if (!googleMaps) {
    return null;
  }

  const service = new googleMaps.maps.places.PlacesService(document.createElement('div'));

  return await new Promise<AddressSelection | null>((resolve) => {
    service.getDetails(
      {
        placeId,
        fields: ['formatted_address', 'address_components', 'geometry', 'name'],
      },
      (place, status) => {
        if (!place || status !== googleMaps.maps.places.PlacesServiceStatus.OK) {
          resolve(null);
          return;
        }

        const components = place.address_components ?? [];
        const route = findComponent(components, 'route');
        const streetNumber = findComponent(components, 'street_number');
        const premise = findComponent(components, 'premise');
        const subpremise = findComponent(components, 'subpremise');
        const neighborhood = findComponent(components, 'neighborhood');
        const lga =
          findComponent(components, 'administrative_area_level_2') ??
          findComponent(components, 'locality') ??
          findComponent(components, 'sublocality_level_1') ??
          findComponent(components, 'sublocality') ??
          neighborhood;
        const state = findComponent(components, 'administrative_area_level_1');
        const streetLine = [streetNumber, route].filter(Boolean).join(' ').trim();

        resolve({
          formattedAddress: place.formatted_address ?? place.name ?? '',
          streetName:
            streetLine || premise || subpremise || neighborhood || place.name || place.formatted_address || '',
          lga,
          state,
          latitude: place.geometry?.location?.lat?.() ?? null,
          longitude: place.geometry?.location?.lng?.() ?? null,
          selectedText: '',
        });
      },
    );
  });
}

export async function reverseGeocodeAddressSelection(
  apiKey: string,
  latitude: number,
  longitude: number,
) {
  const googleMaps = await loadGoogleMapsPlaces(apiKey);
  if (!googleMaps) {
    return null;
  }

  const geocoder = new googleMaps.maps.Geocoder();

  return await new Promise<AddressSelection | null>((resolve) => {
    geocoder.geocode(
      {
        location: {
          lat: latitude,
          lng: longitude,
        },
      },
      (results, status) => {
        if (
          !results?.length ||
          status !== googleMaps.maps.places.PlacesServiceStatus.OK
        ) {
          resolve(null);
          return;
        }

        const place = results[0];
        if (!place) {
          resolve(null);
          return;
        }
        const components = place.address_components ?? [];
        const route = findComponent(components, 'route');
        const streetNumber = findComponent(components, 'street_number');
        const premise = findComponent(components, 'premise');
        const subpremise = findComponent(components, 'subpremise');
        const neighborhood = findComponent(components, 'neighborhood');
        const lga =
          findComponent(components, 'administrative_area_level_2') ??
          findComponent(components, 'locality') ??
          findComponent(components, 'sublocality_level_1') ??
          findComponent(components, 'sublocality') ??
          neighborhood;
        const state = findComponent(components, 'administrative_area_level_1');
        const streetLine = [streetNumber, route].filter(Boolean).join(' ').trim();

        resolve({
          formattedAddress: place.formatted_address ?? '',
          streetName:
            streetLine || premise || subpremise || neighborhood || place.formatted_address || '',
          lga,
          state,
          latitude,
          longitude,
          selectedText: '',
        });
      },
    );
  });
}

function findComponent(components: GoogleAddressComponent[], type: string) {
  return components.find((component) => component.types.includes(type))?.long_name ?? null;
}
