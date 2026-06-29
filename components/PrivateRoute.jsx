import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap any page that needs login. Pass roles=["admin","hospital"] to restrict further.
export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
