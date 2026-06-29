import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function generateFakeTransactionId() {
  return "DEMO-" + Math.random().toString(36).slice(2, 10).toUpperCase() + "-" + Date.now();
}

export default function Payment() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const [form, setForm] = useState({ amount: "", purpose: "" });
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [step, setStep] = useState("form"); // form -> card -> processing -> done

  const loadHistory = async () => {
    try {
      const res = await api.get("/payment/history");
      setHistory(res.data.payments || []);
    } catch (err) {
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const loadAllPayments = async () => {
    if (user?.role !== "admin") return;
    try {
      const res = await api.get("/payment/all");
      setAllPayments(res.data.payments || []);
    } catch (err) {
      // requires backend addition, see README
    }
  };

  useEffect(() => {
    loadHistory();
    loadAllPayments();
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.purpose) return toast.error("Fill all fields");
    setStep("card");
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    if (card.number.length < 12 || !card.expiry || card.cvv.length < 3) {
      return toast.error("Enter valid demo card details");
    }
    setStep("processing");
    setPaying(true);

    // Simulate a gateway delay, like Razorpay/Stripe checkout would do
    setTimeout(async () => {
      try {
        const res = await api.post("/payment/pay", {
          amount: Number(form.amount),
          purpose: form.purpose,
          transactionId: generateFakeTransactionId(),
        });
        if (res.data.success) {
          toast.success("Payment submitted, awaiting verification");
          setStep("done");
          setForm({ amount: "", purpose: "" });
          setCard({ number: "", expiry: "", cvv: "" });
          loadHistory();
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Payment failed");
        setStep("form");
      } finally {
        setPaying(false);
      }
    }, 1500);
  };

  const verifyPayment = async (id) => {
    setVerifyingId(id);
    try {
      const res = await api.put(`/payment/verify/${id}`);
      if (res.data.success) {
        toast.success("Payment verified");
        loadAllPayments();
        loadHistory();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="page">
      <h1>Payment</h1>

      <div className="card form-card payment-card">
        <h3>Make a Demo Payment</h3>

        {step === "form" && (
          <form onSubmit={handleFormSubmit}>
            <div className="form-row">
              <input
                type="number"
                placeholder="Amount (₹)"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Purpose (e.g. Donation drive fee)"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit">Continue to Pay</button>
          </form>
        )}

        {step === "card" && (
          <form onSubmit={handleCardSubmit}>
            <p className="subtitle">Demo gateway · no real money is charged</p>
            <input
              type="text"
              placeholder="Card Number (demo)"
              maxLength={16}
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, "") })}
              required
            />
            <div className="form-row">
              <input
                type="text"
                placeholder="MM/YY"
                maxLength={5}
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="CVV"
                maxLength={3}
                value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "") })}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={paying}>
              Pay ₹{form.amount}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setStep("form")}>
              Back
            </button>
          </form>
        )}

        {step === "processing" && <p>Processing your payment...</p>}
        {step === "done" && (
          <div>
            <p>✅ Payment submitted successfully.</p>
            <button className="btn btn-outline" onClick={() => setStep("form")}>Make another payment</button>
          </div>
        )}
      </div>

      <h3>My Payment History</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <tr key={p._id}>
                  <td>₹{p.amount}</td>
                  <td>{p.purpose}</td>
                  <td>{p.transactionId}</td>
                  <td><span className={`pill status-${p.status.toLowerCase()}`}>{p.status}</span></td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: "center" }}>No payments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {user?.role === "admin" && (
        <>
          <h3>Pending Payments (Admin Verification)</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Purpose</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allPayments.map((p) => (
                  <tr key={p._id}>
                    <td>{p.user?.name || "-"}</td>
                    <td>₹{p.amount}</td>
                    <td>{p.purpose}</td>
                    <td>{p.transactionId}</td>
                    <td><span className={`pill status-${p.status.toLowerCase()}`}>{p.status}</span></td>
                    <td>
                      {p.status === "Pending" ? (
                        <button
                          className="btn btn-small btn-success"
                          disabled={verifyingId === p._id}
                          onClick={() => verifyPayment(p._id)}
                        >
                          Verify
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
                {allPayments.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: "center" }}>No payments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
