import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, CheckCircle2 } from "lucide-react";
import axiosInstance from "./axiosInstance";
import { useToast } from "./ToastContext";

const OrderForm = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { showToast } = useToast();

  const items = state?.items ?? [];
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
  });

  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!items.length) {
      showToast("Your cart is empty.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post("/orders/create/", {
        ...form,
        items: items.map((item) => ({
          product: item.product.id,
          quantity: item.quantity,
        })),
      });

      showToast("Order placed successfully! 🎉");
      navigate("/orders");
    } catch (error) {
      const msg = error.response?.data?.error || "Failed to place order. Please check your details.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: "1050px" }}>
      <h3 className="fw-bold mb-4">Checkout & Delivery Details</h3>

      <div className="row g-4">
        {/* SHIPPING FORM */}
        <div className="col-lg-7">
          <div className="fm-card p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <MapPin size={20} className="text-success" />
              <h5 className="fw-bold mb-0">Delivery Address</h5>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Street Address</label>
                  <textarea
                    name="address"
                    rows={2}
                    className="form-control"
                    placeholder="House No, Building, Street"
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">City</label>
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">State</label>
                  <input
                    type="text"
                    name="state"
                    className="form-control"
                    value={form.state}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Country</label>
                  <input
                    type="text"
                    name="country"
                    className="form-control"
                    value={form.country}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-fm-primary w-100 py-2 mt-4 d-flex align-items-center justify-content-center gap-2"
                disabled={submitting}
              >
                <CheckCircle2 size={18} />
                <span>{submitting ? "Placing Order..." : `Confirm Order — ₹${totalPrice.toFixed(2)}`}</span>
              </button>
            </form>
          </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="col-lg-5">
          <div className="fm-card p-4">
            <h5 className="fw-bold mb-3">Items in Your Order ({items.length})</h5>
            <div className="d-flex flex-column gap-2 mb-3">
              {items.map((item) => (
                <div key={item.id} className="d-flex justify-content-between align-items-center small">
                  <span>
                    {item.product.name} <span className="text-muted">x {item.quantity}</span>
                  </span>
                  <span className="fw-semibold">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold">Grand Total</span>
              <span className="fw-bold fs-4 text-success">₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
