import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import { checkAuthFromStorage } from "../utils/routeAuth";

export default function PublicRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  
  const isAuthenticated = checkAuthFromStorage();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress aria-label="Loading" />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
