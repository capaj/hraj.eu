/// <reference types="vite/client" />

type GoogleMapsEventListener = unknown

interface GoogleMapsPlacesAutocomplete {
  getPlace: () => {
    address_components?: Array<{
      long_name: string
      types: string[]
    }>
    formatted_address?: string
    name?: string
    geometry?: {
      location: {
        lat: () => number
        lng: () => number
      }
    }
  }
  addListener: (event: string, callback: () => void) => GoogleMapsEventListener
}

interface GoogleMapsPlacesAutocompleteConstructor {
  new (
    inputField: HTMLInputElement,
    options?: {
      types?: string[]
      fields?: string[]
    }
  ): GoogleMapsPlacesAutocomplete
}

declare global {
  namespace google {
    namespace maps {
      type MapsEventListener = GoogleMapsEventListener
      namespace places {
        interface Autocomplete extends GoogleMapsPlacesAutocomplete {}
      }
    }
  }
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: GoogleMapsPlacesAutocompleteConstructor
        }
        event: {
          removeListener: (listener: GoogleMapsEventListener) => void
        }
      }
    }
  }
  const google: {
    maps: {
      places: {
        Autocomplete: GoogleMapsPlacesAutocompleteConstructor
      }
      event: {
        removeListener: (listener: GoogleMapsEventListener) => void
      }
    }
  }
}

export {}
