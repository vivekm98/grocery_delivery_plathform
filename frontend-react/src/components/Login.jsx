import React, { useContext, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { ShoppingBag, KeyRound, ShieldCheck, Truck } from "lucide-react";
import axiosInstance from "./axiosInstance";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "./AuthProvider";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await axiosInstance.post("/token/", { username, password });
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      setIsLoggedIn(true);
      navigate("/dashboard");
    } catch {
      setError("Invalid username/email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!resetEmail.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post("/otp/send/", {
        email: resetEmail,
        purpose: "reset",
      });
      setResetOtpSent(true);
      setSuccessMsg(`OTP sent to ${resetEmail}. Check your inbox!`);
    } catch (err) {
      const msg = err.response?.data?.email?.[0] || "Failed to send OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post("/password/reset/", {
        email: resetEmail,
        otp: resetOtp,
        new_password: newPassword,
      });
      setForgotMode(false);
      setResetOtpSent(false);
      setResetOtp("");
      setNewPassword("");
      setUsername(resetEmail);
      setPassword("");
      setSuccessMsg("Password updated! You can now log in with your new password.");
    } catch (err) {
      const data = err.response?.data || {};
      const msg = data.otp?.[0] || data.email?.[0] || data.new_password?.[0] || "Failed to reset password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-4 px-3" style={{ background: "#f1f5f9" }}>
      <div className="container" style={{ maxWidth: "920px" }}>
        <div className="fm-card overflow-hidden shadow-lg border-0" style={{ borderRadius: "24px" }}>
          <div className="row g-0">
            {/* LEFT BRANDING PANEL */}
            <div
              className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 text-white"
              style={{
                background: "linear-gradient(155deg, #064e3b 0%, #059669 55%, #10b981 100%)",
              }}
            >
              <div>
                <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-4" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <ShoppingBag size={18} />
                  <span className="fw-bold small">FreshMart Express</span>
                </div>
                <h2 className="fw-bold mb-3" style={{ lineHeight: 1.2 }}>
                  {forgotMode ? "Recover Your Account Safely." : "Welcome Back to Fresh Shopping."}
                </h2>
                <p className="small opacity-75">
                  Sign in with your email or username to browse fresh arrivals, manage your cart, and track live orders.
                </p>
              </div>

              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded-4 d-flex align-items-center gap-3" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <Truck size={20} className="text-warning flex-shrink-0" />
                  <span className="small fw-medium">Live order status & instant updates</span>
                </div>
                <div className="p-3 rounded-4 d-flex align-items-center gap-3" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <ShieldCheck size={20} className="text-info flex-shrink-0" />
                  <span className="small fw-medium">JWT & Email OTP secured access</span>
                </div>
              </div>
            </div>

            {/* RIGHT FORM PANEL */}
            <div className="col-lg-7 bg-white p-4 p-md-5 d-flex flex-column justify-content-center">
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-1">
                  {forgotMode && <KeyRound size={22} className="text-success" />}
                  <h3 className="fw-bold mb-0">{forgotMode ? "Reset Password" : "Sign In"}</h3>
                </div>
                <p className="text-muted small mb-0">
                  {forgotMode
                    ? "We will send a 6-digit OTP to your registered email"
                    : "Enter your email or username and password"}
                </p>
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {successMsg && <div className="alert alert-success py-2 small">{successMsg}</div>}

              {!forgotMode ? (
                <form onSubmit={handleLogin}>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      placeholder="Username or Email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <label htmlFor="username">Username or Email</label>
                  </div>

                  <div className="form-floating mb-2">
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <label htmlFor="password">Password</label>
                  </div>

                  <div className="text-end mb-4">
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-success p-0 text-decoration-none fw-semibold"
                      onClick={() => {
                        setForgotMode(true);
                        setError("");
                        setSuccessMsg("");
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-fm-primary w-100 py-3 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={resetOtpSent ? handleResetPassword : handleSendResetOtp}>
                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="resetEmail"
                      placeholder="Registered Email"
                      value={resetEmail}
                      disabled={resetOtpSent}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                    <label htmlFor="resetEmail">Registered Email</label>
                  </div>

                  {resetOtpSent && (
                    <>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          maxLength={6}
                          className="form-control text-center fw-bold fs-5"
                          id="resetOtp"
                          placeholder="6-digit OTP"
                          value={resetOtp}
                          onChange={(e) => setResetOtp(e.target.value)}
                        />
                        <label htmlFor="resetOtp">6-Digit OTP</label>
                      </div>

                      <div className="form-floating mb-3">
                        <input
                          type="password"
                          className="form-control"
                          id="newPassword"
                          placeholder="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <label htmlFor="newPassword">New Password (min 8 chars)</label>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="btn btn-fm-primary w-100 py-3 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        {resetOtpSent ? "Updating Password..." : "Sending OTP..."}
                      </>
                    ) : (
                      resetOtpSent ? "Reset Password" : "Send Reset OTP"
                    )}
                  </button>

                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-muted p-0 text-decoration-none"
                      onClick={() => {
                        setForgotMode(false);
                        setResetOtpSent(false);
                        setError("");
                        setSuccessMsg("");
                      }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-4">
                <small className="text-muted">
                  Don’t have an account?{" "}
                  <Link to="/register" className="fw-bold text-success text-decoration-none">
                    Create Free Account
                  </Link>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
