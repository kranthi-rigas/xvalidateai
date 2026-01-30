import React, { useState, useEffect, useLayoutEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login, signup, fetchUserProfile } from "@/apiIntegration/auth.js";
import useToast from "@/hooks/useToast";
import { GOOGLE_OAUTH_CONFIG } from "@/data/oauth";
import MetaComponent from "@/components/common/MetaComponent";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    confirm_password: ""
  });
  const navigate = useNavigate();
  const show = useToast();

  const metadata = {
    title: mode === "login" ? "Login - XVALIDATEAI" : "Sign up - XVALIDATEAI",
    description: "XVALIDATEAI authentication page",
  };

  // Error mapper helper
  const getLoginErrorMessage = (err) => {
    const status = err?.status;
    if (status === 401) {
      return "The email or password you entered is incorrect. Please try again.";
    }
    if (status === 403) {
      return "Your account has been temporarily locked. Contact support.";
    }
    if (status >= 500) {
      return "We're having trouble signing you in right now. Please try again later.";
    }
    if (!status) {
      return "Unable to connect. Please check your internet connection.";
    }
    return "Login failed. Please try again.";
  };

  // Refresh helper
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // OAuth Configuration
  const generateState = () =>
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Google OAuth Handler
  const handleGoogleLogin = () => {
    setLoading(true);
    const state = generateState();
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.CLIENT_ID,
      redirect_uri: GOOGLE_OAUTH_CONFIG.REDIRECT_URI,
      response_type: GOOGLE_OAUTH_CONFIG.RESPONSE_TYPE,
      scope: GOOGLE_OAUTH_CONFIG.SCOPE,
      state,
      include_granted_scopes: "true",
      prompt: "select_account",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  // Handle OAuth Redirect
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const idToken = params.get("id_token");
    const state = params.get("state");

    if (accessToken && idToken) {
      const savedState = sessionStorage.getItem("oauth_state");
      if (state === savedState) {
        const userInfo = decodeJWT(idToken);
        localStorage.setItem("user_info", JSON.stringify(userInfo));
        navigate("/dashboard");
      } else {
        console.error("❌ Invalid OAuth state");
      }
    }
  }, [navigate]);

  // Decode JWT token
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Error decoding JWT:", e);
      return null;
    }
  };

  // Manual login/signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === "signup") {
        // Validate passwords match
        if (formData.password !== formData.confirm_password) {
          show("Passwords do not match", { type: "error", duration: 4000 });
          setLoading(false);
          return;
        }
        
        // Validate password strength
        if (formData.password.length < 8) {
          show("Password must be at least 8 characters long", { type: "error", duration: 4000 });
          setLoading(false);
          return;
        }
        
        // Sign up
        const signupData = {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name
        };
        
        await signup(signupData);
        show("Account created successfully! Please check your email to verify your account.", { type: "success", duration: 6000 });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/auth?mode=login");
        }, 2000);
      } else {
        // Login
        const res = await login({ email: formData.email, password: formData.password });
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);
        const userData = await fetchUserProfile(res.access_token);
        localStorage.setItem("user_info", JSON.stringify(userData));
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(`❌ ${mode === "signup" ? "Signup" : "Login"} failed:`, err);
      const message = mode === "signup"
        ? err.message || "Sign up failed. Please try again."
        : getLoginErrorMessage(err);
      show(message, { type: "error", duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };


  return (
    <>
      <MetaComponent meta={metadata} />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <style>{`
        :root {
          --background: #FAFAFA;
          --foreground: #0f172a;
          --card: #ffffff;
          --card-foreground: #0f172a;
          --primary: #0F3053;
          --primary-foreground: #ffffff;
          --secondary: #58BFCE;
          --secondary-foreground: #0F172A;
          --muted: #FAFAFA;
          --muted-foreground: #64748B;
          --accent: #64748B;
          --accent-foreground: #ffffff;
          --destructive: #ef4444;
          --destructive-foreground: #ffffff;
          --border: #E2E8F0;
          --input: #FFFFFF;
          --ring: #58BFCE;
          --font-sans: Inter, sans-serif;
          --radius: 10px;
        }
        
        ::-webkit-scrollbar { display: none; }
        
        body {
          font-family: var(--font-sans);
          margin: 0;
          padding: 0;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #0F3053 0%, #58BFCE 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 3s ease infinite;
        }
        
        .scanline-container {
          position: relative;
          overflow: hidden;
        }
        
        .scanline {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #58BFCE, transparent);
          animation: scanline 3s linear infinite;
        }
        
        .login-card {
          position: relative;
          overflow: hidden;
        }
        
        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(88, 191, 206, 0.1), transparent);
          transition: left 0.5s;
        }
        
        .login-card:hover::before {
          left: 100%;
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--background)', fontFamily: 'var(--font-sans)' }}>
        {/* Header */}
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--secondary)', fontSize: '1.25rem' }}></i>
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>XVALIDATE<span style={{ color: 'var(--secondary)' }}>AI</span></span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ paddingTop: '5rem' }}>
          <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '3rem 0' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'white' }}></div>
            
            {/* Background Elements */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              {/* Grid Pattern */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(15, 48, 83, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 48, 83, 0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
              
              {/* Corner Accents */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '16rem', height: '16rem', borderLeft: '1px solid rgba(15, 48, 83, 0.1)', borderTop: '1px solid rgba(15, 48, 83, 0.1)' }}></div>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '16rem', height: '16rem', borderRight: '1px solid rgba(15, 48, 83, 0.1)', borderTop: '1px solid rgba(15, 48, 83, 0.1)' }}></div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '16rem', height: '16rem', borderLeft: '1px solid rgba(15, 48, 83, 0.1)', borderBottom: '1px solid rgba(15, 48, 83, 0.1)' }}></div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16rem', height: '16rem', borderRight: '1px solid rgba(15, 48, 83, 0.1)', borderBottom: '1px solid rgba(15, 48, 83, 0.1)' }}></div>
              
              {/* Floating Icons - Hidden on mobile */}
              <div className="float-animation" style={{ position: 'absolute', top: '8rem', left: '8rem', color: 'var(--primary)', opacity: 0.08, fontSize: '4.5rem', display: 'none' }}>
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div className="float-animation" style={{ position: 'absolute', top: '12rem', right: '10rem', color: 'var(--secondary)', opacity: 0.08, fontSize: '3.75rem', animationDelay: '1s', display: 'none' }}>
                <i className="fa-solid fa-lock"></i>
              </div>
              <div className="float-animation" style={{ position: 'absolute', bottom: '10rem', left: '12rem', color: 'var(--primary)', opacity: 0.08, fontSize: '3rem', animationDelay: '2s', display: 'none' }}>
                <i className="fa-solid fa-file-shield"></i>
              </div>
              <div className="float-animation" style={{ position: 'absolute', bottom: '8rem', right: '8rem', color: 'var(--secondary)', opacity: 0.08, fontSize: '3.75rem', animationDelay: '1.5s', display: 'none' }}>
                <i className="fa-solid fa-user-shield"></i>
              </div>
              
              {/* Gradient Orbs */}
              <div style={{ position: 'absolute', top: '5rem', left: '5rem', width: '24rem', height: '24rem', background: 'radial-gradient(circle, rgba(88, 191, 206, 0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
              <div className="float-animation" style={{ position: 'absolute', bottom: '5rem', right: '5rem', width: '20rem', height: '20rem', background: 'radial-gradient(circle, rgba(15, 48, 83, 0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', animationDelay: '1s' }}></div>
              
              {/* Floating Compliance Cards */}
              {/* GDPR Compliance Card - Top Right */}
              <div className="scanline-container float-animation compliance-card" style={{ position: 'absolute', top: '15%', right: '15%', width: '13rem', animationDelay: '0.5s' }}>
                <div className="scanline"></div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-shield-check" style={{ color: 'var(--secondary)', fontSize: '1.25rem' }}></i>
                      <span style={{ fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: '600' }}>GDPR</span>
                    </div>
                    <div className="pulse-glow" style={{ width: '0.5rem', height: '0.5rem', background: '#10b981', borderRadius: '50%' }}></div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: '1.4' }}>
                    Full compliance with EU data protection regulations
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: '#10b981', fontWeight: '500' }}>
                    <i className="fa-solid fa-check-circle" style={{ marginRight: '0.25rem' }}></i>
                    <span>Certified</span>
                  </div>
                </div>
              </div>
              
              {/* CCPA Compliance Card - Bottom Left */}
              <div className="scanline-container float-animation compliance-card" style={{ position: 'absolute', bottom: '15%', left: '15%', width: '13rem', animationDelay: '1.5s' }}>
                <div className="scanline" style={{ animationDelay: '1s' }}></div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-shield-check" style={{ color: 'var(--secondary)', fontSize: '1.25rem' }}></i>
                      <span style={{ fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: '600' }}>CCPA</span>
                    </div>
                    <div className="pulse-glow" style={{ width: '0.5rem', height: '0.5rem', background: '#10b981', borderRadius: '50%' }}></div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: '1.4' }}>
                    California Consumer Privacy Act compliant
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: '#10b981', fontWeight: '500' }}>
                    <i className="fa-solid fa-check-circle" style={{ marginRight: '0.25rem' }}></i>
                    <span>Verified</span>
                  </div>
                </div>
              </div>
              
              {/* Compliance Score Card - Top Left (Optional) */}
              <div className="scanline-container float-animation compliance-card" style={{ position: 'absolute', top: '15%', left: '15%', width: '12rem', animationDelay: '0.8s' }}>
                <div className="scanline"></div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>Compliance Score</span>
                    <div className="pulse-glow" style={{ width: '0.5rem', height: '0.5rem', background: 'var(--secondary)', borderRadius: '50%' }}></div>
                  </div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--primary)' }}>98.5%</div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                    <i className="fa-solid fa-arrow-up" style={{ marginRight: '0.25rem' }}></i>
                    <span>+2.3% this week</span>
                  </div>
                </div>
              </div>
              
              {/* Risk Alerts Card - Bottom Right (Optional) */}
              <div className="scanline-container float-animation compliance-card" style={{ position: 'absolute', bottom: '15%', right: '15%', width: '12rem', animationDelay: '1.2s' }}>
                <div className="scanline" style={{ animationDelay: '1s' }}></div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>Risk Alerts</span>
                    <div className="pulse-glow" style={{ width: '0.5rem', height: '0.5rem', background: 'var(--destructive)', borderRadius: '50%' }}></div>
                  </div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--foreground)' }}>3</div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                      <div style={{ width: '0.5rem', height: '0.5rem', background: 'var(--destructive)', borderRadius: '50%', marginRight: '0.5rem' }}></div>
                      <span style={{ color: 'var(--muted-foreground)' }}>Critical: 1</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                      <div style={{ width: '0.5rem', height: '0.5rem', background: 'var(--accent)', borderRadius: '50%', marginRight: '0.5rem' }}></div>
                      <span style={{ color: 'var(--muted-foreground)' }}>Medium: 2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <div style={{ position: 'relative', zIndex: 10, maxWidth: '500px', width: '100%', padding: '0 1rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  <span className="gradient-text">{mode === "signup" ? "Create Account" : "Welcome Back"}</span>
                </h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '1.125rem' }}>
                  {mode === "signup" ? "Sign up to start your compliance journey" : "Sign in to access your compliance dashboard"}
                </p>
              </div>

              <div className="login-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {mode === "signup" && (
                    <>
                      <div>
                        <label htmlFor="first_name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.5rem' }}>First Name</label>
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <i className="fa-solid fa-user" style={{ color: 'var(--muted-foreground)' }}></i>
                          </div>
                          <input
                            type="text"
                            id="first_name"
                            name="first_name"
                            placeholder="John"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', outline: 'none', transition: 'all 0.3s' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--ring)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="last_name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Last Name</label>
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <i className="fa-solid fa-user" style={{ color: 'var(--muted-foreground)' }}></i>
                          </div>
                          <input
                            type="text"
                            id="last_name"
                            name="last_name"
                            placeholder="Doe"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', outline: 'none', transition: 'all 0.3s' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--ring)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <i className="fa-solid fa-envelope" style={{ color: 'var(--muted-foreground)' }}></i>
                      </div>
                      <input 
                        type="email"
                        id="email"
                        name="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', outline: 'none', transition: 'all 0.3s' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--ring)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <i className="fa-solid fa-lock" style={{ color: 'var(--muted-foreground)' }}></i>
                      </div>
                      <input 
                        type="password"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', outline: 'none', transition: 'all 0.3s' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--ring)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  </div>

                  {mode === "signup" && (
                    <div>
                      <label htmlFor="confirm_password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Confirm Password</label>
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                          <i className="fa-solid fa-lock" style={{ color: 'var(--muted-foreground)' }}></i>
                        </div>
                        <input
                          type="password"
                          id="confirm_password"
                          name="confirm_password"
                          placeholder="••••••••"
                          value={formData.confirm_password}
                          onChange={handleChange}
                          required
                          style={{ width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', outline: 'none', transition: 'all 0.3s' }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--ring)'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </div>
                  )}

                  {mode === "login" && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" id="remember" name="remember" style={{ width: '1rem', height: '1rem', color: 'var(--primary)', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '4px' }} />
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Remember me</span>
                    </label>
                      <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--secondary)', textDecoration: 'none', transition: 'color 0.3s' }}>Forgot password?</Link>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', background: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: '600', padding: '0.75rem', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s', transform: 'scale(1)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', opacity: loading ? 0.7 : 1 }}
                    onMouseEnter={(e) => !loading && (e.target.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => !loading && (e.target.style.transform = 'scale(1)')}
                  >
                    {loading
                      ? (mode === "signup" ? 'Creating Account...' : 'Signing In...')
                      : (mode === "signup" ? 'Create Account' : 'Sign In')
                    }
                    {!loading && <i className="fa-solid fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i>}
                  </button>

                  <div style={{ position: 'relative', margin: '1.5rem 0' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '100%', borderTop: '1px solid var(--border)' }}></div>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '0.875rem' }}>
                      <span style={{ padding: '0 1rem', background: 'var(--card)', color: 'var(--muted-foreground)' }}>Or continue with</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button 
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}
                      onMouseEnter={(e) => !loading && (e.target.style.background = 'var(--muted)')}
                      onMouseLeave={(e) => !loading && (e.target.style.background = 'var(--input)')}
                    >
                      <i className="fa-brands fa-google" style={{ color: 'var(--destructive)', marginRight: '0.5rem' }}></i>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)' }}>Google</span>
                    </button>
                    <button 
                      type="button"
                      disabled={loading}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}
                      onMouseEnter={(e) => !loading && (e.target.style.background = 'var(--muted)')}
                      onMouseLeave={(e) => !loading && (e.target.style.background = 'var(--input)')}
                    >
                      <i className="fa-brands fa-microsoft" style={{ color: 'var(--primary)', marginRight: '0.5rem' }}></i>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)' }}>Microsoft</span>
                    </button>
                  </div>

                  <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
                      {mode === "signup" ? (
                        <>
                          Already have an account?
                          <Link to="/auth?mode=login" style={{ color: 'var(--secondary)', fontWeight: '500', textDecoration: 'none', marginLeft: '0.25rem', transition: 'color 0.3s' }}>Sign in</Link>
                        </>
                      ) : (
                        <>
                          Don't have an account?
                          <Link to="/auth?mode=signup" style={{ color: 'var(--secondary)', fontWeight: '500', textDecoration: 'none', marginLeft: '0.25rem', transition: 'color 0.3s' }}>Sign up for free</Link>
                        </>
                      )}
                    </p>
                  </div>
                </form>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  <i className="fa-solid fa-shield-check" style={{ color: 'var(--secondary)', marginRight: '0.5rem' }}></i>
                  <span>SOC 2 Certified</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  <i className="fa-solid fa-lock" style={{ color: 'var(--secondary)', marginRight: '0.5rem' }}></i>
                  <span>256-bit Encryption</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  <i className="fa-solid fa-check-double" style={{ color: 'var(--secondary)', marginRight: '0.5rem' }}></i>
                  <span>GDPR Compliant</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', padding: '1.5rem 0' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: 'var(--secondary)' }}></i>
                </div>
                <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--primary)' }}>XVALIDATE<span style={{ color: 'var(--secondary)' }}>AI</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s' }}>Privacy Policy</a>
                <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s' }}>Terms of Service</a>
                <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s' }}>Support</a>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                © 2024 XVALIDATEAI. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        /* Hide compliance cards on mobile and small tablets */
        @media (max-width: 1023px) {
          .compliance-card {
            display: none !important;
          }
        }
        
        /* Show compliance cards on desktop */
        @media (min-width: 1024px) {
          .compliance-card {
            display: block !important;
          }
          .float-animation[style*="display: none"] {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}

// Made with Bob
