// Centralized API configuration for production deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  private getFullUrl(endpoint: string): string {
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = this.getFullUrl(endpoint);
    
    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const text = (await response.text()) || response.statusText;
      throw new Error(`${response.status}: ${text}`);
    }
    
    return response;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await this.request(endpoint, { method: 'GET' });
    return response.json();
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.request(endpoint, { method: 'DELETE' });
    return response.json();
  }
}

// Default API client instance
export const apiClient = new ApiClient();

// Legacy compatibility - update existing apiRequest function to use environment variable
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  return apiClient.request(url, {
    method,
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Export for legacy compatibility
export { API_BASE_URL };