import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send and receive HttpOnly session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject token if present in localStorage (dual support: cookies + Authorization Bearer header)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('evoting_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, notify or clear session if appropriate
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/verify-face');
      if (!isAuthEndpoint) {
        localStorage.removeItem('evoting_auth_token');
        localStorage.removeItem('evoting_user');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
