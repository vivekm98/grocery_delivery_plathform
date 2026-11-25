import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import axiosInstance from "./axiosInstance";
import { useToast } from "./ToastContext";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    axiosInstance
      .get("/cart/")
      .then((res) => {
        const items = res.data.items || res.data || [];
        setCartItems(items);
        setSelectedItems(items); // auto-select all items by default for better UX
      })
      .catch(() => {
        showToast("Failed to load cart.", "error");
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const toggleSelect = (item) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  };

  const updateQuantity = (itemId, newQty) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item || newQty < 1) return;

    if (newQty > item.product.stock) {
      showToast(`Only ${item.product.stock} items available in stock.`, "error");
      return;
    }

    setCartItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
    );
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
    );

    axiosInstance.put(`/cart/update/${itemId}/`, { quantity: newQty });
  };

  const removeFromCart = (itemId, name) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
    axiosInstance.delete(`/cart/remove/${itemId}/`);
    showToast(`${name} removed from cart.`);
  };

  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleOrder = () => {
    if (!selectedItems.length) {
      showToast("Please select at least one item to checkout.", "error");
      return;
    }
    navigate("/order", { state: { items: selectedItems } });
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success"></div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: "1050px" }}>
      <h3 className="fw-bold mb-4">🛒 Your Shopping Basket</h3>

      {cartItems.length === 0 ? (
        <div className="fm-card p-5 text-center">
          <ShoppingBag size={48} className="text-muted mb-3" />
          <h5 className="fw-bold">Your basket is empty</h5>
          <p className="text-muted small mb-4">
            Looks like you haven&apos;t added any fresh groceries yet.
          </p>
          <button
            className="btn btn-fm-primary"
            onClick={() => navigate("/dashboard")}
          >
            Browse Groceries
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {/* CART ITEMS */}
          <div className="col-lg-8">
            <div className="d-flex flex-column gap-3">
              {cartItems.map((item) => {
                const isSelected = selectedItems.some((i) => i.id === item.id);
                return (
                  <div key={item.id} className="fm-card p-3">
                    <div className="d-flex align-items-center gap-3 flex-wrap flex-sm-nowrap">
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        checked={isSelected}
                        onChange={() => toggleSelect(item)}
                      />

                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="rounded-3 bg-light p-1"
                        style={{ width: 72, height: 72, objectFit: "contain" }}
                      />

                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-1">{item.product.name}</h6>
                        <span className="text-muted small">
                          ₹{item.product.price} / {item.unit_name || item.product.unit_name}
                        </span>
                      </div>

                      <div className="d-inline-flex align-items-center border rounded-pill px-2 py-1 bg-light">
                        <button
                          className="btn btn-sm p-1"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-2 fw-bold small">{item.quantity}</span>
                        <button
                          className="btn btn-sm p-1"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-end" style={{ minWidth: "75px" }}>
                        <div className="fw-bold text-success">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </div>
                      </div>

                      <button
                        className="btn btn-light text-danger rounded-circle p-2"
                        title="Remove item"
                        onClick={() => removeFromCart(item.id, item.product.name)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SUMMARY CARD */}
          <div className="col-lg-4">
            <div className="fm-card p-4 position-sticky" style={{ top: "88px" }}>
              <h5 className="fw-bold mb-3">Order Summary</h5>

              <div className="d-flex justify-content-between text-muted small mb-2">
                <span>Selected Items</span>
                <span>{selectedItems.length}</span>
              </div>
              <div className="d-flex justify-content-between text-muted small mb-2">
                <span>Delivery Fee</span>
                <span className="text-success fw-semibold">FREE</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between align-items-center mb-4">
                <span className="fw-bold">Total</span>
                <span className="fw-bold fs-4 text-success">₹{totalPrice.toFixed(2)}</span>
              </div>

              <button
                className="btn btn-fm-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={handleOrder}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
