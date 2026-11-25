import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, MapPin, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="fm-footer mt-5 pt-5 pb-4">
      <div className="container">
        <div className="row g-4 pb-4 border-bottom border-secondary border-opacity-25">
          {/* Brand */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fm-brand-icon">
                <ShoppingBag size={18} />
              </span>
              <span className="fw-bold text-white fs-5">
                Fresh<span className="text-success">Mart</span>
              </span>
            </div>
            <p className="small text-secondary mb-0" style={{ maxWidth: "300px" }}>
              Farm-fresh groceries, organic produce, and daily essentials delivered straight to your doorstep in minutes.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h6 className="text-white fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li><Link to="/dashboard">Shop Now</Link></li>
              <li><Link to="/cart">My Cart</Link></li>
              <li><Link to="/orders">Order History</Link></li>
              <li><Link to="/login">Account Login</Link></li>
            </ul>
          </div>

          {/* Highlights */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3">Why FreshMart</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small text-secondary">
              <li>⚡ 15-Minute Express Delivery</li>
              <li>🥬 100% Farm-Fresh Guarantee</li>
              <li>🔐 OTP-Verified Accounts</li>
              <li>📦 Real-Time Order Tracking</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3">Contact Us</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small text-secondary">
              <li className="d-flex align-items-center gap-2">
                <MapPin size={15} className="text-success" /> Maharashtra, India
              </li>
              <li className="d-flex align-items-center gap-2">
                <Mail size={15} className="text-success" /> support@freshmart.app
              </li>
              <li className="d-flex align-items-center gap-2">
                <Phone size={15} className="text-success" /> +91 98765 43210
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-4 d-flex flex-column flex-sm-row justify-content-between align-items-center small text-secondary">
          <span>© {new Date().getFullYear()} FreshMart Grocery Delivery. All rights reserved.</span>
          <span className="mt-2 mt-sm-0">Built with React & Django REST Framework</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
