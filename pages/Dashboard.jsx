import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [bloodData, setBloodData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, groupRes] = await Promise.all([
          api.get("/inventory/dashboard"),
          api.get("/inventory/blood-groups"),
        ]);
        setStats(dashRes.data);
        setBloodData(groupRes.data.bloodData);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard...</div>;

  return (
    <div className="page">
      <h1>Welcome, {user?.name} 👋</h1>
      <p className="subtitle">Role: {user?.role}</p>

      <div className="stat-grid">
        <div className="stat-card in">
          <h3>Total Blood In</h3>
          <p>{stats?.totalBloodIn ?? 0} units</p>
        </div>
        <div className="stat-card out">
          <h3>Total Blood Out</h3>
          <p>{stats?.totalBloodOut ?? 0} units</p>
        </div>
        <div className="stat-card available">
          <h3>Available Blood</h3>
          <p>{stats?.availableBlood ?? 0} units</p>
        </div>
      </div>

      <h2>Stock by Blood Group</h2>
      <div className="blood-grid">
        {bloodData &&
          Object.entries(bloodData).map(([group, qty]) => (
            <div key={group} className={`blood-card ${qty <= 0 ? "low" : ""}`}>
              <span className="blood-group">{group}</span>
              <span className="blood-qty">{qty} units</span>
            </div>
          ))}
      </div>

      <div className="role-hint">
        {user?.role === "donor" && (
          <p>As a donor, go to <b>Inventory</b> to record a blood donation.</p>
        )}
        {user?.role === "hospital" && (
          <p>As a hospital, go to <b>Blood Requests</b> to request blood units, or <b>Payment</b> to pay dues.</p>
        )}
        {user?.role === "organization" && (
          <p>As an organization, manage <b>Inventory</b> stock and approve/reject <b>Blood Requests</b>.</p>
        )}
        {user?.role === "admin" && (
          <p>As admin, you can view all <b>Users</b>, all requests and all inventory records.</p>
        )}
      </div>
    </div>
  );
}
