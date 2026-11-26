import React, { useState } from "react";
import axiosInstance from "./axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, ShieldCheck, Zap, Leaf, CheckCircle2 } from "lucide-react";

const Register = () => {
	const [fullName, SetFullName] = useState("");
	const [email, SetEmail] = useState("");
	const [password, SetPassword] = useState("");
	const [otp, SetOtp] = useState("");
	const [otpSent, SetOtpSent] = useState(false);
	const [info, SetInfo] = useState("");
	const [error, Seterror] = useState({});
	const [success, Setsuccess] = useState(false);
	const [loading, Setloading] = useState(false);

	const navigate = useNavigate();

	const handleSendOtp = async (e) => {
		e.preventDefault();
		Seterror({});
		SetInfo("");

		if (!fullName.trim() || !email.trim() || password.length < 8) {
			Seterror({
				full_name: !fullName.trim() ? "Full name is required." : "",
				email: !email.trim() ? "Email is required." : "",
				password: password.length < 8 ? "Password must be at least 8 characters." : "",
			});
			return;
		}

		Setloading(true);
		try {
			await axiosInstance.post("/otp/send/", {
				email,
				purpose: "register",
			});
			SetOtpSent(true);
			SetInfo(`We sent a 6-digit verification code to ${email}`);
		} catch (err) {
			Seterror(err.response?.data || { detail: "Failed to send OTP. Please try again." });
		} finally {
			Setloading(false);
		}
	};

	const handelRegistration = async (e) => {
		e.preventDefault();
		Setloading(true);
		Seterror({});

		const userData = {
			full_name: fullName,
			email,
			password,
			otp,
		};

		try {
			await axiosInstance.post("/register/", userData);
			Seterror({});
			Setsuccess(true);
			SetInfo("");
			setTimeout(() => navigate("/login"), 1500);
		} catch (err) {
			Seterror(err.response?.data || {});
		} finally {
			Setloading(false);
		}
	};

	return (
		<div className="min-vh-100 d-flex align-items-center justify-content-center py-4 px-3" style={{ background: "#f1f5f9" }}>
			<div className="container" style={{ maxWidth: "940px" }}>
				<div className="fm-card overflow-hidden shadow-lg border-0" style={{ borderRadius: "24px" }}>
					<div className="row g-0">
						{/* LEFT VISUAL SHOWCASE PANEL */}
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
									Farm-Fresh Groceries in 15 Minutes.
								</h2>
								<p className="small opacity-75 mb-4">
									Join thousands of shoppers getting organic produce, dairy, and daily essentials delivered fast.
								</p>
							</div>

							<div className="d-flex flex-column gap-3">
								<div className="p-3 rounded-4 d-flex align-items-center gap-3" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
									<Zap size={22} className="text-warning flex-shrink-0" />
									<div>
										<div className="fw-bold small">Lightning Fast Delivery</div>
										<div className="opacity-75" style={{ fontSize: "0.78rem" }}>Track your basket live to your door</div>
									</div>
								</div>
								<div className="p-3 rounded-4 d-flex align-items-center gap-3" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
									<Leaf size={22} className="text-light flex-shrink-0" />
									<div>
										<div className="fw-bold small">100% Farm Fresh</div>
										<div className="opacity-75" style={{ fontSize: "0.78rem" }}>Handpicked quality every morning</div>
									</div>
								</div>
								<div className="p-3 rounded-4 d-flex align-items-center gap-3" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
									<ShieldCheck size={22} className="text-info flex-shrink-0" />
									<div>
										<div className="fw-bold small">Email OTP Protected</div>
										<div className="opacity-75" style={{ fontSize: "0.78rem" }}>Verified accounts & secure checkout</div>
									</div>
								</div>
							</div>
						</div>

						{/* RIGHT FORM PANEL */}
						<div className="col-lg-7 bg-white p-4 p-md-5 d-flex flex-column justify-content-center">
							<div className="d-flex justify-content-between align-items-center mb-4">
								<div>
									<h3 className="fw-bold mb-1">Create Account</h3>
									<p className="text-muted small mb-0">
										{otpSent ? "Step 2 of 2: Enter Email OTP" : "Step 1 of 2: Quick 30-second signup"}
									</p>
								</div>
								<span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-semibold">
									{otpSent ? "Verify OTP" : "Free Signup"}
								</span>
							</div>

							{success && (
								<div className="alert alert-success d-flex align-items-center gap-2 py-2 small">
									<CheckCircle2 size={18} />
									<span>Account created & verified! Redirecting to login...</span>
								</div>
							)}

							{info && !success && (
								<div className="alert alert-info py-2 small">
									{info}
								</div>
							)}

							{error.detail && (
								<div className="alert alert-danger py-2 small">
									{error.detail}
								</div>
							)}

							<form onSubmit={otpSent ? handelRegistration : handleSendOtp}>
								<div className="form-floating mb-3">
									<input
										type="text"
										className="form-control"
										id="fullName"
										placeholder="Full Name"
										value={fullName}
										disabled={otpSent}
										onChange={(e) => SetFullName(e.target.value)}
									/>
									<label htmlFor="fullName">Full Name</label>
									{error.full_name && <small className="text-danger">{error.full_name}</small>}
								</div>

								<div className="form-floating mb-3">
									<input
										type="email"
										className="form-control"
										id="email"
										placeholder="Email"
										value={email}
										disabled={otpSent}
										onChange={(e) => SetEmail(e.target.value)}
									/>
									<label htmlFor="email">Email address</label>
									{error.email && <small className="text-danger">{error.email}</small>}
								</div>

								<div className="form-floating mb-3">
									<input
										type="password"
										className="form-control"
										id="password"
										placeholder="Password"
										value={password}
										disabled={otpSent}
										onChange={(e) => SetPassword(e.target.value)}
									/>
									<label htmlFor="password">Create Password (min 8 chars)</label>
									{error.password && <small className="text-danger">{error.password}</small>}
								</div>

								{otpSent && (
									<div className="form-floating mb-3">
										<input
											type="text"
											maxLength={6}
											className="form-control text-center fw-bold fs-5"
											id="otp"
											placeholder="6-digit OTP"
											value={otp}
											onChange={(e) => SetOtp(e.target.value)}
										/>
										<label htmlFor="otp">6-Digit Email OTP</label>
										{error.otp && <small className="text-danger">{error.otp}</small>}
									</div>
								)}

								<button
									type="submit"
									className="btn btn-fm-primary w-100 py-3 fw-semibold"
									disabled={loading}
								>
									{loading ? (
										<>
											<FontAwesomeIcon icon={faSpinner} spin className="me-2" />
											{otpSent ? "Verifying & Creating..." : "Sending OTP..."}
										</>
									) : (
										otpSent ? "Verify OTP & Create Account" : "Send Verification OTP"
									)}
								</button>

								{otpSent && !success && (
									<div className="d-flex justify-content-between mt-3">
										<button
											type="button"
											className="btn btn-link btn-sm text-success p-0 text-decoration-none fw-semibold"
											onClick={handleSendOtp}
											disabled={loading}
										>
											Resend OTP
										</button>
										<button
											type="button"
											className="btn btn-link btn-sm text-muted p-0 text-decoration-none"
											onClick={() => {
												SetOtpSent(false);
												SetOtp("");
												SetInfo("");
												Seterror({});
											}}
											disabled={loading}
										>
											Change Details
										</button>
									</div>
								)}
							</form>

							<div className="text-center mt-4">
								<small className="text-muted">
									Already have an account?{" "}
									<Link to="/login" className="fw-bold text-success text-decoration-none">
										Sign In
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

export default Register;
