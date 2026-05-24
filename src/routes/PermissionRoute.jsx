import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { hasPermission } from "../utils/permissions";

export default function PermissionRoute({ permission, children }) {
  const [permTick, setPermTick] = useState(0);

  useEffect(() => {
    const onChange = () => setPermTick((t) => t + 1);
    window.addEventListener("permissions-changed", onChange);
    return () => window.removeEventListener("permissions-changed", onChange);
  }, []);

  // eslint-disable-next-line no-unused-vars
  const _ = permTick; // forces re-eval of hasPermission on change

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
