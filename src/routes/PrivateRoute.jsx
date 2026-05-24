import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { checkAuthFromStorage } from "../utils/routeAuth";

export default function PrivateRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  
  const isAuthenticated = checkAuthFromStorage();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
