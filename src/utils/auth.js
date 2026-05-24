// Secure authentication utilities
import axios from 'axios';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Token management with expiration
export const setAuthTokens = (accessToken, refreshToken, expiresIn) => {
  const expiryTime = Date.now() + (expiresIn * 1000);
  
  // Use localStorage for persistence across refreshes
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

export const getAccessToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) return null;
    
    // Check if token is expired - but don't clear it here to avoid side effects
    if (Date.now() > parseInt(expiry)) {
      return null; // Return null instead of clearing tokens
    }
    
    return token;
  } catch {
    return null;
  }
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearAuthTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// Token validation
export const isTokenValid = () => {
  const token = getAccessToken();
  return !!token;
};

// Token refresh logic
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await axios.post('/api/v1/auth/refresh', {
      refresh_token: refreshToken
    });
    
    const { access_token, refresh_token: newRefreshToken, expires_in } = response.data.data;
    
    setAuthTokens(access_token, newRefreshToken, expires_in);
    
    return access_token;
  } catch (error) {
    clearAuthTokens();
    throw error;
  }
};

// Axios interceptor for automatic token refresh
export const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const newToken = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Redirect to login if refresh fails
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Authentication check
export const isAuthenticated = () => {
  return isTokenValid();
};
