import { Link } from "react-router-dom";
import { Zap, ShieldCheck, Leaf, ArrowRight, ShoppingCart, Truck, UserCheck } from "lucide-react";
import Footer from "./Footer";

const Home = () => {
  return (
    <>
      {/* HERO SECTION */}
      <section className="fm-hero py-5">
        <div className="container py-lg-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className="fm-pill-badge mb-3">
                <Zap size={14} />
                <span>Express 15-Minute Grocery Delivery</span>
              </div>

              <h1 className="display-5 fw-bold mb-3" style={{ letterSpacing: "-1px", lineHeight: 1.15 }}>
                Fresh Groceries Delivered{" "}
                <span style={{ color: "var(--fm-primary)" }}>Right to Your Door</span>
              </h1>

              <p className="lead text-muted mb-4" style={{ fontSize: "1.08rem" }}>
                Shop farm-fresh fruits, crisp vegetables, dairy, and daily pantry essentials
                with real-time stock tracking and instant doorstep delivery.
              </p>

              <div className="d-flex flex-wrap gap-3 mb-4">
                <Link to="/register" className="btn btn-fm-primary btn-lg d-inline-flex align-items-center gap-2">
                  <span>Start Shopping</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-fm-outline btn-lg">
                  Sign In
                </Link>
              </div>

              <div className="d-flex flex-wrap gap-4 pt-2 text-muted small fw-semibold">
                <span>✓ 500+ Fresh Items</span>
                <span>✓ OTP Verified Security</span>
                <span>✓ Live Order Tracking</span>
              </div>
            </div>

            <div className="col-lg-6 text-center">
              <div className="fm-card p-4 p-lg-5 d-inline-block position-relative" style={{ borderRadius: "28px" }}>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/3081/3081559.png"
                  alt="FreshMart Grocery Delivery"
                  className="img-fluid"
                  style={{ maxHeight: "300px" }}
                />
                <div
                  className="fm-card px-3 py-2 position-absolute bottom-0 start-0 m-3 d-flex align-items-center gap-2"
                  style={{ borderRadius: "14px" }}
                >
                  <span className="badge bg-success rounded-pill">15 min</span>
                  <span className="small fw-bold text-dark">Fastest Local Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-5 my-3">
        <div className="container">
          <div className="text-center mb-5">
            <span className="text-success fw-bold small text-uppercase">Why FreshMart</span>
            <h2 className="fw-bold mt-1">Built for Speed, Freshness & Trust</h2>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="fm-card fm-card-hover h-100 p-4">
                <div className="fm-brand-icon mb-3" style={{ width: 46, height: 46 }}>
                  <Leaf size={22} />
                </div>
                <h5 className="fw-bold">Farm-Fresh Quality</h5>
                <p className="text-muted small mb-0">
                  Handpicked fruits, organic veggies, and dairy sourced directly from local farms every morning.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="fm-card fm-card-hover h-100 p-4">
                <div className="fm-brand-icon mb-3" style={{ width: 46, height: 46 }}>
                  <Zap size={22} />
                </div>
                <h5 className="fw-bold">Lightning Delivery</h5>
                <p className="text-muted small mb-0">
                  Smart inventory management and quick dispatch ensure your groceries arrive fresh in minutes.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="fm-card fm-card-hover h-100 p-4">
                <div className="fm-brand-icon mb-3" style={{ width: 46, height: 46 }}>
                  <ShieldCheck size={22} />
                </div>
                <h5 className="fw-bold">Secure & Reliable</h5>
                <p className="text-muted small mb-0">
                  Email OTP verification, JWT authentication, and live order status updates from checkout to door.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container py-2">
          <div className="text-center mb-5">
            <span className="text-success fw-bold small text-uppercase">Simple Process</span>
            <h2 className="fw-bold mt-1">How It Works</h2>
          </div>

          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="p-4">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success mb-3" style={{ width: 64, height: 64 }}>
                  <UserCheck size={28} />
                </div>
                <h5 className="fw-bold">1. Verify & Join</h5>
                <p className="text-muted small mb-0">Create your account in seconds with Email OTP verification.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success mb-3" style={{ width: 64, height: 64 }}>
                  <ShoppingCart size={28} />
                </div>
                <h5 className="fw-bold">2. Fill Your Basket</h5>
                <p className="text-muted small mb-0">Browse categories, compare prices, and add items to your cart.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success mb-3" style={{ width: 64, height: 64 }}>
                  <Truck size={28} />
                </div>
                <h5 className="fw-bold">3. Track Delivery</h5>
                <p className="text-muted small mb-0">Place your order and track every step live until it arrives.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5">
        <div className="container">
          <div
            className="p-5 text-center text-white rounded-4 shadow"
            style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}
          >
            <h2 className="fw-bold mb-2">Ready to Skip the Supermarket Line?</h2>
            <p className="mb-4 opacity-75">
              Join FreshMart today and get your daily groceries delivered hassle-free.
            </p>
            <Link to="/register" className="btn btn-light text-success fw-bold btn-lg rounded-pill px-4">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Home;
