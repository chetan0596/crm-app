// Shared auth utility for route guards
export const checkAuthFromStorage = () => {
  try {
    const token = localStorage.getItem('auth_token');
    const expiry = localStorage.getItem('token_expiry');
    
    if (!token) return false;
    
    // If expiry is set and > 0, check if expired
    if (expiry && parseInt(expiry) > 0 && Date.now() > parseInt(expiry)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};
