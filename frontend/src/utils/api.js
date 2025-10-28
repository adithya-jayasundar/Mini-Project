// API utility functions for backend integration
const API_BASE_URL = 'http://localhost:8000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to handle network errors (CORS, server down, etc.)
const handleNetworkError = (error) => {
  if (error.name === 'TypeError' || error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
    throw new Error('Backend server is not available. Please ensure the server is running on http://localhost:8000');
  }
  throw error;
};

// Authentication APIs
export const authAPI = {
  // Register user
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          age: userData.age ? parseInt(userData.age) : null,
          degree: userData.affiliation || null,
          year: userData.year ? parseInt(userData.year) : null,
          interests: userData.interest === 'custom' ? [userData.customInterest] : [userData.interest]
        }),
        credentials: 'include'
      });
      return handleResponse(response);
    } catch (error) {
      handleNetworkError(error);
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      return handleResponse(response);
    } catch (error) {
      handleNetworkError(error);
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        credentials: 'include'
      });
      return handleResponse(response);
    } catch (error) {
      handleNetworkError(error);
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userData.name,
        age: userData.age ? parseInt(userData.age) : null,
        degree: userData.affiliation || null,
        year: userData.year ? parseInt(userData.year) : null,
        interests: userData.interest === 'custom' ? [userData.customInterest] : [userData.interest]
      }),
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

// Feed APIs
export const feedAPI = {
  // Get personalized feed
  getPersonalizedFeed: async (maxResults = 10) => {
    const response = await fetch(`${API_BASE_URL}/feed/?max_results=${maxResults}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Search papers
  searchPapers: async (query, maxResults = 10) => {
    const response = await fetch(`${API_BASE_URL}/feed/search?q=${encodeURIComponent(query)}&max_results=${maxResults}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

// Transform backend paper data to frontend format
export const transformPaperData = (backendPaper) => ({
  id: backendPaper.arxiv_id || backendPaper.title.slice(0, 10),
  title: backendPaper.title,
  authors: Array.isArray(backendPaper.authors) ? backendPaper.authors.join(', ') : backendPaper.authors,
  abstract: backendPaper.abstract,
  published: backendPaper.published,
  link: backendPaper.link,
  pdf_url: backendPaper.pdf_url
});

// Chat APIs (RAG)
export const chatAPI = {
  // Start building index for a paper (background). Returns { status, index_path }
  buildIndex: async ({ url, chunk_size = 3000, chunk_overlap = 300, rebuild_index = false }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url, chunk_size, chunk_overlap, rebuild_index })
      });
      return handleResponse(response);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Check index status for a given paper URL
  getIndexStatus: async (url) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/index/status?url=${encodeURIComponent(url)}`, {
        credentials: 'include'
      });
      return handleResponse(response);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Query an existing index (fast path)
  queryIndex: async ({ url, question, k = 8 }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url, question, k })
      });
      return handleResponse(response);
    } catch (err) {
      handleNetworkError(err);
    }
  }
};