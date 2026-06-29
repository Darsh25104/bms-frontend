import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function BloodRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const [form, setForm] = useState({
    organization: "",
    bloodGroup: "A+",
    quantity: 1,
  });

  const canCreate = ["hospital", "admin"].includes(user?.role);
  const canApprove = ["organization", "admin"].includes(user?.role);

  const load = async () => {
    try {
      const res = await api.get("/request/all");
      setRequests(res.data.requests || []);
    } catch (err) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const loadOrgs = async () => {
    try {
      const res = await api.get("/auth/users-by-role/organization");
      setOrganizations(res.data.users || []);
    } catch (err) {
      // optional directory endpoint
    }
  };

  useEffect(() => {
    load();
    loadOrgs();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        hospital: user._id,
      };
      const res = await api.post("/request/create", payload);
      if (res.data.success) {
        toast.success("Blood request submitted");
        setForm({ organization: "", bloodGroup: "A+", quantity: 1 });
        load();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await api.put(`/request/update-status/${id}`, { status });
      if (res.data.success) {
        toast.success(`Request ${status}`);
        load();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page">
      <h1>Blood Requests</h1>

      {canCreate && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>New Blood Request</h3>
          <div className="form-row">
            <select name="organization" value={form.organization} onChange={handleChange} required>
              <option value="">Select Blood Bank / Organization</option>
              {organizations.map((o) => (
                <option key={o._id} value={o._id}>{o.name}</option>
              ))}
            </select>

            <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <input
              type="number"
              name="quantity"
              min="1"
              value={form.quantity}
              onChange={handleChange}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      )}

      <h3>All Requests</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Organization</th>
                <th>Blood Group</th>
                <th>Qty</th>
                <th>Status</th>
                {canApprove && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.hospital?.name || "-"}</td>
                  <td>{r.organization?.name || "-"}</td>
                  <td>{r.bloodGroup}</td>
                  <td>{r.quantity}</td>
                  <td>
                    <span className={`pill status-${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                  {canApprove && (
                    <td>
                      {r.status === "Pending" ? (
                        <div className="action-row">
                          <button
                            className="btn btn-small btn-success"
                            disabled={updatingId === r._id}
                            onClick={() => updateStatus(r._id, "Approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            disabled={updatingId === r._id}
                            onClick={() => updateStatus(r._id, "Rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={canApprove ? 6 : 5} style={{ textAlign: "center" }}>
                    No requests yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
