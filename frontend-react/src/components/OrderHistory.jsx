import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, MapPin, Calendar } from "lucide-react";
import axiosInstance from "./axiosInstance";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axiosInstance.get("/orders/");
        setOrders(res.data || []);
      } catch (error) {
        console.error("Order Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return "bg-warning bg-opacity-25 text-dark";
      case "Processing":
        return "bg-info bg-opacity-25 text-dark";
      case "Shipped":
        return "bg-primary bg-opacity-10 text-primary";
      case "Delivered":
        return "bg-success bg-opacity-10 text-success";
      case "Cancelled":
        return "bg-danger bg-opacity-10 text-danger";
      default:
        return "bg-secondary bg-opacity-10 text-secondary";
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success"></div>
        <p className="mt-2 text-muted">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: "900px" }}>
      <h3 className="fw-bold mb-4">📦 Your Order History</h3>

      {orders.length === 0 ? (
        <div className="fm-card p-5 text-center">
          <Package size={48} className="text-muted mb-3" />
          <h5 className="fw-bold">No orders yet</h5>
          <p className="text-muted small mb-4">
            Looks like you haven&apos;t placed an order yet.
          </p>
          <button
            className="btn btn-fm-primary"
            onClick={() => navigate("/dashboard")}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {orders.map((order) => {
            const items = order.items || [];
            const orderTotal = items.reduce(
              (sum, item) => sum + Number(item.price || 0),
              0
            );

            return (
              <div key={order.id} className="fm-card p-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-3 border-bottom">
                  <div>
                    <h6 className="fw-bold mb-1">Order #{order.id}</h6>
                    <span className="text-muted small d-inline-flex align-items-center gap-1">
                      <Calendar size={14} />
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <span className={`badge rounded-pill px-3 py-2 fw-semibold ${getStatusBadge(order.status_name)}`}>
                    {order.status_name || "Pending"}
                  </span>
                </div>

                <div className="d-flex flex-column gap-2 mb-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between small">
                      <span>
                        Product #{item.product} <span className="text-muted">x {item.quantity}</span>
                      </span>
                      <span className="fw-semibold">₹{Number(item.price || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="d-flex flex-wrap justify-content-between align-items-center pt-3 border-top">
                  <span className="text-muted small d-inline-flex align-items-center gap-1">
                    <MapPin size={14} className="text-success" />
                    {order.address}, {order.city}
                  </span>
                  <div className="fw-bold fs-5 text-success">
                    Total: ₹{orderTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
