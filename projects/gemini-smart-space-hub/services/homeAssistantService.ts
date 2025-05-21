import { HAState, HomeAssistantApiConfig } from '../types';

interface HomeAssistantErrorResponse {
  message: string;
  code?: number | string; // Home Assistant error codes can vary
}

const homeAssistantService = {
  async callService(
    config: HomeAssistantApiConfig,
    domain: string,
    service: string,
    serviceData?: Record<string, any>
  ): Promise<any> {
    const url = `${config.url.replace(/\/$/, '')}/api/services/${domain}/${service}`;
    console.log(`HA API: Calling service ${domain}.${service} at ${url}`, serviceData);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData || {}),
      });

      if (!response.ok) {
        let errorData: HomeAssistantErrorResponse | string = 'Unknown error';
        try {
            errorData = await response.json() as HomeAssistantErrorResponse;
        } catch (e) {
            errorData = response.statusText || errorData;
        }
        const errorMessage = typeof errorData === 'string' ? errorData : errorData.message;
        console.error(`HA API Error: ${response.status} ${errorMessage}`, errorData);
        throw new Error(`Home Assistant API error: ${errorMessage} (Status: ${response.status})`);
      }
      
      console.log(`HA API: Service ${domain}.${service} called successfully.`);
      return await response.json(); // Usually an array of states that changed, or an empty array
    } catch (error) {
      console.error('HA API: Network or fetch error:', error);
      throw error; // Re-throw to be caught by the caller
    }
  },

  async getState(config: HomeAssistantApiConfig, entityId: string): Promise<HAState | null> {
    const url = `${config.url.replace(/\/$/, '')}/api/states/${entityId}`;
    console.log(`HA API: Getting state for ${entityId} at ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
         if (response.status === 404) {
          console.warn(`HA API: Entity ${entityId} not found (404).`);
          return null;
        }
        let errorData: HomeAssistantErrorResponse | string = 'Unknown error';
        try {
            errorData = await response.json() as HomeAssistantErrorResponse;
        } catch (e) {
            errorData = response.statusText || errorData;
        }
        const errorMessage = typeof errorData === 'string' ? errorData : errorData.message;
        console.error(`HA API Error fetching state for ${entityId}: ${response.status} ${errorMessage}`, errorData);
        throw new Error(`Home Assistant API error fetching state: ${errorMessage} (Status: ${response.status})`);
      }
      
      const stateData = await response.json() as HAState;
      console.log(`HA API: State for ${entityId}:`, stateData);
      return stateData;
    } catch (error) {
      console.error(`HA API: Network or fetch error getting state for ${entityId}:`, error);
      throw error; // Re-throw
    }
  },

  async checkConnection(config: HomeAssistantApiConfig): Promise<boolean> {
    const url = `${config.url.replace(/\/$/, '')}/api/`;
    console.log(`HA API: Checking connection to ${url}`);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
      });
      if(response.ok) {
        const data = await response.json();
        if (data && data.message === "API running.") {
            console.log("HA API: Connection successful.");
            return true;
        }
      }
      console.warn("HA API: Connection check failed or unexpected response.", response.status, await response.text());
      return false;
    } catch (error) {
      console.error("HA API: Connection check failed with error:", error);
      return false;
    }
  }
};

export default homeAssistantService;
