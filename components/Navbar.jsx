import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">🩸 Blood Management</Link>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/inventory">Inventory</Link>
        <Link to="/requests">Blood Requests</Link>
        <Link to="/payment">Payment</Link>
        {user.role === "admin" && <Link to="/admin/users">Users</Link>}
      </div>

      <div className="navbar-right">
        <NotificationBell />
        <span className="navbar-user">
          {user.name} <span className="badge">{user.role}</span>
        </span>
         <Link to="/profile">Profile</Link>
        <button className="btn btn-outline" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
