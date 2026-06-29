import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    inventoryType: "in",
    bloodGroup: "A+",
    quantity: 1,
    organization: "",
    donor: "",
    hospital: "",
    email: user?.email || "",
  });

  const canAdd = ["donor", "organization", "admin"].includes(user?.role);

  const loadAll = async () => {
    try {
      const invRes = await api.get("/inventory/get-inventory");
      setInventory(invRes.data.inventory || []);
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const loadDirectories = async () => {
    try {
      const [orgRes, hospRes] = await Promise.all([
        api.get("/auth/users-by-role/organization"),
        api.get("/auth/users-by-role/hospital"),
      ]);
      setOrganizations(orgRes.data.users || []);
      setHospitals(hospRes.data.users || []);
    } catch (err) {
      // Endpoint may not exist yet if backend addition wasn't applied
    }
  };

  useEffect(() => {
    loadAll();
    loadDirectories();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity) };
if (user.role === "donor") payload.donor = user._id;
if (user.role === "organization") payload.organization = user._id;

if (!payload.donor) delete payload.donor;
if (!payload.hospital) delete payload.hospital;

      const res = await api.post("/inventory/create", payload);
      if (res.data.success) {
        toast.success("Inventory record added");
        loadAll();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add inventory");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Blood Inventory</h1>

      {canAdd && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>Add Inventory Record</h3>
          <div className="form-row">
            <select name="inventoryType" value={form.inventoryType} onChange={handleChange}>
              <option value="in">IN (Donation / Stock received)</option>
              <option value="out">OUT (Stock issued)</option>
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
              placeholder="Units"
              required
            />
          </div>

          <div className="form-row">
            {user.role !== "organization" && (
              <select name="organization" value={form.organization} onChange={handleChange} required>
                <option value="">Select Blood Bank / Organization</option>
                {organizations.map((o) => (
                  <option key={o._id} value={o._id}>{o.name}</option>
                ))}
              </select>
            )}

            <select name="hospital" value={form.hospital} onChange={handleChange}>
              <option value="">Hospital (optional)</option>
              {hospitals.map((h) => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Contact email"
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Add Record"}
          </button>
        </form>
      )}

      <h3>All Records</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Blood Group</th>
                <th>Qty</th>
                <th>Organization</th>
                <th>Hospital</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item._id}>
                  <td>
                    <span className={`pill ${item.inventoryType}`}>{item.inventoryType}</span>
                  </td>
                  <td>{item.bloodGroup}</td>
                  <td>{item.quantity}</td>
                  <td>{item.organization?.name || "-"}</td>
                  <td>{item.hospital?.name || "-"}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>No records yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
