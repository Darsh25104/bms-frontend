import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";

const ROLES = [
  { value: "donor", label: "Donor" },
  { value: "hospital", label: "Hospital" },
  { value: "organization", label: "Blood Bank / Organization" },
];

export default function Register() {
  const [form, setForm] = useState({
    role: "donor",
    name: "",
    email: "",
    password: "",
    website: "",
    address: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      if (res.data.success) {
        toast.success("Registration successful, please login");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>🩸 Register</h2>

        <label>Account Type</label>
        <select name="role" value={form.role} onChange={handleChange}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="name"
          placeholder={form.role === "donor" ? "Full Name" : "Organization / Hospital Name"}
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          required
        />
        {form.role !== "donor" && (
          <input
            type="text"
            name="website"
            placeholder="Website (optional)"
            value={form.website}
            onChange={handleChange}
          />
        )}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
