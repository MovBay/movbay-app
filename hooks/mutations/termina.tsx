const TERMINAL_API_SECRET = 'sk_test_83RXQZdXmRHa3uCWvQyv8TjJGaAkmdvf';

export interface TerminalCity {
  id: string;
  name: string;
  code?: string;
  country_code?: string;
  state_code?: string;
}

export interface TerminalCityResponse {
  status: boolean;
  message: string;
  data: TerminalCity[];
}

export const fetchTerminalCities = async (
  countryCode: string = "NG", 
  stateCode?: string
): Promise<TerminalCity[] | null> => {
  const url = "https://sandbox.terminal.africa/v1/cities";
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${TERMINAL_API_SECRET}`
  };

  const params = new URLSearchParams({
    country_code: countryCode,
    ...(stateCode && { state_code: stateCode })
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TerminalCityResponse = await response.json();
    
    if (result.status && result.data) {
      return result.data;
    } else {
      console.error('Terminal Africa API error:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching cities from Terminal Africa:', error);
    return null;
  }
};