const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('artemis_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    };

    // Add auth token if available
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        const error = new Error(data.error || `API Error: ${response.statusText}`);
        error.response = { data };
        throw error;
      }
      
      return { data };
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Set auth token
  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('artemis_token', token);
  }

  // Clear auth token
  clearAuthToken() {
    this.token = null;
    localStorage.removeItem('artemis_token');
  }
}

export default new ApiService();
