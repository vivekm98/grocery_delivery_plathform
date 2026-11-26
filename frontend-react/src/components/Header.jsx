import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, ShoppingCart, Package, LogOut, Home } from "lucide-react";
import { AuthContext } from "./AuthProvider";
import axiosInstance from "./axiosInstance";

const Header = () => {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = async () => {
    const refresh = localStorage.getItem("refreshToken");
    if (refresh) {
      try {
        await axiosInstance.post("/logout/", { refresh });
      } catch {
        // Proceed with local logout even if token was already expired
      }
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <nav className="navbar navbar-expand-lg fm-navbar py-2">
      <div className="container">
        {/* Brand */}
        <Link
          className="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark"
          to={isLoggedIn ? "/dashboard" : "/"}
        >
          <span className="fm-brand-icon">
            <ShoppingBag size={20} />
          </span>
          <span style={{ letterSpacing: "-0.5px", fontSize: "1.25rem" }}>
            Fresh<span style={{ color: "var(--fm-primary)" }}>Mart</span>
          </span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Nav links */}
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-lg-center gap-1 mt-3 mt-lg-0">
            <li className="nav-item">
              <Link
                className={`nav-link fm-nav-link d-flex align-items-center gap-1 ${isActive(
                  isLoggedIn ? "/dashboard" : "/"
                )}`}
                to={isLoggedIn ? "/dashboard" : "/"}
              >
                <Home size={16} />
                <span>{isLoggedIn ? "Shop" : "Home"}</span>
              </Link>
            </li>

            {isLoggedIn && (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link fm-nav-link d-flex align-items-center gap-1 ${isActive("/cart")}`}
                    to="/cart"
                  >
                    <ShoppingCart size={16} />
                    <span>Cart</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link fm-nav-link d-flex align-items-center gap-1 ${isActive("/orders")}`}
                    to="/orders"
                  >
                    <Package size={16} />
                    <span>Orders</span>
                  </Link>
                </li>
              </>
            )}

            <li className="nav-item ms-lg-2 mt-2 mt-lg-0 d-flex gap-2">
              {isLoggedIn ? (
                <button
                  className="btn btn-outline-danger rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1"
                  onClick={logout}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              ) : (
                <>
                  <Link className="btn btn-fm-outline py-2 px-3" to="/login">
                    Login
                  </Link>
                  <Link className="btn btn-fm-primary py-2 px-3" to="/register">
                    Get Started
                  </Link>
                </>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
