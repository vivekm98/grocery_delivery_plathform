import React, { useEffect, useState } from "react";
import axiosInstance from "./axiosInstance";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Sparkles } from "lucide-react";
import Footer from "./Footer";
import { useToast } from "./ToastContext";

const Dashboard = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [posters, setPosters] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      axiosInstance.get("/categories/"),
      axiosInstance.get("/products/?limit=12"),
      axiosInstance.get("/posters/"),
    ])
      .then(([catRes, prodRes, posterRes]) => {
        setCategories(catRes.data || []);
        setProducts(prodRes.data.results || prodRes.data || []);
        setPosters(posterRes.data || []);
      })
      .catch(() => {
        showToast("Failed to load store items.", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [showToast]);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (filteredCategories.length > 0) {
      navigate(`/category/${filteredCategories[0].id}`);
    }
  };

  const handleAddToCart = async (e, productId, productName) => {
    e.stopPropagation();
    try {
      await axiosInstance.post("/cart/add/", {
        product_id: productId,
        quantity: 1,
      });
      showToast(`${productName} added to cart!`);
    } catch {
      showToast("Please login first to add items.", "error");
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
        <p className="text-muted mt-3 fw-medium">Loading fresh groceries...</p>
      </div>
    );
  }

  return (
    <>
      <div className="container py-4">
        {/* TOP SEARCH + WELCOME BAR */}
        <div className="row align-items-center g-3 mb-4">
          <div className="col-lg-6">
            <div className="fm-pill-badge mb-2">
              <Sparkles size={14} />
              <span>FreshMart Storefront</span>
            </div>
            <h2 className="fw-bold mb-0">What are you craving today?</h2>
          </div>

          <div className="col-lg-6">
            <form onSubmit={handleSearchSubmit} className="fm-search-wrap d-flex align-items-center gap-2">
              <Search size={18} className="text-muted flex-shrink-0" />
              <input
                type="text"
                placeholder="Search categories or fresh products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-fm-primary rounded-pill px-4 py-2">
                Search
              </button>
            </form>
          </div>
        </div>

        {/* HERO POSTER CAROUSEL */}
        {posters.length > 0 && (
          <div
            id="heroCarousel"
            className="carousel slide mb-5 rounded-4 overflow-hidden shadow-sm"
            data-bs-ride="carousel"
            data-bs-interval="3500"
          >
            <div className="carousel-indicators">
              {posters.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  data-bs-target="#heroCarousel"
                  data-bs-slide-to={index}
                  className={index === 0 ? "active" : ""}
                />
              ))}
            </div>
            <div className="carousel-inner">
              {posters.map((poster, index) => (
                <div key={poster.id} className={`carousel-item ${index === 0 ? "active" : ""}`}>
                  <img
                    src={poster.image}
                    alt="Promotional banner"
                    className="d-block w-100"
                    style={{ maxHeight: "340px", objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold mb-0">Shop by Category</h4>
            <span className="text-muted small">{filteredCategories.length} categories</span>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="fm-card p-4 text-center text-muted">
              No categories available yet.
            </div>
          ) : (
            <div className="row g-3">
              {filteredCategories.map((cat) => (
                <div key={cat.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                  <div
                    className="fm-card fm-card-hover p-3 text-center h-100"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/category/${cat.id}`)}
                  >
                    <div
                      className="rounded-circle overflow-hidden mx-auto mb-2 bg-light d-flex align-items-center justify-content-center"
                      style={{ width: 84, height: 84 }}
                    >
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <h6 className="fw-bold mb-0 small text-truncate">{cat.name}</h6>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PRODUCTS */}
        <section className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold mb-0">Popular Groceries</h4>
            <span className="text-muted small">{filteredProducts.length} items</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="fm-card p-5 text-center text-muted">
              No products found matching your search.
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
                    <div className="bg-light position-relative p-3 text-center" style={{ height: "190px" }}>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-100 w-100"
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
                        <div className="h-100 d-flex align-items-center justify-content-center text-muted small">
                          No Image
                        </div>
                      )}
                      {product.stock === 0 ? (
                        <span className="badge bg-danger position-absolute top-0 end-0 m-2 rounded-pill">
                          Out of Stock
                        </span>
                      ) : product.stock <= 5 ? (
                        <span className="badge bg-warning text-dark position-absolute top-0 end-0 m-2 rounded-pill">
                          Only {product.stock} left
                        </span>
                      ) : null}
                    </div>

                    <div className="p-3 d-flex flex-column flex-grow-1">
                      <span className="text-muted small mb-1">{product.category_name}</span>
                      <h6 className="fw-bold text-dark mb-2 text-truncate">{product.name}</h6>

                      <div className="mt-auto d-flex justify-content-between align-items-center pt-2">
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
        </section>
      </div>

      <Footer />
    </>
  );
};

export default Dashboard;
