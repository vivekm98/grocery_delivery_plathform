import React, { useEffect, useState } from "react";
import axiosInstance from "./axiosInstance";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Plus, ArrowLeft } from "lucide-react";
import Footer from "./Footer";
import { useToast } from "./ToastContext";

const CategoryProducts = () => {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosInstance.get(`/products/?category=${id}`);
        const list = res.data.results || res.data || [];
        setProducts(list);
        setFilteredProducts(list);
      } catch (err) {
        console.error("Error fetching products:", err);
        showToast("Failed to load category products.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [id, showToast]);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, products]);

  const handleAddToCart = async (e, productId, productName) => {
    e.stopPropagation();
    try {
      await axiosInstance.post("/cart/add/", {
        product_id: productId,
        quantity: 1,
      });
      showToast(`${productName} added to cart!`);
    } catch {
      showToast("Please login to add items.", "error");
      navigate("/login");
    }
  };

  return (
    <>
      <div className="container py-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-light border rounded-circle p-2"
              onClick={() => navigate("/dashboard")}
              title="Back to Shop"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h3 className="fw-bold mb-0">
                {products[0]?.category_name || "Category Products"}
              </h3>
              <span className="text-muted small">{filteredProducts.length} items available</span>
            </div>
          </div>

          <div className="fm-search-wrap d-flex align-items-center gap-2" style={{ minWidth: "280px" }}>
            <Search size={18} className="text-muted" />
            <input
              type="text"
              placeholder="Search in this category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center my-5 py-5">
            <div className="spinner-border text-success"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="fm-card p-5 text-center text-muted">
            No products found in this category.
          </div>
        ) : (
          <div className="row g-3">
            {filteredProducts.map((product) => (
              <div key={product.id} className="col-6 col-md-4 col-lg-3">
                <div
                  className="fm-card fm-card-hover h-100 d-flex flex-column overflow-hidden"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="bg-light p-3 text-center position-relative" style={{ height: "190px" }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-100 w-100"
                      style={{ objectFit: "contain" }}
                    />
                    {product.stock === 0 && (
                      <span className="badge bg-danger position-absolute top-0 end-0 m-2 rounded-pill">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="p-3 d-flex flex-column flex-grow-1">
                    <h6 className="fw-bold mb-1 text-truncate">{product.name}</h6>
                    <p className="text-muted small mb-3 text-truncate">{product.description}</p>

                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <div>
                        <span className="fw-bold fs-5 text-success">₹{product.price}</span>
                        <span className="text-muted small"> / {product.unit_name}</span>
                      </div>
                      <button
                        className="btn btn-fm-primary btn-sm px-3 py-2 d-flex align-items-center gap-1"
                        disabled={product.stock === 0}
                        onClick={(e) => handleAddToCart(e, product.id, product.name)}
                      >
                        <Plus size={15} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default CategoryProducts;
