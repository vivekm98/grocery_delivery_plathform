import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import axiosInstance from "./axiosInstance";
import { useToast } from "./ToastContext";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axiosInstance.get(`/products/${id}/`);
        setProduct(res.data);
        setQuantity(1);
      } catch (err) {
        console.error("Product fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (value) => {
    if (value < 1 || (product && value > product.stock)) return;
    setQuantity(value);
  };

  const addToCart = async () => {
    if (quantity > product.stock) {
      showToast("Quantity exceeds available stock.", "error");
      return;
    }

    try {
      await axiosInstance.post("/cart/add/", {
        product_id: product.id,
        quantity,
      });
      showToast(`Added ${quantity} x ${product.name} to cart!`);
    } catch {
      showToast("Please login first.", "error");
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-5 text-center">
        <h5>Product not found</h5>
      </div>
    );
  }

  const stockStatus =
    product.stock === 0 ? "Out of Stock" : product.stock <= 5 ? `Only ${product.stock} Left` : "In Stock";

  const stockClass =
    product.stock === 0
      ? "bg-danger bg-opacity-10 text-danger"
      : product.stock <= 5
      ? "bg-warning bg-opacity-25 text-dark"
      : "bg-success bg-opacity-10 text-success";

  return (
    <div className="container py-5" style={{ maxWidth: "960px" }}>
      <button
        className="btn btn-light border rounded-pill px-3 py-1 mb-4 d-inline-flex align-items-center gap-2 small fw-semibold"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="fm-card p-4 p-lg-5">
        <div className="row g-4 align-items-center">
          <div className="col-md-5 text-center bg-light rounded-4 p-4">
            <img
              src={product.image}
              alt={product.name}
              className="img-fluid"
              style={{ maxHeight: "340px", objectFit: "contain" }}
            />
          </div>

          <div className="col-md-7">
            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 mb-2">
              {product.category_name}
            </span>
            <h2 className="fw-bold mb-2">{product.name}</h2>

            <div className="d-flex align-items-center gap-3 mb-3">
              <h3 className="fw-bold text-success mb-0">
                ₹{product.price}
                <span className="fs-6 text-muted fw-normal"> / {product.unit_name}</span>
              </h3>
              <span className={`badge rounded-pill px-3 py-2 ${stockClass}`}>{stockStatus}</span>
            </div>

            <p className="text-muted mb-4">
              {product.description || "Freshly sourced quality grocery item delivered to your doorstep."}
            </p>

            {/* QUANTITY & ADD TO CART */}
            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="d-inline-flex align-items-center border rounded-pill px-2 py-1 bg-light">
                <button
                  className="btn btn-sm rounded-circle"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="px-3 fw-bold">{quantity}</span>
                <button
                  className="btn btn-sm rounded-circle"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stock}
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                className="btn btn-fm-primary px-4 py-2 d-inline-flex align-items-center gap-2"
                disabled={product.stock === 0}
                onClick={addToCart}
              >
                <ShoppingCart size={18} />
                <span>Add to Cart — ₹{(product.price * quantity).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
