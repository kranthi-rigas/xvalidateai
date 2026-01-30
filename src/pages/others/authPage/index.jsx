import React, { useState, useEffect, useLayoutEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login, fetchUserProfile } from "@/apiIntegration/auth.js";
import useToast from "@/hooks/useToast";
import { GOOGLE_OAUTH_CONFIG } from "@/data/oauth";
import MetaComponent from "@/components/common/MetaComponent";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const show = useToast();

  const metadata = {
    title: mode === "login" ? "Login || XVALIDATEAI" : "Sign up || XVALIDATEAI",
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

  // Manual login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(formData);
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      const userData = await fetchUserProfile(res.access_token);
      localStorage.setItem("user_info", JSON.stringify(userData));
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Login failed:", err);
      const message = getLoginErrorMessage(err);
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

  // Only show login for now
  if (mode !== "login") {
    return null;
  }

  return (
    <>
      <MetaComponent meta={metadata} />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      
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
          --muted-foreground: #0f172a;
          --accent: #64748B;
          --accent-foreground: #ffffff;
          --destructive: #ef4444;
          --destructive-foreground: #ffffff;
          --border: #EEEEEE;
          --input: #FFFFFF;
          --ring: #94A3B8;
          --font-sans: Inter, sans-serif;
          --radius: 10px;
          --shadow: -2px 4px 12px 4px rgba(51,51,51,0.05);
        }
        
        body {
          font-family: var(--font-sans);
          background: linear-gradient(135deg, var(--background) 0%, var(--muted) 50%, var(--background) 100%);
          margin: 0;
          padding: 0;
        }
        
        .glassmorphism {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #0F3053, #58BFCE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .floating-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        .floating-animation:nth-child(2) {
          animation-delay: -2s;
        }
        
        .floating-animation:nth-child(3) {
          animation-delay: -4s;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(88, 191, 206, 0.3); }
          50% { box-shadow: 0 0 40px rgba(88, 191, 206, 0.6); }
        }
        
        .scanline {
          position: relative;
          overflow: hidden;
        }
        
        .scanline::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #58BFCE, transparent);
          animation: scanline 3s ease-in-out infinite;
        }
        
        @keyframes scanline {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, var(--background), var(--muted), var(--background))' }}>
        {/* Header */}
        <header className="glassmorphism" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-shield-check" style={{ color: 'var(--primary-foreground)', fontSize: '1.125rem' }}></i>
                </div>
                <span className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>XVALIDATEAI</span>
              </div>
              <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <a href="#" style={{ color: 'var(--muted-foreground)', textDecoration: 'none', transition: 'color 0.3s' }}>Platform</a>
                <a href="#" style={{ color: 'var(--muted-foreground)', textDecoration: 'none', transition: 'color 0.3s' }}>Solutions</a>
                <a href="#" style={{ color: 'var(--muted-foreground)', textDecoration: 'none', transition: 'color 0.3s' }}>Resources</a>
                <a href="#" style={{ color: 'var(--muted-foreground)', textDecoration: 'none', transition: 'color 0.3s' }}>Support</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ paddingTop: '5rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          
          {/* Background Data Cards */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Floating Cards Left Side */}
            <div className="floating-animation" style={{ position: 'absolute', left: '3rem', top: '8rem' }}>
              <div className="scanline" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', width: '16rem', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)', margin: 0 }}>Compliance Score</h3>
                  <i className="fa-solid fa-chart-line" style={{ color: 'var(--secondary)' }}></i>
                </div>
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>98.7%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>+2.3% from last month</div>
                <div style={{ marginTop: '1rem', height: '0.5rem', background: 'var(--muted)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div className="pulse-glow" style={{ width: '98.7%', height: '100%', background: 'var(--secondary)', borderRadius: '9999px' }}></div>
                </div>
              </div>
            </div>

            <div className="floating-animation" style={{ position: 'absolute', left: '5rem', bottom: '8rem' }}>
              <div className="scanline" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', width: '18rem', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)', margin: 0 }}>Risk Alerts</h3>
                  <i className="fa-solid fa-exclamation-triangle" style={{ color: 'var(--accent)' }}></i>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>High Risk</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--destructive)' }}>2</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Medium Risk</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--accent)' }}>7</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Low Risk</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--secondary)' }}>23</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards Right Side */}
            <div className="floating-animation" style={{ position: 'absolute', right: '3rem', top: '10rem' }}>
              <div className="scanline" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', width: '16rem', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)', margin: 0 }}>AI Analysis</h3>
                  <i className="fa-solid fa-brain" style={{ color: 'var(--primary)' }}></i>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>1,247</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Documents processed today</div>
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="pulse-glow" style={{ width: '0.5rem', height: '0.5rem', background: 'var(--secondary)', borderRadius: '9999px' }}></div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Processing...</span>
                </div>
              </div>
            </div>

            <div className="floating-animation" style={{ position: 'absolute', right: '5rem', bottom: '10rem' }}>
              <div className="scanline" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', width: '18rem', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)', margin: 0 }}>Regulatory Updates</h3>
                  <i className="fa-solid fa-gavel" style={{ color: 'var(--accent)' }}></i>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>GDPR Amendment 2024</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Effective March 15, 2024</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--foreground)', marginTop: '0.75rem' }}>SOX Compliance Update</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Review required by Q2</div>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form Container */}
          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '28rem', padding: '0 1rem' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '2rem', backdropFilter: 'blur(8px)' }}>
              
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div className="pulse-glow" style={{ width: '4rem', height: '4rem', background: 'var(--primary)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <i className="fa-solid fa-shield-check" style={{ color: 'var(--primary-foreground)', fontSize: '1.5rem' }}></i>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome Back</h1>
                <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Secure access to your compliance dashboard</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <i className="fa-solid fa-envelope" style={{ color: 'var(--muted-foreground)' }}></i>
                    </div>
                    <input 
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', outline: 'none', transition: 'all 0.3s' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--ring)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <i className="fa-solid fa-lock" style={{ color: 'var(--muted-foreground)' }}></i>
                    </div>
                    <input 
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', outline: 'none', transition: 'all 0.3s' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--ring)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '1rem', height: '1rem', color: 'var(--primary)', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '4px' }} />
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Remember me</span>
                  </label>
                  <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none', transition: 'color 0.3s' }}>Forgot password?</Link>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', background: 'var(--primary)', color: 'var(--primary-foreground)', padding: '0.75rem 1rem', borderRadius: '12px', fontWeight: '500', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s', transform: loading ? 'scale(1)' : 'scale(1)', opacity: loading ? 0.7 : 1 }}
                  onMouseEnter={(e) => !loading && (e.target.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => !loading && (e.target.style.transform = 'scale(1)')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-sign-in-alt" style={{ marginRight: '0.5rem' }}></i>
                        Sign In Securely
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Additional Options */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>Or continue with</p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      style={{ flex: 1, background: 'var(--muted)', color: 'var(--muted-foreground)', padding: '0.5rem 1rem', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}
                      onMouseEnter={(e) => !loading && (e.target.style.background = 'var(--accent)', e.target.style.color = 'var(--accent-foreground)')}
                      onMouseLeave={(e) => !loading && (e.target.style.background = 'var(--muted)', e.target.style.color = 'var(--muted-foreground)')}
                    >
                      <i className="fa-brands fa-google" style={{ marginRight: '0.5rem' }}></i>
                      Google
                    </button>
                    <button 
                      type="button"
                      disabled={loading}
                      style={{ flex: 1, background: 'var(--muted)', color: 'var(--muted-foreground)', padding: '0.5rem 1rem', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}
                      onMouseEnter={(e) => !loading && (e.target.style.background = 'var(--accent)', e.target.style.color = 'var(--accent-foreground)')}
                      onMouseLeave={(e) => !loading && (e.target.style.background = 'var(--muted)', e.target.style.color = 'var(--muted-foreground)')}
                    >
                      <i className="fa-brands fa-microsoft" style={{ marginRight: '0.5rem' }}></i>
                      SSO
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
                  Don't have an account? 
                  <Link to="/auth?mode=signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500', marginLeft: '0.25rem', transition: 'color 0.3s' }}>Request access</Link>
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="glassmorphism" style={{ borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>© 2024 XVALIDATEAI. All rights reserved.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <a href="#" style={{ color: 'var(--muted-foreground)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.3s' }}>Privacy</a>
                  <a href="#" style={{ color: 'var(--muted-foreground)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.3s' }}>Terms</a>
                  <a href="#" style={{ color: 'var(--muted-foreground)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.3s' }}>Security</a>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="pulse-glow" style={{ width: '0.5rem', height: '0.5rem', background: 'var(--secondary)', borderRadius: '9999px' }}></div>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>System Status: Operational</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// Made with Bob
